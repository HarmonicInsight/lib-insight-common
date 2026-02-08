/**
 * インタビューデータマート定義
 *
 * ============================================================================
 * 【概要】
 * ============================================================================
 *
 * インタビューで収集されたテキストデータを TDWH 4 層アーキテクチャに
 * マッピングし、目的に応じたマートを自動生成する。
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  インタビューデータの TDWH マッピング                            │
 * │                                                                 │
 * │  Layer 1: データレイク                                          │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  インタビューセッション → RawDocument                     │    │
 * │  │  音声文字起こし・テキスト回答をそのまま格納               │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 2: キュレーション                                        │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  LLM 構造化出力 → CuratedRecord                         │    │
 * │  │  Q&Aペアから要約・要点・決定事項・リスク等を抽出          │    │
 * │  │  課題抽出（カテゴリ・深刻度・根本原因仮説）               │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 3: マート（目的別ナレッジストア）                         │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  課題マート: 課題・問題点を集約、カテゴリ横断で分析       │    │
 * │  │  知見マート: 決定事項・ベストプラクティスを蓄積           │    │
 * │  │  要件マート: 要件・仕様を体系化                          │    │
 * │  │  リスクマート: リスク・懸念事項を管理                     │    │
 * │  │  ナレッジマート: 専門知識・ノウハウを保存                 │    │
 * │  │  声マート: 感情・温度感・本音を可視化                     │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * │                              ↓                                  │
 * │  Layer 4: ディスパッチ                                          │
 * │  ┌─────────────────────────────────────────────────────────┐    │
 * │  │  「現場の課題は？」→ 課題マート                          │    │
 * │  │  「前回の決定事項は？」→ 知見マート                      │    │
 * │  │  「リスクと対策は？」→ リスクマート + 知見マート          │    │
 * │  └─────────────────────────────────────────────────────────┘    │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## app-auto-interview-web との連携
 *
 * ```
 * app-auto-interview-web                 insight-common/tdwh
 * ┌─────────────────┐                   ┌─────────────────────┐
 * │ Session          │──────────────────→│ RawDocument          │
 * │ Answer           │                   │ (Layer 1)            │
 * │ (text/audio)     │                   └──────────┬───────────┘
 * ├─────────────────┤                              │
 * │ StructuredOutput │──────────────────→┌──────────▼───────────┐
 * │ ExtractedProblem │                   │ CuratedRecord        │
 * │ InterviewSignal  │                   │ (Layer 2)            │
 * └─────────────────┘                   └──────────┬───────────┘
 *                                                   │
 *                                        ┌──────────▼───────────┐
 *                                        │ Mart (Layer 3)       │
 *                                        │ 課題 / 知見 / 要件   │
 *                                        │ リスク / ナレッジ / 声│
 *                                        └──────────────────────┘
 * ```
 */

import type {
  MartDefinition,
  SourceDefinition,
  TdwhInstance,
  CuratedRecord,
  Chunk,
  ChunkStrategyConfig,
  IntentClassification,
  MartQuery,
  CurationSourceType,
  CurationConfig,
} from './types';
import { DEFAULT_CURATION_CONFIG } from './types';

// =============================================================================
// インタビューデータ型（app-auto-interview-web との共通型）
// =============================================================================

/** インタビューの構造化出力（LLM処理後） */
export interface InterviewStructuredOutput {
  summary: string;
  key_points: string[];
  decisions: string[];
  open_questions: string[];
  risks: string[];
  stakeholders: string[];
  requirements: string[];
  evidence_refs: string[];
}

/** 課題カテゴリ */
export type ProblemCategory = 'process' | 'tool' | 'people' | 'communication' | 'system';

/** 深刻度レベル (1-5) */
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

/** 抽出された課題 */
export interface InterviewExtractedProblem {
  description: string;
  category: ProblemCategory;
  affected_scope: string;
  frequency: string;
  severity: SeverityLevel;
  root_cause_hypothesis: string;
  evidence: string;
}

/** 課題抽出結果 */
export interface InterviewProblemExtractionResult {
  problems: InterviewExtractedProblem[];
  improvement_hints: string[];
  unspoken_concerns: string[];
}

/** インタビューシグナル（セッション集約） */
export interface InterviewSignalData {
  sentiment_score: number;
  emotions: Array<{ emotion: string; intensity: number }>;
  problems: InterviewExtractedProblem[];
  topics: string[];
  answer_hesitation: number;
  answer_brevity: number;
  evasion_score: number;
}

/** インタビューセッション情報 */
export interface InterviewSessionInfo {
  sessionId: string;
  title: string;
  /** 組織次元: 会社/プロジェクト（Level 0） */
  clientOrProject?: string;
  /** 組織次元: 部署（Level 1） */
  department?: string;
  templateName: string;
  templateDomain: string;
  interviewerName?: string;
  /** 組織次元: 担当者（Level 2） */
  intervieweeName?: string;
  tags: string[];
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  completedAt?: string;
  createdAt: string;
}

/** インタビュー回答（Q&Aペア） */
export interface InterviewAnswer {
  questionId: string;
  questionText: string;
  questionOrder: number;
  rawText?: string;
  transcribedText?: string;
  structuredOutput?: InterviewStructuredOutput;
  answeredAt: string;
}

/** マートへの投入用セッションデータ */
export interface InterviewSessionData {
  session: InterviewSessionInfo;
  answers: InterviewAnswer[];
  aggregatedOutput?: InterviewStructuredOutput;
  signal?: InterviewSignalData;
  problemExtraction?: InterviewProblemExtractionResult;
}

// =============================================================================
// マート ID 定数
// =============================================================================

