/**
 * AI アシスタント スキルシステム定義
 *
 * Anthropic Knowledge Work Plugins のアーキテクチャを参考に、
 * Insight Business Suite 系アプリの AI アシスタントにドメイン特化スキルを追加する。
 *
 * 参照: https://github.com/anthropics/knowledge-work-plugins
 *
 * 【設計方針】
 * - Skill = Claude が自動的に関連場面で参照するドメイン知識
 * - Command = ユーザーが明示的に呼び出すアクション
 * - Anthropic 方式: Markdown ベース・ファイル駆動
 * - HI 拡張: ライセンスゲート・製品コード紐付け・日本語対応
 *
 * 【Anthropic プラグイン構造（参考）】
 * plugin-name/
 * ├── .claude-plugin/plugin.json   # マニフェスト
 * ├── .mcp.json                    # コネクタ
 * ├── commands/                    # スラッシュコマンド
 * └── skills/                      # ドメイン知識
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** スキルカテゴリ */
export type SkillCategory =
  | 'finance'           // 経理・財務（Finance プラグイン参考）
  | 'legal'             // 法務（Legal プラグイン参考）
  | 'data-analysis'     // データ分析（Data プラグイン参考）
  | 'content-creation'  // コンテンツ作成（Marketing プラグイン参考）
  | 'productivity'      // 生産性管理（Productivity プラグイン参考）
  | 'sales'             // 営業支援（Sales プラグイン参考）
  | 'support'           // サポート（Customer Support プラグイン参考）
  | 'search';           // 検索（Enterprise Search プラグイン参考）

/** AI コンテキストタイプ — ai-assistant.ts から再エクスポート */
import type { AiContextType } from './ai-assistant';
export type { AiContextType };

/** スキル定義 */
export interface SkillDefinition {
  /** スキル一意識別子 */
  id: string;
  /** スキルカテゴリ */
  category: SkillCategory;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  nameEn: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
  /** 対象製品コード */
  targetProducts: ProductCode[];
  /** 対象コンテキストタイプ */
  targetContexts: AiContextType[];
  /** 最低必要プラン */
  requiredPlan: PlanCode;
  /** スキルを自動起動するトリガーパターン（正規表現 or キーワード） */
  triggerPatterns: string[];
  /** システムプロンプトに追加するドメイン知識 */
  systemPromptExtension: string;
  /** Anthropic プラグインの参照元 */
  sourcePlugin: string;
  /** Anthropic プラグインの参照スキル名 */
  sourceSkill: string;
}

/** コマンド定義 */
export interface CommandDefinition {
  /** コマンド名（/prefix:command 形式で使用） */
  name: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  nameEn: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
  /** 対象製品コード */
  targetProducts: ProductCode[];
  /** 最低必要プラン */
  requiredPlan: PlanCode;
  /** コマンド実行時のプロンプトテンプレート */
  promptTemplate: string;
  /** 入力パラメータ定義 */
  parameters?: CommandParameter[];
  /** Anthropic プラグインの参照元 */
  sourcePlugin: string;
  /** Anthropic プラグインの参照コマンド名 */
  sourceCommand: string;
}

/** コマンドパラメータ */
export interface CommandParameter {
  name: string;
  nameJa: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
}

/** プラグインマニフェスト（HI 拡張版） */
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  descriptionJa: string;
  author: { name: string };
  targetProducts: ProductCode[];
  requiredPlan: PlanCode;
  locale: ('ja' | 'en')[];
  skills: string[];
  commands: string[];
}

// =============================================================================
// IOSH（Insight Performance Management）向けスキル
// =============================================================================

/** 仕訳準備スキル（Finance: journal-entry-prep 参考） */
const SKILL_JOURNAL_ENTRY: SkillDefinition = {
  id: 'spreadsheet-journal-entry',
  category: 'finance',
  nameJa: '仕訳準備',
  nameEn: 'Journal Entry Preparation',
  descriptionJa: '月次仕訳の準備・テンプレート・承認ワークフローを支援',
  descriptionEn: 'Assist with monthly journal entry preparation, templates, and approval workflows',
  targetProducts: ['IOSH'],
  targetContexts: ['spreadsheet'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    '仕訳', '計上', 'journal entry', 'accrual', '減価償却', 'depreciation',
    '前払', 'prepaid', '給与', 'payroll', '収益認識', 'revenue recognition',
  ],
  sourcePlugin: 'finance',
  sourceSkill: 'journal-entry-prep',
  systemPromptExtension: `
【仕訳準備スキル】
あなたは月次仕訳の準備を支援する専門家です。以下の仕訳タイプに対応します:

1. 買掛金未払計上（AP Accruals）
   - 受領済み・未請求の商品/サービスを計上
   - 翌期に逆仕訳が必要
   - 見積方法の文書化を推奨

2. 固定資産減価償却（Fixed Asset Depreciation）
   - 定額法（最も一般的）、定率法、生産高比例法に対応
   - 固定資産台帳からのデータ取得を推奨

3. 前払費用償却（Prepaid Expense Amortization）
   - 保険料・ソフトウェアライセンス等の期間按分
   - 償却スケジュールの管理

4. 給与計上（Payroll Accruals）
   - 給与・賞与・福利厚生・税金を計算
   - 営業日数とポリシーに基づく計算

5. 収益認識（Revenue Recognition — ASC 606 / IFRS 15）
   - 履行義務の特定と充足に応じた認識

【承認マトリクス】
- 定常仕訳（金額不問）: 経理マネージャー承認
- 25万円超の非定常仕訳: 経理部長承認
- 100万円超: CFO 承認

【必須項目】
各仕訳には以下を含めること:
- 明確な説明、計算根拠、証憑、対象期間、起票者、承認証跡、逆仕訳要否
`,
};

