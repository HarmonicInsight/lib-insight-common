/**
 * ユーザーストーリー定義
 *
 * 各インタビューパターン × ペルソナタイプの組み合わせで
 * 「誰が」「何のために」「どのように」インタビューを行うかを定義
 */

import type { InterviewPattern } from './personas/interviewer-personas.js';

export interface UserStory {
  id: string;
  /** インタビューパターン */
  interviewPattern: InterviewPattern;
  /** ストーリーの主語（インタビュアーの役割） */
  asA: string;
  /** 目的（〜したい） */
  iWantTo: string;
  /** 理由（〜のために） */
  soThat: string;
  /** 受入条件 */
  acceptanceCriteria: string[];
  /** 対象業種（空配列は全業種） */
  targetIndustries: string[];
  /** 期待されるマートへの出力 */
  expectedMarts: string[];
}

export const USER_STORIES: UserStory[] = [
  // ==========================================================================
  // 業務改善コンサルタント
  // ==========================================================================
  {
    id: 'US-BIZ-001',
    interviewPattern: 'biz_improvement',
    asA: '業務改善コンサルタント',
    iWantTo: '製造業のクライアント企業の現場担当者にインタビューを行い、紙・Excel中心の非効率な業務プロセスを洗い出す',
    soThat: '自動化・システム化による改善効果を定量的に見積もり、改善提案書を作成できる',
    acceptanceCriteria: [
      'Pain（課題）が3件以上抽出される',
      'process軸で具体的な業務名が特定される',
      'tool軸で現在のツールが特定される',
      'Vision（要望）が1件以上抽出される',
    ],
    targetIndustries: ['製造業'],
    expectedMarts: ['interview_problems', 'interview_requirements', 'interview_voices'],
  },
  {
    id: 'US-BIZ-002',
    interviewPattern: 'biz_improvement',
    asA: '業務改善コンサルタント',
    iWantTo: '金融機関の事務統括部門にインタビューを行い、事務処理の重複・手戻りを特定する',
    soThat: 'RPA導入の対象業務リストと優先順位を作成できる',
    acceptanceCriteria: [
      'Pain（課題）にコスト・時間の定量情報が含まれる',
      '属人化リスク（Insecurity）が検出される',
      '過去の失敗経験（Objection）が記録される',
    ],
    targetIndustries: ['金融業'],
    expectedMarts: ['interview_problems', 'interview_risks', 'interview_insights'],
  },
  {
    id: 'US-BIZ-003',
    interviewPattern: 'biz_improvement',
    asA: '業務改善コンサルタント',
    iWantTo: '小売業の店舗運営担当者にインタビューを行い、店舗間のオペレーションのばらつきを把握する',
    soThat: '標準化施策とデジタル化のロードマップを策定できる',
    acceptanceCriteria: [
      '複数のprocess軸で課題が抽出される',
      'Traction（成功事例）が1件以上記録される',
    ],
    targetIndustries: ['小売業'],
    expectedMarts: ['interview_problems', 'interview_insights', 'interview_knowledge'],
  },
  {
    id: 'US-BIZ-004',
    interviewPattern: 'biz_improvement',
    asA: '業務改善コンサルタント',
    iWantTo: '物流企業の管理者にインタビューを行い、配車・倉庫の効率化の余地を発見する',
    soThat: 'DX投資の費用対効果を算出し、経営層への提案材料にできる',
    acceptanceCriteria: [
      'tool軸で現行ツールが特定される',
      'Vision（理想像）に具体的な数値目標が含まれる',
    ],
    targetIndustries: ['物流業'],
    expectedMarts: ['interview_problems', 'interview_requirements'],
  },

  // ==========================================================================
  // 人事・組織コンサルタント
  // ==========================================================================
  {
    id: 'US-HR-001',
    interviewPattern: 'hr_organizational',
    asA: '組織開発コンサルタント',
    iWantTo: '各部署の管理職にインタビューを行い、離職リスクの高い部署とその根本原因を特定する',
    soThat: 'エンゲージメント向上施策を部署ごとにカスタマイズして提案できる',
    acceptanceCriteria: [
      'people軸で部署・役割が特定される',
      'Insecurity（不安）に人材関連の懸念が含まれる',
      '温度感（temperature）がhighの発言が検出される',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_voices', 'interview_problems', 'interview_risks'],
  },
  {
    id: 'US-HR-002',
    interviewPattern: 'hr_organizational',
    asA: '組織開発コンサルタント',
    iWantTo: '人事担当者にインタビューを行い、採用・育成・評価プロセスの課題を体系的に整理する',
    soThat: 'タレントマネジメント戦略の全体像を描ける',
    acceptanceCriteria: [
      'process軸で人事プロセスが特定される',
      'Pain, Vision, Tractionの3種以上のPIVOTが検出される',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_problems', 'interview_requirements', 'interview_knowledge'],
  },

  // ==========================================================================
  // ITシステムコンサルタント
  // ==========================================================================
  {
    id: 'US-IT-001',
    interviewPattern: 'it_system',
    asA: 'ITコンサルタント',
    iWantTo: '各部署のエンドユーザーにインタビューを行い、新基幹システムの機能要件を収集する',
    soThat: 'RFP（提案依頼書）の要件定義書を作成できる',
    acceptanceCriteria: [
      'Vision（要望）が部署ごとに3件以上収集される',
      '現行システムのPain（課題）が具体的に記録される',
      'tool軸で現行ツール一覧が作成できる',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_requirements', 'interview_problems', 'interview_knowledge'],
  },
  {
    id: 'US-IT-002',
    interviewPattern: 'it_system',
    asA: 'ITコンサルタント',
    iWantTo: 'システム管理者にインタビューを行い、データ連携の現状と課題を把握する',
    soThat: 'データ統合アーキテクチャの設計指針を策定できる',
    acceptanceCriteria: [
      'tool軸でシステム間連携の状況が把握できる',
      'Objection（過去の導入失敗経験）が記録される',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_problems', 'interview_risks', 'interview_insights'],
  },

  // ==========================================================================
  // DX戦略コンサルタント
  // ==========================================================================
  {
    id: 'US-DX-001',
    interviewPattern: 'dx_strategy',
    asA: 'DX戦略コンサルタント',
    iWantTo: '経営層と現場管理者の両方にインタビューを行い、DX成熟度を評価する',
    soThat: '現実的なDXロードマップ（3年計画）を策定できる',
    acceptanceCriteria: [
      '紙→Excel→システム→AIの成熟度レベルが判定できる',
      'Objection（組織的障壁）が特定される',
      'Traction（成功事例）と課題のバランスが把握できる',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_problems', 'interview_insights', 'interview_risks', 'interview_requirements'],
  },
  {
    id: 'US-DX-002',
    interviewPattern: 'dx_strategy',
    asA: 'DX戦略コンサルタント',
    iWantTo: 'DX推進担当者にインタビューを行い、推進上の障壁と成功の鍵を把握する',
    soThat: 'DX推進体制の強化策を提案できる',
    acceptanceCriteria: [
      'people軸で推進上の障壁人物/部署が特定される',
      'Objection（抵抗）の具体的な内容が記録される',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_risks', 'interview_voices', 'interview_insights'],
  },

  // ==========================================================================
  // プロジェクトマネージャー
  // ==========================================================================
  {
    id: 'US-PM-001',
    interviewPattern: 'project_management',
    asA: 'プロジェクトマネージャー',
    iWantTo: 'プロジェクト関係者全員にインタビューを行い、リスクとステークホルダーの懸念を網羅的に把握する',
    soThat: 'リスク登録簿とステークホルダーマップを作成できる',
    acceptanceCriteria: [
      'Insecurity（不安・リスク）が5件以上特定される',
      'people軸でステークホルダーが特定される',
      'Vision（成功基準）が明確に記録される',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_risks', 'interview_requirements', 'interview_voices'],
  },
  {
    id: 'US-PM-002',
    interviewPattern: 'project_management',
    asA: 'プロジェクトマネージャー',
    iWantTo: '現場メンバーにインタビューを行い、変更管理への受入れ態勢を事前に評価する',
    soThat: 'チェンジマネジメント計画を事前に準備できる',
    acceptanceCriteria: [
      'Objection（抵抗）の理由と程度が把握できる',
      'Traction（前向きな要素）も合わせて把握できる',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_voices', 'interview_risks'],
  },

  // ==========================================================================
  // カスタマーサクセス
  // ==========================================================================
  {
    id: 'US-CS-001',
    interviewPattern: 'customer_success',
    asA: 'カスタマーサクセスマネージャー',
    iWantTo: '導入企業のエンドユーザーにインタビューを行い、製品の利用状況と満足度を把握する',
    soThat: 'チャーンリスクを早期発見し、継続率を向上させる',
    acceptanceCriteria: [
      'Pain（不満）とTraction（満足点）の両方が記録される',
      'sentiment_scoreが算出される',
      'チャーンリスクの兆候（Objection）が検出された場合フラグが立つ',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_voices', 'interview_problems', 'interview_requirements'],
  },

  // ==========================================================================
  // 内部監査
  // ==========================================================================
  {
    id: 'US-AUD-001',
    interviewPattern: 'internal_audit',
    asA: '内部監査マネージャー',
    iWantTo: '各部署の担当者にインタビューを行い、内部統制の遵守状況と潜在リスクを把握する',
    soThat: '監査報告書に具体的な指摘事項と改善提案を記載できる',
    acceptanceCriteria: [
      '規程逸脱（Pain/Objection）が具体的に記録される',
      'Insecurity（リスク）に具体的な事例が含まれる',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_risks', 'interview_problems'],
  },

  // ==========================================================================
  // 経営レビュー
  // ==========================================================================
  {
    id: 'US-MGT-001',
    interviewPattern: 'management_review',
    asA: '経営コンサルタント',
    iWantTo: '経営幹部と現場管理職の両方にインタビューを行い、経営課題の全体像を俯瞰する',
    soThat: '戦略的な優先課題リストと実行ロードマップを作成できる',
    acceptanceCriteria: [
      '全5種のPIVOT（P/I/V/O/T）が検出される',
      'process/tool/people全ての軸で課題が特定される',
      'sentiment_indexで組織の温度感が定量化される',
    ],
    targetIndustries: [],
    expectedMarts: ['interview_problems', 'interview_insights', 'interview_risks', 'interview_voices', 'interview_requirements', 'interview_knowledge'],
  },

  // ==========================================================================
  // 業種横断ストーリー
  // ==========================================================================
  {
    id: 'US-CROSS-001',
    interviewPattern: 'biz_improvement',
    asA: '業務改善コンサルタント',
    iWantTo: '医療機関の各部門にインタビューを行い、患者対応と事務作業の効率化ポイントを見つける',
    soThat: '医療DXの導入計画を策定できる',
    acceptanceCriteria: [
      '患者対応に関するPain/Visionが検出される',
      '既存システム（電子カルテ等）の課題が記録される',
    ],
    targetIndustries: ['医療'],
    expectedMarts: ['interview_problems', 'interview_requirements'],
  },
  {
    id: 'US-CROSS-002',
    interviewPattern: 'biz_improvement',
    asA: '業務改善コンサルタント',
    iWantTo: '官公庁の担当者にインタビューを行い、行政手続きのデジタル化の障壁と機会を把握する',
    soThat: '行政DX推進計画を立案できる',
    acceptanceCriteria: [
      'Objection（セキュリティ・制度的制約）が具体的に記録される',
      'Vision（オンライン化の要望）が記録される',
    ],
    targetIndustries: ['官公庁'],
    expectedMarts: ['interview_problems', 'interview_risks', 'interview_requirements'],
  },
  {
    id: 'US-CROSS-003',
    interviewPattern: 'biz_improvement',
    asA: '業務改善コンサルタント',
    iWantTo: '教育機関の教職員にインタビューを行い、校務のデジタル化による教員の負担軽減策を見つける',
    soThat: '教育DXの実行計画を策定できる',
    acceptanceCriteria: [
      '教務関連のPain（課題）が3件以上抽出される',
      'people軸で教員の負担要因が特定される',
    ],
    targetIndustries: ['教育'],
    expectedMarts: ['interview_problems', 'interview_requirements', 'interview_voices'],
  },
];

/** パターン別にユーザーストーリーを取得 */
export function getStoriesByPattern(pattern: InterviewPattern): UserStory[] {
  return USER_STORIES.filter(s => s.interviewPattern === pattern);
}

/** 業種別にユーザーストーリーを取得 */
export function getStoriesByIndustry(industry: string): UserStory[] {
  return USER_STORIES.filter(
    s => s.targetIndustries.length === 0 || s.targetIndustries.includes(industry)
  );
}

console.log(`[user-stories] ${USER_STORIES.length} user stories loaded`);
