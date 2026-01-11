"use client";

/**
 * VoiceInputUnified - 統合音声入力コンポーネント
 *
 * 自動でベストな方法を選択:
 * - Chrome/Edge: Web Speech API（無料）
 * - Safari iOS: Whisper API（有料だがiOSで動く）
 *
 * 使用例:
 * ```tsx
 * <VoiceInputUnified
 *   onTranscript={(text) => console.log(text)}
 *   onInterimTranscript={(text) => console.log('途中:', text)}
 * />
 * ```
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceInputUnifiedProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onError?: (error: string) => void;
  whisperEndpoint?: string;
  disabled?: boolean;
  maxDuration?: number;
  className?: string;
  // コスト制御
  forceWhisper?: boolean; // 強制的にWhisper使用
  allowWhisper?: boolean; // Whisperフォールバック許可（デフォルトtrue）
}

type InputState = "idle" | "listening" | "recording" | "processing";
type InputMethod = "webspeech" | "whisper" | "none";

// Web Speech API 型定義
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function VoiceInputUnified({
  onTranscript,
  onInterimTranscript,
  onStartListening,
  onStopListening,
  onError,
  whisperEndpoint = "/api/transcribe",
  disabled = false,
  maxDuration = 60,
  className = "",
  forceWhisper = false,
  allowWhisper = true,
}: VoiceInputUnifiedProps) {
  const [state, setState] = useState<InputState>("idle");
  const [method, setMethod] = useState<InputMethod>("none");
  const [duration, setDuration] = useState(0);

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 利用可能な方法を判定
  useEffect(() => {
    if (typeof window === "undefined") {
      setMethod("none");
      return;
    }

    // 強制Whisperモード
    if (forceWhisper && allowWhisper) {
      setMethod("whisper");
      return;
    }

    // Web Speech API チェック
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      // iOS Safari判定（Web Speech APIあるが制限あり）
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isIOS && isSafari && allowWhisper) {
        // iOS SafariはWhisper推奨
        setMethod("whisper");
      } else {
        // それ以外はWeb Speech API
        setMethod("webspeech");
      }
    } else if (allowWhisper) {
      // Web Speech API非対応 → Whisper
      setMethod("whisper");
    } else {
      setMethod("none");
    }
  }, [forceWhisper, allowWhisper]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ========================================
  // Web Speech API
  // ========================================
  const startWebSpeech = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("Web Speech APIがサポートされていません");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setState("listening");
      onStartListening?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
      if (interimTranscript) {
        onInterimTranscript?.(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        onError?.(`音声認識エラー: ${event.error}`);
      }
      setState("idle");
    };

    recognition.onend = () => {
      setState("idle");
      onStopListening?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, onInterimTranscript, onStartListening, onStopListening, onError]);

  const stopWebSpeech = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // ========================================
  // Whisper API
  // ========================================
  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setState("processing");

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];

          try {
            const response = await fetch(whisperEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64, mimeType }),
            });

            const result = await response.json();

            if (result.success && result.data?.text) {
              onTranscript(result.data.text);
            } else {
              onError?.(result.error?.message || "文字起こし失敗");
            }
          } catch (err) {
            onError?.(err instanceof Error ? err.message : "エラー");
          } finally {
            setState("idle");
            setDuration(0);
            onStopListening?.();
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(1000);
      setState("recording");
      setDuration(0);
      onStartListening?.();

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= maxDuration) stopWhisper();
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      onError?.("マイクへのアクセスが拒否されました");
      setState("idle");
    }
  }, [whisperEndpoint, maxDuration, onTranscript, onError, onStartListening, onStopListening]);

  const stopWhisper = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  // ========================================
  // 統合ハンドラー
  // ========================================
  const handleClick = useCallback(() => {
    if (state === "idle") {
      if (method === "webspeech") {
        startWebSpeech();
      } else if (method === "whisper") {
        startWhisper();
      }
    } else if (state === "listening") {
      stopWebSpeech();
    } else if (state === "recording") {
      stopWhisper();
    }
  }, [state, method, startWebSpeech, stopWebSpeech, startWhisper, stopWhisper]);

  // 時間フォーマット
  const formatDuration = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

  // 非対応
  if (method === "none") {
    return (
      <button disabled className={`opacity-50 ${className}`} title="非対応">
        🎤
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        disabled={disabled || state === "processing"}
        className={`
          relative inline-flex items-center justify-center
          w-10 h-10 rounded-full transition-all duration-200
          ${state === "idle" ? "bg-gray-100 hover:bg-gray-200" : ""}
          ${state === "listening" ? "bg-green-500 animate-pulse" : ""}
          ${state === "recording" ? "bg-red-500 animate-pulse" : ""}
          ${state === "processing" ? "bg-blue-500" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        title={
          state === "idle"
            ? `クリックで開始 (${method === "webspeech" ? "無料" : "Whisper"})`
            : state === "listening" || state === "recording"
            ? "クリックで停止"
            : "処理中..."
        }
      >
        {state === "idle" && <span className="text-lg">🎤</span>}
        {state === "listening" && <span className="text-white text-lg">🎤</span>}
        {state === "recording" && <span className="text-white text-lg">⏹</span>}
        {state === "processing" && <span className="text-white animate-spin">⏳</span>}
      </button>

      {/* 録音時間表示 (Whisperモード) */}
      {state === "recording" && (
        <span className="ml-2 text-xs text-red-500 font-mono">
          {formatDuration(duration)}
        </span>
      )}

      {/* 方式表示 (開発用、本番では消す) */}
      {process.env.NODE_ENV === "development" && state === "idle" && (
        <span className="ml-1 text-[10px] text-gray-400">
          {method === "webspeech" ? "free" : "$"}
        </span>
      )}
    </div>
  );
}

export default VoiceInputUnified;
