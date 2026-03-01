# Harmonic Factory - プラットフォーム標準

> insight-commonを使用するすべてのアプリに適用される技術標準

**凡例**: 🟢 = 標準採用 / ⚪ = 必要時採用 / ❌ = 不採用

---

## 標準技術スタック

```
🟢 標準構成（全案件共通）
├── Vercel（フロントエンド）
├── Render（バックエンド / Python）
├── Firebase Auth（認証）         → insight-common/infrastructure/auth/
├── Firebase Firestore（DB）
├── Firebase Storage（ストレージ）
├── GitHub Actions（CI/CD）
├── Cloudflare（CDN・セキュリティ）
├── Claude API（AI / LLM）
└── JBCA（日本語NLP）             → insight-common/nlp/

⚪ オプション（必要時追加）
├── Supabase（SQL / 業務系のみ）  → insight-common/infrastructure/db/
├── Pinecone（ベクトルDB / AI検索時）
├── Resend（メール送信時）
└── Sentry（本番監視時）
```

---

## 技術選定表

| カテゴリ | 標準ツール | 採用 | insight-common対応 |
|---------|-----------|------|-------------------|
| **フロントエンド** | Vercel + React/Next.js | 🟢 | - |
| **バックエンド** | Render (Python) | 🟢 | - |
| **認証** | Firebase Auth | 🟢 | `infrastructure/auth/` |
| **DB（NoSQL）** | Firebase Firestore | 🟢 | `infrastructure/db/firebase.ts` |
| **DB（SQL）** | Supabase | ⚪ 業務系のみ | `infrastructure/db/supabase.ts` |
| **ベクトルDB** | Pinecone | ⚪ AI連携時 | 要追加 |
| **ストレージ** | Firebase Storage | 🟢 | - |
| **CI/CD** | GitHub Actions | 🟢 | - |
| **CDN / セキュリティ** | Cloudflare | 🟢 | - |
| **メール送信** | Resend | ⚪ 必要時 | 要追加 |
| **監視** | Sentry | ⚪ 本番運用時 | 要追加 |
| **AI（LLM）** | Claude API | 🟢 | - |
| **日本語NLP** | JBCA (kuromoji) | 🟢 | `nlp/` |

---

## アプリ種類別 DB選定

| アプリ種類 | DB選択 | 理由 |
|-----------|--------|------|
| **チャットアプリ** | Firebase 🟢 | リアルタイム同期 |
| **SNS・タイムライン** | Firebase 🟢 | スケーラビリティ |
| **スマホアプリ** | Firebase 🟢 | オフライン対応 |
| **Todoアプリ** | Firebase 🟢 | シンプル |
| **AI/NLPアプリ** | Firebase 🟢 | 柔軟なスキーマ |
| **ECサイト** | Supabase ⚪ | トランザクション |
| **業務システム** | Supabase ⚪ | 複雑なクエリ |
| **CRM・顧客管理** | Supabase ⚪ | リレーション |

---

## 規模別インフラ選定

| 月商 | 構成 | 月額目安 |
|------|------|---------|
| **〜100万円** | Render + Firebase（無料枠） | **0円** 🟢 |
| **100〜1,000万円** | Railway + Firebase/Supabase Pro | **3〜5万円** ⚪ |
| **1,000万円〜** | Cloud Run + Cloud SQL | **10〜30万円** ⚪ |

---

## 不採用ツール

| ツール | 用途 | 代替 |
|--------|------|------|
| Dify | RAG構築 | Claude Code + JBCA |
| n8n | ワークフロー | Claude Code |
| Zapier | 連携 | Claude Code |
| Make | 自動化 | Claude Code |
| Flowise | AIフロー | Claude Code |
| Bubble | アプリ構築 | Claude Code |
| Retool | 管理画面 | Claude Code |

**理由**: ノーコードツールは月額コストがかかり、カスタマイズに限界がある。
Claude Codeで直接構築することで、柔軟性とコスト削減を両立。

---

## AI連携案件のDB選定

| 案件 | ベクトルDB | 補助 |
|------|-----------|------|
| 社内ナレッジ検索 | Pinecone ⚪ | JBCA（品詞フィルタ） |
| カスタマーサポートBot | Pinecone ⚪ | JBCA（感情分析） |
| 議事録検索 | Pinecone ⚪ | JBCA（話者分析） |
| 翻訳・要約 | 不要 | Claude API直接 |
| 感情分析 | 不要 | JBCA（ルールベース） |
| タスク抽出 | 不要 | JBCA（品詞解析） |

---

## insight-common モジュール対応表

