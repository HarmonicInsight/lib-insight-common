import { Hono } from 'hono';
import { adminAuthMiddleware } from '../../middleware/tenant';
import ExcelJS from 'exceljs';

export const adminTemplateDesignerRoutes = new Hono();

adminTemplateDesignerRoutes.use('*', adminAuthMiddleware);

// ---------------------------------------------------------------------------
// POST /admin/template-designer/analyze — Excel アップロード → Named Ranges 抽出
// ---------------------------------------------------------------------------
/**
 * Stravis / Oracle Smart View 型ワークフロー Step 1-2:
 *
 * コンサルが管理コンソールで Excel テンプレートをアップロードすると、
 * サーバーが Named Ranges を自動検出し、マッピング候補を返す。
 *
 * Response:
 * {
 *   fileName: "月次報告テンプレート.xlsx",
 *   sheetNames: ["報告", "集計", ...],
 *   namedRanges: [
 *     { name: "revenue", ref: "報告!B5", sheetName: "報告", cellAddress: "B5",
 *       currentValue: null, cellFormat: "number", suggestedType: "currency",
 *       suggestedLabel: "revenue", suggestedLabelJa: "売上" },
 *     ...
 *   ],
 *   dataValidations: [
 *     { ref: "報告!C10", type: "list", formula: "営業,開発,管理", namedRange: "department" },
 *     ...
 *   ]
 * }
 */
adminTemplateDesignerRoutes.post('/analyze', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return c.json(
      { success: false, error: { code: 'VALIDATION', message: 'Excel file is required' } },
      400,
    );
  }

  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
    return c.json(
      { success: false, error: { code: 'VALIDATION', message: 'Only .xlsx/.xls files are supported' } },
      400,
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(buffer));

    // --- Extract sheet names ---
    const sheetNames = workbook.worksheets.map((ws) => ws.name);

    // --- Extract Named Ranges (Defined Names) ---
    // ExcelJS stores defined names at workbook level
    const namedRanges: Array<{
      name: string;
      ref: string;
      sheetName: string;
      cellAddress: string;
      currentValue: unknown;
      cellFormat: string | null;
      suggestedType: string;
      suggestedLabel: string;
      suggestedLabelJa: string;
    }> = [];

    for (const definedName of (workbook as any).definedNames?.model ?? []) {
      // definedName: { name, ranges: [{ sheetName, address }] }
      const name = definedName.name;
      if (name.startsWith('_') || name.startsWith('Print_')) continue; // Skip internal names

      for (const range of definedName.ranges ?? []) {
        const sheetName = range.sheetName ?? '';
        const address = range.address ?? '';
        const ref = sheetName ? `${sheetName}!${address}` : address;

        // Try to read current value and format
        let currentValue: unknown = null;
        let cellFormat: string | null = null;

        const ws = workbook.getWorksheet(sheetName);
        if (ws) {
          try {
            const cell = ws.getCell(address);
            currentValue = cell.value;
            cellFormat = cell.numFmt ?? null;
          } catch {
            // Cell may be a range, not a single cell
          }
        }

        // Guess type from format and name
        const suggestedType = guessFieldType(name, cellFormat, currentValue);
        const suggestedLabelJa = guessJapaneseLabel(name);

        namedRanges.push({
          name,
          ref,
          sheetName,
          cellAddress: address,
          currentValue,
          cellFormat,
          suggestedType,
          suggestedLabel: name,
          suggestedLabelJa,
        });
      }
    }

    // --- Extract Data Validations (dropdown lists etc.) ---
    const dataValidations: Array<{
      ref: string;
      type: string;
      formula: string;
      namedRange: string | null;
    }> = [];

    for (const ws of workbook.worksheets) {
      // ExcelJS stores data validations per cell/range
      // Access via worksheet model
      const model = (ws as any).model;
      if (model?.dataValidations) {
        for (const [ref, dv] of Object.entries(model.dataValidations) as [string, any][]) {
          if (dv.type === 'list' || dv.type === 'whole' || dv.type === 'decimal') {
            // Find matching named range for this cell
            const fullRef = `${ws.name}!${ref}`;
            const matchingNr = namedRanges.find((nr) => nr.ref === fullRef);

            dataValidations.push({
              ref: fullRef,
              type: dv.type,
              formula: dv.formulae?.[0] ?? '',
              namedRange: matchingNr?.name ?? null,
            });
          }
        }
      }
    }

    return c.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        sheetNames,
        namedRanges,
        namedRangeCount: namedRanges.length,
        dataValidations,
      },
    });
  } catch (e) {
    return c.json(
      { success: false, error: { code: 'PARSE_ERROR', message: `Failed to parse Excel: ${e}` } },
      500,
    );
  }
});

// ---------------------------------------------------------------------------
// POST /admin/template-designer/save — テンプレート保存 (draft)
// ---------------------------------------------------------------------------
/**
 * Step 3-4: マッピング完了後、テンプレートを保存。
 *
 * - Excel ファイルを管理用 Storage にアップロード
 * - schema_json / mapping_json / validation_rules を生成
 * - dc_templates に draft として保存（まだ配布しない）
 */
