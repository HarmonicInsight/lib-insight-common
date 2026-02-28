namespace InsightCommon.UI;

/// <summary>
/// Insight Series 共通アイコン定義
///
/// 全製品で統一したSegoe MDL2 Assetsアイコンコードを使用。
/// 絵文字はフォールバックとして定義（パネルヘッダー等で使用可）。
/// </summary>
public static class InsightIcons
{
    // ═══════════════════════════════════════════════════════════════
    // Segoe MDL2 Assets - 主要アイコン
    // ═══════════════════════════════════════════════════════════════

    // ── ファイル操作 ──
    public const string New        = "\uE7C3";   // 新規作成
    public const string Open       = "\uE838";   // 開く (OpenFile)
    public const string Save       = "\uE74E";   // 保存
    public const string SaveAs     = "\uE792";   // 名前を付けて保存
    public const string Export     = "\uE9F9";   // エクスポート
    public const string Import     = "\uE8B5";   // インポート
    public const string Print      = "\uE749";   // 印刷
    public const string Close      = "\uE8BB";   // 閉じる
    public const string Reload     = "\uE72C";   // 再読込
    public const string Delete     = "\uE74D";   // 削除
    public const string Folder     = "\uE8B7";   // フォルダ
    public const string Document   = "\uE8A5";   // ドキュメント
    public const string PDF        = "\uEA90";   // PDF
    public const string Excel      = "\uE9F9";   // Excel（Export兼用）
    public const string Word       = "\uED15";   // Word

    // ── 編集操作 ──
    public const string Cut        = "\uE8C6";   // 切り取り
    public const string Copy       = "\uE8C8";   // コピー
    public const string Paste      = "\uE77F";   // 貼り付け
    public const string Undo       = "\uE7A7";   // 元に戻す
    public const string Redo       = "\uE7A6";   // やり直し
    public const string Search     = "\uE721";   // 検索
    public const string Replace    = "\uE8AC";   // 置換
    public const string Edit       = "\uE70F";   // 編集
    public const string Clear      = "\uE894";   // クリア

    // ── フォント書式 ──
    public const string Bold       = "B";        // 太字（テキスト）
    public const string Italic     = "I";        // 斜体（テキスト）
    public const string Underline  = "U";        // 下線（テキスト）
    public const string FontInc    = "\uE8E8";   // フォント拡大
    public const string FontDec    = "\uE8E7";   // フォント縮小
    public const string Format     = "\uE8A1";   // 書式設定
    public const string Highlight  = "\uE7E6";   // 蛍光ペン

    // ── 配置 ──
    public const string AlignLeft   = "\uE8E4";  // 左揃え
    public const string AlignCenter = "\uE8E3";  // 中央揃え
    public const string AlignRight  = "\uE8E2";  // 右揃え
    public const string AlignTop    = "\uE74A";  // 上揃え
    public const string AlignMiddle = "\uE745";  // 垂直中央
    public const string AlignBottom = "\uE74B";  // 下揃え
    public const string AlignJustify = "\uF0AD"; // 両端揃え
    public const string Wrap        = "\uE8C2";  // 折り返し
    public const string Merge       = "\uE8D8";  // 結合

    // ── 表示・ズーム ──
    public const string ZoomIn     = "\uE8A3";   // 拡大
    public const string ZoomOut    = "\uE71F";   // 縮小
    public const string Grid       = "\uE80A";   // グリッド表示
    public const string View       = "\uE890";   // 表示
    public const string FullScreen = "\uE740";   // 全画面

    // ── パネル関連 ──
    public const string History    = "\uE81C";   // 履歴/バージョン
    public const string ChangeLog  = "\uE7C3";   // 変更ログ
    public const string Board      = "\uE8A5";   // 掲示板
    public const string AI         = "\uE99A";   // AIアシスタント (Robot)
    public const string Chat       = "\uE8D4";   // チャット
    public const string Python     = "\uE943";   // Python/コード
    public const string Reference  = "\uE723";   // 参考資料 (Attach)
    public const string Comment    = "\uE90A";   // コメント
    public const string Notes      = "\uE70B";   // スピーカーノート
    public const string Settings   = "\uE713";   // 設定

    // ── 挿入 ──
    public const string Add        = "\uE710";   // 追加
    public const string Link       = "\uE71B";   // ハイパーリンク
    public const string Image      = "\uE71E";   // 画像
    public const string Table      = "\uE80A";   // 表
    public const string Chart      = "\uE9D2";   // グラフ
    public const string Shape      = "\uE7FD";   // 図形