/** インタビューマート ID */
export const INTERVIEW_MART_IDS = {
  /** 課題・問題点マート */
  PROBLEMS: 'interview_problems',
  /** 知見・決定事項マート */
  INSIGHTS: 'interview_insights',
  /** 要件マート */
  REQUIREMENTS: 'interview_requirements',
  /** リスク・懸念事項マート */
  RISKS: 'interview_risks',
  /** ナレッジ・ノウハウマート */
  KNOWLEDGE: 'interview_knowledge',
  /** 声・感情マート */
  VOICES: 'interview_voices',
} as const;

export type InterviewMartId = (typeof INTERVIEW_MART_IDS)[keyof typeof INTERVIEW_MART_IDS];

// =============================================================================
// チャンク戦略設定
// =============================================================================

/** Q&Aペア型チャンク戦略（1問1答 = 1チャンク） */
const CHUNK_STRATEGY_QA_PAIR: ChunkStrategyConfig = {
  type: 'interview_qa_pair',
  minTokens: 50,
  maxTokens: 1000,
  overlapTokens: 0,
};

/** 課題型チャンク戦略（1課題 = 1チャンク） */
const CHUNK_STRATEGY_PROBLEM: ChunkStrategyConfig = {
  type: 'interview_problem',
  minTokens: 30,
  maxTokens: 500,
  overlapTokens: 0,
};

/** 知見型チャンク戦略（1知見/決定事項 = 1チャンク） */
const CHUNK_STRATEGY_INSIGHT: ChunkStrategyConfig = {
  type: 'interview_insight',
  minTokens: 20,
  maxTokens: 800,
  overlapTokens: 50,
};

// =============================================================================
// マート定義
// =============================================================================

/** 課題・問題点マート */
export const MART_INTERVIEW_PROBLEMS: MartDefinition = {
  id: INTERVIEW_MART_IDS.PROBLEMS,
  name: '課題・問題点マート',
  description:
    'インタビューから抽出された課題・問題点を集約。カテゴリ（プロセス/ツール/人/コミュニケーション/システム）' +
    '横断で深刻度・頻度・影響範囲を分析可能。',
  collectionName: 'interview_problems',
  chunkStrategy: CHUNK_STRATEGY_PROBLEM,
  useCases: [
    '現場で最も深刻な課題は何か',
    'プロセスに関する問題点を一覧で見たい',
    'コミュニケーションの課題はどの部門で多いか',
    '深刻度が高い課題から優先順位を付けたい',
    '根本原因が共通している課題をまとめたい',
  ],
  metadataSchema: {
    category: 'string',
    severity: 'integer',
    frequency: 'string',
    affected_scope: 'string',
    root_cause_hypothesis: 'string',
    session_id: 'string',
    client_or_project: 'string',
    template_domain: 'string',
    interviewee_name: 'string',
    extracted_at: 'date',
  },
};

/** 知見・決定事項マート */
export const MART_INTERVIEW_INSIGHTS: MartDefinition = {
  id: INTERVIEW_MART_IDS.INSIGHTS,
  name: '知見・決定事項マート',
  description:
    'インタビューから得られた知見・決定事項・ベストプラクティスを蓄積。' +
    'プロジェクトや案件を横断して、過去の判断や学びを検索可能。',
  collectionName: 'interview_insights',
  chunkStrategy: CHUNK_STRATEGY_INSIGHT,
  useCases: [
    '過去のプロジェクトで決定された方針は',
    'このテーマに関するベストプラクティスは',
    '過去の類似案件でどういう判断がされたか',
    '重要な教訓やキーポイントをまとめたい',
    'ステークホルダーが関与した決定を探したい',
  ],
  metadataSchema: {
    insight_type: 'string',
    stakeholders: 'list[string]',
    session_id: 'string',
    client_or_project: 'string',
    template_domain: 'string',
    interviewee_name: 'string',
    extracted_at: 'date',
  },
};

/** 要件マート */
export const MART_INTERVIEW_REQUIREMENTS: MartDefinition = {
  id: INTERVIEW_MART_IDS.REQUIREMENTS,
  name: '要件マート',
  description:
    'インタビューから抽出された要件・仕様を体系的に管理。' +
    '機能要件・非機能要件の分類や、要件の出自（誰が・いつ・どの文脈で言ったか）を追跡可能。',
  collectionName: 'interview_requirements',
  chunkStrategy: CHUNK_STRATEGY_INSIGHT,
  useCases: [
    'この機能に関する要件を確認したい',
    '誰がどの要件を出したか追跡したい',
    '未対応の要件を洗い出したい',
    '矛盾する要件がないか確認したい',
    'エビデンス付きで要件を一覧化したい',
  ],
  metadataSchema: {
    requirement_type: 'string',
    priority: 'string',
    stakeholders: 'list[string]',
    evidence_refs: 'list[string]',
    session_id: 'string',
    client_or_project: 'string',
    template_domain: 'string',
    interviewee_name: 'string',
    extracted_at: 'date',
  },
};

/** リスク・懸念事項マート */
export const MART_INTERVIEW_RISKS: MartDefinition = {
  id: INTERVIEW_MART_IDS.RISKS,
  name: 'リスク・懸念事項マート',
  description:
    'インタビューから検出されたリスク・懸念事項・未解決課題を管理。' +
    '明示的に語られたリスクだけでなく、回避的回答や躊躇から推定される潜在的懸念も含む。',
  collectionName: 'interview_risks',
  chunkStrategy: CHUNK_STRATEGY_PROBLEM,
  useCases: [
    'プロジェクトのリスク要因を把握したい',
    '回答者が言い淀んだ懸念事項を確認したい',
    '未解決の課題を一覧化したい',
    'リスクの深刻度と対策状況を確認したい',
    '複数インタビューで共通するリスクを発見したい',
  ],
  metadataSchema: {
    risk_type: 'string',
    severity: 'integer',
    is_explicit: 'boolean',
    open_questions: 'list[string]',
    session_id: 'string',
    client_or_project: 'string',
    template_domain: 'string',
    interviewee_name: 'string',
    extracted_at: 'date',
  },
};

