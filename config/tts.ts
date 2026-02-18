/**
 * TTS (Text-to-Speech) 標準化モジュール
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * InsightOffice 系アプリ（INSS/IOSH/IOSD）および全製品で使える
 * 汎用テキスト読み上げ機能。日本語を第一言語としつつ多言語対応。
 *
 * ## 対応エンジン
 *
 * | エンジン          | 種別   | 費用     | 日本語品質 | 用途                     |
 * |-------------------|--------|----------|:----------:|--------------------------|
 * | Web Speech API    | ブラウザ内蔵 | 無料 | ○ | Web アプリ（軽量・即時）  |
 * | VoiceVox          | ローカル    | 無料 | ◎ | デスクトップ（高品質日本語）|
 * | ElevenLabs        | クラウド    | 有料 | ○ | 多言語・カスタム音声      |
 *
 * ## アーキテクチャ
 *
 * ```
 * ┌─────────────────────────────────────────────────────┐
 * │  アプリ（React / C# / React Native）                 │
 * │                                                     │
 * │  useTts() / TtsPlayer / TtsService                  │
 * │       ↓                                             │
 * │  ┌──────────────────────────────────────────────┐   │
 * │  │  TTS エンジンアダプター                        │   │
 * │  │                                              │   │
 * │  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
 * │  │  │WebSpeech │ │VoiceVox  │ │ ElevenLabs   │ │   │
 * │  │  │(ブラウザ)│ │(localhost)│ │ (クラウド)    │ │   │
 * │  │  └──────────┘ └──────────┘ └──────────────┘ │   │
 * │  └──────────────────────────────────────────────┘   │
 * │       ↓                                             │
 * │  音声出力 + フォネーム（リップシンク用）               │
 * └─────────────────────────────────────────────────────┘
 * ```
 *
 * ## 使用例
 *
 * ```typescript
 * import { TTS_ENGINES, TTS_VOICE_PRESETS, getDefaultTtsConfig } from '@/insight-common/config/tts';
 * import { useTts } from '@/insight-common/hooks/useTts';
 *
 * // React Hook
 * const { speak, stop, isSpeaking, queue } = useTts({
 *   engine: 'web_speech',
 *   voicePreset: 'ja_female_default',
 * });
 * await speak('こんにちは、今日の業績を報告します。');
 *
 * // キュー読み上げ（段落ごとに順次読み上げ）
 * queue(['第1四半期の売上は...', '第2四半期は...', '通期では...']);
 * ```
 */

// =============================================================================
// 型定義
// =============================================================================

/** TTS エンジン ID */
export type TtsEngineId = 'web_speech' | 'voicevox' | 'elevenlabs';

/** 読み上げ状態 */
export type TtsPlaybackState = 'idle' | 'speaking' | 'paused' | 'loading';

/** 音声プリセットカテゴリ */
export type VoiceGender = 'female' | 'male' | 'neutral';

/** 対応言語 */
export type TtsLanguage = 'ja-JP' | 'en-US' | 'en-GB' | 'ko-KR' | 'zh-CN';

/**
 * TTS エンジン定義
 */
export interface TtsEngineDefinition {
  /** エンジン ID */
  id: TtsEngineId;
  /** 名前（英語） */
  name: string;
  /** 名前（日本語） */
  nameJa: string;
  /** 説明 */
  description: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 種別 */
  type: 'browser' | 'local' | 'cloud';
  /** 費用 */
  cost: 'free' | 'paid';
  /** 対応プラットフォーム */
  platforms: ('web' | 'desktop' | 'mobile')[];
  /** フォネーム抽出対応 */
  supportsPhonemes: boolean;
  /** SSML 対応 */
  supportsSsml: boolean;
  /** ストリーミング対応 */
  supportsStreaming: boolean;
  /** 対応言語 */
  languages: TtsLanguage[];
  /** 日本語品質（1-5） */
  japaneseQuality: number;
  /** 必要な設定キー */
  requiredSettings: string[];
  /** デフォルト設定 */
  defaultSettings: Record<string, unknown>;
}

