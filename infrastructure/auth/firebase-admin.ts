/**
 * Firebase Admin SDK - サーバーサイド認証
 *
 * 用途:
 *   - IDトークン検証
 *   - カスタムトークン発行（テスト用）
 *   - ユーザー情報取得
 *
 * 環境変数:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';

// シングルトン
let app: App | null = null;
let auth: Auth | null = null;

/**
 * Firebase Admin 初期化
 */
export function initFirebaseAdmin(): App {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    auth = getAuth(app);
    return app;
  }

  // 環境変数から認証情報を取得
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin の環境変数が設定されていません: ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  auth = getAuth(app);
  return app;
}

/**
 * Firebase Auth インスタンス取得
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    initFirebaseAdmin();
  }
  return auth!;
}

/**
 * IDトークン検証
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  const auth = getFirebaseAuth();
  return auth.verifyIdToken(idToken);
}

/**
 * UIDからユーザー情報取得
 */
export async function getUser(uid: string) {
  const auth = getFirebaseAuth();
  return auth.getUser(uid);
}

/**
 * 検証結果の型
 */
export interface AuthResult {
  success: boolean;
  uid?: string;
  email?: string;
  name?: string;
  picture?: string;
  error?: string;
}

/**
 * リクエストヘッダーからトークンを検証
 * 開発環境では TEST_FIREBASE_UID を使用可能
 */
export async function verifyRequest(
  authHeader: string | null | undefined
): Promise<AuthResult> {
  // 開発環境: テストUID使用
  if (process.env.NODE_ENV === 'development' && process.env.TEST_FIREBASE_UID) {
    return {
      success: true,
      uid: process.env.TEST_FIREBASE_UID,
      email: 'dev@test.local',
      name: 'Dev User',
    };
  }

  // トークンチェック
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'Authorization ヘッダーがありません' };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = await verifyIdToken(token);
    return {
      success: true,
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'トークン検証エラー',
    };
  }
}
