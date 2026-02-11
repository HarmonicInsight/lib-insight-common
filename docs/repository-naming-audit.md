# HarmonicInsight リポジトリ命名規則 監査レポート

> 調査日: 2026-02-11
> 対象: HarmonicInsight アカウント全111リポジトリ（public 31 + private 80）

---

## 1. 現状サマリー

| 項目 | 数値 |
|------|------|
| 総リポジトリ数 | 111 |
| アクティブ | 99 |
| アーカイブ済 | 12 |
| Public | 31 |
| Private | 80 |

---

## 2. 命名プレフィックス分布

| プレフィックス | 件数 | 割合 | 用途 |
|--------------|-----:|-----:|------|
| `app-` | 68 | 61.3% | アプリケーション |
| `Insight-` / `insight-` | 11 | 9.9% | Insight ブランド単体（大小混在） |
| `tool-` | 10 | 9.0% | 内部ツール |
| (プレフィックスなし) | 5 | 4.5% | `01_books`, `arcana-code`, `gcs_management`, `releases`, `rpatest` |
| `kb-` | 3 | 2.7% | ナレッジベース |
| `InsightXxx`（PascalCase） | 2 | 1.8% | `InsightDigestDiary`, `InsightTidy` |
| `Live2D-` | 2 | 1.8% | Live2D 関連 |
| `docs-` | 2 | 1.8% | ドキュメントサイト |
| `lib-` | 2 | 1.8% | ライブラリ |
| `site-` | 2 | 1.8% | Web サイト |
| `insightbot-` | 1 | 0.9% | `insightbot-orchestrator` |
| `Insgight-`（**タイポ**） | 1 | 0.9% | `Insgight-browser-AI` |
| `Exp_` | 1 | 0.9% | `Exp_Auto_Error_Fix` |
| `exp-` | 1 | 0.9% | `exp-vtuber-course-web` |

---

## 3. 発見された問題点

### 3.1 大文字・小文字の不統一

**最大の問題**: `app-Insight-*`（大文字I）と `app-insight-*`（小文字i）が混在。

| パターン | 件数 | 例 |
|---------|-----:|-----|
| `app-Insight-*`（大文字I） | 10 | `app-Insight-bot-C`, `app-Insight-slide`, `app-Insight-doc` |
| `app-insight-*`（小文字i） | 17 | `app-insight-bi-web`, `app-insight-py-win`, `app-insight-image-gen-C` |

同様に、単体 Insight 系：
- `Insight-*`（大文字）: 9件（`Insight-launcher`, `Insight-QR` 等）
- `insight-*`（小文字）: 2件（`insight-pinboard`, `insight-youtube-collector`）

### 3.2 タイポ

| リポジトリ名 | 問題 | 修正案 |
|-------------|------|--------|
| `Insgight-browser-AI` | 「Insgight」転置 | `insight-browser-ai` |
| `app-schedule-generaror` | 「generaror」t抜け | `app-schedule-generator` |

### 3.3 セパレータの不統一

| パターン | 件数 | 例 |
|---------|-----:|-----|
| ハイフン `-`（正） | 105 | ほとんど |
| アンダースコア `_` | 3 | `01_books`, `Exp_Auto_Error_Fix`, `gcs_management` |
| PascalCase（セパレータなし） | 2 | `InsightDigestDiary`, `InsightTidy` |
| 混合（ハイフン + PascalCase） | 1 | `app-InsightChatBot-web` |

### 3.4 プラットフォームサフィックスの不統一

| サフィックス | 件数 | 大小文字問題 |
|-------------|-----:|------------|
| なし | 52 | -- |
| `-web` | 23 | 統一済 |
| `-android` | 13 | 統一済 |
| `-Android`（大文字A） | 2 | `Insight-Camera-Android`, `Insight-launcher-Android` |
| `-win` | 8 | 統一済 |
| `-C`（C#の意味） | 6 | **問題あり**（後述） |
| `-ios` | 4 | 統一済 |
| `-mobile` | 2 | 統一済 |
| `-Unity` | 1 | 大文字 |

**`-C` サフィックスの問題:**
- 本来の意味: 「Python → C# に移行した版」を示すために付けた
- 問題: `app-Insight-keeper-C` は TypeScript であり C# ではない（誤解を招く）
- 問題: C# 製品でも `-C` が付かないものがある（`app-Insight-slide`, `app-Insight-doc`, `app-Insight-excel`）

### 3.5 重複・旧バージョンの残存

#### Python → C# 移行チェーン

| 製品 | Phase 1（Python） | Phase 2（C# 過渡期） | Phase 3（C# 正式版） |
|------|------------------|---------------------|--------------------|
| InsightSlide | `app-insight-slide-win` [ARCH] | `app-insight-slide-win-C` [ARCH] | `app-Insight-slide` |
| InsightMovie | `app-insight-movie-gen-win` [ARCH] | `app-insight-movie-gen-win-C` | -- |
| InsightImageGen | `app-insight-image-gen-win` [ARCH] | `app-insight-image-gen-C` | -- |

#### 同一製品の疑い