/** ナレッジ・ノウハウマート */
export const MART_INTERVIEW_KNOWLEDGE: MartDefinition = {
  id: INTERVIEW_MART_IDS.KNOWLEDGE,
  name: 'ナレッジ・ノウハウマート',
  description:
    '専門家インタビューから抽出されたナレッジ・ノウハウ・暗黙知を保存。' +
    'Q&Aペア形式で文脈を保持し、エキスパートの経験則や判断基準を検索可能にする。',
  collectionName: 'interview_knowledge',
  chunkStrategy: CHUNK_STRATEGY_QA_PAIR,
  useCases: [
    'この分野の専門家の見解を聞きたい',
    '過去の事例でどう対処したかノウハウを探す',
    '引き継ぎに必要な暗黙知を確認したい',
    'ベテランの判断基準や経験則を参照したい',
    '特定テーマについてのQ&Aを検索したい',
  ],
  metadataSchema: {
    domain: 'string',
    topic: 'string',
    expertise_level: 'string',
    question_text: 'string',
    session_id: 'string',
    client_or_project: 'string',
    template_domain: 'string',
    interviewee_name: 'string',
    extracted_at: 'date',
  },
};

/** 声・感情マート */
export const MART_INTERVIEW_VOICES: MartDefinition = {
  id: INTERVIEW_MART_IDS.VOICES,
  name: '声・感情マート',
  description:
    '回答者の感情・温度感・本音を可視化するマート。' +
    'センチメントスコア、感情分析、回避傾向、簡潔度からインタビューの質と回答者の本音を把握。',
  collectionName: 'interview_voices',
  chunkStrategy: CHUNK_STRATEGY_QA_PAIR,
  useCases: [
    '回答者の温度感が最も高い/低いテーマは何か',
    '回避的な回答が多いトピックを特定したい',
    '経時変化でモチベーション低下を検知したい',
    '本音と建前の乖離がありそうな箇所を確認したい',
    '部門間で温度差がある課題を発見したい',
  ],
  metadataSchema: {
    sentiment_score: 'float',
    dominant_emotion: 'string',
    evasion_score: 'float',
    answer_brevity: 'float',
    topics: 'list[string]',
    session_id: 'string',
    client_or_project: 'string',
    template_domain: 'string',
    interviewee_name: 'string',
    extracted_at: 'date',
  },
};

/** 全インタビューマート定義 */
export const ALL_INTERVIEW_MARTS: MartDefinition[] = [
  MART_INTERVIEW_PROBLEMS,
  MART_INTERVIEW_INSIGHTS,
  MART_INTERVIEW_REQUIREMENTS,
  MART_INTERVIEW_RISKS,
  MART_INTERVIEW_KNOWLEDGE,
  MART_INTERVIEW_VOICES,
];

// =============================================================================
// ソース定義
// =============================================================================

/** インタビューデータのソース定義 */
export const INTERVIEW_SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    id: 'interview_session_text',
    name: 'インタビューセッション（テキスト）',
    url: 'internal://interview-sessions/text',
    type: 'manual',
    mart: INTERVIEW_MART_IDS.KNOWLEDGE,
    schedule: 'daily',
    description: 'テキスト入力されたインタビュー回答',
  },
  {
    id: 'interview_session_audio',
    name: 'インタビューセッション（音声文字起こし）',
    url: 'internal://interview-sessions/audio',
    type: 'transcript',
    mart: INTERVIEW_MART_IDS.KNOWLEDGE,
    schedule: 'daily',
    description: '音声録音から文字起こしされたインタビュー回答',
  },
];

// =============================================================================
// TDWH インスタンス定義
// =============================================================================

/** インタビュー TDWH インスタンス */
export const INTERVIEW_TDWH_INSTANCE: TdwhInstance = {
  id: 'interview',
  name: 'インタビューデータウェアハウス',
  industry: 'cross_industry',
  marts: ALL_INTERVIEW_MARTS,
  sources: INTERVIEW_SOURCE_DEFINITIONS,
  embeddingConfigKey: 'openai-small',
};

// =============================================================================
// キュレーション設定
// =============================================================================

/** インタビュー用キュレーション設定 */
export const INTERVIEW_CURATION_CONFIG: CurationConfig = {
  ...DEFAULT_CURATION_CONFIG,
  enableAutoClassification: true,
  enableEntityExtraction: true,
  enableSummaryGeneration: true,
  includeLowQuality: false,
};

// =============================================================================
// Layer 1: セッション → RawDocument 変換
// =============================================================================

/**
 * インタビューセッションを RawDocument に変換する
 *
 * セッション内の全Q&Aを結合し、データレイク格納用の生ドキュメントを生成。
 */
