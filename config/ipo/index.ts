/**
 * IPO (Input-Process-Output) 業務プロセスモデル — バレルエクスポート
 */

// コア型
export type {
  ExecutorType,
  NodeType,
  ViewType,
  IpoInput,
  IpoOutput,
  IpoProcess,
  IpoKpi,
  IpoNode,
  IpoData,
  IpoDataMetadata,
  BreadcrumbItem,
  ExecutorConfig,
} from './types';

export { EXECUTOR_CONFIGS, IPO_SCHEMA_VERSION } from './types';

// DX 分析型
export type {
  AutomationComplexity,
  AutomationCandidate,
  IssueSeverity,
  IssueCategory,
  ProcessIssue,
  CrossDepartmentEdge,
  DxAssessment,
} from './analysis';

export {
  collectAllNodes,
  findNodeById,
  buildNodePath,
  extractAutomationCandidates,
  extractNodesWithIssues,
} from './analysis';
