"""
InsightInterview Engine - インタビュー分析のコアエンジン

インタビューテキストからPIVOT分類されたインサイトを抽出し、
構造化マートとして格納するまでの一連のパイプラインを提供。

パイプライン:
1. 入力 (Raw Interview Text)
2. パース (メタデータ・Q&A抽出)
3. 発言分割 (1発言=1行)
4. PIVOT分類 (品詞分解 + パターンマッチ)
5. マート生成 (JSONL出力)

使用例:
    from nlp.python.pivot import InsightInterviewEngine

    engine = InsightInterviewEngine(domain="biz_analysis")

    # インタビューテキストを処理
    result = engine.process(interview_text)

    # PIVOT別に確認
    for pivot in result.by_pivot:
        print(f"{pivot}: {len(result.by_pivot[pivot])}件")

    # マートとして保存
    engine.save_marts(result, "output/marts.jsonl")
"""

import re
import json
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Iterator
from datetime import datetime
from pathlib import Path

# コアモジュール
from .classifier import (
    PIVOTClassifier,
    PIVOTInsight,
    PIVOTClassificationResult,
    Utterance,
    PIVOT,
    generate_pivot_insight_mart,
    generate_pivot_summary_mart,
)
from .morphology import MorphologyAnalyzer, MorphologyResult


# ========================================
# 型定義
# ========================================

@dataclass
class InterviewMetadata:
    """インタビューメタデータ"""
    interview_id: str
    respondent: str = ""
    company: str = ""
    role: str = ""
    department: str = ""
    date: str = ""
    interviewer: str = ""
    duration: str = ""
    extra: Dict[str, str] = field(default_factory=dict)


@dataclass
class QASection:
    """Q&Aセクション"""
    question_no: int
    question: str
    answer: str
    line_no: int = 0


@dataclass
class ParsedInterview:
    """パース済みインタビュー"""
    title: str
    metadata: InterviewMetadata
    qa_sections: List[QASection]
    raw_text: str


@dataclass
class InsightInterviewResult:
    """InsightInterview処理結果"""
    # 元データ
    interview: ParsedInterview

    # 分割された発話
    utterances: List[Utterance]

    # PIVOT分類結果
    classification: PIVOTClassificationResult

    # 便利なアクセサ
    @property
    def items(self) -> List[PIVOTInsight]:
        return self.classification.items

    @property
    def by_pivot(self) -> Dict[str, List[PIVOTInsight]]:
        return self.classification.by_pivot

    @property
    def by_process(self) -> Dict[str, Dict[str, int]]:
        return self.classification.by_process

    @property
    def total_score(self) -> int:
        return self.classification.total_score

    @property
    def sentiment_index(self) -> float:
        return self.classification.sentiment_index


# ========================================
# 発言分割ルール
# ========================================

# 文分割パターン
SENTENCE_SPLIT_PATTERNS = [
    r'(?<=[。．])\s*',           # 句点で分割
    r'(?<=[！？])\s*',           # 感嘆符・疑問符で分割
    r'(?<=\n)\s*',               # 改行で分割
]

# 複合文の接続詞（分割対象）
CONJUNCTION_PATTERNS = [
    r'(?:が|けど|けれど|けれども|だが|ただし|しかし|でも|ところが)、',
    r'(?:そして|また|さらに|加えて|それから)、',
    r'(?:一方|逆に|反対に|むしろ)、',
]


