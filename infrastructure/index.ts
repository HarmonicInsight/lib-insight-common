/**
 * Insight Apps Infrastructure
 *
 * Firebase + Supabase ハイブリッドアーキテクチャの共通基盤
 */

// Auth
export {
  initFirebaseAdmin,
  getFirebaseAuth,
  verifyIdToken,
  verifyRequest,
  getUser,
  type AuthResult,
} from './auth/firebase-admin';

export {
  initFirebaseClient,
  getFirebaseClientAuth,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getIdToken,
  onAuthChange,
  getAuthHeaders,
} from './auth/firebase-client';

// Types
export interface User {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface License {
  id: string;
  user_id: string;
  product_code: string;
  plan: 'FREE' | 'STD' | 'PRO' | 'ENT';
  license_key: string | null;
  activated_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'FREE' | 'STD' | 'PRO' | 'ENT';
  owner_id: string;
  max_members: number;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface EntitlementResult {
  allowed: boolean;
  plan: string;
  expires_at: string | null;
  reason?: string;
}

// Constants
export const PRODUCT_CODES = {
  INSS: 'InsightSlide Standard',
  INSP: 'InsightSlide Pro',
  INPY: 'InsightPy',
  FGIN: 'ForguncyInsight',
} as const;

export const PLANS = {
  FREE: { name: 'Free', priority: 0 },
  STD: { name: 'Standard', priority: 1 },
  PRO: { name: 'Pro', priority: 2 },
  ENT: { name: 'Enterprise', priority: 3 },
} as const;

export const FEATURE_MATRIX: Record<string, string[]> = {
  // 基本機能（全プラン）
  'basic': ['FREE', 'STD', 'PRO', 'ENT'],

  // Standard以上
  'export_pdf': ['STD', 'PRO', 'ENT'],
  'export_excel': ['STD', 'PRO', 'ENT'],
  'cloud_sync': ['STD', 'PRO', 'ENT'],

  // Pro以上
  'batch_process': ['PRO', 'ENT'],
  'advanced_filter': ['PRO', 'ENT'],
  'priority_support': ['PRO', 'ENT'],

  // Enterprise専用
  'api_access': ['ENT'],
  'sso': ['ENT'],
  'audit_log': ['ENT'],
  'custom_branding': ['ENT'],
};