export function sessionToRawDocument(
  data: InterviewSessionData
): {
  sourceId: string;
  url: string;
  title: string;
  content: string;
  contentType: 'text' | 'transcript';
  crawledAt: string;
  metadata: Record<string, unknown>;
} {
  const { session, answers } = data;

  const hasAudio = answers.some((a) => a.transcribedText && !a.rawText);
  const contentType = hasAudio ? 'transcript' as const : 'text' as const;
  const sourceId = hasAudio ? 'interview_session_audio' : 'interview_session_text';

  const contentParts = answers.map((a) => {
    const answerText = a.transcribedText || a.rawText || '';
    return `Q${a.questionOrder}: ${a.questionText}\nA: ${answerText}`;
  });

  return {
    sourceId,
    url: `internal://interview-sessions/${session.sessionId}`,
    title: `${session.title} — ${session.intervieweeName || '回答者未設定'}`,
    content: contentParts.join('\n\n'),
    contentType,
    crawledAt: session.completedAt || session.createdAt,
    metadata: {
      sessionId: session.sessionId,
      clientOrProject: session.clientOrProject,
      department: session.department,
      templateName: session.templateName,
      templateDomain: session.templateDomain,
      interviewerName: session.interviewerName,
      intervieweeName: session.intervieweeName,
      tags: session.tags,
      answerCount: answers.length,
    },
  };
}

// =============================================================================
// Layer 2: 構造化出力 → CuratedRecord 変換
// =============================================================================

/**
 * マート分類タイプ: CuratedRecord をどのマートに振り分けるかの種別
 */
export type InterviewCurationCategory =
  | 'problem'
  | 'insight'
  | 'requirement'
  | 'risk'
  | 'knowledge'
  | 'voice';

/**
 * インタビューセッションデータからキュレーション済みレコードを生成する
 *
 * 1つのセッションから複数のカテゴリ別 CuratedRecord を生成:
 * - 課題: ExtractedProblem ごとに1レコード
 * - 知見: key_points + decisions それぞれ1レコード
 * - 要件: requirements それぞれ1レコード
 * - リスク: risks + open_questions それぞれ1レコード
 * - ナレッジ: Q&Aペアごとに1レコード
 * - 声: シグナルデータごとに1レコード
 */
