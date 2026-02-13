/**
 * デモデータ生成器
 *
 * シミュレーション生成したインタビューデータを
 * web-app-auto-interview で使用する InterviewSessionData 形式に変換する。
 *
 * 変換内容:
 * 1. GeneratedInterview → InterviewSessionData のフォーマット変換
 * 2. aggregatedOutput（構造化出力）の自動生成
 * 3. signal（感情シグナル）の自動生成
 * 4. problemExtraction（課題抽出）の自動生成
 */

import type { GeneratedInterview, GeneratedAnswer } from './content-generator.js';
import type {
  InterviewSessionData,
  InterviewSessionInfo,
  InterviewAnswer,
  InterviewStructuredOutput,
  InterviewSignalData,
  InterviewProblemExtractionResult,
  InterviewExtractedProblem,
  ProblemCategory,
  SeverityLevel,
} from '../config/tdwh/interview-mart.js';
import type { InterviewPattern } from './personas/interviewer-personas.js';

// =============================================================================
// パターン → テンプレート名・ドメインのマッピング
// =============================================================================

const PATTERN_TO_TEMPLATE: Record<InterviewPattern, { templateName: string; templateDomain: string }> = {
  biz_improvement: {
    templateName: '業務改善ヒアリングシート',
    templateDomain: '業務改善・BPR',
  },
  hr_organizational: {
    templateName: '組織課題ヒアリングシート',
    templateDomain: '人事・組織開発',
  },
  it_system: {
    templateName: 'IT要件ヒアリングシート',
    templateDomain: 'ITシステム・DX',
  },
  dx_strategy: {
    templateName: 'DX戦略ヒアリングシート',
    templateDomain: 'DX戦略・デジタル変革',
  },
  project_management: {
    templateName: 'プロジェクトリスクヒアリングシート',
    templateDomain: 'プロジェクト管理',
  },
  customer_success: {
    templateName: '顧客満足度ヒアリングシート',
    templateDomain: 'カスタマーサクセス',
  },
  internal_audit: {
    templateName: '内部監査ヒアリングシート',
    templateDomain: '内部監査・コンプライアンス',
  },
  management_review: {
    templateName: '経営課題ヒアリングシート',
    templateDomain: '経営戦略・マネジメント',
  },
};

// =============================================================================
// PIVOT → 課題カテゴリのマッピング
// =============================================================================

const PIVOT_TO_PROBLEM_CATEGORY: Record<string, ProblemCategory[]> = {
  P: ['process', 'tool', 'system'],
  I: ['people', 'communication'],
  V: ['process', 'system'],
  O: ['communication', 'people'],
  T: ['process', 'tool'],
};

// =============================================================================
// Seeded Random (再利用)
// =============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// =============================================================================
// 変換エンジン
// =============================================================================

export class DemoDataGenerator {
  private rng: SeededRandom;

  constructor(seed: number = 12345) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * GeneratedInterview[] → InterviewSessionData[] に一括変換
   */
  convertAll(interviews: GeneratedInterview[]): InterviewSessionData[] {
    return interviews.map(interview => this.convertSingle(interview));
  }

  /**
   * 単一インタビューの変換
   */
  convertSingle(interview: GeneratedInterview): InterviewSessionData {
    const pattern = interview.metadata.interviewPattern as InterviewPattern;
    const templateInfo = PATTERN_TO_TEMPLATE[pattern] || {
      templateName: 'ヒアリングシート',
      templateDomain: '業務改善',
    };

    // 1. セッション情報
    const session: InterviewSessionInfo = {
      sessionId: interview.id,
      title: `${interview.metadata.intervieweeCompany} ${interview.metadata.intervieweeDepartment} ヒアリング`,
      clientOrProject: interview.metadata.intervieweeCompany,
      templateName: templateInfo.templateName,
      templateDomain: templateInfo.templateDomain,
      interviewerName: interview.metadata.interviewerName,
      intervieweeName: interview.metadata.intervieweeName,
      tags: [
        interview.metadata.intervieweeIndustry,
        interview.metadata.interviewPattern,
        templateInfo.templateDomain,
      ],
      status: 'completed',
      completedAt: `${interview.metadata.date}T17:00:00Z`,
      createdAt: `${interview.metadata.date}T13:00:00Z`,
    };

    // 2. 回答データ
    const answers: InterviewAnswer[] = interview.answers.map(a => ({
      questionId: `${interview.id}-Q${String(a.questionNo).padStart(2, '0')}`,
      questionText: a.questionText,
      questionOrder: a.questionNo,
      rawText: a.answerText,
      answeredAt: `${interview.metadata.date}T${String(13 + a.questionNo).padStart(2, '0')}:${String(this.rng.int(0, 59)).padStart(2, '0')}:00Z`,
    }));

    // 3. 集約構造化出力
    const aggregatedOutput = this.generateAggregatedOutput(interview);

    // 4. シグナルデータ
    const signal = this.generateSignalData(interview);

    // 5. 課題抽出
    const problemExtraction = this.generateProblemExtraction(interview);

    return {
      session,
      answers,
      aggregatedOutput,
      signal,
      problemExtraction,
    };
  }

