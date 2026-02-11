"""
PIVOT Classifier - PIVOTフレームワークによるインタビュー発言分類

PIVOTフレームワーク:
- 対象軸（What）: Process / Tool / People の3層モデル
- 声の分類（Voice）: P(Pain) / I(Insecurity) / V(Vision) / O(Objection) / T(Traction)

使用例:
    from nlp.python.pivot import PIVOTClassifier, classify_utterances

    classifier = PIVOTClassifier(domain="biz_analysis")
    results = classifier.classify([
        "工程管理をExcelでやっているが更新が追いつかない",
        "担当が辞めたら引継ぎできるか心配",
    ])

    for item in results.items:
        print(f"{item.pivot_voice}: {item.title}")
        print(f"  Process: {item.target_layers.get('process', '-')}")
"""

import re
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from datetime import datetime

# 品詞分解エンジン
from .morphology import (
    MorphologyAnalyzer,
    MorphologyResult,
    infer_pivot_from_morphology,
    calculate_intensity_score,
    VerbCategory,
    Sentiment,
)


# ========================================
# 型定義
# ========================================

@dataclass
class Utterance:
    """入力発話"""
    id: str
    text: str
    speaker_id: Optional[str] = None
    speaker_role: Optional[str] = None
    speaker_department: Optional[str] = None
    question_no: Optional[int] = None
    question_text: Optional[str] = None
    interview_id: Optional[str] = None
    line_no: Optional[int] = None


@dataclass
class PIVOTInsight:
    """PIVOT分類された発話"""
    id: str
    pivot_voice: str  # P, I, V, O, T
    pivot_label: str  # Pain, Insecurity, Vision, Objection, Traction
    pivot_score: int  # -2, -1, +1, +2
    target_layers: Dict[str, Optional[str]]  # process, tool, people
    title: str
    body: str
    confidence: float
    temperature: str  # low, medium, high
    matched_keywords: List[str] = field(default_factory=list)
    matched_patterns: List[str] = field(default_factory=list)
    source: Optional[Utterance] = None
    # 品詞分解情報
    intensity_score: float = 0.0  # 強度スコア（基本スコア×副詞係数×確信度）
    degree_factor: float = 1.0    # 副詞による程度係数
    certainty: float = 1.0        # 語尾による確信度
    reasoning: str = ""           # 分類理由


@dataclass
class PIVOTClassificationResult:
    """分類結果"""
    items: List[PIVOTInsight]
    by_pivot: Dict[str, List[PIVOTInsight]]
    by_process: Dict[str, Dict[str, int]]
    by_tool: Dict[str, Dict[str, int]]
    total_score: int
    sentiment_index: float
    stats: Dict


# ========================================
# PIVOT定義
# ========================================

class PIVOT:
    """PIVOT Voice定義"""
    PAIN = "P"
    INSECURITY = "I"
    VISION = "V"
    OBJECTION = "O"
    TRACTION = "T"

    ALL = [PAIN, INSECURITY, VISION, OBJECTION, TRACTION]

    LABELS = {
        "P": "Pain",
        "I": "Insecurity",
        "V": "Vision",
        "O": "Objection",
        "T": "Traction",
    }

    SCORES = {
        "P": -2,  # 現在の負のインパクト
        "I": -1,  # 将来の潜在リスク
        "V": 1,   # 改善へのモチベーション
        "O": -1,  # 実行障壁
        "T": 2,   # 成功の土台
    }

    DESCRIPTIONS = {
        "P": "課題・困りごと",
        "I": "不安・心配",
        "V": "要望・理想像",
        "O": "摩擦・抵抗",
        "T": "成功・強み",
    }


# ========================================
# キーワード・パターン辞書
# ========================================