class UtteranceSplitter:
    """発言分割器"""

    def __init__(
        self,
        split_by_sentence: bool = True,
        split_by_conjunction: bool = True,
        min_length: int = 10,
        max_length: int = 500,
    ):
        """
        Args:
            split_by_sentence: 句点で分割するか
            split_by_conjunction: 接続詞で分割するか
            min_length: 最小発言長（これより短いものは前の発言に結合）
            max_length: 最大発言長（これより長いものは分割）
        """
        self.split_by_sentence = split_by_sentence
        self.split_by_conjunction = split_by_conjunction
        self.min_length = min_length
        self.max_length = max_length

        # パターンをコンパイル
        self.sentence_patterns = [re.compile(p) for p in SENTENCE_SPLIT_PATTERNS]
        self.conjunction_patterns = [re.compile(p) for p in CONJUNCTION_PATTERNS]

    def split(
        self,
        text: str,
        speaker_id: Optional[str] = None,
        speaker_role: Optional[str] = None,
        question_no: Optional[int] = None,
        question_text: Optional[str] = None,
        interview_id: Optional[str] = None,
        base_line_no: int = 0,
    ) -> List[Utterance]:
        """
        テキストを発言単位に分割

        Args:
            text: 入力テキスト
            speaker_id: 発言者ID
            speaker_role: 発言者役職
            question_no: 質問番号
            question_text: 質問文
            interview_id: インタビューID
            base_line_no: 基準行番号

        Returns:
            List[Utterance]: 分割された発話リスト
        """
        utterances = []

        # Step 1: 文単位で分割
        segments = [text]
        if self.split_by_sentence:
            segments = self._split_by_patterns(text, self.sentence_patterns)

        # Step 2: 接続詞で分割
        if self.split_by_conjunction:
            new_segments = []
            for seg in segments:
                new_segments.extend(self._split_by_patterns(seg, self.conjunction_patterns))
            segments = new_segments

        # Step 3: 短すぎる発言を結合、長すぎる発言を分割
        segments = self._normalize_length(segments)

        # Step 4: Utteranceオブジェクトに変換
        for i, seg in enumerate(segments):
            seg = seg.strip()
            if not seg:
                continue

            utterances.append(Utterance(
                id=str(uuid.uuid4()),
                text=seg,
                speaker_id=speaker_id,
                speaker_role=speaker_role,
                question_no=question_no,
                question_text=question_text,
                interview_id=interview_id,
                line_no=base_line_no + i,
            ))

        return utterances

    def _split_by_patterns(
        self,
        text: str,
        patterns: List[re.Pattern],
    ) -> List[str]:
        """パターンで分割"""
        segments = [text]

        for pattern in patterns:
            new_segments = []
            for seg in segments:
                parts = pattern.split(seg)
                new_segments.extend(p for p in parts if p.strip())
            segments = new_segments

        return segments

    def _normalize_length(self, segments: List[str]) -> List[str]:
        """発言長を正規化"""
        result = []
        buffer = ""

        for seg in segments:
            combined = buffer + seg

            if len(combined) < self.min_length:
                # 短すぎる場合はバッファに追加
                buffer = combined
            elif len(combined) > self.max_length:
                # 長すぎる場合は分割
                if buffer:
                    result.append(buffer)
                    buffer = ""
                # 強制分割（max_length文字ごと）
                for i in range(0, len(seg), self.max_length):
                    chunk = seg[i:i + self.max_length]
                    if len(chunk) >= self.min_length:
                        result.append(chunk)
                    else:
                        buffer = chunk
            else:
                if buffer:
                    result.append(buffer)
                    buffer = ""
                result.append(seg)

        if buffer:
            result.append(buffer)

        return result


# ========================================
# インタビューパーサー
# ========================================

