# GitHub Organization 設定ガイド

> デザイン標準を全リポジトリに強制する方法

## 方法1: Organization Ruleset（推奨）

GitHub Organization の Ruleset を使って、全リポジトリに CI チェックを強制します。

### 設定手順

1. **GitHub Organization** → **Settings** → **Rules** → **Rulesets**

2. **New ruleset** → **New branch ruleset**

3. 設定内容:

```
Ruleset name: design-standards-check
Enforcement status: Active
Target: All repositories (または Include by pattern: *)
Target branches: Default branch

Rules:
  ✅ Require status checks to pass
     - Required checks:
       - "validate" (validate-standards.yml のジョブ名)

  ✅ Block force pushes
```

4. **Create** をクリック

### 結果

- 全リポジトリで `validate` チェックが必須になる
- チェックに失敗した PR はマージ不可
- 新規リポジトリにも自動適用

---

## 方法2: .github リポジトリ（デフォルトワークフロー）

Organization に `.github` リポジトリを作成し、デフォルトのワークフローを配置：

### 設定手順

1. `.github` という名前のリポジトリを作成（パブリック）

2. 以下の構成でファイルを配置:

```
.github/
├── workflow-templates/
│   ├── validate-standards.yml
│   └── validate-standards.properties.json
└── FUNDING.yml (オプション)
```

3. `workflow-templates/validate-standards.yml`:

```yaml
name: Validate Design Standards

on:
  pull_request:
    branches: [$default-branch]
  push:
    branches: [$default-branch]

jobs:
  validate:
    uses: HarmonicInsight/cross-lib-insight-common/.github/workflows/reusable-validate.yml@main
    with:
      project_path: '.'
```

4. `workflow-templates/validate-standards.properties.json`:

```json
{
  "name": "Insight Design Standards Check",
  "description": "Validate Ivory & Gold design system compliance",
  "iconName": "octicon shield-check",
  "categories": ["Insight Series"]
}
```

### 結果

- 新規リポジトリ作成時に Actions タブで「Insight Design Standards Check」が提案される
- ワンクリックでワークフローを追加可能

---

## 推奨設定

| 設定 | 優先度 | 効果 |
|-----|-------|------|
| Organization Ruleset | 🔴 必須 | PRマージをブロック |
| .github リポジトリ | 🟡 推奨 | ワークフロー提案 |
| init-app.sh | 🟢 補助 | 自動セットアップ |

**Ruleset を設定すれば、ワークフローがなくてもマージがブロックされます。**

---

## 確認方法

Organization Ruleset が適用されているか確認:

1. 任意のリポジトリ → **Settings** → **Branches**
2. 「Organization rulesets」セクションに適用ルールが表示される

---

## トラブルシューティング

### Q: ワークフローがないリポジトリでマージできてしまう

A: Ruleset で「Require status checks to pass」を設定しても、ワークフローが存在しないリポジトリでは
   チェックがスキップされる場合があります。

対策:
- Ruleset で「Require workflows to pass before merging」を有効化
- または、.github リポジトリのワークフローテンプレートを必須化

### Q: 既存リポジトリに適用されない

A: Ruleset の「Target」設定を確認:
- 「All repositories」または該当パターンが含まれているか
- 「Exclude」で除外されていないか
