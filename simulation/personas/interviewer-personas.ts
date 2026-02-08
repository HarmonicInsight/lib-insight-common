/**
 * インタビュアーペルソナ定義
 *
 * 各インタビュアーは異なる目的・要望でインタビューを行う。
 * インタビュー対象者の発言が、インタビュアーの要望に合致するかを検証する。
 */

export interface InterviewQuestion {
  id: string;
  text: string;
  /** この質問で引き出したいPIVOTボイス */
  targetPivots: string[];
  /** この質問で引き出したい対象軸 */
  targetLayers: ('process' | 'tool' | 'people')[];
  /** フォローアップの深堀り質問 */
  followUps: string[];
}

export interface InterviewerDemand {
  id: string;
  description: string;
  /** この要望に合致するPIVOTボイス */
  relevantPivots: string[];
  /** 関連キーワード */
  keywords: string[];
  /** マッチ判定の閾値 (0-1) */
  matchThreshold: number;
}

export interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  organization: string;
  /** インタビューの目的カテゴリ */
  interviewPattern: InterviewPattern;
  /** このインタビュアーの専門分野 */
  expertise: string[];
  /** インタビューの目的 */
  objective: string;
  /** 要望リスト — 対象者の発言とマッチングする */
  demands: InterviewerDemand[];
  /** 標準質問セット */
  questionSets: InterviewQuestion[];
  /** 対象とする業種 (空配列は全業種) */
  targetIndustries: string[];
  /** 重視するPIVOTボイス */
  focusPivots: string[];
  /** 1回のインタビューの質問数 */
  questionsPerSession: number;
}

/** インタビューパターン */
export type InterviewPattern =
  | 'biz_improvement'     // 業務改善コンサルタント
  | 'hr_organizational'   // 人事・組織コンサルタント
  | 'it_system'           // ITシステムコンサルタント
  | 'dx_strategy'         // DX戦略コンサルタント
  | 'project_management'  // プロジェクトマネージャー
  | 'customer_success'    // カスタマーサクセス
  | 'internal_audit'      // 内部監査
  | 'management_review';  // 経営レビュー

// =============================================================================
// 業務改善コンサルタント
// =============================================================================