class InterviewParser:
    """インタビューパーサー"""

    # メタデータキーのマッピング
    METADATA_KEYS = {
        "interview_id": ["interview_id", "id", "インタビューid", "インタビューID"],
        "respondent": ["respondent", "回答者", "対象者", "氏名", "name"],
        "company": ["company", "会社", "企業", "組織", "organization"],
        "role": ["role", "役職", "職位", "position"],
        "department": ["department", "部署", "部門", "チーム"],
        "date": ["date", "日付", "実施日", "interview_date"],
        "interviewer": ["interviewer", "インタビュアー", "聞き手"],
        "duration": ["duration", "時間", "所要時間"],
    }

    def parse(self, text: str) -> ParsedInterview:
        """
        インタビューテキストをパース

        Args:
            text: インタビューテキスト

        Returns:
            ParsedInterview: パース結果
        """
        lines = text.split("\n")

        # タイトル抽出
        title = self._extract_title(lines)

        # メタデータ抽出
        metadata = self._extract_metadata(lines)

        # Q&Aセクション抽出
        qa_sections = self._extract_qa_sections(lines)

        return ParsedInterview(
            title=title,
            metadata=metadata,
            qa_sections=qa_sections,
            raw_text=text,
        )

    def _extract_title(self, lines: List[str]) -> str:
        """タイトル抽出"""
        for line in lines:
            line = line.strip()
            if line.startswith("# "):
                return line[2:].strip()
        return ""

    def _extract_metadata(self, lines: List[str]) -> InterviewMetadata:
        """メタデータ抽出"""
        metadata = InterviewMetadata(interview_id="")
        extra = {}

        in_metadata_section = False

        for line in lines:
            line = line.strip()

            if "メタデータ" in line or "metadata" in line.lower():
                in_metadata_section = True
                continue

            if in_metadata_section:
                if line.startswith("## ") or line.startswith("# "):
                    break

                # "- key: value" 形式
                match = re.match(r"^[-・]\s*([^:：]+)[：:]\s*(.+)$", line)
                if match:
                    key = match.group(1).strip().lower()
                    value = match.group(2).strip()

                    # 標準キーにマッピング
                    mapped = False
                    for std_key, aliases in self.METADATA_KEYS.items():
                        if key in aliases or key == std_key:
                            setattr(metadata, std_key, value)
                            mapped = True
                            break

                    if not mapped:
                        extra[key] = value

        metadata.extra = extra

        # interview_idがない場合は生成
        if not metadata.interview_id:
            date_str = metadata.date or datetime.now().strftime("%Y%m%d")
            metadata.interview_id = f"INT_{date_str}_{uuid.uuid4().hex[:6]}"

        return metadata

    def _extract_qa_sections(self, lines: List[str]) -> List[QASection]:
        """Q&Aセクション抽出"""
        sections = []
        current_question = None
        current_answer_lines = []
        current_line_no = 0
        question_no = 0

        for i, line in enumerate(lines):
            stripped = line.strip()

            # 質問パターン検出
            q_match = re.match(r"^(?:###?\s*)?Q(\d+)[\.．]?\s*(.+)$", stripped)
            if q_match:
                # 前の質問を保存
                if current_question:
                    sections.append(QASection(
                        question_no=question_no,
                        question=current_question,
                        answer="\n".join(current_answer_lines).strip(),
                        line_no=current_line_no,
                    ))

                question_no = int(q_match.group(1))
                current_question = q_match.group(2).strip()
                current_answer_lines = []
                current_line_no = i
            elif current_question and stripped:
                # 次のセクション開始を検出
                if stripped.startswith("## ") or stripped.startswith("# "):
                    # 最後の質問を保存
                    sections.append(QASection(
                        question_no=question_no,
                        question=current_question,
                        answer="\n".join(current_answer_lines).strip(),
                        line_no=current_line_no,
                    ))
                    current_question = None
                    break
                else:
                    current_answer_lines.append(stripped)

        # 最後の質問を保存
        if current_question:
            sections.append(QASection(
                question_no=question_no,
                question=current_question,
                answer="\n".join(current_answer_lines).strip(),
                line_no=current_line_no,
            ))

        return sections


# ========================================
# InsightInterviewエンジン
# ========================================

