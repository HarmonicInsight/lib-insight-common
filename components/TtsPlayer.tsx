"use client";

/**
 * TtsPlayer - 汎用テキスト読み上げ UI コンポーネント
 *
 * どのアプリにもドロップインで組み込める読み上げプレイヤー。
 * useTts フックのラッパーとして、再生/停止/一時停止ボタンと
 * エンジン選択、速度調整の UI を提供する。
 *
 * ## 使い方
 *
 * ### 最小構成（テキストを渡すだけ）
 * ```tsx
 * <TtsPlayer text="こんにちは、今日の業績を報告します。" />
 * ```
 *
 * ### 複数段落（キュー読み上げ）
 * ```tsx
 * <TtsPlayer
 *   texts={['第1段落の内容...', '第2段落の内容...', '第3段落の内容...']}
 * />
 * ```
 *
 * ### カスタマイズ
 * ```tsx
 * <TtsPlayer
 *   text={selectedText}
 *   engine="voicevox"
 *   voicePreset="ja_female_narrator"
 *   speed={0.9}
 *   showEngineSelector
 *   showSpeedControl
 *   compact
 * />
 * ```
 *
 * ### ヘッドレス（UI なし、ロジックだけ使う）
 * ```tsx
 * import { useTts } from '@/insight-common/hooks/useTts';
 * // 直接 useTts を使ってください
 * ```
 */

import { useState, useCallback, useEffect } from "react";
import { useTts } from "../hooks/useTts";
import type { UseTtsConfig } from "../hooks/useTts";
import type { TtsEngineId, TtsSpeakResult } from "../config/tts";
import { TTS_ENGINES, getAvailableTtsEngines, TTS_VOICE_PRESETS } from "../config/tts";

// =============================================================================
// Props
// =============================================================================

export interface TtsPlayerProps {
  /** 読み上げテキスト（単一） */
  text?: string;
  /** 読み上げテキスト（複数 → キュー順次読み上げ） */
  texts?: string[];

  // --- エンジン設定 ---
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
  /** エンジン固有設定 */
  engineSettings?: UseTtsConfig["engineSettings"];

  // --- UI オプション ---
  /** エンジン選択 UI を表示 */
  showEngineSelector?: boolean;
  /** 速度調整スライダーを表示 */
  showSpeedControl?: boolean;
  /** 音声プリセット選択を表示 */
  showVoiceSelector?: boolean;
  /** コンパクトモード（ボタンのみ） */
  compact?: boolean;
  /** 無効化 */
  disabled?: boolean;
  /** 追加 CSS クラス */
  className?: string;

  // --- コールバック ---
  /** 読み上げ完了 */
  onComplete?: (result: TtsSpeakResult) => void;
  /** エラー */
  onError?: (error: string) => void;
}

// =============================================================================
// コンポーネント
// =============================================================================