  /**
   * 集約構造化出力を生成
   */
  private generateAggregatedOutput(interview: GeneratedInterview): InterviewStructuredOutput {
    const allPivots = interview.answers.flatMap(a => a.expectedPivots);
    const allKeywords = interview.answers.flatMap(a => a.usedKeywords);
    const uniquePivots = [...new Set(allPivots)];

    // summary: 全体要約
    const summary = `${interview.metadata.intervieweeCompany}の${interview.metadata.intervieweeDepartment}・${interview.metadata.intervieweeName}氏へのヒアリング。` +
      `${interview.metadata.interviewPattern}の観点から${interview.answers.length}問の質問を実施。` +
      `PIVOT分布: ${uniquePivots.join('/')}。` +
      `主要キーワード: ${[...new Set(allKeywords)].slice(0, 5).join('、')}。`;

    // key_points: PIVOTから主要ポイントを抽出
    const keyPoints: string[] = [];
    for (const answer of interview.answers) {
      if (answer.expectedPivots.includes('P')) {
        const snippet = answer.answerText.split('\n')[0].substring(0, 100);
        keyPoints.push(`【課題】${snippet}`);
      }
      if (answer.expectedPivots.includes('V')) {
        const snippet = answer.answerText.split('\n')[0].substring(0, 100);
        keyPoints.push(`【要望】${snippet}`);
      }
    }

    // decisions: 改善の方向性
    const decisions: string[] = [];
    if (uniquePivots.includes('V')) {
      decisions.push(`${interview.metadata.intervieweeDepartment}における改善施策の検討を進める`);
    }
    if (uniquePivots.includes('P') && uniquePivots.includes('T')) {
      decisions.push('成功事例を他部門への横展開候補として記録する');
    }

    // open_questions
    const openQuestions: string[] = [];
    if (uniquePivots.includes('I')) {
      openQuestions.push('属人化リスクへの対応策の具体化が必要');
    }
    if (uniquePivots.includes('O')) {
      openQuestions.push('組織内の抵抗要因への対処方針の検討が必要');
    }

    // risks
    const risks: string[] = [];
    for (const answer of interview.answers) {
      if (answer.expectedPivots.includes('I') || answer.expectedPivots.includes('O')) {
        const snippet = answer.answerText.split('\n')[0].substring(0, 80);
        risks.push(snippet);
      }
    }

    // stakeholders
    const stakeholders = [
      interview.metadata.intervieweeName,
      interview.metadata.interviewerName,
    ];

    // requirements
    const requirements: string[] = [];
    for (const answer of interview.answers) {
      if (answer.expectedPivots.includes('V')) {
        const snippet = answer.answerText.split('\n')[0].substring(0, 100);
        requirements.push(snippet);
      }
    }

    // evidence_refs
    const evidenceRefs = interview.answers
      .filter(a => a.expectedPivots.length > 0)
      .map(a => `Q${a.questionNo}: ${a.questionText}`);

    return {
      summary,
      key_points: keyPoints.slice(0, 8),
      decisions: decisions.slice(0, 4),
      open_questions: openQuestions.slice(0, 4),
      risks: risks.slice(0, 5),
      stakeholders,
      requirements: requirements.slice(0, 6),
      evidence_refs: evidenceRefs.slice(0, 8),
    };
  }

