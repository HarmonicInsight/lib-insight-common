# HarmonicInsight リポジトリ命名規則 監査レポート

> 調査日: 2026-02-11
> 対象: HarmonicInsight アカウントの111リポジトリ（Public 31 + private 80）

---

## 1. 新命名規則

### フォーマット

```
{platform}-{type}-{product-name}
```

### プラットフォーム（先頭でOSグルーピング）

| プレフィックス | 対象 | 例 |
|:-------------|------|-----|
| `win-` | Windows デスクトップ（C#, Python GUI） | `win-app-insight-slide` |
| `web-` | Web アプリ / サイト（TypeScript, Python web） | `web-app-insight-bi` |
| `android-` | Android ネイティブ（Kotlin） | `android-app-insight-camera` |
| `ios-` | iOS ネイティブ（Swift） | `ios-app-intake-checker` |
| `mobile-` | クロスプラットフォームモバイル（Flutter, RN） | `mobile-app-voice-memo` |
| `unity-` | Unity（C#） | `unity-app-insight-agent` |
| `cross-` | 共通基盤（ライブラリ, ドキュメント, ナレッジ, ツール） | `cross-lib-insight-common` |

### タイプ

| タイプ | 用途 |
|-------|------|
| `app-` | アプリケーション（製品） |
| `tool-` | 内部ツール / ユーティリティ |
| `lib-` | ライブラリ |
| `site-` | Web サイト |
| `docs-` | ドキュメント |
| `kb-` | ナレッジベース |
| `exp-` | 実験・検証 |

### ソート結果イメージ（GitHub上）

```
android-app-consul-evaluate
android-app-construction-education
android-app-insight-camera
android-app-insight-clip
android-app-insight-launcher
android-app-...
cross-docs-insight-creative
cross-docs-insight-suite
cross-kb-books
cross-kb-construction
cross-lib-decision-structure
cross-lib-insight-common
cross-tool-...
ios-app-angle-insight
ios-app-incline-insight
ios-app-insight-cast
ios-app-intake-checker
mobile-app-consul-evaluate
mobile-app-insight-senior-phone
mobile-app-voice-memo
unity-app-insight-agent
web-app-auto-interview
web-app-insight-bi
web-app-insight-chatbot
web-app-insight-diagnosis
web-app-...
web-site-corporate
web-site-insight-office
win-app-insight-bot
win-app-insight-doc
win-app-insight-sheet
win-app-insight-slide
win-app-nocode-analyzer
win-tool-...
```

---

## 2. 全リポジトリ リネーム一覧

### win-（Windows デスクトップ）18件

| # | 現在の名前 | 変更後 | 言語 | 説明 | 備考 |
|--:|-----------|--------|------|------|------|
| 1 | `app-Insight-bot-C` | `win-app-insight-bot` | C# | InsightBot (INBT) | サブモジュール参照あり（要URL更新） |
| 2 | `app-Insight-slide` | `win-app-insight-slide` | C# | Insight Deck Quality Gate (INSS) | |
| 3 | `app-Insight-doc` | `win-app-insight-doc` | C# | Insight AI Briefcase (IOSD) | |
| 4 | `app-Insight-excel` | `win-app-insight-sheet` | C# | Insight Performance Management (IOSH) | ※製品名に合わせてsheet |
| 5 | `app-harmonic-sheet` | `win-app-insight-sheet-senior` | C# | シニア向けSheet | |
| 6 | `app-nocode-analyzer-C` | `win-app-nocode-analyzer` | C# | InsightNoCodeAnalyzer (INCA) | |
| 7 | `app-insight-image-gen-C` | `win-app-insight-image-gen` | C# | InsightImageGen (INIG) | |
| 8 | `app-insight-cast-gen-win-C` | `win-app-insight-cast` | C# | InsightCast (INMV) | |
| 9 | `app-insight-py-win` | `win-app-insight-py` | Python | InsightPy (INPY) BIZ | |
| 10 | `app-insight-py-pro-win` | `win-app-insight-py-pro` | Python | InsightPy (INPY) BIZ+ | |
| 11 | `Insight-launcher` | `win-app-insight-launcher` | C# | アプリランチャー | |
| 12 | `insight-pinboard` | `win-app-insight-pinboard` | C# | ピンボード | |
| 13 | `app-insight-sales-win` | `win-app-insight-sales` | TypeScript | 販売管理 | |
| 14 | `app-forguncy-win` | `win-app-forguncy` | Python | Forguncy解析 | |
| 15 | `app-Insight-management-finance` | `win-app-insight-management-finance` | Python | 管理会計 | |
| 16 | `app-Insight-requirements` | `win-app-insight-requirements` | Python | 要件→アプリ自動生成 | |
| 17 | `tool-file-history-manager` | `win-tool-file-history-manager` | Python | 履歴管理エクスプローラー | |
| 18 | `tool-Insight-factory-win` | `win-tool-insight-factory` | TypeScript | 開発管理ツール | |

