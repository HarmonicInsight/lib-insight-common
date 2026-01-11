/**
 * Firebase Client SDK - クライアントサイド認証
 *
 * 用途:
 *   - Google認証
 *   - IDトークン取得
 *   - 認証状態監視
 *
 * 環境変数:
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

// シングルトン
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Firebase Client 初期化
 */
export function initFirebaseClient(): FirebaseApp {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    auth = getAuth(app);
    return app;
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  if (!config.apiKey || !config.authDomain || !config.projectId) {
    throw new Error(
      'Firebase Client の環境変数が設定されていません: ' +
      'NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    );
  }

  app = initializeApp(config);
  auth = getAuth(app);
  return app;
}

/**
 * Firebase Auth インスタンス取得
 */
export function getFirebaseClientAuth(): Auth {
  if (!auth) {
    initFirebaseClient();
  }
  return auth!;
}

/**
 * Google認証でサインイン
 */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseClientAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * サインアウト
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseClientAuth();
  await firebaseSignOut(auth);
}

/**
 * 現在のユーザー取得
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseClientAuth();
  return auth.currentUser;
}

/**
 * IDトークン取得（API呼び出し用）
 */
export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
}

/**
 * 認証状態監視
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseClientAuth();
  return onAuthStateChanged(auth, callback);
}

/**
 * API呼び出し用ヘッダー生成
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('認証が必要です');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