PIVOT_KEYWORDS = {
    "P": {  # Pain
        "keywords": [
            "困っている", "問題", "課題", "うまくいかない", "できない",
            "難しい", "障害", "ボトルネック", "トラブル", "エラー",
            "遅れ", "遅延", "不足", "ミス", "失敗", "止まる",
            "時間がかかる", "手間", "非効率", "無駄", "面倒",
            "バグ", "不具合", "故障", "落ちる", "動かない",
        ],
        "patterns": [
            r"(.+?)(?:で|に)困っている",
            r"(.+?)(?:が|は)(?:問題|課題)(?:だ|です|になっている)",
            r"(.+?)(?:が|は)(?:うまくいかない|難しい|厳しい)",
            r"(.+?)(?:が|に)時間がかかる",
            r"(.+?)(?:で|が)(?:ミス|エラー|トラブル)が(?:起きる|発生)",
            r"(.+?)(?:が|は)(?:できない|動かない|止まる)",
        ],
    },
    "I": {  # Insecurity
        "keywords": [
            "心配", "不安", "懸念", "気になる", "気がかり",
            "大丈夫か", "リスク", "危ない", "もしかしたら",
            "かもしれない", "恐れ", "属人化", "引継ぎ",
            "辞めたら", "いなくなったら", "将来", "今後",
            "先行き", "見通し", "ブラックボックス",
        ],
        "patterns": [
            r"(.+?)(?:が|を)(?:心配|不安|懸念)",
            r"(.+?)(?:が|は)気になる",
            r"(.+?)(?:かもしれない|恐れがある)",
            r"(.+?)(?:が|は)(?:大丈夫か|大丈夫なのか)",
            r"(?:辞め|いなくなっ)たら(.+?)(?:が|は|も)(?:困る|終わる|できない)",
            r"(.+?)(?:が|は)属人化(?:している|されている)",
            r"(.+?)(?:の|が)(?:引継ぎ|引き継ぎ)(?:が|は)(?:心配|不安|できない)",
        ],
    },
    "V": {  # Vision
        "keywords": [
            "してほしい", "欲しい", "ほしい", "があれば", "できたら",
            "期待", "要望", "希望", "理想", "改善したい",
            "効率化", "自動化", "システム化", "デジタル化",
            "したい", "できるように", "なればいい", "なるといい",
            "導入したい", "使いたい", "実現したい",
        ],
        "patterns": [
            r"(.+?)(?:して|が)(?:ほしい|欲しい|ホシイ)",
            r"(.+?)(?:があれば|できれば)(?:いい|良い|嬉しい|助かる)",
            r"(.+?)を(?:期待|要望|希望)(?:している|します|したい)",
            r"(.+?)(?:を|が)(?:効率化|自動化|改善)(?:したい|してほしい)",
            r"(?:理想|理想的)(?:には|は)(.+?)(?:こと|状態)",
            r"(.+?)(?:を|が)(?:導入|実現)(?:したい|してほしい)",
        ],
    },
    "O": {  # Objection
        "keywords": [
            "反対", "抵抗", "無理", "やりたくない",
            "前もダメだった", "失敗した", "うまくいかなかった",
            "嫌", "面倒", "ストレス", "対立", "衝突",
            "理解されない", "協力してくれない", "押し付け",
            "やらされ", "強制", "納得できない",
        ],
        "patterns": [
            r"(?:前|以前|過去)(?:に|も)(.+?)(?:が|で)(?:失敗|ダメ|うまくいかなかった)",
            r"(.+?)(?:に|は)(?:反対|抵抗)(?:がある|している)",
            r"(.+?)(?:は|が)(?:無理|できない)(?:と思う|だと思う)",
            r"(.+?)(?:を|は)(?:やりたくない|したくない)",
            r"(.+?)(?:と|から)(?:対立|衝突|摩擦)(?:がある|している)",
            r"(.+?)(?:が|は)(?:納得できない|理解できない)",
        ],
    },
    "T": {  # Traction
        "keywords": [
            "うまくいっている", "成功", "順調", "問題ない",
            "満足", "良い", "便利", "助かっている", "効率的",
            "強み", "得意", "定着", "回っている", "機能している",
            "気に入っている", "使いやすい", "スムーズ",
            "うまく", "ちゃんと", "しっかり", "快適",
        ],
        "patterns": [
            r"(.+?)(?:は|が)(?:うまくいっている|順調|成功)",
            r"(.+?)(?:に|は)(?:満足|問題ない)",
            r"(.+?)(?:は|が)(?:便利|助かっている|効率的)",
            r"(.+?)(?:は|が)(?:強み|得意|定着している)",
            r"(.+?)(?:は|が)(?:うまく|ちゃんと)(?:回っている|機能している|動いている)",
            r"(.+?)(?:は|が)(?:使いやすい|気に入っている)",
        ],
    },
}