### web-（Web アプリ / サイト）36件

| # | 現在の名前 | 変更後 | 言語 | 説明 | 備考 |
|--:|-----------|--------|------|------|------|
| 1 | `app-auto-interview-web` | `web-app-auto-interview` | TS | InterviewInsight (IVIN) | |
| 2 | `app-insight-bi-web` | `web-app-insight-bi` | TS | BIサイト | |
| 3 | `app-insight-diagnosis-web` | `web-app-insight-diagnosis` | Python | 業務調査評価 | |
| 4 | `Insgight-browser-AI` | `web-app-insight-browser-ai` | TS | ブラウザAI | タイポ修正 |
| 5 | `Insight-QR` | `web-app-insight-qr` | TS | QRコードリーダー | |
| 6 | `InsightDigestDiary` | `web-app-insight-digest-diary` | TS | 術後観察ツール | |
| 7 | `InsightTidy` | `web-app-insight-tidy` | TS | 片づけアドバイス | |
| 8 | `Insight-Sharing` | `web-app-insight-sharing` | TS | 位置情報共有 | |
| 9 | `Insight-Process` | `web-app-insight-process` | TS | 業務プロセス分析 | |
| 10 | `app-InsightChatBot-web` | `web-app-insight-chatbot` | TS | チャットボット | |
| 11 | `app-Insight-learning` | `web-app-insight-learning` | TS | 教育プラットフォーム | |
| 12 | `app-Insight-keeper-C` | `web-app-insight-keeper` | TS | 業務ベストプラクティス仕組み | ※実態TS（C誤り） |
| 13 | `app-insight-reports-web` | `web-app-insight-reports` | TS | 帳票ダッシュボード | |
| 14 | `app-insight-bom-web` | `web-app-insight-bom` | TS | BOM管理 | |
| 15 | `app-insight-manage-storiesgame-web` | `web-app-insight-stories-game` | TS | ストーリーゲーム管理 | |
| 16 | `app-query-licence-management-web` | `web-app-query-license-management` | TS | ライセンス顧客管理 | licence→license修正 |
| 17 | `app-nocode-analyzer-web` | `web-app-nocode-analyzer` | Python | NoCode解析Web版 | |
| 18 | `app-issue-management-web` | `web-app-issue-management` | TS | 課題管理 | |
| 19 | `app-construction-kpi-web` | `web-app-construction-kpi` | TS | 建設業KPI | |
| 20 | `app-const-level-web` | `web-app-const-level` | TS | 建設業知識判定 | |
| 21 | `app-human-management-web` | `web-app-human-management` | TS | チーム能力評価 | |
| 22 | `app-security-check-all` | `web-app-security-check` | TS | IPAチェックシート | |
| 23 | `app-family-schedule-web` | `web-app-family-schedule` | TS | 家族スケジュール | |
| 24 | `app-schedule-generaror` | `web-app-schedule-generator` | TS | スケジュール生成 | タイポ修正 |
| 25 | `app-logic-dojo-web` | `web-app-logic-dojo` | TS | ロジック道場 | |
| 26 | `app-harmonic-novels-web` | `web-app-harmonic-novels` | TS | 小説 | |
| 27 | `app-toko-bi-web` | `web-app-toko-bi` | TS | BI | |
| 28 | `app-consul-evaluate-web` | `web-app-consul-evaluate` | TS | コンサル評価Web | |
| 29 | `app-minpakuiot-web` | `web-app-minpaku-iot` | TS | 民泊騒音モニタリング | |
| 30 | `Live2D-Talker` | `web-app-live2d-talker` | JS | Live2Dトーカー | |
| 31 | `Live2D-Interview` | `web-app-live2d-interview` | TS | Live2Dインタビュー | |
| 32 | `arcana-code` | `web-app-arcana-code` | TS | | |
| 33 | `gcs_management` | `web-tool-gcs-management` | TS | GCS管理 | |
| 34 | `Insight-Office.com` | `web-site-insight-office` | TS | Insight Office ページ | |
| 35 | `site-corporate` | `web-site-corporate` | TS | 法人サイト | |
| 36 | `site-erik.arthur` | `web-site-erik-arthur` | HTML | 個人事業主HP | ドット除去 |

