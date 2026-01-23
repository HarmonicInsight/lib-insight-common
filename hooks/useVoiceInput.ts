/**
 * useVoiceInput - 統一音声入力フック
 *
 * クロスプラットフォーム対応（Web/iOS/Android）
 * - Web (Chrome/Edge): Web Speech APIの自動文末検出を使用
 * - Web (Safari iOS): Whisper API
 * - React Native: expo-speech-recognition + 自動コミットタイマー
 *
 * 特徴:
 * - 1.5秒間無音で自動コミット（プラットフォームの挙動を統一）
 * - interimテキストのリアルタイム表示
 * - finalテキストの確定
 *
 * @example Web (React)
 * ```tsx
 * const { isListening, interimText, startListening, stopListening } = useVoiceInput({
 *   onFinalText: (text) => appendToField(text),
 *   autoCommitDelay: 1500,
 * });
 * ```
 *
 * @example React Native
 * ```tsx
 * import { useVoiceInputRN } from '@/insight-common/hooks/useVoiceInput.native';
 * ```
 */

export interface VoiceInputConfig {
  /** 確定テキストのコールバック */
  onFinalText: (text: string) => void;
  /** 途中テキストのコールバック（オプション） */
  onInterimText?: (text: string) => void;
  /** 自動コミット遅延（ミリ秒）- デフォルト1500ms */
  autoCommitDelay?: number;
  /** 言語設定 - デフォルト 'ja-JP' */
  language?: string;
  /** Web Speech APIがisFinalを返した場合も遅延を適用するか */
  forceAutoCommitDelay?: boolean;
  /** エラーコールバック */
  onError?: (error: string) => void;
  /** 開始コールバック */
  onStart?: () => void;
  /** 停止コールバック */
  onStop?: () => void;
}

export interface VoiceInputState {
  /** 現在リスニング中か */
  isListening: boolean;
  /** 途中テキスト */
  interimText: string;
  /** 利用可能な方式 */
  method: 'webspeech' | 'whisper' | 'native' | 'none';
  /** エラーメッセージ */
  error: string | null;
}

export interface VoiceInputActions {
  /** リスニング開始 */
  startListening: () => void;
  /** リスニング停止 */
  stopListening: () => void;
  /** 途中テキストをクリア */
  clearInterim: () => void;
  /** 途中テキストを手動でコミット */
  commitInterim: () => void;
}

export type UseVoiceInputReturn = VoiceInputState & VoiceInputActions;

// デフォルト設定
export const DEFAULT_AUTO_COMMIT_DELAY = 1500;
export const DEFAULT_LANGUAGE = 'ja-JP';

/**
 * Web向け音声入力フック
 *
 * Chrome/EdgeではWeb Speech APIを使用
 * iOS SafariではWhisperへフォールバック（要別途実装）
 */
export function useVoiceInput(config: VoiceInputConfig): UseVoiceInputReturn {
  // Webでの実装はクライアントサイドのみ
  if (typeof window === 'undefined') {
    return {
      isListening: false,
      interimText: '',
      method: 'none',
      error: null,
      startListening: () => {},
      stopListening: () => {},
      clearInterim: () => {},
      commitInterim: () => {},
    };
  }

  // Dynamic import for client-side only
  const { useState, useRef, useCallback, useEffect } = require('react');

  const {
    onFinalText,
    onInterimText,
    autoCommitDelay = DEFAULT_AUTO_COMMIT_DELAY,
    language = DEFAULT_LANGUAGE,
    forceAutoCommitDelay = false,
    onError,
    onStart,
    onStop,
  } = config;

  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [method, setMethod] = useState<'webspeech' | 'whisper' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const autoCommitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterimRef = useRef<string>('');

  // 利用可能な方式を判定
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isIOS && isSafari) {
        setMethod('whisper'); // iOS SafariはWhisper推奨
      } else {
        setMethod('webspeech');
      }
    } else {
      setMethod('whisper');
    }
  }, []);

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

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearAutoCommitTimer();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [clearAutoCommitTimer]);

  // リスニング開始
  const startListening = useCallback(() => {
    if (method !== 'webspeech') {
      setError('Web Speech APIがサポートされていません');
      onError?.('Web Speech APIがサポートされていません');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Final結果の処理
      if (final) {
        if (forceAutoCommitDelay) {
          // 強制遅延モード: isFinalでも遅延を適用
          setInterimText(final);
          onInterimText?.(final);
          scheduleAutoCommit(final);
        } else {
          // 通常モード: isFinalは即座にコミット
          clearAutoCommitTimer();
          setInterimText('');
          lastInterimRef.current = '';
          onFinalText(final);
        }
      }

      // Interim結果の処理
      if (interim) {
        setInterimText(interim);
        onInterimText?.(interim);
        scheduleAutoCommit(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        const errorMsg = `音声認識エラー: ${event.error}`;
        setError(errorMsg);
        onError?.(errorMsg);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // 残っているinterimをコミット
      if (lastInterimRef.current.trim()) {
        commitInterim();
      }
      onStop?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [
    method,
    language,
    forceAutoCommitDelay,
    onFinalText,
    onInterimText,
    onError,
    onStart,
    onStop,
    scheduleAutoCommit,
    clearAutoCommitTimer,
    commitInterim,
  ]);

  // リスニング停止
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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
    method,
    error,
    startListening,
    stopListening,
    clearInterim,
    commitInterim,
  };
}

export default useVoiceInput;
