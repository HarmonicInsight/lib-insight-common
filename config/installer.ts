/**
 * HARMONIC insight 製品インストーラー定義
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * 全製品のインストーラー構成を一元管理し、Inno Setup / WiX 等の
 * スクリプト生成に必要な情報を提供する。
 *
 * ## インストーラー種別
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Orchestrator (INBT PRO/ENT)                                           │
 * │  ┌───────────────────────────────────────────────────────────────────┐ │
 * │  │  Windows サービス + タスクトレイ管理アプリ                          │ │
 * │  │  - InsightBotService.exe (サービスプロセス — 常駐)                 │ │
 * │  │  - InsightBotTray.exe (トレイアイコン — ログ・設定・状態監視)       │ │
 * │  │  - ポート 9400 (REST API + WebSocket)                             │ │
 * │  │  - ファイアウォール自動設定                                        │ │
 * │  │  - 自動起動 (Windows サービス)                                    │ │
 * │  └───────────────────────────────────────────────────────────────────┘ │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  InsightOffice 系 (INSS/IOSH/IOSD)                                    │
 * │  ┌───────────────────────────────────────────────────────────────────┐ │
 * │  │  デスクトップアプリ + ファイル関連付け + Agent モジュール           │ │
 * │  │  - {Product}.exe (メインアプリ)                                   │ │
 * │  │  - .inss/.iosh/.iosd 関連付け登録                                │ │
 * │  │  - コンテキストメニュー「〜で開く」登録                            │ │
 * │  │  - bot_agent モジュール (Orchestrator 連携用 — 任意有効化)         │ │
 * │  └───────────────────────────────────────────────────────────────────┘ │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  スタンドアロン (INMV/INIG/INCA/INPY/IVIN)                            │
 * │  ┌───────────────────────────────────────────────────────────────────┐ │
 * │  │  デスクトップアプリ（標準インストール）                              │ │
 * │  │  - {Product}.exe (メインアプリ)                                   │ │
 * │  │  - デスクトップ / スタートメニューショートカット                     │ │
 * │  └───────────────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## 使い方
 *
 * ```typescript
 * import { getInstallerConfig, generateInnoSetupConfig } from './installer';
 *
 * // 製品のインストーラー構成を取得
 * const config = getInstallerConfig('INBT');
 * config.service;  // Windows サービス構成
 * config.firewall; // ファイアウォールルール
 *
 * // Inno Setup 用セクション生成
 * const sections = generateInnoSetupConfig('IOSH');
 * sections.registry;   // レジストリエントリ
 * sections.files;      // ファイルコピー定義
 * sections.run;        // インストール後実行コマンド
 * ```
 */

import type { ProductCode, PlanCode } from './products';
import { PRODUCTS, getFileAssociationInfo } from './products';
import { ORCHESTRATOR_API } from './orchestrator';

// =============================================================================
// 型定義
// =============================================================================

/** インストーラーフレームワーク */
export type InstallerFramework = 'inno_setup' | 'wix' | 'msix';

/** インストーラー種別 */
export type InstallerType =
  | 'desktop_app'            // 標準デスクトップアプリ
  | 'desktop_with_agent'     // デスクトップ + Agent モジュール
  | 'service_with_tray';     // Windows サービス + トレイアプリ

/** Windows サービス構成 */
export interface WindowsServiceConfig {
  /** サービス名（sc コマンドで使用） */
  serviceName: string;
  /** サービス表示名 */
  displayName: string;
  /** サービス説明 */
  description: string;
  descriptionJa: string;
  /** 実行ファイル名 */
  executable: string;
  /** スタートアップの種類 */
  startType: 'auto' | 'manual' | 'disabled';
  /** サービス復旧設定（障害時） */
  recovery: {
    /** 1 回目の障害: restart / none */
    firstFailure: 'restart' | 'none';
    /** 2 回目の障害 */
    secondFailure: 'restart' | 'none';
    /** それ以降 */
    subsequentFailures: 'restart' | 'none';
    /** リスタート待機時間（秒） */
    restartDelaySeconds: number;
    /** 障害カウントリセット（日数） */
    resetFailCountDays: number;
  };
  /** サービスアカウント */
  account: 'LocalSystem' | 'LocalService' | 'NetworkService';
  /** 依存するサービス */
  dependsOn: string[];
}

/** トレイアプリ構成 */
export interface TrayAppConfig {
  /** 実行ファイル名 */
  executable: string;
  /** ウィンドウタイトル */
  windowTitle: string;
  windowTitleJa: string;
  /** スタートアップに登録するか */
  autoStartWithWindows: boolean;
  /** レジストリキー（自動起動用） */
  autoStartRegistryKey: string;
  /** トレイメニュー項目 */
  menuItems: Array<{
    id: string;
    label: string;
    labelJa: string;
    action: 'open_dashboard' | 'open_logs' | 'open_settings' | 'restart_service' | 'stop_service' | 'exit';
  }>;
}

/** ファイアウォールルール */
export interface FirewallRule {
  /** ルール名 */
  name: string;
  /** 説明 */
  description: string;
  /** プロトコル */
  protocol: 'tcp' | 'udp';
  /** ポート番号 */
  port: number;
  /** 方向 */
  direction: 'in' | 'out';
  /** 許可するプロファイル */
  profiles: Array<'domain' | 'private' | 'public'>;
}

/** レジストリエントリ */
export interface RegistryEntry {
  /** ルートキー */
  root: 'HKLM' | 'HKCU' | 'HKCR';
  /** サブキー */
  subkey: string;
  /** 値名（デフォルト値の場合は空文字） */
  valueName: string;
  /** 値の型 */
  valueType: 'string' | 'dword' | 'expandsz';
  /** 値 */
  value: string;
  /** アンインストール時に削除するか */
  deleteOnUninstall: boolean;
}

