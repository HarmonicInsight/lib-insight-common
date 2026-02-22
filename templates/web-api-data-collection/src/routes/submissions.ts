import { Hono } from 'hono';
import { tenantMiddleware } from '../middleware/tenant';

export const submissionRoutes = new Hono();

submissionRoutes.use('*', tenantMiddleware);

// POST /api/submissions — データ送信
submissionRoutes.post('/', async (c) => {
  const { supabase } = c.get('tenant');
  const userEmail = c.get('userEmail');
  const body = await c.req.json();

  if (!body.templateId || !body.data) {
    return c.json(
      { success: false, error: { code: 'VALIDATION', message: 'templateId and data are required' } },
      400,
    );
  }

  // Verify template exists and is published
  const { data: template, error: tErr } = await supabase
    .from('dc_templates')
    .select('id, version, status, deadline')
    .eq('id', body.templateId)
    .eq('status', 'published')
    .single();

  if (tErr || !template) {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Template not found or not published' } },
      404,
    );
  }

  // Check deadline
  if (template.deadline && new Date(template.deadline) < new Date()) {
    return c.json(
      { success: false, error: { code: 'DEADLINE_PASSED', message: 'Submission deadline has passed' } },
      400,
    );
  }

  // Insert submission
  const { data, error } = await supabase
    .from('dc_collected_data')
    .insert({
      template_id: body.templateId,
      template_version: template.version,
      submitter_email: userEmail ?? body.submitterEmail ?? 'anonymous',
      submitter_name: body.submitterName,
      status: 'submitted',
      data: body.data,
      comment: body.comment,
      ai_validation_snapshot: body.aiValidationSnapshot,
      ai_transfer_used: body.aiTransferUsed ?? false,
    })
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  // Delete draft if exists
  if (userEmail) {
    await supabase
      .from('dc_drafts')
      .delete()
      .eq('template_id', body.templateId)
      .eq('user_email', userEmail);
  }

  return c.json({ success: true, data }, 201);
});

// GET /api/submissions — 送信一覧（フィルタ対応）
submissionRoutes.get('/', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.query('templateId');
  const status = c.req.query('status');
  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);

  let query = supabase
    .from('dc_collected_data')
    .select('id, template_id, template_version, submitter_email, submitter_name, status, comment, submitted_at, reviewed_at, ai_transfer_used', { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (templateId) query = query.eq('template_id', templateId);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data, meta: { total: count, limit, offset } });
});

// GET /api/submissions/:submissionId — 送信詳細
submissionRoutes.get('/:submissionId', async (c) => {
  const { supabase } = c.get('tenant');
  const submissionId = c.req.param('submissionId');

  const { data, error } = await supabase
    .from('dc_collected_data')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (error || !data) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } }, 404);
  }

  return c.json({ success: true, data });
});

// POST /api/submissions/:submissionId/review — 承認
submissionRoutes.post('/:submissionId/review', async (c) => {
  const { supabase } = c.get('tenant');
  const submissionId = c.req.param('submissionId');
  const userEmail = c.get('userEmail');

  const { data, error } = await supabase
    .from('dc_collected_data')
    .update({
      status: 'accepted',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userEmail ?? 'admin',
    })
    .eq('id', submissionId)
    .eq('status', 'submitted')
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// POST /api/submissions/:submissionId/reject — 差し戻し
submissionRoutes.post('/:submissionId/reject', async (c) => {
  const { supabase } = c.get('tenant');
  const submissionId = c.req.param('submissionId');
  const userEmail = c.get('userEmail');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('dc_collected_data')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userEmail ?? 'admin',
      rejection_reason: body.reason,
    })
    .eq('id', submissionId)
    .eq('status', 'submitted')
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});
