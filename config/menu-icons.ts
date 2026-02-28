/**
 * メニューアイコン標準化モジュール
 *
 * brand/menu-icons.json のソースオブトゥルースを元に、
 * 全 Insight Business Suite / Insight Series 製品で統一されたアイコン名を提供する。
 *
 * アイコンライブラリ: Lucide Icons (https://lucide.dev/icons)
 * スタイル: outline, strokeWidth 1.5
 *
 * @example
 * ```typescript
 * import { getMenuIcon, getMenuIconsByCategory, getMenuIconsForProduct, validateMenuIconUsage } from '@/insight-common/config/menu-icons';
 *
 * // 単一アイコン取得
 * const icon = getMenuIcon('save');
 * // → { icon: 'Save', label: { ja: '保存', en: 'Save' }, shortcut: 'Ctrl+S', products: ['all'] }
 *
 * // カテゴリ別一覧
 * const fileIcons = getMenuIconsByCategory('file');
 *
 * // 製品別の全アイコン
 * const ioshIcons = getMenuIconsForProduct('IOSH');
 *
 * // バリデーション
 * const result = validateMenuIconUsage('IOSH', [
 *   { actionId: 'save', usedIcon: 'Save' },        // OK
 *   { actionId: 'save', usedIcon: 'FloppyDisk' },   // NG — 非標準
 * ]);
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Lucide Icons のアイコン名（PascalCase） */
export type LucideIconName = string;

/** 製品コード */
export type ProductCode =
  | 'INSS' | 'IOSH' | 'IOSD' | 'INPY' | 'ISOF'
  | 'INBT' | 'INCA' | 'IVIN'
  | 'INMV' | 'INIG'
  | 'LAUNCHER' | 'CAMERA' | 'VOICE_CLOCK' | 'QR' | 'PINBOARD' | 'VOICE_MEMO'
  | 'VOICE_TASK_CALENDAR' | 'CONSUL_EVAL';

/** アイコンサイズ */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

/** アイコンサイズのピクセル値 */
export const ICON_SIZES: Record<IconSize, string> = {
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px',
} as const;

/** アイコンスタイル設定 */
export const ICON_STYLE = {
  library: 'Lucide Icons',
  libraryUrl: 'https://lucide.dev/icons',
  type: 'outline' as const,
  strokeWidth: 1.5,
} as const;

/** メニューアイコン定義 */
export interface MenuIconEntry {
  /** Lucide Icons のアイコン名（PascalCase） */
  icon: LucideIconName;
  /** 日英ラベル */
  label: { ja: string; en: string };
  /** キーボードショートカット（任意） */
  shortcut?: string;
  /** 対象製品。'all' は全製品 */
  products: (ProductCode | 'all')[];
}

/** カテゴリ定義 */
export interface MenuIconCategory {
  label: { ja: string; en: string };
  icons: Record<string, MenuIconEntry>;
}

/** バリデーション結果 */
export interface MenuIconValidationResult {
  valid: boolean;
  errors: MenuIconValidationError[];
  warnings: MenuIconValidationWarning[];
}

export interface MenuIconValidationError {
  actionId: string;
  expected: LucideIconName;
  actual: LucideIconName;
  message: string;
  messageJa: string;
}

export interface MenuIconValidationWarning {
  actionId: string;
  message: string;
  messageJa: string;
}

/** バリデーションに渡すアイコン使用状況 */
export interface MenuIconUsage {
  /** アクション ID（brand/menu-icons.json の icons 内のキー） */
  actionId: string;
  /** 実際に使用されている Lucide アイコン名 */
  usedIcon: LucideIconName;
}

// ---------------------------------------------------------------------------
// Icon Registry (from brand/menu-icons.json)
// ---------------------------------------------------------------------------

/**
 * メニューアイコンカテゴリ一覧
 *
 * brand/menu-icons.json と同期。変更は JSON 側を先に更新すること。
 */
export const MENU_ICON_CATEGORIES = [
  'file',
  'edit',
  'view',
  'insert',
  'format',
  'tools',
  'slide',
  'sheet',
  'document',
  'ai',
  'version_history',
  'collaboration',
  'navigation',
  'settings_and_system',
  'status',
  'business_tools',
  'media',
  'senior',
] as const;

export type MenuIconCategoryId = typeof MENU_ICON_CATEGORIES[number];

/**
 * 全メニューアイコン定義
 *
 * カテゴリ → アクション ID → アイコン定義
 */