/** インストーラー構成 */
export interface InstallerConfig {
  /** 製品コード */
  product: ProductCode;
  /** インストーラー種別 */
  installerType: InstallerType;
  /** 推奨フレームワーク */
  recommendedFramework: InstallerFramework;
  /** アプリケーション情報 */
  app: {
    /** 実行ファイル名 */
    executable: string;
    /** インストール先ディレクトリ名 */
    installDirName: string;
    /** パブリッシャー */
    publisher: string;
    /** パブリッシャー URL */
    publisherUrl: string;
    /** サポート URL */
    supportUrl: string;
    /** アップデート確認 URL */
    updateCheckUrl: string;
    /** GUID（Inno Setup AppId） */
    appId: string;
    /** 必要な .NET バージョン（null の場合は self-contained） */
    dotnetVersion: string | null;
    /** 最低 OS バージョン */
    minOsVersion: string;
    /** アーキテクチャ */
    architecture: 'x64' | 'x86' | 'arm64';
    /** デスクトップショートカット作成 */
    createDesktopShortcut: boolean;
    /** スタートメニューグループ名 */
    startMenuGroup: string;
  };
  /** Windows サービス構成（service_with_tray のみ） */
  service?: WindowsServiceConfig;
  /** トレイアプリ構成（service_with_tray のみ） */
  trayApp?: TrayAppConfig;
  /** ファイアウォールルール */
  firewallRules: FirewallRule[];
  /** 追加レジストリエントリ */
  registryEntries: RegistryEntry[];
  /** ファイル関連付け（InsightOffice 系のみ） */
  fileAssociations: boolean;
  /** 前提条件 */
  prerequisites: Array<{
    name: string;
    nameJa: string;
    /** チェックコマンド（存在確認用） */
    checkCommand: string;
    /** バンドル同梱するか */
    bundled: boolean;
    /** 外部ダウンロード URL（bundled=false の場合） */
    downloadUrl?: string;
  }>;
  /** インストール完了後の実行アクション */
  postInstallActions: Array<{
    /** アクション種別 */
    type: 'register_service' | 'start_service' | 'add_firewall' | 'register_file_assoc' | 'run_app' | 'show_readme';
    /** 説明 */
    description: string;
    /** 必須か（オプションの場合はチェックボックスで制御） */
    required: boolean;
    /** デフォルトで有効か */
    defaultEnabled: boolean;
  }>;
  /** アンインストール時のアクション */
  uninstallActions: Array<{
    type: 'stop_service' | 'remove_service' | 'remove_firewall' | 'remove_file_assoc' | 'remove_appdata' | 'remove_registry';
    description: string;
  }>;
}

// =============================================================================
// 共通定数
// =============================================================================

const PUBLISHER = 'HARMONIC insight';
const PUBLISHER_URL = 'https://harmonicinsight.com';
const SUPPORT_URL = 'https://harmonicinsight.com/support';
const UPDATE_BASE_URL = 'https://api.harmonicinsight.com/updates';
const START_MENU_GROUP = 'HARMONIC insight';
const MIN_OS_VERSION = '10.0.17763'; // Windows 10 1809+

// =============================================================================
// Orchestrator (INBT) インストーラー構成
// =============================================================================

/**
 * InsightBot Orchestrator のインストーラー構成
 *
 * Orchestrator は Windows サービスとして常駐し、REST API + WebSocket サーバーを
 * ポート 9400 で公開する。タスクトレイアプリで状態監視・設定変更が可能。
 *
 * ## インストール構成
 *
 * ```
 * %ProgramFiles%/HARMONIC insight/InsightBot/
 * ├── InsightBot.exe              # メインアプリ（AI エディター + JOB 管理 GUI）
 * ├── InsightBotService.exe       # Orchestrator サービスプロセス
 * ├── InsightBotTray.exe          # タスクトレイ管理アプリ
 * ├── config/
 * │   ├── orchestrator.json       # Orchestrator 設定（ポート、TLS、ログ）
 * │   └── license.json            # ライセンス情報
 * ├── logs/
 * │   └── orchestrator.log        # サービスログ
 * └── data/
 *     ├── jobs.db                 # JOB 定義 SQLite
 *     └── executions.db           # 実行ログ SQLite
 * ```
 *
 * ## サービス登録フロー
 *
 * ```
 * インストール完了
 *   → InsightBotService.exe を Windows サービスとして登録
 *   → ファイアウォールにポート 9400 (TCP) を開放
 *   → サービスを自動起動に設定
 *   → タスクトレイアプリをスタートアップに登録
 * ```
 */
