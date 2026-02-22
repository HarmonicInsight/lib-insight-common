# Build Doctor — ビルドエラー自律解消エージェント

> **最終更新**: 2026-02-22 | **バージョン**: 1.0.0

## 概要

Build Doctor は、iOS / Android / C#(WPF) / React / Python / Tauri のビルドエラーを**自動分類・自動修正**するクロスプラットフォーム対応の自律エージェントです。

### 設計思想

1. **プラットフォーム非依存のエラー分類体系** — 6カテゴリで全プラットフォームを統一的に扱う
2. **パターンマッチによる自動原因特定** — 正規表現ベースの知識ベース
3. **最小差分の修正** — 1ループにつき1つの修正のみ（副作用を最小化）
4. **自律的な問題解決** — 質問で止まらず、情報収集を自ら行う
5. **既知の互換性問題との照合** — `compatibility/` の NG 組み合わせを活用

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│  Build Doctor エージェント                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ build-doctor │  │ build-doctor │  │ compatibility│      │
│  │    .sh       │  │    .ts       │  │   /*.ts      │      │
│  │              │  │              │  │              │      │
│  │ シェル実行層   │  │ 知識ベース    │  │ 既知NG組み合  │      │
│  │ ビルド実行    │  │ エラーパターン │  │ わせマトリクス │      │
│  │ ログ保存     │  │ 修正戦略      │  │              │      │
│  │ 修正適用     │  │ 分類エンジン   │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └────────────┬────┴─────────────────┘              │
│                      ▼                                     │
│         ┌────────────────────────┐                         │
│         │  ビルド → 分析 → 修正   │                         │
│         │  → 再ビルド → 判定     │                         │
│         │  (最大2ループ)          │                         │
│         └────────────────────────┘                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  対応プラットフォーム                                         │
│  iOS | Android | C# WPF | React | Python | Tauri           │
└─────────────────────────────────────────────────────────────┘
```

## エラーカテゴリ（6分類）

| カテゴリ | 説明 | 典型的な原因 |
|---------|------|-------------|
| **Compile** | コンパイルエラー | 型不一致、未宣言シンボル、構文エラー、Swift 6 Concurrency |
| **Link** | リンクエラー | 未解決参照、重複シンボル、フレームワーク不足 |
| **Dependency** | 依存解決エラー | SPM/CocoaPods/Gradle/NuGet/npm/pip の解決失敗 |
| **ScriptPhase** | ビルドスクリプトエラー | Run Script Phase、SwiftLint、pre/post build |
| **Environment** | 環境エラー | SDK/toolchain 未インストール、バージョン不一致、ディスク不足 |
| **CodeSign** | コード署名エラー | 証明書/プロファイル期限切れ、entitlements 不整合 |

## 使い方

### シェルスクリプト（直接実行）

```bash
# 基本: カレントディレクトリのプロジェクトを自動検出
./scripts/build-doctor.sh .

# プラットフォーム指定
./scripts/build-doctor.sh /path/to/project --platform ios

# ループ回数変更
./scripts/build-doctor.sh /path/to/project --max-loops 3
```

### TypeScript API（プログラム利用）

```typescript
import {
  classifyBuildError,
  findMatchingPatterns,
  suggestFixes,
  diagnose,
  detectPlatform,
  createAgentState,
  determineNextAction,
  generateLogPath,
  renderCommand,
  BUILD_COMMANDS,
  BUILD_ERROR_PATTERNS,
  FIX_STRATEGIES,
  AGENT_CONFIG,
  INFO_GATHERING_COMMANDS,
} from '@/insight-common/config/build-doctor';

// 1. プラットフォーム検出
const platform = detectPlatform(['Package.swift', 'Sources', 'Tests']);
// → 'ios'

// 2. ビルドログの分析
const logLines = buildLog.split('\n');
const diagnosis = diagnose(logLines, 'ios');
// → { category: 'Compile', matchedPatterns: [...], suggestedFixes: [...], confidence: 0.85 }

// 3. 修正戦略の取得
const fixes = suggestFixes(diagnosis.matchedPatterns);
// → [{ patternId: 'ios-compile-concurrency', type: 'config_change', autoFixable: true, ... }]

// 4. エージェント状態管理
const state = createAgentState('ios', '/path/to/project');
const nextAction = determineNextAction(state, false);
// → 'analyzing' | 'fixing' | 'needs_info' | 'escalate'
```

## エージェント動作フロー

```
┌───────────┐
│   開始     │
└─────┬─────┘
      ▼
┌───────────────┐
│ プラットフォーム │
│ 自動検出        │
└─────┬─────────┘
      ▼
┌───────────────┐     ┌─────────────┐
│ ビルド実行      │────→│ 成功？       │──Yes──→ 完了 ✓
│ ログ保存       │     └──────┬──────┘
└───────────────┘            │ No
                              ▼
                    ┌───────────────┐
                    │ エラー末尾200行 │
                    │ 抽出・分類     │
                    └──────┬────────┘
                           ▼
                    ┌───────────────┐
                    │ 最小修正1つ    │
                    │ 適用          │
                    └──────┬────────┘
                           ▼
                    ┌───────────────┐
                    │ ループ < 2?   │──No──→ 追加情報収集 → 報告
                    └──────┬────────┘
                           │ Yes
                           ▼
                      再ビルドへ ↑
```

## プラットフォーム別対応

### iOS

| 検出ファイル | ビルドコマンド | パッケージマネージャ |
|------------|--------------|-------------------|
| `*.xcodeproj`, `*.xcworkspace`, `Package.swift` | `xcodebuild` / `swift build` | SPM / CocoaPods |

**主要な自動修正:**
- Swift 6 Concurrency 緩和（`StrictConcurrency: .complete` → `.targeted`）
- SPM パッケージキャッシュクリア + 再解決
- CocoaPods 再インストール
- DerivedData クリア
- xcode-select 設定
- 自動署名の有効化

### Android

| 検出ファイル | ビルドコマンド | パッケージマネージャ |
|------------|--------------|-------------------|
| `build.gradle.kts`, `settings.gradle.kts` | `./gradlew assembleDebug` | Gradle |

**主要な自動修正:**
- Gradle キャッシュクリア + 再依存解決
- `local.properties` への ANDROID_HOME 設定
- Gradle ラッパーバージョン更新

### C# WPF (.NET)

| 検出ファイル | ビルドコマンド | パッケージマネージャ |
|------------|--------------|-------------------|
| `*.csproj`, `*.sln` | `dotnet build` | NuGet |

**主要な自動修正:**
- NuGet パッケージ強制復元
- dotnet クリーン + リストア

### React / Next.js

| 検出ファイル | ビルドコマンド | パッケージマネージャ |
|------------|--------------|-------------------|
| `next.config.*`, `package.json` | `npm run build` | npm |

**主要な自動修正:**
- node_modules 再インストール（legacy-peer-deps）
- ビルドキャッシュクリア
- Node.js ヒープサイズ拡大

### Python

| 検出ファイル | ビルドコマンド | パッケージマネージャ |
|------------|--------------|-------------------|
| `pyproject.toml`, `requirements.txt` | `python -m py_compile` / `pyinstaller` | pip |

**主要な自動修正:**
- pip 依存再インストール
- 不足モジュール自動インストール
- `__pycache__` クリア

### Tauri (Rust + TypeScript)

| 検出ファイル | ビルドコマンド | パッケージマネージャ |
|------------|--------------|-------------------|
| `src-tauri/Cargo.toml` | `npm run tauri build` | Cargo + npm |

**主要な自動修正:**
- Cargo 依存更新
- Cargo クリーンビルド
- フロントエンド + Rust 両方クリア

## compatibility/ との連携

Build Doctor は `compatibility/` ディレクトリの既知 NG 組み合わせを参照して、バージョン衝突を事前に検知します。

```typescript
import { checkAndroidCompatibility } from '@/insight-common/compatibility';
import { IOS_CONFLICT_RULES } from '@/insight-common/compatibility';

// Android のバージョン組み合わせチェック
const conflicts = checkAndroidCompatibility({
  agp: '9.0.0',
  gradle: '8.11.1',  // NG: AGP 9.0 requires Gradle 9.x
});

// iOS の既知衝突ルール参照
const iosConflicts = IOS_CONFLICT_RULES.filter(r => r.severity === 'critical');
```

## 出力形式

エージェントは以下の情報を出力します:

| 項目 | 説明 |
|------|------|
| **実行したコマンド** | ビルドコマンド、修正コマンド |
| **ログファイルパス** | `build_logs/{platform}_build_{timestamp}.log` |
| **原因カテゴリ** | Compile / Link / Dependency / ScriptPhase / Environment / CodeSign |
| **修正差分** | 適用した変更の diff |
| **次のアクション** | RESOLVED / NEEDS_INFO / ESCALATE |

## 設定

### エージェント設定（`AGENT_CONFIG`）

| 設定 | デフォルト値 | 説明 |
|------|-----------|------|
| `maxLoops` | 2 | 最大自動修正ループ回数 |
| `logDir` | `build_logs` | ログ保存ディレクトリ |
| `tailLines` | 200 | エラー抽出行数 |
| `autoFixThreshold` | 0.6 | 自動修正を試行する信頼度閾値 |
| `needsInfoThreshold` | 0.3 | 情報収集に移行する信頼度閾値 |

## エラーパターンの追加

新しいエラーパターンを追加するには:

1. `config/build-doctor.ts` の `BUILD_ERROR_PATTERNS` に新規パターンを追加
2. 対応する修正戦略を `FIX_STRATEGIES` に追加
3. `scripts/build-doctor.sh` の該当プラットフォームの分類・修正関数を更新

```typescript
// 新規パターンの例
{
  id: 'ios-compile-new-pattern',
  platform: 'ios',
  category: 'Compile',
  regex: 'specific error message pattern',
  descriptionJa: '新しいエラーパターン',
  descriptionEn: 'New error pattern',
  severity: 'high',
  lastVerified: '2026-02-22',
}
```

## 制約事項

- **CodeSign カテゴリ**は証明書・プロファイルの操作を伴うため、自動修正は限定的
- **Compile カテゴリ**のソースコード修正は提案のみ（自動書き換えしない）
- ネットワーク依存の修正（依存取得）はオフライン環境では失敗する
- CI/CD 環境では `sudo` を要求する修正は実行できない
