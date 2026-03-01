# HARMONIC insight 統一価格リファレンス 2026
## ── 全文書の矛盾を解消した最終版 ──

> **作成日**: 2026年2月28日
> **位置づけ**: 価格・プランに関する **唯一の正** (Single Source of Truth)
> **解消対象**: pricing-licensing-strategy-2026.md / license-structure-2026.md / comprehensive-strategy-2026-spring.md / target-market-swot-pricing-2026.md / global-strategy-2026.md 間の矛盾
> **原則**: 実装仕様 (license-structure-2026.md) と戦略方針 (comprehensive/target-market) を統合
> **⚠️ BIZ/ENT価格**: 全製品 **個別見積もり**（2026年3月1日確定）

---

## 1. 統一プラン体系

### 正式プラン名: FREE / TRIAL / BIZ / ENT

| プラン | 説明 | ライセンス | 有効期限 | AI利用 |
|--------|------|-----------|----------|--------|
| **FREE** | 基本機能のみ。ライセンス不要 | 不要 | 無期限 | なし |
| **TRIAL** | 全機能無制限（評価用）。自社発行 | 自社発行 | 1か月間 | Premium含む全機能無制限 |
| **BIZ** | 法人1端末。全機能 + AI（Standardティア） | 購入 | 365日 | 月200回（Haiku/Sonnet）※超過時は顧客自身でAPI購入 |
| **ENT** | 法人複数端末。全機能 + コラボレーション + AI（Premiumティア） | 契約 | **個別見積もり** | 無制限（Opus含む） |

> **廃止されたプラン名**: Personal / Standard / Professional / Enterprise / Starter / Business / Creator
> これらは旧文書で使用されていた名称。今後は FREE / TRIAL / BIZ / ENT に統一する。

### 旧プラン名 → 新プラン名の対照表

| 旧名称 | 新名称 | 備考 |
|--------|--------|------|
| Free | FREE | 同一 |
| Personal（買い切り） | **廃止** | BIZ に統合 |
| Standard（買い切り） | **廃止** | BIZ に統合 |
| Professional（年額） | **BIZ** | 年額PC端末ライセンス |
| Enterprise（年額/PC） | **ENT** | **個別見積もり** に変更 |
| Starter（InterviewInsight） | **BIZ** | InterviewInsightのBIZ |
| Business（InterviewInsight） | **廃止** | BIZ と ENT の2段階に簡素化 |
| Creator（InsightCast） | **廃止** | BIZ に統合 |

---

## 2. 製品名の統一

| コード | 正式名称 | 旧名称・別名（廃止） | 種別 |
|--------|---------|---------------------|------|
| IOSH | InsightSheet | InsightSheet | デスクトップ |
| INSS | InsightSlide | — | デスクトップ |
| IOSD | InsightDoc | InsightDoc | デスクトップ |
| INMV | **InsightCast** | InsightMovie ※コード上はINMVだが製品名はInsightCast | デスクトップ |
| IVIN | InterviewInsight | — | SaaS |

> **注**: InsightCastの内部コードはINMV（InsightMovie）だが、外部マーケティングでは「InsightCast」を使用。

---

## 3. 統一価格表（税抜）

### 3.1 Insight Business Suite（PC端末ライセンス）

#### 単品

| 製品 | FREE | BIZ（年額/PC） | ENT |
|------|------|---------------|-----|
| **InsightSheet** | ¥0 | **個別見積もり** | **個別見積もり** |
| **InsightSlide** | ¥0 | — (Suite専売) | — (Suite専売) |
| **InsightDoc** | — | — (Suite専売) | — (Suite専売) |

> **重要な決定**: InsightSlide と InsightDoc は **単体販売しない**。Suite バンドルの一部としてのみ提供。
> 理由: InsightDoc の差別化が弱く単体では売れない。Suite として「3製品セット」のインパクトを出す。

#### Suite バンドル（Sheet + Slide + Doc）

| プラン | 価格 |
|--------|------|
| **Suite BIZ** | **個別見積もり** |
| **Suite ENT** | **個別見積もり** |

#### InsightSheet FREE版の機能

| 機能 | FREE | BIZ | ENT |
|------|------|-----|-----|
| Excel読込・編集・保存 | ✅ | ✅ | ✅ |
| バージョン管理（履歴保存・復元） | ✅ | ✅ | ✅ |
| 差分比較 | ✅（3件まで） | ✅ | ✅ |
| AI Chat（Claude対話） | ❌ | ✅ | ✅ |
| AI Tool Use（セル直接操作） | ❌ | ✅ | ✅ |
| RPA Agent | ❌ | ❌ | ✅ |
| データ収集クライアント | ❌ | ❌ | ✅ |
| 掲示板・チームコラボ | ❌ | ❌ | ✅ |

---

### 3.2 InterviewInsight（SaaS・ユーザーベース・月額）

| プラン | 価格 |
|--------|------|
| **FREE** | ¥0（デモ閲覧のみ） |
| **BIZ** | **個別見積もり** |
| **ENT** | **個別見積もり** |

| 項目 | FREE | BIZ | ENT |
|------|------|-----|-----|
| インタビュー | デモ閲覧のみ | 月50件 | 無制限 |
| VRMアバター | — | 5体 | 全30体 + カスタム |
| AI分析 | — | Sonnet | 全モデル（Opus含む） |
| ユーザー数 | — | 1 | 個別見積もり |
| 感情分析 | — | — | ✅ |
| Webhook連携 | — | — | ✅ |
| Interview Mart | — | — | ✅ |
| SSO/SAML | — | — | ✅ |
| GDPR準拠 | — | — | ✅ |
| SLA | — | — | 99.9% |