/**
 * TTS 音声プリセット
 *
 * 各エンジン固有の voice ID を抽象化し、
 * 「日本語・女性・デフォルト」のような意味のある名前で選択可能にする。
 */
export interface TtsVoicePreset {
  /** プリセット ID */
  id: string;
  /** 表示名（日本語） */
  nameJa: string;
  /** 表示名（英語） */
  name: string;
  /** 性別 */
  gender: VoiceGender;
  /** 主要言語 */
  language: TtsLanguage;
  /** エンジン別の voice ID マッピング */
  engineVoiceIds: Partial<Record<TtsEngineId, string>>;
  /** 推奨速度 */
  defaultSpeed: number;
  /** 推奨ピッチ */
  defaultPitch: number;
  /** 説明 */
  description: string;
}

/**
 * TTS 設定（アプリ単位で保持）
 */
export interface TtsConfig {
  /** 使用エンジン */
  engine: TtsEngineId;
  /** 音声プリセット ID */
  voicePresetId: string;
  /** 読み上げ速度（0.5〜2.0） */
  speed: number;
  /** ピッチ（0.5〜2.0） */
  pitch: number;
  /** 音量（0.0〜1.0） */
  volume: number;
  /** 言語 */
  language: TtsLanguage;
  /** フォネーム抽出を有効化（リップシンク用） */
  enablePhonemes: boolean;
  /** エンジン固有の設定 */
  engineSettings: TtsEngineSettings;
}

/**
 * エンジン固有の設定
 */
export interface TtsEngineSettings {
  /** VoiceVox: ベース URL */
  voicevoxBaseUrl?: string;
  /** VoiceVox: スピーカー ID */
  voicevoxSpeakerId?: number;
  /** ElevenLabs: API キー */
  elevenlabsApiKey?: string;
  /** ElevenLabs: Voice ID */
  elevenlabsVoiceId?: string;
  /** ElevenLabs: モデル ID */
  elevenlabsModelId?: string;
  /** Web Speech API: voice URI（ブラウザ固有） */
  webSpeechVoiceUri?: string;
}

/**
 * TTS 読み上げオプション（speak() 呼び出し時のオーバーライド）
 */
export interface TtsSpeakOptions {
  /** 速度オーバーライド */
  speed?: number;
  /** ピッチオーバーライド */
  pitch?: number;
  /** 音量オーバーライド */
  volume?: number;
  /** 言語オーバーライド */
  language?: TtsLanguage;
  /** 優先度（高い方がキューの先頭に入る） */
  priority?: 'normal' | 'high';
  /** 感情タグ（アバター表情連携用） */
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
  /** コールバック: 読み上げ開始 */
  onStart?: () => void;
  /** コールバック: 読み上げ完了 */
  onEnd?: () => void;
  /** コールバック: フォネーム（リップシンク用） */
  onPhoneme?: (phoneme: TtsPhonemeEvent) => void;
  /** コールバック: 進捗（バウンダリイベント） */
  onBoundary?: (event: TtsBoundaryEvent) => void;
  /** コールバック: エラー */
  onError?: (error: TtsError) => void;
}

/**
 * TTS 読み上げ結果
 */
export interface TtsSpeakResult {
  /** 成功したか */
  success: boolean;
  /** 音声データ（VoiceVox / ElevenLabs の場合） */
  audioData?: ArrayBuffer;
  /** 音声フォーマット */
  audioFormat?: 'wav' | 'mp3' | 'opus';
  /** 再生時間（ミリ秒） */
  durationMs?: number;
  /** フォネーム配列（リップシンク用） */
  phonemes?: TtsPhonemeEvent[];
  /** エラー情報 */
  error?: TtsError;
}

/**
 * フォネームイベント（リップシンク連携用）
 */
export interface TtsPhonemeEvent {
  /** タイミング（ミリ秒） */
  timeMs: number;
  /** フォネーム文字列 */
  phoneme: string;
  /** 持続時間（ミリ秒） */
  durationMs?: number;
}

