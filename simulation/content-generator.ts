/**
 * インタビューコンテンツ生成エンジン
 *
 * ペルソナ定義から議事録形式のインタビューコンテンツを大量生成する。
 * 各ペルソナのPain/Insecurity/Vision/Objection/Tractionを組み合わせ、
 * インタビュアーの質問パターンに応じた回答を生成する。
 */

import {
  type IntervieweePersona,
  ALL_INTERVIEWEE_PERSONAS,
} from './personas/interviewee-personas.js';
import {
  type InterviewerPersona,
  type InterviewQuestion,
  ALL_INTERVIEWER_PERSONAS,
} from './personas/interviewer-personas.js';

// =============================================================================
// 型定義
// =============================================================================

export interface GeneratedInterview {
  id: string;
  /** インタビュー議事録（Markdown形式） */
  content: string;
  /** メタデータ */
  metadata: {
    intervieweeId: string;
    intervieweeName: string;
    intervieweeRole: string;
    intervieweeDepartment: string;
    intervieweeCompany: string;
    intervieweeIndustry: string;
    interviewerId: string;
    interviewerName: string;
    interviewerRole: string;
    interviewPattern: string;
    date: string;
    questionCount: number;
  };
  /** 生成された回答（分析用） */
  answers: GeneratedAnswer[];
}

export interface GeneratedAnswer {
  questionNo: number;
  questionText: string;
  answerText: string;
  /** この回答に含まれるPIVOTボイス（生成時のメタ情報） */
  expectedPivots: string[];
  /** 含まれるキーワード */
  usedKeywords: string[];
}

// =============================================================================
// 回答テンプレート — PIVOT Voice別
// =============================================================================

/** 発言パターン（テンプレート変数: {process}, {tool}, {detail}, {people}, {number}, {time}） */
const PAIN_TEMPLATES = [
  '{process}を{tool}で管理しているんですが、{detail}で非常に困っています',
  '{process}の作業に毎回{time}かかっていて、本当に非効率だと感じています',
  '{process}で{tool}を使っているんですが、{detail}でミスが月に{number}件くらい発生しています',
  '{tool}での{process}が手作業で、担当者の{detail}が大きな負担になっています',
  '{process}に関しては、{detail}という問題が慢性的に続いていまして',
  '毎月の{process}に{time}かかっていて、その間は他の業務に手が回りません',
  '{tool}が古くて{detail}、{process}の効率が上がらないんです',
  '{process}のデータが{detail}で、全体像が見えない状態です',
  '正直、{process}は{detail}で、現場はかなり疲弊しています',
  '{people}が{process}を{tool}でやっているんですが、{detail}という状態です',
  '{process}では{detail}が問題で、納期遅延が{number}回くらいありました',
  '{tool}の操作が複雑で、{process}の作業効率が悪いんです',
];

const INSECURITY_TEMPLATES = [
  '{people}が退職予定で、{process}の引継ぎが間に合うか心配です',
  '{process}の知識が{people}に集中していて、いなくなったらどうなるか不安です',
  '{detail}が今後どうなるか、先行きが見通せなくて不安を感じています',
  '{process}の{detail}、将来的にリスクになるのではないかと懸念しています',
  '正直、{detail}については、いつ大きな問題になってもおかしくない状況です',
  '{people}が辞めたら{process}が止まるかもしれないと、内心ヒヤヒヤしています',
  '{tool}のサポートが切れるんですが、後継の{detail}が決まっていません',
  '{process}の属人化が深刻で、ブラックボックスになっている部分があります',
  '業界全体で{detail}が進んでおり、うちも対応しないとまずいと感じています',
  '{process}の品質が{people}の経験に依存していて、標準化できていないのが気がかりです',
];

