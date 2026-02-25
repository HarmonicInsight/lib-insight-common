import { Hono } from 'hono';

export const healthRoute = new Hono();

// GET /api/health — ヘルスチェック
healthRoute.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    service: 'data-collection-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