/**
 * バウンダリイベント（単語・文の境界）
 */
export interface TtsBoundaryEvent {
  /** 種別 */
  type: 'word' | 'sentence';
  /** テキスト内の文字位置 */
  charIndex: number;
  /** テキスト内の文字数 */
  charLength: number;
}

/**
 * TTS エラー
 */
export interface TtsError {
  /** エラーコード */
  code: TtsErrorCode;
  /** エラーメッセージ（英語） */
  message: string;
  /** エラーメッセージ（日本語） */
  messageJa: string;
}

/** TTS エラーコード */
export type TtsErrorCode =
  | 'ENGINE_NOT_AVAILABLE'
  | 'ENGINE_CONNECTION_FAILED'
  | 'API_KEY_MISSING'
  | 'API_ERROR'
  | 'RATE_LIMIT'
  | 'TEXT_TOO_LONG'
  | 'VOICE_NOT_FOUND'
  | 'AUDIO_PLAYBACK_FAILED'
  | 'CANCELLED'
  | 'UNKNOWN';

/**
 * TTS キューアイテム
 */
export interface TtsQueueItem {
  /** テキスト */
  text: string;
  /** オプション */
  options?: TtsSpeakOptions;
  /** キュー内の ID */
  id: string;
  /** 状態 */
  state: 'queued' | 'speaking' | 'done' | 'error';
}

// =============================================================================
// エンジン定義
// =============================================================================

export const TTS_ENGINES: Record<TtsEngineId, TtsEngineDefinition> = {
  web_speech: {
    id: 'web_speech',
    name: 'Web Speech API',
    nameJa: 'Web Speech API（ブラウザ内蔵）',
    description: 'Browser built-in TTS. Free, instant, no setup required.',
    descriptionJa: 'ブラウザ内蔵の読み上げ機能。無料、即時利用可能、セットアップ不要。',
    type: 'browser',
    cost: 'free',
    platforms: ['web', 'mobile'],
    supportsPhonemes: false,
    supportsSsml: false,
    supportsStreaming: true,
    languages: ['ja-JP', 'en-US', 'en-GB', 'ko-KR', 'zh-CN'],
    japaneseQuality: 3,
    requiredSettings: [],
    defaultSettings: {},
  },

  voicevox: {
    id: 'voicevox',
    name: 'VoiceVox',
    nameJa: 'VoiceVox（ローカル高品質）',
    description: 'Local high-quality Japanese TTS. Free, requires VoiceVox installation.',
    descriptionJa: 'ローカル動作の高品質日本語音声合成。無料、VoiceVox のインストールが必要。',
    type: 'local',
    cost: 'free',
    platforms: ['desktop'],
    supportsPhonemes: true,
    supportsSsml: false,
    supportsStreaming: false,
    languages: ['ja-JP'],
    japaneseQuality: 5,
    requiredSettings: [],
    defaultSettings: {
      voicevoxBaseUrl: 'http://localhost:50021',
      voicevoxSpeakerId: 3,
    },
  },

  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    nameJa: 'ElevenLabs（クラウド多言語）',
    description: 'Cloud-based multilingual TTS with custom voice cloning.',
    descriptionJa: 'クラウド型の多言語対応音声合成。カスタム音声クローニング対応。',
    type: 'cloud',
    cost: 'paid',
    platforms: ['web', 'desktop', 'mobile'],
    supportsPhonemes: false,
    supportsSsml: true,
    supportsStreaming: true,
    languages: ['ja-JP', 'en-US', 'en-GB', 'ko-KR', 'zh-CN'],
    japaneseQuality: 4,
    requiredSettings: ['elevenlabsApiKey'],
    defaultSettings: {
      elevenlabsModelId: 'eleven_multilingual_v2',
      elevenlabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
    },
  },
};

// =============================================================================
// 音声プリセット
// =============================================================================