const VISION_TEMPLATES = [
  '{process}を{detail}できるシステムがあれば、本当に助かります',
  'できれば{tool}を導入して、{process}を効率化したいと考えています',
  '{process}が{detail}できるようになれば、{time}は短縮できると思います',
  '理想的には{process}を自動化して、{people}が本来の業務に集中できる環境を作りたい',
  '{detail}を実現して、{process}の精度を上げたいんです',
  '{tool}みたいなツールで{process}をリアルタイムで可視化できたら最高ですね',
  '{process}の{detail}を、{number}%くらい削減できるような仕組みが欲しいです',
  'AIを活用して{process}の{detail}を自動化したい、というのは常々思っています',
  '{process}のデータをダッシュボードで見られるようになりたい',
  '{detail}を導入して、{process}の品質を均一化したいですね',
];

const OBJECTION_TEMPLATES = [
  '以前{tool}を導入しようとしたんですが、{detail}で結局うまくいきませんでした',
  '正直、{detail}に関しては反対の声が多くて、{process}の改革が進まないんです',
  '{people}は{detail}と言っていて、なかなか理解を得られません',
  '前にも同じような提案がありましたが、{detail}で却下されました',
  '{tool}への移行は{people}からの抵抗が強くて、{detail}という状況です',
  '{process}の変更について、{detail}という懸念があるのは事実です',
  'コスト面で{detail}と言われて、予算が下りなかったことがあります',
  '{detail}という経験があるので、新しいことには慎重にならざるを得ません',
];

const TRACTION_TEMPLATES = [
  '{process}に関しては、{detail}でうまく回っています',
  '{tool}を使った{process}は順調で、{detail}という成果が出ています',
  '{people}のチームは{process}がしっかりしていて、{detail}を達成しています',
  '{process}は{detail}で、業界でも評価されている強みだと思います',
  '{detail}の取り組みは{number}年以上続けていて、成果も出ています',
  '{process}の{detail}は定着していて、問題なく機能しています',
  '{tool}を活用した{process}はうまくいっていて、満足しています',
];

// =============================================================================
// 詳細フレーズ辞書（テンプレートの{detail}に挿入）
// =============================================================================

const DETAIL_VARIATIONS = {
  inefficiency: [
    '更新が追いつかない', '情報の共有に時間がかかる', '二重入力が多い',
    'データの不整合が頻発する', '手戻りが多い', '検索に時間がかかる',
    '入力ミスが多い', '集計に膨大な時間がかかる', '情報が最新でない',
    '関係者への通知が遅れる', '版管理ができていない', '全体像が把握できない',
  ],
  risk: [
    '属人化が進んでいる', 'ドキュメントが整備されていない', 'ノウハウが共有されていない',
    'セキュリティ対策が不十分', '老朽化が進んでいる', '法改正への対応が遅れている',
    'バックアップ体制が脆弱', '人材確保が困難になっている', '技術的負債が蓄積している',
  ],
  want: [
    'リアルタイムで可視化', '一元管理', '自動集計', 'ペーパーレス化',
    'ワークフローの電子化', 'データ分析の自動化', 'AI活用', 'クラウド移行',
    'モバイル対応', 'API連携', 'ダッシュボード構築', '帳票の自動生成',
  ],
  failure: [
    '操作が複雑すぎて現場に定着しなかった', '導入コストが想定を大幅に超えた',
    'カスタマイズが多すぎて保守できなくなった', '既存業務との整合性が取れなかった',
    '教育・研修に十分な時間を確保できなかった', 'ベンダーのサポートが不十分だった',
    '経営層の理解が得られず途中で中止になった', '必要な機能が足りなかった',
  ],
  success: [
    '品質が安定している', '効率が大幅に改善された', '従業員満足度が高い',
    'コスト削減を達成した', '顧客からの評価が高い', 'ミスがほぼゼロになった',
    '作業時間を半減できた', '標準化が定着している', '業界トップクラスの実績',
  ],
};

// =============================================================================
// 時間・数値バリエーション
// =============================================================================

const TIME_VARIATIONS = [
  '2時間', '3時間', '半日', '丸1日', '丸2日', '1週間', '2〜3日',
  '毎回30分', '毎回1時間', '月に3日', '四半期に1週間',
];

const NUMBER_VARIATIONS = [
  '3〜5', '5〜10', '10', '15〜20', '20以上', '30', '50', '数十',
];

// =============================================================================
// 補足・フィラーフレーズ（リアリティ向上）
// =============================================================================