/** 差異分析スキル（Finance: variance-analysis 参考） */
const SKILL_VARIANCE_ANALYSIS: SkillDefinition = {
  id: 'spreadsheet-variance-analysis',
  category: 'finance',
  nameJa: '差異分析',
  nameEn: 'Variance Analysis',
  descriptionJa: '予実差異の要因分解・ウォーターフォール分析を支援',
  descriptionEn: 'Assist with budget vs actual variance decomposition and waterfall analysis',
  targetProducts: ['IOSH'],
  targetContexts: ['spreadsheet'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    '差異', '分析', 'variance', '予実', '乖離', '要因分解',
    'waterfall', 'ウォーターフォール', '前年比', 'YoY', 'MoM',
  ],
  sourcePlugin: 'finance',
  sourceSkill: 'variance-analysis',
  systemPromptExtension: `
【差異分析スキル】
あなたは財務差異分析の専門家です。以下の分解手法に対応します:

1. Price/Volume 分解
   - Volume Effect = (実績数量 - 予算数量) × 予算単価
   - Price Effect = (実績単価 - 予算単価) × 実績数量
   - 合計差異 = Volume Effect + Price Effect

2. Rate/Mix 分解
   - セグメント別の加重平均レート変動分析
   - 製品ミックス変動の影響測定

3. 人件費分析（Headcount/Compensation）
   - 人数変動、レート変動、ミックス変動、タイミング効果、離職影響に分解

【マテリアリティ閾値】
- 予実比較: 5-10%
- 前年比較: 10-15%
- 前月比較: 15-20%
※ 閾値以上の差異を優先的に調査対象とする

【ナラティブ要件】
差異説明は以下を含むこと:
- 具体的なドライバー名（「売上が減少」ではなく「A商品の販売数量が15%減少」）
- 金額の定量化
- 因果関係の説明
- 今後の継続見込み
- 推奨アクション（2-4文）

【可視化】
ウォーターフォールチャートで表現する場合:
- 論理的順序（大→小）
- 要素は5-8項目に制限
- 合計の検算を必ず実施
`,
};

/** 勘定照合スキル（Finance: reconciliation 参考） */
const SKILL_RECONCILIATION: SkillDefinition = {
  id: 'spreadsheet-reconciliation',
  category: 'finance',
  nameJa: '勘定照合',
  nameEn: 'Account Reconciliation',
  descriptionJa: 'GL-補助元帳照合、銀行照合、会社間照合を支援',
  descriptionEn: 'Assist with GL-to-subledger, bank, and intercompany reconciliation',
  targetProducts: ['IOSH'],
  targetContexts: ['spreadsheet'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    '照合', '突合', 'reconciliation', 'reconcile', '残高確認',
    '銀行照合', 'bank rec', '会社間', 'intercompany',
  ],
  sourcePlugin: 'finance',
  sourceSkill: 'reconciliation',
  systemPromptExtension: `
【勘定照合スキル】
あなたは勘定照合の専門家です。以下の照合タイプに対応します:

1. GL-補助元帳照合: 総勘定元帳と補助元帳の残高一致確認
2. 銀行照合: 帳簿残高と銀行残高の差異調査
3. 会社間照合: グループ会社間の取引残高一致確認

【照合手順】
1. 両方のソースからデータを取得
2. 自動マッチング（金額・日付・参照番号）
3. 未照合項目の分類（タイミング差異 / 金額差異 / 欠落取引）
4. 調整仕訳の提案
5. 照合完了報告書の生成
`,
};

/** 月次クローズ管理スキル（Finance: close-management 参考） */
const SKILL_CLOSE_MANAGEMENT: SkillDefinition = {
  id: 'spreadsheet-close-management',
  category: 'finance',
  nameJa: '月次クローズ管理',
  nameEn: 'Month-End Close Management',
  descriptionJa: '月次決算クローズのタスク管理・チェックリストを支援',
  descriptionEn: 'Assist with month-end close task management and checklists',
  targetProducts: ['IOSH'],
  targetContexts: ['spreadsheet'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    '月次', 'クローズ', 'close', '締め', '決算', '月末',
    'month-end', 'checklist', 'チェックリスト',
  ],
  sourcePlugin: 'finance',
  sourceSkill: 'close-management',
  systemPromptExtension: `
【月次クローズ管理スキル】
月次決算クローズの進捗管理を支援します。

【標準クローズチェックリスト】
Day 1-2: 取引記録の締め、仮勘定の精査
Day 3-4: 未払計上、前払償却、減価償却
Day 5-6: 勘定照合、会社間照合
Day 7-8: 財務諸表ドラフト作成、差異分析
Day 9-10: レビュー、修正仕訳、最終化

各タスクの完了基準: 証憑添付・承認取得・残高確認
`,
};

