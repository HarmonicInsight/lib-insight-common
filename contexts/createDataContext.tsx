/**
 * createDataContext - 汎用データコンテキストファクトリー
 *
 * アプリ間で共通のデータ管理パターンを提供:
 * - ローカルストレージ永続化
 * - CRUD操作
 * - ローディング状態管理
 *
 * @example
 * ```tsx
 * // contexts/TodoContext.tsx
 * import { createDataContext } from '@/insight-common/contexts/createDataContext';
 *
 * interface Todo {
 *   id: string;
 *   title: string;
 *   status: 'todo' | 'done';
 * }
 *
 * const {
 *   Provider: TodoProvider,
 *   useContext: useTodos,
 * } = createDataContext<Todo>({
 *   storageKey: 'app_todos',
 *   generateId: () => crypto.randomUUID(),
 * });
 *
 * export { TodoProvider, useTodos };
 * ```
 */

import React, {
  createContext,
  useContext as useReactContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// ストレージアダプター型
export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// デフォルト: Web localStorage
const webStorageAdapter: StorageAdapter = {
  getItem: async (key) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// 基本的なエンティティ型
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// コンテキスト設定
export interface DataContextConfig<T extends BaseEntity> {
  /** ストレージキー */
  storageKey: string;
  /** ID生成関数 */
  generateId?: () => string;
  /** ストレージアダプター（デフォルト: localStorage） */
  storageAdapter?: StorageAdapter;
  /** 初期データ */
  initialData?: T[];
  /** データ正規化関数（読み込み時） */
  normalize?: (data: T[]) => T[];
  /** デバッグモード */
  debug?: boolean;
}

// コンテキスト値の型
export interface DataContextValue<T extends BaseEntity> {
  /** データ配列 */
  items: T[];
  /** データをセット */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  /** ローディング状態 */
  isLoaded: boolean;
  /** エラー */
  error: string | null;

  // CRUD操作
  /** 作成 */
  create: (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => T;
  /** 更新 */
  update: (id: string, updates: Partial<Omit<T, 'id'>>) => void;
  /** 削除 */
  remove: (id: string) => void;
  /** ID検索 */
  findById: (id: string) => T | undefined;
  /** 全削除 */
  clear: () => void;
}

// UUID生成（デフォルト）
function defaultGenerateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * データコンテキストを作成
 */
export function createDataContext<T extends BaseEntity>(
  config: DataContextConfig<T>
) {
  const {
    storageKey,
    generateId = defaultGenerateId,
    storageAdapter = webStorageAdapter,
    initialData = [],
    normalize,
    debug = false,
  } = config;

  // コンテキスト作成
  const Context = createContext<DataContextValue<T> | undefined>(undefined);

  // プロバイダーコンポーネント
  function Provider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<T[]>(initialData);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 初期ロード
    useEffect(() => {
      const load = async () => {
        try {
          const saved = await storageAdapter.getItem(storageKey);
          if (saved) {
            let parsed = JSON.parse(saved) as T[];
            if (normalize) {
              parsed = normalize(parsed);
            }
            setItems(parsed);
            if (debug) console.log(`[DataContext:${storageKey}] Loaded ${parsed.length} items`);
          }
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Failed to load data';
          console.error(`[DataContext:${storageKey}] Load error:`, e);
          setError(errorMsg);
        }
        setIsLoaded(true);
      };
      load();
    }, []);

    // 保存
    useEffect(() => {
      if (isLoaded) {
        storageAdapter.setItem(storageKey, JSON.stringify(items)).catch((e) => {
          console.error(`[DataContext:${storageKey}] Save error:`, e);
        });
        if (debug) console.log(`[DataContext:${storageKey}] Saved ${items.length} items`);
      }
    }, [items, isLoaded]);

    // 作成
    const create = useCallback(
      (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T => {
        const now = new Date().toISOString();
        const newItem = {
          ...item,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        } as T;
        setItems((prev) => [newItem, ...prev]);
        if (debug) console.log(`[DataContext:${storageKey}] Created:`, newItem.id);
        return newItem;
      },
      [generateId]
    );

    // 更新
    const update = useCallback((id: string, updates: Partial<Omit<T, 'id'>>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        )
      );
      if (debug) console.log(`[DataContext:${storageKey}] Updated:`, id);
    }, []);

    // 削除
    const remove = useCallback((id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (debug) console.log(`[DataContext:${storageKey}] Removed:`, id);
    }, []);

    // ID検索
    const findById = useCallback(
      (id: string): T | undefined => {
        return items.find((item) => item.id === id);
      },
      [items]
    );

    // 全削除
    const clear = useCallback(() => {
      setItems([]);
      if (debug) console.log(`[DataContext:${storageKey}] Cleared`);
    }, []);

    return (
      <Context.Provider
        value={{
          items,
          setItems,
          isLoaded,
          error,
          create,
          update,
          remove,
          findById,
          clear,
        }}
      >
        {children}
      </Context.Provider>
    );
  }

  // フック
  function useContext(): DataContextValue<T> {
    const context = useReactContext(Context);
    if (!context) {
      throw new Error(
        `useContext must be used within a ${storageKey} Provider`
      );
    }
    return context;
  }

  return {
    Provider,
    useContext,
    Context,
  };
}

/**
 * AsyncStorage用アダプター（React Native）
 *
 * @example
 * ```tsx
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * import { createAsyncStorageAdapter } from '@/insight-common/contexts/createDataContext';
 *
 * const asyncStorageAdapter = createAsyncStorageAdapter(AsyncStorage);
 *
 * const { Provider, useContext } = createDataContext({
 *   storageKey: 'todos',
 *   storageAdapter: asyncStorageAdapter,
 * });
 * ```
 */
export function createAsyncStorageAdapter(AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}): StorageAdapter {
  return {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  };
}

export default createDataContext;
