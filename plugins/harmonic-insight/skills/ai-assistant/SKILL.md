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
| モデル選択 | ティアで自動決定（ユーザーは選べない） |
| Standard ティア | Claude Sonnet |
| Premium ティア | Claude Opus |
| ライセンス制御 | STD: 月50回 / PRO: 月200回 / ENT: 無制限 |

## ペルソナシステム（3 キャラクター）

| ID | 日本語名 | モデル | 用途 |
|----|---------|--------|------|
| `shunsuke` | Claude 俊 | Haiku | 素早い確認・軽い修正 |
| `megumi` | Claude 恵 | Sonnet | 万能バランス型 |
| `manabu` | Claude 学 | Opus | 深い思考・精密文書 |

## モデルティア制御

```typescript
import { getModelForTier, canUseAiAssistant } from '@/insight-common/config/ai-assistant';

// ライセンスチェック
canUseAiAssistant('PRO');  // true
canUseAiAssistant('STD');  // true（月50回制限）

// モデル決定
const model = getModelForTier(balance.effectiveModelTier);
// Standard → 'claude-sonnet-4-20250514'
// Premium  → 'claude-opus-4-6-20260131'
```

## クレジットプール

- `ai_assistant` + `ai_editor` で**共有プール**
- 追加パック: Standard 200回 / Premium 200回（価格はパートナーと協議の上決定）
- Standard クレジットを先に消費、次に Premium

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