# ========================================
# 対象軸（Layer）パターン
# ========================================

LAYER_PATTERNS = {
    "process": {
        "keywords": [
            # 業務系
            "管理", "処理", "作業", "業務", "対応", "報告",
            "確認", "承認", "申請", "発注", "受注", "請求",
            "入力", "出力", "集計", "分析", "検査", "点検",
            "棚卸", "在庫", "出荷", "配送", "仕入", "調達",
            "採用", "評価", "教育", "研修", "勤怠", "給与",
        ],
        "patterns": [
            r"(.{2,15})(?:管理|処理|作業|業務|対応)",
            r"(.{2,10})の(?:確認|承認|申請|報告)",
            r"(.{2,10})(?:入力|出力|集計|分析)",
        ],
        "extraction_patterns": [
            r"(.{2,15}管理)",
            r"(.{2,15}処理)",
            r"(.{2,10}業務)",
            r"(.{2,10}作業)",
        ],
    },
    "tool": {
        "keywords": [
            # ツール系
            "Excel", "エクセル", "Word", "ワード", "PowerPoint", "パワポ",
            "メール", "Slack", "Teams", "Zoom", "LINE", "チャット",
            "システム", "ソフト", "アプリ", "ツール",
            "紙", "帳票", "伝票", "FAX", "電話",
            "基幹", "ERP", "CRM", "SFA", "BIツール",
            "スプレッドシート", "Googleスプレッドシート",
            "kintone", "キントーン", "Salesforce", "SAP",
        ],
        "patterns": [
            r"(.+?)(?:システム|ソフト|アプリ|ツール)(?:を|で|が)",
            r"(.+?)(?:で|を使って)(?:やっている|管理している|処理している)",
        ],
        "extraction_patterns": [
            r"(Excel|エクセル|Word|ワード|PowerPoint|パワポ)",
            r"(Slack|Teams|Zoom|LINE|メール)",
            r"(.{2,10}システム)",
            r"(紙|帳票|伝票|FAX|電話)",
        ],
    },
    "people": {
        "keywords": [
            # 人・組織系
            "担当", "担当者", "責任者", "マネージャー", "リーダー",
            "部長", "課長", "係長", "社長", "役員", "経営",
            "営業", "経理", "総務", "人事", "開発", "現場",
            "部署", "チーム", "グループ", "外注", "協力会社",
            "新人", "ベテラン", "パート", "派遣", "アルバイト",
            "上司", "部下", "同僚", "後輩", "先輩",
        ],
        "patterns": [
            r"(.{2,10})(?:部|課|チーム|グループ)(?:が|は|の)",
            r"(.{2,10})(?:担当|担当者|責任者)(?:が|は|の)",
            r"(.{2,10})(?:さん|氏)(?:が|は|の)",
        ],
        "extraction_patterns": [
            r"(.{2,10}部)",
            r"(.{2,10}課)",
            r"(担当者?|責任者|マネージャー|リーダー)",
            r"(外注|協力会社|パート|派遣)",
        ],
    },
}


# ========================================
# 温度感判定
# ========================================

TEMPERATURE_INDICATORS = {
    "high": [
        "絶対", "本当に", "非常に", "とても", "すごく", "めちゃくちゃ",
        "いつも", "毎回", "必ず", "全然", "全く", "まったく",
        "やばい", "最悪", "困りすぎ", "無理すぎ",
    ],
    "medium": [
        "かなり", "結構", "わりと", "それなりに",
        "時々", "たまに", "よく", "だいたい",
    ],
    "low": [
        "少し", "ちょっと", "多少", "若干",
        "たぶん", "おそらく", "もしかしたら",
    ],
}


# ========================================
# 業務ドメイン定義
# ========================================

class BusinessDomain:
    """業務ドメイン定義"""
    REQUIREMENTS = "requirements"
    BIZ_ANALYSIS = "biz_analysis"
    HR_EVALUATION = "hr_evaluation"
    DAILY_CONCERNS = "daily_concerns"
    CUSTOMER_VOICE = "customer_voice"
    RETROSPECTIVE = "retrospective"

    ALL = [REQUIREMENTS, BIZ_ANALYSIS, HR_EVALUATION,
           DAILY_CONCERNS, CUSTOMER_VOICE, RETROSPECTIVE]


