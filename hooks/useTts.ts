/**
 * useTts - 統一テキスト読み上げフック（Web 版）
 *
 * Web アプリ向けの TTS フック。3 つのエンジンに対応:
 * - Web Speech API（ブラウザ内蔵・無料・即時）
 * - VoiceVox（localhost・無料・高品質日本語）
 * - ElevenLabs（クラウド・有料・多言語）
 *
 * ## 特徴
 * - エンジン自動フォールバック
 * - キュー管理（複数テキストの順次読み上げ）
 * - 一時停止・再開
 * - フォネーム抽出（VoiceVox）
 * - 長文自動分割
 *
 * @example 基本的な使い方
 * ```tsx
 * const { speak, stop, isSpeaking } = useTts({ engine: 'web_speech' });
 *
 * return (
 *   <button onClick={() => speak('こんにちは、今日の業績を報告します。')}>
 *     読み上げ
 *   </button>
 * );
 * ```
 *
 * @example キュー読み上げ
 * ```tsx
 * const { enqueue, queue, isSpeaking, stop } = useTts({ engine: 'voicevox' });
 *
 * const paragraphs = ['第1段落の内容...', '第2段落の内容...', '第3段落の内容...'];
 * enqueue(paragraphs);
 * ```
 *
 * @example フォネーム取得（リップシンク用）
 * ```tsx
 * const { speak } = useTts({
 *   engine: 'voicevox',
 *   enablePhonemes: true,
 * });
 *
 * await speak('こんにちは', {
 *   onPhoneme: (event) => animateLipSync(event.phoneme, event.timeMs),
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  TtsEngineId,
  TtsPlaybackState,
  TtsConfig,
  TtsSpeakOptions,
  TtsSpeakResult,
  TtsPhonemeEvent,
  TtsBoundaryEvent,
  TtsError,
  TtsQueueItem,
  TtsEngineSettings,
  TtsLanguage,
} from '../config/tts';
import {
  TTS_ENGINES,
  TTS_TEXT_LIMITS,
  getDefaultTtsConfig,
  getTtsVoicePreset,
  splitTextForTts,
  selectTtsEngine,
} from '../config/tts';

// =============================================================================
// フック設定型
// =============================================================================

export interface UseTtsConfig {
  /** TTS エンジン */
  engine?: TtsEngineId;
  /** 音声プリセット ID */
  voicePreset?: string;
  /** 速度（0.5〜2.0） */
  speed?: number;
  /** ピッチ（0.5〜2.0） */
  pitch?: number;
  /** 音量（0.0〜1.0） */
  volume?: number;
  /** 言語 */
  language?: TtsLanguage;
  /** フォネーム抽出有効化 */
  enablePhonemes?: boolean;
  /** エンジン固有の設定 */
  engineSettings?: TtsEngineSettings;
  /** グローバルエラーハンドラ */
  onError?: (error: TtsError) => void;
  /** 読み上げ状態変化ハンドラ */
  onStateChange?: (state: TtsPlaybackState) => void;
}

export interface UseTtsReturn {
  /** 1 テキストを読み上げ（Promise で完了を待てる） */
  speak: (text: string, options?: TtsSpeakOptions) => Promise<TtsSpeakResult>;
  /** 読み上げ停止 */
  stop: () => void;
  /** 一時停止 */
  pause: () => void;
  /** 再開 */
  resume: () => void;
  /** キューに追加 */
  enqueue: (texts: string[], options?: TtsSpeakOptions) => void;
  /** キューをクリア */
  clearQueue: () => void;
  /** 現在の再生状態 */
  state: TtsPlaybackState;
  /** 読み上げ中か（state === 'speaking'） */
  isSpeaking: boolean;
  /** キュー内容 */
  queue: TtsQueueItem[];
  /** 現在使用中のエンジン */
  activeEngine: TtsEngineId;
  /** エンジンの利用可否 */
  engineAvailable: boolean;
  /** 設定を動的に変更 */
  updateConfig: (config: Partial<UseTtsConfig>) => void;
}

// =============================================================================
// 内部ユーティリティ
// =============================================================================

let queueIdCounter = 0;
function generateQueueId(): string {
  queueIdCounter += 1;
  return `tts-${Date.now()}-${queueIdCounter}`;
}

function createTtsError(
  code: TtsError['code'],
  message: string,
  messageJa: string,
): TtsError {
  return { code, message, messageJa };
}

// =============================================================================
// エンジン実装
// =============================================================================

/**
 * Web Speech API で読み上げ
 */
