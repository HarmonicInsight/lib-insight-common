/**
 * TDWH (テキストデータウェアハウス) 共通設定エントリポイント
 */

export type {
  // Layer 1: データレイク
  CrawlerType,
  CrawlSchedule,
  SourceDefinition,
  RawDocument,
  // Layer 2: キュレーション
  CurationQuality,
  CurationSourceType,
  CuratedRecord,
  ExtractedEntity,
  CurationConfig,
  // Layer 3: マート
  ChunkStrategyType,
  ChunkStrategyConfig,
  MetadataFieldType,
  MartDefinition,
  ClassificationResult,
  Chunk,
  // Layer 4: ディスパッチ
  MartQuery,
  IntentClassification,
  SearchResult,
  SourceReference,
  IntegrationResult,
  MartStats,
  // TDWH インスタンス
  TdwhInstance,
  // ディスパッチャー設定
  DispatcherConfig,
} from './types';

export { DEFAULT_CURATION_CONFIG, DEFAULT_DISPATCHER_CONFIG } from './types';

export type {
  EmbeddingProvider,
  EmbeddingModelConfig,
  VectorStoreProvider,
  VectorStoreConfig,
} from './embedding-config';

export {
  EMBEDDING_OPENAI_SMALL,
  EMBEDDING_OPENAI_LARGE,
  EMBEDDING_COHERE_MULTILINGUAL,
  EMBEDDING_CONFIGS,
  DEFAULT_EMBEDDING_CONFIG_KEY,
  getEmbeddingConfig,
  LOCAL_CHROMADB_CONFIG,
  PRODUCTION_PGVECTOR_CONFIG,
} from './embedding-config';

// Interview Data Mart
export type {
  InterviewStructuredOutput,
  ProblemCategory,
  SeverityLevel,
  InterviewExtractedProblem,
  InterviewProblemExtractionResult,
  InterviewSignalData,
  InterviewSessionInfo,
  InterviewAnswer,
  InterviewSessionData,
  InterviewMartId,
  InterviewCurationCategory,
  InterviewTemplateDomain,
  DomainMartMapping,
} from './interview-mart';

export {
  INTERVIEW_MART_IDS,
  MART_INTERVIEW_PROBLEMS,
  MART_INTERVIEW_INSIGHTS,
  MART_INTERVIEW_REQUIREMENTS,
  MART_INTERVIEW_RISKS,
  MART_INTERVIEW_KNOWLEDGE,
  MART_INTERVIEW_VOICES,
  ALL_INTERVIEW_MARTS,
  INTERVIEW_SOURCE_DEFINITIONS,
  INTERVIEW_TDWH_INSTANCE,
  INTERVIEW_CURATION_CONFIG,
  INTERVIEW_INTENT_KEYWORDS,
  DOMAIN_MART_MAPPING,
  sessionToRawDocument,
  sessionToCuratedRecords,
  curatedRecordToChunks,
  classifyInterviewIntent,
  getInterviewMart,
  processInterviewSession,
  processInterviewSessions,
  getInterviewMartStats,
  getMartMappingForDomain,
  getRelevantMartIds,
} from './interview-mart';

// Multi-Dimensional Analysis Framework
export type {
  DimensionType,
  HierarchyLevel,
  DimensionDefinition,
  OrganizationNode,
  OrganizationHierarchy,
  TimeGranularity,
  TimeRange,
  DimensionFilter,
  AggregationSpec,
  AnalysisContext,
  AggregationCell,
  MultiDimensionalResult,
  CrossTabCell,
  CrossTabResult,
} from './dimensions';

export {
  DIMENSION_ORGANIZATION,
  DIMENSION_TIME,
  DIMENSION_TOPIC,
  DIMENSION_PROCESS,
  DIMENSION_SEVERITY,
  DIMENSION_GEOGRAPHY,
  ALL_STANDARD_DIMENSIONS,
  INTERVIEW_ANALYSIS_DIMENSIONS,
  extractTimeDimension,
  getDimensionValue,
  filterChunks,
  groupChunks,
  buildAggregationCells,
  analyzeMultiDimensional,
  buildOrganizationHierarchy,
  drillDown,
  rollUp,
  pivotResult,
  createCustomDimension,
  createAnalysisContext,
  buildDimensionSet,
} from './dimensions';

// IPO ブリッジ（TDWH → 業務プロセス構造変換）
export type {
  ExtractedIpoStructure,
  UnresolvedItem,
  IpoExtractionConfig,
  IpoExtractionHint,
  IpoDiff,
  IpoNodeDiff,
} from './ipo-bridge';

export {
  DEFAULT_IPO_EXTRACTION_CONFIG,
  IPO_EXTRACTION_HINTS,
} from './ipo-bridge';