DOMAIN_PIVOT_WEIGHTS = {
    BusinessDomain.REQUIREMENTS: {
        "P": 1.5, "I": 1.0, "V": 2.0, "O": 0.8, "T": 1.0,
    },
    BusinessDomain.BIZ_ANALYSIS: {
        "P": 2.0, "I": 1.2, "V": 1.0, "O": 1.0, "T": 1.5,
    },
    BusinessDomain.HR_EVALUATION: {
        "P": 1.0, "I": 2.0, "V": 1.5, "O": 1.8, "T": 1.2,
    },
    BusinessDomain.DAILY_CONCERNS: {
        "P": 1.8, "I": 2.0, "V": 1.0, "O": 1.2, "T": 1.0,
    },
    BusinessDomain.CUSTOMER_VOICE: {
        "P": 1.8, "I": 1.0, "V": 2.0, "O": 1.2, "T": 1.5,
    },
    BusinessDomain.RETROSPECTIVE: {
        "P": 1.5, "I": 1.2, "V": 1.5, "O": 1.2, "T": 1.8,
    },
}


# ========================================
# PIVOT分類エンジン
# ========================================

class PIVOTClassifier:
    """PIVOTフレームワークによる発話分類エンジン"""

    def __init__(
        self,
        domain: Optional[str] = None,
        min_confidence: float = 0.3,
        use_morphology: bool = True,
    ):
        """
        Args:
            domain: 業務ドメイン（重み付けに使用）
            min_confidence: 最小信頼度閾値
            use_morphology: 品詞分解エンジンを使用するか
        """
        self.domain = domain
        self.min_confidence = min_confidence
        self.use_morphology = use_morphology

        # 品詞分解エンジン
        if self.use_morphology:
            self.morphology_analyzer = MorphologyAnalyzer()
        else:
            self.morphology_analyzer = None

        # ドメイン別重みを取得
        self.weights = DOMAIN_PIVOT_WEIGHTS.get(
            domain,
            {p: 1.0 for p in PIVOT.ALL}
        )

        # パターンをコンパイル
        self._compile_patterns()

    def _compile_patterns(self):
        """正規表現パターンをコンパイル"""
        self.pivot_patterns = {}
        for pivot, config in PIVOT_KEYWORDS.items():
            self.pivot_patterns[pivot] = [
                re.compile(p) for p in config.get("patterns", [])
            ]

        self.layer_patterns = {}
        for layer, config in LAYER_PATTERNS.items():
            self.layer_patterns[layer] = {
                "patterns": [re.compile(p) for p in config.get("patterns", [])],
                "extraction": [re.compile(p) for p in config.get("extraction_patterns", [])],
            }

    def classify(
        self,
        utterances: List[Utterance],
    ) -> PIVOTClassificationResult:
        """
        発話リストをPIVOT分類

        Args:
            utterances: 入力発話リスト

        Returns:
            PIVOTClassificationResult: 分類結果
        """
        items: List[PIVOTInsight] = []
        by_pivot: Dict[str, List[PIVOTInsight]] = {p: [] for p in PIVOT.ALL}
        by_process: Dict[str, Dict[str, int]] = {}
        by_tool: Dict[str, Dict[str, int]] = {}

        for utterance in utterances:
            classified = self._classify_single(utterance)
            if classified and classified.confidence >= self.min_confidence:
                items.append(classified)
                by_pivot[classified.pivot_voice].append(classified)

                # Process/Tool別集計
                process = classified.target_layers.get("process")
                tool = classified.target_layers.get("tool")

                if process:
                    if process not in by_process:
                        by_process[process] = {p: 0 for p in PIVOT.ALL}
                    by_process[process][classified.pivot_voice] += 1

                if tool:
                    if tool not in by_tool:
                        by_tool[tool] = {p: 0 for p in PIVOT.ALL}
                    by_tool[tool][classified.pivot_voice] += 1

        # ドメイン重みを適用してソート
        items = self._apply_domain_weights(items)

        # スコア算出
        total_score = sum(item.pivot_score for item in items)
        sentiment_index = total_score / len(items) if items else 0.0

        # 統計情報
        stats = {
            "total": len(items),
            "by_pivot": {p: len(lst) for p, lst in by_pivot.items()},
            "domain": self.domain,
            "total_score": total_score,
            "sentiment_index": sentiment_index,
        }

        return PIVOTClassificationResult(
            items=items,
            by_pivot=by_pivot,
            by_process=by_process,
            by_tool=by_tool,
            total_score=total_score,
            sentiment_index=sentiment_index,
            stats=stats,
        )

    def _classify_single(self, utterance: Utterance) -> Optional[PIVOTInsight]:
        """単一発話をPIVOT分類"""
        text = utterance.text or ""
        if not text.strip():
            return None

        # 品詞分解による強化分類
        morphology_result = None
        degree_factor = 1.0
        certainty = 1.0
        reasoning = ""

        if self.use_morphology and self.morphology_analyzer:
            morphology_result = self.morphology_analyzer.analyze(text)
            degree_factor = morphology_result.degree_factor
            certainty = morphology_result.certainty

            # 品詞分解によるPIVOT推定を試みる
            morph_pivot, morph_conf, morph_reason = infer_pivot_from_morphology(morphology_result)
            if morph_pivot and morph_conf >= 0.6:
                # 品詞分解による分類が高確信度の場合、それを採用
                pivot_voice = morph_pivot
                confidence = morph_conf
                matched_keywords = [v.surface for v in morphology_result.verbs]
                matched_keywords += [a.surface for a in morphology_result.adjectives]
                matched_patterns = [morph_reason]
                reasoning = morph_reason
            else:
                # フォールバック: キーワード/パターンベース分類
                pivot_result = self._classify_pivot(text)
                if not pivot_result:
                    return None
                pivot_voice, confidence, matched_keywords, matched_patterns = pivot_result
                reasoning = "キーワード/パターンベース"
        else:
            # 品詞分解なし: キーワード/パターンベース分類のみ
            pivot_result = self._classify_pivot(text)
            if not pivot_result:
                return None
            pivot_voice, confidence, matched_keywords, matched_patterns = pivot_result
            reasoning = "キーワード/パターンベース"

        # 対象軸（Layer）抽出
        target_layers = self._extract_layers(text)

        # 温度感判定
        temperature = self._detect_temperature(text)

        # 強度スコア算出
        base_score = PIVOT.SCORES[pivot_voice]
        intensity_score = base_score * degree_factor * certainty

        return PIVOTInsight(
            id=str(uuid.uuid4()),
            pivot_voice=pivot_voice,
            pivot_label=PIVOT.LABELS[pivot_voice],
            pivot_score=PIVOT.SCORES[pivot_voice],
            target_layers=target_layers,
            title=self._truncate(text, 50),
            body=text,
            confidence=confidence,
            temperature=temperature,
            matched_keywords=matched_keywords,
            matched_patterns=matched_patterns,
            source=utterance,
            intensity_score=intensity_score,
            degree_factor=degree_factor,
            certainty=certainty,
            reasoning=reasoning,
        )

    def _classify_pivot(
        self,
        text: str,
    ) -> Optional[Tuple[str, float, List[str], List[str]]]:
        """PIVOT Voice分類"""
        scores: Dict[str, Tuple[float, List[str], List[str]]] = {}

        for pivot in PIVOT.ALL:
            config = PIVOT_KEYWORDS[pivot]
            keywords = config["keywords"]
            patterns = self.pivot_patterns[pivot]

            # キーワードマッチング
            matched_kw = [kw for kw in keywords if kw in text]
            kw_score = min(len(matched_kw) * 0.2, 0.6)

            # パターンマッチング
            matched_pat = []
            for pattern in patterns:
                if pattern.search(text):
                    matched_pat.append(pattern.pattern)
            pat_score = min(len(matched_pat) * 0.3, 0.6)

            # 合計スコア
            total_score = min(kw_score + pat_score, 0.95)

            if total_score > 0:
                scores[pivot] = (total_score, matched_kw, matched_pat)

        if not scores:
            return None

        # 最高スコアのPIVOTを選択
        best_pivot = max(scores.keys(), key=lambda p: scores[p][0])
        confidence, matched_keywords, matched_patterns = scores[best_pivot]

        return best_pivot, confidence, matched_keywords, matched_patterns

    def _extract_layers(self, text: str) -> Dict[str, Optional[str]]:
        """対象軸（Layer）を抽出"""
        layers: Dict[str, Optional[str]] = {
            "process": None,
            "tool": None,
            "people": None,
        }

        for layer, config in LAYER_PATTERNS.items():
            # キーワードチェック
            keywords = config["keywords"]
            for kw in keywords:
                if kw in text:
                    # 抽出パターンで具体的な値を取得
                    for pattern in self.layer_patterns[layer]["extraction"]:
                        match = pattern.search(text)
                        if match:
                            layers[layer] = match.group(1)
                            break
                    if layers[layer]:
                        break

                    # キーワード自体を値として使用
                    if not layers[layer]:
                        layers[layer] = kw
                        break

        return layers

    def _detect_temperature(self, text: str) -> str:
        """温度感を判定"""
        high_count = sum(1 for w in TEMPERATURE_INDICATORS["high"] if w in text)
        medium_count = sum(1 for w in TEMPERATURE_INDICATORS["medium"] if w in text)
        low_count = sum(1 for w in TEMPERATURE_INDICATORS["low"] if w in text)

        if high_count >= 1:
            return "high"
        elif medium_count >= 1:
            return "medium"
        elif low_count >= 1:
            return "low"
        else:
            return "medium"  # デフォルト

    def _apply_domain_weights(
        self,
        items: List[PIVOTInsight],
    ) -> List[PIVOTInsight]:
        """ドメイン重みを適用してソート"""
        def weighted_score(item: PIVOTInsight) -> float:
            weight = self.weights.get(item.pivot_voice, 1.0)
            return item.confidence * weight

        return sorted(items, key=weighted_score, reverse=True)

    def _truncate(self, text: str, max_len: int) -> str:
        """テキストを切り詰め"""
        text = text.replace("\n", " ").strip()
        if len(text) <= max_len:
            return text
        return text[:max_len] + "..."


