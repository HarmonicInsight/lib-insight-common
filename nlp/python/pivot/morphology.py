"""
PIVOT Morphology Engine - 品詞分解エンジン

形態素解析に基づくPIVOT分類の基盤となる品詞分解ロジック。

品詞と抽出情報の対応:
- 名詞 → 対象（WHAT）: 業務・ツール・組織の特定
- 動詞 → アクション（ACTION）: 何が起きているか
- 形容詞 → 評価（EVAL）: ポジティブ/ネガティブ判定
- 副詞 → 程度・頻度（DEGREE）: 強度スコアの増幅・減衰
- 語尾パターン → 確信度（CERTAINTY）: 断定/推測/願望の判別

使用例:
    from nlp.python.pivot import MorphologyAnalyzer

    analyzer = MorphologyAnalyzer()
    result = analyzer.analyze("工程管理をExcelでやっているが更新が非常に遅くて困っている")

    print(result.verbs)          # 動詞リスト
    print(result.degree_factor)  # 副詞による強度係数
    print(result.certainty)      # 語尾による確信度
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum


# ========================================
# 動詞カテゴリ定義
# ========================================

class VerbCategory(Enum):
    """動詞カテゴリ"""
    OBSTACLE = "障害系"      # 止まる、落ちる、消える、壊れる
    DIFFICULTY = "困難系"    # 困る、詰まる、悩む、迷う
    LOSS = "喪失系"          # 失う、辞める、なくなる、減る
    DESIRE = "願望系"        # 欲しい、したい、なりたい
    REJECTION = "拒否系"     # 嫌がる、反対する、拒む
    SUCCESS = "成功系"       # できる、回る、うまくいく
    NEUTRAL = "通常"


# 動詞カテゴリ辞書
VERB_CATEGORY_DICT = {
    # 障害系: 現在の問題（Pain）を示唆
    VerbCategory.OBSTACLE: [
        "止まる", "落ちる", "消える", "壊れる", "間違える",
        "動かない", "起動しない", "フリーズする", "クラッシュする",
        "遅れる", "滞る", "停滞する", "中断する", "途切れる",
        "漏れる", "抜ける", "忘れる", "見落とす", "ミスる",
    ],
    # 困難系: 現在の課題（Pain）を示唆
    VerbCategory.DIFFICULTY: [
        "困る", "詰まる", "悩む", "迷う", "分からない",
        "苦労する", "手間取る", "てこずる", "行き詰まる",
        "追いつかない", "間に合わない", "足りない", "不足する",
        "つまずく", "ハマる", "沼る",
    ],
    # 喪失系: 将来の不安（Insecurity）を示唆
    VerbCategory.LOSS: [
        "失う", "辞める", "なくなる", "減る", "いなくなる",
        "退職する", "離職する", "去る", "抜ける",
        "忘れられる", "引き継げない", "伝わらない",
        "陳腐化する", "時代遅れになる", "廃止される",
    ],
    # 願望系: 要望（Vision）を示唆
    VerbCategory.DESIRE: [
        "欲しい", "ほしい", "したい", "やりたい", "なりたい",
        "できるようにしたい", "実現したい", "導入したい",
        "改善したい", "効率化したい", "自動化したい",
        "変えたい", "見たい", "知りたい", "使いたい",
    ],
    # 拒否系: 抵抗（Objection）を示唆
    VerbCategory.REJECTION: [
        "嫌がる", "反対する", "拒む", "拒否する", "無視する",
        "やりたくない", "したくない", "使いたくない",
        "認めない", "納得しない", "受け入れない",
        "嫌だ", "面倒くさい", "だるい",
    ],
    # 成功系: 成功体験（Traction）を示唆
    VerbCategory.SUCCESS: [
        "できる", "回る", "うまくいく", "定着する", "使いこなす",
        "機能する", "動く", "成功する", "達成する",
        "改善された", "効率化された", "便利になった",
        "助かる", "楽になる", "スムーズになる",
    ],
}

# 逆引き辞書を作成
VERB_TO_CATEGORY = {}
for category, verbs in VERB_CATEGORY_DICT.items():
    for verb in verbs:
        VERB_TO_CATEGORY[verb] = category


# ========================================
# 形容詞センチメント定義
# ========================================

class Sentiment(Enum):
    """センチメント"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    ANXIETY = "anxiety"  # 不安系はInsecurityに対応
    NEUTRAL = "neutral"