### android-（Android）15件

| # | 現在の名前 | 変更後 | 言語 | 説明 |
|--:|-----------|--------|------|------|
| 1 | `Insight-launcher-Android` | `android-app-insight-launcher` | Kotlin | ランチャー |
| 2 | `Insight-Camera-Android` | `android-app-insight-camera` | Kotlin | カメラ |
| 3 | `Insight-Voice-Clock` | `android-app-insight-voice-clock` | Kotlin | 音声時計 |
| 4 | `app-Insight-clip-android` | `android-app-insight-clip` | Kotlin | クリップボード |
| 5 | `app-android-const` | `android-app-construction-education` | Kotlin | 建設業教育 |
| 6 | `app-reader-android` | `android-app-reader` | Kotlin | リーダー |
| 7 | `app-manualsnap-android` | `android-app-manualsnap` | Kotlin | ハンドスキャン取込 |
| 8 | `app-portal-android` | `android-app-portal` | Kotlin | ポータル |
| 9 | `app-consul-evaluate-android` | `android-app-consul-evaluate` | Kotlin | コンサル評価 |
| 10 | `app-pixie-android` | `android-app-pixie` | Kotlin | |
| 11 | `app-path-numbers-android` | `android-app-path-numbers` | Kotlin | |
| 12 | `app-nback-android` | `android-app-nback` | Kotlin | |
| 13 | `app-horoscope-android` | `android-app-horoscope` | Kotlin | |
| 14 | `app-incline-insight-android` | `android-app-incline-insight` | Kotlin | |
| 15 | `app-gout-water-android` | `android-app-gout-water` | Kotlin | |
| -- | `app-comu-test-android` | `android-app-comu-test` | Kotlin | |
| -- | `app-food-medical-android` | `android-app-food-medical` | TS | ※言語要確認 |

### ios-（iOS）4件

| # | 現在の名前 | 変更後 | 言語 | 説明 |
|--:|-----------|--------|------|------|
| 1 | `app-intake-checker-ios` | `ios-app-intake-checker` | Swift | 薬・サプリ管理 |
| 2 | `app-incline-insight-ios` | `ios-app-incline-insight` | Swift | |
| 3 | `app-angle-insight-ios` | `ios-app-angle-insight` | Swift | |
| 4 | `app-insight-cast-ios` | `ios-app-insight-cast` | Swift | InsightCast iOS版 |

### mobile-（クロスプラットフォームモバイル）3件