# ========================================
# マート生成
# ========================================

def generate_pivot_insight_mart(
    insight: PIVOTInsight,
    observed_at: Optional[str] = None,
) -> Dict:
    """
    PIVOTInsightからマートアイテムを生成

    Args:
        insight: PIVOT分類済みインサイト
        observed_at: 観測日 (ISO-8601)

    Returns:
        Dict: マートアイテム (JSON出力用)
    """
    observed_at = observed_at or datetime.now().strftime("%Y-%m-%d")

    source = insight.source
    speaker = {}
    context = {}
    source_ref = {"doc_id": "", "section_path": ""}

    if source:
        if source.speaker_id:
            speaker["respondent_id"] = source.speaker_id
        if source.speaker_role:
            speaker["role"] = source.speaker_role
        if source.speaker_department:
            speaker["department"] = source.speaker_department
        if source.question_no is not None:
            context["question_no"] = source.question_no
        if source.question_text:
            context["question"] = source.question_text
        if source.interview_id:
            context["interview_id"] = source.interview_id
            source_ref["doc_id"] = source.interview_id
        if source.line_no:
            source_ref["line_no"] = source.line_no

    return {
        "id": f"pivot_{insight.id}",
        "mart_type": "pivot_insight",
        "pivot_voice": insight.pivot_voice,
        "pivot_label": insight.pivot_label,
        "pivot_score": insight.pivot_score,
        "target_layers": insight.target_layers,
        "title": insight.title,
        "body": insight.body,
        "speaker": speaker if speaker else None,
        "context": context if context else None,
        "keywords": {
            "surface": insight.matched_keywords,
            "normalized": [],
            "entities": [],
        },
        "temperature": insight.temperature,
        "frequency": 1,
        "source_ref": source_ref,
        "source_time": {
            "observed_at": observed_at,
        },
        "confidence": insight.confidence,
        "extraction_method": "rule_based" if not insight.reasoning.startswith("障害") else "morphology_based",
        "morphology": {
            "intensity_score": round(insight.intensity_score, 2),
            "degree_factor": insight.degree_factor,
            "certainty": insight.certainty,
            "reasoning": insight.reasoning,
        },
        "payload": {
            "raw_utterance": insight.body,
            "matched_keywords": insight.matched_keywords,
            "matched_patterns": insight.matched_patterns,
        },
    }