# 形容詞センチメント辞書
ADJECTIVE_SENTIMENT_DICT = {
    Sentiment.NEGATIVE: [
        "遅い", "難しい", "面倒な", "煩雑な", "不便な", "分かりにくい",
        "複雑な", "大変な", "厳しい", "辛い", "きつい", "重い",
        "悪い", "ダメな", "まずい", "ひどい", "最悪な",
        "使いにくい", "見づらい", "分かりづらい",
        "古い", "時代遅れな", "非効率な", "無駄な",
    ],
    Sentiment.POSITIVE: [
        "早い", "速い", "簡単な", "便利な", "使いやすい", "分かりやすい",
        "シンプルな", "楽な", "快適な", "スムーズな", "効率的な",
        "良い", "いい", "素晴らしい", "最高な", "優秀な",
        "見やすい", "操作しやすい", "直感的な",
        "新しい", "モダンな", "最新な",
    ],
    Sentiment.ANXIETY: [
        "不安な", "心配な", "危うい", "怪しい", "危険な",
        "不確かな", "曖昧な", "脆い", "脆弱な",
        "属人的な", "ブラックボックスな",
    ],
}

# 逆引き辞書を作成
ADJECTIVE_TO_SENTIMENT = {}
for sentiment, adjectives in ADJECTIVE_SENTIMENT_DICT.items():
    for adj in adjectives:
        ADJECTIVE_TO_SENTIMENT[adj] = sentiment


# ========================================
# 副詞による強度係数
# ========================================

# 程度を表す副詞
DEGREE_ADVERBS = {
    # 極めて高い (×1.5)
    1.5: [
        "非常に", "極めて", "全く", "絶対に", "到底",
        "めちゃくちゃ", "めっちゃ", "すごく", "ものすごく",
        "完全に", "100%", "間違いなく",
    ],
    # 高い (×1.3)
    1.3: [
        "かなり", "とても", "相当", "大幅に", "大いに",
        "だいぶ", "ずいぶん", "なかなか",
    ],
    # 標準 (×1.0) - 副詞なしの場合
    1.0: [],
    # やや (×0.7)
    0.7: [
        "少し", "多少", "やや", "ちょっと", "若干",
        "わずかに", "幾分", "いくらか",
    ],
    # 低い (×0.4)
    0.4: [
        "ほとんど", "あまり", "たいして", "それほど",
    ],
}

# 頻度を表す副詞
FREQUENCY_ADVERBS = {
    # 常時 (×1.5)
    1.5: [
        "いつも", "常に", "毎回", "必ず", "例外なく",
        "毎日", "毎週", "毎月", "全て",
    ],
    # 高頻度 (×1.3)
    1.3: [
        "よく", "しばしば", "頻繁に", "度々", "何度も",
        "繰り返し", "再三",
    ],
    # 標準 (×1.0)
    1.0: [
        "時々", "たまに", "時折",
    ],
    # 低頻度 (×0.5)
    0.5: [
        "まれに", "ごくたまに", "滅多に", "ほとんどない",
    ],
}

# 逆引き辞書を作成
ADVERB_TO_DEGREE = {}
for factor, adverbs in DEGREE_ADVERBS.items():
    for adv in adverbs:
        ADVERB_TO_DEGREE[adv] = factor

ADVERB_TO_FREQUENCY = {}
for factor, adverbs in FREQUENCY_ADVERBS.items():
    for adv in adverbs:
        ADVERB_TO_FREQUENCY[adv] = factor


# ========================================
# 語尾パターンによる確信度
# ========================================

@dataclass
class TailPattern:
    """語尾パターン"""
    pattern: str
    certainty: float
    type: str  # assertion, experience, speculation, hearsay, desire, negative_desire
    pivot_tendency: str  # P, I, V, O, T