  /**
   * シグナルデータを生成
   */
  private generateSignalData(interview: GeneratedInterview): InterviewSignalData {
    const allPivots = interview.answers.flatMap(a => a.expectedPivots);
    const pivotCounts: Record<string, number> = { P: 0, I: 0, V: 0, O: 0, T: 0 };
    for (const p of allPivots) {
      if (p in pivotCounts) pivotCounts[p]++;
    }

    // sentiment_score: Pain/Insecurity/Objection が多いほど低く、Vision/Traction が多いほど高い
    const negativeWeight = pivotCounts.P * 0.3 + pivotCounts.I * 0.4 + pivotCounts.O * 0.3;
    const positiveWeight = pivotCounts.V * 0.4 + pivotCounts.T * 0.5;
    const total = negativeWeight + positiveWeight || 1;
    const baseSentiment = (positiveWeight - negativeWeight * 0.5) / total;
    const sentimentScore = Math.max(-1, Math.min(1,
      baseSentiment + this.rng.float(-0.1, 0.1),
    ));

    // emotions
    const emotions: Array<{ emotion: string; intensity: number }> = [];
    if (pivotCounts.P > 0) {
      emotions.push({ emotion: '不満', intensity: Math.min(pivotCounts.P * 0.2 + this.rng.float(0, 0.2), 1.0) });
    }
    if (pivotCounts.I > 0) {
      emotions.push({ emotion: '不安', intensity: Math.min(pivotCounts.I * 0.25 + this.rng.float(0, 0.15), 1.0) });
    }
    if (pivotCounts.V > 0) {
      emotions.push({ emotion: '期待', intensity: Math.min(pivotCounts.V * 0.3 + this.rng.float(0, 0.15), 1.0) });
    }
    if (pivotCounts.O > 0) {
      emotions.push({ emotion: '懐疑', intensity: Math.min(pivotCounts.O * 0.2 + this.rng.float(0, 0.2), 1.0) });
    }
    if (pivotCounts.T > 0) {
      emotions.push({ emotion: '満足', intensity: Math.min(pivotCounts.T * 0.3 + this.rng.float(0, 0.2), 1.0) });
    }
    if (emotions.length === 0) {
      emotions.push({ emotion: '中立', intensity: 0.5 });
    }

    // problems from PIVOT P answers
    const problems: InterviewExtractedProblem[] = [];
    for (const answer of interview.answers) {
      if (answer.expectedPivots.includes('P')) {
        const category = this.rng.pick(PIVOT_TO_PROBLEM_CATEGORY['P']);
        problems.push({
          description: answer.answerText.split('\n')[0].substring(0, 150),
          category,
          affected_scope: interview.metadata.intervieweeDepartment,
          frequency: this.rng.pick(['毎日', '週次', '月次', '四半期ごと']),
          severity: this.rng.int(2, 5) as SeverityLevel,
          root_cause_hypothesis: this.rng.pick([
            '業務プロセスの標準化不足',
            'システムの老朽化',
            '人材不足・属人化',
            '部門間連携の不足',
            '教育・研修体制の不備',
          ]),
          evidence: `Q${answer.questionNo}の回答より`,
        });
      }
    }

    // topics
    const topics = [...new Set([
      interview.metadata.intervieweeIndustry,
      interview.metadata.interviewPattern,
      ...interview.answers.flatMap(a => a.usedKeywords).slice(0, 5),
    ])];

    return {
      sentiment_score: Math.round(sentimentScore * 100) / 100,
      emotions,
      problems: problems.slice(0, 5),
      topics: topics.slice(0, 8),
      answer_hesitation: Math.round(this.rng.float(0.05, 0.35) * 100) / 100,
      answer_brevity: Math.round(this.rng.float(0.2, 0.7) * 100) / 100,
      evasion_score: Math.round(this.rng.float(0.0, 0.3) * 100) / 100,
    };
  }

  /**
   * 課題抽出結果を生成
   */
  private generateProblemExtraction(interview: GeneratedInterview): InterviewProblemExtractionResult {
    const problems: InterviewExtractedProblem[] = [];
    const improvementHints: string[] = [];
    const unspokenConcerns: string[] = [];

    for (const answer of interview.answers) {
      // Pain → 課題
      if (answer.expectedPivots.includes('P')) {
        const category = this.rng.pick(PIVOT_TO_PROBLEM_CATEGORY['P']);
        problems.push({
          description: answer.answerText.split('\n')[0].substring(0, 200),
          category,
          affected_scope: interview.metadata.intervieweeDepartment,
          frequency: this.rng.pick(['毎日', '週次', '月次', '四半期ごと', '不定期']),
          severity: this.rng.int(2, 5) as SeverityLevel,
          root_cause_hypothesis: this.generateRootCause(category),
          evidence: `${interview.metadata.intervieweeName}氏 Q${answer.questionNo}回答`,
        });
      }

      // Insecurity → 潜在リスク
      if (answer.expectedPivots.includes('I')) {
        problems.push({
          description: answer.answerText.split('\n')[0].substring(0, 200),
          category: this.rng.pick(PIVOT_TO_PROBLEM_CATEGORY['I']),
          affected_scope: interview.metadata.intervieweeDepartment,
          frequency: this.rng.pick(['潜在的', '顕在化の兆候あり']),
          severity: this.rng.int(3, 5) as SeverityLevel,
          root_cause_hypothesis: '組織体制・人材配置の構造的問題',
          evidence: `${interview.metadata.intervieweeName}氏 Q${answer.questionNo}回答`,
        });
      }

      // Vision → 改善ヒント
      if (answer.expectedPivots.includes('V')) {
        const snippet = answer.answerText.split('\n')[0].substring(0, 100);
        improvementHints.push(`回答者の要望: ${snippet}`);
      }

      // Objection → 未言及の懸念
      if (answer.expectedPivots.includes('O')) {
        const snippet = answer.answerText.split('\n')[0].substring(0, 100);
        unspokenConcerns.push(`過去の経験に基づく懸念: ${snippet}`);
      }
    }

    // 全体的な改善ヒントを追加
    if (problems.length > 2) {
      improvementHints.push('複数の課題が関連している可能性があり、統合的な改善アプローチが有効');
    }

    return {
      problems: problems.slice(0, 10),
      improvement_hints: improvementHints.slice(0, 5),
      unspoken_concerns: unspokenConcerns.slice(0, 5),
    };
  }