const BIZ_IMPROVEMENT_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-BIZ-001',
    name: '佐々木 一郎',
    role: 'シニアコンサルタント',
    organization: 'ハーモニックインサイト株式会社',
    interviewPattern: 'biz_improvement',
    expertise: ['業務プロセス改善', 'BPR', 'RPA導入', '業務可視化'],
    objective: '現場の業務課題を特定し、改善施策と優先度を整理する',
    demands: [
      {
        id: 'BIZ-D001',
        description: '手作業・紙ベースの業務で自動化の余地がある箇所を特定したい',
        relevantPivots: ['P'],
        keywords: ['手作業', '紙', 'Excel', '手入力', '手集計', '二重入力', '転記', '非効率', '無駄'],
        matchThreshold: 0.4,
      },
      {
        id: 'BIZ-D002',
        description: '属人化している業務を洗い出して、標準化の対象を見つけたい',
        relevantPivots: ['P', 'I'],
        keywords: ['属人化', '引継ぎ', '辞めたら', 'いなくなったら', '一人しか', 'ブラックボックス', 'ベテラン', '経験', '勘'],
        matchThreshold: 0.4,
      },
      {
        id: 'BIZ-D003',
        description: '現場が本当に求めているシステム要件を把握したい',
        relevantPivots: ['V'],
        keywords: ['したい', '欲しい', 'ほしい', '実現したい', '導入したい', 'があれば', 'できたら', 'システム化', '自動化'],
        matchThreshold: 0.3,
      },
      {
        id: 'BIZ-D004',
        description: '過去のシステム導入失敗体験から、導入阻害要因を理解したい',
        relevantPivots: ['O'],
        keywords: ['失敗', '反対', '抵抗', '前もダメ', 'うまくいかなかった', '却下', '否決', '使えなかった'],
        matchThreshold: 0.3,
      },
      {
        id: 'BIZ-D005',
        description: 'うまくいっている業務を把握して、成功要因を横展開したい',
        relevantPivots: ['T'],
        keywords: ['うまくいっている', '順調', '成功', '定着', '評価', '高い', '達成', '改善'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'BIZ-Q001',
        text: '現在の業務で最も時間がかかっている作業は何ですか？',
        targetPivots: ['P'],
        targetLayers: ['process'],
        followUps: [
          'その作業にどのくらいの時間がかかっていますか？',
          '自動化できる部分はありそうですか？',
          'その作業のミスはどのくらいの頻度で発生しますか？',
        ],
      },
      {
        id: 'BIZ-Q002',
        text: '業務で使っているシステムやツールについて教えてください',
        targetPivots: ['P', 'T'],
        targetLayers: ['tool'],
        followUps: [
          'そのツールの不満点はありますか？',
          '理想的なツールはどのようなものですか？',
          'ツール間のデータ連携はできていますか？',
        ],
      },
      {
        id: 'BIZ-Q003',
        text: '特定の担当者しかできない業務はありますか？',
        targetPivots: ['I', 'P'],
        targetLayers: ['people', 'process'],
        followUps: [
          'その方が不在の場合はどう対応していますか？',
          '引継ぎのドキュメントは整備されていますか？',
          'なぜ属人化してしまったと思いますか？',
        ],
      },
      {
        id: 'BIZ-Q004',
        text: 'もし予算の制約がなければ、最優先で改善したいことは何ですか？',
        targetPivots: ['V'],
        targetLayers: ['process', 'tool'],
        followUps: [
          'その改善が実現したら、どのような効果が期待できますか？',
          'その改善に対する社内の反応はどうですか？',
        ],
      },
      {
        id: 'BIZ-Q005',
        text: '過去に業務改善やシステム導入で失敗した経験はありますか？',
        targetPivots: ['O'],
        targetLayers: ['process', 'tool'],
        followUps: [
          '何が原因で失敗したと思いますか？',
          'その失敗から学んだことはありますか？',
          '現在も同じような懸念がありますか？',
        ],
      },
      {
        id: 'BIZ-Q006',
        text: '現在うまくいっている業務やチームの強みは何ですか？',
        targetPivots: ['T'],
        targetLayers: ['process', 'people'],
        followUps: [
          'その成功要因は何だと思いますか？',
          '他の部署にも横展開できそうですか？',
        ],
      },
      {
        id: 'BIZ-Q007',
        text: '部署間や外部との連携で困っていることはありますか？',
        targetPivots: ['P', 'O'],
        targetLayers: ['people', 'process'],
        followUps: [
          '情報共有の方法は？',
          'どの部署との連携が特に難しいですか？',
        ],
      },
    ],
    targetIndustries: [],
    focusPivots: ['P', 'V'],
    questionsPerSession: 7,
  },
  {
    id: 'INT-BIZ-002',
    name: '田村 香織',
    role: 'コンサルタント',
    organization: 'ハーモニックインサイト株式会社',
    interviewPattern: 'biz_improvement',
    expertise: ['コスト削減', '業務効率化', 'リーン手法'],
    objective: 'コスト構造の課題と削減機会を特定する',
    demands: [
      {
        id: 'BIZ2-D001',
        description: 'コスト発生の大きい業務プロセスを特定したい',
        relevantPivots: ['P'],
        keywords: ['コスト', '費用', '高い', '予算', '人件費', '外注費', '時間', '残業', '工数'],
        matchThreshold: 0.4,
      },
      {
        id: 'BIZ2-D002',
        description: '重複作業や無駄な承認フローを見つけたい',
        relevantPivots: ['P'],
        keywords: ['二重', '重複', '無駄', '承認', '稟議', 'ハンコ', '待ち時間', '手戻り'],
        matchThreshold: 0.4,
      },
      {
        id: 'BIZ2-D003',
        description: 'クイックウィン（すぐに効果が出る施策）を見つけたい',
        relevantPivots: ['V', 'T'],
        keywords: ['すぐ', '簡単', 'すでに', '少しの', '改善', '効率化', '削減'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'BIZ2-Q001',
        text: '部署の業務の中で、最もコストがかかっていると感じるものは何ですか？',
        targetPivots: ['P'],
        targetLayers: ['process'],
        followUps: ['具体的にどのくらいのコストですか？', 'そのコストは削減可能だと思いますか？'],
      },
      {
        id: 'BIZ2-Q002',
        text: '同じデータを複数のシステムに入力するような作業はありますか？',
        targetPivots: ['P'],
        targetLayers: ['tool', 'process'],
        followUps: ['なぜシステムが統合されていないのですか？', '手作業の入力ミスはどのくらいありますか？'],
      },
      {
        id: 'BIZ2-Q003',
        text: '承認フローで、不必要に時間がかかっていると感じるものはありますか？',
        targetPivots: ['P', 'O'],
        targetLayers: ['process', 'people'],
        followUps: ['承認に何日くらいかかりますか？', '省略できる承認ステップはありそうですか？'],
      },
      {
        id: 'BIZ2-Q004',
        text: '残業が多い時期や業務は？',
        targetPivots: ['P'],
        targetLayers: ['process', 'people'],
        followUps: ['残業の主な原因は？', '繁忙期は毎月決まっていますか？'],
      },
      {
        id: 'BIZ2-Q005',
        text: 'すぐに改善できそうなことで、手つかずになっているものはありますか？',
        targetPivots: ['V', 'T'],
        targetLayers: ['process'],
        followUps: ['なぜ手つかずなのですか？', '誰が推進すれば進みそうですか？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['P'],
    questionsPerSession: 5,
  },
];

// =============================================================================
// 人事・組織コンサルタント
// =============================================================================

const HR_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-HR-001',
    name: '高木 美穂',
    role: '組織開発コンサルタント',
    organization: '株式会社ピープルアナリティクス',
    interviewPattern: 'hr_organizational',
    expertise: ['組織開発', 'エンゲージメント', '人材育成', 'チームビルディング'],
    objective: '組織の人的課題と改善機会を明らかにし、エンゲージメント向上施策を提案する',
    demands: [
      {
        id: 'HR-D001',
        description: '離職リスクの高い部署やポジションを特定したい',
        relevantPivots: ['P', 'I'],
        keywords: ['辞める', '退職', '離職', '不満', 'ストレス', 'モチベーション', '疲弊', '残業', 'ワークライフ'],
        matchThreshold: 0.4,
      },
      {
        id: 'HR-D002',
        description: '上司と部下のコミュニケーション課題を把握したい',
        relevantPivots: ['P', 'O'],
        keywords: ['上司', '部下', 'コミュニケーション', '指示', 'フィードバック', '評価', '面談', '1on1', '報連相'],
        matchThreshold: 0.4,
      },
      {
        id: 'HR-D003',
        description: '人材育成の課題と現場のニーズを把握したい',
        relevantPivots: ['V', 'I'],
        keywords: ['育成', '研修', 'スキル', '成長', 'キャリア', '学ぶ', '教育', 'OJT', '新人', 'ベテラン'],
        matchThreshold: 0.3,
      },
      {
        id: 'HR-D004',
        description: '部門間の協力関係やサイロ化の実態を理解したい',
        relevantPivots: ['O', 'P'],
        keywords: ['部署間', '連携', '協力', 'サイロ', '壁', '対立', '縄張り', '情報共有'],
        matchThreshold: 0.3,
      },
      {
        id: 'HR-D005',
        description: '組織の強みやポジティブな文化要素を把握したい',
        relevantPivots: ['T'],
        keywords: ['チームワーク', '助け合い', '文化', '価値観', '誇り', 'やりがい', '達成感'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'HR-Q001',
        text: '日々の業務で最もストレスを感じることは何ですか？',
        targetPivots: ['P'],
        targetLayers: ['people', 'process'],
        followUps: ['そのストレスにどう対処していますか？', '上司や同僚に相談できていますか？'],
      },
      {
        id: 'HR-Q002',
        text: 'チーム内のコミュニケーションは円滑ですか？',
        targetPivots: ['T', 'P'],
        targetLayers: ['people'],
        followUps: ['情報共有の仕組みはありますか？', '会議の頻度や内容は適切ですか？'],
      },
      {
        id: 'HR-Q003',
        text: '今後のキャリアについてどのように考えていますか？',
        targetPivots: ['V', 'I'],
        targetLayers: ['people'],
        followUps: ['会社にどのような成長機会を期待しますか？', '今の仕事にやりがいを感じていますか？'],
      },
      {
        id: 'HR-Q004',
        text: '上司からのフィードバックは十分ですか？',
        targetPivots: ['P', 'O'],
        targetLayers: ['people'],
        followUps: ['どのような形でフィードバックを受けたいですか？', '評価の基準は明確ですか？'],
      },
      {
        id: 'HR-Q005',
        text: 'チームの中で最も誇りに思っていることは何ですか？',
        targetPivots: ['T'],
        targetLayers: ['people', 'process'],
        followUps: ['その成果はどのように生まれましたか？', '他のチームにも共有していますか？'],
      },
      {
        id: 'HR-Q006',
        text: '会社の制度や仕組みで改善してほしいことはありますか？',
        targetPivots: ['V', 'O'],
        targetLayers: ['people', 'process'],
        followUps: ['その改善が実現したら、どう変わりますか？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['P', 'I'],
    questionsPerSession: 6,
  },
];

// =============================================================================
// ITシステムコンサルタント
// =============================================================================

const IT_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-IT-001',
    name: '村上 大地',
    role: 'ITコンサルタント',
    organization: 'デジタルブリッジ株式会社',
    interviewPattern: 'it_system',
    expertise: ['システム要件定義', 'ERP導入', 'クラウド移行', 'データ統合'],
    objective: '現行システムの課題と新システムの要件を明確にする',
    demands: [
      {
        id: 'IT-D001',
        description: '現行システムの機能不足や操作性の問題を把握したい',
        relevantPivots: ['P'],
        keywords: ['システム', '操作', '使いにくい', 'エラー', 'バグ', '遅い', '古い', '対応していない', '連携できない'],
        matchThreshold: 0.4,
      },
      {
        id: 'IT-D002',
        description: 'データの分断・サイロ化の実態を明らかにしたい',
        relevantPivots: ['P', 'I'],
        keywords: ['データ', '分散', 'バラバラ', 'サイロ', '連携', '統合', '一元', '二重入力', '手動'],
        matchThreshold: 0.4,
      },
      {
        id: 'IT-D003',
        description: '新システムに必要な機能要件を収集したい',
        relevantPivots: ['V'],
        keywords: ['機能', '要件', 'できるように', 'したい', '欲しい', '必要', '便利', '効率', 'リアルタイム'],
        matchThreshold: 0.3,
      },
      {
        id: 'IT-D004',
        description: 'システム導入の阻害要因（過去の失敗含む）を理解したい',
        relevantPivots: ['O'],
        keywords: ['失敗', '反対', '使えない', 'コスト', '高い', '複雑', '難しい', '慣れない', '変えたくない'],
        matchThreshold: 0.3,
      },
      {
        id: 'IT-D005',
        description: 'セキュリティやコンプライアンスの要件を確認したい',
        relevantPivots: ['I', 'O'],
        keywords: ['セキュリティ', '個人情報', 'コンプライアンス', '監査', '規制', '漏洩', 'アクセス制御'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'IT-Q001',
        text: '現在使っているシステムやツールの一覧と、それぞれの満足度を教えてください',
        targetPivots: ['P', 'T'],
        targetLayers: ['tool'],
        followUps: ['特に不満のあるシステムはどれですか？', 'そのシステムの良い点はありますか？'],
      },
      {
        id: 'IT-Q002',
        text: 'システム間のデータ連携で困っていることはありますか？',
        targetPivots: ['P'],
        targetLayers: ['tool', 'process'],
        followUps: ['手動でデータを移す作業はどのくらいありますか？', 'データの不整合は発生していますか？'],
      },
      {
        id: 'IT-Q003',
        text: '新しいシステムに最も期待する機能は何ですか？',
        targetPivots: ['V'],
        targetLayers: ['tool', 'process'],
        followUps: ['その機能がないと業務にどのような影響がありますか？', '優先度をつけるとすれば？'],
      },
      {
        id: 'IT-Q004',
        text: '過去にシステム導入や変更で苦労した経験はありますか？',
        targetPivots: ['O'],
        targetLayers: ['tool', 'people'],
        followUps: ['その時の最大の問題は何でしたか？', '同じ轍を踏まないために必要なことは？'],
      },
      {
        id: 'IT-Q005',
        text: '情報セキュリティに関して気になっていることはありますか？',
        targetPivots: ['I'],
        targetLayers: ['tool', 'process'],
        followUps: ['現在のセキュリティ対策は十分ですか？', 'クラウドサービスの利用に抵抗はありますか？'],
      },
      {
        id: 'IT-Q006',
        text: '日常業務でExcelやメールで代用しているが、本来はシステム化すべきだと思う業務はありますか？',
        targetPivots: ['P', 'V'],
        targetLayers: ['tool', 'process'],
        followUps: ['そのExcelはどのくらいの頻度で使っていますか？', '何人が同じExcelを使っていますか？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['P', 'V'],
    questionsPerSession: 6,
  },
];

// =============================================================================
// DX戦略コンサルタント
// =============================================================================

const DX_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-DX-001',
    name: '渡部 翔',
    role: 'DX戦略ディレクター',
    organization: 'フューチャーインサイト株式会社',
    interviewPattern: 'dx_strategy',
    expertise: ['DX戦略', 'デジタル変革', 'AI活用', 'データドリブン経営'],
    objective: 'DX推進の現状と阻害要因を把握し、実行可能なDXロードマップを策定する',
    demands: [
      {
        id: 'DX-D001',
        description: 'デジタル化の現状レベルを把握したい（紙→Excel→システム→AI）',
        relevantPivots: ['P', 'T'],
        keywords: ['紙', 'Excel', 'システム', 'デジタル', 'アナログ', '手作業', '自動化', 'AI', 'クラウド'],
        matchThreshold: 0.3,
      },
      {
        id: 'DX-D002',
        description: 'DX推進の組織的な障壁を理解したい',
        relevantPivots: ['O', 'I'],
        keywords: ['抵抗', '理解', '経営層', '予算', 'IT人材', '文化', '変化', '反対', 'リテラシー'],
        matchThreshold: 0.4,
      },
      {
        id: 'DX-D003',
        description: 'データ活用のポテンシャルがある領域を発見したい',
        relevantPivots: ['V', 'P'],
        keywords: ['データ', '分析', '可視化', '予測', 'ダッシュボード', '意思決定', 'KPI', 'レポート'],
        matchThreshold: 0.3,
      },
      {
        id: 'DX-D004',
        description: '競合他社のデジタル活用状況と差別化ポイントを把握したい',
        relevantPivots: ['I', 'V'],
        keywords: ['競合', '他社', '業界', '遅れ', '差', '先進', '事例'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'DX-Q001',
        text: '御社のDX推進の現状について、どのように感じていますか？',
        targetPivots: ['P', 'T'],
        targetLayers: ['process', 'tool'],
        followUps: ['具体的にどのようなDX施策を実施していますか？', '成功事例と課題があれば教えてください'],
      },
      {
        id: 'DX-Q002',
        text: 'DXを進める上で最も大きな障壁は何ですか？',
        targetPivots: ['O', 'I'],
        targetLayers: ['people', 'process'],
        followUps: ['経営層のDXへの理解度は？', 'IT人材の確保状況は？'],
      },
      {
        id: 'DX-Q003',
        text: '競合他社と比較して、デジタル活用の面でどのような位置にいると思いますか？',
        targetPivots: ['I', 'V'],
        targetLayers: ['tool', 'process'],
        followUps: ['危機感を感じることはありますか？', 'ベンチマークしている企業はありますか？'],
      },
      {
        id: 'DX-Q004',
        text: 'データを活用して改善したい業務領域はありますか？',
        targetPivots: ['V'],
        targetLayers: ['process', 'tool'],
        followUps: ['現在、どのようにデータを活用していますか？', 'データの収集・蓄積はできていますか？'],
      },
      {
        id: 'DX-Q005',
        text: 'デジタル化によって従業員の働き方はどう変わりましたか？',
        targetPivots: ['T', 'P'],
        targetLayers: ['people', 'process'],
        followUps: ['リモートワークの導入状況は？', '従業員のITリテラシーレベルは？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['O', 'V'],
    questionsPerSession: 5,
  },
];

// =============================================================================
// プロジェクトマネージャー
// =============================================================================

const PM_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-PM-001',
    name: '松岡 健司',
    role: 'プロジェクトマネージャー',
    organization: 'ハーモニックインサイト株式会社',
    interviewPattern: 'project_management',
    expertise: ['プロジェクト管理', 'リスク管理', 'ステークホルダー管理', 'アジャイル'],
    objective: 'プロジェクト実行に必要なリスク・制約・ステークホルダーの懸念を事前に把握する',
    demands: [
      {
        id: 'PM-D001',
        description: 'プロジェクトのリスク要因を特定したい',
        relevantPivots: ['I', 'O'],
        keywords: ['リスク', '心配', '不安', '失敗', '遅延', 'スケジュール', '予算', 'スコープ', '品質'],
        matchThreshold: 0.4,
      },
      {
        id: 'PM-D002',
        description: '各ステークホルダーの期待値と懸念を把握したい',
        relevantPivots: ['V', 'O'],
        keywords: ['期待', '要望', '懸念', '反対', '条件', '必須', '譲れない', '優先'],
        matchThreshold: 0.3,
      },
      {
        id: 'PM-D003',
        description: '既存の制約条件（人・モノ・金・時間）を明確にしたい',
        relevantPivots: ['P', 'O'],
        keywords: ['予算', '人員', '期限', 'リソース', '制約', '制限', '不足', 'できない'],
        matchThreshold: 0.4,
      },
    ],
    questionSets: [
      {
        id: 'PM-Q001',
        text: 'このプロジェクトで最も心配していることは何ですか？',
        targetPivots: ['I'],
        targetLayers: ['process', 'people'],
        followUps: ['そのリスクが顕在化した場合の影響は？', '対策は考えていますか？'],
      },
      {
        id: 'PM-Q002',
        text: 'プロジェクトの成功を判断する基準は何ですか？',
        targetPivots: ['V'],
        targetLayers: ['process'],
        followUps: ['その基準は関係者間で合意されていますか？', 'KPIは設定されていますか？'],
      },
      {
        id: 'PM-Q003',
        text: 'リソース（人員・予算・時間）の制約で気になる点はありますか？',
        targetPivots: ['P', 'O'],
        targetLayers: ['people', 'process'],
        followUps: ['不足している場合、どう補いますか？', '追加の確保は可能ですか？'],
      },
      {
        id: 'PM-Q004',
        text: '関係部署や外部ベンダーとの協力体制は整っていますか？',
        targetPivots: ['T', 'O'],
        targetLayers: ['people'],
        followUps: ['過去の協業経験は？', '懸念される対立点は？'],
      },
      {
        id: 'PM-Q005',
        text: '現場のメンバーの受入れ態勢はどうですか？',
        targetPivots: ['O', 'T'],
        targetLayers: ['people'],
        followUps: ['変化への抵抗がありそうなメンバーは？', 'チャンピオン（推進役）はいますか？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['I', 'O'],
    questionsPerSession: 5,
  },
];

// =============================================================================
// カスタマーサクセス
// =============================================================================

const CS_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-CS-001',
    name: '北村 理恵',
    role: 'カスタマーサクセスマネージャー',
    organization: 'ハーモニックインサイト株式会社',
    interviewPattern: 'customer_success',
    expertise: ['顧客満足度', 'オンボーディング', 'チャーン防止', 'アップセル'],
    objective: '導入済み製品の利用状況と満足度を把握し、継続利用と拡大利用を促進する',
    demands: [
      {
        id: 'CS-D001',
        description: '製品の利用上の困りごとや不満を把握したい',
        relevantPivots: ['P'],
        keywords: ['使いにくい', '分からない', 'エラー', '遅い', '困って', '不便', '動かない', 'わかりにくい'],
        matchThreshold: 0.4,
      },
      {
        id: 'CS-D002',
        description: '追加機能や他製品のニーズを発見したい（アップセル機会）',
        relevantPivots: ['V'],
        keywords: ['ほしい', 'したい', 'あれば', '機能', '追加', '他の', '連携', '統合', '拡張'],
        matchThreshold: 0.3,
      },
      {
        id: 'CS-D003',
        description: 'チャーンリスクの兆候を早期発見したい',
        relevantPivots: ['O', 'I'],
        keywords: ['解約', 'やめる', '他社', '乗り換え', '高い', 'コスト', '費用対効果', '使わなくなった'],
        matchThreshold: 0.5,
      },
      {
        id: 'CS-D004',
        description: '製品の成功事例やポジティブな声を収集したい',
        relevantPivots: ['T'],
        keywords: ['便利', '助かる', '良い', '満足', '効率化', '削減', '改善', 'お気に入り'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'CS-Q001',
        text: '製品を使い始めてから、業務はどのように変わりましたか？',
        targetPivots: ['T', 'P'],
        targetLayers: ['process', 'tool'],
        followUps: ['具体的にどの作業が楽になりましたか？', 'まだ改善が必要な部分はありますか？'],
      },
      {
        id: 'CS-Q002',
        text: '使っていて困ったことや分かりにくい機能はありますか？',
        targetPivots: ['P'],
        targetLayers: ['tool'],
        followUps: ['サポートに問い合わせたことはありますか？', 'どのように解決しましたか？'],
      },
      {
        id: 'CS-Q003',
        text: 'あったらいいなと思う機能はありますか？',
        targetPivots: ['V'],
        targetLayers: ['tool', 'process'],
        followUps: ['その機能があれば、どのように使いますか？', '他のツールとの連携ニーズは？'],
      },
      {
        id: 'CS-Q004',
        text: '同僚に製品を薦めるとしたら、どのようにお伝えしますか？',
        targetPivots: ['T'],
        targetLayers: ['tool'],
        followUps: ['NPS（推奨度）はどのくらいですか？', '社内での利用拡大の計画はありますか？'],
      },
      {
        id: 'CS-Q005',
        text: '今後の契約継続についてはどのようにお考えですか？',
        targetPivots: ['T', 'O'],
        targetLayers: ['tool'],
        followUps: ['費用対効果は感じていますか？', '他のソリューションとの比較検討は？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['P', 'T'],
    questionsPerSession: 5,
  },
];

// =============================================================================
// 内部監査
// =============================================================================

const AUDIT_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-AUD-001',
    name: '藤本 正志',
    role: '内部監査マネージャー',
    organization: '株式会社サンライズホールディングス',
    interviewPattern: 'internal_audit',
    expertise: ['内部統制', 'リスク評価', 'コンプライアンス', '業務監査'],
    objective: '内部統制の有効性を検証し、コンプライアンスリスクを特定する',
    demands: [
      {
        id: 'AUD-D001',
        description: '規程やルールが守られていない実態を把握したい',
        relevantPivots: ['P', 'O'],
        keywords: ['ルール', '規程', '手順', '守られていない', '逸脱', '例外', '省略', 'ショートカット'],
        matchThreshold: 0.4,
      },
      {
        id: 'AUD-D002',
        description: '不正やミスが起こりやすい業務プロセスを特定したい',
        relevantPivots: ['I', 'P'],
        keywords: ['ミス', 'エラー', 'チェック', '確認', '承認', 'ダブルチェック', '不正', 'リスク'],
        matchThreshold: 0.4,
      },
      {
        id: 'AUD-D003',
        description: '改善提案に対する現場の受入れ姿勢を確認したい',
        relevantPivots: ['V', 'O'],
        keywords: ['改善', '提案', '受入れ', '協力', '前向き', '反対', '面倒', '必要ない'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'AUD-Q001',
        text: '日常業務で、定められた手順通りにできていない部分はありますか？',
        targetPivots: ['P', 'O'],
        targetLayers: ['process'],
        followUps: ['なぜ手順通りにできないのですか？', 'そのことによるリスクはありますか？'],
      },
      {
        id: 'AUD-Q002',
        text: '過去にヒヤリハットやミスが発生したことはありますか？',
        targetPivots: ['P', 'I'],
        targetLayers: ['process', 'people'],
        followUps: ['その後の再発防止策は講じましたか？', '同様のリスクは他にもありますか？'],
      },
      {
        id: 'AUD-Q003',
        text: '業務のチェック体制は十分だと感じますか？',
        targetPivots: ['I', 'T'],
        targetLayers: ['process', 'people'],
        followUps: ['ダブルチェックが行われていない業務は？', 'チェック漏れの事例は？'],
      },
      {
        id: 'AUD-Q004',
        text: '業務改善の提案があった場合、どのように受け止めますか？',
        targetPivots: ['V', 'O'],
        targetLayers: ['people'],
        followUps: ['過去の改善提案で実現したものは？', '提案が却下された経験は？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['P', 'I'],
    questionsPerSession: 4,
  },
];

// =============================================================================
// 経営レビュー
// =============================================================================

const MGT_INTERVIEWERS: InterviewerPersona[] = [
  {
    id: 'INT-MGT-001',
    name: '黒田 修一',
    role: '経営コンサルタント',
    organization: 'ストラテジックパートナーズ株式会社',
    interviewPattern: 'management_review',
    expertise: ['経営戦略', '事業計画', 'PMI', '組織再編'],
    objective: '経営課題の全体像を把握し、戦略的な優先順位付けを行う',
    demands: [
      {
        id: 'MGT-D001',
        description: '経営層の認識と現場の実態のギャップを把握したい',
        relevantPivots: ['P', 'O'],
        keywords: ['経営', '現場', 'ギャップ', '認識', '実態', '乖離', '分かっていない', '伝わらない'],
        matchThreshold: 0.4,
      },
      {
        id: 'MGT-D002',
        description: '中長期的な成長の阻害要因を特定したい',
        relevantPivots: ['I', 'O'],
        keywords: ['成長', '将来', '中期', '長期', '市場', '競争', '変化', '対応', '投資', '戦略'],
        matchThreshold: 0.3,
      },
      {
        id: 'MGT-D003',
        description: '組織の強みと差別化要因を再確認したい',
        relevantPivots: ['T'],
        keywords: ['強み', '差別化', '競争力', '独自', '技術', 'ブランド', '信頼', '実績'],
        matchThreshold: 0.3,
      },
    ],
    questionSets: [
      {
        id: 'MGT-Q001',
        text: '御社が今後3年で最も重要だと考える経営課題は何ですか？',
        targetPivots: ['I', 'V'],
        targetLayers: ['process', 'people'],
        followUps: ['その課題に対する具体的な取り組みは？', '成功の指標は？'],
      },
      {
        id: 'MGT-Q002',
        text: '現場の実態と経営方針にズレを感じることはありますか？',
        targetPivots: ['P', 'O'],
        targetLayers: ['people'],
        followUps: ['具体的にどのような場面で？', 'そのギャップの解消に向けた取り組みは？'],
      },
      {
        id: 'MGT-Q003',
        text: '御社の最大の強みは何だとお考えですか？',
        targetPivots: ['T'],
        targetLayers: ['people', 'process'],
        followUps: ['その強みは今後も維持できますか？', '競合との差別化にどう活かしていますか？'],
      },
      {
        id: 'MGT-Q004',
        text: '投資判断で最も悩むことは何ですか？',
        targetPivots: ['I', 'O'],
        targetLayers: ['process'],
        followUps: ['投資の優先順位はどのように決めていますか？', 'IT投資の比率は？'],
      },
    ],
    targetIndustries: [],
    focusPivots: ['I', 'T'],
    questionsPerSession: 4,
  },
];

// =============================================================================
// 全インタビュアー統合
// =============================================================================

export const ALL_INTERVIEWER_PERSONAS: InterviewerPersona[] = [
  ...BIZ_IMPROVEMENT_INTERVIEWERS,
  ...HR_INTERVIEWERS,
  ...IT_INTERVIEWERS,
  ...DX_INTERVIEWERS,
  ...PM_INTERVIEWERS,
  ...CS_INTERVIEWERS,
  ...AUDIT_INTERVIEWERS,
  ...MGT_INTERVIEWERS,
];

/** パターン別にインタビュアーを取得 */
export function getInterviewersByPattern(pattern: InterviewPattern): InterviewerPersona[] {
  return ALL_INTERVIEWER_PERSONAS.filter(i => i.interviewPattern === pattern);
}

/** IDでインタビュアーを取得 */
export function getInterviewerById(id: string): InterviewerPersona | undefined {
  return ALL_INTERVIEWER_PERSONAS.find(i => i.id === id);
}

/** 全インタビューパターン */
export const ALL_INTERVIEW_PATTERNS: InterviewPattern[] = [
  'biz_improvement',
  'hr_organizational',
  'it_system',
  'dx_strategy',
  'project_management',
  'customer_success',
  'internal_audit',
  'management_review',
];

console.log(`[interviewer-personas] ${ALL_INTERVIEWER_PERSONAS.length} interviewers loaded across ${ALL_INTERVIEW_PATTERNS.length} patterns`);
