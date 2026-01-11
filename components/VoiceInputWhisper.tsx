"use client";

/**
 * VoiceInputWhisper - iOS対応の音声入力コンポーネント
 *
 * - MediaRecorder API で録音（iOS Safari対応）
 * - Whisper API で文字起こし
 * - Web Speech API と同じインターフェース
 *
 * 使用例:
 * ```tsx
 * <VoiceInputWhisper
 *   onTranscript={(text) => console.log(text)}
 *   apiEndpoint="/api/transcribe"
 * />
 * ```
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceInputWhisperProps {
  onTranscript: (text: string) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onError?: (error: string) => void;
  apiEndpoint?: string;
  disabled?: boolean;
  maxDuration?: number; // 最大録音時間（秒）
  className?: string;
}

type RecordingState = "idle" | "recording" | "processing";

export function VoiceInputWhisper({
  onTranscript,
  onStartRecording,
  onStopRecording,
  onError,
  apiEndpoint = "/api/transcribe",
  disabled = false,
  maxDuration = 60,
  className = "",
}: VoiceInputWhisperProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // サポートチェック
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      navigator.mediaDevices &&
      typeof MediaRecorder !== "undefined";
    setIsSupported(supported);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 録音開始
  const startRecording = useCallback(async () => {
    if (disabled || state !== "idle") return;

    try {
      // マイクアクセス取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // MIMEタイプ選択（iOS対応）
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/wav";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // ストリーム停止
        stream.getTracks().forEach((track) => track.stop());

        // 処理中状態に
        setState("processing");

        // Blobを作成
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Base64に変換
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];

          try {
            // Whisper API呼び出し
            const response = await fetch(apiEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                audio: base64,
                mimeType,
              }),
            });

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data?.text) {
              onTranscript(result.data.text);
            } else if (result.error) {
              onError?.(result.error.message || "文字起こしに失敗しました");
            }
          } catch (err) {
            console.error("Transcription error:", err);
            onError?.(err instanceof Error ? err.message : "エラーが発生しました");
          } finally {
            setState("idle");
            setDuration(0);
          }
        };
        reader.readAsDataURL(blob);
      };

      // 録音開始
      mediaRecorder.start(1000); // 1秒ごとにデータ取得
      setState("recording");
      setDuration(0);
      onStartRecording?.();

      // タイマー開始
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      onError?.("マイクへのアクセスが拒否されました");
      setState("idle");
    }
  }, [disabled, state, apiEndpoint, maxDuration, onTranscript, onError, onStartRecording]);

  // 録音停止
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      onStopRecording?.();
    }
  }, [state, onStopRecording]);

  // ボタンクリック
  const handleClick = useCallback(() => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
  }, [state, startRecording, stopRecording]);

  // 時間フォーマット
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className={`opacity-50 cursor-not-allowed ${className}`}
        title="お使いのブラウザは音声入力に対応していません"
      >
        🎤
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state === "processing"}
      className={`
        relative inline-flex items-center justify-center
        w-10 h-10 rounded-full
        transition-all duration-200
        ${state === "idle" ? "bg-gray-100 hover:bg-gray-200" : ""}
        ${state === "recording" ? "bg-red-500 animate-pulse" : ""}
        ${state === "processing" ? "bg-blue-500" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      title={
        state === "idle"
          ? "クリックして録音開始"
          : state === "recording"
          ? "クリックして録音停止"
          : "処理中..."
      }
    >
      {state === "idle" && <span className="text-lg">🎤</span>}
      {state === "recording" && (
        <>
          <span className="text-white text-lg">⏹</span>
          <span className="absolute -bottom-5 text-xs text-red-500 font-mono">
            {formatDuration(duration)}
          </span>
        </>
      )}
      {state === "processing" && (
        <span className="text-white text-sm animate-spin">⏳</span>
      )}
    </button>
  );
}

export default VoiceInputWhisper;
