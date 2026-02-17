/**
 * HARMONIC insight 共通コンポーネント
 */

// 音声入力（STT）
export { VoiceInputUnified } from './VoiceInputUnified';
export { VoiceInputWhisper } from './VoiceInputWhisper';

// テキスト読み上げ（TTS）
export { TtsPlayer } from './TtsPlayer';

// デフォルトは統合版を推奨
export { VoiceInputUnified as VoiceInput } from './VoiceInputUnified';