/** データクエリ作成スキル（Data: write-query 参考） */
const SKILL_QUERY_WRITING: SkillDefinition = {
  id: 'spreadsheet-query-writing',
  category: 'data-analysis',
  nameJa: 'クエリ・数式作成',
  nameEn: 'Query & Formula Writing',
  descriptionJa: '自然言語からExcel数式・SQLクエリを生成',
  descriptionEn: 'Generate Excel formulas and SQL queries from natural language',
  targetProducts: ['IOSH', 'INPY'],
  targetContexts: ['spreadsheet', 'code'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'SQL', 'クエリ', 'query', '数式', 'formula', 'VLOOKUP',
    'SUMIFS', 'COUNTIFS', 'INDEX', 'MATCH', 'ピボット', 'pivot',
  ],
  sourcePlugin: 'data',
  sourceSkill: 'write-query',
  systemPromptExtension: `
【クエリ・数式作成スキル】
自然言語の説明から最適な Excel 数式または SQL クエリを生成します。

【Excel 数式】
- 目的に応じた最適な関数を選択（VLOOKUP よりも INDEX/MATCH を推奨）
- 配列数式が必要な場合は明示
- 数式の各部分の説明を付与
- エラーハンドリング（IFERROR）を必要に応じて追加

【SQL クエリ】
- CTE（WITH 句）で可読性を確保
- SELECT * は使わず必要カラムのみ指定
- WHERE 句を早い段階で適用（パフォーマンス）
- 方言（PostgreSQL / MySQL / SQLite 等）を確認
- 各セクションの説明コメントを付与
`,
};

// =============================================================================
// IOSD（Insight AI Briefcase）向けスキル
// =============================================================================

/** 契約書レビュースキル（Legal: contract-review 参考） */
const SKILL_CONTRACT_REVIEW: SkillDefinition = {
  id: 'document-contract-review',
  category: 'legal',
  nameJa: '契約書レビュー',
  nameEn: 'Contract Review',
  descriptionJa: '契約書の条項分析・リスク評価・レッドライン生成を支援',
  descriptionEn: 'Assist with contract clause analysis, risk assessment, and redline generation',
  targetProducts: ['IOSD'],
  targetContexts: ['document'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    '契約', 'contract', 'レビュー', 'review', '条項', 'clause',
    'NDA', '秘密保持', '責任制限', 'liability', '補償', 'indemnif',
  ],
  sourcePlugin: 'legal',
  sourceSkill: 'contract-review',
  systemPromptExtension: `
【契約書レビュースキル】
あなたは社内法務チーム向けの契約書レビューアシスタントです。
※ 法的助言ではなく、ワークフロー支援です。最終判断は法務専門家が行います。

【レビュー手順】
1. 契約タイプの特定（SaaS / 業務委託 / ライセンス / パートナーシップ等）
2. 当事者の立場確認（ベンダー / 顧客 / ライセンサー / ライセンシー）
3. 契約全体を通読（条項間の相互作用を考慮）
4. 主要条項の分析
5. 全体的なリスクバランスの評価

【6大分析条項】
1. 責任制限 — 上限額、相互性、カーブアウト、間接損害除外
2. 補償 — 相互性、範囲、上限、防御権、存続期間
3. 知的財産 — 既存IP所有権、開発IP、ライセンス範囲
4. データ保護 — DPA要否、データ処理者分類、越境移転、削除義務
5. 期間・解約 — 初期期間、自動更新、中途解約、解約効果
6. 準拠法・紛争解決 — 管轄、仲裁/訴訟、陪審放棄

【重大度分類】
GREEN（許容）: 自社標準と同等以上。交渉不要。
YELLOW（交渉要）: 標準範囲外だが交渉余地あり。代替文言を提案。
RED（エスカレーション）: 重大リスク。上位承認・外部弁護士の関与が必要。

【レッドライン生成フォーマット】
各レッドラインに以下を含む:
- 条項名・セクション番号
- 現行文言の引用
- 提案する代替文言
- 根拠（相手方への説明に使える文面）
- 優先度（Must-have / Should-have / Nice-to-have）
- フォールバック案（主要提案が拒否された場合）

【交渉優先度】
Tier 1（Deal Breakers）: 責任制限なし、データ保護不備、コアIP移転
Tier 2（Strong Preferences）: 責任上限調整、補償範囲、解約柔軟性
Tier 3（Concession Candidates）: 準拠法、通知期間、細部の定義修正
→ Tier 3 を譲歩して Tier 2 を獲得する戦略
`,
};

/** NDA トリアージスキル（Legal: nda-triage 参考） */
const SKILL_NDA_TRIAGE: SkillDefinition = {
  id: 'document-nda-triage',
  category: 'legal',
  nameJa: 'NDA 審査',
  nameEn: 'NDA Triage',
  descriptionJa: 'NDA の迅速審査・リスク分類・承認ルーティングを支援',
  descriptionEn: 'Assist with rapid NDA review, risk classification, and approval routing',
  targetProducts: ['IOSD'],
  targetContexts: ['document'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'NDA', '秘密保持', '機密', 'confidential', 'non-disclosure',
    '情報開示', 'mutual NDA',
  ],
  sourcePlugin: 'legal',
  sourceSkill: 'nda-triage',
  systemPromptExtension: `
【NDA トリアージスキル】
NDA（秘密保持契約）の迅速審査を支援します。

【チェック項目】
- 相互/一方向の確認
- 秘密情報の定義範囲
- 除外事項の妥当性
- 存続期間（標準: 2-3年）
- 返還・破棄義務
- 差止請求権の有無
- 準拠法・管轄
`,
};