    // ── 数式・計算 ──
    public const string Sum        = "\u03A3";   // Σ（合計）
    public const string Function   = "fx";       // 関数
    public const string Refresh    = "\uE9F5";   // 再計算

    // ── 保護・セキュリティ ──
    public const string Shield     = "\uE72E";   // シート保護
    public const string Lock       = "\uE72E";   // ロック
    public const string Unlock     = "\uE785";   // アンロック
    public const string Pin        = "\uE7AD";   // 固定
    public const string Unpin      = "\uE756";   // 固定解除

    // ── ライセンス関連 ──
    public const string License    = "\uE8D7";   // ライセンス/証明書
    public const string Key        = "\uE8D7";   // 鍵（ライセンスキー）
    public const string Activate   = "\uE73E";   // アクティベート（チェック）
    public const string Deactivate = "\uE711";   // 非アクティブ化
    public const string Upgrade    = "\uE8AB";   // アップグレード
    public const string Crown      = "\uE7C1";   // プレミアム/王冠
    public const string Star       = "\uE734";   // スター/お気に入り
    public const string StarFilled = "\uE735";   // スター（塗りつぶし）

    // ── ナビゲーション ──
    public const string Previous   = "\uE72B";   // 前へ
    public const string Next       = "\uE72A";   // 次へ
    public const string Up         = "\uE74A";   // 上へ
    public const string Down       = "\uE74B";   // 下へ
    public const string Expand     = "\uE70D";   // 展開
    public const string Collapse   = "\uE70E";   // 折りたたみ
    public const string Back       = "\uE72B";   // 戻る
    public const string Forward    = "\uE72A";   // 進む

    // ── ステータス ──
    public const string Check      = "\uE73E";   // チェック/完了
    public const string CheckCircle = "\uF13E";  // チェック（丸）
    public const string Error      = "\uE783";   // エラー
    public const string Warning    = "\uE7BA";   // 警告
    public const string Info       = "\uE946";   // 情報
    public const string Help       = "\uE897";   // ヘルプ

    // ── 音声・メディア ──
    public const string Mic        = "\uE767";   // マイク
    public const string MicOff     = "\uE720";   // マイクオフ
    public const string Speaker    = "\uE767";   // スピーカー
    public const string Play       = "\uE768";   // 再生
    public const string Pause      = "\uE769";   // 一時停止
    public const string Stop       = "\uE71A";   // 停止
    public const string Record     = "\uE7C8";   // 録音

    // ── ウィンドウコントロール ──
    public const string Minimize   = "\uE949";   // 最小化
    public const string Maximize   = "\uE739";   // 最大化
    public const string Restore    = "\uE923";   // 復元
    public const string CloseX     = "\uE106";   // 閉じる（×）
    public const string PopOut     = "\uE8A7";   // 外出し/ポップアウト

    // ── その他 ──
    public const string Send       = "\uE724";   // 送信
    public const string Mail       = "\uE715";   // メール
    public const string User       = "\uE77B";   // ユーザー
    public const string Users      = "\uE716";   // ユーザー複数
    public const string Calendar   = "\uE787";   // カレンダー
    public const string Filter     = "\uE71C";   // フィルター
    public const string Sort       = "\uE8CB";   // 並べ替え
    public const string More       = "\uE712";   // その他（...）
    public const string Trash      = "\uE74D";   // ゴミ箱

    // ═══════════════════════════════════════════════════════════════
    // 絵文字アイコン（フォールバック/パネルヘッダー用）
    // ═══════════════════════════════════════════════════════════════

    public static class Emoji
    {
        // ── パネルヘッダー ──
        public const string History    = "📜";   // \U0001F4DC バージョン履歴
        public const string ChangeLog  = "⏲";    // \u23F2 変更ログ
        public const string Board      = "📋";   // \U0001F4CB 掲示板
        public const string AI         = "🤖";   // \U0001F916 AIアシスタント
        public const string Python     = "🐍";   // \U0001F40D Python
        public const string Reference  = "📎";   // \U0001F4CE 参考資料
        public const string Notes      = "📝";   // \U0001F4DD ノート

        // ── ファイル ──
        public const string Folder     = "📂";   // \U0001F4C2
        public const string Save       = "💾";   // \U0001F4BE
        public const string Document   = "📄";   // \U0001F4C4

        // ── 操作 ──
        public const string Edit       = "✏️";   // \u270F
        public const string Delete     = "🗑️";   // \U0001F5D1
        public const string Clear      = "🗑️";   // \U0001F5D1
        public const string Send       = "➤";    // \u27A4
        public const string Mic        = "🎤";   // \U0001F3A4
        public const string Close      = "✕";    // \u2715