const FILLERS_FORMAL = [
  'そうですね、', 'はい、', 'おっしゃる通りで、',
  'ご質問ありがとうございます。', 'その点については、',
  '正直に申し上げますと、', '率直に言いますと、',
];

const FILLERS_CASUAL = [
  'あー、それは、', 'うーん、', 'まあ、',
  'ぶっちゃけ、', 'そうっすね、', 'いやー、',
  'これが結構、', 'ここだけの話、',
];

const FILLERS_EMOTIONAL = [
  '本当に困っているんです、', 'もう限界なんですよ、',
  '正直辛いです、', 'すごく嬉しかったのが、',
  'これは絶対に改善したいんです、', 'ここが一番ストレスで、',
];

const FILLERS_RESERVED = [
  '', '', '少し考えてから申し上げますと、',
  'まあ、強いて言えば、',
];

// =============================================================================
// Seeded Random Number Generator
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

  pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(n, shuffled.length));
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// =============================================================================
// コンテンツ生成エンジン
// =============================================================================

export class InterviewContentGenerator {
  private rng: SeededRandom;

  constructor(seed: number = 42) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * 指定件数のインタビューを生成
   */
  generateInterviews(count: number): GeneratedInterview[] {
    const interviews: GeneratedInterview[] = [];
    const interviewees = ALL_INTERVIEWEE_PERSONAS;
    const interviewers = ALL_INTERVIEWER_PERSONAS;

    for (let i = 0; i < count; i++) {
      const interviewee = interviewees[i % interviewees.length];
      const interviewer = this.rng.pick(interviewers);
      const date = this.generateDate(i);

      const interview = this.generateSingleInterview(
        interviewee,
        interviewer,
        `INT-${String(i + 1).padStart(4, '0')}`,
        date,
      );
      interviews.push(interview);
    }

    return interviews;
  }

  /**
   * 特定のペルソナ×インタビュアーの組み合わせで生成
   */
  generateForPair(
    interviewee: IntervieweePersona,
    interviewer: InterviewerPersona,
    id: string,
    date: string,
  ): GeneratedInterview {
    return this.generateSingleInterview(interviewee, interviewer, id, date);
  }

  private generateSingleInterview(
    interviewee: IntervieweePersona,
    interviewer: InterviewerPersona,
    id: string,
    date: string,
  ): GeneratedInterview {
    const questions = this.selectQuestions(interviewer);
    const answers: GeneratedAnswer[] = [];

    for (let q = 0; q < questions.length; q++) {
      const question = questions[q];
      const answer = this.generateAnswer(interviewee, question, q + 1);
      answers.push(answer);
    }

    const content = this.formatAsMarkdown(
      id, interviewee, interviewer, date, questions, answers,
    );

    return {
      id,
      content,
      metadata: {
        intervieweeId: interviewee.id,
        intervieweeName: interviewee.name,
        intervieweeRole: interviewee.role,
        intervieweeDepartment: interviewee.department,
        intervieweeCompany: interviewee.company,
        intervieweeIndustry: interviewee.industry,
        interviewerId: interviewer.id,
        interviewerName: interviewer.name,
        interviewerRole: interviewer.role,
        interviewPattern: interviewer.interviewPattern,
        date,
        questionCount: questions.length,
      },
      answers,
    };
  }

  private selectQuestions(interviewer: InterviewerPersona): InterviewQuestion[] {
    const n = interviewer.questionsPerSession;
    return this.rng.pickN(interviewer.questionSets, n);
  }