| 標準機能 | モジュール | 状態 |
|---------|-----------|------|
| Firebase認証 | `infrastructure/auth/firebase-*.ts` | ✅ 実装済み |
| Supabase接続 | `infrastructure/db/supabase.ts` | ✅ 実装済み |
| APIゲートウェイ | `infrastructure/api/gateway.ts` | ✅ 実装済み |
| 日本語NLP (JBCA) | `nlp/` | ✅ 実装済み |
| ブランドカラー | `brand/colors.json` | ✅ 実装済み |
| Pinecone連携 | - | 📋 要追加 |
| Resendメール | - | 📋 要追加 |
| Sentry監視 | - | 📋 要追加 |

---

## デスクトップアプリ標準

> Web/APIとは別に、Windowsデスクトップアプリ開発の標準を定義

### 開発フェーズ別技術選定

| フェーズ | 技術 | 用途 | 採用 |
|---------|------|------|------|
| **プロトタイプ** | Python + Tkinter | 高速開発、仕様検証 | 🟢 |
| **製品化（軽量）** | Tauri + React | 5MB配布、モダンUI | ⚪ |
| **製品化（Office連携）** | C# + WPF + Open XML SDK | MS公式SDK、堅牢 | ⚪ |
| **ローカルAPI** | Flask | ラズパイ、画像処理サーバー | 🟢 |

### 配布形式比較

| 技術 | 配布サイズ | 起動速度 | 難読化 | Office連携 |
|------|-----------|---------|--------|-----------|
| Python + PyInstaller | 50-80MB | 2-5秒 | 弱 | python-pptx（非公式） |
| Tauri + React | 5-15MB | 0.5秒 | 中 | 要追加実装 |
| C# + WPF | 15-25MB | 0.3秒 | 強（Dotfuscator） | Open XML SDK（公式） |

### 推奨開発フロー

```
1. プロトタイプ（Python + Tkinter）
   ├── 機能検証
   ├── UI/UX確認
   └── ライセンス体系確定

2. 製品化判断
   ├── Office連携が重要 → C# + WPF
   ├── 軽量配布が重要 → Tauri + React
   └── 現状維持 → Python + PyInstaller
```

### 製品別技術選定

| 製品 | 現在 | 移行先（検討中） | 理由 |
|------|------|-----------------|------|
| Insight Deck Quality Gate (INSS) | Python + Tkinter | C# + WPF | PPT完全互換が必要 |
| Insight Performance Management (IOSH) | C# + WPF | C# + WPF 維持 | Excel完全互換が必要 |
| Insight AI Doc Factory (IOSD) | C# + WPF | C# + WPF 維持 | Word完全互換が必要 |
| InsightPy (INPY) | Python + Tkinter | Python維持 | Python実行環境が本質 |
| Insight Training Studio (INMV) | C# + WPF | C# + WPF 維持 | 動画生成・Syncfusion連携 |
| InterviewInsight (IVIN) | Python + Tkinter | C# + WPF | 音声・動画解析連携 |

### Flask の位置づけ

```
Flask = 軽量Webサーバー（デスクトップアプリの補助）

用途例：
├── ラズパイでの画像処理API
├── ローカルでのAI推論サーバー
├── デスクトップアプリのバックエンド
└── Stable Diffusion WebUI連携

※ 本格的なWebアプリは Next.js + Vercel を使用
```

### Tauri の位置づけ

```
Tauri = 軽量デスクトップアプリフレームワーク

メリット:
├── Electron比で1/10のサイズ（5MB vs 50MB）
├── Rust製でメモリ効率が良い
├── React/Vue/Svelteでフロント開発
└── クロスプラットフォーム対応

デメリット:
├── Rust学習コスト
├── Office連携ライブラリが貧弱
└── ネイティブ機能アクセスに制限

採用判断:
├── Office連携不要 + 軽量配布重要 → Tauri検討
└── Office連携必要 → C# + WPF
```

### C# + WPF の位置づけ

```
C# + WPF = Windows向け本格製品開発

メリット:
├── Open XML SDK（MS公式）で完全なOffice互換
├── 10年以上の後方互換保証
├── Visual Studioの強力なデバッグ環境
├── Dotfuscatorで堅牢な難読化
└── 企業向け提案で「MS技術」と言える信頼性

デメリット:
├── Windows専用
├── 学習コスト（3-4週間）
└── 既存Python資産の書き直し

採用判断:
├── PowerPoint/Excel完全互換が必要 → C#
├── 企業向け製品として販売 → C#
├── ライセンス保護が重要 → C#
└── クロスプラットフォーム必要 → 他を検討
```

---

## Harmonic Factoryの強み

```
✅ ノーコードツール不要（Claude Codeで構築）
✅ 顧客規模に合った正直な提案
✅ 成長に合わせた移行サポート
✅ 日本語特化NLP（JBCA）による差別化
✅ 大手が言わない情報を公開
```

---

*Version: 1.0.0*
*Based on: Insightcreative/harmonic-factory-platform.md*