| # | 現在の名前 | 変更後 | 言語 | 説明 |
|--:|-----------|--------|------|------|
| 1 | `Insight-Senior-Phone` | `mobile-app-insight-senior-phone` | Dart | シニア向けビデオチャット |
| 2 | `app-voice-memo-mobile` | `mobile-app-voice-memo` | TS | 音声メモ |
| 3 | `app-consul-evaluate-mobile` | `mobile-app-consul-evaluate` | TS | コンサル評価モバイル |

### unity-（Unity）1件

| # | 現在の名前 | 変更後 | 言語 | 説明 |
|--:|-----------|--------|------|------|
| 1 | `app-insight-agent-Unity` | `unity-app-insight-agent` | C# | |

### cross-（共通基盤）22件

| # | 現在の名前 | 変更後 | 種別 | 説明 | 備考 |
|--:|-----------|--------|------|------|------|
| 1 | `lib-insight-common` | `cross-lib-insight-common` | lib | 全製品共通ライブラリ | **影響大**（後述） |
| 2 | `lib-decision-structure` | `cross-lib-decision-structure` | lib | 意思決定構造 | |
| 3 | `releases` | `cross-releases` | - | 全製品リリース管理 | |
| 4 | `rpatest` | `cross-tool-rpa-test` | tool | RPA移行工場化 | |
| 5 | `insight-youtube-collector` | `cross-tool-youtube-collector` | tool | YTテスト収集 | |
| 6 | `tool-slide-generator` | `cross-tool-slide-generator` | tool | スライド生成 | |
| 7 | `tool-mart-generator` | `cross-tool-mart-generator` | tool | ナレッジ処理 | |
| 8 | `tool-idea-manager` | `cross-tool-idea-manager` | tool | アイデア管理 | |
| 9 | `tool-idea-list-web` | `cross-tool-idea-list` | tool | アイデア一覧 | ※web外す（統合） |
| 10 | `tool-contract-admin` | `cross-tool-contract-admin` | tool | 契約管理 | |
| 11 | `tool-value-estimator-web` | `cross-tool-value-estimator` | tool | AI見積もり | |
| 12 | `app-family-cashflow` | `cross-app-family-cashflow` | app | タスク管理 | |
| 13 | `app-insight-documentor` | `cross-app-insight-documentor` | app | マニュアル作成 | |
| 14 | `exp-vtuber-course-web` | `cross-exp-vtuber-course` | exp | VTuber実験 | |
| 15 | `Exp_Auto_Error_Fix` | `cross-exp-auto-error-fix` | exp | 自動エラー修正 | アーカイブ済 |
| 16 | `docs-insight-suite` | `cross-docs-insight-suite` | docs | リポジトリ全体管理 | |
| 17 | `docs-insight-creative` | `cross-docs-insight-creative` | docs | | |
| 18 | `kb-task-management` | `cross-kb-task-management` | kb | タスク管理KB | |
| 19 | `kb-construction` | `cross-kb-construction` | kb | 建設業KB | |
| 20 | `kb-book-output` | `cross-kb-book-output` | kb | 書籍出力KB | |
| 21 | `01_books` | `cross-kb-books` | kb | 書籍 | |
| 22 | `insightbot-orchestrator` | `cross-app-insight-bot-orchestrator` | app | Orchestrator | アーカイブ済 |

### アーカイブ済（リネーム不要 or 任意）12件

