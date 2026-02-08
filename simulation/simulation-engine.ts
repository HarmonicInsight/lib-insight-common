/**
 * シミュレーションエンジン
 *
 * 1. インタビュー対象者の発言を PIVOT 分類
 * 2. インタビュアーの要望（demands）とのマッチング
 * 3. マート生成ロジックの実行・検証
 * 4. 結果の集計・レポート生成
 */

import type { GeneratedInterview, GeneratedAnswer } from './content-generator.js';
import type { InterviewerPersona, InterviewerDemand } from './personas/interviewer-personas.js';
import { ALL_INTERVIEWER_PERSONAS } from './personas/interviewer-personas.js';

// =============================================================================
// 型定義
// =============================================================================

export interface MatchResult {
  demandId: string;
  demandDescription: string;
  matched: boolean;
  matchScore: number;
  matchedUtterances: MatchedUtterance[];
}

export interface MatchedUtterance {
  questionNo: number;
  text: string;
  matchedKeywords: string[];
  pivotAlignment: boolean;
}

export interface InterviewSimulationResult {
  interviewId: string;
  intervieweeId: string;
  intervieweeName: string;
  interviewerId: string;
  interviewerName: string;
  interviewPattern: string;
  /** 要望マッチング結果 */
  demandMatches: MatchResult[];
  /** マッチ率（全要望のうち何割がマッチしたか） */
  overallMatchRate: number;
  /** PIVOT分布 */
  pivotDistribution: Record<string, number>;
  /** 検出されたキーワード数 */
  totalKeywordsDetected: number;
  /** 平均マッチスコア */
  averageMatchScore: number;
}

export interface SimulationSummary {
  totalInterviews: number;
  /** パターン別マッチ率 */
  matchRateByPattern: Record<string, { count: number; avgMatchRate: number; minMatchRate: number; maxMatchRate: number }>;
  /** 業種別マッチ率 */
  matchRateByIndustry: Record<string, { count: number; avgMatchRate: number }>;
  /** 要望別マッチ率（全インタビューでの各要望のマッチ率） */
  matchRateByDemand: Record<string, { demandDescription: string; matchRate: number; totalChecks: number; matches: number }>;
  /** PIVOT分布（全体） */
  overallPivotDistribution: Record<string, number>;
  /** マート別レコード数期待値 */
  expectedMartCounts: Record<string, number>;
  /** 全体の平均マッチ率 */
  overallMatchRate: number;
}

// =============================================================================
// マッチングエンジン
// =============================================================================

export class SimulationEngine {
  /**
   * 単一インタビューのシミュレーション
   */
  simulateInterview(interview: GeneratedInterview): InterviewSimulationResult {
    const interviewer = ALL_INTERVIEWER_PERSONAS.find(
      i => i.id === interview.metadata.interviewerId,
    );

    if (!interviewer) {
      throw new Error(`Interviewer not found: ${interview.metadata.interviewerId}`);
    }

    // 1. 各要望に対するマッチング
    const demandMatches = interviewer.demands.map(demand =>
      this.matchDemand(demand, interview.answers),
    );

    // 2. PIVOT分布の集計
    const pivotDistribution = this.calculatePivotDistribution(interview.answers);

    // 3. キーワード検出数
    const totalKeywordsDetected = interview.answers.reduce(
      (sum, a) => sum + a.usedKeywords.length, 0,
    );

    // 4. マッチ率の算出
    const matchedCount = demandMatches.filter(m => m.matched).length;
    const overallMatchRate = demandMatches.length > 0
      ? matchedCount / demandMatches.length
      : 0;

    const averageMatchScore = demandMatches.length > 0
      ? demandMatches.reduce((sum, m) => sum + m.matchScore, 0) / demandMatches.length
      : 0;

    return {
      interviewId: interview.id,
      intervieweeId: interview.metadata.intervieweeId,
      intervieweeName: interview.metadata.intervieweeName,
      interviewerId: interview.metadata.interviewerId,
      interviewerName: interview.metadata.interviewerName,
      interviewPattern: interview.metadata.interviewPattern,
      demandMatches,
      overallMatchRate,
      pivotDistribution,
      totalKeywordsDetected,
      averageMatchScore,
    };
  }

  /**
   * 全インタビューのシミュレーションと集計
   */
  simulateAll(interviews: GeneratedInterview[]): {
    results: InterviewSimulationResult[];
    summary: SimulationSummary;
  } {
    const results = interviews.map(i => this.simulateInterview(i));
    const summary = this.generateSummary(results, interviews);
    return { results, summary };
  }

