import type { Context, Next } from 'hono';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { HTTPException } from 'hono/http-exception';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantContext {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  supabase: SupabaseClient;
}

// Augment Hono context
declare module 'hono' {
  interface ContextVariableMap {
    tenant: TenantContext;
    licenseKey: string;
    userEmail: string | null;
  }
}

// ---------------------------------------------------------------------------
// Tenant cache (in-memory, per-process)
// ---------------------------------------------------------------------------

interface CachedTenant {
  id: string;
  code: string;
  name: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  cachedAt: number;
}

const tenantCache = new Map<string, CachedTenant>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Admin Supabase client (for dc_tenant_registry)
// ---------------------------------------------------------------------------

let adminSupabase: SupabaseClient | null = null;

function getAdminSupabase(): SupabaseClient {
  if (!adminSupabase) {
    const url = process.env.ADMIN_SUPABASE_URL;
    const key = process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('ADMIN_SUPABASE_URL and ADMIN_SUPABASE_SERVICE_ROLE_KEY are required');
    }
    adminSupabase = createClient(url, key);
  }
  return adminSupabase;
}

// ---------------------------------------------------------------------------
// Resolve tenant from license key → dc_tenant_registry
// ---------------------------------------------------------------------------

async function resolveTenant(licenseKey: string): Promise<CachedTenant> {
  // Check cache first
  const cached = tenantCache.get(licenseKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const admin = getAdminSupabase();

  // License key → tenant lookup via dc_tenant_registry
  const { data, error } = await admin
    .from('dc_tenant_registry')
    .select('id, tenant_code, tenant_name, supabase_url, supabase_service_role_key_encrypted, status')
    .eq('license_key', licenseKey)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    throw new HTTPException(401, { message: 'Invalid license key or tenant not found' });
  }

  // Decrypt service_role key
  const serviceRoleKey = decryptServiceRoleKey(data.supabase_service_role_key_encrypted);

  const tenant: CachedTenant = {
    id: data.id,
    code: data.tenant_code,
    name: data.tenant_name,
    supabaseUrl: data.supabase_url,
    supabaseServiceRoleKey: serviceRoleKey,
    cachedAt: Date.now(),
  };

  tenantCache.set(licenseKey, tenant);
  return tenant;
}

// ---------------------------------------------------------------------------
// Encryption helpers
// ---------------------------------------------------------------------------

function decryptServiceRoleKey(encrypted: string): string {
  // TODO: Implement AES-256 decryption using TENANT_KEY_ENCRYPTION_SECRET
  // For now, return as-is (initial development phase)
  return encrypted;
}

// ---------------------------------------------------------------------------
// Middleware: Tenant resolution
// ---------------------------------------------------------------------------

/**
 * Client API middleware — resolves tenant from X-Insight-License-Key header.
 *
 * After this middleware, `c.get('tenant')` provides the tenant's Supabase client.
 */
export async function tenantMiddleware(c: Context, next: Next): Promise<void> {
  const licenseKey = c.req.header('X-Insight-License-Key');
  if (!licenseKey) {
    throw new HTTPException(401, { message: 'X-Insight-License-Key header is required' });
  }

  const cached = await resolveTenant(licenseKey);

  // Create tenant-specific Supabase client
  const tenantSupabase = createClient(cached.supabaseUrl, cached.supabaseServiceRoleKey);

  c.set('tenant', {
    tenantId: cached.id,
    tenantCode: cached.code,
    tenantName: cached.name,
    supabase: tenantSupabase,
  });

  c.set('licenseKey', licenseKey);
  c.set('userEmail', c.req.header('X-Insight-User-Email') ?? null);

  await next();
}

// ---------------------------------------------------------------------------
// Middleware: Admin auth (Firebase token)
// ---------------------------------------------------------------------------

/**
 * Admin API middleware — verifies Firebase ID token.
 */
export async function adminAuthMiddleware(c: Context, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authorization: Bearer <token> is required' });
  }

  // TODO: Verify Firebase ID token
  // For now, pass through for development
  await next();
}