  private generateAnswer(
    persona: IntervieweePersona,
    question: InterviewQuestion,
    questionNo: number,
  ): GeneratedAnswer {
    const targetPivots = question.targetPivots;
    const parts: string[] = [];
    const expectedPivots: string[] = [];
    const usedKeywords: string[] = [];

    // 質問のターゲットPIVOTに応じて回答を組み立て
    for (const pivot of targetPivots) {
      const { text, pivotType, keywords } = this.generatePivotResponse(persona, pivot, question);
      if (text) {
        parts.push(text);
        expectedPivots.push(pivotType);
        usedKeywords.push(...keywords);
      }
    }

    // 追加のPIVOT（ペルソナの特性から自然に出るもの — 複数種を追加）
    const coveredPivots = new Set(expectedPivots);
    const additionalPivots: Array<{ type: string; source: string[] }> = [
      { type: 'P', source: persona.painPoints },
      { type: 'I', source: persona.insecurities },
      { type: 'V', source: persona.visions },
      { type: 'O', source: persona.objections },
      { type: 'T', source: persona.tractions },
    ];
    for (const { type, source } of additionalPivots) {
      if (!coveredPivots.has(type) && source.length > 0 && this.rng.next() > 0.55) {
        const connectors = ['それと関連して、', 'あと、', 'ちなみに、', 'それから、', 'もう一点、'];
        const connector = this.rng.pick(connectors);
        const filler = this.getFiller(persona.speakingStyle);
        const item = this.rng.pick(source);
        parts.push(`${connector}${filler}${item}。`);
        expectedPivots.push(type);
        usedKeywords.push(...this.extractKeywords(item));
      }
    }

    // フォローアップの深堀り回答を追加（50%の確率）
    if (this.rng.next() > 0.5 && question.followUps.length > 0) {
      const followUp = this.rng.pick(question.followUps);
      const followUpAnswer = this.generateFollowUpAnswer(persona, followUp);
      if (followUpAnswer) {
        parts.push(followUpAnswer);
      }
    }

    const answerText = parts.join('\n');

    return {
      questionNo,
      questionText: question.text,
      answerText,
      expectedPivots: [...new Set(expectedPivots)],
      usedKeywords: [...new Set(usedKeywords)],
    };
  }

  private generatePivotResponse(
    persona: IntervieweePersona,
    pivotType: string,
    question: InterviewQuestion,
  ): { text: string; pivotType: string; keywords: string[] } {
    const filler = this.getFiller(persona.speakingStyle);
    const keywords: string[] = [];

    switch (pivotType) {
      case 'P': {
        if (persona.painPoints.length === 0) break;
        const pain = this.rng.pick(persona.painPoints);
        // ペルソナの具体的な Pain をそのまま使うか、テンプレートで包む
        if (this.rng.next() > 0.4) {
          keywords.push(...this.extractKeywords(pain));
          return { text: `${filler}${pain}。`, pivotType: 'P', keywords };
        }
        const template = this.rng.pick(PAIN_TEMPLATES);
        const text = this.fillTemplate(template, persona);
        keywords.push(...this.extractKeywords(text));
        return { text: `${filler}${text}。`, pivotType: 'P', keywords };
      }
      case 'I': {
        if (persona.insecurities.length === 0) break;
        const insecurity = this.rng.pick(persona.insecurities);
        if (this.rng.next() > 0.4) {
          keywords.push(...this.extractKeywords(insecurity));
          return { text: `${filler}${insecurity}。`, pivotType: 'I', keywords };
        }
        const template = this.rng.pick(INSECURITY_TEMPLATES);
        const text = this.fillTemplate(template, persona);
        keywords.push(...this.extractKeywords(text));
        return { text: `${filler}${text}。`, pivotType: 'I', keywords };
      }
      case 'V': {
        if (persona.visions.length === 0) break;
        const vision = this.rng.pick(persona.visions);
        if (this.rng.next() > 0.4) {
          keywords.push(...this.extractKeywords(vision));
          return { text: `${filler}${vision}。`, pivotType: 'V', keywords };
        }
        const template = this.rng.pick(VISION_TEMPLATES);
        const text = this.fillTemplate(template, persona);
        keywords.push(...this.extractKeywords(text));
        return { text: `${filler}${text}。`, pivotType: 'V', keywords };
      }
      case 'O': {
        if (persona.objections.length === 0) {
          // Objectionがないペルソナは軽微な懸念を生成
          if (this.rng.next() > 0.7) {
            const text = `${filler}特に反対ということはないですが、導入時の教育コストは気になりますね`;
            return { text: `${text}。`, pivotType: 'O', keywords: ['反対', '教育コスト'] };
          }
          break;
        }
        const objection = this.rng.pick(persona.objections);
        if (this.rng.next() > 0.4) {
          keywords.push(...this.extractKeywords(objection));
          return { text: `${filler}${objection}。`, pivotType: 'O', keywords };
        }
        const template = this.rng.pick(OBJECTION_TEMPLATES);
        const text = this.fillTemplate(template, persona);
        keywords.push(...this.extractKeywords(text));
        return { text: `${filler}${text}。`, pivotType: 'O', keywords };
      }
      case 'T': {
        if (persona.tractions.length === 0) break;
        const traction = this.rng.pick(persona.tractions);
        if (this.rng.next() > 0.4) {
          keywords.push(...this.extractKeywords(traction));
          return { text: `${filler}${traction}。`, pivotType: 'T', keywords };
        }
        const template = this.rng.pick(TRACTION_TEMPLATES);
        const text = this.fillTemplate(template, persona);
        keywords.push(...this.extractKeywords(text));
        return { text: `${filler}${text}。`, pivotType: 'T', keywords };
      }
    }

    return { text: '', pivotType: '', keywords: [] };
  }

