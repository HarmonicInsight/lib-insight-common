import { Hono } from 'hono';
import { tenantMiddleware } from '../middleware/tenant';

export const collectionRoutes = new Hono();

collectionRoutes.use('*', tenantMiddleware);

// GET /api/collection/:templateId/status — 回収状況
collectionRoutes.get('/:templateId/status', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');

  // Get template info
  const { data: template } = await supabase
    .from('dc_templates')
    .select('id, name_ja, deadline')
    .eq('id', templateId)
    .single();

  if (!template) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } }, 404);
  }

  // Aggregate submission status
  const { data: submissions } = await supabase
    .from('dc_collected_data')
    .select('status, submitter_email, submitted_at')
    .eq('template_id', templateId);

  const statusCounts = {
    submitted: 0,
    accepted: 0,
    rejected: 0,
    pending_review: 0,
  };

  for (const s of submissions ?? []) {
    if (s.status in statusCounts) {
      statusCounts[s.status as keyof typeof statusCounts]++;
    }
  }

  // Count drafts
  const { count: draftCount } = await supabase
    .from('dc_drafts')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId);

  return c.json({
    success: true,
    data: {
      templateId,
      templateName: template.name_ja,
      deadline: template.deadline,
      ...statusCounts,
      draftCount: draftCount ?? 0,
      totalSubmissions: (submissions ?? []).length,
    },
  });
});

// POST /api/collection/:templateId/remind — リマインド送信
collectionRoutes.post('/:templateId/remind', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');
  const body = await c.req.json();

  // TODO: Implement reminder email sending via Resend
  // For now, just log the reminder request
  return c.json({
    success: true,
    data: {
      templateId,
      reminderSentTo: body.emails ?? [],
      message: 'Reminder sending is not yet implemented',
    },
  });
});

// GET /api/collection/:templateId/export — データエクスポート
collectionRoutes.get('/:templateId/export', async (c) => {
  const { supabase } = c.get('tenant');
  const templateId = c.req.param('templateId');
  const format = c.req.query('format') ?? 'json';
  const statusFilter = c.req.query('status') ?? 'accepted';

  const { data, error } = await supabase
    .from('dc_collected_data')
    .select('data, submitter_email, submitter_name, submitted_at, status')
    .eq('template_id', templateId)
    .eq('status', statusFilter)
    .order('submitted_at', { ascending: true });

  if (error) {
    return c.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, 500);
  }

  if (format === 'csv') {
    // Flatten JSONB data to CSV
    if (!data || data.length === 0) {
      return new Response('', { headers: { 'Content-Type': 'text/csv' } });
    }

    const allKeys = new Set<string>();
    for (const row of data) {
      if (row.data && typeof row.data === 'object') {
        Object.keys(row.data as Record<string, unknown>).forEach((k) => allKeys.add(k));
      }
    }

    const headers = ['submitter_email', 'submitter_name', 'submitted_at', ...allKeys];
    const csvRows = [
      headers.join(','),
      ...data.map((row) => {
        const d = row.data as Record<string, unknown>;
        return headers
          .map((h) => {
            if (h === 'submitter_email') return row.submitter_email;
            if (h === 'submitter_name') return row.submitter_name ?? '';
            if (h === 'submitted_at') return row.submitted_at;
            const v = d[h];
            return v === null || v === undefined ? '' : String(v);
          })
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',');
      }),
    ];

    return new Response(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_${templateId}.csv"`,
      },
    });
  }

  return c.json({ success: true, data });
});

// GET /api/collection/dashboard — 回収ダッシュボード
collectionRoutes.get('/dashboard', async (c) => {
  const { supabase } = c.get('tenant');

  // Fetch all published templates with submission counts
  const { data: templates } = await supabase
    .from('dc_templates')
    .select('id, name_ja, deadline, status')
    .eq('status', 'published');

  const dashboard = [];

  for (const t of templates ?? []) {
    const { count: submittedCount } = await supabase
      .from('dc_collected_data')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', t.id);

    const { count: acceptedCount } = await supabase
      .from('dc_collected_data')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', t.id)
      .eq('status', 'accepted');

    dashboard.push({
      templateId: t.id,
      templateName: t.name_ja,
      deadline: t.deadline,
      totalSubmissions: submittedCount ?? 0,
      acceptedCount: acceptedCount ?? 0,
    });
  }

  return c.json({ success: true, data: dashboard });
});
