/**
 * /api/auth/verify - トークン検証 + ユーザー自動登録
 *
 * Vercel Functions テンプレート
 *
 * 機能:
 *   - Firebase IDトークン検証
 *   - Supabase users テーブルに upsert
 *   - ユーザー情報を返却
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRequest, type AuthResult } from '../auth/firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Supabase クライアント（Service Role）
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VerifyResponse {
  success: boolean;
  user?: {
    id: string;
    firebase_uid: string;
    email: string | null;
    display_name: string | null;
    photo_url: string | null;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  // POST のみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // トークン検証
  const authResult = await verifyRequest(req.headers.authorization);

  if (!authResult.success || !authResult.uid) {
    return res.status(401).json({
      success: false,
      error: authResult.error || '認証に失敗しました',
    });
  }

  try {
    // Supabase に upsert
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          firebase_uid: authResult.uid,
          email: authResult.email || null,
          display_name: authResult.name || null,
          photo_url: authResult.picture || null,
        },
        {
          onConflict: 'firebase_uid',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({
        success: false,
        error: 'ユーザー登録に失敗しました',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        display_name: user.display_name,
        photo_url: user.photo_url,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
    });
  }
}