| 現在の名前 | 変更後（任意） | 状態 | 説明 |
|-----------|---------------|------|------|
| `app-insight-slide-win` | `win-app-insight-slide-legacy` | ARCH | Python版 |
| `app-insight-slide-win-C` | `win-app-insight-slide-v2` | ARCH | C#過渡版 |
| `app-insight-cast-gen-win` | `win-app-insight-cast-legacy` | ARCH | Python版 |
| `app-insight-image-gen-win` | `win-app-insight-image-gen-legacy` | ARCH | Python版 |
| `insightbot-orchestrator` | `cross-app-insight-bot-orchestrator` | ARCH | 空 |
| `app-blender` | `cross-exp-blender` | ARCH | |
| `Exp_Auto_Error_Fix` | `cross-exp-auto-error-fix` | ARCH | |
| `app-sns-test` | `cross-exp-sns-test` | ARCH | |
| `tool-bizrobo-analyzer` | `cross-tool-bizrobo-analyzer` | ARCH | INCA統合 |
| `tool-slide-from-pdf` | `cross-tool-slide-from-pdf` | ARCH | |
| `app-voice-task-groq-web` | `web-app-voice-task-groq` | ARCH | |
| `app-android-easy-line` | `android-app-easy-line` | ARCH | |

---

## 3. 製品コード → リポジトリ対応表（新名）

| 製品コード | 製品名 | 正式リポジトリ（新名） | 関連リポジトリ |
|-----------|--------|---------------------|--------------|
| **INSS** | Insight Deck Quality Gate | `win-app-insight-slide` | |
| **IOSH** | Insight Performance Management | `win-app-insight-sheet` | `win-app-insight-sheet-senior` |
| **IOSD** | Insight AI Briefcase | `win-app-insight-doc` | `cross-app-insight-documentor` |
| **INPY** | InsightPy | `win-app-insight-py` | `win-app-insight-py-pro` |
| **INCA** | InsightNoCodeAnalyzer | `win-app-nocode-analyzer` | `web-app-nocode-analyzer`, `win-app-forguncy` |
| **INBT** | InsightBot | `win-app-insight-bot` | `cross-app-insight-bot-orchestrator` |
| **IVIN** | InterviewInsight | `web-app-auto-interview` | `web-app-live2d-interview`, `web-app-live2d-talker` |
| **INMV** | InsightCast | `win-app-insight-cast` | `ios-app-insight-cast` |
| **INIG** | InsightImageGen | `win-app-insight-image-gen` | |

---

## 4. `cross-lib-insight-common` リネーム時の影響範囲

`lib-insight-common` → `cross-lib-insight-common` に変更する場合：

| 影響元 | 修正内容 | 重要度 |
|--------|---------|:------:|
| `win-app-insight-bot`（旧 app-Insight-bot-C） | `.gitmodules` の URL 書き換え | **高** |
| `cross-lib-insight-common` 内 `scripts/init-app.sh` | submodule URL を更新 | **高** |
| `cross-lib-insight-common` 内 `scripts/check-app.sh` | 参照パス確認 | 中 |
| `cross-lib-insight-common` 内 `scripts/migrate-to-common.sh` | submodule URL を更新 | 中 |
| `cross-lib-insight-common` 内 `scripts/build-installer.ps1` | パス参照確認 | 中 |
| `cross-lib-insight-common` 内 reusable workflow | `uses:` パス変更 | **高** |
| `CLAUDE.md` | 全参照箇所の名前更新 | 中 |
| `cross-tool-youtube-collector` README | `tool-mart-generator` 参照更新 | 低 |
| 各開発PC の `git remote` URL | `git remote set-url origin ...` | 低 |

---

## 5. 要確認事項（オーナー判断）

1. **IOSH の正式リポジトリ**: `app-Insight-excel` vs `app-harmonic-sheet` → どちらが `win-app-insight-sheet`？
2. **InsightPy**: `win-app-insight-py` と `win-app-insight-py-pro` → 統合 or 分離維持？
3. **アイデアツール**: `cross-tool-idea-manager` と `cross-tool-idea-list` → 統合？
4. **InsightDoc**: `win-app-insight-doc` と `cross-app-insight-documentor` → 役割の違いは？
5. **`app-food-medical-android`**: 言語が TypeScript → 実態は `mobile-` か `android-` か？
6. **アーカイブ済リポジトリ**: リネームする必要があるか？（コスト vs 整合性）
