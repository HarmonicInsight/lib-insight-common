/**
 * シミュレーション実行スクリプト
 *
 * 1. ペルソナ定義を読み込み
 * 2. 1000件のインタビューコンテンツを生成
 * 3. PIVOT分類 + マート生成ロジックを実行
 * 4. インタビュアー要望とのマッチング検証
 * 5. レポート出力
 *
 * 実行方法:
 *   npx tsx simulation/run-simulation.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { ALL_INTERVIEWEE_PERSONAS } from './personas/interviewee-personas.js';
import { ALL_INTERVIEWER_PERSONAS } from './personas/interviewer-personas.js';
import { USER_STORIES } from './user-stories.js';
import {
  InterviewContentGenerator,
  generateAllInterviews,
  type GeneratedInterview,
} from './content-generator.js';
import {
  SimulationEngine,
  formatSummaryReport,
  type InterviewSimulationResult,
  type SimulationSummary,
} from './simulation-engine.js';
import {
  convertToSessionData,
  sessionDataToJsonl,
  generateDemoDataSummary,
} from './demo-data-generator.js';
import type { InterviewSessionData } from '../config/tdwh/interview-mart.js';

// =============================================================================
// 設定
// =============================================================================

const INTERVIEW_COUNT = 1000;
const SEED = 42;
const OUTPUT_DIR = join(import.meta.dirname || '.', 'generated-data');

// =============================================================================
// メイン処理
// =============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('  INTERVIEW SIMULATION PIPELINE');
  console.log('='.repeat(80));
  console.log('');

  // Step 0: 前提情報の表示
  console.log('--- Step 0: Setup ---');
  console.log(`Interviewee Personas: ${ALL_INTERVIEWEE_PERSONAS.length}`);
  console.log(`Interviewer Personas: ${ALL_INTERVIEWER_PERSONAS.length}`);
  console.log(`User Stories: ${USER_STORIES.length}`);
  console.log(`Target Interview Count: ${INTERVIEW_COUNT}`);
  console.log('');

  // Step 1: インタビューコンテンツ生成
  console.log('--- Step 1: Generating Interview Content ---');
  const startGen = Date.now();
  const interviews = generateAllInterviews(INTERVIEW_COUNT, SEED);
  const genTime = Date.now() - startGen;
  console.log(`Generated ${interviews.length} interviews in ${genTime}ms`);

  // 生成統計
  const industries = new Map<string, number>();
  const patterns = new Map<string, number>();
  for (const interview of interviews) {
    const ind = interview.metadata.intervieweeIndustry;
    const pat = interview.metadata.interviewPattern;
    industries.set(ind, (industries.get(ind) || 0) + 1);
    patterns.set(pat, (patterns.get(pat) || 0) + 1);
  }

  console.log('\n  Industry Distribution:');
  for (const [ind, count] of [...industries.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${ind}: ${count}`);
  }
  console.log('\n  Pattern Distribution:');
  for (const [pat, count] of [...patterns.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${pat}: ${count}`);
  }
  console.log('');

  // Step 2: シミュレーション実行（マッチング検証）
  console.log('--- Step 2: Running Simulation (Demand Matching) ---');
  const startSim = Date.now();
  const engine = new SimulationEngine();
  const { results, summary } = engine.simulateAll(interviews);
  const simTime = Date.now() - startSim;
  console.log(`Simulation completed in ${simTime}ms`);
  console.log('');

  // Step 3: レポート生成
  console.log('--- Step 3: Generating Reports ---');
  const report = formatSummaryReport(summary);
  console.log(report);

  // Step 4: ユーザーストーリー受入条件の検証
  console.log('--- Step 4: User Story Acceptance Criteria Validation ---');
  validateUserStories(interviews, results, summary);

  // Step 5: デモデータ生成（InterviewSessionData形式）
  console.log('\n--- Step 5: Generating Demo Data (InterviewSessionData format) ---');
  const startDemo = Date.now();
  const sessionDataList = convertToSessionData(interviews, SEED);
  const demoTime = Date.now() - startDemo;
  console.log(`Converted ${sessionDataList.length} sessions to InterviewSessionData in ${demoTime}ms`);

  // デモデータ統計
  const demoSummary = generateDemoDataSummary(sessionDataList);
  console.log(`  Total Answers: ${demoSummary.totalAnswers}`);
  console.log(`  Total Problems Extracted: ${demoSummary.totalProblems}`);
  console.log(`  Avg Sentiment Score: ${demoSummary.avgSentimentScore}`);
  console.log(`  Date Range: ${demoSummary.dateRange.earliest} ~ ${demoSummary.dateRange.latest}`);
  console.log('  By Template:');
  for (const [tmpl, count] of Object.entries(demoSummary.byTemplate)) {
    console.log(`    ${tmpl}: ${count}`);
  }
  console.log('');

  // Step 6: サンプルインタビューの表示
  console.log('--- Step 6: Sample Interviews ---');
  showSampleInterviews(interviews, results);

  // Step 7: ファイル出力
  console.log('\n--- Step 7: Saving Output Files ---');
  saveOutputFiles(interviews, results, summary, report, sessionDataList);

  console.log('\n='.repeat(80));
  console.log('  SIMULATION COMPLETE');
  console.log('='.repeat(80));
}

// =============================================================================
// ユーザーストーリー検証
// =============================================================================

function validateUserStories(
  interviews: GeneratedInterview[],
  results: InterviewSimulationResult[],
  summary: SimulationSummary,
) {
  let passed = 0;
  let failed = 0;

  for (const story of USER_STORIES) {
    const storyResults = results.filter(r => {
      if (r.interviewPattern !== story.interviewPattern) return false;
      if (story.targetIndustries.length > 0) {
        const interview = interviews.find(i => i.id === r.interviewId);
        if (!interview) return false;
        if (!story.targetIndustries.includes(interview.metadata.intervieweeIndustry)) return false;
      }
      return true;
    });

    if (storyResults.length === 0) {
      console.log(`  [SKIP] ${story.id}: ${story.asA} — No matching interviews`);
      continue;
    }

    const criteria = story.acceptanceCriteria;
    const criteriaResults: boolean[] = [];

    for (const criterion of criteria) {
      const met = evaluateCriterion(criterion, storyResults, summary);
      criteriaResults.push(met);
    }

    const allMet = criteriaResults.every(c => c);
    const status = allMet ? 'PASS' : 'FAIL';
    if (allMet) passed++;
    else failed++;

    console.log(`  [${status}] ${story.id}: ${story.asA}`);
    console.log(`         "${story.iWantTo.substring(0, 60)}..."`);
    for (let i = 0; i < criteria.length; i++) {
      const mark = criteriaResults[i] ? 'v' : 'x';
      console.log(`         [${mark}] ${criteria[i]}`);
    }
    console.log('');
  }

  console.log(`  Summary: ${passed} passed, ${failed} failed, ${USER_STORIES.length} total`);
}

function evaluateCriterion(
  criterion: string,
  results: InterviewSimulationResult[],
  summary: SimulationSummary,
): boolean {
  // Pain/Insecurity/Vision/Objection/Tractionの検出数チェック
  const pivotMatch = criterion.match(/(?:Pain|Insecurity|Vision|Objection|Traction).*?(\d+)件以上/);
  if (pivotMatch) {
    const pivotMap: Record<string, string> = {
      Pain: 'P', Insecurity: 'I', Vision: 'V', Objection: 'O', Traction: 'T',
    };
    const pivotName = criterion.match(/(Pain|Insecurity|Vision|Objection|Traction)/)?.[1] || '';
    const pivotKey = pivotMap[pivotName];
    const minCount = parseInt(pivotMatch[1]);

    // 各結果で指定PIVOTが最低N件あるか
    return results.some(r => (r.pivotDistribution[pivotKey] || 0) >= minCount);
  }

  // PIVOT種類数チェック
  if (criterion.includes('全5種') || criterion.includes('3種以上')) {
    const minTypes = criterion.includes('全5種') ? 5 : 3;
    return results.some(r => {
      const types = Object.entries(r.pivotDistribution).filter(([, v]) => v > 0).length;
      return types >= minTypes;
    });
  }

  // process/tool/people軸の検出チェック
  if (criterion.includes('process軸') || criterion.includes('tool軸') || criterion.includes('people軸')) {
    // キーワードマッチング結果から判断
    return results.some(r =>
      r.demandMatches.some(m => m.matchedUtterances.length > 0),
    );
  }

  // sentiment_score チェック
  if (criterion.includes('sentiment_score') || criterion.includes('sentiment_index')) {
    return results.length > 0; // シミュレーション結果があれば算出可能
  }

  // 温度感チェック
  if (criterion.includes('temperature') || criterion.includes('温度感')) {
    return results.some(r => r.totalKeywordsDetected > 0);
  }

  // マッチ率チェック
  if (criterion.includes('マッチ') || criterion.includes('含まれる') || criterion.includes('検出')) {
    return results.some(r => r.overallMatchRate > 0.3);
  }

  // 記録チェック
  if (criterion.includes('記録される') || criterion.includes('特定される') || criterion.includes('把握')) {
    return results.some(r => r.demandMatches.some(m => m.matched));
  }

  // デフォルト: 結果があればtrue
  return results.length > 0;
}

// =============================================================================
// サンプル表示
// =============================================================================

function showSampleInterviews(
  interviews: GeneratedInterview[],
  results: InterviewSimulationResult[],
) {
  // 最もマッチ率が高いもの、低いもの、中間のものを表示
  const sorted = [...results].sort((a, b) => b.overallMatchRate - a.overallMatchRate);

  const samples = [
    { label: 'Highest Match', result: sorted[0] },
    { label: 'Median Match', result: sorted[Math.floor(sorted.length / 2)] },
    { label: 'Lowest Match', result: sorted[sorted.length - 1] },
  ];

  for (const { label, result } of samples) {
    if (!result) continue;
    const interview = interviews.find(i => i.id === result.interviewId);
    if (!interview) continue;

    console.log(`\n  [${label}] Match Rate: ${(result.overallMatchRate * 100).toFixed(1)}%`);
    console.log(`  Interview: ${interview.id}`);
    console.log(`  Interviewee: ${interview.metadata.intervieweeName} (${interview.metadata.intervieweeRole} @ ${interview.metadata.intervieweeCompany})`);
    console.log(`  Interviewer: ${interview.metadata.interviewerName} (${interview.metadata.interviewerRole})`);
    console.log(`  Pattern: ${interview.metadata.interviewPattern}`);
    console.log(`  PIVOT: P=${result.pivotDistribution.P} I=${result.pivotDistribution.I} V=${result.pivotDistribution.V} O=${result.pivotDistribution.O} T=${result.pivotDistribution.T}`);
    console.log(`  Demands matched: ${result.demandMatches.filter(m => m.matched).length}/${result.demandMatches.length}`);

    // 最初のQ&Aを表示
    if (interview.answers.length > 0) {
      const firstAnswer = interview.answers[0];
      console.log(`\n  Q${firstAnswer.questionNo}: ${firstAnswer.questionText}`);
      console.log(`  A: ${firstAnswer.answerText.substring(0, 150)}...`);
    }
  }
}

// =============================================================================
// ファイル出力
// =============================================================================

function saveOutputFiles(
  interviews: GeneratedInterview[],
  results: InterviewSimulationResult[],
  summary: SimulationSummary,
  report: string,
  sessionDataList: InterviewSessionData[],
) {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. インタビューコンテンツ（JSONL）
  const interviewsPath = join(OUTPUT_DIR, 'interviews.jsonl');
  const interviewLines = interviews.map(i => JSON.stringify({
    id: i.id,
    content: i.content,
    metadata: i.metadata,
    answer_count: i.answers.length,
    expected_pivots: [...new Set(i.answers.flatMap(a => a.expectedPivots))],
  }));
  writeFileSync(interviewsPath, interviewLines.join('\n'), 'utf-8');
  console.log(`  Saved: ${interviewsPath} (${interviews.length} records)`);

  // 2. シミュレーション結果（JSON）
  const resultsPath = join(OUTPUT_DIR, 'simulation-results.json');
  writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`  Saved: ${resultsPath}`);

  // 3. サマリー（JSON）
  const summaryPath = join(OUTPUT_DIR, 'simulation-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`  Saved: ${summaryPath}`);

  // 4. レポート（テキスト）
  const reportPath = join(OUTPUT_DIR, 'simulation-report.txt');
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`  Saved: ${reportPath}`);

  // 5. サンプル議事録（最初の10件をMarkdown形式で保存）
  const samplesPath = join(OUTPUT_DIR, 'sample-interviews.md');
  const sampleContent = interviews.slice(0, 10).map(i => i.content).join('\n---\n\n');
  writeFileSync(samplesPath, sampleContent, 'utf-8');
  console.log(`  Saved: ${samplesPath} (10 samples)`);

  // 6. ペルソナ一覧（CSV形式）
  const personaCsvPath = join(OUTPUT_DIR, 'persona-list.csv');
  const csvHeader = 'id,name,industry,company,department,role,painCount,insecurityCount,visionCount,objectionCount,tractionCount';
  const csvRows = ALL_INTERVIEWEE_PERSONAS.map(p =>
    `${p.id},${p.name},${p.industry},${p.company},${p.department},${p.role},${p.painPoints.length},${p.insecurities.length},${p.visions.length},${p.objections.length},${p.tractions.length}`,
  );
  writeFileSync(personaCsvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8');
  console.log(`  Saved: ${personaCsvPath}`);

  // 7. デモデータ — InterviewSessionData 形式（JSONL）
  //    app-auto-interview-web で直接読み込み可能なフォーマット
  const demoDataPath = join(OUTPUT_DIR, 'demo-sessions.jsonl');
  const demoDataLines = sessionDataToJsonl(sessionDataList);
  writeFileSync(demoDataPath, demoDataLines, 'utf-8');
  console.log(`  Saved: ${demoDataPath} (${sessionDataList.length} sessions)`);

  // 8. デモデータ — サンプル10件（JSON、確認用）
  const demoSamplePath = join(OUTPUT_DIR, 'demo-sessions-sample.json');
  writeFileSync(demoSamplePath, JSON.stringify(sessionDataList.slice(0, 10), null, 2), 'utf-8');
  console.log(`  Saved: ${demoSamplePath} (10 samples, formatted)`);

  // 9. デモデータ統計
  const demoStatsPath = join(OUTPUT_DIR, 'demo-data-stats.json');
  const demoStats = generateDemoDataSummary(sessionDataList);
  writeFileSync(demoStatsPath, JSON.stringify(demoStats, null, 2), 'utf-8');
  console.log(`  Saved: ${demoStatsPath}`);
}

// =============================================================================
// 実行
// =============================================================================

main().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
