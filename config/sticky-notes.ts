/**
 * InsightOfficeSheet 付箋（Sticky Notes）機能 — 共通型定義
 *
 * ============================================================================
 * 【概要】
 * ============================================================================
 *
 * Excel シート上のセルに付箋（メモ）を貼り付ける機能。
 * バージョン管理と連動し、付箋の追加・編集・削除も変更ログに記録される。
 *
 * ## 主な仕様
 * - セル単位で付箋を配置（1セルに複数可）
 * - 色分け（6色）で視覚的にカテゴリ分け
 * - バージョン管理連動（付箋もバージョン履歴に含まれる）
 * - PRO/ENT: 作成者表示・チームメンバーの付箋も表示
 * - 全プラン利用可能（TRIAL / STD / PRO / ENT）
 *
 * ## 対象製品
 * - IOSH（InsightOfficeSheet）— 初期対応
 * - IOSD（InsightOfficeDoc）— 将来対応予定
 */

// =============================================================================
// 付箋カラー定義
// =============================================================================

/** 付箋カラーID */
export type StickyNoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

/** 付箋カラー定義 */
export interface StickyNoteColorDef {
  id: StickyNoteColor;
  /** 背景色 */
  background: string;
  /** ボーダー色 */
  border: string;
  /** テキスト色 */
  text: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  nameEn: string;
}

/** 利用可能な付箋カラー一覧 */
export const STICKY_NOTE_COLORS: Record<StickyNoteColor, StickyNoteColorDef> = {
  yellow: {
    id: 'yellow',
    background: '#FFF9C4',
    border: '#F9A825',
    text: '#1C1917',
    nameJa: '黄色',
    nameEn: 'Yellow',
  },
  pink: {
    id: 'pink',
    background: '#FCE4EC',
    border: '#E91E63',
    text: '#1C1917',
    nameJa: 'ピンク',
    nameEn: 'Pink',
  },
  blue: {
    id: 'blue',
    background: '#E3F2FD',
    border: '#1976D2',
    text: '#1C1917',
    nameJa: '青',
    nameEn: 'Blue',
  },
  green: {
    id: 'green',
    background: '#E8F5E9',
    border: '#388E3C',
    text: '#1C1917',
    nameJa: '緑',
    nameEn: 'Green',
  },
  orange: {
    id: 'orange',
    background: '#FFF3E0',
    border: '#EF6C00',
    text: '#1C1917',
    nameJa: 'オレンジ',
    nameEn: 'Orange',
  },
  purple: {
    id: 'purple',
    background: '#F3E5F5',
    border: '#7B1FA2',
    text: '#1C1917',
    nameJa: '紫',
    nameEn: 'Purple',
  },
};

// =============================================================================
// 付箋データモデル
// =============================================================================

/** 付箋データ */
export interface StickyNote {
  /** 付箋ID（UUID） */
  id: string;
  /** シート名 */
  sheetName: string;
  /** セル行（0-based） */
  row: number;
  /** セル列（0-based） */
  col: number;
  /** 付箋テキスト */
  text: string;
  /** 付箋カラー */
  color: StickyNoteColor;
  /** 作成者ID */
  authorId: string;
  /** 作成者名 */
  authorName: string;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
  /** 解決済みか（レビュー完了時に解決マーク） */
  resolved: boolean;
  /** 解決日時 */
  resolvedAt: Date | null;
  /** 解決者ID */
  resolvedBy: string | null;
}

/** 付箋の作成リクエスト */
export interface CreateStickyNoteRequest {
  sheetName: string;
  row: number;
  col: number;
  text: string;
  color?: StickyNoteColor;
}

/** 付箋の更新リクエスト */
export interface UpdateStickyNoteRequest {
  text?: string;
  color?: StickyNoteColor;
  resolved?: boolean;
}

// =============================================================================
// 付箋のバージョン管理連動
// =============================================================================

/** 付箋変更アクション（変更ログに記録される） */
export type StickyNoteAction = 'create' | 'update' | 'delete' | 'resolve' | 'unresolve';

/** 付箋変更ログエントリ */
export interface StickyNoteChangeEntry {
  /** 変更ログID */
  id: string;
  /** 付箋ID */
  noteId: string;
  /** アクション */
  action: StickyNoteAction;
  /** 変更前テキスト（update/delete 時） */
  previousText: string | null;
  /** 変更後テキスト（create/update 時） */
  newText: string | null;
  /** 変更前カラー */
  previousColor: StickyNoteColor | null;
  /** 変更後カラー */
  newColor: StickyNoteColor | null;
  /** セル位置（参照用） */
  cellRef: string;
  /** 変更者ID */
  userId: string;
  /** 変更者名 */
  userName: string;
  /** 変更日時 */
  timestamp: Date;
}

// =============================================================================
// 設定・制限
// =============================================================================

/** 付箋機能の設定 */
export const STICKY_NOTES_CONFIG = {
  /** 1セルあたりの最大付箋数 */
  maxNotesPerCell: 5,
  /** 付箋テキストの最大文字数 */
  maxTextLength: 500,
  /** デフォルトカラー */
  defaultColor: 'yellow' as StickyNoteColor,
  /** 解決済み付箋を非表示にするまでの日数（0 = 即非表示） */
  resolvedHideDays: 7,
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * セル参照文字列を生成（例: "A1", "B3"）
 */
export function cellRefFromPosition(row: number, col: number): string {
  let colStr = '';
  let c = col;
  while (c >= 0) {
    colStr = String.fromCharCode(65 + (c % 26)) + colStr;
    c = Math.floor(c / 26) - 1;
  }
  return `${colStr}${row + 1}`;
}

/**
 * 付箋カラー定義を取得
 */
export function getStickyNoteColor(color: StickyNoteColor): StickyNoteColorDef {
  return STICKY_NOTE_COLORS[color];
}

/**
 * 全カラー一覧を取得（UI ピッカー用）
 */
export function getAllStickyNoteColors(): StickyNoteColorDef[] {
  return Object.values(STICKY_NOTE_COLORS);
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  STICKY_NOTE_COLORS,
  STICKY_NOTES_CONFIG,
  cellRefFromPosition,
  getStickyNoteColor,
  getAllStickyNoteColors,
};
