---
name: ai-assistant
description: Insight Business Suite AI アシスタント実装標準。Claude API 統合、ペルソナシステム、モデルティア制御、クレジット管理、Tool Use の実装時に自動適用。
allowed-tools: Read, Grep, Glob
---

# AI アシスタント実装標準

対象製品: INSS / IOSH / IOSD / INPY / INBT（全 Insight Business Suite 系）

## 絶対ルール

| 項目 | 仕様 |
|------|------|
| AI プロバイダー | **Claude (Anthropic) API のみ** — OpenAI / Azure 禁止 |
| モデル選択 | クライアント選択（BYOK）— ユーザーが全モデルから自由に選択 |
| モデルティア制限 | なし（BYOK のため全モデル利用可能） |
| ライセンス制御 | 全プラン無制限（BYOK — ユーザー自身の API キーで利用） |

## ペルソナシステム（3 キャラクター）

| ID | 日本語名 | モデル | 用途 |
|----|---------|--------|------|
| `shunsuke` | Claude 俊 | Haiku | 素早い確認・軽い修正 |
| `megumi` | Claude 恵 | Sonnet | 万能バランス型 |
| `manabu` | Claude 学 | Opus | 深い思考・精密文書 |

## モデル選択（BYOK）

```typescript
import { resolveModel, canUseAiAssistant } from '@/insight-common/config/ai-assistant';

// ライセンスチェック
canUseAiAssistant('PRO');  // true
canUseAiAssistant('STD');  // true（BYOK・無制限）

// モデル決定（ユーザー選択を考慮）
const model = resolveModel('standard', userPreference);
// ユーザーが自由に選択可能（ティア制限なし）
```

## クレジット管理

- BYOK モードのため月間クレジット制限なし（全プラン無制限）
- 使用量トラッキングは監査・分析用に維持

## Tool Use（IOSH スプレッドシート操作）

AI がセル値の読み書き、数式設定、書式変更を直接操作。`SPREADSHEET_TOOLS` を参照。

## 禁止事項

- OpenAI / Azure AI の使用
- ユーザーにモデル選択 UI を提供
- ライセンスチェックの省略
- API キーのハードコード

## 詳細リファレンス

- `insight-common/standards/AI_ASSISTANT.md` — 完全な仕様書
- `insight-common/config/ai-assistant.ts` — 実装コード
- `insight-common/config/ai-assistant-skills.ts` — スキル定義
- `insight-common/config/usage-based-licensing.ts` — クレジット管理
