# HARMONIC insight 製品別ライセンス体系 2026

> **作成日**: 2026年2月26日
> **実装**: cross-lib-insight-common
> **関連**: pricing-licensing-strategy-2026.md

---

## 基本方針

```
1. B2B専業（個人向け販売は行わない）
2. 全デスクトップ製品は PC端末ライセンス（1ライセンス = 1PC）
3. InterviewInsight（SaaS）のみユーザーベースライセンス
4. AI は全プラン BYOK（ユーザーが自身の Claude API キーを持ち込む。制限なし）
5. TRIAL = BIZ 同等（自社が無料で配布・無期限）。実質3プラン体系
6. FREE = 全機能利用可能、ただし保存・エクスポート不可
```

---

## プラン共通仕様

### 実質3プラン体系（TRIAL = BIZ）

| プラン | 説明 | ライセンス | 有効期限 | AI利用 |
|--------|------|-----------|----------|--------|
| **FREE** | 全機能利用可能。**保存・エクスポート不可** | 不要 | 無期限 | BYOK（制限なし） |
| **TRIAL** | **= BIZ と同等**。自社が無料で配布 | **自社発行** | **無期限** | BYOK（制限なし） |
| **BIZ** | 全機能 + 保存・エクスポート可能 | 購入 | 365日 | BYOK（制限なし） |
| **ENT** | BIZ + カスタマイズ（SSO・監査・API等） | 契約 | **個別見積もり** | BYOK（制限なし） |

> **TRIAL = BIZ**: 機能は同一。TRIAL は自社が無料配布する BIZ 相当のライセンス。
> **AI = 全プラン BYOK**: ユーザーが自身の Claude API キーを持ち込む。モデル制限・回数制限なし。

### プラン構造の設計思想

```
FREE（全機能利用可能・保存不可）
  ↓ 「保存したい」→ 営業/Webから TRIAL（= BIZ）を配布
TRIAL / BIZ（全機能 + 保存・エクスポート可能）
  ↓ 「企業管理が必要」→ ENT 契約
ENT（BIZ + カスタマイズ）
```

### BIZ と ENT の根本的な違い

```
BIZ = 全機能利用可能（保存・エクスポート可能）
  → データ収集・コラボレーション含む。
  → ライセンスは1PC単位で購入。

ENT = BIZ + カスタマイズ（企業管理機能）
  → SSO/SAML、監査ログ、API連携、複数PC一括管理。
  → Orchestrator（INBT）、優先サポート、SLA。
  → ライセンスは複数PC一括契約。
```

---

## FREEモードの設計

### 方針: 全機能開放、保存・エクスポート不可

```
FREE = 全機能を制限なく使える。AI も BYOK で無制限。
ただし保存（ファイル保存）とエクスポート（PDF等の出力）ができない。

FREE があることで:
  1. ダウンロード → すぐ全機能を使える（営業への問い合わせ不要）
  2. AI を含む全機能で製品の価値を体感
  3. 「成果物を保存したい」→ BIZ 購入 or TRIAL（無料配布）を取得
  4. 損失回避バイアスが発動: 作り込んだ成果物を失いたくない → 課金

設計上の注意:
  - 初回起動時に「FREE では保存できません」を明確に表示すること
  - アプリ起動中はメモリ上でデータを保持（閉じたら消える）
  - スクリーンショットやコピペでの回避は許容（編集不可の断片に価値はない）
```

### 全製品共通のFREE制限

| 制限 | 内容 |
|------|------|
| **保存不可** | プロジェクトファイル（.inss/.iosh/.iosd）への保存ができない |
| **エクスポート不可** | PDF、Office形式（.xlsx/.pptx/.docx）へのエクスポートができない |
| **それ以外** | **全機能利用可能**（AI含む。BYOK で制限なし） |

---

## AI 方針: 全プラン BYOK（Bring Your Own Key）

