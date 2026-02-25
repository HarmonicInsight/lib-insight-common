import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { adminAuthMiddleware } from '../../middleware/tenant';

export const adminProvisioningRoutes = new Hono();

adminProvisioningRoutes.use('*', adminAuthMiddleware);

function getAdminSupabase() {
  return createClient(
    process.env.ADMIN_SUPABASE_URL!,
    process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// POST /admin/provisioning/provision — テナントプロビジョニング
adminProvisioningRoutes.post('/provision', async (c) => {
  const body = await c.req.json();

  // Provisioning steps:
  // 1. Create Supabase project (via Supabase Management API)
  // 2. Run migration (dc_ tables)
  // 3. Create storage bucket
  // 4. Register in dc_tenant_registry
  // 5. Distribute initial templates

  // TODO: Implement Supabase Management API integration
  // For MVP, the Supabase project is created manually and connection info is passed in

  const supabase = getAdminSupabase();

  // Register tenant in registry
  const { data, error } = await supabase
    .from('dc_tenant_registry')
    .insert({
      tenant_name: body.tenantName,
      tenant_code: body.tenantCode,
      supabase_url: body.supabaseUrl,
      supabase_anon_key: body.supabaseAnonKey,
      supabase_service_role_key_encrypted: body.supabaseServiceRoleKey,
      license_key: body.licenseKey,
      provisioned_by: body.provisionedBy ?? 'system',
      notes: body.notes,
    })
    .select()
    .single();

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  // Run migration on tenant's Supabase
  const tenantSupabase = createClient(body.supabaseUrl, body.supabaseServiceRoleKey);
  const migrationResult = await runTenantMigration(tenantSupabase);

  return c.json({
    success: true,
    data: {
      tenant: data,
      migration: migrationResult,
      steps: ['register_tenant', 'run_migration'],
    },
  }, 201);
});

// POST /admin/provisioning/migrate — マイグレーション実行
adminProvisioningRoutes.post('/migrate', async (c) => {
  const supabase = getAdminSupabase();
  const body = await c.req.json();
  const tenantIds: string[] = body.tenantIds ?? [];

  // If no tenantIds specified, migrate all active tenants
  let tenantsQuery = supabase
    .from('dc_tenant_registry')
    .select('id, tenant_code, supabase_url, supabase_service_role_key_encrypted, status');

  if (tenantIds.length > 0) {
    tenantsQuery = tenantsQuery.in('id', tenantIds);
  } else {
    tenantsQuery = tenantsQuery.eq('status', 'active');
  }

  const { data: tenants, error } = await tenantsQuery;

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  const results = [];
  for (const tenant of tenants ?? []) {
    const tenantSupabase = createClient(
      tenant.supabase_url,
      tenant.supabase_service_role_key_encrypted, // TODO: decrypt
    );
    const result = await runTenantMigration(tenantSupabase);
    results.push({ tenantId: tenant.id, tenantCode: tenant.tenant_code, ...result });
  }

  return c.json({ success: true, data: results });
});

// GET /admin/provisioning/health — 全テナントヘルスチェック
adminProvisioningRoutes.get('/health', async (c) => {
  const supabase = getAdminSupabase();

  const { data: tenants } = await supabase
    .from('dc_tenant_registry')
    .select('id, tenant_code, tenant_name, supabase_url, supabase_service_role_key_encrypted, status')
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
        .select('id', { count: 'exact', head: true });

      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        status: 'healthy',
        templateCount: count ?? 0,
      });
    } catch {
      results.push({
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        status: 'unreachable',
        templateCount: 0,
      });
    }
  }

  return c.json({ success: true, data: results });
});

// ---------------------------------------------------------------------------
// Migration helper
// ---------------------------------------------------------------------------

async function runTenantMigration(
  supabase: ReturnType<typeof createClient>,
): Promise<{ success: boolean; message: string }> {
  try {
    // Supabase JS client doesn't support raw SQL execution directly.
    // Migration should be run via Supabase CLI: `supabase db push --project-ref <ref>`
    // or via Supabase Dashboard SQL Editor.
    //
    // This endpoint serves as a placeholder for future Supabase Management API integration.
    //
    // For now, verify that dc_templates table exists as a health check.
    const { error } = await supabase
      .from('dc_templates')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return { success: false, message: `Migration check failed: ${error.message}` };
    }

    return { success: true, message: 'Tables verified successfully' };
  } catch (e) {
    return { success: false, message: `Migration error: ${e}` };
  }
}