| グループ | リポジトリ | 疑問点 |
|---------|-----------|--------|
| Sheet/Excel | `app-harmonic-sheet`, `app-Insight-excel` | どちらが正式IOSH? |
| Doc | `app-Insight-doc`, `app-insight-documentor` | どちらが正式IOSD? |
| アイデアツール | `tool-idea-list-web`, `tool-idea-manager` | 統合すべき？ |
| InsightPy | `app-insight-py-win`, `app-insight-py-pro-win` | STD/PRO分離か統合か？ |
| NoCode解析 | `app-nocode-analyzer-C`, `app-nocode-analyzer-web`, `app-forguncy-win`, `tool-bizrobo-analyzer`[ARCH] | 統合すべき？ |

---

## 4. 製品コードとリポジトリの対応表

| 製品コード | 製品名 | 正式リポジトリ（推定） | 関連リポジトリ |
|-----------|--------|---------------------|--------------|
| **INSS** | InsightOfficeSlide | `app-Insight-slide` | `app-insight-slide-win`[ARCH], `app-insight-slide-win-C`[ARCH], `tool-slide-generator`, `tool-slide-from-pdf`[ARCH] |
| **IOSH** | InsightOfficeSheet | `app-Insight-excel`? `app-harmonic-sheet`? | **要確認** |
| **IOSD** | InsightOfficeDoc | `app-Insight-doc` | `app-insight-documentor` |
| **INPY** | InsightPy | `app-insight-py-win` | `app-insight-py-pro-win` |
| **INCA** | InsightNoCodeAnalyzer | `app-nocode-analyzer-C` | `app-nocode-analyzer-web`, `app-forguncy-win`, `tool-bizrobo-analyzer`[ARCH] |
| **INBT** | InsightBot | `app-Insight-bot-C` | `insightbot-orchestrator`[ARCH] |
| **IVIN** | InterviewInsight | `app-auto-interview-web` | `Live2D-Interview`, `Live2D-Talker` |
| **INMV** | InsightMovie | `app-insight-movie-gen-win-C` | `app-insight-movie-gen-win`[ARCH], `app-insight-movie-ios` |
| **INIG** | InsightImageGen | `app-insight-image-gen-C` | `app-insight-image-gen-win`[ARCH] |

---

## 5. サブモジュール・依存関係

| 参照元 | 参照先 | 参照方法 |
|--------|--------|---------|
| `app-Insight-bot-C` | `lib-insight-common` | git submodule |
| `lib-insight-common/scripts/init-app.sh` | `insight-common.git`（旧名） | submodule URL |
| `lib-insight-common` | 自身 | reusable workflow |
| `insight-youtube-collector` | `tool-mart-generator` | README参照 |
| `app-harmonic-sheet` | `app-Insight-excel` | README参照 |
| `app-insight-diagnosis-web` | `InsightDiagnosis`（存在しない名前） | README参照 |

**重要**: `init-app.sh` 内のサブモジュール URL が `insight-common.git` になっており、実際のリポジトリ名 `lib-insight-common` と一致していない。

---

## 6. 名前変更時の影響範囲

### 影響レベル: 高

| リポジトリ | 変更理由 | 影響 |
|-----------|---------|------|
| `lib-insight-common` → 別名 | 中央共有ライブラリ | `app-Insight-bot-C` の `.gitmodules` URL 変更必要。`init-app.sh` の URL 変更必要。reusable workflow の `uses:` パス変更必要 |

### 影響レベル: 中（他リポジトリからの参照あり）

| リポジトリ | 影響先 |
|-----------|--------|
| `tool-mart-generator` | `insight-youtube-collector` の README |
| `app-Insight-excel` | `app-harmonic-sheet` の README |

### 影響レベル: 低（単独リポジトリ、参照なし）

残りの100以上のリポジトリは、名前を変更しても他リポジトリへの影響はありません。ただし以下に注意:
- GitHub は旧 URL → 新 URL のリダイレクトを自動設定（ただし同名の新リポジトリを作ると消える）
- `git remote` URL がローカル環境に残るため、各開発PCで `git remote set-url` が必要
- CI/CD パイプライン内のリポジトリ URL 更新
- Releases リポジトリ内のダウンロードリンク

---

## 7. 推奨命名規則

### 規則

```
{type}-{product-name}-{platform}
```

| 要素 | 規則 | 例 |
|------|------|-----|
| type | 全小文字: `app`, `tool`, `lib`, `docs`, `kb`, `site`, `exp` | |
| product-name | 全小文字、ハイフン区切り | `insight-slide`, `nocode-analyzer` |
| platform | 全小文字、省略可: `web`, `win`, `android`, `ios`, `mobile` | |

### `-C` サフィックスの廃止

C# 移行が完了した製品は `-C` を外し、旧 Python 版はアーカイブ済のため区別不要。

### 具体的なリネーム案

#### 優先度1: タイポ修正（即時対応）

| 現在の名前 | 変更後 |
|-----------|--------|
| `Insgight-browser-AI` | `app-insight-browser-ai` |
| `app-schedule-generaror` | `app-schedule-generator` |