# 語尾パターン定義
TAIL_PATTERNS = [
    # 断定 (確信度 1.0) - Pain / Traction
    TailPattern(r"(?:です|ます|だ|である)$", 1.0, "assertion", "P"),
    TailPattern(r"(?:ですね|ますね|だね|だよね)$", 1.0, "assertion", "P"),

    # 経験 (確信度 0.9) - Pain
    TailPattern(r"(?:ました|した|てしまった|ちゃった)$", 0.9, "experience", "P"),
    TailPattern(r"(?:ている|てる|ていた|てた)$", 0.9, "experience", "P"),

    # 推測 (確信度 0.6) - Insecurity
    TailPattern(r"(?:かもしれない|かもしれません)$", 0.6, "speculation", "I"),
    TailPattern(r"(?:だろう|でしょう)$", 0.6, "speculation", "I"),
    TailPattern(r"(?:と思う|と思います)$", 0.6, "speculation", "I"),
    TailPattern(r"(?:気がする|気がします)$", 0.6, "speculation", "I"),
    TailPattern(r"(?:恐れがある|可能性がある)$", 0.6, "speculation", "I"),

    # 伝聞 (確信度 0.4) - Insecurity
    TailPattern(r"(?:らしい|らしいです)$", 0.4, "hearsay", "I"),
    TailPattern(r"(?:そうだ|そうです)$", 0.4, "hearsay", "I"),
    TailPattern(r"(?:と聞いた|と聞きました|って聞いた)$", 0.4, "hearsay", "I"),

    # 願望 (確信度 0.8) - Vision
    TailPattern(r"(?:てほしい|てほしいです|ていただきたい)$", 0.8, "desire", "V"),
    TailPattern(r"(?:たい|たいです|たいと思う)$", 0.8, "desire", "V"),
    TailPattern(r"(?:ばいいのに|といいのに)$", 0.8, "desire", "V"),
    TailPattern(r"(?:があれば|ができれば)$", 0.8, "desire", "V"),
    TailPattern(r"(?:になってほしい|になるといい)$", 0.8, "desire", "V"),

    # 否定的願望 (確信度 0.8) - Objection
    TailPattern(r"(?:たくない|たくないです)$", 0.8, "negative_desire", "O"),
    TailPattern(r"(?:てほしくない|ないでほしい)$", 0.8, "negative_desire", "O"),
    TailPattern(r"(?:はやめてほしい|はやめてください)$", 0.8, "negative_desire", "O"),
    TailPattern(r"(?:べきではない|べきじゃない)$", 0.8, "negative_desire", "O"),
]


# ========================================
# 型定義
# ========================================

@dataclass
class VerbInfo:
    """動詞情報"""
    surface: str       # 表層形
    base: str          # 基本形（原形）
    category: VerbCategory


@dataclass
class AdjectiveInfo:
    """形容詞情報"""
    surface: str       # 表層形
    sentiment: Sentiment


@dataclass
class AdverbInfo:
    """副詞情報"""
    surface: str       # 表層形
    degree_factor: float   # 程度係数
    frequency_factor: float  # 頻度係数


@dataclass
class TailInfo:
    """語尾情報"""
    pattern: str
    certainty: float
    type: str
    pivot_tendency: str


@dataclass
class MorphologyResult:
    """形態素解析結果"""
    # 元テキスト
    raw_text: str

    # 抽出された品詞情報
    nouns: List[str] = field(default_factory=list)
    verbs: List[VerbInfo] = field(default_factory=list)
    adjectives: List[AdjectiveInfo] = field(default_factory=list)
    adverbs: List[AdverbInfo] = field(default_factory=list)
    tail: Optional[TailInfo] = None

    # 集計スコア
    degree_factor: float = 1.0   # 副詞による程度係数（最大値）
    frequency_factor: float = 1.0  # 副詞による頻度係数（最大値）
    certainty: float = 1.0       # 語尾による確信度

    # PIVOT判定用サマリー
    verb_categories: List[VerbCategory] = field(default_factory=list)
    sentiment_score: float = 0.0  # -1.0 〜 +1.0
    pivot_tendency: Optional[str] = None  # 語尾から推定されるPIVOT傾向


# ========================================
# 形態素解析エンジン
# ========================================

