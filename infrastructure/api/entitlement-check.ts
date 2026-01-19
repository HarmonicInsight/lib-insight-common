/**
 * /api/entitlement/check - 機能利用可否チェック ★最重要
 *
 * Vercel Functions テンプレート
 *
 * 機能:
 *   - 権限はサーバーで判定（クライアント改造対策）
 *   - ライセンス状態確認
 *   - 機能アクセス判定
 *
 * リクエスト:
 *   POST { product_code: "INSS", feature: "inmv_subtitle" }
 *
 * レスポンス:
 *   { allowed: true, plan: "PRO", expires_at: "2025-12-31" }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRequest } from '../auth/firebase-admin';
import { createClient } from '@supabase/supabase-js';
import { PlanCode, canAccessFeature, FEATURE_MATRIX } from '../../config/products';

// Supabase クライアント（Service Role）
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EntitlementRequest {
  product_code: string;
  feature: string;
}

interface EntitlementResponse {
  allowed: boolean;
  plan: PlanCode;
  expires_at: string | null;
  reason?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EntitlementResponse | { error: string }>
) {
  // POST のみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // トークン検証
  const authResult = await verifyRequest(req.headers.authorization);

  if (!authResult.success || !authResult.uid) {
    return res.status(401).json({ error: authResult.error || '認証エラー' });
  }

  const { product_code, feature } = req.body as EntitlementRequest;

  if (!product_code || !feature) {
    return res.status(400).json({ error: 'product_code と feature が必要です' });
  }

  try {
    // ユーザーとライセンス情報を取得
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authResult.uid)
      .single();

    if (!user) {
      return res.status(200).json({
        allowed: false,
        plan: 'FREE',
        expires_at: null,
        reason: 'ユーザーが見つかりません',
      });
    }

    // ライセンス確認
    const { data: license } = await supabase
      .from('licenses')
      .select('plan, is_active, expires_at')
      .eq('user_id', user.id)
      .eq('product_code', product_code)
      .single();

    // ライセンスなし → FREE扱い
    if (!license) {
      const allowed = canAccessFeature(feature, 'FREE');
      return res.status(200).json({
        allowed,
        plan: 'FREE',
        expires_at: null,
        reason: allowed ? undefined : 'アップグレードが必要です',
      });
    }

    // 無効化されている
    if (!license.is_active) {
      return res.status(200).json({
        allowed: false,
        plan: license.plan,
        expires_at: license.expires_at,
        reason: 'ライセンスが無効化されています',
      });
    }

    // 期限切れチェック
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(200).json({
        allowed: false,
        plan: license.plan,
        expires_at: license.expires_at,
        reason: 'ライセンスの有効期限が切れています',
      });
    }

    // 機能アクセス判定
    const allowed = canAccessFeature(feature, license.plan as PlanCode);

    return res.status(200).json({
      allowed,
      plan: license.plan,
      expires_at: license.expires_at,
      reason: allowed ? undefined : 'この機能にはアップグレードが必要です',
    });
  } catch (error) {
    console.error('Entitlement check error:', error);
    return res.status(500).json({ error: 'サーバーエラー' });
  }
}
