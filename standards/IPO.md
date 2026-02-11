# IPO (Input-Process-Output) 業務プロセスモデル 設計標準

> **最終更新**: 2026-02-07
> **ステータス**: 策定

---

## 1. 概要

すべての業務は `function(input) → output` として抽象化できる。
組織全体はこの業務関数の階層的ネスト構造で表現される。

```
組織 (organization)
├── 経理部 (department)
│   └── 月次決算 (process)
│       ├── 原価データ収集 (task)
│       ├── 仕訳入力・照合 (task)
│       └── 決算確認・承認 (task)
└── 工事部 (department)
    ├── 実行予算策定 (process)
    └── 現場日次業務 (process)
```

### 3つの設計原則

| 原則 | 内容 |
|------|------|
| **業務 = 関数** | すべてのタスクに入力と出力を明示する |
| **階層的ネスト** | department → process → task の 3 階層 |
| **実行者の可視化** | human / system / ai / hybrid を全タスクに付与 |

---

## 2. データモデル

### 2.1 IpoNode（業務ノード）

型定義: `config/ipo/types.ts`

```typescript
interface IpoNode {
  id: string;              // 一意識別子 (e.g. "task-cost-collection")
  name: string;            // 業務名称
  type: NodeType;          // department | process | task
  executor?: ExecutorType; // human | system | ai | hybrid
  input?: IpoInput[];      // 入力データ
  process?: IpoProcess;    // 処理内容
  output?: IpoOutput[];    // 出力データ
  kpi?: IpoKpi[];          // KPI
  issues?: string[];       // 課題
  children?: IpoNode[];    // 子ノード
}
```

### 2.2 ノード種別

| 種別 | 階層 | 説明 | 例 |
|------|------|------|-----|
| `organization` | 0 | 組織ルート（横断分析用） | 株式会社建設太郎 |
| `department` | 1 | 部門・部署 | 経理部、工事部 |
| `process` | 2 | 業務プロセス | 月次決算、実行予算策定 |
| `task` | 3 | 個別タスク | 原価データ収集、仕訳入力 |

### 2.3 実行者種別（ExecutorType）

| 種別 | 色 | 説明 |
|------|-----|------|
| `human` | #3B82F6 (青) | 人間が手動で実行 |
| `system` | #10B981 (緑) | 既存システムで自動実行 |
| `ai` | #8B5CF6 (紫) | AI が実行 |
| `hybrid` | #F59E0B (橙) | 人+システム併用 |

> **DX 推進の核心**: `human` タスクを `system` / `ai` / `hybrid` に置き換えることが自動化。

### 2.4 接続の仕組み

ノード間の依存関係は `Output.destination` と `Input.source` で表現。

```
タスクA.output[0].destination = "task-B"
↕
タスクB.input[0].source = "task-A"
```

部門 ID を跨ぐ接続は **部門間連携** として可視化される。

---

## 3. ID 命名規則

```
{type}-{name}
```

| 種別 | プレフィックス | 例 |
|------|--------------|-----|
| department | `dept-` | `dept-accounting`, `dept-construction` |
| process | `proc-` | `proc-monthly-closing`, `proc-execution-budget` |
| task | `task-` | `task-cost-collection`, `task-journal-entry` |
| 外部 | `external-` | `external-subcontractors`, `external-client` |

---

## 4. JSON スキーマ

### ルート構造

```json
{
  "company": "株式会社建設太郎",
  "version": "1.0.0",
  "updatedAt": "2026-02-07T00:00:00+09:00",
  "departments": [ /* IpoNode[] */ ],
  "metadata": {
    "industry": "建設業",
    "employeeCount": 500,
    "region": "関東"
  }
}
```

### バリデーション

```typescript
import { IPO_SCHEMA_VERSION } from '@/insight-common/config/ipo';

// バージョン確認
if (data.version !== IPO_SCHEMA_VERSION) {
  // マイグレーションが必要
}

// ノード ID の一意性確認
const allIds = collectAllNodes(data.departments).map(n => n.id);
const duplicates = allIds.filter((id, i) => allIds.indexOf(id) !== i);
```

---

## 5. DX 評価（分析）

型定義: `config/ipo/analysis.ts`

### 5.1 自動化候補の抽出

```typescript
import { extractAutomationCandidates } from '@/insight-common/config/ipo';

const candidates = extractAutomationCandidates(data.departments);
// → executor === 'human' && type === 'task' のノード一覧
```

### 5.2 人手依存率

```typescript
const allNodes = collectAllNodes(data.departments);
const humanNodes = allNodes.filter(n => n.executor === 'human');
const rate = humanNodes.length / allNodes.length;  // 0.0 - 1.0
```

### 5.3 部門間依存関係

ノード間の `output.destination` / `input.source` をトラバースし、
部門 ID が異なる接続を「部門間依存」として検出。
ボトルネック特定に利用する。

---

## 6. TDWH 連携

### 6.1 テキスト → IPO 変換パイプライン

```
TDWH CuratedRecord                    IPO JSON
┌──────────────────┐                 ┌──────────────────┐
│ 経理規程         │                 │ IpoData          │
│ 月次決算マニュアル│  → AI 抽出 →   │  └ 経理部         │
│ 定例会議事録     │                 │    └ 月次決算     │
└──────────────────┘                 └──────────────────┘
```

型定義: `config/tdwh/ipo-bridge.ts`

### 6.2 テキスト種別ごとの抽出ヒント

| テキスト種別 | 抽出の焦点 | 期待されるノード |
|-------------|-----------|-----------------|
| 議事録 | 決定事項・アクション | department, process, task |
| マニュアル | 手順・ツール・入出力 | process, task |
| 法令条文 | ルール・制約条件 | process, task |
| ヒアリング | As-Is 業務フロー | department, process, task |
| 報告書 | KPI 実績・課題 | process, task |

### 6.3 差分追従

テキストが更新された場合、`IpoDiff` で既存 IPO 構造との差分を検出し、
更新提案として提示する。人間がレビュー・承認後に IPO データを更新。

---

## 7. 製品別利用パターン

| 製品 | IPO の利用方法 |
|------|---------------|
| **InsightProcess** | IPO の閲覧・編集・可視化（ビューワー/エディター） |
| **INCA** | As-Is の IPO 構造を分析し、RPA 移行の自動化候補を特定 |
| **INBT** | IPO ノードを Orchestrator のジョブ/ワークフローにマッピング |
| **IVIN** | ヒアリング音声/テキストから IPO 構造を自動生成 |
| **construction-tdwh** | 建設業テキストから IPO 構造を抽出（TDWH → IPO ブリッジ） |

---

## 8. チェックリスト

- [ ] `IpoNode.id` が命名規則に従っている
- [ ] 全タスクに `executor` が設定されている
- [ ] 入出力の `source` / `destination` が有効なノード ID を参照している
- [ ] `process.duration` が設定されている（所要時間の可視化に必要）
- [ ] 課題は `issues[]` に具体的に記載されている
- [ ] JSON バリデーションが通る

---

*IPO 設計標準 v1.0.0 — 業務を関数として構造化し、組織全体を可視化する*