export const TTS_VOICE_PRESETS: TtsVoicePreset[] = [
  // ----- 日本語 -----
  {
    id: 'ja_female_default',
    nameJa: '日本語（女性・標準）',
    name: 'Japanese Female Default',
    gender: 'female',
    language: 'ja-JP',
    engineVoiceIds: {
      web_speech: 'Google 日本語',
      voicevox: '3',         // ずんだもん
      elevenlabs: '21m00Tcm4TlvDq8ikWAM',
    },
    defaultSpeed: 1.0,
    defaultPitch: 1.0,
    description: 'Standard Japanese female voice for general reading.',
  },
  {
    id: 'ja_female_slow',
    nameJa: '日本語（女性・ゆっくり）',
    name: 'Japanese Female Slow',
    gender: 'female',
    language: 'ja-JP',
    engineVoiceIds: {
      web_speech: 'Google 日本語',
      voicevox: '3',
      elevenlabs: '21m00Tcm4TlvDq8ikWAM',
    },
    defaultSpeed: 0.75,
    defaultPitch: 1.0,
    description: 'Slower Japanese female voice for accessibility.',
  },
  {
    id: 'ja_male_default',
    nameJa: '日本語（男性・標準）',
    name: 'Japanese Male Default',
    gender: 'male',
    language: 'ja-JP',
    engineVoiceIds: {
      web_speech: 'Google 日本語',
      voicevox: '13',        // 青山龍星
      elevenlabs: 'pNInz6obpgDQGcFmaJgB',
    },
    defaultSpeed: 1.0,
    defaultPitch: 0.9,
    description: 'Standard Japanese male voice for general reading.',
  },
  {
    id: 'ja_female_narrator',
    nameJa: '日本語（女性・ナレーター）',
    name: 'Japanese Female Narrator',
    gender: 'female',
    language: 'ja-JP',
    engineVoiceIds: {
      web_speech: 'Google 日本語',
      voicevox: '2',         // 四国めたん
      elevenlabs: 'EXAVITQu4vr4xnSDxMaL',
    },
    defaultSpeed: 0.9,
    defaultPitch: 1.0,
    description: 'Professional narrator voice for presentations.',
  },

  // ----- 英語 -----
  {
    id: 'en_female_default',
    nameJa: '英語（女性・標準）',
    name: 'English Female Default',
    gender: 'female',
    language: 'en-US',
    engineVoiceIds: {
      web_speech: 'Google US English',
      elevenlabs: 'EXAVITQu4vr4xnSDxMaL',
    },
    defaultSpeed: 1.0,
    defaultPitch: 1.0,
    description: 'Standard English female voice.',
  },
  {
    id: 'en_male_default',
    nameJa: '英語（男性・標準）',
    name: 'English Male Default',
    gender: 'male',
    language: 'en-US',
    engineVoiceIds: {
      web_speech: 'Google US English',
      elevenlabs: 'pNInz6obpgDQGcFmaJgB',
    },
    defaultSpeed: 1.0,
    defaultPitch: 0.9,
    description: 'Standard English male voice.',
  },
];

// =============================================================================
// テキスト制限
// =============================================================================

/** エンジン別のテキスト上限（文字数） */
export const TTS_TEXT_LIMITS: Record<TtsEngineId, number> = {
  web_speech: 5000,
  voicevox: 200,      // VoiceVox は短文ごとに分割推奨
  elevenlabs: 5000,
};

/**
 * 長文を TTS エンジンに適した単位に分割する
 *
 * 日本語の文末（。！？）で区切り、各チャンクがエンジンの上限以内になるようにする。
 */