#### 優先度2: 大小文字統一（`app-Insight-*` → `app-insight-*`）

| 現在の名前 | 変更後 |
|-----------|--------|
| `app-Insight-bot-C` | `app-insight-bot` |
| `app-Insight-slide` | `app-insight-slide` |
| `app-Insight-doc` | `app-insight-doc` |
| `app-Insight-excel` | `app-insight-sheet` (※製品名に合わせる) |
| `app-Insight-clip-android` | `app-insight-clip-android` |
| `app-Insight-keeper-C` | `app-insight-keeper-web` (TypeScriptなので) |
| `app-Insight-learning` | `app-insight-learning` |
| `app-Insight-management-finance` | `app-insight-management-finance` |
| `app-Insight-requirements` | `app-insight-requirements` |
| `app-InsightChatBot-web` | `app-insight-chatbot-web` |

#### 優先度3: プラットフォームサフィックス統一

| 現在の名前 | 変更後 |
|-----------|--------|
| `Insight-Camera-Android` | `app-insight-camera-android` |
| `Insight-launcher-Android` | `app-insight-launcher-android` |
| `app-insight-image-gen-C` | `app-insight-image-gen` |
| `app-insight-movie-gen-win-C` | `app-insight-movie-gen` |
| `app-nocode-analyzer-C` | `app-nocode-analyzer` |
| `app-insight-agent-Unity` | `app-insight-agent-unity` |

#### 優先度4: プレフィックス統一（Insight 単体系 → `app-` に統合）

| 現在の名前 | 変更後 |
|-----------|--------|
| `Insight-Voice-Clock` | `app-insight-voice-clock` |
| `Insight-QR` | `app-insight-qr` |
| `Insight-Sharing` | `app-insight-sharing` |
| `Insight-Process` | `app-insight-process` |
| `Insight-Senior-Phone` | `app-insight-senior-phone` |
| `InsightDigestDiary` | `app-insight-digest-diary` |
| `InsightTidy` | `app-insight-tidy` |
| `insight-pinboard` | `app-insight-pinboard` |
| `Insight-launcher` | `app-insight-launcher-win` |
| `insight-youtube-collector` | `tool-youtube-collector` |

#### 優先度5: その他の正規化

| 現在の名前 | 変更後 | 理由 |
|-----------|--------|------|
| `gcs_management` | `tool-gcs-management` | プレフィックス追加+ハイフン化 |
| `rpatest` | `tool-rpa-test` | プレフィックス追加 |
| `Exp_Auto_Error_Fix` | `exp-auto-error-fix` | 小文字+ハイフン化 |
| `01_books` | `kb-books` | プレフィックス追加 |
| `app-harmonic-sheet` | `app-insight-sheet-senior` | Insightブランドに統一 |
| `insightbot-orchestrator` | `app-insight-bot-orchestrator` | プレフィックス統一 |
| `Insight-Office.com` | `site-insight-office` | サイト系プレフィックス |
| `site-erik.arthur` | `site-erik-arthur` | ドット除去 |
| `docs-insight-suite` | `docs-insight-suite` | （変更なし） |
| `docs-insight-creative` | `docs-insight-creative` | （変更なし） |
| `arcana-code` | `app-arcana-code` | プレフィックス追加 |
| `Live2D-Talker` | `app-live2d-talker` | プレフィックス+小文字 |
| `Live2D-Interview` | `app-live2d-interview` | プレフィックス+小文字 |

---

## 8. 要確認事項

以下はオーナーの判断が必要:

1. **IOSH の正式リポジトリはどれか？** → `app-Insight-excel` / `app-harmonic-sheet` のどちらを残すか
2. **`app-insight-py-win` と `app-insight-py-pro-win`** → 統合 or 分離維持？
3. **`tool-idea-list-web` と `tool-idea-manager`** → 統合 or 分離維持？
4. **`app-Insight-doc` と `app-insight-documentor`** → 役割の違いは何か？
5. **lib-insight-common のリネーム** → `insight-common` に戻す？（init-app.sh との一致のため）

---

## 9. アーカイブ済リポジトリ一覧（12件）

| リポジトリ | 言語 | 説明 |
|-----------|------|------|
| `app-insight-slide-win` | Python | Insight Slide Python版（C#に移行済） |
| `app-insight-slide-win-C` | C# | Insight Slide C#過渡版 |
| `app-insight-movie-gen-win` | Python | InsightMovie Python版（C#に移行済） |
| `app-insight-image-gen-win` | Python | InsightImageGen Python版（C#に移行済） |
| `insightbot-orchestrator` | - | Orchestrator（空？） |
| `app-blender` | Python | Blender連携（実験） |
| `Exp_Auto_Error_Fix` | Python | 自動エラー修正（実験） |
| `app-sns-test` | - | SNS連携検証 |
| `tool-bizrobo-analyzer` | Python | BizRobo解析（INCA に統合） |
| `tool-slide-from-pdf` | Python | PDF→スライド変換 |
| `app-voice-task-groq-web` | TypeScript | 音声タスク Groq版 |
| `app-android-easy-line` | Kotlin | 簡易LINE連携（廃止） |