```
全プラン共通:
  - ユーザーが自身の Claude API キーを持ち込む
  - モデル制限なし（Haiku / Sonnet / Opus すべて利用可能）
  - 回数制限なし
  - HARMONIC insight 側の AI コスト負担 = ゼロ
  - HARMONIC insight の役割 = 最大限効率化できる仕組みを作ること
```


---

## 全製品一覧

| コード | 製品名 | Tier | 種別 | ライセンス単位 | プラン体系 |
|--------|--------|------|------|---------------|-----------|
| INCA | InsightNoCodeAnalyzer | 1 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| INBT | InsightBot | 1 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| IVIN | InterviewInsight | 1 | **SaaS** | **ユーザー数** | FREE / TRIAL / BIZ / ENT |
| INMV | Insight Training Studio | 2 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| INIG | InsightImageGen | 2 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| INSS | InsightSlide | 3 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| IOSH | InsightSheet | 3 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| IOSD | InsightDoc | 3 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| INPY | InsightPy | 3 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |
| ISOF | InsightSeniorOffice | 4 | デスクトップ | PC端末 | FREE / TRIAL / BIZ / ENT |

> 全製品が統一された4プラン体系（例外なし）

---

## Tier 1: 業務変革ツール

> RPA・マイグレーション・業務調査の自動化。コンサルティング業務の上流〜デリバリーを変革する。

| 製品 | AI機能 | BIZ で使える機能 | ENT で追加される機能（カスタマイズ） |
|------|--------|-----------------|---------------------|
| **INCA** InsightNoCodeAnalyzer | BYOK（制限なし） | 全分析・レポート・変換機能 | akaBot変換 + API連携 |
| **INBT** InsightBot | BYOK（制限なし） | Bot作成・実行・AIコードエディター | Orchestrator・Agent管理・スケジューラー |
| **IVIN** InterviewInsight | BYOK（制限なし） | 下記参照 | 下記参照 |

### IVIN（InterviewInsight）詳細 — SaaS製品

> 唯一のSaaS製品。Web + Tauri デスクトップクライアント。ユーザー数ベースの月額課金。

| 項目 | FREE | BIZ | ENT |
|------|------|-----|-----|
| インタビュー | 全機能（保存不可） | 月50件 | 無制限 |
| VRMアバター | ○（保存不可） | 5体 | 全30体 + カスタム |
| AI分析 | BYOK（全モデル） | BYOK（全モデル） | BYOK（全モデル） |
| ユーザー数（法人内） | — | 1 | 個別見積もり |
| 感情分析 | ○（保存不可） | ○ | ○ |
| Webhook連携 | — | — | ○（カスタマイズ） |
| Interview Mart | — | — | ○（カスタマイズ） |
| SSO/SAML | — | — | ○（カスタマイズ） |
| GDPR準拠 | — | — | ○（カスタマイズ） |
| SLA | — | — | 99.9% |
| **月額** | **¥0** | **個別見積もり** | **個別見積もり** |

---

## Tier 2: AI活用ツール

> AIによるコンテンツ生成。動画・画像を大量に自動作成する。

| 製品 | AI機能 | BIZ で使える機能 | ENT で追加される機能（カスタマイズ） |
|------|--------|-----------------|---------------------|
| **INMV** Insight Training Studio | —（VoiceVox + FFmpeg = ローカル処理） | 全テンプレート・字幕・トランジション・PPTX取込・4K出力 | カスタムテンプレート・API連携・複数PC管理 |
| **INIG** InsightImageGen | —（Stable Diffusion = ローカル処理） | 高解像度出力・キャラプロンプト無制限 | クラウド同期・API連携 |

### INMV（Insight Training Studio）詳細 — PC端末ライセンス・年額

> 動画作成ツール。VoiceVox（無料TTS）+ FFmpeg（無料エンコード）で限界費用ほぼゼロ。

