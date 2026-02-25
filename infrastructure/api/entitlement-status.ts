/**
 * /api/entitlement/status - 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｹ繝・・繧ｿ繧ｹ蜿門ｾ・
 *
 * 繧ｯ繝ｩ繧､繧｢繝ｳ繝亥・縺ｧ縺ｮ繝ｩ繧､繧ｻ繝ｳ繧ｹ迥ｶ諷狗ｮ｡逅・畑API
 *
 * 繝ｪ繧ｯ繧ｨ繧ｹ繝・
 *   POST { product_code: "INMV" }
 *
 * 繝ｬ繧ｹ繝昴Φ繧ｹ:
 *   {
 *     plan: "STD",
 *     limits: { ... },
 *     expires_at: "2025-12-31",
 *     usage: { current: 5, limit: 30, remaining: 25, resetAt: "2025-02-01" }
 *   }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRequest } from '../auth/firebase-admin';
import { createClient } from '@supabase/supabase-js';
import {
  ProductCode,
  PlanCode,
  PlanLimits,
  getPlanLimits,
} from '../../config/products';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StatusRequest {
  product_code: ProductCode;
}

interface UsageInfo {
  current: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

interface StatusResponse {
  plan: PlanCode;
  limits: PlanLimits;
  expires_at: string | null;
  is_active: boolean;
  usage: UsageInfo | null;
  days_remaining: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await verifyRequest(req.headers.authorization);
  if (!authResult.success || !authResult.uid) {
    return res.status(401).json({ error: '隱崎ｨｼ繧ｨ繝ｩ繝ｼ' });
  }

  const { product_code } = req.body as StatusRequest;

  if (!product_code) {
    return res.status(400).json({ error: 'product_code 縺悟ｿ・ｦ√〒縺・ });
  }

  try {
    // 繝ｦ繝ｼ繧ｶ繝ｼ蜿門ｾ・
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authResult.uid)
      .single();

    if (!user) {
      // 繝ｦ繝ｼ繧ｶ繝ｼ縺後＞縺ｪ縺・ｴ蜷医・FREE繝励Λ繝ｳ
      const limits = getPlanLimits(product_code, 'FREE');
      return res.status(200).json({
        plan: 'FREE',
        limits,
        expires_at: null,
        is_active: true,
        usage: null,
        days_remaining: -1,
      });
    }

    // 繝ｩ繧､繧ｻ繝ｳ繧ｹ蜿門ｾ・
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_code', product_code)
      .single();

    // 繝ｩ繧､繧ｻ繝ｳ繧ｹ縺ｪ縺・竊・FREE繝励Λ繝ｳ
    if (!license) {
      const limits = getPlanLimits(product_code, 'FREE');
      return res.status(200).json({
        plan: 'FREE',
        limits,
        expires_at: null,
        is_active: true,
        usage: await getUsage(user.id, product_code, limits.monthlyLimit),
        days_remaining: -1,
      });
    }

    // 繝励Λ繝ｳ蛻､螳・
    let effectivePlan: PlanCode = license.plan;

    // 辟｡蜉ｹ縺ｾ縺溘・譛滄剞蛻・ｌ縺ｮ蝣ｴ蜷医・FREE
    if (!license.is_active) {
      effectivePlan = 'FREE';
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      effectivePlan = 'FREE';
    }

    const limits = getPlanLimits(product_code, effectivePlan);

    // 谿九ｊ譌･謨ｰ
    let daysRemaining = -1;
    if (license.expires_at) {
      const expires = new Date(license.expires_at);
      const now = new Date();
      daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return res.status(200).json({
      plan: effectivePlan,
      limits,
      expires_at: license.expires_at,
      is_active: license.is_active,
      usage: await getUsage(user.id, product_code, limits.monthlyLimit),
      days_remaining: daysRemaining,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: '繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ' });
  }
}

/**
 * 譛磯俣蛻ｩ逕ｨ迥ｶ豕√ｒ蜿門ｾ・
 */
async function getUsage(
  userId: string,
  productCode: ProductCode,
  monthlyLimit: number
): Promise<UsageInfo> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('product_code', productCode)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', nextMonth.toISOString());

  const current = count || 0;
  const remaining = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - current);

  return {
    current,
    limit: monthlyLimit,
    remaining,
    resetAt: nextMonth.toISOString(),
  };
}