function speakWithWebSpeech(
  text: string,
  config: TtsConfig,
  options: TtsSpeakOptions,
): Promise<TtsSpeakResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve({
        success: false,
        error: createTtsError(
          'ENGINE_NOT_AVAILABLE',
          'Web Speech API is not available',
          'Web Speech API が利用できません',
        ),
      });
      return;
    }

    // 既存の読み上げをキャンセル
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.language ?? config.language;
    utterance.rate = options.speed ?? config.speed;
    utterance.pitch = options.pitch ?? config.pitch;
    utterance.volume = options.volume ?? config.volume;

    // 音声の選択
    const preset = getTtsVoicePreset(config.voicePresetId);
    const preferredVoiceUri = config.engineSettings.webSpeechVoiceUri
      ?? preset?.engineVoiceIds.web_speech;
    if (preferredVoiceUri) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(
        (v) =>
          v.name === preferredVoiceUri ||
          v.name.includes(preferredVoiceUri) ||
          v.voiceURI === preferredVoiceUri,
      );
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onboundary = (event) => {
      if (options.onBoundary) {
        const boundaryEvent: TtsBoundaryEvent = {
          type: event.name === 'sentence' ? 'sentence' : 'word',
          charIndex: event.charIndex,
          charLength: event.charLength ?? 0,
        };
        options.onBoundary(boundaryEvent);
      }
    };

    utterance.onend = () => {
      options.onEnd?.();
      resolve({ success: true });
    };

    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        resolve({
          success: false,
          error: createTtsError('CANCELLED', 'Speech cancelled', '読み上げがキャンセルされました'),
        });
      } else {
        const error = createTtsError(
          'AUDIO_PLAYBACK_FAILED',
          `Web Speech error: ${event.error}`,
          `読み上げエラー: ${event.error}`,
        );
        options.onError?.(error);
        resolve({ success: false, error });
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * VoiceVox で読み上げ
 */
async function speakWithVoiceVox(
  text: string,
  config: TtsConfig,
  options: TtsSpeakOptions,
): Promise<TtsSpeakResult> {
  const baseUrl = config.engineSettings.voicevoxBaseUrl ?? 'http://localhost:50021';
  const preset = getTtsVoicePreset(config.voicePresetId);
  const speakerId = config.engineSettings.voicevoxSpeakerId
    ?? (preset?.engineVoiceIds.voicevox ? parseInt(preset.engineVoiceIds.voicevox, 10) : 3);
  const speed = options.speed ?? config.speed;

  try {
    // Step 1: audio_query
    const queryResponse = await fetch(
      `${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
      { method: 'POST' },
    );

    if (!queryResponse.ok) {
      return {
        success: false,
        error: createTtsError(
          'ENGINE_CONNECTION_FAILED',
          'VoiceVox audio_query failed',
          'VoiceVox の音声クエリに失敗しました',
        ),
      };
    }

    const queryJson = await queryResponse.json();

    // フォネーム抽出
    const phonemes: TtsPhonemeEvent[] = [];
    if (config.enablePhonemes && queryJson.accent_phrases) {
      let timeMs = 0;
      for (const phrase of queryJson.accent_phrases) {
        if (phrase.moras) {
          for (const mora of phrase.moras) {
            if (mora.vowel) {
              const durationMs = (mora.vowel_length ?? 0.1) * 1000;
              phonemes.push({
                timeMs: Math.round(timeMs),
                phoneme: mora.vowel,
                durationMs: Math.round(durationMs),
              });
              options.onPhoneme?.({ timeMs: Math.round(timeMs), phoneme: mora.vowel, durationMs: Math.round(durationMs) });
            }
            timeMs += (mora.vowel_length ?? 0.1) * 1000;
          }
        }
      }
    }

    // Step 2: synthesis
    const synthResponse = await fetch(
      `${baseUrl}/synthesis?speaker=${speakerId}&speed_scale=${speed}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryJson),
      },
    );

    if (!synthResponse.ok) {
      return {
        success: false,
        error: createTtsError(
          'ENGINE_CONNECTION_FAILED',
          'VoiceVox synthesis failed',
          'VoiceVox の音声合成に失敗しました',
        ),
      };
    }

    const audioData = await synthResponse.arrayBuffer();

    // WAV 再生
    options.onStart?.();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = options.volume ?? config.volume;
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const durationMs = Math.round(audioBuffer.duration * 1000);

    return new Promise((resolve) => {
      source.onended = () => {
        audioContext.close();
        options.onEnd?.();
        resolve({
          success: true,
          audioData,
          audioFormat: 'wav',
          durationMs,
          phonemes,
        });
      };
      source.start();
    });
  } catch (err) {
    const error = createTtsError(
      'ENGINE_CONNECTION_FAILED',
      `VoiceVox error: ${err instanceof Error ? err.message : 'unknown'}`,
      'VoiceVox に接続できません。VoiceVox が起動していることを確認してください。',
    );
    options.onError?.(error);
    return { success: false, error };
  }
}