export function sessionToCuratedRecords(
  data: InterviewSessionData,
  curationVersion: string = '1.0.0'
): Array<CuratedRecord & { suggestedMartId: string }> {
  const records: Array<CuratedRecord & { suggestedMartId: string }> = [];
  const { session, answers, aggregatedOutput, signal, problemExtraction } = data;
  const now = new Date().toISOString();
  const sourceType: CurationSourceType = 'interview';

  const baseRecord = {
    rawDocumentHash: session.sessionId,
    sourceId: `interview_session_text`,
    sourceUrl: `internal://interview-sessions/${session.sessionId}`,
    sourceType,
    quality: 'auto_extracted' as const,
    qualityScore: 0.8,
    qualityNotes: [] as string[],
    entities: [],
    curatedAt: now,
    curationVersion,
  };

  // --- 課題レコード ---
  const problems = problemExtraction?.problems || signal?.problems || [];
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    records.push({
      ...baseRecord,
      id: `${session.sessionId}_problem_${i}`,
      title: `課題: ${p.description.slice(0, 60)}`,
      content: [
        `【課題】${p.description}`,
        `【カテゴリ】${p.category}`,
        `【深刻度】${p.severity}/5`,
        `【頻度】${p.frequency}`,
        `【影響範囲】${p.affected_scope}`,
        `【根本原因仮説】${p.root_cause_hypothesis}`,
        `【エビデンス】${p.evidence}`,
      ].join('\n'),
      summary: p.description,
      suggestedMartId: INTERVIEW_MART_IDS.PROBLEMS,
      metadata: {
        category: p.category,
        severity: p.severity,
        frequency: p.frequency,
        affected_scope: p.affected_scope,
        root_cause_hypothesis: p.root_cause_hypothesis,
        sessionId: session.sessionId,
        clientOrProject: session.clientOrProject,
        department: session.department,
        intervieweeName: session.intervieweeName,
        templateDomain: session.templateDomain,
      },
    });
  }

  // --- 改善ヒント・未言及の懸念（リスクマートへ投入） ---
  if (problemExtraction) {
    for (let i = 0; i < problemExtraction.unspoken_concerns.length; i++) {
      const concern = problemExtraction.unspoken_concerns[i];
      records.push({
        ...baseRecord,
        id: `${session.sessionId}_concern_${i}`,
        title: `潜在的懸念: ${concern.slice(0, 60)}`,
        content: `【潜在的懸念（回答態度から推定）】\n${concern}`,
        summary: concern,
        suggestedMartId: INTERVIEW_MART_IDS.RISKS,
        qualityScore: 0.6,
        qualityNotes: ['回答態度から推定された潜在的懸念（明示的な発言ではない）'],
        metadata: {
          risk_type: 'unspoken_concern',
          is_explicit: false,
          sessionId: session.sessionId,
          clientOrProject: session.clientOrProject,
          department: session.department,
          intervieweeName: session.intervieweeName,
          templateDomain: session.templateDomain,
        },
      });
    }
  }

  // --- 集約出力からのレコード生成 ---
  if (aggregatedOutput) {
    // 知見: key_points
    for (let i = 0; i < aggregatedOutput.key_points.length; i++) {
      const kp = aggregatedOutput.key_points[i];
      records.push({
        ...baseRecord,
        id: `${session.sessionId}_keypoint_${i}`,
        title: `キーポイント: ${kp.slice(0, 60)}`,
        content: kp,
        summary: kp,
        suggestedMartId: INTERVIEW_MART_IDS.INSIGHTS,
        metadata: {
          insight_type: 'key_point',
          stakeholders: aggregatedOutput.stakeholders,
          sessionId: session.sessionId,
          clientOrProject: session.clientOrProject,
          department: session.department,
          intervieweeName: session.intervieweeName,
          templateDomain: session.templateDomain,
        },
      });
    }

    // 知見: decisions
    for (let i = 0; i < aggregatedOutput.decisions.length; i++) {
      const d = aggregatedOutput.decisions[i];
      records.push({
        ...baseRecord,
        id: `${session.sessionId}_decision_${i}`,
        title: `決定事項: ${d.slice(0, 60)}`,
        content: d,
        summary: d,
        suggestedMartId: INTERVIEW_MART_IDS.INSIGHTS,
        metadata: {
          insight_type: 'decision',
          stakeholders: aggregatedOutput.stakeholders,
          sessionId: session.sessionId,
          clientOrProject: session.clientOrProject,
          department: session.department,
          intervieweeName: session.intervieweeName,
          templateDomain: session.templateDomain,
        },
      });
    }

    // 要件: requirements
    for (let i = 0; i < aggregatedOutput.requirements.length; i++) {
      const r = aggregatedOutput.requirements[i];
      records.push({
        ...baseRecord,
        id: `${session.sessionId}_requirement_${i}`,
        title: `要件: ${r.slice(0, 60)}`,
        content: r,
        summary: r,
        suggestedMartId: INTERVIEW_MART_IDS.REQUIREMENTS,
        metadata: {
          requirement_type: 'interview_extracted',
          stakeholders: aggregatedOutput.stakeholders,
          evidence_refs: aggregatedOutput.evidence_refs,
          sessionId: session.sessionId,
          clientOrProject: session.clientOrProject,
          department: session.department,
          intervieweeName: session.intervieweeName,
          templateDomain: session.templateDomain,
        },
      });
    }

    // リスク: risks
    for (let i = 0; i < aggregatedOutput.risks.length; i++) {
      const r = aggregatedOutput.risks[i];
      records.push({
        ...baseRecord,
        id: `${session.sessionId}_risk_${i}`,
        title: `リスク: ${r.slice(0, 60)}`,
        content: r,
        summary: r,
        suggestedMartId: INTERVIEW_MART_IDS.RISKS,
        metadata: {
          risk_type: 'explicit',
          is_explicit: true,
          open_questions: aggregatedOutput.open_questions,
          sessionId: session.sessionId,
          clientOrProject: session.clientOrProject,
          department: session.department,
          intervieweeName: session.intervieweeName,
          templateDomain: session.templateDomain,
        },
      });
    }

    // リスク: open_questions（未解決事項もリスクマートへ）
    for (let i = 0; i < aggregatedOutput.open_questions.length; i++) {
      const oq = aggregatedOutput.open_questions[i];
      records.push({
        ...baseRecord,
        id: `${session.sessionId}_openq_${i}`,
        title: `未解決事項: ${oq.slice(0, 60)}`,
        content: oq,
        summary: oq,
        suggestedMartId: INTERVIEW_MART_IDS.RISKS,
        qualityScore: 0.7,
        metadata: {
          risk_type: 'open_question',
          is_explicit: true,
          sessionId: session.sessionId,
          clientOrProject: session.clientOrProject,
          department: session.department,
          intervieweeName: session.intervieweeName,
          templateDomain: session.templateDomain,
        },
      });
    }
  }

  // --- ナレッジ: Q&Aペア ---
  for (const answer of answers) {
    const answerText = answer.transcribedText || answer.rawText;
    if (!answerText || answerText.length < 10) continue;

    records.push({
      ...baseRecord,
      id: `${session.sessionId}_qa_${answer.questionOrder}`,
      title: `Q&A: ${answer.questionText.slice(0, 60)}`,
      content: `質問: ${answer.questionText}\n回答: ${answerText}`,
      summary: answer.structuredOutput?.summary || answerText.slice(0, 200),
      suggestedMartId: INTERVIEW_MART_IDS.KNOWLEDGE,
      metadata: {
        domain: session.templateDomain,
        topic: answer.questionText,
        question_text: answer.questionText,
        question_order: answer.questionOrder,
        sessionId: session.sessionId,
        clientOrProject: session.clientOrProject,
        department: session.department,
        intervieweeName: session.intervieweeName,
        templateDomain: session.templateDomain,
      },
    });
  }

  // --- 声・感情: シグナルデータ ---
  if (signal) {
    const dominantEmotion = signal.emotions.length > 0
      ? signal.emotions.reduce((a, b) => (a.intensity > b.intensity ? a : b)).emotion
      : 'neutral';

    records.push({
      ...baseRecord,
      id: `${session.sessionId}_voice`,
      title: `インタビュー温度感: ${session.intervieweeName || '回答者'} — ${session.title}`,
      content: [
        `【センチメントスコア】${signal.sentiment_score.toFixed(2)}`,
        `【主要感情】${dominantEmotion}`,
        `【感情一覧】${signal.emotions.map((e) => `${e.emotion}(${e.intensity.toFixed(2)})`).join(', ')}`,
        `【トピック】${signal.topics.join(', ')}`,
        `【回避傾向】${signal.evasion_score.toFixed(2)}`,
        `【回答簡潔度】${signal.answer_brevity.toFixed(2)}`,
        `【回答躊躇度】${signal.answer_hesitation.toFixed(2)}`,
      ].join('\n'),
      summary: `センチメント${signal.sentiment_score.toFixed(2)}、主要感情: ${dominantEmotion}、回避傾向: ${signal.evasion_score.toFixed(2)}`,
      suggestedMartId: INTERVIEW_MART_IDS.VOICES,
      metadata: {
        sentiment_score: signal.sentiment_score,
        dominant_emotion: dominantEmotion,
        evasion_score: signal.evasion_score,
        answer_brevity: signal.answer_brevity,
        topics: signal.topics,
        sessionId: session.sessionId,
        clientOrProject: session.clientOrProject,
        department: session.department,
        intervieweeName: session.intervieweeName,
        templateDomain: session.templateDomain,
      },
    });
  }

  return records;
}