class MorphologyAnalyzer:
    """品詞分解エンジン（ルールベース簡易版）"""

    def __init__(self):
        """初期化"""
        # 語尾パターンをコンパイル
        self.tail_patterns = [
            (re.compile(tp.pattern), tp)
            for tp in TAIL_PATTERNS
        ]

    def analyze(self, text: str) -> MorphologyResult:
        """
        テキストを形態素解析

        Args:
            text: 入力テキスト

        Returns:
            MorphologyResult: 解析結果

        Note:
            この実装は簡易版であり、完全な形態素解析器（MeCab等）の
            代替ではありません。キーワードベースの抽出を行います。
        """
        result = MorphologyResult(raw_text=text)

        # 動詞抽出
        result.verbs = self._extract_verbs(text)
        result.verb_categories = [v.category for v in result.verbs
                                  if v.category != VerbCategory.NEUTRAL]

        # 形容詞抽出
        result.adjectives = self._extract_adjectives(text)

        # 副詞抽出
        result.adverbs = self._extract_adverbs(text)

        # 語尾パターン検出
        result.tail = self._detect_tail_pattern(text)

        # 集計スコア算出
        result.degree_factor = self._calculate_degree_factor(result.adverbs)
        result.frequency_factor = self._calculate_frequency_factor(result.adverbs)

        if result.tail:
            result.certainty = result.tail.certainty
            result.pivot_tendency = result.tail.pivot_tendency
        else:
            result.certainty = 1.0  # デフォルト（断定）
            result.pivot_tendency = None

        # センチメントスコア算出
        result.sentiment_score = self._calculate_sentiment_score(result.adjectives)

        return result

    def _extract_verbs(self, text: str) -> List[VerbInfo]:
        """動詞を抽出"""
        verbs = []

        for verb, category in VERB_TO_CATEGORY.items():
            if verb in text:
                verbs.append(VerbInfo(
                    surface=verb,
                    base=verb,
                    category=category,
                ))

        return verbs

    def _extract_adjectives(self, text: str) -> List[AdjectiveInfo]:
        """形容詞を抽出"""
        adjectives = []

        for adj, sentiment in ADJECTIVE_TO_SENTIMENT.items():
            if adj in text:
                adjectives.append(AdjectiveInfo(
                    surface=adj,
                    sentiment=sentiment,
                ))

        return adjectives

    def _extract_adverbs(self, text: str) -> List[AdverbInfo]:
        """副詞を抽出"""
        adverbs = []

        # 程度副詞
        for adv, factor in ADVERB_TO_DEGREE.items():
            if adv in text:
                adverbs.append(AdverbInfo(
                    surface=adv,
                    degree_factor=factor,
                    frequency_factor=1.0,
                ))

        # 頻度副詞
        for adv, factor in ADVERB_TO_FREQUENCY.items():
            if adv in text:
                # 既に追加されているか確認
                existing = next((a for a in adverbs if a.surface == adv), None)
                if existing:
                    existing.frequency_factor = factor
                else:
                    adverbs.append(AdverbInfo(
                        surface=adv,
                        degree_factor=1.0,
                        frequency_factor=factor,
                    ))

        return adverbs

    def _detect_tail_pattern(self, text: str) -> Optional[TailInfo]:
        """語尾パターンを検出"""
        # 文末から検索（優先度順）
        for pattern, tail_pattern in self.tail_patterns:
            if pattern.search(text):
                return TailInfo(
                    pattern=tail_pattern.pattern,
                    certainty=tail_pattern.certainty,
                    type=tail_pattern.type,
                    pivot_tendency=tail_pattern.pivot_tendency,
                )

        return None

    def _calculate_degree_factor(self, adverbs: List[AdverbInfo]) -> float:
        """程度係数を算出（最大値を採用）"""
        if not adverbs:
            return 1.0

        factors = [a.degree_factor for a in adverbs]
        return max(factors)

    def _calculate_frequency_factor(self, adverbs: List[AdverbInfo]) -> float:
        """頻度係数を算出（最大値を採用）"""
        if not adverbs:
            return 1.0

        factors = [a.frequency_factor for a in adverbs]
        return max(factors)

    def _calculate_sentiment_score(self, adjectives: List[AdjectiveInfo]) -> float:
        """センチメントスコアを算出 (-1.0 〜 +1.0)"""
        if not adjectives:
            return 0.0

        positive_count = sum(1 for a in adjectives if a.sentiment == Sentiment.POSITIVE)
        negative_count = sum(1 for a in adjectives if a.sentiment == Sentiment.NEGATIVE)
        anxiety_count = sum(1 for a in adjectives if a.sentiment == Sentiment.ANXIETY)

        total = positive_count + negative_count + anxiety_count
        if total == 0:
            return 0.0

        # 不安系はネガティブとして扱う
        score = (positive_count - negative_count - anxiety_count) / total
        return max(-1.0, min(1.0, score))


# ========================================
# PIVOT判定ヘルパー
# ========================================