/**
 * ElevenLabs で読み上げ
 */
async function speakWithElevenLabs(
  text: string,
  config: TtsConfig,
  options: TtsSpeakOptions,
): Promise<TtsSpeakResult> {
  const apiKey = config.engineSettings.elevenlabsApiKey;
  if (!apiKey) {
    return {
      success: false,
      error: createTtsError(
        'API_KEY_MISSING',
        'ElevenLabs API key not configured',
        'ElevenLabs の API キーが設定されていません',
      ),
    };
  }

  const preset = getTtsVoicePreset(config.voicePresetId);
  const voiceId = config.engineSettings.elevenlabsVoiceId
    ?? preset?.engineVoiceIds.elevenlabs
    ?? '21m00Tcm4TlvDq8ikWAM';
  const modelId = config.engineSettings.elevenlabsModelId ?? 'eleven_multilingual_v2';

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );

    if (response.status === 429) {
      return {
        success: false,
        error: createTtsError(
          'RATE_LIMIT',
          'ElevenLabs rate limit exceeded',
          'ElevenLabs の利用制限に達しました。しばらく待ってからお試しください。',
        ),
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: createTtsError(
          'API_ERROR',
          `ElevenLabs API error: ${response.status}`,
          `ElevenLabs API エラー: ${response.status}`,
        ),
      };
    }

    const audioData = await response.arrayBuffer();

    // MP3 再生
    options.onStart?.();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = options.volume ?? config.volume;
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const durationMs = Math.round(audioBuffer.duration * 1000);

    return new Promise((resolve) => {
      source.onended = () => {
        audioContext.close();
        options.onEnd?.();
        resolve({
          success: true,
          audioData,
          audioFormat: 'mp3',
          durationMs,
        });
      };
      source.start();
    });
  } catch (err) {
    const error = createTtsError(
      'API_ERROR',
      `ElevenLabs error: ${err instanceof Error ? err.message : 'unknown'}`,
      `ElevenLabs エラー: ${err instanceof Error ? err.message : '不明なエラー'}`,
    );
    options.onError?.(error);
    return { success: false, error };
  }
}

// =============================================================================
// メインフック
// =============================================================================

