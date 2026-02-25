# HARMONIC insight Skills

Claude Code が繰り返し使うワークフローを標準化した「スキル」定義集です。

## 利用可能なスキル

| スキル | 用途 | トリガー例 |
|--------|------|-----------|
| [build-auto-fix](./build-auto-fix/SKILL.md) | ビルドエラー自動検出・修正 | 「ビルドエラー直して」 |

## 関連する検証スクリプト

| スクリプト | 用途 | 実行例 |
|-----------|------|--------|
| `scripts/validate-standards.sh` | デザイン標準検証（Ivory & Gold） | `./scripts/validate-standards.sh <dir>` |
| `scripts/validate-cool-color.sh` | 寒色系標準検証（Cool Blue & Slate） | `./scripts/validate-cool-color.sh <dir>` |
| `scripts/validate-menu-icons.sh` | メニューアイコン標準検証（Lucide Icons） | `./scripts/validate-menu-icons.sh <dir>` |
| `scripts/release-check.sh` | リリース前包括チェック | `./scripts/release-check.sh <dir>` |

## スキルの使い方

Claude Code で以下のように指示するだけで、スキルに定義されたベストプラクティスに従って作業します：

```
ビルドエラー直して
```

または、スキルを明示的に参照：

```
build-auto-fix スキルを使って、全環境のビルドエラーを確認・修正して
```

## スキルの構造

```
skills/
└── {skill-name}/
    ├── SKILL.md      # スキル定義（必須）
    ├── examples/     # 使用例（オプション）
    └── templates/    # テンプレート（オプション）
```

## 新しいスキルを作る

1. `skills/` 配下にディレクトリを作成
2. `SKILL.md` にスキル定義を記述
3. 必要に応じて例やテンプレートを追加

### SKILL.md の基本構造

```markdown
# スキル名

> 概要説明

## トリガー
どのような指示でこのスキルが発動するか

## 実行フロー
1. ステップ1
2. ステップ2
3. ...

## コマンド/コード例
具体的な実行コマンドやコード

## よくあるパターンと対処法
エラーパターンと解決策

## 制限事項
自動化できないケース
```

## スキル vs スクリプト

| 項目 | スキル (SKILL.md) | スクリプト (*.sh) |
|------|------------------|------------------|
| 実行方法 | Claude Code が解釈 | シェルで直接実行 |
| 柔軟性 | 状況に応じて判断 | 固定のロジック |
| デバッグ | 対話的に確認可能 | ログ出力のみ |
| 用途 | 複雑・判断が必要な作業 | 単純・定型作業 |

**推奨**: 両方を併用。スクリプトで定型処理、スキルで判断が必要な部分を補完。
