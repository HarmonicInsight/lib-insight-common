/**
 * useTtsRN - React Native 向けテキスト読み上げフック
 *
 * expo-speech を使用した React Native 向け TTS。
 * Web 版の useTts と同じインターフェースを提供する。
 *
 * ## 依存ライブラリ
 * ```bash
 * npx expo install expo-speech
 * ```
 *
 * ## 特徴
 * - iOS / Android ネイティブ TTS エンジン使用
 * - キュー管理（複数テキストの順次読み上げ）
 * - 日本語デフォルト
 * - Web 版と同じ型インターフェース
 *
 * @example
 * ```tsx
 * import { useTtsRN } from '@/insight-common/hooks/useTts.native';
 *
 * const { speak, stop, isSpeaking } = useTtsRN({ language: 'ja-JP' });
 *
 * return (
 *   <Pressable onPress={() => speak('こんにちは')}>
 *     <Text>{isSpeaking ? '停止' : '読み上げ'}</Text>
 *   </Pressable>
 * );
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import type {
  TtsPlaybackState,
  TtsSpeakOptions,
  TtsSpeakResult,
  TtsError,
  TtsQueueItem,
  TtsLanguage,
} from '../config/tts';
import { splitTextForTts } from '../config/tts';

// =============================================================================
// フック設定型
// =============================================================================

export interface UseTtsRNConfig {
  /** 速度（0.5〜2.0） */
  speed?: number;
  /** ピッチ（0.5〜2.0） */
  pitch?: number;
  /** 言語 */
  language?: TtsLanguage;
  /** iOS の voice ID（例: 'com.apple.voice.compact.ja-JP.Kyoko'） */
  iosVoiceId?: string;
  /** エラーハンドラ */
  onError?: (error: TtsError) => void;
  /** 状態変化ハンドラ */
  onStateChange?: (state: TtsPlaybackState) => void;
}

export interface UseTtsRNReturn {
  speak: (text: string, options?: TtsSpeakOptions) => Promise<TtsSpeakResult>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  enqueue: (texts: string[], options?: TtsSpeakOptions) => void;
  clearQueue: () => void;
  state: TtsPlaybackState;
  isSpeaking: boolean;
  queue: TtsQueueItem[];
  /** 利用可能な音声一覧を取得 */
  getAvailableVoices: () => Promise<Speech.Voice[]>;
}

// =============================================================================
// ユーティリティ
// =============================================================================

let queueIdCounter = 0;
function generateQueueId(): string {
  queueIdCounter += 1;
  return `tts-rn-${Date.now()}-${queueIdCounter}`;
}

function createTtsError(
  code: TtsError['code'],
  message: string,
  messageJa: string,
): TtsError {
  return { code, message, messageJa };
}

// =============================================================================
// メインフック
// =============================================================================

export function useTtsRN(userConfig: UseTtsRNConfig = {}): UseTtsRNReturn {
  const {
    speed = 1.0,
    pitch = 1.0,
    language = 'ja-JP',
    iosVoiceId,
    onError,
    onStateChange,
  } = userConfig;

  const [state, setState] = useState<TtsPlaybackState>('idle');
  const [queue, setQueue] = useState<TtsQueueItem[]>([]);

  const isProcessingQueueRef = useRef(false);
  const cancelledRef = useRef(false);

  // 状態変化通知
  useEffect(() => {
    onStateChange?.(state);
  }, [state]);

  // 1 テキストの読み上げ
  const speakSingle = useCallback(
    async (text: string, options: TtsSpeakOptions = {}): Promise<TtsSpeakResult> => {
      if (!text.trim()) return { success: true };

      const chunks = splitTextForTts(text, 'web_speech'); // ネイティブ TTS は 5000 文字まで OK

      for (const chunk of chunks) {
        if (cancelledRef.current) {
          return {
            success: false,
            error: createTtsError('CANCELLED', 'Speech cancelled', '読み上げがキャンセルされました'),
          };
        }

        setState('speaking');

        try {
          await new Promise<void>((resolve, reject) => {
            Speech.speak(chunk, {
              language: options.language ?? language,
              rate: options.speed ?? speed,
              pitch: options.pitch ?? pitch,
              voice: iosVoiceId,
              onStart: () => {
                options.onStart?.();
              },
              onDone: () => {
                options.onEnd?.();
                resolve();
              },
              onError: (err) => {
                reject(err);
              },
              onStopped: () => {
                resolve();
              },
            });
          });
        } catch (err) {
          const error = createTtsError(
            'AUDIO_PLAYBACK_FAILED',
            `Native TTS error: ${err instanceof Error ? err.message : 'unknown'}`,
            `読み上げエラー: ${err instanceof Error ? err.message : '不明なエラー'}`,
          );
          options.onError?.(error);
          onError?.(error);
          setState('idle');
          return { success: false, error };
        }
      }

      setState('idle');
      return { success: true };
    },
    [language, speed, pitch, iosVoiceId, onError],
  );

  // キュー処理
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (true) {
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

  // speak
  const speak = useCallback(
    async (text: string, options: TtsSpeakOptions = {}): Promise<TtsSpeakResult> => {
      cancelledRef.current = false;
      Speech.stop();
      setQueue([]);
      return speakSingle(text, options);
    },
    [speakSingle],
  );

  // stop
  const stop = useCallback(() => {
    cancelledRef.current = true;
    Speech.stop();
    setState('idle');
    setQueue((prev) =>
      prev.map((item) =>
        item.state === 'queued' || item.state === 'speaking'
          ? { ...item, state: 'done' }
          : item,
      ),
    );
  }, []);

  // pause / resume
  const pause = useCallback(() => {
    Speech.pause();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    Speech.resume();
    setState('speaking');
  }, []);

  // enqueue
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
      setTimeout(() => processQueue(), 0);
    },
    [processQueue],
  );

  // clearQueue
  const clearQueue = useCallback(() => {
    stop();
    setQueue([]);
  }, [stop]);

  // getAvailableVoices
  const getAvailableVoices = useCallback(async (): Promise<Speech.Voice[]> => {
    return Speech.getAvailableVoicesAsync();
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      Speech.stop();
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
    getAvailableVoices,
  };
}

export default useTtsRN;
