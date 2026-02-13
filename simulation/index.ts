/**
 * シミュレーション / デモデータ モジュール
 *
 * web-app-auto-interview から以下のようにインポートして利用:
 *
 * ```typescript
 * import {
 *   generateAllInterviews,
 *   convertToSessionData,
 *   DemoDataGenerator,
 * } from '@/insight-common/simulation';
 *
 * // 1000件の InterviewSessionData を生成
 * const interviews = generateAllInterviews(1000, 42);
 * const sessionDataList = convertToSessionData(interviews, 42);
 *
 * // または事前生成済み JSONL ファイルを読み込み
 * // simulation/generated-data/demo-sessions.jsonl
 * ```
 */

// ペルソナ定義
export {
  ALL_INTERVIEWEE_PERSONAS,
  type IntervieweePersona,
} from './personas/interviewee-personas.js';

export {
  ALL_INTERVIEWER_PERSONAS,
  type InterviewerPersona,
  type InterviewerDemand,
  type InterviewQuestion,
  type InterviewPattern,
} from './personas/interviewer-personas.js';

// コンテンツ生成
export {
  InterviewContentGenerator,
  generateAllInterviews,
  generatePairInterview,
  type GeneratedInterview,
  type GeneratedAnswer,
} from './content-generator.js';

// シミュレーションエンジン
export {
  SimulationEngine,
  formatSummaryReport,
  type InterviewSimulationResult,
  type SimulationSummary,
  type MatchResult,
  type MatchedUtterance,
} from './simulation-engine.js';

// デモデータ生成（InterviewSessionData 形式）
export {
  DemoDataGenerator,
  convertToSessionData,
  sessionDataToJsonl,
  generateDemoDataSummary,
} from './demo-data-generator.js';

// ユーザーストーリー
export {
  USER_STORIES,
  getStoriesByPattern,
  getStoriesByIndustry,
  type UserStory,
} from './user-stories.js';
