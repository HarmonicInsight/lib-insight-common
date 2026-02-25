import { Hono } from 'hono';
import { tenantMiddleware } from '../middleware/tenant';

export const draftRoutes = new Hono();

draftRoutes.use('*', tenantMiddleware);

// PUT /api/drafts/:templateId — 下書き保存（upsert）
draftRoutes.put('/:templateId', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');
  const userEmail = c.get('userEmail');
  const body = await c.req.json();

  if (!userEmail) {
    return c.json(
      { success: false, error: { code: 'AUTH', message: 'X-Insight-User-Email header is required for drafts' } },
      401,
    );
  }

  const { data, error } = await supabase
    .from('dc_drafts')
    .upsert(
      {
        template_id: templateId,
        user_email: userEmail,
        data: body.data,
        saved_at: new Date().toISOString(),
      },
      { onConflict: 'template_id,user_email' },
    )
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// GET /api/drafts/:templateId — 下書き取得
draftRoutes.get('/:templateId', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');
  const userEmail = c.get('userEmail');

  if (!userEmail) {
    return c.json(
      { success: false, error: { code: 'AUTH', message: 'X-Insight-User-Email header is required' } },
      401,
    );
  }

  const { data, error } = await supabase
    .from('dc_drafts')
    .select('*')
    .eq('template_id', templateId)
    .eq('user_email', userEmail)
    .single();

  if (error || !data) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'No draft found' } }, 404);
  }

  return c.json({ success: true, data });
});

// GET /api/drafts — 下書き一覧
draftRoutes.get('/', async (c) => {
  const { supabase } = c.get('tenant');
  const userEmail = c.get('userEmail');

  if (!userEmail) {
    return c.json(
      { success: false, error: { code: 'AUTH', message: 'X-Insight-User-Email header is required' } },
      401,
    );
  }

  const { data, error } = await supabase
    .from('dc_drafts')
    .select('id, template_id, saved_at')
    .eq('user_email', userEmail)
    .order('saved_at', { ascending: false });

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// DELETE /api/drafts/:templateId — 下書き削除
draftRoutes.delete('/:templateId', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');
  const userEmail = c.get('userEmail');

  if (!userEmail) {
    return c.json(
      { success: false, error: { code: 'AUTH', message: 'X-Insight-User-Email header is required' } },
      401,
    );
  }

  const { error } = await supabase
    .from('dc_drafts')
    .delete()
    .eq('template_id', templateId)
    .eq('user_email', userEmail);

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true });
});