> **旧3段階（Starter/Business/Enterprise）→ 新2段階（BIZ/ENT）への変更理由:**
> - 全製品で統一された4プラン体系（FREE/TRIAL/BIZ/ENT）を維持するため
> - 1人会社の営業リソースで3段階の説明は複雑すぎる
> - BIZで小規模利用、ENTは個別見積もりで柔軟に対応

---

### 3.3 InsightCast（PC端末ライセンス・年額）

| プラン | 価格 |
|--------|------|
| **FREE** | ¥0（月3本、最大3分/本、透かしあり） |
| **BIZ** | **個別見積もり** |
| **ENT** | **個別見積もり** |

| 項目 | FREE | BIZ | ENT |
|------|------|-----|-----|
| 月間動画本数 | 3本 | 無制限 | 無制限 |
| 最大動画長 | 3分 | 無制限 | 無制限 |
| 透かし | あり | なし | なし |
| テンプレート | 3種 | 全種 | 全種 + カスタム |
| YouTube最適化出力 | — | ✅ | ✅ |
| 多言語対応 | — | ✅ | ✅ |
| バッチ制作 | — | ✅ | ✅ |
| PPTXインポート | — | ✅ | ✅ |
| API連携 | — | — | ✅ |

> **課金モデルの確定: 年額**
> VoiceVox + FFmpegで限界費用がほぼゼロのため、年額でも十分な利益率。

---

### 3.4 全製品バンドル

| バンドル | 価格 |
|---------|------|
| **Suite + Cast BIZ** | **個別見積もり** |
| **Suite + Cast ENT** | **個別見積もり** |

---

## 4. クイックリファレンス（全製品一覧）

### デスクトップ製品（PC端末ライセンス）

| 製品 | FREE | BIZ | ENT | 課金モデル |
|------|------|-----|-----|-----------|
| InsightSheet | ¥0 | 個別見積もり | 個別見積もり | **年額/PC** |
| InsightSlide | ¥0 | Suite専売 | Suite専売 | **年額/PC** |
| InsightDoc | — | Suite専売 | Suite専売 | **年額/PC** |
| InsightCast | ¥0 | 個別見積もり | 個別見積もり | **年額/PC** |

### Suite バンドル（PC端末ライセンス）

| バンドル | BIZ | ENT |
|---------|-----|-----|
| Insight Business Suite | 個別見積もり | 個別見積もり |
| Suite + Cast | 個別見積もり | 個別見積もり |

### SaaS製品（ユーザーベースライセンス）

| 製品 | FREE | BIZ | ENT |
|------|------|-----|-----|
| InterviewInsight | ¥0 | 個別見積もり | 個別見積もり |

---

## 5. 解消された矛盾の記録

| # | 矛盾の内容 | 決定 | 根拠 |
|---|-----------|------|------|
| 1 | **プラン名**: 5段階 vs 4段階 vs 3段階 | **FREE/TRIAL/BIZ/ENTの4段階** | license-structureが実装仕様として確定済み。全製品例外なし |
| 2 | **ENT価格**: 固定価格 vs 個別見積もり | **全製品ENTは個別見積もり** | ユーザー確認済み（2/28） |
| 3 | **InsightSheet最低価格**: 固定価格 vs 個別見積もり | **個別見積もり** | BIZ/ENTともに個別見積もりに統一（3/1確定） |
| 4 | **InsightCast課金モデル**: 月額 vs 年額 | **年額** | 限界費用ゼロ。年額¥9,800のインパクト大 |
| 5 | **InsightCast製品名**: InsightCast vs InsightMovie | **InsightCast**（コードはINMV） | ユーザー確認済み（2/28） |
| 6 | **InterviewInsight段階数**: 3段階 vs 2段階 | **BIZ/ENTの2段階** | 全製品統一。1人会社で3段階は非現実的 |
| 7 | **InterviewInsight BIZ価格**: 固定価格 vs 個別見積もり | **個別見積もり** | BIZ/ENTともに個別見積もりに統一（3/1確定） |
| 8 | **二刀流モデル**: 「隠す」vs「オープン」 | **「オープンな二足のわらじ」** | 隠蔽は現実的に不可能。comprehensiveが最新 |
| 9 | **AIチケット制 vs 内包** | **プラン内包（超過時は顧客がAPI購入）** | 基本利用はプラン内包。追加パックは廃止、顧客が直接API契約 |
| 10 | **InsightCast BIZ内容**: 月15本制限 vs 無制限 | **無制限** | 限界費用ゼロ。制限する理由なし |

---

## 6. パートナーリセラー卸値

| 対象 | 定価比 | 備考 |
|------|--------|------|
| 全製品BIZ/ENT | **個別見積もり** | パートナーと個別調整。目安: 定価の70% |

---

## 7. TODO

- [ ] 早期採用者価格（Phase 1）
- [ ] 2026年収益目標の再計算

---

> **本文書の運用ルール:**
> 1. 価格に関する情報は **本文書のみ** を正とする
> 2. 他文書と矛盾がある場合は本文書が優先
> 3. 価格変更時は本文書を先に更新し、他文書は追従して更新する
> 4. 実装（cross-lib-insight-common）はlicense-structure-2026.mdのプランコード（FREE/TRL/BIZ/ENT）を使用