| 項目 | FREE | BIZ | ENT |
|------|------|-----|-----|
| 月間動画本数 | 3本 | 無制限 | 無制限 |
| 最大動画長 | 3分 | 無制限 | 無制限 |
| 透かし | あり | なし | なし |
| 全テンプレート | 3種のみ | ○ | ○ |
| YouTube最適化出力 | — | ○ | ○ |
| 多言語対応 | — | ○ | ○ |
| バッチ制作 | — | ○ | ○ |
| 字幕・トランジション | — | ○ | ○ |
| PPTX取込 | — | ○ | ○ |
| 4K出力 | — | ○ | ○ |
| カスタムテンプレート | — | — | ○ |
| API連携 | — | — | ○ |
| **年額/PC** | **¥0** | **個別見積もり** | **個別見積もり** |

> ENTは個別見積もり。ボリュームディスカウント等は営業にて個別対応。

---

## Tier 3: Insight Business Suite

> 既存の Office ファイル（Excel / PowerPoint / Word）にAIアシスタント・バージョン管理・コラボレーションを追加する。
> 共通基盤: cross-lib-insight-common（ライセンス / i18n / AIクライアント / エラー定義）

| 製品 | AI | BIZ で使える機能 | ENT で追加される機能（カスタマイズ） |
|------|-----|-----------------|---------------------|
| **INSS** InsightSlide | BYOK（制限なし） | 全機能（スライドマスター・切替効果・アニメーション・データ収集・コラボレーション含む） | SSO・監査ログ・API連携 |
| **IOSH** InsightSheet | BYOK（制限なし） | 全機能（条件付き書式・ピボット・データ収集・コラボレーション含む） | SSO・監査ログ・API連携 |
| **IOSD** InsightDoc | BYOK（制限なし） | 全機能（目次生成・変更履歴・差し込み印刷・データ収集・コラボレーション含む） | SSO・監査ログ・API連携 |
| **INPY** InsightPy | BYOK（制限なし） | 全機能（スクリプト保存無制限・データ収集・コラボレーション含む） | クラウド同期・SSO・API連携 |

### Insight Business Suite 価格表（PC端末ライセンス）

#### 単品

| 製品 | BIZ（年額/PC） | ENT |
|------|---------------|-----|
| **IOSH** InsightSheet | 個別見積もり | 個別見積もり |
| **INSS** InsightSlide | Suite専売 | Suite専売 |
| **IOSD** InsightDoc | Suite専売 | Suite専売 |
| **INPY** InsightPy | 検討中 | 検討中 |

> InsightSlide と InsightDoc は Suite バンドルの一部としてのみ提供。

#### Suite バンドル

| バンドル | BIZ | ENT | 内容 |
|---------|-----|-----|------|
| **Suite BIZ** | 個別見積もり | — | IOSH BIZ + INSS BIZ + IOSD BIZ |
| **Suite ENT** | — | **個別見積もり** | IOSH ENT + INSS ENT + IOSD ENT |

---

## Tier 4: InsightSeniorOffice

> 介護施設・自治体・シニア教育機関向け。80代以上でも迷わず使えるオフィスアプリ。Microsoft Office ライセンス不要。

| 製品 | AI | BIZ で使える機能 | ENT で追加される機能（カスタマイズ） |
|------|-----|-----------------|---------------------|
| **ISOF** InsightSeniorOffice | BYOK（制限なし） | 全機能（文書・表計算・メール・AI） | 複数PC一括管理・リモート設定・優先サポート |

> ISOF は全製品と同じ FREE / TRIAL / BIZ / ENT 体系（例外なし）

---

## 全製品共通機能（FREE / BIZ / ENT）

