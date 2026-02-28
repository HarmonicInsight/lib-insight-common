/**
 * /api/entitlement/activate - ライセンスキー有効化
 *
 * Vercel Functions テンプレート
 *
 * 機能:
 *   - ライセンスキー検証
 *   - licenses テーブルに登録
 *
 * リクエスト:
 *   POST { license_key: "INSS-BIZ-2512-XXXX-XXXX-XXXX" }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRequest } from '../auth/firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Supabase クライアント（Service Role）
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ライセンスキー形式: PPPP-PLAN-YYMM-HASH-SIG1-SIG2
const LICENSE_KEY_REGEX = /^(INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN|ISOF)-(FREE|TRIAL|BIZ|ENT)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

interface ActivateRequest {
  license_key: string;
}

interface ActivateResponse {
  success: boolean;
  product_code?: string;
  plan?: string;
  expires_at?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ActivateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // トークン検証
  const authResult = await verifyRequest(req.headers.authorization);
  if (!authResult.success || !authResult.uid) {
    return res.status(401).json({ success: false, error: '認証エラー' });
  }

  const { license_key } = req.body as ActivateRequest;

  if (!license_key) {
    return res.status(400).json({ success: false, error: 'ライセンスキーが必要です' });
  }

  // 形式チェック
  const match = LICENSE_KEY_REGEX.exec(license_key.toUpperCase().trim());
  if (!match) {
    return res.status(400).json({ success: false, error: 'ライセンスキーの形式が無効です' });
  }

  const [, productCode, plan, yymm] = match;

  // 有効期限計算（YYMMから12ヶ月後）
  const year = 2000 + parseInt(yymm.substring(0, 2), 10);
  const month = parseInt(yymm.substring(2, 4), 10) - 1;
  const expiresAt = new Date(year, month + 12, 1);

  try {
    // ユーザー取得
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authResult.uid)
      .single();

    if (!user) {
      return res.status(400).json({ success: false, error: 'ユーザーが見つかりません' });
    }

    // キーが既に使われていないか確認
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('id, user_id')
      .eq('license_key', license_key.toUpperCase())
      .single();

    if (existingLicense) {
      if (existingLicense.user_id === user.id) {
        return res.status(400).json({ success: false, error: 'このライセンスは既に有効化されています' });
      } else {
        return res.status(400).json({ success: false, error: 'このライセンスキーは既に使用されています' });
      }
    }

    // ライセンス登録（upsert）
    const { data: license, error } = await supabase
      .from('licenses')
      .upsert(
        {
          user_id: user.id,
          product_code: productCode,
          plan: plan,
          license_key: license_key.toUpperCase(),
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
        },
        {
          onConflict: 'user_id,product_code',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('License activation error:', error);
      return res.status(500).json({ success: false, error: 'ライセンス登録に失敗しました' });
    }

    return res.status(200).json({
      success: true,
      product_code: productCode,
      plan: plan,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Activation error:', error);
    return res.status(500).json({ success: false, error: 'サーバーエラー' });
  }
}
