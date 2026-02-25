# Harmonic Factory - プラチE��フォーム標溁E

> insight-commonを使用するすべてのアプリに適用される技術標溁E

**凡侁E*: 🟢 = 標準採用 / ⚪ = 忁E��時採用 / ❁E= 不採用

---

## 標準技術スタチE��

```
🟢 標準構�E�E��E案件共通！E
├── Vercel�E�フロントエンド！E
├── Render�E�バチE��エンチE/ Python�E�E
├── Firebase Auth�E�認証�E�E         ↁEinsight-common/infrastructure/auth/
├── Firebase Firestore�E�EB�E�E
├── Firebase Storage�E�ストレージ�E�E
├── GitHub Actions�E�EI/CD�E�E
├── Cloudflare�E�EDN・セキュリチE���E�E
├── Claude API�E�EI / LLM�E�E
└── JBCA�E�日本語NLP�E�E             ↁEinsight-common/nlp/

⚪ オプション�E�忁E��時追加�E�E
├── Supabase�E�EQL / 業務系のみ�E�E  ↁEinsight-common/infrastructure/db/
├── Pinecone�E��EクトルDB / AI検索時！E
├── Resend�E�メール送信時！E
└── Sentry�E�本番監視時�E�E
```

---

## 技術選定表

| カチE��リ | 標準ツール | 採用 | insight-common対忁E|
|---------|-----------|------|-------------------|
| **フロントエンチE* | Vercel + React/Next.js | 🟢 | - |
| **バックエンチE* | Render (Python) | 🟢 | - |
| **認証** | Firebase Auth | 🟢 | `infrastructure/auth/` |
| **DB�E�EoSQL�E�E* | Firebase Firestore | 🟢 | `infrastructure/db/firebase.ts` |
| **DB�E�EQL�E�E* | Supabase | ⚪ 業務系のみ | `infrastructure/db/supabase.ts` |
| **ベクトルDB** | Pinecone | ⚪ AI連携晁E| 要追加 |
| **ストレージ** | Firebase Storage | 🟢 | - |
| **CI/CD** | GitHub Actions | 🟢 | - |
| **CDN / セキュリチE��** | Cloudflare | 🟢 | - |
| **メール送信** | Resend | ⚪ 忁E��時 | 要追加 |
| **監要E* | Sentry | ⚪ 本番運用晁E| 要追加 |
| **AI�E�ELM�E�E* | Claude API | 🟢 | - |
| **日本語NLP** | JBCA (kuromoji) | 🟢 | `nlp/` |

---

## アプリ種類別 DB選宁E

| アプリ種顁E| DB選抁E| 琁E�� |
|-----------|--------|------|
| **チャチE��アプリ** | Firebase 🟢 | リアルタイム同期 |
| **SNS・タイムライン** | Firebase 🟢 | スケーラビリチE�� |
| **スマ�Eアプリ** | Firebase 🟢 | オフライン対忁E|
| **Todoアプリ** | Firebase 🟢 | シンプル |
| **AI/NLPアプリ** | Firebase 🟢 | 柔軟なスキーチE|
| **ECサイチE* | Supabase ⚪ | トランザクション |
| **業務シスチE��** | Supabase ⚪ | 褁E��なクエリ |
| **CRM・顧客管琁E* | Supabase ⚪ | リレーション |

---

## 規模別インフラ選宁E

| 月商 | 構�E | 月額目宁E|
|------|------|---------|
| **、E00丁E�E** | Render + Firebase�E�無料枠�E�E| **0冁E* 🟢 |
| **100、E,000丁E�E** | Railway + Firebase/Supabase Pro | **3、E丁E�E** ⚪ |
| **1,000丁E�E、E* | Cloud Run + Cloud SQL | **10、E0丁E�E** ⚪ |

---

## 不採用チE�Eル

| チE�Eル | 用送E| 代替 |
|--------|------|------|
| Dify | RAG構篁E| Claude Code + JBCA |
| n8n | ワークフロー | Claude Code |
| Zapier | 連携 | Claude Code |
| Make | 自動化 | Claude Code |
| Flowise | AIフロー | Claude Code |
| Bubble | アプリ構篁E| Claude Code |
| Retool | 管琁E��面 | Claude Code |

**琁E��**: ノ�Eコードツールは月額コストがかかり、カスタマイズに限界がある、E
Claude Codeで直接構築することで、柔軟性とコスト削減を両立、E

---

## AI連携案件のDB選宁E

| 案件 | ベクトルDB | 補助 |
|------|-----------|------|
| 社冁E��レチE��検索 | Pinecone ⚪ | JBCA�E�品詞フィルタ�E�E|
| カスタマ�Eサポ�EチEot | Pinecone ⚪ | JBCA�E�感惁E�E析！E|
| 議事録検索 | Pinecone ⚪ | JBCA�E�話老E�E析！E|
| 翻訳・要紁E| 不要E| Claude API直接 |
| 感情刁E�� | 不要E| JBCA�E�ルールベ�Eス�E�E|
| タスク抽出 | 不要E| JBCA�E�品詞解析！E|

---

## insight-common モジュール対応表

