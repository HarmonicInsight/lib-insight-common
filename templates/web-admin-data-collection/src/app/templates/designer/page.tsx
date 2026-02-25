'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NamedRangeInfo {
  name: string;
  ref: string;
  sheetName: string;
  cellAddress: string;
  currentValue: unknown;
  cellFormat: string | null;
  suggestedType: string;
  suggestedLabel: string;
  suggestedLabelJa: string;
}

interface FieldMapping {
  namedRange: string;
  key: string;
  label: string;
  labelJa: string;
  type: string;
  required: boolean;
  aiTransferHints: string[];
  decimalPlaces?: number;
  currencyCode?: string;
  dateFormat?: string;
  enumValues?: Array<{ value: string; label: string; labelJa: string }>;
}

interface ValidationRuleInput {
  id: string;
  targetField: string;
  type: string;
  params: Record<string, unknown>;
  messageJa: string;
  message: string;
  severity: 'error' | 'warning';
}

type WizardStep = 'upload' | 'mapping' | 'validation' | 'review';

const FIELD_TYPES = [
  { value: 'string', label: 'テキスト' },
  { value: 'number', label: '数値' },
  { value: 'integer', label: '整数' },
  { value: 'currency', label: '金額' },
  { value: 'percentage', label: '%' },
  { value: 'date', label: '日付' },
  { value: 'boolean', label: 'はい/いいえ' },
];

