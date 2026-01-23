/**
 * useVoiceInputRN - React Native向け統一音声入力フック
 *
 * expo-speech-recognition を使用
 * - 1.5秒間無音で自動コミット
 * - iOS/Android両対応
 *
 * 依存関係:
 * - expo-speech-recognition
 *
 * @example
 * ```tsx
 * import { useVoiceInputRN } from '@/insight-common/hooks/useVoiceInput.native';
 *
 * function VoiceInput() {
 *   const {
 *     isListening,
 *     interimText,
 *     startListening,
 *     stopListening,
 *   } = useVoiceInputRN({
 *     onFinalText: (text) => appendToTextField(text),
 *   });
 *
 *   return (
 *     <View>
 *       <Text>{interimText}</Text>
 *       <Button
 *         title={isListening ? "停止" : "開始"}
 *         onPress={isListening ? stopListening : startListening}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import type {
  VoiceInputConfig,
  UseVoiceInputReturn,
} from './useVoiceInput';

export {
  DEFAULT_AUTO_COMMIT_DELAY,
  DEFAULT_LANGUAGE,
} from './useVoiceInput';

import {
  DEFAULT_AUTO_COMMIT_DELAY,
  DEFAULT_LANGUAGE,
} from './useVoiceInput';

export interface VoiceInputRNConfig extends VoiceInputConfig {
  /** Android向け: 認識モデル（デフォルト: 'default'） */
  androidModel?: 'default' | 'online' | 'offline';
  /** iOS向け: 認識タスク（デフォルト: 'dictation'） */
  iosTaskHint?: 'dictation' | 'search' | 'confirmation';
}

/**
 * React Native向け音声入力フック
 *
 * expo-speech-recognition を使用し、
 * 1.5秒の自動コミット機能でWeb版と同じ体験を提供
 */
export function useVoiceInputRN(config: VoiceInputRNConfig): UseVoiceInputReturn {
  const {
    onFinalText,
    onInterimText,
    autoCommitDelay = DEFAULT_AUTO_COMMIT_DELAY,
    language = DEFAULT_LANGUAGE,
    onError,
    onStart,
    onStop,
    androidModel = 'default',
    iosTaskHint = 'dictation',
  } = config;

  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const autoCommitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterimRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);

  // 自動コミットタイマーをクリア
  const clearAutoCommitTimer = useCallback(() => {
    if (autoCommitTimerRef.current) {
      clearTimeout(autoCommitTimerRef.current);
      autoCommitTimerRef.current = null;
    }
  }, []);

  // interimテキストをコミット
  const commitInterim = useCallback(() => {
    clearAutoCommitTimer();
    const textToCommit = lastInterimRef.current.trim();
    if (textToCommit) {
      onFinalText(textToCommit);
      setInterimText('');
      lastInterimRef.current = '';
    }
  }, [onFinalText, clearAutoCommitTimer]);

  // 自動コミットタイマーをセット
  const scheduleAutoCommit = useCallback((text: string) => {
    clearAutoCommitTimer();
    lastInterimRef.current = text;

    autoCommitTimerRef.current = setTimeout(() => {
      // タイマー発火時、最後のinterimと同じならコミット
      if (lastInterimRef.current === text && text.trim()) {
        commitInterim();
      }
    }, autoCommitDelay);
  }, [autoCommitDelay, clearAutoCommitTimer, commitInterim]);

  // 音声認識結果イベント
  useSpeechRecognitionEvent('result', (event) => {
    if (!isListeningRef.current) return;

    const results = event.results;
    if (!results || results.length === 0) return;

    // 最新の結果を取得
    const latestResult = results[results.length - 1];
    if (!latestResult || latestResult.length === 0) return;

    const transcript = latestResult[0]?.transcript || '';
    const isFinal = latestResult.isFinal;

    if (isFinal) {
      // Final結果: 即座にコミット（自動コミットタイマーもクリア）
      clearAutoCommitTimer();
      setInterimText('');
      lastInterimRef.current = '';
      if (transcript.trim()) {
        onFinalText(transcript);
      }
    } else {
      // Interim結果: 表示して自動コミットタイマーをセット
      setInterimText(transcript);
      onInterimText?.(transcript);
      if (transcript.trim()) {
        scheduleAutoCommit(transcript);
      }
    }
  });

  // エラーイベント
  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    const errorMsg = event.message || `音声認識エラー: ${event.error}`;
    setError(errorMsg);
    onError?.(errorMsg);
    setIsListening(false);
    isListeningRef.current = false;
  });

  // 開始イベント
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    isListeningRef.current = true;
    setError(null);
    onStart?.();
  });

  // 終了イベント
  useSpeechRecognitionEvent('end', () => {
    // 残っているinterimをコミット
    if (lastInterimRef.current.trim()) {
      commitInterim();
    }
    setIsListening(false);
    isListeningRef.current = false;
    onStop?.();
  });

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearAutoCommitTimer();
      if (isListeningRef.current) {
        ExpoSpeechRecognitionModule.stop();
      }
    };
  }, [clearAutoCommitTimer]);

  // リスニング開始
  const startListening = useCallback(async () => {
    try {
      // パーミッション確認
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        const errorMsg = 'マイクへのアクセスが許可されていません';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // 認識開始
      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: true,
        // Android固有設定
        androidIntentOptions: {
          // @ts-ignore - expo-speech-recognition型定義の問題
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: autoCommitDelay,
        },
        // iOS固有設定
        iosTaskHint: iosTaskHint,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '音声認識の開始に失敗しました';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [language, autoCommitDelay, iosTaskHint, onError]);

  // リスニング停止
  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  // interimテキストをクリア
  const clearInterim = useCallback(() => {
    clearAutoCommitTimer();
    setInterimText('');
    lastInterimRef.current = '';
  }, [clearAutoCommitTimer]);

  return {
    isListening,
    interimText,
    method: 'native',
    error,
    startListening,
    stopListening,
    clearInterim,
    commitInterim,
  };
}

export default useVoiceInputRN;
