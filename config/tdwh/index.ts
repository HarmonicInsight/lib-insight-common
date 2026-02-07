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
