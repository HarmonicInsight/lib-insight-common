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
  plan: 'TRIAL' | 'STD' | 'PRO' | 'ENT';
  license_key: string | null;
  activated_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'TRIAL' | 'STD' | 'PRO' | 'ENT';
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

// License
export {
  ServerLicenseChecker,
  ClientLicenseManager,
  getPlanDisplayName,
  getProductDisplayName,
  getRequiredPlanForFeature,
  getDaysRemaining,
  getLicenseStatusMessage,
  canAccessFeature,
  isPlanAtLeast,
  getPlanLimits,
  type LicenseInfo,
  type LicenseCheckResult,
  type FeatureCheckResult,
  type UsageInfo,
  type ClientLicenseState,
} from './license';

// Product Config
export {
  type ProductCode,
  type PlanCode,
  type PlanLimits,
  PRODUCTS,
  DEFAULT_PLAN_LIMITS,
  INMV_PLAN_LIMITS,
  PRODUCT_PLAN_LIMITS,
} from '../config/products';

// Constants (legacy - use config/products.ts instead)
export const PRODUCT_CODES = {
  INSS: 'InsightOfficeSlide',
  IOSH: 'InsightOfficeSheet',
  IOSD: 'InsightOfficeDoc',
  INPY: 'InsightPy',
  INMV: 'InsightCast',
  INBT: 'InsightBot',
  INCA: 'InsightNoCodeAnalyzer',
  INIG: 'InsightImageGen',
  IVIN: 'InterviewInsight',
} as const;

export const PLANS = {
  TRIAL: { name: 'Trial', priority: 0 },
  STD: { name: 'Standard', priority: 1 },
  PRO: { name: 'Professional', priority: 2 },
  ENT: { name: 'Enterprise', priority: 3 },
} as const;

// Re-export FEATURE_MATRIX from config/products.ts
export { FEATURE_MATRIX } from '../config/products';