  private generateExtraPainResponse(persona: IntervieweePersona): string {
    const filler = this.getFiller(persona.speakingStyle);
    const connectors = ['それと関連して、', 'あと、もう一つ言うと、', 'ちなみに、', 'それから、'];
    const connector = this.rng.pick(connectors);
    const pain = this.rng.pick(persona.painPoints);
    return `${connector}${filler}${pain}。`;
  }

  private generateFollowUpAnswer(persona: IntervieweePersona, followUpQuestion: string): string {
    const filler = this.getFiller(persona.speakingStyle);

    // フォローアップの内容に応じた回答生成
    if (followUpQuestion.includes('時間') || followUpQuestion.includes('頻度')) {
      const time = this.rng.pick(TIME_VARIATIONS);
      return `${filler}だいたい${time}くらいですね。`;
    }
    if (followUpQuestion.includes('原因') || followUpQuestion.includes('なぜ')) {
      const reasons = [
        '根本的には人手不足が原因だと思います',
        '過去の経緯でこうなっていて、なかなか変えられないんです',
        'システムの制約もありますし、組織文化的な要因もあると思います',
        '予算と時間の制約で、後回しになってしまっているのが正直なところです',
      ];
      return `${filler}${this.rng.pick(reasons)}。`;
    }
    if (followUpQuestion.includes('対策') || followUpQuestion.includes('対処')) {
      const actions = [
        '今はとりあえず手作業でカバーしている状態です',
        '部分的にExcelマクロで対応していますが、限界を感じています',
        '対症療法的な対応しかできていないのが現状です',
        'チーム内で互いにフォローし合って何とか回しています',
      ];
      return `${filler}${this.rng.pick(actions)}。`;
    }

    // 汎用回答
    const generic = [
      'その点については、まだ十分に対応できていないのが正直なところです',
      'そこは今後の検討課題だと認識しています',
      'おっしゃる通りで、改善の余地はあると思います',
    ];
    return `${filler}${this.rng.pick(generic)}。`;
  }

  private fillTemplate(template: string, persona: IntervieweePersona): string {
    const process = this.rng.pick(persona.processes);
    const tool = this.rng.pick(persona.tools);
    const time = this.rng.pick(TIME_VARIATIONS);
    const number = this.rng.pick(NUMBER_VARIATIONS);

    // PIVOTタイプに応じたdetail選択
    let detailCategory: keyof typeof DETAIL_VARIATIONS;
    if (template.includes('困') || template.includes('非効率') || template.includes('ミス')) {
      detailCategory = 'inefficiency';
    } else if (template.includes('心配') || template.includes('不安') || template.includes('属人化')) {
      detailCategory = 'risk';
    } else if (template.includes('したい') || template.includes('欲しい') || template.includes('実現')) {
      detailCategory = 'want';
    } else if (template.includes('失敗') || template.includes('反対') || template.includes('うまくいかな')) {
      detailCategory = 'failure';
    } else {
      detailCategory = 'success';
    }

    const detail = this.rng.pick(DETAIL_VARIATIONS[detailCategory]);

    // people部分
    const peopleOptions = [
      '担当者', 'ベテランの社員', '現場のスタッフ', 'チームメンバー',
      '部下', '上司', '経営層', '新人', 'パートスタッフ',
    ];
    const people = this.rng.pick(peopleOptions);

    return template
      .replace('{process}', process)
      .replace('{tool}', tool)
      .replace('{detail}', detail)
      .replace('{time}', time)
      .replace('{number}', number)
      .replace('{people}', people);
  }