export function TtsPlayer({
  text,
  texts,
  engine,
  voicePreset,
  speed: initialSpeed = 1.0,
  pitch = 1.0,
  volume = 1.0,
  engineSettings,
  showEngineSelector = false,
  showSpeedControl = false,
  showVoiceSelector = false,
  compact = false,
  disabled = false,
  className = "",
  onComplete,
  onError,
}: TtsPlayerProps) {
  const [currentSpeed, setCurrentSpeed] = useState(initialSpeed);

  const {
    speak,
    stop,
    pause,
    resume,
    enqueue,
    clearQueue,
    state,
    isSpeaking,
    queue,
    activeEngine,
    engineAvailable,
    updateConfig,
  } = useTts({
    engine,
    voicePreset,
    speed: currentSpeed,
    pitch,
    volume,
    engineSettings,
    onError: (err) => onError?.(err.messageJa),
  });

  // テキスト変更時に停止
  useEffect(() => {
    stop();
  }, [text, texts]);

  // エンジン変更
  const handleEngineChange = useCallback(
    (newEngine: TtsEngineId) => {
      stop();
      updateConfig({ engine: newEngine });
    },
    [stop, updateConfig],
  );

  // 速度変更
  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setCurrentSpeed(newSpeed);
      updateConfig({ speed: newSpeed });
    },
    [updateConfig],
  );

  // 音声プリセット変更
  const handleVoiceChange = useCallback(
    (presetId: string) => {
      updateConfig({ voicePreset: presetId });
    },
    [updateConfig],
  );

  // 再生/停止ハンドラ
  const handlePlayStop = useCallback(async () => {
    if (isSpeaking || state === "paused") {
      stop();
      return;
    }

    if (texts && texts.length > 0) {
      enqueue(texts);
    } else if (text) {
      const result = await speak(text);
      onComplete?.(result);
    }
  }, [isSpeaking, state, text, texts, speak, stop, enqueue, onComplete]);

  // 一時停止/再開ハンドラ
  const handlePauseResume = useCallback(() => {
    if (state === "paused") {
      resume();
    } else if (state === "speaking") {
      pause();
    }
  }, [state, pause, resume]);

  const availableEngines = getAvailableTtsEngines("web");

  // --- コンパクトモード ---
  if (compact) {
    return (
      <button
        onClick={handlePlayStop}
        disabled={disabled || !engineAvailable || state === "loading"}
        className={`
          inline-flex items-center justify-center
          w-8 h-8 rounded-full transition-all duration-200
          ${state === "idle" ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : ""}
          ${state === "speaking" ? "bg-amber-100 text-amber-700" : ""}
          ${state === "paused" ? "bg-gray-200 text-gray-600" : ""}
          ${state === "loading" ? "bg-gray-100 text-gray-400" : ""}
          ${disabled || !engineAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        title={
          state === "idle"
            ? "読み上げ開始"
            : state === "speaking"
            ? "停止"
            : state === "loading"
            ? "読み込み中..."
            : "再開"
        }
      >
        {state === "idle" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        {state === "speaking" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z" />
          </svg>
        )}
        {state === "loading" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
        )}
        {state === "paused" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    );
  }

  // --- フルモード ---
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* コントロールバー */}
      <div className="flex items-center gap-2">
        {/* 再生/停止ボタン */}
        <button
          onClick={handlePlayStop}
          disabled={disabled || !engineAvailable || state === "loading"}
          className={`
            inline-flex items-center justify-center
            w-10 h-10 rounded-full transition-all duration-200
            ${state === "idle" ? "bg-[#B8942F] hover:bg-[#A07D25] text-white" : ""}
            ${state === "speaking" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
            ${state === "paused" ? "bg-[#B8942F] hover:bg-[#A07D25] text-white" : ""}
            ${state === "loading" ? "bg-gray-300 text-gray-500" : ""}
            ${disabled || !engineAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          title={state === "idle" ? "読み上げ開始" : "停止"}
        >
          {(state === "idle" || state === "paused") && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {state === "speaking" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z" />
            </svg>
          )}
          {state === "loading" && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* 一時停止/再開（Web Speech API のみ） */}
        {activeEngine === "web_speech" && state !== "idle" && state !== "loading" && (
          <button
            onClick={handlePauseResume}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full
                       bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200"
            title={state === "paused" ? "再開" : "一時停止"}
          >
            {state === "paused" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
        )}

        {/* 状態表示 */}
        <span className="text-sm text-[#57534E]">
          {state === "idle" && "準備完了"}
          {state === "loading" && "読み込み中..."}
          {state === "speaking" && "読み上げ中..."}
          {state === "paused" && "一時停止中"}
        </span>

        {/* キュー進捗 */}
        {queue.length > 0 && (
          <span className="text-xs text-[#57534E] ml-auto">
            {queue.filter((q) => q.state === "done").length}/{queue.length}
          </span>
        )}
      </div>

      {/* エンジン選択 */}
      {showEngineSelector && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#57534E] min-w-[4rem]">エンジン</label>
          <select
            value={activeEngine}
            onChange={(e) => handleEngineChange(e.target.value as TtsEngineId)}
            className="text-sm border border-[#E7E2DA] rounded px-2 py-1 bg-white text-[#1C1917]"
          >
            {availableEngines.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.nameJa}
                {eng.cost === "paid" ? "（有料）" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 音声プリセット選択 */}
      {showVoiceSelector && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#57534E] min-w-[4rem]">音声</label>
          <select
            value={voicePreset ?? "ja_female_default"}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="text-sm border border-[#E7E2DA] rounded px-2 py-1 bg-white text-[#1C1917]"
          >
            {TTS_VOICE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.nameJa}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 速度調整 */}
      {showSpeedControl && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#57534E] min-w-[4rem]">速度</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={currentSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-[#E7E2DA] rounded-full appearance-none
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#B8942F]"
          />
          <span className="text-xs text-[#57534E] min-w-[2.5rem] text-right">
            {currentSpeed.toFixed(1)}x
          </span>
        </div>
      )}

      {/* エンジン利用不可の警告 */}
      {!engineAvailable && (
        <p className="text-xs text-[#DC2626]">
          {activeEngine === "voicevox"
            ? "VoiceVox に接続できません。VoiceVox を起動してください。"
            : activeEngine === "elevenlabs"
            ? "ElevenLabs の API キーが設定されていません。"
            : "読み上げエンジンが利用できません。"}
        </p>
      )}
    </div>
  );
}

export default TtsPlayer;