/** コンテンツ作成スキル（Marketing: content-creation 参考） */
const SKILL_CONTENT_CREATION: SkillDefinition = {
  id: 'document-content-creation',
  category: 'content-creation',
  nameJa: 'コンテンツ作成',
  nameEn: 'Content Creation',
  descriptionJa: 'ブログ・プレスリリース・ケーススタディ等のビジネス文書を作成支援',
  descriptionEn: 'Assist with creating blog posts, press releases, case studies and business documents',
  targetProducts: ['IOSD', 'INSS', 'INMV'],
  targetContexts: ['document', 'slide', 'video'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'ブログ', 'blog', 'プレスリリース', 'press release', 'ケーススタディ',
    'case study', 'ランディングページ', 'landing page', 'メルマガ', 'newsletter',
    'コンテンツ', 'content', 'SEO', '記事', 'article',
  ],
  sourcePlugin: 'marketing',
  sourceSkill: 'content-creation',
  systemPromptExtension: `
【コンテンツ作成スキル】
マーケティングコンテンツの構造化テンプレートに基づいて文書を作成支援します。

【対応コンテンツタイプ】
1. ブログ記事: 見出し → 導入(100-150語) → 本文(3-5セクション) → 結論 → メタ説明
2. SNS投稿: フック → 本文(2-4ポイント) → CTA → ハッシュタグ
3. メールニュースレター: 件名(50文字以内) → プレビュー → ヘッダー → 本文(2-3ブロック) → CTA
4. ランディングページ: ヘッドライン → サブヘッドライン → 価値提案 → 社会的証明 → FAQ → CTA
5. プレスリリース: 見出し → 日付 → リード → 本文 → ボイラープレート → 連絡先
6. ケーススタディ: タイトル → スナップショット → 課題 → 解決策 → 成果 → 引用 → CTA

【SEO基本チェック】
- タイトルタグ: 60文字以内、主要キーワード含む
- メタ説明: 160文字以内
- H1: ページに1つ
- 内部リンク: 2-3本
- 画像 alt テキスト
`,
};

// =============================================================================
// INSS（Insight Deck Quality Gate）向けスキル
// =============================================================================

/** ステークホルダー報告スキル（PM: stakeholder-comms 参考） */
const SKILL_STAKEHOLDER_UPDATE: SkillDefinition = {
  id: 'slide-stakeholder-update',
  category: 'productivity',
  nameJa: 'ステークホルダー報告',
  nameEn: 'Stakeholder Update',
  descriptionJa: 'ステークホルダー向けの進捗報告スライドを構造化作成',
  descriptionEn: 'Create structured progress report slides for stakeholders',
  targetProducts: ['INSS'],
  targetContexts: ['slide'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'ステークホルダー', 'stakeholder', '報告', 'report', '進捗',
    'progress', '週次', 'weekly', '月次報告', 'status update',
  ],
  sourcePlugin: 'product-management',
  sourceSkill: 'stakeholder-comms',
  systemPromptExtension: `
【ステークホルダー報告スキル】
進捗報告の構造化テンプレート:

1. エグゼクティブサマリー（1スライド）
   - 全体ステータス: On Track / At Risk / Blocked
   - KPI サマリー（3-5指標）
   - 主要成果（今期）
   - 次期予定

2. 詳細進捗（2-3スライド）
   - ワークストリーム別進捗
   - マイルストーン達成状況
   - リスク・課題一覧

3. 数値レビュー（1-2スライド）
   - 予実比較
   - トレンドチャート
   - 主要メトリクス

4. ネクストステップ（1スライド）
   - 次期のアクションアイテム
   - 意思決定事項
   - 支援依頼事項
`,
};

// =============================================================================
// INPY（InsightPy）向けスキル
// =============================================================================

/** データ分析スキル（Data: analyze + explore-data 参考） */
const SKILL_DATA_ANALYSIS: SkillDefinition = {
  id: 'python-data-analysis',
  category: 'data-analysis',
  nameJa: 'データ分析',
  nameEn: 'Data Analysis',
  descriptionJa: 'pandas/numpy を活用したデータ分析スクリプトの生成を支援',
  descriptionEn: 'Assist with generating data analysis scripts using pandas/numpy',
  targetProducts: ['INPY', 'IOSH'],
  targetContexts: ['code', 'spreadsheet'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'データ分析', 'data analysis', 'pandas', 'numpy', '集計',
    'aggregate', '統計', 'statistics', 'グラフ', 'chart', 'plot',
    '可視化', 'visualization', 'matplotlib', 'seaborn',
  ],
  sourcePlugin: 'data',
  sourceSkill: 'analyze',
  systemPromptExtension: `
【データ分析スキル】
pandas / numpy / matplotlib / seaborn を活用したデータ分析を支援します。

【分析ワークフロー】
1. データ読み込みとプロファイリング
   - shape, dtypes, describe(), null 値確認
   - サンプルデータの表示
2. データクレンジング
   - 欠損値処理、型変換、外れ値検出
3. 探索的データ分析（EDA）
   - 分布確認、相関分析、グループ別集計
4. 可視化
   - 目的に適したチャートタイプの選択
   - 日本語フォント設定（matplotlib: japanize-matplotlib）
5. レポーティング
   - 分析結果のサマリー生成

【ベストプラクティス】
- メモリ効率を考慮（大規模データは chunk 処理）
- 再現性のため random_state を固定
- コメントで分析意図を明記
`,
};