  private generateRootCause(category: ProblemCategory): string {
    const causes: Record<ProblemCategory, string[]> = {
      process: [
        '業務プロセスが標準化されておらず、個人の裁量に依存',
        '業務フローが長年変更されておらず、現状に合っていない',
        '部門間の業務引継ぎルールが曖昧',
      ],
      tool: [
        '既存ツールの機能が業務要件に追いついていない',
        'レガシーシステムからの移行が進んでいない',
        '適切なツール選定・導入がなされていない',
      ],
      people: [
        '特定の担当者にナレッジが集中し、属人化が進行',
        '人材育成・教育体制が不十分',
        '人員不足により十分な対応ができていない',
      ],
      communication: [
        '部門間の情報共有の仕組みが不十分',
        '関係者間の認識齟齬が解消されていない',
        'コミュニケーションツールが統一されていない',
      ],
      system: [
        'システム間のデータ連携が自動化されていない',
        'システムの老朽化によりパフォーマンスが低下',
        'セキュリティ要件への対応が追いついていない',
      ],
    };
    return this.rng.pick(causes[category]);
  }
}

// =============================================================================
// 便利関数
// =============================================================================

/**
 * GeneratedInterview[] を InterviewSessionData[] に一括変換
 */
export function convertToSessionData(
  interviews: GeneratedInterview[],
  seed: number = 12345,
): InterviewSessionData[] {
  const generator = new DemoDataGenerator(seed);
  return generator.convertAll(interviews);
}

/**
 * InterviewSessionData を JSONL 形式の文字列に変換
 */
export function sessionDataToJsonl(sessions: InterviewSessionData[]): string {
  return sessions.map(s => JSON.stringify(s)).join('\n');
}

/**
 * サマリー情報を生成（デモデータの統計）
 */
export function generateDemoDataSummary(sessions: InterviewSessionData[]): {
  totalSessions: number;
  byTemplate: Record<string, number>;
  byDomain: Record<string, number>;
  byStatus: Record<string, number>;
  totalAnswers: number;
  totalProblems: number;
  avgSentimentScore: number;
  dateRange: { earliest: string; latest: string };
} {
  const byTemplate: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalAnswers = 0;
  let totalProblems = 0;
  let sentimentSum = 0;
  let sentimentCount = 0;
  let earliest = 'Z';
  let latest = '';

  for (const session of sessions) {
    const tmpl = session.session.templateName;
    byTemplate[tmpl] = (byTemplate[tmpl] || 0) + 1;

    const domain = session.session.templateDomain;
    byDomain[domain] = (byDomain[domain] || 0) + 1;

    const status = session.session.status;
    byStatus[status] = (byStatus[status] || 0) + 1;

    totalAnswers += session.answers.length;
    totalProblems += session.problemExtraction?.problems.length || 0;

    if (session.signal) {
      sentimentSum += session.signal.sentiment_score;
      sentimentCount++;
    }

    const date = session.session.createdAt;
    if (date < earliest) earliest = date;
    if (date > latest) latest = date;
  }

  return {
    totalSessions: sessions.length,
    byTemplate,
    byDomain,
    byStatus,
    totalAnswers,
    totalProblems,
    avgSentimentScore: sentimentCount > 0
      ? Math.round((sentimentSum / sentimentCount) * 100) / 100
      : 0,
    dateRange: { earliest, latest },
  };
}
