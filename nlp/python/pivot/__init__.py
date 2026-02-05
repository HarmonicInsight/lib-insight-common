"""
PIVOT Framework - PIVOTフレームワークによるインタビュー・テキスト分析

PIVOTフレームワーク:
- 対象軸（What）: Process / Tool / People の3層モデル
- 声の分類（Voice）: P(Pain) / I(Insecurity) / V(Vision) / O(Objection) / T(Traction)

使用例:
    from nlp.python.pivot import analyze_texts, InsightInterviewEngine

    # シンプルな使い方
    result = analyze_texts([
        "工程管理が非常に遅くて困っている",
        "担当者が辞めたら引継ぎできるか心配",
        "ガントチャート機能があれば効率化できる",
    ], domain="biz_analysis")

    for pivot in ["P", "I", "V", "O", "T"]:
        print(f"{pivot}: {len(result.by_pivot[pivot])}件")

    # エンジンを直接使う場合
    engine = InsightInterviewEngine(domain="biz_analysis")
    result = engine.process_texts(youtube_transcripts)
"""

__version__ = "0.4.0"

# Morphology Engine
from .morphology import (
    MorphologyAnalyzer,
    MorphologyResult,
    VerbCategory,
    Sentiment,
    VerbInfo,
    AdjectiveInfo,
    AdverbInfo,
    TailInfo,
    infer_pivot_from_morphology,
    calculate_intensity_score,
    analyze_text as analyze_morphology,
    get_verb_category,
    get_adjective_sentiment,
    get_degree_factor,
)

# PIVOT Classifier
from .classifier import (
    PIVOTClassifier,
    PIVOTInsight,
    PIVOTClassificationResult,
    Utterance,
    PIVOT,
    BusinessDomain,
    classify_utterances,
    generate_pivot_insight_mart,
    generate_pivot_summary_mart,
    get_pivot_description,
    get_priority_label,
)

# InsightInterview Engine
from .engine import (
    InsightInterviewEngine,
    InsightInterviewResult,
    InterviewMetadata,
    QASection,
    ParsedInterview,
    InterviewParser,
    UtteranceSplitter,
    analyze_interview,
    analyze_texts,
    get_priority_insights,
    get_urgent_items,
)

__all__ = [
    # Version
    "__version__",
    # Morphology Engine
    "MorphologyAnalyzer",
    "MorphologyResult",
    "VerbCategory",
    "Sentiment",
    "VerbInfo",
    "AdjectiveInfo",
    "AdverbInfo",
    "TailInfo",
    "infer_pivot_from_morphology",
    "calculate_intensity_score",
    "analyze_morphology",
    "get_verb_category",
    "get_adjective_sentiment",
    "get_degree_factor",
    # PIVOT Classifier
    "PIVOTClassifier",
    "PIVOTInsight",
    "PIVOTClassificationResult",
    "Utterance",
    "PIVOT",
    "BusinessDomain",
    "classify_utterances",
    "generate_pivot_insight_mart",
    "generate_pivot_summary_mart",
    "get_pivot_description",
    "get_priority_label",
    # InsightInterview Engine
    "InsightInterviewEngine",
    "InsightInterviewResult",
    "InterviewMetadata",
    "QASection",
    "ParsedInterview",
    "InterviewParser",
    "UtteranceSplitter",
    "analyze_interview",
    "analyze_texts",
    "get_priority_insights",
    "get_urgent_items",
]