// =============================================================================
// Layer 3: CuratedRecord → Chunk 変換
// =============================================================================

/**
 * キュレーション済みレコードをマート投入用チャンクに変換する
 *
 * インタビューデータの場合、多くのレコードは既に適切な粒度で分割されているため、
 * 1 CuratedRecord = 1 Chunk のシンプルなマッピングを基本とする。
 * maxTokens を超える場合のみ分割する。
 */
export function curatedRecordToChunks(
  record: CuratedRecord & { suggestedMartId: string }
): Chunk[] {
  const now = new Date().toISOString();
  const martId = record.suggestedMartId;
  const mart = ALL_INTERVIEW_MARTS.find((m) => m.id === martId);
  const maxTokens = mart?.chunkStrategy.maxTokens || 1000;

  // 粗いトークン推定（日本語: 約1.5文字/トークン）
  const estimatedTokens = Math.ceil(record.content.length / 1.5);

  if (estimatedTokens <= maxTokens) {
    return [
      {
        id: `${record.id}_chunk_0`,
        content: record.content,
        curatedRecordId: record.id,
        sourceId: record.sourceId,
        sourceUrl: record.sourceUrl,
        chunkIndex: 0,
        martId,
        secondaryMarts: [],
        metadata: {
          ...record.metadata,
          title: record.title,
          summary: record.summary,
          quality: record.quality,
          qualityScore: record.qualityScore,
        },
        createdAt: now,
      },
    ];
  }

  // maxTokens 超えの場合は分割
  const charsPerChunk = Math.floor(maxTokens * 1.5);
  const overlapChars = Math.floor((mart?.chunkStrategy.overlapTokens || 0) * 1.5);
  const chunks: Chunk[] = [];
  let offset = 0;
  let chunkIndex = 0;

  while (offset < record.content.length) {
    const end = Math.min(offset + charsPerChunk, record.content.length);
    chunks.push({
      id: `${record.id}_chunk_${chunkIndex}`,
      content: record.content.slice(offset, end),
      curatedRecordId: record.id,
      sourceId: record.sourceId,
      sourceUrl: record.sourceUrl,
      chunkIndex,
      martId,
      secondaryMarts: [],
      metadata: {
        ...record.metadata,
        title: record.title,
        summary: record.summary,
        quality: record.quality,
        qualityScore: record.qualityScore,
        chunkTotal: -1, // 後で上書き
      },
      createdAt: now,
    });
    offset = end - overlapChars;
    chunkIndex++;
  }

  // chunkTotal を設定
  for (const chunk of chunks) {
    (chunk.metadata as Record<string, unknown>).chunkTotal = chunks.length;
  }

  return chunks;
}

// =============================================================================
// Layer 4: ディスパッチ — 意図分類ルール
// =============================================================================

/** インタビューマート向けの意図分類キーワード */
export const INTERVIEW_INTENT_KEYWORDS: Record<InterviewMartId, string[]> = {
  [INTERVIEW_MART_IDS.PROBLEMS]: [
    '課題', '問題', '問題点', '困っている', 'ボトルネック', '障害',
    'トラブル', '不満', '改善', 'issue', 'problem', 'challenge',
  ],
  [INTERVIEW_MART_IDS.INSIGHTS]: [
    '知見', '決定', '方針', 'ベストプラクティス', '教訓', '学び',
    'キーポイント', '要点', '判断', 'insight', 'decision', 'lesson',
  ],
  [INTERVIEW_MART_IDS.REQUIREMENTS]: [
    '要件', '仕様', '必要', '機能', '条件', 'ニーズ', '要望',
    'requirement', 'specification', 'need',
  ],
  [INTERVIEW_MART_IDS.RISKS]: [
    'リスク', '懸念', '心配', '不安', '未解決', '未対応', '危険',
    '脅威', 'risk', 'concern', 'threat',
  ],
  [INTERVIEW_MART_IDS.KNOWLEDGE]: [
    'ノウハウ', '知識', '経験', '専門', 'コツ', 'やり方', '方法',
    '引き継ぎ', 'ナレッジ', 'knowledge', 'expertise', 'how-to',
  ],
  [INTERVIEW_MART_IDS.VOICES]: [
    '感情', '温度感', '本音', 'モチベーション', '雰囲気', '態度',
    '満足度', 'sentiment', 'emotion', 'voice',
  ],
};

/**
 * クエリテキストからインタビューマートへの簡易意図分類を行う
 *
 * キーワードマッチングによるルールベースの分類。
 * 本番ではLLMベースの IntentClassifier に置き換えることを想定。
 */
