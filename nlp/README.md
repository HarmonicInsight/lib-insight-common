# HARMONIC insight NLP - 日本語ビジネス文脈分析

> Japanese Business Context Analyzer (JBCA)

## 概要

日本語テキストから感情・緊急度・確信度を抽出し、ビジネス文脈での優先度判定を支援するルールベース分析モジュール。

```
┌─────────────────────────────────────────────────────────────┐
│                    分析パイプライン                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [入力JSON] → [形態素解析] → [シグナル抽出] → [出力JSON]     │
│                    ↓                                        │
│              ┌─────────────┐                                │
│              │  kuromoji   │                                │
│              └─────────────┘                                │
│                    ↓                                        │
│         ┌─────────────────────┐                            │
│         │ 辞書マッチング        │                            │
│         │ - 感情辞書           │                            │
│         │ - 緊急度辞書         │                            │
│         │ - 語尾パターン        │                            │
│         │ - 敬語崩れ検出        │                            │
│         └─────────────────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## インストール

```bash
# insight-commonをサブモジュールとして追加済みの場合
npm install kuromoji
```

## 使用方法

```typescript
import { analyzeContext } from '@/insight-common/nlp';

const input = {
  id: "msg-001",
  text: "システムが動かなくなってしまいました。至急対応お願いします。",
  timestamp: "2026-01-12T10:30:00Z"
};

const result = await analyzeContext(input);
// → 出力JSONにシグナル情報が付与される
```

## ディレクトリ構成

```
nlp/
├── index.ts                 # エントリーポイント
├── analyzer.ts              # メイン分析ロジック
├── tokenizer.ts             # kuromoji ラッパー
├── signals/
│   ├── emotion.ts           # 感情シグナル抽出
│   ├── urgency.ts           # 緊急度シグナル抽出
│   ├── certainty.ts         # 確信度シグナル抽出
│   └── politeness.ts        # 敬語・丁寧度分析
├── dictionaries/
│   ├── emotion-words.json   # 感情辞書
│   ├── urgency-words.json   # 緊急度辞書
│   ├── endings.json         # 語尾パターン
│   └── politeness.json      # 敬語パターン
└── types.ts                 # 型定義
```

## ドキュメント

- [Input/Output仕様](./docs/io-spec.md)
- [辞書フォーマット](./docs/dictionary-format.md)
- [活用例](./docs/examples.md)