  /**
   * 要望マッチング
   */
  private matchDemand(demand: InterviewerDemand, answers: GeneratedAnswer[]): MatchResult {
    const matchedUtterances: MatchedUtterance[] = [];
    let totalScore = 0;

    for (const answer of answers) {
      const answerText = answer.answerText;

      // キーワードマッチング
      const matchedKeywords = demand.keywords.filter(kw => answerText.includes(kw));

      // PIVOTアライメント（回答の期待PIVOTと要望の関連PIVOTが一致）
      const pivotAlignment = answer.expectedPivots.some(
        p => demand.relevantPivots.includes(p),
      );

      if (matchedKeywords.length > 0 || pivotAlignment) {
        const keywordScore = Math.min(matchedKeywords.length / demand.keywords.length, 1.0);
        const pivotScore = pivotAlignment ? 0.3 : 0;
        const utteranceScore = Math.min(keywordScore * 0.7 + pivotScore, 1.0);

        totalScore += utteranceScore;

        matchedUtterances.push({
          questionNo: answer.questionNo,
          text: answerText.substring(0, 100) + (answerText.length > 100 ? '...' : ''),
          matchedKeywords,
          pivotAlignment,
        });
      }
    }

    // マッチスコア: 最高utteranceスコア + カバレッジボーナス
    const maxUtteranceScore = matchedUtterances.length > 0
      ? Math.max(...matchedUtterances.map(u => {
          const kwScore = Math.min(u.matchedKeywords.length * 0.15, 0.6);
          const pvScore = u.pivotAlignment ? 0.3 : 0;
          return Math.min(kwScore + pvScore, 1.0);
        }))
      : 0;
    const coverageBonus = Math.min(matchedUtterances.length * 0.1, 0.3);
    const matchScore = Math.min(maxUtteranceScore + coverageBonus, 1.0);

    return {
      demandId: demand.id,
      demandDescription: demand.description,
      matched: matchScore >= demand.matchThreshold,
      matchScore: Math.round(matchScore * 100) / 100,
      matchedUtterances,
    };
  }

  /**
   * PIVOT分布の集計
   */
  private calculatePivotDistribution(answers: GeneratedAnswer[]): Record<string, number> {
    const dist: Record<string, number> = { P: 0, I: 0, V: 0, O: 0, T: 0 };
    for (const answer of answers) {
      for (const pivot of answer.expectedPivots) {
        if (pivot in dist) {
          dist[pivot]++;
        }
      }
    }
    return dist;
  }

  /**
   * サマリー生成
   */
  private generateSummary(
    results: InterviewSimulationResult[],
    interviews: GeneratedInterview[],
  ): SimulationSummary {
    // パターン別マッチ率
    const matchRateByPattern: SimulationSummary['matchRateByPattern'] = {};
    for (const result of results) {
      const pattern = result.interviewPattern;
      if (!matchRateByPattern[pattern]) {
        matchRateByPattern[pattern] = { count: 0, avgMatchRate: 0, minMatchRate: 1, maxMatchRate: 0 };
      }
      const entry = matchRateByPattern[pattern];
      entry.count++;
      entry.avgMatchRate += result.overallMatchRate;
      entry.minMatchRate = Math.min(entry.minMatchRate, result.overallMatchRate);
      entry.maxMatchRate = Math.max(entry.maxMatchRate, result.overallMatchRate);
    }
    for (const entry of Object.values(matchRateByPattern)) {
      entry.avgMatchRate = Math.round((entry.avgMatchRate / entry.count) * 100) / 100;
    }

    // 業種別マッチ率
    const matchRateByIndustry: SimulationSummary['matchRateByIndustry'] = {};
    for (let i = 0; i < results.length; i++) {
      const industry = interviews[i].metadata.intervieweeIndustry;
      if (!matchRateByIndustry[industry]) {
        matchRateByIndustry[industry] = { count: 0, avgMatchRate: 0 };
      }
      matchRateByIndustry[industry].count++;
      matchRateByIndustry[industry].avgMatchRate += results[i].overallMatchRate;
    }
    for (const entry of Object.values(matchRateByIndustry)) {
      entry.avgMatchRate = Math.round((entry.avgMatchRate / entry.count) * 100) / 100;
    }

    // 要望別マッチ率
    const matchRateByDemand: SimulationSummary['matchRateByDemand'] = {};
    for (const result of results) {
      for (const dm of result.demandMatches) {
        if (!matchRateByDemand[dm.demandId]) {
          matchRateByDemand[dm.demandId] = {
            demandDescription: dm.demandDescription,
            matchRate: 0,
            totalChecks: 0,
            matches: 0,
          };
        }
        matchRateByDemand[dm.demandId].totalChecks++;
        if (dm.matched) {
          matchRateByDemand[dm.demandId].matches++;
        }
      }
    }
    for (const entry of Object.values(matchRateByDemand)) {
      entry.matchRate = Math.round((entry.matches / entry.totalChecks) * 100) / 100;
    }

    // 全体PIVOT分布
    const overallPivotDistribution: Record<string, number> = { P: 0, I: 0, V: 0, O: 0, T: 0 };
    for (const result of results) {
      for (const [pivot, count] of Object.entries(result.pivotDistribution)) {
        overallPivotDistribution[pivot] = (overallPivotDistribution[pivot] || 0) + count;
      }
    }

    // マート別レコード数期待値（PIVOTとマートの対応）
    const pivotToMarts: Record<string, string[]> = {
      P: ['interview_problems'],
      I: ['interview_risks'],
      V: ['interview_requirements'],
      O: ['interview_risks', 'interview_voices'],
      T: ['interview_insights', 'interview_knowledge'],
    };
    const expectedMartCounts: Record<string, number> = {};
    for (const [pivot, count] of Object.entries(overallPivotDistribution)) {
      const marts = pivotToMarts[pivot] || [];
      for (const mart of marts) {
        expectedMartCounts[mart] = (expectedMartCounts[mart] || 0) + count;
      }
    }
    // Voices マートは全件対象
    expectedMartCounts['interview_voices'] = (expectedMartCounts['interview_voices'] || 0) +
      overallPivotDistribution['P'] + overallPivotDistribution['I'];

    // 全体マッチ率
    const overallMatchRate = results.length > 0
      ? Math.round((results.reduce((sum, r) => sum + r.overallMatchRate, 0) / results.length) * 100) / 100
      : 0;

    return {
      totalInterviews: results.length,
      matchRateByPattern,
      matchRateByIndustry,
      matchRateByDemand,
      overallPivotDistribution,
      expectedMartCounts,
      overallMatchRate,
    };
  }
}