export const INBT_INSTALLER: InstallerConfig = {
  product: 'INBT',
  installerType: 'service_with_tray',
  recommendedFramework: 'inno_setup',
  app: {
    executable: 'InsightBot.exe',
    installDirName: 'InsightBot',
    publisher: PUBLISHER,
    publisherUrl: PUBLISHER_URL,
    supportUrl: SUPPORT_URL,
    updateCheckUrl: `${UPDATE_BASE_URL}/INBT`,
    appId: '{{F8A2C3D1-4B5E-6F7A-8B9C-0D1E2F3A4B5C}',
    dotnetVersion: null, // self-contained
    minOsVersion: MIN_OS_VERSION,
    architecture: 'x64',
    createDesktopShortcut: true,
    startMenuGroup: START_MENU_GROUP,
  },
  service: {
    serviceName: 'InsightBotOrchestrator',
    displayName: 'InsightBot Orchestrator',
    description: 'InsightBot Orchestrator — Centralized JOB dispatch, Agent management, and workflow execution for InsightOffice automation.',
    descriptionJa: 'InsightBot Orchestrator — InsightOffice Agent への JOB 配信・管理・ワークフロー実行の中央サーバー。',
    executable: 'InsightBotService.exe',
    startType: 'auto',
    recovery: {
      firstFailure: 'restart',
      secondFailure: 'restart',
      subsequentFailures: 'restart',
      restartDelaySeconds: 10,
      resetFailCountDays: 1,
    },
    account: 'LocalService',
    dependsOn: [],
  },
  trayApp: {
    executable: 'InsightBotTray.exe',
    windowTitle: 'InsightBot Orchestrator',
    windowTitleJa: 'InsightBot Orchestrator',
    autoStartWithWindows: true,
    autoStartRegistryKey: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\InsightBotTray',
    menuItems: [
      { id: 'dashboard', label: 'Open Dashboard', labelJa: 'ダッシュボードを開く', action: 'open_dashboard' },
      { id: 'logs', label: 'View Logs', labelJa: 'ログを表示', action: 'open_logs' },
      { id: 'settings', label: 'Settings', labelJa: '設定', action: 'open_settings' },
      { id: 'restart', label: 'Restart Service', labelJa: 'サービスを再起動', action: 'restart_service' },
      { id: 'stop', label: 'Stop Service', labelJa: 'サービスを停止', action: 'stop_service' },
      { id: 'exit', label: 'Exit', labelJa: '終了', action: 'exit' },
    ],
  },
  firewallRules: [
    {
      name: 'InsightBot Orchestrator (TCP-In)',
      description: `Allow InsightBot Orchestrator REST API and WebSocket on port ${ORCHESTRATOR_API.defaultPort}`,
      protocol: 'tcp',
      port: ORCHESTRATOR_API.defaultPort,
      direction: 'in',
      profiles: ['domain', 'private'],
    },
  ],
  registryEntries: [
    {
      root: 'HKLM',
      subkey: 'SOFTWARE\\HarmonicInsight\\InsightBot',
      valueName: 'InstallPath',
      valueType: 'string',
      value: '{app}',
      deleteOnUninstall: true,
    },
    {
      root: 'HKLM',
      subkey: 'SOFTWARE\\HarmonicInsight\\InsightBot',
      valueName: 'OrchestratorPort',
      valueType: 'dword',
      value: String(ORCHESTRATOR_API.defaultPort),
      deleteOnUninstall: true,
    },
    {
      root: 'HKLM',
      subkey: 'SOFTWARE\\HarmonicInsight\\InsightBot',
      valueName: 'Version',
      valueType: 'string',
      value: '{#AppVersion}',
      deleteOnUninstall: true,
    },
  ],
  fileAssociations: false,
  prerequisites: [
    {
      name: 'Python 3.10+',
      nameJa: 'Python 3.10以上',
      checkCommand: 'python --version',
      bundled: false,
      downloadUrl: 'https://www.python.org/downloads/',
    },
  ],
  postInstallActions: [
    { type: 'register_service', description: 'Register InsightBot Orchestrator as Windows Service', required: true, defaultEnabled: true },
    { type: 'add_firewall', description: `Open port ${ORCHESTRATOR_API.defaultPort} in Windows Firewall`, required: false, defaultEnabled: true },
    { type: 'start_service', description: 'Start InsightBot Orchestrator service', required: false, defaultEnabled: true },
    { type: 'run_app', description: 'Launch InsightBot', required: false, defaultEnabled: true },
  ],
  uninstallActions: [
    { type: 'stop_service', description: 'Stop InsightBot Orchestrator service' },
    { type: 'remove_service', description: 'Remove InsightBot Orchestrator service registration' },
    { type: 'remove_firewall', description: 'Remove firewall rule for port 9400' },
    { type: 'remove_registry', description: 'Remove InsightBot registry entries' },
    { type: 'remove_appdata', description: 'Remove InsightBot application data' },
  ],
};

// =============================================================================
// InsightOffice 系 (INSS/IOSH/IOSD) インストーラー構成
// =============================================================================

/**
 * InsightOffice 系アプリのインストーラー構成を生成
 *
 * ## インストール構成（例: IOSH）
 *
 * ```
 * %ProgramFiles%/HARMONIC insight/InsightOfficeSheet/
 * ├── InsightOfficeSheet.exe       # メインアプリ
 * ├── iosh-file.ico                # 独自拡張子アイコン
 * └── modules/
 *     └── python/                  # Python ランタイム（PRO のみ）
 * ```
 *
 * ## レジストリ登録
 *
 * ```
 * HKCR\.iosh                       → HarmonicInsight.InsightOfficeSheet
 * HKCR\HarmonicInsight.InsightOfficeSheet\shell\open\command
 *                                  → "...\InsightOfficeSheet.exe" "%1"
 * HKCR\.xlsx\shell\InsightOfficeSheet\command
 *                                  → "...\InsightOfficeSheet.exe" "%1"
 *                                  （コンテキストメニュー「InsightOfficeSheet で開く」）
 * ```
 */
