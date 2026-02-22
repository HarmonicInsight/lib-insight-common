import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { adminAuthMiddleware } from '../../middleware/tenant';

export const adminAnalyticsRoutes = new Hono();

adminAnalyticsRoutes.use('*', adminAuthMiddleware);

function getAdminSupabase() {
  return createClient(
    process.env.ADMIN_SUPABASE_URL!,
    process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET /admin/analytics/collection — 全テナント回収状況サマリー
adminAnalyticsRoutes.get('/collection', async (c) => {
  const supabase = getAdminSupabase();

  const { data: tenants } = await supabase
    .from('dc_tenant_registry')
    .select('id, tenant_code, tenant_name, supabase_url, supabase_service_role_key_encrypted')
    .eq('status', 'active');

  const results = [];
  for (const tenant of tenants ?? []) {
    try {
      const ts = createClient(tenant.supabase_url, tenant.supabase_service_role_key_encrypted);

      const { count: templateCount } = await ts
        .from('dc_templates')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

      const { count: submissionCount } = await ts
        .from('dc_collected_data')
        .select('id', { count: 'exact', head: true });

      const { count: acceptedCount } = await ts
        .from('dc_collected_data')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted');

      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        publishedTemplates: templateCount ?? 0,
        totalSubmissions: submissionCount ?? 0,
        acceptedSubmissions: acceptedCount ?? 0,
        acceptanceRate: submissionCount
          ? Math.round(((acceptedCount ?? 0) / submissionCount) * 100)
          : 0,
      });
    } catch {
      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        publishedTemplates: 0,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        acceptanceRate: 0,
        error: 'unreachable',
      });
    }
  }

  return c.json({ success: true, data: results });
});

// GET /admin/analytics/ai-usage — AI 利用量サマリー
adminAnalyticsRoutes.get('/ai-usage', async (c) => {
  const supabase = getAdminSupabase();
  const month = c.req.query('month'); // YYYY-MM format

  const { data: tenants } = await supabase
    .from('dc_tenant_registry')
    .select('id, tenant_code, tenant_name, supabase_url, supabase_service_role_key_encrypted')
    .eq('status', 'active');

  const results = [];
  for (const tenant of tenants ?? []) {
    try {
      const ts = createClient(tenant.supabase_url, tenant.supabase_service_role_key_encrypted);

      let query = ts
        .from('dc_ai_logs')
        .select('action', { count: 'exact' });

      if (month) {
        const start = `${month}-01T00:00:00Z`;
        const nextMonth = new Date(start);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        query = query.gte('executed_at', start).lt('executed_at', nextMonth.toISOString());
      }

      const { count: transferCount } = await ts
        .from('dc_ai_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'transfer');

      const { count: validateCount } = await ts
        .from('dc_ai_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'validate');

      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        aiTransfers: transferCount ?? 0,
        aiValidations: validateCount ?? 0,
        totalAiCalls: (transferCount ?? 0) + (validateCount ?? 0),
      });
    } catch {
      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        aiTransfers: 0,
        aiValidations: 0,
        totalAiCalls: 0,
        error: 'unreachable',
      });
    }
  }

  return c.json({ success: true, data: results });
});

// GET /admin/analytics/storage — ストレージ使用量
adminAnalyticsRoutes.get('/storage', async (c) => {
  // Supabase Storage usage requires Management API
  // Placeholder for future implementation
  return c.json({
    success: true,
    data: [],
    message: 'Storage analytics requires Supabase Management API integration',
  });
});