// =============================================================================
// レポート生成
// =============================================================================

export function formatSummaryReport(summary: SimulationSummary): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('  INTERVIEW SIMULATION REPORT');
  lines.push('='.repeat(80));
  lines.push('');

  // 概要
  lines.push(`Total Interviews: ${summary.totalInterviews}`);
  lines.push(`Overall Match Rate: ${(summary.overallMatchRate * 100).toFixed(1)}%`);
  lines.push('');

  // パターン別マッチ率
  lines.push('-'.repeat(60));
  lines.push('  Match Rate by Interview Pattern');
  lines.push('-'.repeat(60));
  for (const [pattern, data] of Object.entries(summary.matchRateByPattern)) {
    lines.push(
      `  ${pattern.padEnd(25)} ` +
      `avg=${(data.avgMatchRate * 100).toFixed(1)}% ` +
      `min=${(data.minMatchRate * 100).toFixed(1)}% ` +
      `max=${(data.maxMatchRate * 100).toFixed(1)}% ` +
      `(n=${data.count})`,
    );
  }
  lines.push('');

  // 業種別マッチ率
  lines.push('-'.repeat(60));
  lines.push('  Match Rate by Industry');
  lines.push('-'.repeat(60));
  for (const [industry, data] of Object.entries(summary.matchRateByIndustry)) {
    lines.push(
      `  ${industry.padEnd(20)} ` +
      `avg=${(data.avgMatchRate * 100).toFixed(1)}% ` +
      `(n=${data.count})`,
    );
  }
  lines.push('');

  // PIVOT分布
  lines.push('-'.repeat(60));
  lines.push('  Overall PIVOT Distribution');
  lines.push('-'.repeat(60));
  const pivotLabels: Record<string, string> = {
    P: 'Pain（課題）      ',
    I: 'Insecurity（不安）',
    V: 'Vision（要望）    ',
    O: 'Objection（抵抗） ',
    T: 'Traction（成功）  ',
  };
  const totalPivot = Object.values(summary.overallPivotDistribution).reduce((a, b) => a + b, 0);
  for (const [pivot, count] of Object.entries(summary.overallPivotDistribution)) {
    const pct = totalPivot > 0 ? (count / totalPivot * 100).toFixed(1) : '0.0';
    const bar = '#'.repeat(Math.round(count / totalPivot * 40));
    lines.push(`  ${pivotLabels[pivot] || pivot} ${String(count).padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
  lines.push('');

  // マート別期待レコード数
  lines.push('-'.repeat(60));
  lines.push('  Expected Mart Record Counts');
  lines.push('-'.repeat(60));
  for (const [mart, count] of Object.entries(summary.expectedMartCounts)) {
    lines.push(`  ${mart.padEnd(30)} ${count} records`);
  }
  lines.push('');

  // 要望別マッチ率（上位/下位）
  lines.push('-'.repeat(60));
  lines.push('  Demand Match Rates');
  lines.push('-'.repeat(60));
  const sortedDemands = Object.entries(summary.matchRateByDemand)
    .sort((a, b) => b[1].matchRate - a[1].matchRate);
  for (const [demandId, data] of sortedDemands) {
    const status = data.matchRate >= 0.7 ? 'HIGH' : data.matchRate >= 0.4 ? 'MED ' : 'LOW ';
    lines.push(
      `  [${status}] ${(data.matchRate * 100).toFixed(0).padStart(3)}% ` +
      `(${data.matches}/${data.totalChecks}) ` +
      `${data.demandDescription.substring(0, 50)}`,
    );
  }
  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}