function createInsightOfficeInstaller(product: 'INSS' | 'IOSH' | 'IOSD'): InstallerConfig {
  const productInfo = PRODUCTS[product];
  const fileAssocInfo = getFileAssociationInfo(product, 'ja');

  const appIds: Record<string, string> = {
    INSS: '{{A1B2C3D4-5E6F-7A8B-9C0D-E1F2A3B4C5D6}',
    IOSH: '{{B2C3D4E5-6F7A-8B9C-0D1E-F2A3B4C5D6E7}',
    IOSD: '{{C3D4E5F6-7A8B-9C0D-1E2F-A3B4C5D6E7F8}',
  };

  // ファイル関連付けレジストリエントリ
  const registryEntries: RegistryEntry[] = [
    // 製品インストールパス
    {
      root: 'HKLM',
      subkey: `SOFTWARE\\HarmonicInsight\\${productInfo.name}`,
      valueName: 'InstallPath',
      valueType: 'string',
      value: '{app}',
      deleteOnUninstall: true,
    },
    {
      root: 'HKLM',
      subkey: `SOFTWARE\\HarmonicInsight\\${productInfo.name}`,
      valueName: 'Version',
      valueType: 'string',
      value: '{#AppVersion}',
      deleteOnUninstall: true,
    },
  ];

  if (fileAssocInfo) {
    // 独自拡張子の関連付け (.inss / .iosh / .iosd)
    registryEntries.push(
      {
        root: 'HKCR',
        subkey: fileAssocInfo.extension,
        valueName: '',
        valueType: 'string',
        value: fileAssocInfo.progId,
        deleteOnUninstall: true,
      },
      {
        root: 'HKCR',
        subkey: `${fileAssocInfo.progId}`,
        valueName: '',
        valueType: 'string',
        value: fileAssocInfo.description,
        deleteOnUninstall: true,
      },
      {
        root: 'HKCR',
        subkey: `${fileAssocInfo.progId}\\DefaultIcon`,
        valueName: '',
        valueType: 'string',
        value: `{app}\\${productInfo.projectFile!.iconFileName},0`,
        deleteOnUninstall: true,
      },
      {
        root: 'HKCR',
        subkey: `${fileAssocInfo.progId}\\shell\\open\\command`,
        valueName: '',
        valueType: 'string',
        value: `"{app}\\${productInfo.name}.exe" "%1"`,
        deleteOnUninstall: true,
      },
    );

    // コンテキストメニュー「〜で開く」の登録
    for (const ext of fileAssocInfo.contextMenu.targetExtensions) {
      registryEntries.push({
        root: 'HKCR',
        subkey: `${ext}\\shell\\${productInfo.name}`,
        valueName: '',
        valueType: 'string',
        value: fileAssocInfo.contextMenu.label,
        deleteOnUninstall: true,
      });
      registryEntries.push({
        root: 'HKCR',
        subkey: `${ext}\\shell\\${productInfo.name}\\command`,
        valueName: '',
        valueType: 'string',
        value: `"{app}\\${productInfo.name}.exe" "%1"`,
        deleteOnUninstall: true,
      });
    }
  }

  return {
    product,
    installerType: 'desktop_with_agent',
    recommendedFramework: 'inno_setup',
    app: {
      executable: `${productInfo.name}.exe`,
      installDirName: productInfo.name,
      publisher: PUBLISHER,
      publisherUrl: PUBLISHER_URL,
      supportUrl: SUPPORT_URL,
      updateCheckUrl: `${UPDATE_BASE_URL}/${product}`,
      appId: appIds[product],
      dotnetVersion: null,
      minOsVersion: MIN_OS_VERSION,
      architecture: 'x64',
      createDesktopShortcut: true,
      startMenuGroup: START_MENU_GROUP,
    },
    firewallRules: [],
    registryEntries,
    fileAssociations: true,
    prerequisites: [],
    postInstallActions: [
      { type: 'register_file_assoc', description: `Register ${productInfo.projectFile?.extension} file association`, required: true, defaultEnabled: true },
      { type: 'run_app', description: `Launch ${productInfo.name}`, required: false, defaultEnabled: true },
    ],
    uninstallActions: [
      { type: 'remove_file_assoc', description: `Remove ${productInfo.projectFile?.extension} file association` },
      { type: 'remove_registry', description: `Remove ${productInfo.name} registry entries` },
      { type: 'remove_appdata', description: `Remove ${productInfo.name} application data` },
    ],
  };
}

// InsightOffice 各製品のインストーラー構成
export const INSS_INSTALLER: InstallerConfig = createInsightOfficeInstaller('INSS');
export const IOSH_INSTALLER: InstallerConfig = createInsightOfficeInstaller('IOSH');
export const IOSD_INSTALLER: InstallerConfig = createInsightOfficeInstaller('IOSD');

// =============================================================================
// スタンドアロン製品インストーラー構成
// =============================================================================

/**
 * スタンドアロン製品のインストーラー構成を生成（INMV/INIG/INCA/INPY/IVIN）
 */
