# 統合プロンプト一覧

各アプリリポジトリで insight-common を統合するためのプロンプト集です。

## 使い方

1. 対象アプリのリポジトリを Claude Code で開く
2. 対応するプロンプトファイルの内容をコピー
3. Claude Code に貼り付けて実行

## プロンプト一覧

| アプリ | プロンプト | 製品コード | 技術スタック |
|--------|-----------|-----------|-------------|
| SalesInsight | [SALESINSIGHT_SETUP.md](./SALESINSIGHT_SETUP.md) | `SALES` | Tauri + React + TypeScript |
| InsightSlide | [INSIGHTSLIDE_SETUP.md](./INSIGHTSLIDE_SETUP.md) | `SLIDE` | Python + Tkinter |
| InsightPy | [INSIGHTPY_SETUP.md](./INSIGHTPY_SETUP.md) | `PY` | Python |
| InterviewInsight | [INTERVIEWINSIGHT_SETUP.md](./INTERVIEWINSIGHT_SETUP.md) | `INTV` | TBD |

## 共通手順

すべてのプロンプトに含まれる基本手順：

1. **Submodule 追加**
   ```bash
   git submodule add https://github.com/HarmonicInsight/insight-common.git
   ```

2. **ライセンス管理実装**
   - TypeScript: `src/lib/license-manager.ts`
   - Python: `src/license_manager.py`

3. **機能制限ゲート**
   - TypeScript: `FeatureGate` コンポーネント
   - Python: `@require_feature` デコレータ

4. **ブランドカラー適用**
   - 各製品固有のプライマリカラー

5. **コミット & プッシュ**

## 注意事項

### InsightSlide の場合
既存のライセンス形式（`PRO-`/`STD-`/`TRIAL-`）との互換性を維持する必要があります。
プロンプトにレガシーサポートの実装が含まれています。

### InterviewInsight の場合
旧名 `AutoInterview` からの改名が含まれています。