def infer_pivot_from_morphology(result: MorphologyResult) -> Tuple[str, float, str]:
    """
    形態素解析結果からPIVOTを推定

    Args:
        result: MorphologyResult

    Returns:
        Tuple[pivot, confidence, reasoning]
    """
    # 動詞カテゴリからの判定
    verb_cats = result.verb_categories

    # 語尾からの判定
    tail_pivot = result.pivot_tendency
    certainty = result.certainty

    # センチメントスコア
    sentiment = result.sentiment_score

    # 判定ロジック
    reasons = []

    # P（Pain）の判定条件:
    #   動詞 = 障害系 or 困難系
    #   AND 形容詞 = ネガティブ
    #   AND 語尾 = 断定 or 経験（確信度 0.9以上）
    if (VerbCategory.OBSTACLE in verb_cats or VerbCategory.DIFFICULTY in verb_cats):
        if sentiment < 0 and certainty >= 0.9:
            reasons.append("障害系/困難系動詞+ネガティブ形容詞+高確信度語尾")
            return "P", 0.9, "; ".join(reasons)

    # I（Insecurity）の判定条件:
    #   動詞 = 喪失系
    #   OR 形容詞 = 不安系
    #   OR 語尾 = 推測 or 伝聞（確信度 0.6以下）
    if VerbCategory.LOSS in verb_cats:
        reasons.append("喪失系動詞")
        return "I", 0.85, "; ".join(reasons)

    if any(a.sentiment == Sentiment.ANXIETY for a in result.adjectives):
        reasons.append("不安系形容詞")
        return "I", 0.8, "; ".join(reasons)

    if certainty <= 0.6 and tail_pivot == "I":
        reasons.append("推測/伝聞語尾")
        return "I", 0.75, "; ".join(reasons)

    # V（Vision）の判定条件:
    #   語尾 = 願望
    #   OR 動詞 = 願望系
    if VerbCategory.DESIRE in verb_cats:
        reasons.append("願望系動詞")
        return "V", 0.85, "; ".join(reasons)

    if tail_pivot == "V":
        reasons.append("願望語尾")
        return "V", 0.8, "; ".join(reasons)

    # O（Objection）の判定条件:
    #   動詞 = 拒否系
    #   OR 語尾 = 否定的願望
    if VerbCategory.REJECTION in verb_cats:
        reasons.append("拒否系動詞")
        return "O", 0.85, "; ".join(reasons)

    if tail_pivot == "O":
        reasons.append("否定的願望語尾")
        return "O", 0.8, "; ".join(reasons)

    # T（Traction）の判定条件:
    #   動詞 = 成功系
    #   AND 形容詞 = ポジティブ
    if VerbCategory.SUCCESS in verb_cats:
        if sentiment > 0:
            reasons.append("成功系動詞+ポジティブ形容詞")
            return "T", 0.9, "; ".join(reasons)
        else:
            reasons.append("成功系動詞")
            return "T", 0.7, "; ".join(reasons)

    # 形容詞のみでの判定（フォールバック）
    if sentiment < -0.5:
        reasons.append("ネガティブ形容詞優位")
        return "P", 0.6, "; ".join(reasons)

    if sentiment > 0.5:
        reasons.append("ポジティブ形容詞優位")
        return "T", 0.6, "; ".join(reasons)

    # 判定不能
    return "", 0.0, "判定条件に該当せず"


def calculate_intensity_score(
    base_score: int,
    degree_factor: float,
    certainty: float,
) -> float:
    """
    強度スコアを算出

    Args:
        base_score: PIVOTの基本スコア (-2, -1, +1, +2)
        degree_factor: 副詞による程度係数
        certainty: 語尾による確信度

    Returns:
        float: 強度スコア

    Formula:
        強度スコア = 基本スコア × 副詞係数 × 確信度
    """
    return base_score * degree_factor * certainty


# ========================================
# 便利関数
# ========================================

def analyze_text(text: str) -> MorphologyResult:
    """
    シンプルなインターフェース

    Args:
        text: 入力テキスト

    Returns:
        MorphologyResult: 解析結果

    Example:
        result = analyze_text("工程管理が非常に遅くて困っている")
        print(result.verb_categories)  # [VerbCategory.DIFFICULTY]
        print(result.degree_factor)    # 1.5
        print(result.sentiment_score)  # -1.0
    """
    analyzer = MorphologyAnalyzer()
    return analyzer.analyze(text)


def get_verb_category(verb: str) -> VerbCategory:
    """動詞のカテゴリを取得"""
    return VERB_TO_CATEGORY.get(verb, VerbCategory.NEUTRAL)


def get_adjective_sentiment(adjective: str) -> Sentiment:
    """形容詞のセンチメントを取得"""
    return ADJECTIVE_TO_SENTIMENT.get(adjective, Sentiment.NEUTRAL)


def get_degree_factor(adverb: str) -> float:
    """副詞の程度係数を取得"""
    return ADVERB_TO_DEGREE.get(adverb, 1.0)