def generate_pivot_summary_mart(
    result: PIVOTClassificationResult,
    period_start: str,
    period_end: str,
    period_type: str = "monthly",
) -> Dict:
    """
    分類結果からサマリーマートを生成

    Args:
        result: PIVOT分類結果
        period_start: 期間開始日 (ISO-8601)
        period_end: 期間終了日 (ISO-8601)
        period_type: 期間タイプ (daily, weekly, monthly)

    Returns:
        Dict: サマリーマートアイテム
    """
    # PIVOT分布
    pivot_distribution = {}
    for pivot in PIVOT.ALL:
        count = len(result.by_pivot[pivot])
        score = count * PIVOT.SCORES[pivot]
        pivot_distribution[pivot] = {"count": count, "score": score}

    # Process別スコア
    by_process_scored = {}
    for process, counts in result.by_process.items():
        score = sum(counts[p] * PIVOT.SCORES[p] for p in PIVOT.ALL)
        by_process_scored[process] = {**counts, "score": score}

    # Tool別スコア
    by_tool_scored = {}
    for tool, counts in result.by_tool.items():
        score = sum(counts[p] * PIVOT.SCORES[p] for p in PIVOT.ALL)
        by_tool_scored[tool] = {**counts, "score": score}

    # 優先度マトリクス
    priority_matrix = _calculate_priority_matrix(result)

    # 上位アイテム
    top_items = {}
    for pivot in PIVOT.ALL:
        items = result.by_pivot[pivot][:5]
        top_items[pivot] = [
            {"id": f"pivot_{i.id}", "title": i.title, "frequency": 1}
            for i in items
        ]

    return {
        "id": f"pivot_summary_{period_start.replace('-', '')}",
        "mart_type": "pivot_summary",
        "period": {
            "type": period_type,
            "start": period_start,
            "end": period_end,
        },
        "pivot_distribution": pivot_distribution,
        "total_score": result.total_score,
        "sentiment_index": round(result.sentiment_index, 2),
        "by_process": by_process_scored,
        "by_tool": by_tool_scored,
        "priority_matrix": priority_matrix,
        "top_items": top_items,
    }