const API_BASE = process.env.NEXT_PUBLIC_DC_API_URL ?? 'http://localhost:9500';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TemplateDesignerPage() {
  const [step, setStep] = useState<WizardStep>('upload');

  // Step 1: Upload
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [namedRanges, setNamedRanges] = useState<NamedRangeInfo[]>([]);

  // Step 2: Mapping
  const [templateName, setTemplateName] = useState('');
  const [templateNameJa, setTemplateNameJa] = useState('');
  const [category, setCategory] = useState('');
  const [schedule, setSchedule] = useState('once');
  const [logicalTableName, setLogicalTableName] = useState('');
  const [logicalTableNameJa, setLogicalTableNameJa] = useState('');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  // Step 3: Validation
  const [validationRules, setValidationRules] = useState<ValidationRuleInput[]>([]);

  // Step 4: Review
  const [schemaPreview, setSchemaPreview] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  // -------------------------------------------------------------------------
  // Step 1: Upload & Analyze
  // -------------------------------------------------------------------------

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/admin/template-designer/analyze`, {
        method: 'POST',
        body: formData,
        // TODO: Add auth header
      });
      const json = await res.json();

      if (json.success) {
        const data = json.data;
        setFileName(data.fileName);
        setSheetNames(data.sheetNames);
        setNamedRanges(data.namedRanges);

        // Pre-fill mappings from analysis
        setFieldMappings(
          data.namedRanges.map((nr: NamedRangeInfo) => ({
            namedRange: nr.name,
            key: nr.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            label: nr.suggestedLabel,
            labelJa: nr.suggestedLabelJa,
            type: nr.suggestedType,
            required: false,
            aiTransferHints: [nr.suggestedLabelJa, nr.suggestedLabel].filter(Boolean),
          })),
        );

        // Auto-set logical table name from file name
        const baseName = data.fileName.replace(/\.xlsx?$/i, '');
        setLogicalTableNameJa(baseName);
        setLogicalTableName(baseName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase());
        setTemplateNameJa(baseName);
        setTemplateName(baseName);

        setStep('mapping');
      } else {
        alert(`解析エラー: ${json.error?.message}`);
      }
    } catch (e) {
      alert(`通信エラー: ${e}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // -------------------------------------------------------------------------
  // Step 2→3: Mapping → Validation
  // -------------------------------------------------------------------------

  const handleMappingDone = () => {
    // Pre-populate required validation rules
    const rules: ValidationRuleInput[] = fieldMappings
      .filter((f) => f.required)
      .map((f) => ({
        id: `req_${f.key}`,
        targetField: f.namedRange,
        type: 'required',
        params: {},
        messageJa: `${f.labelJa} は必須です`,
        message: `${f.label} is required`,
        severity: 'error' as const,
      }));
    setValidationRules(rules);
    setStep('validation');
  };

  // -------------------------------------------------------------------------
  // Step 3→4: Validation → Review
  // -------------------------------------------------------------------------

  const handlePreview = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/template-designer/preview-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fieldMappings,
          logicalTableName,
          logicalTableNameJa,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSchemaPreview(json.data);
        setStep('review');
      }
    } catch (e) {
      alert(`エラー: ${e}`);
    }
  };

  // -------------------------------------------------------------------------
  // Step 4: Save
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    if (!file || !schemaPreview) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'metadata',
        JSON.stringify({
          name: templateName,
          nameJa: templateNameJa,
          category,
          schedule,
          deadline: null,
          tabColor: '#2563EB',
          schemaJson: (schemaPreview as any).schemaJson,
          mappingJson: (schemaPreview as any).mappingJson,
          validationRules,
        }),
      );

      const res = await fetch(`${API_BASE}/admin/template-designer/save`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        alert('テンプレートを保存しました（draft）。配布画面から公開してください。');
      } else {
        alert(`保存エラー: ${json.error?.message}`);
      }
    } catch (e) {
      alert(`通信エラー: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Update helpers
  // -------------------------------------------------------------------------

  const updateField = (index: number, partial: Partial<FieldMapping>) => {
    setFieldMappings((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...partial } : f)),
    );
  };

  const removeField = (index: number) => {
    setFieldMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const addValidationRule = () => {
    setValidationRules((prev) => [
      ...prev,
      {
        id: `rule_${Date.now()}`,
        targetField: fieldMappings[0]?.namedRange ?? '',
        type: 'required',
        params: {},
        messageJa: '',
        message: '',
        severity: 'error',
      },
    ]);
  };

  const updateRule = (index: number, partial: Partial<ValidationRuleInput>) => {
    setValidationRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...partial } : r)),
    );
  };

  const removeRule = (index: number) => {
    setValidationRules((prev) => prev.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">テンプレートデザイナー</h1>
      <p className="mt-1 text-sm text-slate-500">
        Excel テンプレートのアップロード → Named Range マッピング → バリデーション → 保存
      </p>

      {/* Stepper */}
      <div className="mt-6 flex gap-2">
        {(['upload', 'mapping', 'validation', 'review'] as WizardStep[]).map((s, i) => {
          const labels = ['1. アップロード', '2. マッピング', '3. バリデーション', '4. 確認・保存'];
          const isActive = s === step;
          const isPast = ['upload', 'mapping', 'validation', 'review'].indexOf(s) <
            ['upload', 'mapping', 'validation', 'review'].indexOf(step);
          return (
            <button
              key={s}
              onClick={() => isPast && setStep(s)}
              disabled={!isPast && !isActive}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isPast
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {labels[i]}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="mt-6">
        {/* ===== Step 1: Upload ===== */}
        {step === 'upload' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-800">Excel テンプレートのアップロード</h2>
            <p className="mt-2 text-sm text-slate-500">
              Named Ranges が設定された Excel テンプレート (.xlsx) をアップロードしてください。
              サーバーが Named Ranges を自動検出し、マッピング候補を提案します。
            </p>

            <div className="mt-4">
              <label className="block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-400">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500">クリックして .xlsx ファイルを選択</p>
                    <p className="mt-1 text-xs text-slate-400">Named Ranges が設定されたテンプレートを推奨</p>
                  </div>
                )}
              </label>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? '解析中...' : '解析して次へ'}
            </button>
          </div>
        )}

        {/* ===== Step 2: Mapping ===== */}
        {step === 'mapping' && (
          <div className="space-y-6">
            {/* Template metadata */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-slate-800">テンプレート基本情報</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <FormInput label="テンプレート名（日本語）" value={templateNameJa} onChange={setTemplateNameJa} required />
                <FormInput label="テンプレート名（英語）" value={templateName} onChange={setTemplateName} required />
                <FormInput label="論理テーブル名（日本語）" value={logicalTableNameJa} onChange={setLogicalTableNameJa} required />
                <FormInput label="論理テーブル名（英語）" value={logicalTableName} onChange={setLogicalTableName} required />
                <FormInput label="カテゴリ" value={category} onChange={setCategory} placeholder="例: 月次報告, 人事, 経理" />
                <div>
                  <label className="block text-sm font-medium text-slate-700">スケジュール</label>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="once">一回限り</option>
                    <option value="monthly">月次</option>
                    <option value="quarterly">四半期</option>
                    <option value="yearly">年次</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Analysis summary */}
            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
              ファイル: <strong>{fileName}</strong> | シート: {sheetNames.join(', ')} | Named Ranges: <strong>{namedRanges.length}</strong> 件検出
            </div>

            {/* Field mapping table */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-slate-800">
                フィールドマッピング
                <span className="ml-2 text-sm font-normal text-slate-400">
                  Named Range → DB フィールド
                </span>
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">Named Range</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">セル</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">DB キー</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">ラベル（日）</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">ラベル（英）</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">型</th>
                      <th className="px-3 py-2 text-center font-medium text-slate-500">必須</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">AI ヒント</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fieldMappings.map((field, i) => {
                      const nr = namedRanges.find((n) => n.name === field.namedRange);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-xs text-blue-700">{field.namedRange}</td>
                          <td className="px-3 py-2 text-xs text-slate-400">{nr?.ref}</td>
                          <td className="px-3 py-2">
                            <input
                              value={field.key}
                              onChange={(e) => updateField(i, { key: e.target.value })}
                              className="w-28 rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={field.labelJa}
                              onChange={(e) => updateField(i, { labelJa: e.target.value })}
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={field.label}
                              onChange={(e) => updateField(i, { label: e.target.value })}
                              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={field.type}
                              onChange={(e) => updateField(i, { type: e.target.value })}
                              className="rounded border border-slate-200 px-2 py-1 text-xs"
                            >
                              {FIELD_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(i, { required: e.target.checked })}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={field.aiTransferHints.join(', ')}
                              onChange={(e) =>
                                updateField(i, {
                                  aiTransferHints: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                })
                              }
                              className="w-32 rounded border border-slate-200 px-2 py-1 text-xs"
                              placeholder="売上, revenue"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeField(i)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleMappingDone}
                  disabled={fieldMappings.length === 0}
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  バリデーション設定へ →
                </button>
                <button
                  onClick={() => setStep('upload')}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  ← 戻る
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Step 3: Validation Rules ===== */}
        {step === 'validation' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-800">バリデーションルール</h2>
            <p className="mt-2 text-sm text-slate-500">
              ルールベースの検証を設定。AI 検証はこれに加えて文脈・過去データを考慮します。
            </p>

            <div className="mt-4 space-y-3">
              {validationRules.map((rule, i) => (
                <div key={rule.id} className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                  {/* Target field */}
                  <select
                    value={rule.targetField}
                    onChange={(e) => updateRule(i, { targetField: e.target.value })}
                    className="w-36 rounded border border-slate-200 px-2 py-1 text-xs"
                  >
                    {fieldMappings.map((f) => (
                      <option key={f.namedRange} value={f.namedRange}>
                        {f.labelJa} ({f.namedRange})
                      </option>
                    ))}
                  </select>

                  {/* Rule type */}
                  <select
                    value={rule.type}
                    onChange={(e) => updateRule(i, { type: e.target.value })}
                    className="rounded border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="required">必須</option>
                    <option value="min">最小値</option>
                    <option value="max">最大値</option>
                    <option value="range">範囲</option>
                    <option value="regex">正規表現</option>
                    <option value="enum">列挙値</option>
                  </select>

                  {/* Severity */}
                  <select
                    value={rule.severity}
                    onChange={(e) => updateRule(i, { severity: e.target.value as 'error' | 'warning' })}
                    className="rounded border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="error">エラー（送信ブロック）</option>
                    <option value="warning">警告のみ</option>
                  </select>

                  {/* Message */}
                  <input
                    value={rule.messageJa}
                    onChange={(e) => updateRule(i, { messageJa: e.target.value })}
                    className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                    placeholder="エラーメッセージ（日本語）"
                  />

                  <button onClick={() => removeRule(i)} className="text-xs text-red-500 hover:text-red-700">
                    削除
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addValidationRule}
              className="mt-3 rounded-md border border-dashed border-slate-300 px-4 py-2 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600"
            >
              + ルール追加
            </button>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handlePreview}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                プレビュー → 確認
              </button>
              <button
                onClick={() => setStep('mapping')}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                ← 戻る
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 4: Review & Save ===== */}
        {step === 'review' && schemaPreview && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-slate-800">テンプレート確認</h2>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">テンプレート名:</span> {templateNameJa}</div>
                <div><span className="text-slate-500">論理テーブル:</span> {logicalTableNameJa}</div>
                <div><span className="text-slate-500">フィールド数:</span> {fieldMappings.length}</div>
                <div><span className="text-slate-500">バリデーションルール:</span> {validationRules.length}</div>
                <div><span className="text-slate-500">スケジュール:</span> {schedule}</div>
                <div><span className="text-slate-500">ファイル:</span> {fileName}</div>
              </div>
            </div>

            {/* schema_json preview */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-semibold text-slate-700">schema_json（論理テーブル定義）</h3>
              <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-slate-800 p-4 text-xs text-green-300">
                {JSON.stringify((schemaPreview as any).schemaJson, null, 2)}
              </pre>
            </div>

            {/* mapping_json preview */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-semibold text-slate-700">mapping_json（Named Range ↔ DB マッピング）</h3>
              <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-slate-800 p-4 text-xs text-green-300">
                {JSON.stringify((schemaPreview as any).mappingJson, null, 2)}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : 'テンプレートを保存（draft）'}
              </button>
              <button
                onClick={() => setStep('validation')}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                ← 戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable components
// ---------------------------------------------------------------------------

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