  private getFiller(style: IntervieweePersona['speakingStyle']): string {
    switch (style) {
      case 'formal': return this.rng.pick(FILLERS_FORMAL);
      case 'casual': return this.rng.pick(FILLERS_CASUAL);
      case 'emotional': return this.rng.pick(FILLERS_EMOTIONAL);
      case 'reserved': return this.rng.pick(FILLERS_RESERVED);
    }
  }

  private extractKeywords(text: string): string[] {
    const allKeywords = [
      '困って', '問題', '課題', '非効率', '無駄', 'ミス', '手作業', '紙',
      'Excel', '属人化', '引継ぎ', '不安', '心配', '退職', 'リスク',
      'したい', '欲しい', '導入', '自動化', '効率化', 'システム',
      '失敗', '反対', '抵抗', '却下', 'うまくいかな',
      '順調', '成功', '定着', '満足', '評価', '改善',
    ];
    return allKeywords.filter(kw => text.includes(kw));
  }

  private formatAsMarkdown(
    id: string,
    interviewee: IntervieweePersona,
    interviewer: InterviewerPersona,
    date: string,
    questions: InterviewQuestion[],
    answers: GeneratedAnswer[],
  ): string {
    const lines: string[] = [];

    lines.push(`# インタビュー議事録: ${interviewee.company} ${interviewee.department} ヒアリング`);
    lines.push('');
    lines.push('## メタデータ');
    lines.push(`- interview_id: ${id}`);
    lines.push(`- respondent: ${interviewee.name}`);
    lines.push(`- company: ${interviewee.company}`);
    lines.push(`- role: ${interviewee.role}`);
    lines.push(`- department: ${interviewee.department}`);
    lines.push(`- date: ${date}`);
    lines.push(`- interviewer: ${interviewer.name}`);
    lines.push(`- duration: ${this.rng.int(30, 90)}分`);
    lines.push('');
    lines.push('## Q&A');

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      lines.push('');
      lines.push(`### Q${answer.questionNo}. ${answer.questionText}`);
      lines.push('');
      lines.push(answer.answerText);
    }

    lines.push('');

    return lines.join('\n');
  }

  private generateDate(index: number): string {
    // 2025-01 〜 2026-02 の範囲でランダムな日付を生成
    const baseYear = 2025;
    const monthOffset = Math.floor(index / 80); // 80件ごとに1ヶ月進む
    const month = (monthOffset % 14) + 1;
    const year = baseYear + Math.floor((month - 1) / 12);
    const actualMonth = ((month - 1) % 12) + 1;
    const day = this.rng.int(1, 28);
    return `${year}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}

// =============================================================================
// 便利関数
// =============================================================================

/** 1000件のインタビューを生成 */
export function generateAllInterviews(count: number = 1000, seed: number = 42): GeneratedInterview[] {
  const generator = new InterviewContentGenerator(seed);
  return generator.generateInterviews(count);
}

/** 特定のペルソナペアでインタビューを生成 */
export function generatePairInterview(
  intervieweeId: string,
  interviewerId: string,
  date: string = '2026-01-15',
): GeneratedInterview | null {
  const interviewee = ALL_INTERVIEWEE_PERSONAS.find(p => p.id === intervieweeId);
  const interviewer = ALL_INTERVIEWER_PERSONAS.find(p => p.id === interviewerId);
  if (!interviewee || !interviewer) return null;

  const generator = new InterviewContentGenerator();
  return generator.generateForPair(interviewee, interviewer, `PAIR-${intervieweeId}-${interviewerId}`, date);
}