export function useTts(userConfig: UseTtsConfig = {}): UseTtsReturn {
  const defaultConfig = getDefaultTtsConfig('web');

  const [config, setConfig] = useState<TtsConfig>(() => ({
    ...defaultConfig,
    engine: userConfig.engine ?? defaultConfig.engine,
    voicePresetId: userConfig.voicePreset ?? defaultConfig.voicePresetId,
    speed: userConfig.speed ?? defaultConfig.speed,
    pitch: userConfig.pitch ?? defaultConfig.pitch,
    volume: userConfig.volume ?? defaultConfig.volume,
    language: userConfig.language ?? defaultConfig.language,
    enablePhonemes: userConfig.enablePhonemes ?? defaultConfig.enablePhonemes,
    engineSettings: {
      ...defaultConfig.engineSettings,
      ...userConfig.engineSettings,
    },
  }));

  const [state, setState] = useState<TtsPlaybackState>('idle');
  const [queue, setQueue] = useState<TtsQueueItem[]>([]);
  const [engineAvailable, setEngineAvailable] = useState(true);

  const isProcessingQueueRef = useRef(false);
  const cancelledRef = useRef(false);

  // 実際に使用するエンジンを決定
  const activeEngine = selectTtsEngine(
    config.engine,
    'web',
    config.engineSettings,
    config.language,
  );

  // エンジンの利用可否チェック（初回とエンジン変更時）
  useEffect(() => {
    if (activeEngine === 'web_speech') {
      setEngineAvailable(typeof window !== 'undefined' && 'speechSynthesis' in window);
    } else if (activeEngine === 'voicevox') {
      // VoiceVox 接続テスト
      const baseUrl = config.engineSettings.voicevoxBaseUrl ?? 'http://localhost:50021';
      fetch(`${baseUrl}/version`, { signal: AbortSignal.timeout(3000) })
        .then((res) => setEngineAvailable(res.ok))
        .catch(() => setEngineAvailable(false));
    } else if (activeEngine === 'elevenlabs') {
      setEngineAvailable(!!config.engineSettings.elevenlabsApiKey);
    }
  }, [activeEngine, config.engineSettings]);

  // 状態変化通知
  useEffect(() => {
    userConfig.onStateChange?.(state);
  }, [state]);

  // 1 テキストの読み上げ実行
  const speakSingle = useCallback(
    async (text: string, options: TtsSpeakOptions = {}): Promise<TtsSpeakResult> => {
      if (!text.trim()) {
        return { success: true };
      }

      setState('loading');

      // 長文分割
      const chunks = splitTextForTts(text, activeEngine);

      const allPhonemes: TtsPhonemeEvent[] = [];
      let totalDurationMs = 0;

      for (const chunk of chunks) {
        if (cancelledRef.current) {
          return {
            success: false,
            error: createTtsError('CANCELLED', 'Speech cancelled', '読み上げがキャンセルされました'),
          };
        }

        setState('speaking');

        let result: TtsSpeakResult;
        switch (activeEngine) {
          case 'voicevox':
            result = await speakWithVoiceVox(chunk, config, options);
            break;
          case 'elevenlabs':
            result = await speakWithElevenLabs(chunk, config, options);
            break;
          case 'web_speech':
          default:
            result = await speakWithWebSpeech(chunk, config, options);
            break;
        }

        if (!result.success) {
          setState('idle');
          return result;
        }

        if (result.phonemes) allPhonemes.push(...result.phonemes);
        if (result.durationMs) totalDurationMs += result.durationMs;
      }

      setState('idle');
      return {
        success: true,
        durationMs: totalDurationMs,
        phonemes: allPhonemes.length > 0 ? allPhonemes : undefined,
      };
    },
    [activeEngine, config],
  );

  // キュー処理
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (true) {
      // 次の queued アイテムを見つける
      let nextItem: TtsQueueItem | undefined;
      setQueue((prev) => {
        const idx = prev.findIndex((item) => item.state === 'queued');
        if (idx === -1) return prev;
        nextItem = prev[idx];
        const updated = [...prev];
        updated[idx] = { ...updated[idx], state: 'speaking' };
        return updated;
      });

      if (!nextItem || cancelledRef.current) break;

      const itemId = nextItem.id;
      const result = await speakSingle(nextItem.text, nextItem.options);

      setQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, state: result.success ? 'done' : 'error' }
            : item,
        ),
      );
    }

    isProcessingQueueRef.current = false;
  }, [speakSingle]);

  // speak: 即座に読み上げ（キューをクリアして割り込み）
  const speak = useCallback(
    async (text: string, options: TtsSpeakOptions = {}): Promise<TtsSpeakResult> => {
      cancelledRef.current = false;
      // 既存の再生を停止
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setQueue([]);
      return speakSingle(text, options);
    },
    [speakSingle],
  );

  // stop: 停止
  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
    setQueue((prev) =>
      prev.map((item) =>
        item.state === 'queued' || item.state === 'speaking'
          ? { ...item, state: 'done' }
          : item,
      ),
    );
  }, []);

  // pause / resume（Web Speech API のみ）
  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setState('paused');
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setState('speaking');
    }
  }, []);

  // enqueue: キューに追加して順次読み上げ
  const enqueue = useCallback(
    (texts: string[], options?: TtsSpeakOptions) => {
      cancelledRef.current = false;
      const newItems: TtsQueueItem[] = texts
        .filter((t) => t.trim())
        .map((text) => ({
          text,
          options,
          id: generateQueueId(),
          state: 'queued' as const,
        }));

      setQueue((prev) => [...prev, ...newItems]);

      // キュー処理を開始（次の tick で）
      setTimeout(() => processQueue(), 0);
    },
    [processQueue],
  );

  // clearQueue
  const clearQueue = useCallback(() => {
    stop();
    setQueue([]);
  }, [stop]);

  // updateConfig
  const updateConfig = useCallback((partial: Partial<UseTtsConfig>) => {
    setConfig((prev) => ({
      ...prev,
      engine: partial.engine ?? prev.engine,
      voicePresetId: partial.voicePreset ?? prev.voicePresetId,
      speed: partial.speed ?? prev.speed,
      pitch: partial.pitch ?? prev.pitch,
      volume: partial.volume ?? prev.volume,
      language: partial.language ?? prev.language,
      enablePhonemes: partial.enablePhonemes ?? prev.enablePhonemes,
      engineSettings: {
        ...prev.engineSettings,
        ...partial.engineSettings,
      },
    }));
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    enqueue,
    clearQueue,
    state,
    isSpeaking: state === 'speaking',
    queue,
    activeEngine,
    engineAvailable,
    updateConfig,
  };
}

export default useTts;