// =============================================================================
// INMV（Insight Training Studio）向けスキル
// =============================================================================

/** ナレーションスクリプト作成スキル */
const SKILL_VIDEO_SCRIPT: SkillDefinition = {
  id: 'video-script-writing',
  category: 'content-creation',
  nameJa: 'ナレーションスクリプト作成',
  nameEn: 'Narration Script Writing',
  descriptionJa: '研修・教育動画のナレーションスクリプトを構造化作成',
  descriptionEn: 'Create structured narration scripts for training and educational videos',
  targetProducts: ['INMV'],
  targetContexts: ['video'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'ナレーション', 'narration', 'スクリプト', 'script', '台本', '読み上げ',
    'セリフ', '原稿', 'voiceover', 'VO',
  ],
  sourcePlugin: 'content-creation',
  sourceSkill: 'video-script-writing',
  systemPromptExtension: `
【ナレーションスクリプト作成スキル】
教育・研修動画のナレーションスクリプトを構造化作成します。

【スクリプト構造】
1. シーンごとにセクション分割
   - シーンID・タイトル・想定時間
   - ナレーションテキスト（読み上げ原稿）
   - 同期ポイント [SYNC: 画像名/アニメーション]
   - 画面上の補足テキスト（字幕用）

2. 品質基準
   - 1分あたり250-300文字（日本語）/ 120-150語（英語）
   - 1文は短く（20-30文字）
   - 専門用語は初出時に平易な言葉で解説
   - 数値は読み上げ形式（「1,234」→「千二百三十四」）

3. 構成パターン
   - 学習目標の提示 → 概要説明 → 詳細解説 → 演習・確認 → まとめ
   - 各セクションの冒頭で「これから〇〇について説明します」と予告
   - セクション末で「ここまでのポイントは〇〇です」と振り返り
`,
};

/** ストーリーボード設計スキル */
const SKILL_STORYBOARD: SkillDefinition = {
  id: 'video-storyboard',
  category: 'content-creation',
  nameJa: 'ストーリーボード設計',
  nameEn: 'Video Storyboard Design',
  descriptionJa: '動画のシーン構成・画面設計を提案',
  descriptionEn: 'Design video scene composition and visual layout',
  targetProducts: ['INMV'],
  targetContexts: ['video'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'ストーリーボード', 'storyboard', 'シーン構成', 'scene', '画面設計',
    '構成', '流れ', 'フロー', 'flow', 'レイアウト', 'layout',
  ],
  sourcePlugin: 'content-creation',
  sourceSkill: 'video-storyboard',
  systemPromptExtension: `
【ストーリーボード設計スキル】
動画のシーン構成・画面設計を提案します。

【設計原則】
1. 認知負荷理論
   - 1シーン1コンセプト（チャンキング）
   - 視覚要素とナレーションの整合性（モダリティ原理）
   - 冗長な装飾は排除（コヒーレンス原理）

2. シーン設計テンプレート
   - シーンID・タイトル・想定時間（秒）
   - 画面レイアウト（画像配置・テキスト領域）
   - トランジション（前シーンからの接続方法）
   - ナレーション概要
   - 字幕の要否

3. 動画タイプ別ガイドライン
   - 研修動画: 5-15分、段階的難易度、理解確認ポイント
   - 製品デモ: 2-5分、機能ハイライト、ユースケース
   - マーケティング: 30秒-3分、フック→価値提案→CTA
   - オンボーディング: 3-10分、ステップバイステップ、即実践可能

4. ペーシング
   - 導入（全体の10-15%）: 視聴者の関心を掴む
   - 本編（全体の70-80%）: 核心内容を段階的に展開
   - まとめ（全体の10-15%）: 要点整理・次のアクション
`,
};

// =============================================================================
// 全製品共通スキル
// =============================================================================