export function classifyInterviewIntent(query: string): IntentClassification {
  const martScores: Record<string, number> = {};
  const queryLower = query.toLowerCase();

  for (const [martId, keywords] of Object.entries(INTERVIEW_INTENT_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > 0) {
      martScores[martId] = score;
    }
  }

  const sortedMarts = Object.entries(martScores)
    .sort(([, a], [, b]) => b - a)
    .map(([martId]) => martId);

  // マッチしない場合はナレッジマート（汎用）にフォールバック
  if (sortedMarts.length === 0) {
    sortedMarts.push(INTERVIEW_MART_IDS.KNOWLEDGE);
  }

  const martQueries: MartQuery[] = sortedMarts.map((martId, index) => ({
    mart: martId,
    query,
    priority: index + 1,
  }));

  return {
    primaryIntent: sortedMarts[0],
    martQueries,
    clarificationNeeded: [],
    reasoning: sortedMarts.length > 0
      ? `キーワードマッチにより ${sortedMarts.join(', ')} マートを対象と判定`
      : 'マッチするキーワードなし。ナレッジマートにフォールバック',
  };
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * インタビューマート定義を ID で取得する
 */
export function getInterviewMart(martId: InterviewMartId): MartDefinition | undefined {
  return ALL_INTERVIEW_MARTS.find((m) => m.id === martId);
}

/**
 * インタビューセッションデータを全レイヤーで処理し、マート投入用チャンクを生成する
 *
 * Layer 1 → Layer 2 → Layer 3 をワンショットで実行するユーティリティ。
 *
 * @returns マート ID ごとにグループ化されたチャンク
 */
export function processInterviewSession(
  data: InterviewSessionData,
  curationVersion: string = '1.0.0'
): Record<InterviewMartId, Chunk[]> {
  // Layer 2: キュレーション
  const curatedRecords = sessionToCuratedRecords(data, curationVersion);

  // Layer 3: チャンク化
  const result: Record<string, Chunk[]> = {};
  for (const martId of Object.values(INTERVIEW_MART_IDS)) {
    result[martId] = [];
  }

  for (const record of curatedRecords) {
    const chunks = curatedRecordToChunks(record);
    const martId = record.suggestedMartId;
    if (result[martId]) {
      result[martId].push(...chunks);
    }
  }

  return result as Record<InterviewMartId, Chunk[]>;
}

/**
 * 複数セッションを一括処理してマート別に集約する
 */
export function processInterviewSessions(
  sessions: InterviewSessionData[],
  curationVersion: string = '1.0.0'
): Record<InterviewMartId, Chunk[]> {
  const result: Record<string, Chunk[]> = {};
  for (const martId of Object.values(INTERVIEW_MART_IDS)) {
    result[martId] = [];
  }

  for (const session of sessions) {
    const sessionChunks = processInterviewSession(session, curationVersion);
    for (const [martId, chunks] of Object.entries(sessionChunks)) {
      result[martId].push(...chunks);
    }
  }

  return result as Record<InterviewMartId, Chunk[]>;
}

/**
 * マート別のチャンク統計を取得する
 */
export function getInterviewMartStats(
  chunks: Record<InterviewMartId, Chunk[]>
): Array<{
  martId: InterviewMartId;
  martName: string;
  chunkCount: number;
  sessionIds: string[];
}> {
  return Object.entries(chunks).map(([martId, martChunks]) => {
    const mart = ALL_INTERVIEW_MARTS.find((m) => m.id === martId);
    const sessionIds = [...new Set(
      martChunks.map((c) => (c.metadata as Record<string, unknown>).sessionId as string)
    )];
    return {
      martId: martId as InterviewMartId,
      martName: mart?.name || martId,
      chunkCount: martChunks.length,
      sessionIds,
    };
  });
}

// =============================================================================
// テンプレートドメイン → マート紐付け定義
// =============================================================================

/** テンプレートドメイン */
export type InterviewTemplateDomain =
  | 'quality'
  | 'requirements'
  | 'operations'
  | 'hr'
  | 'customer'
  | 'project'
  | 'knowledge'
  | 'general';

/**
 * ドメインごとのマート優先度定義
 *
 * primary: そのドメインのインタビューで最も重要なマート（必ず生成・目立つ表示）
 * secondary: 補助的に生成するマート（データがあれば表示）
 *
 * ```
 * テンプレートドメイン        主要マート                  補助マート
 * ─────────────────────────────────────────────────────────────────
 * quality (品質トラブル)    → 課題, リスク               知見, ナレッジ
 * requirements (要件定義)   → 要件, 知見                 リスク, ナレッジ
 * operations (業務引き継ぎ) → ナレッジ, 課題             知見, リスク
 * hr (退職/1on1)           → 声, 課題                   知見, ナレッジ
 * customer (顧客FB)        → 声, 要件, 課題             知見
 * project (振り返り)       → 知見, 課題                 リスク, ナレッジ
 * knowledge (知識引継)     → ナレッジ, 知見             課題
 * general (汎用)           → ナレッジ                   全マート
 * ```
 */
export interface DomainMartMapping {
  /** ドメイン表示名（日本語） */
  nameJa: string;
  /** ドメイン表示名（英語） */
  nameEn: string;
  /** 主要マート（優先度順、常に生成・表示） */
  primaryMarts: InterviewMartId[];
  /** 補助マート（データがあれば生成・表示） */
  secondaryMarts: InterviewMartId[];
  /** このドメインで特に注目すべき分析観点（日本語） */
  focusPointsJa: string[];
  /** このドメインで特に注目すべき分析観点（英語） */
  focusPointsEn: string[];
}

export const DOMAIN_MART_MAPPING: Record<InterviewTemplateDomain, DomainMartMapping> = {
  quality: {
    nameJa: '品質トラブル引き継ぎ',
    nameEn: 'Quality Trouble Handover',
    primaryMarts: [INTERVIEW_MART_IDS.PROBLEMS, INTERVIEW_MART_IDS.RISKS],
    secondaryMarts: [INTERVIEW_MART_IDS.INSIGHTS, INTERVIEW_MART_IDS.KNOWLEDGE],
    focusPointsJa: [
      '深刻度の高い課題の特定',
      '根本原因の仮説と検証状況',
      '未解決リスクの洗い出し',
      '是正措置の決定事項',
    ],
    focusPointsEn: [
      'Identify high-severity issues',
      'Root cause hypotheses and verification',
      'Unresolved risk identification',
      'Corrective action decisions',
    ],
  },
  requirements: {
    nameJa: 'システム要件定義',
    nameEn: 'System Requirements Capture',
    primaryMarts: [INTERVIEW_MART_IDS.REQUIREMENTS, INTERVIEW_MART_IDS.INSIGHTS],
    secondaryMarts: [INTERVIEW_MART_IDS.RISKS, INTERVIEW_MART_IDS.KNOWLEDGE],
    focusPointsJa: [
      '要件の網羅性確認',
      'ステークホルダー別の要望整理',
      '矛盾する要件の検出',
      '技術的制約の把握',
    ],
    focusPointsEn: [
      'Requirement coverage verification',
      'Organize requirements by stakeholder',
      'Detect conflicting requirements',
      'Technical constraint identification',
    ],
  },
  operations: {
    nameJa: '業務引き継ぎ',
    nameEn: 'Operations Handover',
    primaryMarts: [INTERVIEW_MART_IDS.KNOWLEDGE, INTERVIEW_MART_IDS.PROBLEMS],
    secondaryMarts: [INTERVIEW_MART_IDS.INSIGHTS, INTERVIEW_MART_IDS.RISKS],
    focusPointsJa: [
      '暗黙知の言語化',
      '進行中の課題と対応状況',
      '引き継ぎ必須の注意事項',
      '関係者と連絡経路の整理',
    ],
    focusPointsEn: [
      'Tacit knowledge documentation',
      'Active issues and response status',
      'Critical handover notes',
      'Stakeholder and communication paths',
    ],
  },
  hr: {
    nameJa: 'HR・退職/1on1',
    nameEn: 'HR / Exit Interview / 1-on-1',
    primaryMarts: [INTERVIEW_MART_IDS.VOICES, INTERVIEW_MART_IDS.PROBLEMS],
    secondaryMarts: [INTERVIEW_MART_IDS.INSIGHTS, INTERVIEW_MART_IDS.KNOWLEDGE],
    focusPointsJa: [
      '本音と建前の乖離検出',
      'モチベーション・満足度の把握',
      '組織文化・職場環境の課題',
      '引き継ぎが必要な業務知識',
    ],
    focusPointsEn: [
      'Detect gap between stated and true feelings',
      'Motivation and satisfaction assessment',
      'Organizational culture issues',
      'Business knowledge requiring handover',
    ],
  },
  customer: {
    nameJa: '顧客フィードバック',
    nameEn: 'Customer Feedback',
    primaryMarts: [INTERVIEW_MART_IDS.VOICES, INTERVIEW_MART_IDS.REQUIREMENTS, INTERVIEW_MART_IDS.PROBLEMS],
    secondaryMarts: [INTERVIEW_MART_IDS.INSIGHTS],
    focusPointsJa: [
      '顧客満足度と温度感',
      '改善要望の優先順位付け',
      '競合比較での強み・弱み',
      '新機能・サービスのニーズ',
    ],
    focusPointsEn: [
      'Customer satisfaction and sentiment',
      'Improvement request prioritization',
      'Competitive strengths and weaknesses',
      'New feature/service needs',
    ],
  },
  project: {
    nameJa: 'プロジェクト振り返り',
    nameEn: 'Project Retrospective',
    primaryMarts: [INTERVIEW_MART_IDS.INSIGHTS, INTERVIEW_MART_IDS.PROBLEMS],
    secondaryMarts: [INTERVIEW_MART_IDS.RISKS, INTERVIEW_MART_IDS.KNOWLEDGE],
    focusPointsJa: [
      '成功要因と教訓の抽出',
      'プロセス課題の体系化',
      '次回への改善提案',
      'ベストプラクティスの蓄積',
    ],
    focusPointsEn: [
      'Success factors and lessons learned',
      'Process issue systematization',
      'Improvement proposals for next time',
      'Best practice accumulation',
    ],
  },
  knowledge: {
    nameJa: '専門知識の引き継ぎ',
    nameEn: 'Expert Knowledge Transfer',
    primaryMarts: [INTERVIEW_MART_IDS.KNOWLEDGE, INTERVIEW_MART_IDS.INSIGHTS],
    secondaryMarts: [INTERVIEW_MART_IDS.PROBLEMS],
    focusPointsJa: [
      '暗黙知・ノウハウの体系化',
      'よくある問題と解決パターン',
      '業務の優先順位と判断基準',
      '新人がつまずきやすいポイント',
    ],
    focusPointsEn: [
      'Tacit knowledge systematization',
      'Common problems and solution patterns',
      'Task priorities and decision criteria',
      'Common pitfalls for newcomers',
    ],
  },
  general: {
    nameJa: '汎用',
    nameEn: 'General',
    primaryMarts: [INTERVIEW_MART_IDS.KNOWLEDGE],
    secondaryMarts: [
      INTERVIEW_MART_IDS.PROBLEMS,
      INTERVIEW_MART_IDS.INSIGHTS,
      INTERVIEW_MART_IDS.REQUIREMENTS,
      INTERVIEW_MART_IDS.RISKS,
      INTERVIEW_MART_IDS.VOICES,
    ],
    focusPointsJa: [
      'Q&Aペアの蓄積と検索',
      '全マートへの自動分類',
    ],
    focusPointsEn: [
      'Q&A pair accumulation and search',
      'Auto-classification across all marts',
    ],
  },
};

/**
 * テンプレートドメインから紐づくマート情報を取得する
 */
export function getMartMappingForDomain(domain: string): DomainMartMapping {
  const mapping = DOMAIN_MART_MAPPING[domain as InterviewTemplateDomain];
  return mapping || DOMAIN_MART_MAPPING.general;
}

/**
 * テンプレートドメインに対する全関連マート ID を優先度順で返す
 */
export function getRelevantMartIds(domain: string): InterviewMartId[] {
  const mapping = getMartMappingForDomain(domain);
  return [...mapping.primaryMarts, ...mapping.secondaryMarts];
}