| 標準機�E | モジュール | 状慁E|
|---------|-----------|------|
| Firebase認証 | `infrastructure/auth/firebase-*.ts` | ✁E実裁E��み |
| Supabase接綁E| `infrastructure/db/supabase.ts` | ✁E実裁E��み |
| APIゲートウェイ | `infrastructure/api/gateway.ts` | ✁E実裁E��み |
| 日本語NLP (JBCA) | `nlp/` | ✁E実裁E��み |
| ブランドカラー | `brand/colors.json` | ✁E実裁E��み |
| Pinecone連携 | - | 📋 要追加 |
| Resendメール | - | 📋 要追加 |
| Sentry監要E| - | 📋 要追加 |

---

## チE��クトップアプリ標溁E

> Web/APIとは別に、WindowsチE��クトップアプリ開発の標準を定義

### 開発フェーズ別技術選宁E

| フェーズ | 技衁E| 用送E| 採用 |
|---------|------|------|------|
| **プロトタイチE* | Python + Tkinter | 高速開発、仕様検証 | 🟢 |
| **製品化�E�軽量！E* | Tauri + React | 5MB配币E��モダンUI | ⚪ |
| **製品化�E�Effice連携�E�E* | C# + WPF + Open XML SDK | MS公式SDK、堁E�� | ⚪ |
| **ローカルAPI** | Flask | ラズパイ、画像�E琁E��ーバ�E | 🟢 |

### 配币E��式比輁E

| 技衁E| 配币E��イズ | 起動速度 | 難読匁E| Office連携 |
|------|-----------|---------|--------|-----------|
| Python + PyInstaller | 50-80MB | 2-5私E| 弱 | python-pptx�E�非公式！E|
| Tauri + React | 5-15MB | 0.5私E| 中 | 要追加実裁E|
| C# + WPF | 15-25MB | 0.3私E| 強�E�Eotfuscator�E�E| Open XML SDK�E��E式！E|

### 推奨開発フロー

```
1. プロトタイプ！Eython + Tkinter�E�E
   ├── 機�E検証
   ├── UI/UX確誁E
   └── ライセンス体系確宁E

2. 製品化判断
   ├── Office連携が重要EↁEC# + WPF
   ├── 軽量�E币E��重要EↁETauri + React
   └── 現状維持EↁEPython + PyInstaller
```

### 製品別技術選宁E

| 製品E| 現在 | 移行�E�E�検討中�E�E| 琁E�� |
|------|------|-----------------|------|
| InsightOfficeSlide (INSS) | Python + Tkinter | C# + WPF | PPT完�E互換が忁E��E|
| InsightOfficeSheet (IOSH) | C# + WPF | C# + WPF 維持E| Excel完�E互換が忁E��E|
| InsightOfficeDoc (IOSD) | C# + WPF | C# + WPF 維持E| Word完�E互換が忁E��E|
| InsightPy (INPY) | Python + Tkinter | Python維持E| Python実行環墁E��本質 |
| InsightCast (INMV) | Python + Tkinter | Tauri or 維持E| 軽量�E币Eor 現状維持E|
| InterviewInsight (IVIN) | Python + Tkinter | C# + WPF | 音声・動画解析連携 |

### Flask の位置づぁE

```
Flask = 軽量Webサーバ�E�E�デスクトップアプリの補助�E�E

用途侁E
├── ラズパイでの画像�E琁EPI
├── ローカルでのAI推論サーバ�E
├── チE��クトップアプリのバックエンチE
└── Stable Diffusion WebUI連携

※ 本格皁E��Webアプリは Next.js + Vercel を使用
```

### Tauri の位置づぁE

```
Tauri = 軽量デスクトップアプリフレームワーク

メリチE��:
├── Electron比で1/10のサイズ�E�EMB vs 50MB�E�E
├── Rust製でメモリ効玁E��良ぁE
├── React/Vue/Svelteでフロント開発
└── クロスプラチE��フォーム対忁E

チE��リチE��:
├── Rust学習コスチE
├── Office連携ライブラリが貧弱
└── ネイチE��ブ機�Eアクセスに制陁E

採用判断:
├── Office連携不要E+ 軽量�E币E��要EↁETauri検訁E
└── Office連携忁E��EↁEC# + WPF
```

### C# + WPF の位置づぁE

```
C# + WPF = Windows向け本格製品E��発

メリチE��:
├── Open XML SDK�E�ES公式）で完�EなOffice互換
├── 10年以上�E後方互換保証
├── Visual Studioの強力なチE��チE��環墁E
├── Dotfuscatorで堁E��な難読匁E
└── 企業向け提案で「MS技術」と言える信頼性

チE��リチE��:
├── Windows専用
├── 学習コスト！E-4週間！E
└── 既存Python賁E��の書き直ぁE

採用判断:
├── PowerPoint/Excel完�E互換が忁E��EↁEC#
├── 企業向け製品として販売 ↁEC#
├── ライセンス保護が重要EↁEC#
└── クロスプラチE��フォーム忁E��EↁE他を検訁E
```

---

## Harmonic Factoryの強み

```
✁Eノ�Eコードツール不要E��Elaude Codeで構築！E
✁E顧客規模に合った正直な提桁E
✁E成長に合わせた移行サポ�EチE
✁E日本語特化NLP�E�EBCA�E�による差別匁E
✁E大手が言わなぁE��報を�E閁E
```

---

*Version: 1.0.0*
*Based on: Insightcreative/harmonic-factory-platform.md*
