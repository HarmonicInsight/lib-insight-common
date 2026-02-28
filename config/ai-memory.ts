/**
 * AI メモリシステム定義
 *
 * Anthropic Productivity Plugin の 2 層メモリアーキテクチャを参考に、
 * Insight Business Suite のプロジェクトファイル内でコンテキスト記憶を実現する。
 *
 * 参照: https://github.com/anthropics/knowledge-work-plugins
 *       → productivity/skills/memory-management/SKILL.md
 *
 * 【設計方針】
 * - ホットキャッシュ（ai_memory.json）: ~100 エントリ、90% のデコーディングを処理
 * - ディープストレージ（ai_memory_deep/）: 完全な用語集・人物・プロジェクト情報
 * - プロジェクトファイル（.iosh/.inss/.iosd）内に格納
 * - ユーザー確認なしの自動追加は禁止
 */

import type { PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** メモリエントリの種類 */
export type MemoryEntryType = 'person' | 'glossary' | 'project' | 'preference';

/** 人物エントリ */
export interface PersonEntry {
  type: 'person';
  /** 一意識別子 */
  id: string;
  /** フルネーム */
  name: string;
  /** ニックネーム・略称（デコーディング用） */
  aliases: string[];
  /** 役職 */
  title?: string;
  /** 所属部門・チーム */
  department?: string;
  /** 関連プロジェクト */
  relatedProjects: string[];
  /** メモ */
  notes?: string;
  /** 最終参照日（ISO 8601） */
  lastReferencedAt: string;
  /** 参照回数 */
  referenceCount: number;
}

/** 用語エントリ */
export interface GlossaryEntry {
  type: 'glossary';
  /** 一意識別子 */
  id: string;
  /** 略語・専門用語 */
  term: string;
  /** 展開形・正式名称 */
  expansion: string;
  /** 説明 */
  description?: string;
  /** カテゴリ（社内略語 / 業界用語 / 技術用語） */
  category: 'internal' | 'industry' | 'technical';
  /** 最終参照日 */
  lastReferencedAt: string;
  /** 参照回数 */
  referenceCount: number;
}

/** プロジェクトエントリ */
export interface ProjectEntry {
  type: 'project';
  /** 一意識別子 */
  id: string;
  /** プロジェクト名 */
  name: string;
  /** コードネーム・略称 */
  aliases: string[];
  /** ステータス */
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  /** 説明 */
  description?: string;
  /** 関連人物 */
  relatedPeople: string[];
  /** 主要マイルストーン */
  milestones?: string[];
  /** 最終参照日 */
  lastReferencedAt: string;
  /** 参照回数 */
  referenceCount: number;
}

/** ユーザー設定エントリ */
export interface PreferenceEntry {
  type: 'preference';
  /** 一意識別子 */
  id: string;
  /** 設定キー */
  key: string;
  /** 設定値 */
  value: string;
  /** 説明 */
  description?: string;
  /** 最終参照日 */
  lastReferencedAt: string;
  /** 参照回数 */
  referenceCount: number;
}

/** メモリエントリ（ユニオン型） */
export type MemoryEntry = PersonEntry | GlossaryEntry | ProjectEntry | PreferenceEntry;

/** ホットキャッシュ（ai_memory.json） */
export interface HotCache {
  /** スキーマバージョン */
  version: '1.0';
  /** 最終更新日 */
  lastUpdatedAt: string;
  /** エントリ一覧 */
  entries: MemoryEntry[];
}

/** ディープストレージ（ai_memory_deep/） */
export interface DeepStorage {
  /** 完全用語集 */
  glossary: GlossaryEntry[];
  /** 人物詳細 */
  people: PersonEntry[];
  /** プロジェクト詳細 */
  projects: ProjectEntry[];
  /** 組織コンテキスト */
  context: {
    companyName?: string;
    departments?: string[];
    tools?: string[];
    processes?: string[];
  };
}

// =============================================================================
// プラン別制限
// =============================================================================

/** プラン別メモリ制限 */
export interface MemoryLimits {
  /** ホットキャッシュ最大エントリ数 */
  hotCacheMaxEntries: number;
  /** ディープストレージ最大エントリ数（-1 = 無制限） */
  deepStorageMaxEntries: number;
  /** メモリ機能の利用可否 */
  enabled: boolean;
}

/** プラン別メモリ制限定義 */
export const MEMORY_LIMITS_BY_PLAN: Record<PlanCode, MemoryLimits> = {
  TRIAL: {
    hotCacheMaxEntries: 50,
    deepStorageMaxEntries: 200,
    enabled: true,
  },
  STD: {
    hotCacheMaxEntries: 20,
    deepStorageMaxEntries: -1, // ディープストレージなし（0ではなく無効化）
    enabled: true,
  },
  PRO: {
    hotCacheMaxEntries: 100,
    deepStorageMaxEntries: 500,
    enabled: true,
  },
  ENT: {
    hotCacheMaxEntries: -1,  // 無制限
    deepStorageMaxEntries: -1, // 無制限
    enabled: true,
  },
};

// =============================================================================
// プロジェクトファイル内のパス定義
// =============================================================================

/**
 * プロジェクトファイル（.iosh/.inss/.iosd）内のメモリファイルパス
 *
 * プロジェクトファイルは ZIP 形式であり、以下のパスでメモリデータを格納:
 */
export const MEMORY_FILE_PATHS = {
  /** ホットキャッシュ */
  hotCache: 'ai_memory.json',
  /** ディープストレージ: 用語集 */
  deepGlossary: 'ai_memory_deep/glossary.json',
  /** ディープストレージ: 人物 */
  deepPeople: 'ai_memory_deep/people.json',
  /** ディープストレージ: プロジェクト */
  deepProjects: 'ai_memory_deep/projects.json',
  /** ディープストレージ: 組織コンテキスト */
  deepContext: 'ai_memory_deep/context.json',
} as const;

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * メモリ機能が利用可能か確認
 */
export function isMemoryEnabled(plan: PlanCode): boolean {
  return MEMORY_LIMITS_BY_PLAN[plan]?.enabled ?? false;
}

/**
 * ディープストレージが利用可能か確認
 */
export function isDeepStorageEnabled(plan: PlanCode): boolean {
  const limits = MEMORY_LIMITS_BY_PLAN[plan];
  if (!limits) return false;
  return limits.deepStorageMaxEntries !== -1 || plan === 'ENT' || plan === 'PRO' || plan === 'TRIAL';
}

/**
 * ホットキャッシュに空きがあるか確認
 */
export function canAddToHotCache(plan: PlanCode, currentCount: number): boolean {
  const limits = MEMORY_LIMITS_BY_PLAN[plan];
  if (!limits?.enabled) return false;
  if (limits.hotCacheMaxEntries === -1) return true; // 無制限
  return currentCount < limits.hotCacheMaxEntries;
}

/**
 * ディープストレージに空きがあるか確認
 */
export function canAddToDeepStorage(plan: PlanCode, currentCount: number): boolean {
  const limits = MEMORY_LIMITS_BY_PLAN[plan];
  if (!limits?.enabled) return false;
  if (!isDeepStorageEnabled(plan)) return false;
  if (limits.deepStorageMaxEntries === -1) return true; // 無制限
  return currentCount < limits.deepStorageMaxEntries;
}

/**
 * 空のホットキャッシュを生成
 */
export function createEmptyHotCache(): HotCache {
  return {
    version: '1.0',
    lastUpdatedAt: new Date().toISOString(),
    entries: [],
  };
}

/**
 * 空のディープストレージを生成
 */
export function createEmptyDeepStorage(): DeepStorage {
  return {
    glossary: [],
    people: [],
    projects: [],
    context: {},
  };
}

/**
 * メモリエントリの参照回数を更新
 *
 * 参照回数に基づいてホットキャッシュ ↔ ディープストレージ間の
 * 昇格・降格を判断する材料となる。
 */
export function touchEntry(entry: MemoryEntry): MemoryEntry {
  return {
    ...entry,
    lastReferencedAt: new Date().toISOString(),
    referenceCount: entry.referenceCount + 1,
  };
}

/**
 * ホットキャッシュからの降格候補を取得
 *
 * 参照回数が少なく、最終参照日が古いエントリを返す。
 * ホットキャッシュが上限に達した場合に、ディープストレージへの降格対象を選定。
 */
export function getDemotionCandidates(
  hotCache: HotCache,
  count: number,
): MemoryEntry[] {
  return [...hotCache.entries]
    .sort((a, b) => {
      // 参照回数が少ないものを優先
      if (a.referenceCount !== b.referenceCount) {
        return a.referenceCount - b.referenceCount;
      }
      // 最終参照日が古いものを優先
      return a.lastReferencedAt.localeCompare(b.lastReferencedAt);
    })
    .slice(0, count);
}

/**
 * ディープストレージからの昇格候補を取得
 *
 * 参照回数が多く、最近参照されたエントリを返す。
 */
export function getPromotionCandidates(
  deepStorage: DeepStorage,
  count: number,
): MemoryEntry[] {
  const allEntries: MemoryEntry[] = [
    ...deepStorage.glossary,
    ...deepStorage.people,
    ...deepStorage.projects,
  ];

  return allEntries
    .sort((a, b) => {
      // 参照回数が多いものを優先
      if (a.referenceCount !== b.referenceCount) {
        return b.referenceCount - a.referenceCount;
      }
      // 最終参照日が新しいものを優先
      return b.lastReferencedAt.localeCompare(a.lastReferencedAt);
    })
    .slice(0, count);
}

/**
 * ホットキャッシュ内をキーワード検索
 */
export function searchHotCache(
  hotCache: HotCache,
  query: string,
): MemoryEntry[] {
  const queryLower = query.toLowerCase();

  return hotCache.entries.filter(entry => {
    switch (entry.type) {
      case 'person':
        return (
          entry.name.toLowerCase().includes(queryLower) ||
          entry.aliases.some(a => a.toLowerCase().includes(queryLower)) ||
          (entry.title?.toLowerCase().includes(queryLower) ?? false)
        );
      case 'glossary':
        return (
          entry.term.toLowerCase().includes(queryLower) ||
          entry.expansion.toLowerCase().includes(queryLower)
        );
      case 'project':
        return (
          entry.name.toLowerCase().includes(queryLower) ||
          entry.aliases.some(a => a.toLowerCase().includes(queryLower))
        );
      case 'preference':
        return (
          entry.key.toLowerCase().includes(queryLower) ||
          entry.value.toLowerCase().includes(queryLower)
        );
      default:
        return false;
    }
  });
}

/**
 * メモリエントリをシステムプロンプト用に整形
 *
 * ホットキャッシュの内容を AI が参照しやすい形式に変換。
 * Anthropic の CLAUDE.md（Hot Cache）に相当。
 */
export function formatMemoryForPrompt(
  hotCache: HotCache,
  locale: 'ja' | 'en' = 'ja',
): string {
  if (hotCache.entries.length === 0) return '';

  const people = hotCache.entries.filter((e): e is PersonEntry => e.type === 'person');
  const glossary = hotCache.entries.filter((e): e is GlossaryEntry => e.type === 'glossary');
  const projects = hotCache.entries.filter((e): e is ProjectEntry => e.type === 'project');
  const prefs = hotCache.entries.filter((e): e is PreferenceEntry => e.type === 'preference');

  const sections: string[] = [];

  if (locale === 'ja') {
    if (people.length > 0) {
      sections.push(
        '【関連人物】\n' +
        people.map(p =>
          `- ${p.name}${p.aliases.length > 0 ? `（${p.aliases.join(', ')}）` : ''}${p.title ? ` — ${p.title}` : ''}${p.department ? `（${p.department}）` : ''}`
        ).join('\n')
      );
    }
    if (glossary.length > 0) {
      sections.push(
        '【用語・略語】\n' +
        glossary.map(g => `- ${g.term} = ${g.expansion}${g.description ? `（${g.description}）` : ''}`).join('\n')
      );
    }
    if (projects.length > 0) {
      sections.push(
        '【アクティブプロジェクト】\n' +
        projects.filter(p => p.status === 'active').map(p =>
          `- ${p.name}${p.aliases.length > 0 ? `（${p.aliases.join(', ')}）` : ''}${p.description ? `: ${p.description}` : ''}`
        ).join('\n')
      );
    }
    if (prefs.length > 0) {
      sections.push(
        '【ユーザー設定】\n' +
        prefs.map(p => `- ${p.key}: ${p.value}`).join('\n')
      );
    }
  } else {
    if (people.length > 0) {
      sections.push(
        '[People]\n' +
        people.map(p =>
          `- ${p.name}${p.aliases.length > 0 ? ` (${p.aliases.join(', ')})` : ''}${p.title ? ` — ${p.title}` : ''}`
        ).join('\n')
      );
    }
    if (glossary.length > 0) {
      sections.push(
        '[Glossary]\n' +
        glossary.map(g => `- ${g.term} = ${g.expansion}`).join('\n')
      );
    }
    if (projects.length > 0) {
      sections.push(
        '[Active Projects]\n' +
        projects.filter(p => p.status === 'active').map(p =>
          `- ${p.name}${p.aliases.length > 0 ? ` (${p.aliases.join(', ')})` : ''}`
        ).join('\n')
      );
    }
    if (prefs.length > 0) {
      sections.push(
        '[User Preferences]\n' +
        prefs.map(p => `- ${p.key}: ${p.value}`).join('\n')
      );
    }
  }

  return sections.join('\n\n');
}