function createStandaloneInstaller(product: ProductCode): InstallerConfig {
  const productInfo = PRODUCTS[product];

  const appIds: Record<string, string> = {
    INMV: '{{D4E5F6A7-8B9C-0D1E-2F3A-B4C5D6E7F8A9}',
    INIG: '{{E5F6A7B8-9C0D-1E2F-3A4B-C5D6E7F8A9B0}',
    INCA: '{{F6A7B8C9-0D1E-2F3A-4B5C-D6E7F8A9B0C1}',
    INPY: '{{A7B8C9D0-1E2F-3A4B-5C6D-E7F8A9B0C1D2}',
    IVIN: '{{B8C9D0E1-2F3A-4B5C-6D7E-F8A9B0C1D2E3}',
    ISOF: '{{C9D0E1F2-3A4B-5C6D-7E8F-A9B0C1D2E3F4}',
  };

  return {
    product,
    installerType: 'desktop_app',
    recommendedFramework: 'inno_setup',
    app: {
      executable: `${productInfo.name}.exe`,
      installDirName: productInfo.name,
      publisher: PUBLISHER,
      publisherUrl: PUBLISHER_URL,
      supportUrl: SUPPORT_URL,
      updateCheckUrl: `${UPDATE_BASE_URL}/${product}`,
      appId: appIds[product] || `{{00000000-0000-0000-0000-${product.padEnd(12, '0')}}`,
      dotnetVersion: null,
      minOsVersion: MIN_OS_VERSION,
      architecture: 'x64',
      createDesktopShortcut: true,
      startMenuGroup: START_MENU_GROUP,
    },
    firewallRules: [],
    registryEntries: [
      {
        root: 'HKLM',
        subkey: `SOFTWARE\\HarmonicInsight\\${productInfo.name}`,
        valueName: 'InstallPath',
        valueType: 'string',
        value: '{app}',
        deleteOnUninstall: true,
      },
      {
        root: 'HKLM',
        subkey: `SOFTWARE\\HarmonicInsight\\${productInfo.name}`,
        valueName: 'Version',
        valueType: 'string',
        value: '{#AppVersion}',
        deleteOnUninstall: true,
      },
    ],
    fileAssociations: false,
    prerequisites: product === 'INPY' ? [
      { name: 'Python 3.10+', nameJa: 'Python 3.10以上', checkCommand: 'python --version', bundled: false, downloadUrl: 'https://www.python.org/downloads/' },
    ] : [],
    postInstallActions: [
      { type: 'run_app', description: `Launch ${productInfo.name}`, required: false, defaultEnabled: true },
    ],
    uninstallActions: [
      { type: 'remove_registry', description: `Remove ${productInfo.name} registry entries` },
      { type: 'remove_appdata', description: `Remove ${productInfo.name} application data` },
    ],
  };
}

export const INMV_INSTALLER: InstallerConfig = createStandaloneInstaller('INMV');
export const INIG_INSTALLER: InstallerConfig = createStandaloneInstaller('INIG');
export const INCA_INSTALLER: InstallerConfig = createStandaloneInstaller('INCA');
export const INPY_INSTALLER: InstallerConfig = createStandaloneInstaller('INPY');
export const IVIN_INSTALLER: InstallerConfig = createStandaloneInstaller('IVIN');
export const ISOF_INSTALLER: InstallerConfig = createStandaloneInstaller('ISOF');

// =============================================================================
// 全製品マップ
// =============================================================================

export const INSTALLER_CONFIGS: Record<ProductCode, InstallerConfig> = {
  INBT: INBT_INSTALLER,
  INSS: INSS_INSTALLER,
  IOSH: IOSH_INSTALLER,
  IOSD: IOSD_INSTALLER,
  INMV: INMV_INSTALLER,
  INIG: INIG_INSTALLER,
  INCA: INCA_INSTALLER,
  INPY: INPY_INSTALLER,
  IVIN: IVIN_INSTALLER,
  ISOF: ISOF_INSTALLER,
};

// =============================================================================
// ヘルパー関数
// =============================================================================

/** 製品のインストーラー構成を取得 */
export function getInstallerConfig(product: ProductCode): InstallerConfig {
  return INSTALLER_CONFIGS[product];
}

/**
 * Windows サービス登録用の sc コマンドを生成
 *
 * @example
 * ```
 * getServiceInstallCommands('INBT')
 * // [
 * //   'sc create InsightBotOrchestrator binPath= "...\\InsightBotService.exe" start= auto obj= "NT AUTHORITY\\LocalService"',
 * //   'sc description InsightBotOrchestrator "InsightBot Orchestrator — ..."',
 * //   'sc failure InsightBotOrchestrator reset= 86400 actions= restart/10000/restart/10000/restart/10000',
 * // ]
 * ```
 */
export function getServiceInstallCommands(product: ProductCode): string[] | null {
  const config = INSTALLER_CONFIGS[product];
  if (!config.service) return null;

  const svc = config.service;
  const accountMap: Record<string, string> = {
    LocalSystem: 'LocalSystem',
    LocalService: 'NT AUTHORITY\\LocalService',
    NetworkService: 'NT AUTHORITY\\NetworkService',
  };

  const commands: string[] = [];

  // サービス作成
  commands.push(
    `sc create ${svc.serviceName} binPath= "{app}\\${svc.executable}" start= ${svc.startType} obj= "${accountMap[svc.account]}" DisplayName= "${svc.displayName}"`,
  );

  // 説明設定
  commands.push(
    `sc description ${svc.serviceName} "${svc.description}"`,
  );

  // 障害復旧設定
  const resetSeconds = svc.recovery.resetFailCountDays * 86400;
  const delayMs = svc.recovery.restartDelaySeconds * 1000;
  const actions = [
    `${svc.recovery.firstFailure}/${delayMs}`,
    `${svc.recovery.secondFailure}/${delayMs}`,
    `${svc.recovery.subsequentFailures}/${delayMs}`,
  ].join('/');
  commands.push(
    `sc failure ${svc.serviceName} reset= ${resetSeconds} actions= ${actions}`,
  );

  return commands;
}

/**
 * ファイアウォールルール登録用の netsh コマンドを生成
 */
export function getFirewallCommands(product: ProductCode): string[] {
  const config = INSTALLER_CONFIGS[product];
  return config.firewallRules.map(rule => {
    const profiles = rule.profiles.join(',');
    const dir = rule.direction === 'in' ? 'in' : 'out';
    return `netsh advfirewall firewall add rule name="${rule.name}" dir=${dir} action=allow protocol=${rule.protocol} localport=${rule.port} profile=${profiles}`;
  });
}

/**
 * ファイアウォールルール削除用の netsh コマンドを生成
 */
