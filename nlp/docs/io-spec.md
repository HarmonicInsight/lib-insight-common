# Input/Output 仕様書

## 概要

日本語ビジネス文脈分析モジュールの入出力フォーマット仕様。

---

## 入力 (Input)

### 単一メッセージ分析

```typescript
interface AnalysisInput {
  id: string;           // 必須: 一意識別子
  text: string;         // 必須: 分析対象テキスト
  timestamp?: string;   // 任意: ISO 8601形式
  speakerId?: string;   // 任意: 発言者ID
  metadata?: object;    // 任意: 追加情報
}
```

**例:**
```json
{
  "id": "msg-001",
  "text": "システムが動かなくなってしまいました。至急対応お願いします。",
  "timestamp": "2026-01-12T10:30:00Z",
  "speakerId": "user-123"
}
```

### バッチ分析

```typescript
interface BatchAnalysisInput {
  messages: AnalysisInput[];
  options?: AnalysisOptions;
}
```

**例:**
```json
{
  "messages": [
    { "id": "1", "text": "対応ありがとうございます" },
    { "id": "2", "text": "まだ動かないんですが..." },
    { "id": "3", "text": "至急確認してください！" }
  ],
  "options": {
    "emotion": true,
    "urgency": true,
    "politeness": true
  }
}
```

---

## 出力 (Output)

### 単一メッセージ分析結果

```json
{
  "id": "msg-001",
  "text": "システムが動かなくなってしまいました。至急対応お願いします。",
  "signals": {
    "emotion": {
      "primary": "frustration",
      "intensity": 0.7,
      "valence": -0.5,
      "detectedWords": [
        { "word": "動かなくなって", "position": 5, "category": "frustration", "weight": 0.8 }
      ]
    },
    "urgency": {
      "level": "high",
      "score": 0.9,
      "triggers": [
        { "word": "至急", "position": 22, "category": "high", "weight": 1.0 }
      ]
    },
    "certainty": {
      "level": "definite",
      "score": 0.9,
      "endingPatterns": [
        { "pattern": "てしまいました", "impact": 0.9, "nuance": "regret" }
      ]
    }
  },
  "tokens": [
    { "surface": "システム", "pos": "名詞", "posDetail": "一般", "baseForm": "システム" },
    { "surface": "動か", "pos": "動詞", "posDetail": "自立", "baseForm": "動く", "verbType": "action" }
  ],
  "score": {
    "priority": 85,
    "negativity": 0.65,
    "actionRequired": 0.9
  },
  "recommendation": {
    "action": "immediate_response",
    "reason": "緊急度: high + 感情: frustration",
    "suggestedTags": ["緊急", "障害", "要対応"]
  },
  "meta": {
    "version": "1.0.0",
    "processingTimeMs": 45,
    "dictionaryVersion": "1.0.0",
    "analyzedAt": "2026-01-12T10:30:05Z"
  }
}
```

### バッチ分析結果

```json
{
  "results": [
    { /* AnalysisOutput */ },
    { /* AnalysisOutput */ }
  ],
  "summary": {
    "totalMessages": 3,
    "emotionDistribution": {
      "gratitude": 1,
      "frustration": 1,
      "anger": 1
    },
    "urgencyDistribution": {
      "none": 1,
      "medium": 1,
      "high": 1
    },
    "averageNegativity": 0.45,
    "actionRequiredCount": 2
  }
}
```

---

## スコアリングロジック

### 優先度スコア (priority: 0-100)

```
priority = (urgency.score * 50) + (emotion.negativity * 30) + (certainty.score * 20)
```

| 範囲 | 意味 |
|------|------|
| 80-100 | 即時対応 🔴 |
| 60-79 | 高優先 🟠 |
| 40-59 | 中優先 🟡 |
| 0-39 | 低優先 🟢 |

### ネガティブ度 (negativity: 0.0-1.0)

```
negativity = average(detectedEmotions.map(e => e.valence * -1))
```

### アクション必要度 (actionRequired: 0.0-1.0)

```
actionRequired = max(urgency.score, negativity * 0.8)
```

---

## 推奨アクション判定ロジック

| 条件 | 推奨アクション |
|------|---------------|
| urgency.level == "critical" | immediate_response |
| urgency.level == "high" && emotion.primary in ["anger", "frustration"] | escalate |
| urgency.level == "high" | schedule |
| emotion.primary == "request" | schedule |
| emotion.primary in ["gratitude", "satisfaction"] | acknowledge |
| else | monitor |

---

## エラーレスポンス

```json
{
  "error": {
    "code": "TOKENIZE_FAILED",
    "message": "形態素解析に失敗しました",
    "details": {
      "input": "...",
      "cause": "kuromoji initialization error"
    }
  }
}
```

| コード | 意味 |
|--------|------|
| TOKENIZE_FAILED | 形態素解析エラー |
| INVALID_INPUT | 入力フォーマット不正 |
| DICTIONARY_NOT_FOUND | 辞書ファイル未発見 |
