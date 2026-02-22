import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { adminAuthMiddleware } from '../../middleware/tenant';

export const adminTenantRoutes = new Hono();

adminTenantRoutes.use('*', adminAuthMiddleware);

function getAdminSupabase() {
  return createClient(
    process.env.ADMIN_SUPABASE_URL!,
    process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET /admin/tenants — テナント一覧
adminTenantRoutes.get('/', async (c) => {
  const supabase = getAdminSupabase();
  const status = c.req.query('status');

  let query = supabase
    .from('dc_tenant_registry')
    .select('*')
    .order('provisioned_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  // Remove sensitive fields from response
  const safe = (data ?? []).map(({ supabase_service_role_key_encrypted, supabase_anon_key, ...rest }) => rest);

  return c.json({ success: true, data: safe });
});

// GET /admin/tenants/:tenantId — テナント詳細
adminTenantRoutes.get('/:tenantId', async (c) => {
  const supabase = getAdminSupabase();
  const tenantId = c.req.param('tenantId');

  const { data, error } = await supabase
    .from('dc_tenant_registry')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !data) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Tenant not found' } }, 404);
  }

  // Remove service_role key from response
  const { supabase_service_role_key_encrypted, ...safe } = data;

  return c.json({ success: true, data: safe });
});

// POST /admin/tenants — テナント新規登録
adminTenantRoutes.post('/', async (c) => {
  const supabase = getAdminSupabase();
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('dc_tenant_registry')
    .insert({
      tenant_name: body.tenantName,
      tenant_code: body.tenantCode,
      supabase_url: body.supabaseUrl,
      supabase_anon_key: body.supabaseAnonKey,
      supabase_service_role_key_encrypted: body.supabaseServiceRoleKey, // TODO: encrypt
      license_key: body.licenseKey,
      provisioned_by: body.provisionedBy,
      notes: body.notes,
    })
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data }, 201);
});

// PUT /admin/tenants/:tenantId — テナント更新
adminTenantRoutes.put('/:tenantId', async (c) => {
  const supabase = getAdminSupabase();
  const tenantId = c.req.param('tenantId');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('dc_tenant_registry')
    .update(body)
    .eq('id', tenantId)
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// POST /admin/tenants/:tenantId/suspend — テナント停止
adminTenantRoutes.post('/:tenantId/suspend', async (c) => {
  const supabase = getAdminSupabase();
  const tenantId = c.req.param('tenantId');

  const { data, error } = await supabase
    .from('dc_tenant_registry')
    .update({ status: 'suspended' })
    .eq('id', tenantId)
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// POST /admin/tenants/:tenantId/resume — テナント再開
adminTenantRoutes.post('/:tenantId/resume', async (c) => {
  const supabase = getAdminSupabase();
  const tenantId = c.req.param('tenantId');

  const { data, error } = await supabase
    .from('dc_tenant_registry')
    .update({ status: 'active' })
    .eq('id', tenantId)
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});

// POST /admin/tenants/:tenantId/decommission — テナント廃止
adminTenantRoutes.post('/:tenantId/decommission', async (c) => {
  const supabase = getAdminSupabase();
  const tenantId = c.req.param('tenantId');

  const { data, error } = await supabase
    .from('dc_tenant_registry')
    .update({ status: 'decommissioned' })
    .eq('id', tenantId)
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  return c.json({ success: true, data });
});