/** タスク管理スキル（Productivity: task-management 参考） */
const SKILL_TASK_MANAGEMENT: SkillDefinition = {
  id: 'common-task-management',
  category: 'productivity',
  nameJa: 'タスク管理',
  nameEn: 'Task Management',
  descriptionJa: 'プロジェクト内のタスク管理・進捗トラッキングを支援',
  descriptionEn: 'Assist with in-project task management and progress tracking',
  targetProducts: ['IOSH', 'INSS', 'IOSD', 'INPY', 'INBT', 'INMV'],
  targetContexts: ['spreadsheet', 'slide', 'document', 'code', 'video'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    'タスク', 'task', 'TODO', 'やること', '進捗', 'progress',
    '期限', 'deadline', '担当', 'assign',
  ],
  sourcePlugin: 'productivity',
  sourceSkill: 'task-management',
  systemPromptExtension: `
【タスク管理スキル】
プロジェクトファイル内のタスクを管理します。

【タスクフォーマット】
- **タスク名** - コンテキスト、担当者、期限
  - Active: 進行中のタスク
  - Waiting On: 他者待ちのタスク（since 日付を記載）
  - Someday: いつかやるタスク
  - Done: 完了タスク（完了日を記載）

【ルール】
- タスクの自動追加は行わない（必ずユーザー確認）
- 30日以上変更のないタスクはトリアージ対象
- 完了タスクは定期的にアーカイブ
`,
};

/** メモリ管理スキル（Productivity: memory-management 参考） */
const SKILL_MEMORY_MANAGEMENT: SkillDefinition = {
  id: 'common-memory-management',
  category: 'productivity',
  nameJa: 'コンテキスト記憶',
  nameEn: 'Context Memory',
  descriptionJa: 'ユーザーの組織コンテキスト（人物・略語・プロジェクト）を学習・保持',
  descriptionEn: 'Learn and retain organizational context (people, abbreviations, projects)',
  targetProducts: ['IOSH', 'INSS', 'IOSD', 'INPY', 'INBT', 'INMV'],
  targetContexts: ['spreadsheet', 'slide', 'document', 'code', 'video'],
  requiredPlan: 'BIZ',
  triggerPatterns: [
    '覚えて', 'remember', '記憶', 'memory', '略語', 'acronym',
    '用語', 'glossary', 'メモ', 'note',
  ],
  sourcePlugin: 'productivity',
  sourceSkill: 'memory-management',
  systemPromptExtension: `
【コンテキスト記憶スキル】
2層メモリシステムでユーザーの組織コンテキストを学習・保持します。

【ホットキャッシュ（ai_memory.json）】
- 頻出人物（~30名）: 名前・役職・関連プロジェクト
- 略語辞書（~30語）: 社内略語・専門用語
- アクティブプロジェクト: 名前・状態・関係者
- ユーザー設定: 表示形式の好み等

【ディープストレージ（ai_memory_deep/）】
- 完全用語集
- 人物詳細プロファイル
- プロジェクト詳細
- 組織コンテキスト

【検索フロー】
1. ホットキャッシュを参照（90%のケースで解決）
2. ディープストレージを検索
3. 不明な場合はユーザーに質問
4. 学習した内容を適切な層に保存

【昇格・降格ルール】
- 頻繁に参照 → ホットキャッシュに昇格
- プロジェクト完了・連絡先非アクティブ → ディープストレージに降格
`,
};

// =============================================================================
// スキルレジストリ
// =============================================================================

/** 全スキル定義 */
export const ALL_SKILLS: SkillDefinition[] = [
  // IOSH（Finance + Data）
  SKILL_JOURNAL_ENTRY,
  SKILL_VARIANCE_ANALYSIS,
  SKILL_RECONCILIATION,
  SKILL_CLOSE_MANAGEMENT,
  SKILL_QUERY_WRITING,
  // IOSD（Legal + Marketing）
  SKILL_CONTRACT_REVIEW,
  SKILL_NDA_TRIAGE,
  SKILL_CONTENT_CREATION,
  // INSS（PM + Marketing）
  SKILL_STAKEHOLDER_UPDATE,
  // INPY（Data）
  SKILL_DATA_ANALYSIS,
  // INMV（Content Creation）
  SKILL_VIDEO_SCRIPT,
  SKILL_STORYBOARD,
  // 全製品共通（Productivity）
  SKILL_TASK_MANAGEMENT,
  SKILL_MEMORY_MANAGEMENT,
];

// =============================================================================
// コマンド定義
// =============================================================================