export function splitTextForTts(text: string, engine: TtsEngineId): string[] {
  const limit = TTS_TEXT_LIMITS[engine];
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  // 日本語の文末（。！？）または英語の文末（. ! ?）で分割
  const sentences = text.split(/(?<=[。！？.!?])\s*/);

  let current = '';
  for (const sentence of sentences) {
    if (current.length + sentence.length > limit) {
      if (current) chunks.push(current.trim());
      // 1文でも上限を超える場合はさらに分割
      if (sentence.length > limit) {
        for (let i = 0; i < sentence.length; i += limit) {
          chunks.push(sentence.slice(i, i + limit));
        }
        current = '';
      } else {
        current = sentence;
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// =============================================================================
// デフォルト設定
// =============================================================================

/**
 * デフォルト TTS 設定を取得
 *
 * プラットフォームに応じて最適なエンジンを自動選択する。
 */
export function getDefaultTtsConfig(platform: 'web' | 'desktop' | 'mobile' = 'web'): TtsConfig {
  const engine: TtsEngineId = platform === 'desktop' ? 'voicevox' : 'web_speech';

  return {
    engine,
    voicePresetId: 'ja_female_default',
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: 'ja-JP',
    enablePhonemes: false,
    engineSettings: {
      ...TTS_ENGINES[engine].defaultSettings as TtsEngineSettings,
    },
  };
}

/**
 * 音声プリセットを ID で取得
 */
export function getTtsVoicePreset(presetId: string): TtsVoicePreset | undefined {
  return TTS_VOICE_PRESETS.find((p) => p.id === presetId);
}

/**
 * 言語でフィルタした音声プリセットを取得
 */
export function getTtsVoicePresetsByLanguage(language: TtsLanguage): TtsVoicePreset[] {
  return TTS_VOICE_PRESETS.filter((p) => p.language === language);
}

/**
 * エンジンの利用可否を検証
 */
export function validateTtsEngine(
  engineId: TtsEngineId,
  settings: TtsEngineSettings,
): { available: boolean; missingSettings: string[]; messageJa: string } {
  const engine = TTS_ENGINES[engineId];
  if (!engine) {
    return {
      available: false,
      missingSettings: [],
      messageJa: `不明なエンジン: ${engineId}`,
    };
  }

  const missing: string[] = [];
  for (const key of engine.requiredSettings) {
    const value = settings[key as keyof TtsEngineSettings];
    if (!value) missing.push(key);
  }

  if (missing.length > 0) {
    return {
      available: false,
      missingSettings: missing,
      messageJa: `以下の設定が必要です: ${missing.join(', ')}`,
    };
  }

  return { available: true, missingSettings: [], messageJa: '利用可能' };
}

/**
 * プラットフォームで利用可能なエンジン一覧を取得
 */
export function getAvailableTtsEngines(
  platform: 'web' | 'desktop' | 'mobile',
): TtsEngineDefinition[] {
  return Object.values(TTS_ENGINES).filter((e) => e.platforms.includes(platform));
}

/**
 * エンジン自動選択（フォールバック付き）
 *
 * 優先順位:
 * 1. 指定されたエンジン（利用可能な場合）
 * 2. VoiceVox（デスクトップかつ日本語の場合）
 * 3. Web Speech API（ブラウザの場合）
 * 4. ElevenLabs（API キーがある場合）
 */
export function selectTtsEngine(
  preferred: TtsEngineId,
  platform: 'web' | 'desktop' | 'mobile',
  settings: TtsEngineSettings,
  language: TtsLanguage = 'ja-JP',
): TtsEngineId {
  // 指定エンジンが使えるか確認
  const validation = validateTtsEngine(preferred, settings);
  const engine = TTS_ENGINES[preferred];
  if (validation.available && engine.platforms.includes(platform)) {
    return preferred;
  }

  // フォールバック
  if (platform === 'desktop' && language === 'ja-JP') {
    const voicevoxCheck = validateTtsEngine('voicevox', settings);
    if (voicevoxCheck.available) return 'voicevox';
  }

  if (platform === 'web' || platform === 'mobile') {
    return 'web_speech';
  }

  const elevenlabsCheck = validateTtsEngine('elevenlabs', settings);
  if (elevenlabsCheck.available) return 'elevenlabs';

  return 'web_speech';
}

// =============================================================================
// ライセンス連携
// =============================================================================

/** TTS 機能が利用可能なプラン */
export const TTS_ALLOWED_PLANS = ['TRIAL', 'STD', 'PRO', 'ENT'] as const;

/** エンジン別のプラン制限 */
export const TTS_ENGINE_PLAN_REQUIREMENTS: Record<TtsEngineId, readonly string[]> = {
  web_speech: ['TRIAL', 'STD', 'PRO', 'ENT'],
  voicevox: ['TRIAL', 'STD', 'PRO', 'ENT'],
  elevenlabs: ['TRIAL', 'PRO', 'ENT'],
};

/**
 * TTS 機能の利用可否をライセンスで判定
 */
export function canUseTts(
  plan: string,
  engine: TtsEngineId = 'web_speech',
): { allowed: boolean; reasonJa?: string } {
  const allowedPlans = TTS_ENGINE_PLAN_REQUIREMENTS[engine];
  if (!allowedPlans.includes(plan)) {
    return {
      allowed: false,
      reasonJa: `${TTS_ENGINES[engine].nameJa} は ${allowedPlans.join('/')} プランで利用可能です`,
    };
  }
  return { allowed: true };
}

// =============================================================================
// VoiceVox ヘルパー
// =============================================================================

/** VoiceVox スピーカー一覧（主要キャラクター） */
export const VOICEVOX_SPEAKERS = [
  { id: 0, name: '四国めたん（あまあま）', nameEn: 'Shikoku Metan (Sweet)' },
  { id: 2, name: '四国めたん（ノーマル）', nameEn: 'Shikoku Metan (Normal)' },
  { id: 3, name: 'ずんだもん（ノーマル）', nameEn: 'Zundamon (Normal)' },
  { id: 6, name: 'ずんだもん（あまあま）', nameEn: 'Zundamon (Sweet)' },
  { id: 8, name: '春日部つむぎ', nameEn: 'Kasukabe Tsumugi' },
  { id: 10, name: '雨晴はう', nameEn: 'Amehare Hau' },
  { id: 11, name: '波音リツ', nameEn: 'Namine Ritsu' },
  { id: 13, name: '青山龍星', nameEn: 'Aoyama Ryusei' },
  { id: 14, name: '冥鳴ひまり', nameEn: 'Meimei Himari' },
  { id: 23, name: 'WhiteCUL（ノーマル）', nameEn: 'WhiteCUL (Normal)' },
  { id: 42, name: 'ちび式じい', nameEn: 'Chibishiki Jii' },
  { id: 46, name: 'No.7（ノーマル）', nameEn: 'No.7 (Normal)' },
  { id: 47, name: 'No.7（アナウンス）', nameEn: 'No.7 (Announce)' },
  { id: 51, name: 'ナースロボ＿タイプＴ（ノーマル）', nameEn: 'Nurse Robo Type-T (Normal)' },
] as const;

/**
 * VoiceVox の接続テスト
 *
 * ```typescript
 * const ok = await checkVoicevoxConnection('http://localhost:50021');
 * ```
 */
export async function checkVoicevoxConnection(
  baseUrl: string = 'http://localhost:50021',
): Promise<{ connected: boolean; version?: string; speakers?: number }> {
  try {
    const response = await fetch(`${baseUrl}/version`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return { connected: false };
    const version = await response.text();

    const speakersResponse = await fetch(`${baseUrl}/speakers`, { signal: AbortSignal.timeout(3000) });
    const speakers = speakersResponse.ok
      ? (await speakersResponse.json() as unknown[]).length
      : 0;

    return { connected: true, version: version.replace(/"/g, ''), speakers };
  } catch {
    return { connected: false };
  }
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  TTS_ENGINES,
  TTS_VOICE_PRESETS,
  TTS_TEXT_LIMITS,
  getDefaultTtsConfig,
  getTtsVoicePreset,
  getTtsVoicePresetsByLanguage,
  validateTtsEngine,
  getAvailableTtsEngines,
  selectTtsEngine,
  splitTextForTts,
  canUseTts,
  checkVoicevoxConnection,
  VOICEVOX_SPEAKERS,
};