export function getFirewallRemoveCommands(product: ProductCode): string[] {
  const config = INSTALLER_CONFIGS[product];
  return config.firewallRules.map(rule =>
    `netsh advfirewall firewall delete rule name="${rule.name}"`,
  );
}

/**
 * Inno Setup [Registry] セクション用のエントリを生成
 *
 * @example
 * ```
 * generateInnoSetupRegistry('IOSH')
 * // [
 * //   'Root: HKCR; Subkey: ".iosh"; ValueType: string; ValueData: "HarmonicInsight.InsightOfficeSheet"; Flags: uninsdeletekey',
 * //   ...
 * // ]
 * ```
 */
export function generateInnoSetupRegistry(product: ProductCode): string[] {
  const config = INSTALLER_CONFIGS[product];
  return config.registryEntries.map(entry => {
    const flags = entry.deleteOnUninstall ? 'uninsdeletekey' : '';
    const valueType = entry.valueType === 'dword' ? 'dword'
      : entry.valueType === 'expandsz' ? 'expandsz'
      : 'string';
    return `Root: ${entry.root}; Subkey: "${entry.subkey}"; ValueName: "${entry.valueName}"; ValueType: ${valueType}; ValueData: "${entry.value}"; Flags: ${flags}`;
  });
}

/**
 * Inno Setup [Run] セクション用のエントリを生成（インストール後実行）
 */
export function generateInnoSetupRun(product: ProductCode): string[] {
  const config = INSTALLER_CONFIGS[product];
  const lines: string[] = [];

  for (const action of config.postInstallActions) {
    const flags = action.required ? 'runhidden waituntilterminated' : 'nowait postinstall skipifsilent';
    const desc = action.description;

    switch (action.type) {
      case 'register_service':
        if (config.service) {
          lines.push(
            `Filename: "{app}\\${config.service.executable}"; Parameters: "--install"; Description: "${desc}"; Flags: ${flags}`,
          );
        }
        break;
      case 'start_service':
        if (config.service) {
          lines.push(
            `Filename: "sc"; Parameters: "start ${config.service.serviceName}"; Description: "${desc}"; Flags: ${flags}`,
          );
        }
        break;
      case 'add_firewall':
        for (const cmd of getFirewallCommands(product)) {
          lines.push(
            `Filename: "cmd"; Parameters: "/c ${cmd}"; Description: "${desc}"; Flags: runhidden waituntilterminated`,
          );
        }
        break;
      case 'run_app':
        lines.push(
          `Filename: "{app}\\${config.app.executable}"; Description: "${desc}"; Flags: ${flags}`,
        );
        break;
    }
  }

  return lines;
}

/**
 * Inno Setup スクリプトの主要セクションを一括生成
 *
 * 各製品の build.ps1 からこの関数を呼び出して .iss ファイルの各セクションを取得する。
 */
export function generateInnoSetupConfig(product: ProductCode): {
  setup: Record<string, string>;
  registry: string[];
  run: string[];
  firewall: { install: string[]; uninstall: string[] };
  service: string[] | null;
} {
  const config = INSTALLER_CONFIGS[product];
  const productInfo = PRODUCTS[product];

  return {
    setup: {
      AppId: config.app.appId,
      AppName: productInfo.name,
      AppVersion: '{#AppVersion}',
      AppPublisher: config.app.publisher,
      AppPublisherURL: config.app.publisherUrl,
      AppSupportURL: config.app.supportUrl,
      DefaultDirName: `{autopf}\\HARMONIC insight\\${config.app.installDirName}`,
      DefaultGroupName: config.app.startMenuGroup,
      OutputBaseFilename: `${productInfo.name}-Setup`,
      Compression: 'lzma2',
      SolidCompression: 'yes',
      ArchitecturesInstallIn64BitMode: 'x64compatible',
      MinVersion: config.app.minOsVersion,
    },
    registry: generateInnoSetupRegistry(product),
    run: generateInnoSetupRun(product),
    firewall: {
      install: getFirewallCommands(product),
      uninstall: getFirewallRemoveCommands(product),
    },
    service: getServiceInstallCommands(product),
  };
}

// =============================================================================
// インストーラーコンポーネント選択
// =============================================================================

/**
 * インストーラーのコンポーネント選択
 *
 * InsightOffice 系のインストーラーでは、ユーザーがインストールする
 * コンポーネントを選択できる。コンポーネントは3種類に分類される:
 *
 * - required: 必須（チェックボックスを外せない）
 * - recommended: 推奨（デフォルトでチェック ON）
 * - optional: オプション（デフォルトでチェック OFF）
 *
 * ## 使い方
 *
 * ```typescript
 * import { getInstallerComponents, calculateInstallerSize } from './installer';
 *
 * // 製品のコンポーネント一覧を取得
 * const components = getInstallerComponents('IOSH');
 * // → [
 * //   { id: 'core', name: 'InsightOfficeSheet 本体', sizeMB: 50, selection: 'required', ... },
 * //   { id: 'ai_assistant', name: 'AI アシスタント', sizeMB: 5, selection: 'recommended', ... },
 * //   { id: 'python_runtime', name: 'Python 実行環境', sizeMB: 150, selection: 'optional', ... },
 * // ]
 *
 * // デフォルト選択での合計サイズを計算
 * const size = calculateInstallerSize('IOSH');
 * // → { selectedMB: 55, totalMB: 205, components: [...] }
 *
 * // カスタム選択でのサイズ計算
 * const customSize = calculateInstallerSize('IOSH', ['core', 'ai_assistant', 'python_runtime']);
 * // → { selectedMB: 205, totalMB: 205, components: [...] }
 * ```
 *
 * ## Inno Setup コンポーネントセクション生成
 *
 * ```typescript
 * const section = generateInnoSetupComponents('IOSH');
 * // → [
 * //   'Name: "core"; Description: "InsightOfficeSheet 本体（必須）"; Types: full compact custom; Flags: fixed',
 * //   'Name: "ai_assistant"; Description: "AI アシスタント（推奨）"; Types: full compact custom',
 * //   'Name: "python_runtime"; Description: "Python 実行環境（オプション）"; Types: full',
 * // ]
 * ```
 */

