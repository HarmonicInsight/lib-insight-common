import { Hono } from 'hono';
import { tenantMiddleware } from '../middleware/tenant';

export const templateRoutes = new Hono();

templateRoutes.use('*', tenantMiddleware);

// GET /api/templates — テンプレート一覧
templateRoutes.get('/', async (c) => {
  const { supabase } = c.get('tenant');

  const { data, error } = await supabase
    .from('dc_templates')
    .select('id, name, name_ja, category, version, status, schedule, deadline, tab_color, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// GET /api/templates/:templateId — テンプレート詳細
templateRoutes.get('/:templateId', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');

  const { data, error } = await supabase
    .from('dc_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !data) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } }, 404);
  }

  return c.json({ success: true, data });
});

// GET /api/templates/:templateId/download — テンプレート Excel ダウンロード
templateRoutes.get('/:templateId/download', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');

  // Get template metadata
  const { data: template, error } = await supabase
    .from('dc_templates')
    .select('template_file_path, name_ja')
    .eq('id', templateId)
    .single();

  if (error || !template?.template_file_path) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Template file not found' } }, 404);
  }

  // Download from Supabase Storage
  const { data: fileData, error: dlError } = await supabase.storage
    .from('dc-templates')
    .download(template.template_file_path);

  if (dlError || !fileData) {
    return c.json({ success: false, error: { code: 'STORAGE_ERROR', message: 'Failed to download template' } }, 500);
  }

  const buffer = await fileData.arrayBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(template.name_ja)}.xlsx"`,
    },
  });
});

// GET /api/templates/:templateId/mapping — マッピング定義取得
templateRoutes.get('/:templateId/mapping', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');

  const { data, error } = await supabase
    .from('dc_templates')
    .select('id, schema_json, mapping_json, validation_rules')
    .eq('id', templateId)
    .single();

  if (error || !data) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } }, 404);
  }

  return c.json({ success: true, data });
});

// POST /api/templates — テンプレート作成（管理者/コンサル用）
templateRoutes.post('/', async (c) => {
  const { supabase } = c.get('tenant');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('dc_templates')
    .insert({
      name: body.name,
      name_ja: body.nameJa,
      category: body.category,
      description: body.description,
      description_ja: body.descriptionJa,
      schedule: body.schedule ?? 'once',
      deadline: body.deadline,
      schema_json: body.schemaJson,
      mapping_json: body.mappingJson,
      validation_rules: body.validationRules ?? [],
      tab_color: body.tabColor ?? '#2563EB',
      created_by: c.get('userEmail') ?? 'system',
    })
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data }, 201);
});

// PUT /api/templates/:templateId — テンプレート更新
templateRoutes.put('/:templateId', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('dc_templates')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// POST /api/templates/:templateId/publish — テンプレート公開
templateRoutes.post('/:templateId/publish', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');

  const { data, error } = await supabase
    .from('dc_templates')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// POST /api/templates/:templateId/archive — テンプレートアーカイブ
templateRoutes.post('/:templateId/archive', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');

  const { data, error } = await supabase
    .from('dc_templates')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});