def _calculate_priority_matrix(result: PIVOTClassificationResult) -> Dict:
    """優先度マトリクスを算出"""
    urgent = []  # P × I が重なる
    quick_win = []  # V × T が重なる
    watch = []  # O が強い

    for process, counts in result.by_process.items():
        p_count = counts.get("P", 0)
        i_count = counts.get("I", 0)
        v_count = counts.get("V", 0)
        o_count = counts.get("O", 0)
        t_count = counts.get("T", 0)

        if p_count >= 2 and i_count >= 1:
            urgent.append(process)
        elif v_count >= 2 and t_count >= 1:
            quick_win.append(process)
        elif o_count >= 2:
            watch.append(process)

    return {
        "urgent": urgent,
        "quick_win": quick_win,
        "watch": watch,
    }


# ========================================
# 便利関数
# ========================================

def classify_utterances(
    texts: List[str],
    domain: Optional[str] = None,
    min_confidence: float = 0.3,
) -> PIVOTClassificationResult:
    """
    シンプルなインターフェース

    Args:
        texts: テキストリスト
        domain: 業務ドメイン
        min_confidence: 最小信頼度

    Returns:
        PIVOTClassificationResult: 分類結果

    Example:
        result = classify_utterances([
            "工程管理をExcelでやっているが更新が追いつかない",
            "担当が辞めたら引継ぎできるか心配",
            "請求処理は基幹システムでうまく回っている",
        ], domain="biz_analysis")

        for pivot in ["P", "I", "V", "O", "T"]:
            print(f"{pivot}: {len(result.by_pivot[pivot])}件")
    """
    utterances = [
        Utterance(
            id=str(i),
            text=text,
        )
        for i, text in enumerate(texts)
    ]

    classifier = PIVOTClassifier(
        domain=domain,
        min_confidence=min_confidence,
    )
    return classifier.classify(utterances)


def get_pivot_description(pivot: str) -> str:
    """PIVOTの説明を取得"""
    return PIVOT.DESCRIPTIONS.get(pivot, "")


def get_priority_label(process: str, result: PIVOTClassificationResult) -> str:
    """業務の優先度ラベルを取得"""
    matrix = _calculate_priority_matrix(result)
    if process in matrix["urgent"]:
        return "緊急対応"
    elif process in matrix["quick_win"]:
        return "クイックウィン"
    elif process in matrix["watch"]:
        return "要注意"
    else:
        return "通常"
