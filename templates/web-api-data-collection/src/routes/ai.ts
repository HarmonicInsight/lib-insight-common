import { Hono } from 'hono';
import { tenantMiddleware } from '../middleware/tenant';

export const aiRoutes = new Hono();

aiRoutes.use('*', tenantMiddleware);

// GET /api/ai/transfers — AI 転記履歴
aiRoutes.get('/transfers', async (c) => {
  const { supabase } = c.get('tenant');
  const userEmail = c.get('userEmail');
  const limit = Number(c.req.query('limit') ?? 20);

  let query = supabase
    .from('dc_ai_logs')
    .select('*')
    .eq('action', 'transfer')
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// GET /api/ai/validations — AI 検証履歴
aiRoutes.get('/validations', async (c) => {
  const { supabase } = c.get('tenant');
  const userEmail = c.get('userEmail');
  const limit = Number(c.req.query('limit') ?? 20);

  let query = supabase
    .from('dc_ai_logs')
    .select('*')
    .eq('action', 'validate')
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});