export const MENU_ICONS: Record<MenuIconCategoryId, MenuIconCategory> = {
  // ---- ファイル操作 ----
  file: {
    label: { ja: 'ファイル操作', en: 'File Operations' },
    icons: {
      new:         { icon: 'FilePlus',    label: { ja: '新規作成', en: 'New' },             shortcut: 'Ctrl+N',       products: ['all'] },
      open:        { icon: 'FolderOpen',  label: { ja: '開く', en: 'Open' },                shortcut: 'Ctrl+O',       products: ['all'] },
      save:        { icon: 'Save',        label: { ja: '保存', en: 'Save' },                shortcut: 'Ctrl+S',       products: ['all'] },
      save_as:     { icon: 'SaveAll',     label: { ja: '名前を付けて保存', en: 'Save As' }, shortcut: 'Ctrl+Shift+S', products: ['all'] },
      import:      { icon: 'FileInput',   label: { ja: 'インポート', en: 'Import' },        products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      export:      { icon: 'FileOutput',  label: { ja: 'エクスポート', en: 'Export' },       products: ['all'] },
      export_pdf:  { icon: 'FileText',    label: { ja: 'PDF出力', en: 'Export PDF' },        products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      print:       { icon: 'Printer',     label: { ja: '印刷', en: 'Print' },               shortcut: 'Ctrl+P',       products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      close:       { icon: 'X',           label: { ja: '閉じる', en: 'Close' },             products: ['all'] },
      quit:        { icon: 'LogOut',      label: { ja: '終了', en: 'Quit' },                shortcut: 'Ctrl+Q',       products: ['all'] },
      recent:      { icon: 'Clock',       label: { ja: '最近使用', en: 'Recent' },          products: ['all'] },
      file_info:   { icon: 'FileSearch',  label: { ja: 'ファイル情報', en: 'File Info' },    products: ['INSS', 'IOSH', 'IOSD'] },
    },
  },

  // ---- 編集操作 ----
  edit: {
    label: { ja: '編集操作', en: 'Edit Operations' },
    icons: {
      undo:        { icon: 'Undo2',           label: { ja: '元に戻す', en: 'Undo' },         shortcut: 'Ctrl+Z',       products: ['all'] },
      redo:        { icon: 'Redo2',           label: { ja: 'やり直す', en: 'Redo' },         shortcut: 'Ctrl+Shift+Z', products: ['all'] },
      cut:         { icon: 'Scissors',        label: { ja: '切り取り', en: 'Cut' },          shortcut: 'Ctrl+X',       products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      copy:        { icon: 'Copy',            label: { ja: 'コピー', en: 'Copy' },           shortcut: 'Ctrl+C',       products: ['all'] },
      paste:       { icon: 'ClipboardPaste',  label: { ja: '貼り付け', en: 'Paste' },        shortcut: 'Ctrl+V',       products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      select_all:  { icon: 'CheckSquare',     label: { ja: 'すべて選択', en: 'Select All' }, shortcut: 'Ctrl+A',       products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      find:        { icon: 'Search',          label: { ja: '検索', en: 'Find' },             shortcut: 'Ctrl+F',       products: ['all'] },
      find_replace: { icon: 'Replace',        label: { ja: '検索と置換', en: 'Find & Replace' }, shortcut: 'Ctrl+H',  products: ['INSS', 'IOSH', 'IOSD'] },
      edit_item:   { icon: 'Pencil',          label: { ja: '編集', en: 'Edit' },             products: ['all'] },
      delete:      { icon: 'Trash2',          label: { ja: '削除', en: 'Delete' },           products: ['all'] },
      duplicate:   { icon: 'CopyPlus',        label: { ja: '複製', en: 'Duplicate' },        shortcut: 'Ctrl+D',       products: ['all'] },
      rename:      { icon: 'PencilLine',      label: { ja: '名前を変更', en: 'Rename' },     shortcut: 'F2',           products: ['all'] },
    },
  },

  // ---- 表示操作 ----
  view: {
    label: { ja: '表示操作', en: 'View Operations' },
    icons: {
      zoom_in:        { icon: 'ZoomIn',         label: { ja: '拡大', en: 'Zoom In' },               shortcut: 'Ctrl++', products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      zoom_out:       { icon: 'ZoomOut',        label: { ja: '縮小', en: 'Zoom Out' },              shortcut: 'Ctrl+-', products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      zoom_reset:     { icon: 'Maximize2',      label: { ja: '100%表示', en: 'Reset Zoom' },        shortcut: 'Ctrl+0', products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      fullscreen:     { icon: 'Maximize',        label: { ja: '全画面', en: 'Fullscreen' },          shortcut: 'F11',    products: ['all'] },
      sidebar_toggle: { icon: 'PanelLeftClose',  label: { ja: 'サイドバー表示切替', en: 'Toggle Sidebar' }, products: ['all'] },
      grid_view:      { icon: 'LayoutGrid',      label: { ja: 'グリッド表示', en: 'Grid View' },     products: ['IOSH'] },
      list_view:      { icon: 'List',             label: { ja: 'リスト表示', en: 'List View' },       products: ['all'] },
      preview:        { icon: 'Eye',              label: { ja: 'プレビュー', en: 'Preview' },          products: ['INSS', 'IOSD'] },
      split_view:     { icon: 'Columns2',         label: { ja: '分割表示', en: 'Split View' },        products: ['IOSH', 'IOSD'] },
      freeze_panes:   { icon: 'Lock',             label: { ja: 'ウィンドウ枠の固定', en: 'Freeze Panes' }, products: ['IOSH', 'ISOF'] },
    },
  },

  // ---- 挿入操作 ----
  insert: {
    label: { ja: '挿入操作', en: 'Insert Operations' },
    icons: {
      add:                  { icon: 'Plus',              label: { ja: '追加', en: 'Add' },                      products: ['all'] },
      insert_image:         { icon: 'Image',             label: { ja: '画像挿入', en: 'Insert Image' },          products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      insert_table:         { icon: 'Table',             label: { ja: '表挿入', en: 'Insert Table' },            products: ['INSS', 'IOSD'] },
      insert_chart:         { icon: 'BarChart3',         label: { ja: 'グラフ挿入', en: 'Insert Chart' },        products: ['INSS', 'IOSH', 'IOSD'] },
      insert_shape:         { icon: 'Shapes',            label: { ja: '図形挿入', en: 'Insert Shape' },          products: ['INSS', 'IOSH', 'IOSD'] },
      insert_link:          { icon: 'Link',              label: { ja: 'リンク挿入', en: 'Insert Link' },         products: ['INSS', 'IOSH', 'IOSD'] },
      insert_comment:       { icon: 'MessageSquarePlus', label: { ja: 'コメント挿入', en: 'Insert Comment' },    products: ['INSS', 'IOSH', 'IOSD'] },
      insert_formula:       { icon: 'Calculator',        label: { ja: '数式挿入', en: 'Insert Formula' },        products: ['IOSH', 'ISOF'] },
      insert_media:         { icon: 'Film',              label: { ja: 'メディア挿入', en: 'Insert Media' },      products: ['INSS'] },
      insert_text_box:      { icon: 'TextCursorInput',   label: { ja: 'テキストボックス', en: 'Text Box' },      products: ['INSS', 'IOSD'] },
      insert_bookmark:      { icon: 'Bookmark',          label: { ja: 'ブックマーク', en: 'Bookmark' },          products: ['IOSD'] },
      insert_footnote:      { icon: 'Footprints',        label: { ja: '脚注', en: 'Footnote' },                  products: ['IOSD'] },
      insert_header_footer: { icon: 'PanelTop',          label: { ja: 'ヘッダー・フッター', en: 'Header & Footer' }, products: ['INSS', 'IOSD'] },
      insert_page_break:    { icon: 'SeparatorHorizontal', label: { ja: '改ページ', en: 'Page Break' },          products: ['IOSD'] },
      insert_symbol:        { icon: 'Omega',             label: { ja: '記号と特殊文字', en: 'Symbol' },           products: ['IOSD'] },
    },
  },

  // ---- 書式操作 ----
  format: {
    label: { ja: '書式操作', en: 'Format Operations' },
    icons: {
      bold:               { icon: 'Bold',             label: { ja: '太字', en: 'Bold' },               shortcut: 'Ctrl+B', products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      italic:             { icon: 'Italic',           label: { ja: '斜体', en: 'Italic' },             shortcut: 'Ctrl+I', products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      underline:          { icon: 'Underline',        label: { ja: '下線', en: 'Underline' },           shortcut: 'Ctrl+U', products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      strikethrough:      { icon: 'Strikethrough',    label: { ja: '取り消し線', en: 'Strikethrough' }, products: ['INSS', 'IOSD'] },
      font_color:         { icon: 'Palette',          label: { ja: '文字色', en: 'Font Color' },        products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      highlight:          { icon: 'Highlighter',      label: { ja: '蛍光ペン', en: 'Highlight' },       products: ['IOSD'] },
      align_left:         { icon: 'AlignLeft',        label: { ja: '左揃え', en: 'Align Left' },        products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      align_center:       { icon: 'AlignCenter',      label: { ja: '中央揃え', en: 'Align Center' },    products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      align_right:        { icon: 'AlignRight',       label: { ja: '右揃え', en: 'Align Right' },       products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      align_justify:      { icon: 'AlignJustify',     label: { ja: '両端揃え', en: 'Justify' },         products: ['IOSD'] },
      list_bullet:        { icon: 'List',             label: { ja: '箇条書き', en: 'Bullet List' },     products: ['INSS', 'IOSD'] },
      list_ordered:       { icon: 'ListOrdered',      label: { ja: '番号付きリスト', en: 'Ordered List' }, products: ['INSS', 'IOSD'] },
      indent_increase:    { icon: 'IndentIncrease',   label: { ja: 'インデント増', en: 'Increase Indent' }, products: ['INSS', 'IOSD'] },
      indent_decrease:    { icon: 'IndentDecrease',   label: { ja: 'インデント減', en: 'Decrease Indent' }, products: ['INSS', 'IOSD'] },
      merge_cells:        { icon: 'TableCellsMerge',  label: { ja: 'セル結合', en: 'Merge Cells' },     products: ['IOSH', 'ISOF'] },
      conditional_format: { icon: 'PaintBucket',      label: { ja: '条件付き書式', en: 'Conditional Format' }, products: ['IOSH'] },
      number_format:      { icon: 'Hash',             label: { ja: '表示形式', en: 'Number Format' },   products: ['IOSH', 'ISOF'] },
      border:             { icon: 'Square',           label: { ja: '罫線', en: 'Border' },              products: ['IOSH', 'IOSD', 'ISOF'] },
      text_wrap:          { icon: 'WrapText',         label: { ja: '折り返し', en: 'Wrap Text' },       products: ['IOSH', 'ISOF'] },
    },
  },

  // ---- ツール ----
  tools: {
    label: { ja: 'ツール', en: 'Tools' },
    icons: {
      spell_check:      { icon: 'SpellCheck',            label: { ja: 'スペルチェック', en: 'Spell Check' },       products: ['INSS', 'IOSH', 'IOSD'] },
      word_count:       { icon: 'LetterText',            label: { ja: '文字カウント', en: 'Word Count' },          products: ['IOSD'] },
      sort:             { icon: 'ArrowUpDown',            label: { ja: 'ソート', en: 'Sort' },                      products: ['IOSH', 'ISOF'] },
      filter:           { icon: 'Filter',                 label: { ja: 'フィルター', en: 'Filter' },                products: ['IOSH', 'ISOF'] },
      pivot_table:      { icon: 'TableProperties',        label: { ja: 'ピボットテーブル', en: 'Pivot Table' },     products: ['IOSH'] },
      data_validation:  { icon: 'ShieldCheck',            label: { ja: 'データ入力規則', en: 'Data Validation' },   products: ['IOSH'] },
      goal_seek:        { icon: 'Target',                 label: { ja: 'ゴールシーク', en: 'Goal Seek' },           products: ['IOSH'] },
      remove_duplicates: { icon: 'ListX',                 label: { ja: '重複の削除', en: 'Remove Duplicates' },     products: ['IOSH'] },
      text_to_columns:  { icon: 'SplitSquareHorizontal',  label: { ja: '区切り位置', en: 'Text to Columns' },       products: ['IOSH'] },
      group:            { icon: 'Group',                   label: { ja: 'グループ化', en: 'Group' },                 products: ['IOSH'] },
      protect_sheet:    { icon: 'ShieldAlert',            label: { ja: 'シート保護', en: 'Protect Sheet' },          products: ['IOSH', 'ISOF'] },
      protect_document: { icon: 'ShieldAlert',            label: { ja: '文書の保護', en: 'Protect Document' },       products: ['IOSD'] },
      track_changes:    { icon: 'GitCompareArrows',       label: { ja: '変更履歴の記録', en: 'Track Changes' },      products: ['IOSD'] },
      mail_merge:       { icon: 'Mails',                  label: { ja: '差し込み印刷', en: 'Mail Merge' },           products: ['IOSD'] },
      table_of_contents: { icon: 'TableOfContents',       label: { ja: '目次生成', en: 'Table of Contents' },        products: ['IOSD'] },
      watermark:        { icon: 'Droplets',               label: { ja: '透かし', en: 'Watermark' },                  products: ['IOSD'] },
      page_setup:       { icon: 'FileSliders',            label: { ja: 'ページ設定', en: 'Page Setup' },             products: ['IOSH', 'IOSD', 'ISOF'] },
      macro:            { icon: 'Play',                   label: { ja: 'マクロ実行', en: 'Run Macro' },              products: ['IOSH', 'IOSD'] },
    },
  },

  // ---- スライド操作 (INSS) ----
  slide: {
    label: { ja: 'スライド操作（INSS 専用）', en: 'Slide Operations (INSS)' },
    icons: {
      add_slide:       { icon: 'PlusSquare',          label: { ja: 'スライド追加', en: 'Add Slide' },         products: ['INSS'] },
      duplicate_slide: { icon: 'CopyPlus',            label: { ja: 'スライド複製', en: 'Duplicate Slide' },   products: ['INSS'] },
      delete_slide:    { icon: 'Trash2',              label: { ja: 'スライド削除', en: 'Delete Slide' },       products: ['INSS'] },
      slide_layout:    { icon: 'LayoutTemplate',      label: { ja: 'レイアウト変更', en: 'Slide Layout' },     products: ['INSS'] },
      slide_master:    { icon: 'Layers',              label: { ja: 'スライドマスター', en: 'Slide Master' },   products: ['INSS'] },
      slide_show:      { icon: 'Presentation',        label: { ja: 'スライドショー', en: 'Slide Show' },       shortcut: 'F5', products: ['INSS'] },
      presenter_view:  { icon: 'Monitor',             label: { ja: '発表者ビュー', en: 'Presenter View' },     products: ['INSS'] },
      transition:      { icon: 'ArrowRightLeft',      label: { ja: '切替効果', en: 'Transition' },             products: ['INSS'] },
      animation:       { icon: 'Sparkles',            label: { ja: 'アニメーション', en: 'Animation' },         products: ['INSS'] },
      speaker_notes:   { icon: 'StickyNote',          label: { ja: '発表者ノート', en: 'Speaker Notes' },       products: ['INSS'] },
      design_theme:    { icon: 'SwatchBook',          label: { ja: 'デザインテーマ', en: 'Design Theme' },      products: ['INSS'] },
      slide_size:      { icon: 'RectangleHorizontal', label: { ja: 'スライドのサイズ', en: 'Slide Size' },      products: ['INSS'] },
    },
  },

  // ---- シート操作 (IOSH/ISOF) ----
  sheet: {
    label: { ja: 'シート操作（IOSH/ISOF 専用）', en: 'Sheet Operations (IOSH/ISOF)' },
    icons: {
      add_sheet:     { icon: 'Plus',       label: { ja: 'シート追加', en: 'Add Sheet' },         products: ['IOSH', 'ISOF'] },
      delete_sheet:  { icon: 'Trash2',     label: { ja: 'シート削除', en: 'Delete Sheet' },       products: ['IOSH', 'ISOF'] },
      rename_sheet:  { icon: 'PencilLine', label: { ja: 'シート名変更', en: 'Rename Sheet' },     products: ['IOSH', 'ISOF'] },
      autofill:      { icon: 'ArrowDown',  label: { ja: 'オートフィル', en: 'AutoFill' },         products: ['IOSH', 'ISOF'] },
      insert_row:    { icon: 'RowsIcon',   label: { ja: '行の挿入', en: 'Insert Row' },           products: ['IOSH', 'ISOF'] },
      insert_column: { icon: 'Columns3',   label: { ja: '列の挿入', en: 'Insert Column' },        products: ['IOSH', 'ISOF'] },
      freeze_row:    { icon: 'Lock',       label: { ja: '先頭行の固定', en: 'Freeze Top Row' },   products: ['IOSH', 'ISOF'] },
      freeze_column: { icon: 'Lock',       label: { ja: '先頭列の固定', en: 'Freeze First Column' }, products: ['IOSH', 'ISOF'] },
    },
  },

  // ---- 文書操作 (IOSD) ----
  document: {
    label: { ja: '文書操作（IOSD 専用）', en: 'Document Operations (IOSD)' },
    icons: {
      heading_styles: { icon: 'Heading',        label: { ja: '見出しスタイル', en: 'Heading Styles' }, products: ['IOSD'] },
      columns:        { icon: 'Columns2',       label: { ja: '段組み', en: 'Columns' },               products: ['IOSD'] },
      line_numbers:   { icon: 'ListOrdered',    label: { ja: '行番号', en: 'Line Numbers' },           products: ['IOSD'] },
      page_border:    { icon: 'Frame',          label: { ja: 'ページ罫線', en: 'Page Border' },        products: ['IOSD'] },
      template:       { icon: 'LayoutTemplate', label: { ja: 'テンプレート', en: 'Template' },          products: ['IOSD'] },
    },
  },

  // ---- AI・アシスタント ----
  ai: {
    label: { ja: 'AI・アシスタント', en: 'AI & Assistant' },
    icons: {
      ai_assistant:    { icon: 'BotMessageSquare', label: { ja: 'AIアシスタント', en: 'AI Assistant' },           products: ['INSS', 'IOSH', 'IOSD', 'ISOF', 'INPY', 'INBT'] },
      ai_code_editor:  { icon: 'Code',             label: { ja: 'AIコードエディター', en: 'AI Code Editor' },     products: ['INSS', 'IOSH', 'IOSD', 'INPY', 'INBT'] },
      voice_input:     { icon: 'Mic',              label: { ja: '音声入力', en: 'Voice Input' },                   products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] },
      voice_readout:   { icon: 'Volume2',           label: { ja: '読み上げ', en: 'Read Aloud' },                   products: ['ISOF'] },
      vrm_avatar:      { icon: 'PersonStanding',    label: { ja: 'VRMアバター', en: 'VRM Avatar' },                products: ['INSS', 'IOSH', 'IOSD'] },
      reference_docs:  { icon: 'BookMarked',         label: { ja: '参考資料', en: 'Reference Docs' },               products: ['INSS', 'IOSH', 'IOSD'] },
      doc_evaluation:  { icon: 'ClipboardCheck',     label: { ja: 'ドキュメント評価', en: 'Document Evaluation' },   products: ['INSS', 'IOSH', 'IOSD'] },
      ai_memory:       { icon: 'Brain',              label: { ja: 'AIメモリ', en: 'AI Memory' },                     products: ['INSS', 'IOSH', 'IOSD'] },
    },
  },

  // ---- バージョン・履歴 ----
  version_history: {
    label: { ja: 'バージョン・履歴', en: 'Version & History' },
    icons: {
      history:          { icon: 'History',          label: { ja: '変更履歴', en: 'History' },             products: ['IOSH', 'IOSD'] },
      version_compare:  { icon: 'GitCompareArrows', label: { ja: 'バージョン比較', en: 'Version Compare' }, products: ['IOSH'] },
      file_compare:     { icon: 'FileDiff',         label: { ja: '2ファイル比較', en: 'Compare Files' },   products: ['INSS', 'IOSH'] },
      changelog:        { icon: 'ScrollText',       label: { ja: '変更ログ', en: 'Change Log' },          products: ['IOSH'] },
      backup:           { icon: 'Archive',          label: { ja: 'バックアップ', en: 'Backup' },           products: ['INSS', 'IOSH'] },
      restore:          { icon: 'RotateCcw',        label: { ja: '復元', en: 'Restore' },                  products: ['INSS', 'IOSH'] },
    },
  },

  // ---- コラボレーション ----
  collaboration: {
    label: { ja: 'コラボレーション', en: 'Collaboration' },
    icons: {
      sticky_note:     { icon: 'StickyNote',      label: { ja: '付箋', en: 'Sticky Note' },            products: ['IOSH'] },
      message:         { icon: 'MessageCircle',   label: { ja: 'メッセージ送信', en: 'Send Message' }, products: ['IOSH'] },
      bulletin_board:  { icon: 'Newspaper',       label: { ja: '掲示板', en: 'Bulletin Board' },       products: ['IOSH'] },
      comment:         { icon: 'MessageSquare',   label: { ja: 'コメント', en: 'Comment' },            products: ['INSS', 'IOSH', 'IOSD'] },
      share:           { icon: 'Share2',          label: { ja: '共有', en: 'Share' },                   products: ['all'] },
      cloud_sync:      { icon: 'CloudUpload',     label: { ja: 'クラウド同期', en: 'Cloud Sync' },     products: ['IOSH', 'INPY', 'INBT', 'INIG'] },
    },
  },

  // ---- ナビゲーション ----
  navigation: {
    label: { ja: 'ナビゲーション', en: 'Navigation' },
    icons: {
      home:           { icon: 'Home',             label: { ja: 'ホーム', en: 'Home' },             products: ['all'] },
      dashboard:      { icon: 'LayoutDashboard',  label: { ja: 'ダッシュボード', en: 'Dashboard' }, products: ['all'] },
      projects:       { icon: 'FolderOpen',       label: { ja: 'プロジェクト', en: 'Projects' },   products: ['all'] },
      favorites:      { icon: 'Star',             label: { ja: 'お気に入り', en: 'Favorites' },     products: ['all'] },
      notifications:  { icon: 'Bell',             label: { ja: '通知', en: 'Notifications' },       products: ['all'] },
      back:           { icon: 'ArrowLeft',        label: { ja: '戻る', en: 'Back' },                products: ['all'] },
      forward:        { icon: 'ArrowRight',       label: { ja: '進む', en: 'Forward' },             products: ['all'] },
      menu:           { icon: 'Menu',             label: { ja: 'メニュー', en: 'Menu' },            products: ['all'] },
      more:           { icon: 'MoreHorizontal',   label: { ja: 'その他', en: 'More' },              products: ['all'] },
    },
  },

  // ---- 設定・システム ----
  settings_and_system: {
    label: { ja: '設定・システム', en: 'Settings & System' },
    icons: {
      settings:           { icon: 'Settings',    label: { ja: '設定', en: 'Settings' },             shortcut: 'Ctrl+,', products: ['all'] },
      help:               { icon: 'HelpCircle',  label: { ja: 'ヘルプ', en: 'Help' },               shortcut: 'F1',     products: ['all'] },
      info:               { icon: 'Info',         label: { ja: '情報', en: 'Info' },                 products: ['all'] },
      profile:            { icon: 'User',         label: { ja: 'プロフィール', en: 'Profile' },       products: ['all'] },
      license:            { icon: 'Key',          label: { ja: 'ライセンス', en: 'License' },         products: ['all'] },
      logout:             { icon: 'LogOut',       label: { ja: 'ログアウト', en: 'Logout' },          products: ['all'] },
      appearance:         { icon: 'Palette',      label: { ja: '外観', en: 'Appearance' },            products: ['all'] },
      language:           { icon: 'Languages',    label: { ja: '言語', en: 'Language' },              products: ['all'] },
      updates:            { icon: 'RefreshCw',    label: { ja: 'アップデート確認', en: 'Check Updates' }, products: ['all'] },
      advanced:           { icon: 'Wrench',       label: { ja: '詳細設定', en: 'Advanced' },          products: ['all'] },
      logs:               { icon: 'FileText',     label: { ja: 'ログ', en: 'Logs' },                 products: ['all'] },
      reset:              { icon: 'RotateCcw',    label: { ja: '設定をリセット', en: 'Reset Settings' }, products: ['all'] },
      keyboard_shortcuts: { icon: 'Keyboard',     label: { ja: 'ショートカットキー', en: 'Keyboard Shortcuts' }, products: ['all'] },
    },
  },

  // ---- ステータス表示 ----
  status: {
    label: { ja: 'ステータス表示', en: 'Status Indicators' },
    icons: {
      success:     { icon: 'CheckCircle',    label: { ja: '成功', en: 'Success' },       products: ['all'] },
      error:       { icon: 'XCircle',        label: { ja: 'エラー', en: 'Error' },        products: ['all'] },
      warning:     { icon: 'AlertTriangle',  label: { ja: '警告', en: 'Warning' },        products: ['all'] },
      info_status: { icon: 'Info',           label: { ja: '情報', en: 'Info' },            products: ['all'] },
      loading:     { icon: 'Loader2',        label: { ja: '読み込み中', en: 'Loading' },   products: ['all'] },
      check:       { icon: 'Check',          label: { ja: 'チェック', en: 'Check' },       products: ['all'] },
    },
  },

  // ---- 業務ツール (Tier 1) ----
  business_tools: {
    label: { ja: '業務ツール（Tier 1）', en: 'Business Tools (Tier 1)' },
    icons: {
      rpa_script:            { icon: 'FileCode',          label: { ja: 'RPAスクリプト', en: 'RPA Script' },              products: ['INBT'] },
      preset:                { icon: 'LayoutList',        label: { ja: 'プリセット', en: 'Preset' },                     products: ['INBT', 'INPY'] },
      orchestrator:          { icon: 'Network',           label: { ja: 'オーケストレーター', en: 'Orchestrator' },        products: ['INBT'] },
      agent:                 { icon: 'MonitorSmartphone', label: { ja: 'Agent管理', en: 'Agent Management' },            products: ['INBT'] },
      scheduler:             { icon: 'CalendarClock',     label: { ja: 'スケジューラー', en: 'Scheduler' },               products: ['INBT'] },
      job:                   { icon: 'Workflow',          label: { ja: 'JOB', en: 'Job' },                               products: ['INBT'] },
      rpa_analysis:          { icon: 'ScanSearch',        label: { ja: 'RPA解析', en: 'RPA Analysis' },                  products: ['INCA'] },
      lowcode_analysis:      { icon: 'Blocks',            label: { ja: 'ローコード解析', en: 'Low-Code Analysis' },       products: ['INCA'] },
      migration_assessment:  { icon: 'ArrowRightLeft',    label: { ja: '移行アセスメント', en: 'Migration Assessment' },  products: ['INCA'] },
      interview_list:        { icon: 'Users',             label: { ja: '面接一覧', en: 'Interviews' },                    products: ['IVIN'] },
      evaluation:            { icon: 'ClipboardCheck',    label: { ja: '評価', en: 'Evaluation' },                        products: ['IVIN'] },
      question_bank:         { icon: 'MessageSquare',     label: { ja: '質問集', en: 'Question Bank' },                   products: ['IVIN'] },
    },
  },

  // ---- メディアツール (Tier 2) ----
  media: {
    label: { ja: 'メディアツール（Tier 2）', en: 'Media Tools (Tier 2)' },
    icons: {
      video_generate:    { icon: 'Video',        label: { ja: '動画生成', en: 'Generate Video' },               products: ['INMV'] },
      subtitle:          { icon: 'Captions',     label: { ja: '字幕', en: 'Subtitles' },                        products: ['INMV'] },
      transition_effect: { icon: 'ArrowRightLeft', label: { ja: 'トランジション', en: 'Transition' },            products: ['INMV'] },
      pptx_import:       { icon: 'FileInput',    label: { ja: 'PPTX取込', en: 'Import PPTX' },                  products: ['INMV'] },
      image_generate:    { icon: 'ImagePlus',    label: { ja: '画像生成', en: 'Generate Image' },                products: ['INIG'] },
      batch_generate:    { icon: 'Images',       label: { ja: 'バッチ生成', en: 'Batch Generate' },              products: ['INIG'] },
      voice_generate:    { icon: 'AudioLines',   label: { ja: '音声生成', en: 'Generate Voice' },                products: ['INIG'] },
      character_prompt:  { icon: 'UserCircle',   label: { ja: 'キャラクタープロンプト', en: 'Character Prompt' }, products: ['INIG'] },
    },
  },

  // ---- シニア向け (ISOF) ----
  senior: {
    label: { ja: 'シニア向け機能（ISOF 専用）', en: 'Senior Features (ISOF)' },
    icons: {
      font_size_adjust: { icon: 'AArrowUp',       label: { ja: '文字サイズ調整', en: 'Font Size Adjust' }, products: ['ISOF'] },
      icloud_mail:      { icon: 'Mail',            label: { ja: 'iCloudメール', en: 'iCloud Mail' },       products: ['ISOF'] },
      contacts:         { icon: 'Contact',         label: { ja: '連絡先管理', en: 'Contacts' },             products: ['ISOF'] },
      tutorial:         { icon: 'GraduationCap',   label: { ja: 'チュートリアル', en: 'Tutorial' },          products: ['ISOF'] },
      setup_wizard:     { icon: 'Wand2',           label: { ja: '初期設定ウィザード', en: 'Setup Wizard' },  products: ['ISOF'] },
    },
  },
};

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * アクション ID からメニューアイコン定義を取得
 *
 * 全カテゴリを横断検索する。
 *
 * @param actionId - アクション ID（例: 'save', 'undo', 'ai_assistant'）
 * @returns アイコン定義。見つからない場合は undefined
 */
export function getMenuIcon(actionId: string): (MenuIconEntry & { category: MenuIconCategoryId }) | undefined {
  for (const categoryId of MENU_ICON_CATEGORIES) {
    const category = MENU_ICONS[categoryId];
    if (actionId in category.icons) {
      return { ...category.icons[actionId], category: categoryId };
    }
  }
  return undefined;
}

/**
 * カテゴリ別のアイコン一覧を取得
 *
 * @param categoryId - カテゴリ ID（例: 'file', 'edit', 'ai'）
 * @returns カテゴリ定義。見つからない場合は undefined
 */
export function getMenuIconsByCategory(categoryId: MenuIconCategoryId): MenuIconCategory | undefined {
  return MENU_ICONS[categoryId];
}

/**
 * 指定製品で使用可能な全アイコンを取得
 *
 * @param productCode - 製品コード（例: 'IOSH'）
 * @returns アクション ID → アイコン定義のマップ
 */
export function getMenuIconsForProduct(productCode: ProductCode): Record<string, MenuIconEntry & { category: MenuIconCategoryId }> {
  const result: Record<string, MenuIconEntry & { category: MenuIconCategoryId }> = {};

  for (const categoryId of MENU_ICON_CATEGORIES) {
    const category = MENU_ICONS[categoryId];
    for (const [actionId, entry] of Object.entries(category.icons)) {
      if (entry.products.includes('all') || entry.products.includes(productCode)) {
        result[actionId] = { ...entry, category: categoryId };
      }
    }
  }

  return result;
}

/**
 * Lucide アイコン名からアクション ID を逆引き
 *
 * 同じアイコン名が複数のアクションに使われている場合は全て返す。
 *
 * @param iconName - Lucide アイコン名（PascalCase）
 * @returns マッチするアクション ID とカテゴリの配列
 */
export function findActionsByIcon(iconName: LucideIconName): Array<{ actionId: string; category: MenuIconCategoryId; entry: MenuIconEntry }> {
  const results: Array<{ actionId: string; category: MenuIconCategoryId; entry: MenuIconEntry }> = [];

  for (const categoryId of MENU_ICON_CATEGORIES) {
    const category = MENU_ICONS[categoryId];
    for (const [actionId, entry] of Object.entries(category.icons)) {
      if (entry.icon === iconName) {
        results.push({ actionId, category: categoryId, entry });
      }
    }
  }

  return results;
}

/**
 * 製品のメニューアイコン使用状況をバリデーション
 *
 * 各アクションに対して標準アイコンが使われているかを検証する。
 *
 * @param productCode - 製品コード
 * @param usages - 実際に使用されているアイコンの一覧
 * @returns バリデーション結果
 */
export function validateMenuIconUsage(
  productCode: ProductCode,
  usages: MenuIconUsage[],
): MenuIconValidationResult {
  const errors: MenuIconValidationError[] = [];
  const warnings: MenuIconValidationWarning[] = [];

  for (const usage of usages) {
    const iconDef = getMenuIcon(usage.actionId);

    if (!iconDef) {
      warnings.push({
        actionId: usage.actionId,
        message: `Unknown action ID: "${usage.actionId}". Not defined in menu-icons registry.`,
        messageJa: `不明なアクション ID: "${usage.actionId}"。menu-icons レジストリに未定義です。`,
      });
      continue;
    }

    // Check if this action is applicable to the product
    if (!iconDef.products.includes('all') && !iconDef.products.includes(productCode)) {
      warnings.push({
        actionId: usage.actionId,
        message: `Action "${usage.actionId}" is not standard for product ${productCode}.`,
        messageJa: `アクション "${usage.actionId}" は製品 ${productCode} の標準ではありません。`,
      });
    }

    // Check if the correct icon is used
    if (usage.usedIcon !== iconDef.icon) {
      errors.push({
        actionId: usage.actionId,
        expected: iconDef.icon,
        actual: usage.usedIcon,
        message: `Action "${usage.actionId}": expected icon "${iconDef.icon}" but found "${usage.usedIcon}".`,
        messageJa: `アクション "${usage.actionId}": 標準アイコン "${iconDef.icon}" が期待されますが "${usage.usedIcon}" が使用されています。`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 全アクション ID の一覧を取得
 */
export function getAllActionIds(): string[] {
  const ids: string[] = [];
  for (const categoryId of MENU_ICON_CATEGORIES) {
    ids.push(...Object.keys(MENU_ICONS[categoryId].icons));
  }
  return ids;
}

/**
 * 全ユニークな Lucide アイコン名の一覧を取得
 */
export function getAllUsedIconNames(): LucideIconName[] {
  const names = new Set<LucideIconName>();
  for (const categoryId of MENU_ICON_CATEGORIES) {
    for (const entry of Object.values(MENU_ICONS[categoryId].icons)) {
      names.add(entry.icon);
    }
  }
  return [...names].sort();
}