/** コンポーネントの選択種別 */
export type ComponentSelection = 'required' | 'recommended' | 'optional';

/** インストーラーコンポーネント定義 */
export interface InstallerComponent {
  /** コンポーネント ID（addon-modules の ID と対応） */
  id: string;
  /** 表示名 */
  name: string;
  /** 日本語表示名 */
  nameJa: string;
  /** 説明 */
  description: string;
  /** 日本語説明 */
  descriptionJa: string;
  /** 推定サイズ（MB） */
  sizeMB: number;
  /** 選択種別 */
  selection: ComponentSelection;
  /** デフォルトで選択済みか */
  defaultChecked: boolean;
  /** 依存するコンポーネント ID（これらが選択されていないと選択不可） */
  dependsOn: string[];
  /** 対応する addon-modules のモジュール ID（null の場合はコアアプリ） */
  addonModuleId: string | null;
  /** Inno Setup の Types 定義（どのインストール種別に含まれるか） */
  innoSetupTypes: Array<'full' | 'compact' | 'custom'>;
}

/** コンポーネント選択結果 */
export interface ComponentSizeResult {
  /** 選択されたコンポーネントの合計サイズ（MB） */
  selectedMB: number;
  /** 全コンポーネントの合計サイズ（MB） */
  totalMB: number;
  /** 各コンポーネントの状態 */
  components: Array<InstallerComponent & { checked: boolean }>;
}

// ── 製品別コンポーネント定義 ──

/**
 * InsightOffice 系（INSS/IOSH/IOSD）共通のコンポーネント構成
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  InsightOffice インストーラー                                │
 * │                                                             │
 * │  ☑ {製品名} 本体（必須）                          50MB     │
 * │  ☑ AI アシスタント（推奨）                         5MB     │
 * │  ☐ Python 実行環境（オプション）                 150MB     │
 * │                                          ─────────         │
 * │                              合計:  55MB 〜 205MB          │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 */
function createInsightOfficeComponents(product: 'INSS' | 'IOSH' | 'IOSD'): InstallerComponent[] {
  const productInfo = PRODUCTS[product];

  return [
    {
      id: 'core',
      name: `${productInfo.name} Core`,
      nameJa: `${productInfo.name} 本体`,
      description: `${productInfo.name} main application and file associations`,
      descriptionJa: `${productInfo.name} メインアプリケーションとファイル関連付け`,
      sizeMB: 50,
      selection: 'required',
      defaultChecked: true,
      dependsOn: [],
      addonModuleId: null,
      innoSetupTypes: ['full', 'compact', 'custom'],
    },
    {
      id: 'ai_assistant',
      name: 'AI Assistant',
      nameJa: 'AI アシスタント',
      description: 'Claude-powered AI assistant for document editing, proofreading, and suggestions',
      descriptionJa: 'Claude AIによるドキュメント編集・校正・提案アシスタント',
      sizeMB: 5,
      selection: 'recommended',
      defaultChecked: true,
      dependsOn: ['core'],
      addonModuleId: 'ai_assistant',
      innoSetupTypes: ['full', 'compact', 'custom'],
    },
    {
      id: 'python_runtime',
      name: 'Python Runtime',
      nameJa: 'Python 実行環境',
      description: 'Embedded Python execution environment for scripting and automation (PRO/ENT)',
      descriptionJa: 'スクリプト・自動化のための Python 実行環境（PRO/ENT）',
      sizeMB: 150,
      selection: 'optional',
      defaultChecked: false,
      dependsOn: ['core'],
      addonModuleId: 'python_runtime',
      innoSetupTypes: ['full'],
    },
  ];
}

/**
 * InsightBot（INBT）のコンポーネント構成
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │  InsightBot インストーラー                                   │
 * │                                                             │
 * │  ☑ InsightBot Studio（必須）                       60MB    │
 * │  ☑ AI コードエディター（推奨）                      5MB    │
 * │  ☐ Orchestrator サービス（オプション — PRO/ENT）    20MB    │
 * │  ☐ Python 実行環境（オプション）                  150MB    │
 * │                                          ─────────         │
 * │                              合計:  65MB 〜 235MB          │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 */
