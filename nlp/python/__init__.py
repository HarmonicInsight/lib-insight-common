"""
Insight Series NLP モジュール - Python

日本語テキスト分析のためのNLPツール群。

Modules:
    pivot: PIVOTフレームワークによるインタビュー・テキスト分析
"""

__version__ = "0.4.0"

# Re-export pivot module for convenience
from .pivot import (
    # Main APIs
    analyze_texts,
    analyze_interview,
    classify_utterances,
    # Engine
    InsightInterviewEngine,
    PIVOTClassifier,
    MorphologyAnalyzer,
    # Types
    PIVOTInsight,
    PIVOTClassificationResult,
    InsightInterviewResult,
    MorphologyResult,
    Utterance,
    PIVOT,
)

__all__ = [
    "__version__",
    # Main APIs
    "analyze_texts",
    "analyze_interview",
    "classify_utterances",
    # Engine
    "InsightInterviewEngine",
    "PIVOTClassifier",
    "MorphologyAnalyzer",
    # Types
    "PIVOTInsight",
    "PIVOTClassificationResult",
    "InsightInterviewResult",
    "MorphologyResult",
    "Utterance",
    "PIVOT",
]