/** 全コマンド定義 */
export const ALL_COMMANDS: CommandDefinition[] = [
  // IOSH 向け
  {
    name: 'journal-entry',
    nameJa: '仕訳準備',
    nameEn: 'Journal Entry',
    descriptionJa: '仕訳テンプレートを生成し、計上準備を支援します',
    descriptionEn: 'Generate journal entry templates and assist with posting preparation',
    targetProducts: ['IOSH'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'type', nameJa: '仕訳タイプ', type: 'select', required: true, options: ['accrual', 'depreciation', 'prepaid', 'payroll', 'revenue'] },
      { name: 'period', nameJa: '対象期間', type: 'string', required: true },
    ],
    promptTemplate: '指定された仕訳タイプ「{{type}}」の仕訳テンプレートを、対象期間「{{period}}」で生成してください。現在のスプレッドシートデータを参照して、具体的な金額と勘定科目を提案してください。',
    sourcePlugin: 'finance',
    sourceCommand: 'journal-entry',
  },
  {
    name: 'variance-analysis',
    nameJa: '差異分析',
    nameEn: 'Variance Analysis',
    descriptionJa: '選択範囲のデータから差異分析レポートを生成します',
    descriptionEn: 'Generate variance analysis report from selected data range',
    targetProducts: ['IOSH'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'comparison', nameJa: '比較タイプ', type: 'select', required: true, options: ['budget-vs-actual', 'yoy', 'mom', 'qoq'] },
    ],
    promptTemplate: '現在のスプレッドシートデータを使用して、「{{comparison}}」の差異分析を実施してください。Price/Volume分解を含め、マテリアリティ閾値を超える項目について要因分析とナラティブを生成してください。',
    sourcePlugin: 'finance',
    sourceCommand: 'variance-analysis',
  },
  {
    name: 'reconciliation',
    nameJa: '勘定照合',
    nameEn: 'Reconciliation',
    descriptionJa: '2つのデータソースの照合を実行します',
    descriptionEn: 'Perform reconciliation between two data sources',
    targetProducts: ['IOSH'],
    requiredPlan: 'BIZ',
    parameters: [],
    promptTemplate: '現在のスプレッドシートにある2つのデータソースを照合してください。マッチング、未照合項目の分類、調整仕訳の提案を行ってください。',
    sourcePlugin: 'finance',
    sourceCommand: 'reconciliation',
  },
  // IOSD 向け
  {
    name: 'review-contract',
    nameJa: '契約書レビュー',
    nameEn: 'Review Contract',
    descriptionJa: '契約書の条項分析・リスク評価・レッドライン生成を行います',
    descriptionEn: 'Analyze contract clauses, assess risks, and generate redlines',
    targetProducts: ['IOSD'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'side', nameJa: '当事者の立場', type: 'select', required: true, options: ['vendor', 'customer', 'licensor', 'licensee', 'partner'] },
      { name: 'type', nameJa: '契約タイプ', type: 'select', required: false, options: ['saas', 'services', 'license', 'partnership', 'procurement', 'nda'] },
    ],
    promptTemplate: '当事者の立場「{{side}}」として、現在のドキュメントを契約書レビューしてください。{{type}}タイプとして、6大条項（責任制限、補償、IP、データ保護、期間・解約、準拠法）を分析し、GREEN/YELLOW/REDの重大度分類とレッドラインを生成してください。',
    sourcePlugin: 'legal',
    sourceCommand: 'review-contract',
  },
  {
    name: 'triage-nda',
    nameJa: 'NDA審査',
    nameEn: 'Triage NDA',
    descriptionJa: 'NDAの迅速審査を行い、リスク分類と修正提案を出力します',
    descriptionEn: 'Perform rapid NDA review with risk classification and suggested edits',
    targetProducts: ['IOSD'],
    requiredPlan: 'BIZ',
    parameters: [],
    promptTemplate: '現在のドキュメントをNDAとして審査してください。相互/一方向、秘密情報の定義範囲、存続期間、準拠法をチェックし、リスク分類と修正提案を出力してください。',
    sourcePlugin: 'legal',
    sourceCommand: 'triage-nda',
  },
  // INSS 向け
  {
    name: 'stakeholder-update',
    nameJa: 'ステークホルダー報告',
    nameEn: 'Stakeholder Update',
    descriptionJa: 'ステークホルダー向けの進捗報告スライド構成を提案します',
    descriptionEn: 'Suggest structured progress report slide composition for stakeholders',
    targetProducts: ['INSS'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'audience', nameJa: '対象者', type: 'select', required: false, options: ['executive', 'team', 'client', 'board'] },
    ],
    promptTemplate: '対象者「{{audience}}」向けのステークホルダー報告スライドを構成してください。現在のスライドデータを参照し、エグゼクティブサマリー、詳細進捗、数値レビュー、ネクストステップの構成で提案してください。',
    sourcePlugin: 'product-management',
    sourceCommand: 'stakeholder-update',
  },
  // INMV 向け
  {
    name: 'create-storyboard',
    nameJa: 'ストーリーボード生成',
    nameEn: 'Create Storyboard',
    descriptionJa: '動画のシーン構成・ストーリーボードを生成します',
    descriptionEn: 'Generate scene composition and storyboard for the video',
    targetProducts: ['INMV'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'type', nameJa: '動画タイプ', type: 'select', required: true, options: ['training', 'product_demo', 'marketing', 'onboarding'] },
      { name: 'duration', nameJa: '目標時間（分）', type: 'number', required: false, defaultValue: 5 },
    ],
    promptTemplate: '動画タイプ「{{type}}」、目標時間「{{duration}}分」のストーリーボードを生成してください。現在のタイムラインデータを参照し、シーン構成・画面レイアウト・トランジション・ナレーション概要を提案してください。',
    sourcePlugin: 'content-creation',
    sourceCommand: 'create-storyboard',
  },
  {
    name: 'write-narration',
    nameJa: 'ナレーション生成',
    nameEn: 'Write Narration',
    descriptionJa: 'シーンのナレーションスクリプトを生成します',
    descriptionEn: 'Generate narration scripts for scenes',
    targetProducts: ['INMV'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'scope', nameJa: '対象範囲', type: 'select', required: true, options: ['all_scenes', 'current_scene', 'empty_scenes'] },
      { name: 'tone', nameJa: 'トーン', type: 'select', required: false, options: ['professional', 'friendly', 'academic', 'casual'] },
    ],
    promptTemplate: '対象範囲「{{scope}}」、トーン「{{tone}}」でナレーションスクリプトを生成してください。品質基準（250-300文字/分、短文、同期ポイント記法）に従い、現在のタイムラインデータに基づいて各シーンのナレーションを作成してください。',
    sourcePlugin: 'content-creation',
    sourceCommand: 'write-narration',
  },
  // INPY 向け
  {
    name: 'analyze-data',
    nameJa: 'データ分析',
    nameEn: 'Analyze Data',
    descriptionJa: 'データ分析スクリプトを生成・実行します',
    descriptionEn: 'Generate and execute data analysis scripts',
    targetProducts: ['INPY'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'goal', nameJa: '分析目的', type: 'string', required: true },
    ],
    promptTemplate: '分析目的「{{goal}}」に基づいて、Pythonデータ分析スクリプトを生成してください。pandas/matplotlib を使用し、データプロファイリング → クレンジング → 分析 → 可視化のワークフローで構成してください。',
    sourcePlugin: 'data',
    sourceCommand: 'analyze',
  },
  {
    name: 'write-query',
    nameJa: 'SQLクエリ作成',
    nameEn: 'Write SQL Query',
    descriptionJa: '自然言語の説明からSQLクエリを生成します',
    descriptionEn: 'Generate SQL queries from natural language descriptions',
    targetProducts: ['INPY', 'IOSH'],
    requiredPlan: 'BIZ',
    parameters: [
      { name: 'description', nameJa: '取得したいデータの説明', type: 'string', required: true },
      { name: 'dialect', nameJa: 'SQL方言', type: 'select', required: false, options: ['postgresql', 'mysql', 'sqlite', 'snowflake', 'bigquery'] },
    ],
    promptTemplate: '以下の説明に基づいてSQLクエリを生成してください: 「{{description}}」。SQL方言: {{dialect}}。CTEを活用した可読性の高いクエリを生成し、各セクションの説明を付けてください。',
    sourcePlugin: 'data',
    sourceCommand: 'write-query',
  },
];

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * 製品に対応するスキル一覧を取得
 */
