import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { adminAuthMiddleware } from '../../middleware/tenant';

export const adminDistributionRoutes = new Hono();

adminDistributionRoutes.use('*', adminAuthMiddleware);

function getAdminSupabase() {
  return createClient(
    process.env.ADMIN_SUPABASE_URL!,
    process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// POST /admin/templates/distribute — テンプレート配布
adminDistributionRoutes.post('/distribute', async (c) => {
  const supabase = getAdminSupabase();
  const body = await c.req.json();

  const { templateData, tenantIds } = body as {
    templateData: Record<string, unknown>;
    tenantIds: string[];
  };

  if (!templateData || !tenantIds?.length) {
    return c.json(
      { success: false, error: { code: 'VALIDATION', message: 'templateData and tenantIds are required' } },
      400,
    );
  }

  // Get target tenants
  const { data: tenants, error } = await supabase
    .from('dc_tenant_registry')
    .select('id, tenant_code, supabase_url, supabase_service_role_key_encrypted')
    .in('id', tenantIds)
    .eq('status', 'active');

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  const results = [];
  for (const tenant of tenants ?? []) {
    try {
      const tenantSupabase = createClient(
        tenant.supabase_url,
        tenant.supabase_service_role_key_encrypted,
      );

      const { data, error: insertErr } = await tenantSupabase
        .from('dc_templates')
        .insert(templateData)
        .select()
        .single();

      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        success: !insertErr,
        templateId: data?.id,
        error: insertErr?.message,
      });
    } catch (e) {
      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        success: false,
        error: String(e),
      });
    }
  }

  return c.json({ success: true, data: results });
});

// GET /admin/templates/distribute/status — 配布状況確認
adminDistributionRoutes.get('/distribute/status', async (c) => {
  const supabase = getAdminSupabase();

  const { data: tenants } = await supabase
    .from('dc_tenant_registry')
    .select('id, tenant_code, tenant_name, supabase_url, supabase_service_role_key_encrypted')
    .eq('status', 'active');

  const results = [];
  for (const tenant of tenants ?? []) {
    try {
      const tenantSupabase = createClient(
        tenant.supabase_url,
        tenant.supabase_service_role_key_encrypted,
      );

      const { count } = await tenantSupabase
        .from('dc_templates')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        publishedTemplates: count ?? 0,
      });
    } catch {
      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        publishedTemplates: -1,
      });
    }
  }

  return c.json({ success: true, data: results });
});