const INBT_COMPONENTS: InstallerComponent[] = [
  {
    id: 'core',
    name: 'InsightBot Studio',
    nameJa: 'InsightBot Studio',
    description: 'InsightBot main application — AI editor and JOB management',
    descriptionJa: 'InsightBot メインアプリケーション — AI エディターと JOB 管理',
    sizeMB: 60,
    selection: 'required',
    defaultChecked: true,
    dependsOn: [],
    addonModuleId: null,
    innoSetupTypes: ['full', 'compact', 'custom'],
  },
  {
    id: 'ai_code_editor',
    name: 'AI Code Editor',
    nameJa: 'AI コードエディター',
    description: 'AI-powered Python code generation and editing',
    descriptionJa: 'AI による Python コード生成・編集',
    sizeMB: 5,
    selection: 'recommended',
    defaultChecked: true,
    dependsOn: ['core'],
    addonModuleId: 'ai_assistant',
    innoSetupTypes: ['full', 'compact', 'custom'],
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator Service',
    nameJa: 'Orchestrator サービス',
    description: 'Windows service for centralized Agent management and JOB dispatch (PRO/ENT)',
    descriptionJa: 'Agent 集中管理・JOB 配信用 Windows サービス（PRO/ENT）',
    sizeMB: 20,
    selection: 'optional',
    defaultChecked: false,
    dependsOn: ['core'],
    addonModuleId: null,
    innoSetupTypes: ['full'],
  },
  {
    id: 'python_runtime',
    name: 'Python Runtime',
    nameJa: 'Python 実行環境',
    description: 'Embedded Python execution environment for script execution',
    descriptionJa: 'スクリプト実行のための Python 実行環境',
    sizeMB: 150,
    selection: 'optional',
    defaultChecked: false,
    dependsOn: ['core'],
    addonModuleId: 'python_runtime',
    innoSetupTypes: ['full'],
  },
];

/**
 * 全製品のコンポーネント定義マップ
 *
 * コンポーネント選択に対応しない製品（INMV/INIG/INCA/INPY/IVIN/ISOF）は
 * core のみのシングルコンポーネントとして定義される。
 */
const INSTALLER_COMPONENT_CONFIGS: Partial<Record<ProductCode, InstallerComponent[]>> = {
  INBT: INBT_COMPONENTS,
  INSS: createInsightOfficeComponents('INSS'),
  IOSH: createInsightOfficeComponents('IOSH'),
  IOSD: createInsightOfficeComponents('IOSD'),
};

/** 製品のインストーラーコンポーネント一覧を取得 */
export function getInstallerComponents(product: ProductCode): InstallerComponent[] {
  const components = INSTALLER_COMPONENT_CONFIGS[product];
  if (components) return components;

  // コンポーネント選択非対応の製品はコアのみ
  const productInfo = PRODUCTS[product];
  return [
    {
      id: 'core',
      name: `${productInfo.name}`,
      nameJa: `${productInfo.name}`,
      description: `${productInfo.name} application`,
      descriptionJa: `${productInfo.name} アプリケーション`,
      sizeMB: 50,
      selection: 'required',
      defaultChecked: true,
      dependsOn: [],
      addonModuleId: null,
      innoSetupTypes: ['full', 'compact', 'custom'],
    },
  ];
}

/**
 * インストーラーのサイズ計算
 *
 * @param product 製品コード
 * @param selectedIds 選択されたコンポーネント ID（省略時はデフォルト選択を使用）
 */
export function calculateInstallerSize(
  product: ProductCode,
  selectedIds?: string[],
): ComponentSizeResult {
  const components = getInstallerComponents(product);

  const checkedComponents = components.map(c => {
    const checked = selectedIds
      ? selectedIds.includes(c.id) || c.selection === 'required'
      : c.defaultChecked;
    return { ...c, checked };
  });

  return {
    selectedMB: checkedComponents
      .filter(c => c.checked)
      .reduce((sum, c) => sum + c.sizeMB, 0),
    totalMB: components.reduce((sum, c) => sum + c.sizeMB, 0),
    components: checkedComponents,
  };
}

/**
 * デフォルト選択のコンポーネント ID 一覧を取得
 */
export function getDefaultComponentSelection(product: ProductCode): string[] {
  return getInstallerComponents(product)
    .filter(c => c.defaultChecked)
    .map(c => c.id);
}

/**
 * Inno Setup [Components] セクション用のエントリを生成
 *
 * @example
 * ```
 * generateInnoSetupComponents('IOSH')
 * // [
 * //   'Name: "core"; Description: "InsightOfficeSheet 本体（必須）"; Types: full compact custom; Flags: fixed',
 * //   'Name: "ai_assistant"; Description: "AI アシスタント（推奨）  5 MB"; Types: full compact custom',
 * //   'Name: "python_runtime"; Description: "Python 実行環境（オプション）  150 MB"; Types: full',
 * // ]
 * ```
 */
export function generateInnoSetupComponents(product: ProductCode): string[] {
  const components = getInstallerComponents(product);
  if (components.length <= 1) return []; // シングルコンポーネントの場合はセクション不要

  return components.map(c => {
    const label = c.selection === 'required' ? '必須'
      : c.selection === 'recommended' ? '推奨'
      : 'オプション';
    const sizeLabel = c.selection === 'required' ? '' : `  ${c.sizeMB} MB`;
    const desc = `${c.nameJa}（${label}）${sizeLabel}`;
    const types = c.innoSetupTypes.join(' ');
    const flags = c.selection === 'required' ? '; Flags: fixed' : '';
    return `Name: "${c.id}"; Description: "${desc}"; Types: ${types}${flags}`;
  });
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // 個別構成
  INBT_INSTALLER,
  INSS_INSTALLER,
  IOSH_INSTALLER,
  IOSD_INSTALLER,
  INMV_INSTALLER,
  INIG_INSTALLER,
  INCA_INSTALLER,
  INPY_INSTALLER,
  IVIN_INSTALLER,
  ISOF_INSTALLER,

  // 全製品マップ
  INSTALLER_CONFIGS,

  // クエリ
  getInstallerConfig,

  // コマンド生成
  getServiceInstallCommands,
  getFirewallCommands,
  getFirewallRemoveCommands,

  // Inno Setup 生成
  generateInnoSetupRegistry,
  generateInnoSetupRun,
  generateInnoSetupConfig,
  generateInnoSetupComponents,

  // コンポーネント選択
  getInstallerComponents,
  calculateInstallerSize,
  getDefaultComponentSelection,
};