| 機能 | FREE | BIZ | ENT |
|------|------|-----|-----|
| 全製品機能 | ○ | ○ | ○ |
| AI利用（BYOK・制限なし） | ○ | ○ | ○ |
| データ収集 | ○（保存不可） | ○ | ○ |
| コラボレーション | ○（保存不可） | ○ | ○ |
| 保存・エクスポート | **不可** | ○ | ○ |
| API連携 | — | — | ○（カスタマイズ） |
| シングルサインオン | — | — | ○（カスタマイズ） |
| 監査ログ | — | — | ○（カスタマイズ） |
| 優先サポート | — | — | ○（カスタマイズ） |
| 複数PC一括管理 | — | — | ○（カスタマイズ） |

---

## 全製品価格クイックリファレンス

### デスクトップ製品（PC端末ライセンス）

| Tier | 製品 | BIZ | ENT | 課金モデル |
|------|------|-----|-----|-----------|
| 1 | INCA | 検討中 | 個別見積もり | 年額/PC |
| 1 | INBT | 検討中 | 個別見積もり | 年額/PC |
| 2 | INMV (Insight Training Studio) | 個別見積もり | 個別見積もり | **年額/PC** |
| 2 | INIG | 検討中 | 個別見積もり | 年額/PC |
| 3 | IOSH | 個別見積もり | 個別見積もり | **年額/PC** |
| 3 | INSS | Suite専売 | Suite専売 | **年額/PC** |
| 3 | IOSD | Suite専売 | Suite専売 | **年額/PC** |
| 3 | INPY | 検討中 | 個別見積もり | 年額/PC |
| 4 | ISOF | 検討中 | 個別見積もり | 年額/PC |

### SaaS製品（ユーザーベースライセンス）

| Tier | 製品 | BIZ（月額） | ENT |
|------|------|-----------|-----|
| 1 | IVIN | 個別見積もり | 個別見積もり |

### Suite バンドル（PC端末ライセンス）

| バンドル | BIZ（年額/PC） | ENT |
|---------|---------------|-----|
| Insight Business Suite | 個別見積もり | 個別見積もり |

---

## ライセンスキー形式

```
{製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}

プランコード:
  FREE → ライセンスキー不要（キー未入力 = FREE）
  TRL  → TRIAL
  BIZ  → Business
  ENT  → Enterprise

例:
  IOSH-BIZ-2603-A1B2-C3D4-E5F6    ← InsightSheet Business 2026年3月
  INSS-ENT-2607-F7G8-H9I0-J1K2    ← InsightSlide Enterprise 2026年7月
  INMV-BIZ-2604-L3M4-N5O6-P7Q8    ← Insight Training Studio Business 2026年4月
  ISOF-ENT-2605-R9S0-T1U2-V3W4    ← InsightSeniorOffice Enterprise 2026年5月

TRIAL:
  IOSH-TRL-2603-X5Y6-Z7A8-B9C0    ← InsightSheet Trial 2026年3月
```

---

## 実装ノート（cross-lib-insight-common）

```
ライセンス判定フロー:

  1. ライセンスキーの有無を確認
     - キーなし → FREE モード（全機能有効、保存・エクスポート不可）
     - キーあり → 以下のフローへ
  2. ライセンスキーの検証（形式 + 署名）
  3. 製品コードの一致確認
  4. プラン判定 → 機能フラグの適用
     - TRL → BIZ 同等（全機能有効、保存・エクスポート可能）
     - BIZ → 全機能有効、保存・エクスポート可能
     - ENT → 全機能有効 + カスタマイズ機能（SSO・監査・API等）
  5. 有効期限チェック
     - TRIAL: 無期限（= BIZ 同等の無料配布）
     - BIZ: アクティベーションから365日（年額更新）
     - ENT: 契約期間に基づく
  6. AI: 全プラン BYOK（クエリカウンター不要）
  7. 有効期限切れ → FREE モードへの自動降格（保存不可に戻る）
```

---

> **本文書の位置づけ:**
> 全10製品のライセンス体系を統一的に定義する。
> 価格の詳細根拠は pricing-licensing-strategy-2026.md を参照。
> 実装は cross-lib-insight-common で一元管理。