class InsightInterviewEngine:
    """InsightInterviewコアエンジン"""

    def __init__(
        self,
        domain: Optional[str] = None,
        min_confidence: float = 0.3,
        use_morphology: bool = True,
        split_by_sentence: bool = True,
        split_by_conjunction: bool = True,
    ):
        """
        Args:
            domain: 業務ドメイン
            min_confidence: 最小信頼度
            use_morphology: 品詞分解を使用するか
            split_by_sentence: 句点で発言を分割するか
            split_by_conjunction: 接続詞で発言を分割するか
        """
        self.domain = domain
        self.min_confidence = min_confidence

        # コンポーネント初期化
        self.parser = InterviewParser()
        self.splitter = UtteranceSplitter(
            split_by_sentence=split_by_sentence,
            split_by_conjunction=split_by_conjunction,
        )
        self.classifier = PIVOTClassifier(
            domain=domain,
            min_confidence=min_confidence,
            use_morphology=use_morphology,
        )

    def process(
        self,
        text: str,
        observed_at: Optional[str] = None,
    ) -> InsightInterviewResult:
        """
        インタビューテキストを処理

        Args:
            text: インタビューテキスト
            observed_at: 観測日 (ISO-8601)

        Returns:
            InsightInterviewResult: 処理結果
        """
        observed_at = observed_at or datetime.now().strftime("%Y-%m-%d")

        # Step 1: パース
        interview = self.parser.parse(text)

        # Step 2: 発言分割
        utterances = self._extract_utterances(interview)

        # Step 3: PIVOT分類
        classification = self.classifier.classify(utterances)

        return InsightInterviewResult(
            interview=interview,
            utterances=utterances,
            classification=classification,
        )

    def process_qa(
        self,
        question: str,
        answer: str,
        speaker_id: Optional[str] = None,
        speaker_role: Optional[str] = None,
        interview_id: Optional[str] = None,
        question_no: int = 1,
    ) -> PIVOTClassificationResult:
        """
        単一のQ&Aを処理

        Args:
            question: 質問文
            answer: 回答文
            speaker_id: 発言者ID
            speaker_role: 発言者役職
            interview_id: インタビューID
            question_no: 質問番号

        Returns:
            PIVOTClassificationResult: 分類結果
        """
        utterances = self.splitter.split(
            answer,
            speaker_id=speaker_id,
            speaker_role=speaker_role,
            question_no=question_no,
            question_text=question,
            interview_id=interview_id,
        )

        return self.classifier.classify(utterances)

    def process_texts(
        self,
        texts: List[str],
        speaker_id: Optional[str] = None,
    ) -> PIVOTClassificationResult:
        """
        テキストリストを処理

        Args:
            texts: テキストリスト
            speaker_id: 発言者ID

        Returns:
            PIVOTClassificationResult: 分類結果
        """
        utterances = []
        for i, text in enumerate(texts):
            utts = self.splitter.split(
                text,
                speaker_id=speaker_id,
                base_line_no=i,
            )
            utterances.extend(utts)

        return self.classifier.classify(utterances)

    def _extract_utterances(
        self,
        interview: ParsedInterview,
    ) -> List[Utterance]:
        """インタビューから発話を抽出"""
        utterances = []

        metadata = interview.metadata

        for qa in interview.qa_sections:
            utts = self.splitter.split(
                qa.answer,
                speaker_id=metadata.respondent,
                speaker_role=metadata.role,
                question_no=qa.question_no,
                question_text=qa.question,
                interview_id=metadata.interview_id,
                base_line_no=qa.line_no,
            )
            utterances.extend(utts)

        return utterances

    def save_marts(
        self,
        result: InsightInterviewResult,
        output_path: str,
        observed_at: Optional[str] = None,
    ) -> None:
        """
        マートをJSONL形式で保存

        Args:
            result: 処理結果
            output_path: 出力パス
            observed_at: 観測日
        """
        observed_at = observed_at or datetime.now().strftime("%Y-%m-%d")
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        with open(path, "w", encoding="utf-8") as f:
            for item in result.items:
                mart = generate_pivot_insight_mart(item, observed_at)
                f.write(json.dumps(mart, ensure_ascii=False) + "\n")

    def save_summary_mart(
        self,
        result: InsightInterviewResult,
        output_path: str,
        period_start: str,
        period_end: str,
        period_type: str = "daily",
    ) -> None:
        """
        サマリーマートを保存

        Args:
            result: 処理結果
            output_path: 出力パス
            period_start: 期間開始日
            period_end: 期間終了日
            period_type: 期間タイプ
        """
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        summary = generate_pivot_summary_mart(
            result.classification,
            period_start,
            period_end,
            period_type,
        )

        with open(path, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

    def iter_marts(
        self,
        result: InsightInterviewResult,
        observed_at: Optional[str] = None,
    ) -> Iterator[Dict]:
        """
        マートをイテレート

        Args:
            result: 処理結果
            observed_at: 観測日

        Yields:
            Dict: マートアイテム
        """
        observed_at = observed_at or datetime.now().strftime("%Y-%m-%d")

        for item in result.items:
            yield generate_pivot_insight_mart(item, observed_at)


# ========================================
# 便利関数
# ========================================

def analyze_interview(
    text: str,
    domain: Optional[str] = None,
) -> InsightInterviewResult:
    """
    シンプルなインターフェース

    Args:
        text: インタビューテキスト
        domain: 業務ドメイン

    Returns:
        InsightInterviewResult: 処理結果

    Example:
        result = analyze_interview('''
        # インタビュー: 現場責任者ヒアリング

        ## メタデータ
        - respondent: 田中太郎
        - role: 施工管理
        - date: 2025-02-05

        ## Q&A
        ### Q1. 工程管理で困っていることは？
        工程管理をExcelでやっているが更新が追いつかない。
        担当者が辞めたら引継ぎできるか心配です。
        ''')

        for item in result.items:
            print(f"{item.pivot_voice}: {item.title}")
    """
    engine = InsightInterviewEngine(domain=domain)
    return engine.process(text)


def analyze_texts(
    texts: List[str],
    domain: Optional[str] = None,
) -> PIVOTClassificationResult:
    """
    テキストリストを分析

    Args:
        texts: テキストリスト
        domain: 業務ドメイン

    Returns:
        PIVOTClassificationResult: 分類結果

    Example:
        result = analyze_texts([
            "工程管理が非常に遅くて困っている",
            "担当者が辞めたら引継ぎできるか心配",
            "ガントチャート機能があれば効率化できる",
        ], domain="biz_analysis")

        print(f"Pain: {len(result.by_pivot['P'])}件")
        print(f"総合スコア: {result.total_score}")
    """
    engine = InsightInterviewEngine(domain=domain)
    return engine.process_texts(texts)


def get_priority_insights(
    result: InsightInterviewResult,
    top_n: int = 10,
) -> List[PIVOTInsight]:
    """
    優先度の高いインサイトを取得

    Args:
        result: 処理結果
        top_n: 取得件数

    Returns:
        List[PIVOTInsight]: 優先度順のインサイト

    Note:
        優先度は |intensity_score| の大きさで判定
    """
    return sorted(
        result.items,
        key=lambda x: abs(x.intensity_score),
        reverse=True,
    )[:top_n]


def get_urgent_items(
    result: InsightInterviewResult,
) -> List[PIVOTInsight]:
    """
    緊急対応が必要なインサイトを取得
    (Pain × Insecurity が重なる項目)

    Args:
        result: 処理結果

    Returns:
        List[PIVOTInsight]: 緊急対応項目
    """
    pain_items = result.by_pivot.get("P", [])
    insecurity_items = result.by_pivot.get("I", [])

    # 同じプロセスに対してP×Iがある項目を抽出
    pain_processes = {
        item.target_layers.get("process")
        for item in pain_items
        if item.target_layers.get("process")
    }
    insecurity_processes = {
        item.target_layers.get("process")
        for item in insecurity_items
        if item.target_layers.get("process")
    }

    urgent_processes = pain_processes & insecurity_processes

    return [
        item for item in result.items
        if item.target_layers.get("process") in urgent_processes
    ]