        // ── ステータス ──
        public const string Check      = "✓";    // \u2713
        public const string CheckMark  = "✅";   // \u2705 利用可能
        public const string Error      = "❌";   // \u274C
        public const string Warning    = "⚠️";   // \u26A0
        public const string Info       = "ℹ️";   // \u2139
        public const string Question   = "❓";   // \u2753

        // ── ライセンス関連 ──
        public const string Key        = "🔑";   // \U0001F511 ライセンスキー
        public const string Lock       = "🔒";   // \U0001F512 ロック/制限
        public const string Unlock     = "🔓";   // \U0001F513 アンロック
        public const string Crown      = "👑";   // \U0001F451 プレミアム
        public const string Star       = "⭐";   // \u2B50 スター
        public const string Sparkles   = "✨";   // \u2728 新機能

        // ── 掲示板投稿タイプ ──
        public const string PostMemo      = "📝";  // メモ
        public const string PostAnnounce  = "📢";  // お知らせ
        public const string PostRole      = "👤";  // 役割
        public const string PostSchedule  = "📅";  // スケジュール
    }

    // ═══════════════════════════════════════════════════════════════
    // パネル定義（統一ID・表示名・アイコン）
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// 共通パネル定義
    /// </summary>
    public static class Panels
    {
        public static readonly PanelDefinition History = new(
            Id: "history",
            NameJa: "バージョン",
            NameEn: "History",
            IconMdl2: InsightIcons.History,
            IconEmoji: Emoji.History,
            DefaultWidth: 260,
            MinWidth: 180,
            LicenseGate: PanelLicenseGate.None
        );

        public static readonly PanelDefinition ChangeLog = new(
            Id: "changeLog",
            NameJa: "セル変更履歴",
            NameEn: "Change Log",
            IconMdl2: InsightIcons.ChangeLog,
            IconEmoji: Emoji.ChangeLog,
            DefaultWidth: 260,
            MinWidth: 180,
            LicenseGate: PanelLicenseGate.None
        );

        public static readonly PanelDefinition Board = new(
            Id: "board",
            NameJa: "掲示板",
            NameEn: "Board",
            IconMdl2: InsightIcons.Board,
            IconEmoji: Emoji.Board,
            DefaultWidth: 280,
            MinWidth: 180,
            LicenseGate: PanelLicenseGate.Pro
        );

        public static readonly PanelDefinition AI = new(
            Id: "ai",
            NameJa: "AIアシスタント",
            NameEn: "AI Assistant",
            IconMdl2: InsightIcons.AI,
            IconEmoji: Emoji.AI,
            DefaultWidth: 320,
            MinWidth: 200,
            LicenseGate: PanelLicenseGate.None  // BYOK — 使用回数制限なし
        );

        public static readonly PanelDefinition Python = new(
            Id: "python",
            NameJa: "Python実行",
            NameEn: "Python",
            IconMdl2: InsightIcons.Python,
            IconEmoji: Emoji.Python,
            DefaultWidth: 350,
            MinWidth: 200,
            LicenseGate: PanelLicenseGate.Pro
        );

        public static readonly PanelDefinition Reference = new(
            Id: "reference",
            NameJa: "参考資料",
            NameEn: "Reference",
            IconMdl2: InsightIcons.Reference,
            IconEmoji: Emoji.Reference,
            DefaultWidth: 280,
            MinWidth: 180,
            LicenseGate: PanelLicenseGate.None
        );

        public static readonly PanelDefinition Notes = new(
            Id: "notes",
            NameJa: "スピーカーノート",
            NameEn: "Speaker Notes",
            IconMdl2: InsightIcons.Notes,
            IconEmoji: Emoji.Notes,
            DefaultWidth: 280,
            MinWidth: 180,
            LicenseGate: PanelLicenseGate.None
        );

        /// <summary>
        /// 全パネル定義を取得
        /// </summary>
        public static IReadOnlyList<PanelDefinition> All =>
        [
            History,
            ChangeLog,
            Board,
            AI,
            Python,
            Reference,
            Notes
        ];

        /// <summary>
        /// IDからパネル定義を取得
        /// </summary>
        public static PanelDefinition? GetById(string id) =>
            All.FirstOrDefault(p => p.Id == id);
    }

    // ═══════════════════════════════════════════════════════════════
    // ヘルパーメソッド
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// Segoe MDL2 Assetsフォント名
    /// </summary>
    public const string FontFamily = "Segoe MDL2 Assets";

    /// <summary>
    /// アイコンサイズ定義
    /// </summary>
    public static class Size
    {
        public const double Small  = 14;
        public const double Normal = 16;
        public const double Large  = 20;
        public const double XLarge = 24;
    }
}