adminTemplateDesignerRoutes.post('/save', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');
  const metadataStr = formData.get('metadata');

  if (!file || !(file instanceof File) || !metadataStr) {
    return c.json(
      { success: false, error: { code: 'VALIDATION', message: 'file and metadata are required' } },
      400,
    );
  }

  const metadata = JSON.parse(metadataStr as string) as {
    name: string;
    nameJa: string;
    category: string;
    description?: string;
    descriptionJa?: string;
    schedule: string;
    deadline: string | null;
    tabColor: string;
    schemaJson: Record<string, unknown>;
    mappingJson: Record<string, unknown>;
    validationRules: unknown[];
    // Which tenant to save to (admin picks a "master" tenant for template authoring)
    targetTenantId: string;
  };

  // TODO: Get the target tenant's Supabase from registry
  // For now, return the saved template shape
  return c.json({
    success: true,
    data: {
      status: 'draft',
      name: metadata.name,
      nameJa: metadata.nameJa,
      schemaFieldCount: (metadata.schemaJson as any)?.fields?.length ?? 0,
      message: 'Template saved as draft. Use /admin/templates/distribute to publish to tenants.',
    },
  }, 201);
});

// ---------------------------------------------------------------------------
// POST /admin/template-designer/preview-schema — マッピングからスキーマプレビュー
// ---------------------------------------------------------------------------
/**
 * マッピング定義のプレビュー（保存前の確認用）。
 * フロントエンドで定義した mapping を受け取り、
 * schema_json と mapping_json の最終形を返す。
 */
adminTemplateDesignerRoutes.post('/preview-schema', async (c) => {
  const body = await c.req.json() as {
    fields: Array<{
      namedRange: string;
      key: string;
      label: string;
      labelJa: string;
      type: string;
      required: boolean;
      aiTransferHints?: string[];
      decimalPlaces?: number;
      currencyCode?: string;
      dateFormat?: string;
      enumValues?: Array<{ value: string; label: string; labelJa: string }>;
    }>;
    logicalTableName: string;
    logicalTableNameJa: string;
  };

  // Generate schema_json (TemplateDataSchema)
  const schemaJson = {
    version: 1,
    logicalTableName: body.logicalTableName,
    logicalTableNameJa: body.logicalTableNameJa,
    fields: body.fields.map((f) => ({
      key: f.key,
      label: f.label,
      labelJa: f.labelJa,
      type: f.type,
      required: f.required,
      namedRange: f.namedRange,
      aiTransferHints: f.aiTransferHints ?? [],
      decimalPlaces: f.decimalPlaces,
      currencyCode: f.currencyCode,
      dateFormat: f.dateFormat,
      enumValues: f.enumValues,
    })),
  };

  // Generate mapping_json (TemplateMappingDefinition)
  const mappingJson = {
    version: 1,
    targetTable: 'dc_collected_data',
    fields: body.fields.map((f) => ({
      namedRange: f.namedRange,
      dbColumn: f.key,
      labelJa: f.labelJa,
      label: f.label,
      type: f.type,
      required: f.required,
      aiTransferHints: f.aiTransferHints ?? [],
    })),
    autoFields: [
      { dbColumn: 'submitter_email', source: 'submitter_email' },
      { dbColumn: 'submitted_at', source: 'submitted_at' },
      { dbColumn: 'template_id', source: 'template_id' },
      { dbColumn: 'template_version', source: 'template_version' },
    ],
  };

  return c.json({ success: true, data: { schemaJson, mappingJson } });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Named Range 名とセルフォーマットからフィールド型を推定 */
function guessFieldType(name: string, format: string | null, value: unknown): string {
  const n = name.toLowerCase();

  // Currency keywords
  if (n.includes('amount') || n.includes('price') || n.includes('cost') || n.includes('revenue')
    || n.includes('売上') || n.includes('金額') || n.includes('費用') || n.includes('経費')) {
    return 'currency';
  }

  // Percentage
  if (n.includes('rate') || n.includes('ratio') || n.includes('percent')
    || n.includes('率') || n.includes('割合')) {
    return 'percentage';
  }

  // Date
  if (n.includes('date') || n.includes('日付') || n.includes('期日') || n.includes('年月')) {
    return 'date';
  }

  // Boolean
  if (n.includes('flag') || n.includes('is_') || n.includes('has_')
    || n.includes('フラグ') || n.includes('有無')) {
    return 'boolean';
  }

  // Check cell format
  if (format) {
    if (format.includes('¥') || format.includes('$') || format.includes('#,##0')) return 'currency';
    if (format.includes('%')) return 'percentage';
    if (format.includes('yy') || format.includes('mm') || format.includes('dd')) return 'date';
  }

  // Check value type
  if (typeof value === 'number') return 'number';

  return 'string';
}

/** Named Range 名から日本語ラベルを推定 */
function guessJapaneseLabel(name: string): string {
  const knownMappings: Record<string, string> = {
    revenue: '売上',
    sales: '売上',
    cost: '原価',
    expense: '経費',
    profit: '利益',
    department: '部門',
    dept: '部門',
    date: '日付',
    period: '期間',
    fiscal_year: '会計年度',
    fiscal_month: '会計月',
    employee_count: '従業員数',
    headcount: '人数',
    budget: '予算',
    actual: '実績',
    forecast: '見込',
    variance: '差異',
    notes: '備考',
    comment: 'コメント',
    name: '名前',
    total: '合計',
    subtotal: '小計',
    tax: '税金',
    quantity: '数量',
    unit_price: '単価',
    amount: '金額',
  };

  const lower = name.toLowerCase();

  // Direct match
  if (knownMappings[lower]) return knownMappings[lower];

  // Partial match
  for (const [key, label] of Object.entries(knownMappings)) {
    if (lower.includes(key)) return label;
  }

  // If already Japanese, return as-is
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(name)) {
    return name;
  }

  // snake_case → Title Case
  return name.replace(/_/g, ' ');
}