export function getSkillsForProduct(product: ProductCode): SkillDefinition[] {
  return ALL_SKILLS.filter(skill => skill.targetProducts.includes(product));
}

/**
 * 製品に対応するコマンド一覧を取得
 */
export function getCommandsForProduct(product: ProductCode): CommandDefinition[] {
  return ALL_COMMANDS.filter(cmd => cmd.targetProducts.includes(product));
}

/**
 * プランで利用可能なスキルを取得
 */
export function getAvailableSkills(
  product: ProductCode,
  plan: PlanCode,
): SkillDefinition[] {
  const planHierarchy: Record<PlanCode, number> = {
    ENT: 4,
    BIZ: 3,
    TRIAL: 2,
    FREE: 1,
  };
  const userLevel = planHierarchy[plan] ?? 0;

  return getSkillsForProduct(product).filter(skill => {
    const requiredLevel = planHierarchy[skill.requiredPlan] ?? 0;
    return userLevel >= requiredLevel;
  });
}

/**
 * プランで利用可能なコマンドを取得
 */
export function getAvailableCommands(
  product: ProductCode,
  plan: PlanCode,
): CommandDefinition[] {
  const planHierarchy: Record<PlanCode, number> = {
    ENT: 4,
    BIZ: 3,
    TRIAL: 2,
    FREE: 1,
  };
  const userLevel = planHierarchy[plan] ?? 0;

  return getCommandsForProduct(product).filter(cmd => {
    const requiredLevel = planHierarchy[cmd.requiredPlan] ?? 0;
    return userLevel >= requiredLevel;
  });
}

/**
 * ユーザーメッセージに基づいてアクティブスキルを検出
 *
 * ユーザーの入力テキストからトリガーパターンにマッチするスキルを返す。
 * Anthropic のプラグインシステムの "Skills fire when relevant" の概念を実装。
 */
export function detectActiveSkills(
  product: ProductCode,
  plan: PlanCode,
  userMessage: string,
): SkillDefinition[] {
  const availableSkills = getAvailableSkills(product, plan);
  const messageLower = userMessage.toLowerCase();

  return availableSkills.filter(skill =>
    skill.triggerPatterns.some(pattern => messageLower.includes(pattern.toLowerCase()))
  );
}

/**
 * アクティブスキルのシステムプロンプト拡張を生成
 *
 * 検出されたスキルの systemPromptExtension を結合して返す。
 * これを既存の getBaseSystemPrompt() の結果に追加する。
 */
export function buildSkillPromptExtension(activeSkills: SkillDefinition[]): string {
  if (activeSkills.length === 0) return '';

  return activeSkills
    .map(skill => skill.systemPromptExtension)
    .join('\n\n');
}

/**
 * カテゴリ別のスキル概要を取得（UI 表示用）
 */
export function getSkillsByCategory(
  product: ProductCode,
  plan: PlanCode,
): Record<SkillCategory, SkillDefinition[]> {
  const available = getAvailableSkills(product, plan);
  const result: Partial<Record<SkillCategory, SkillDefinition[]>> = {};

  for (const skill of available) {
    if (!result[skill.category]) {
      result[skill.category] = [];
    }
    result[skill.category]!.push(skill);
  }

  return result as Record<SkillCategory, SkillDefinition[]>;
}
