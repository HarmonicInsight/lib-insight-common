import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { templateRoutes } from './routes/templates';
import { submissionRoutes } from './routes/submissions';
import { draftRoutes } from './routes/drafts';
import { collectionRoutes } from './routes/collection';
import { aiRoutes } from './routes/ai';
import { adminTenantRoutes } from './routes/admin/tenants';
import { adminProvisioningRoutes } from './routes/admin/provisioning';
import { adminDistributionRoutes } from './routes/admin/distribution';
import { adminAnalyticsRoutes } from './routes/admin/analytics';
import { adminTemplateDesignerRoutes } from './routes/admin/template-designer';
import { healthRoute } from './routes/health';

const app = new Hono();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Insight-License-Key',
      'X-Insight-User-Email',
      'X-Insight-Tenant-Id',
    ],
  }),
);

// ---------------------------------------------------------------------------
// Client API Routes (IOSH → API)
// ---------------------------------------------------------------------------

app.route('/api/templates', templateRoutes);
app.route('/api/submissions', submissionRoutes);
app.route('/api/drafts', draftRoutes);
app.route('/api/collection', collectionRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api', healthRoute);

// ---------------------------------------------------------------------------
// Admin API Routes (DC Admin Console → API)
// ---------------------------------------------------------------------------

app.route('/admin/tenants', adminTenantRoutes);
app.route('/admin/provisioning', adminProvisioningRoutes);
app.route('/admin/templates', adminDistributionRoutes);
app.route('/admin/analytics', adminAnalyticsRoutes);
app.route('/admin/template-designer', adminTemplateDesignerRoutes);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const port = Number(process.env.PORT ?? 9500);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Data Collection API running on http://localhost:${info.port}`);
});

export default app;
