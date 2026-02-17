# TTS（テキスト読み上げ）標準ガイド

> **対象**: 全製品（InsightOffice 系 / ユーティリティアプリ / Web アプリ）
> **最終更新**: 2026-02-17

---

## 1. 概要

HARMONIC insight 製品群で日本語テキスト読み上げ機能を標準化・汎用化するためのガイド。
どのアプリからでも同じインターフェースで TTS を組み込める。

### 対応エンジン

| エンジン | 種別 | 費用 | 日本語品質 | プラットフォーム |
|---------|------|------|:----------:|----------------|
| Web Speech API | ブラウザ内蔵 | 無料 | ★★★ | Web / Mobile |
| VoiceVox | ローカル | 無料 | ★★★★★ | Desktop (C#/Electron) |
| ElevenLabs | クラウド | 有料 | ★★★★ | 全プラットフォーム |

### ファイル構成

```
insight-common/
├── config/tts.ts              # エンジン定義・型・設定・ヘルパー
├── hooks/useTts.ts            # React (Web) 向けフック
├── hooks/useTts.native.ts     # React Native 向けフック
├── components/TtsPlayer.tsx   # ドロップイン UI コンポーネント
├── csharp/InsightCommon/Addon/VoiceAndAvatarService.cs  # C# (WPF) 実装
└── standards/TTS.md           # このドキュメント
```

---

## 2. クイックスタート

### React (Web) — 最小構成

```tsx
import { TtsPlayer } from '@/insight-common/components/TtsPlayer';

function MyPage() {
  return (
    <TtsPlayer text="こんにちは、今日の業績を報告します。" />
  );
}
```

### React (Web) — フック利用

```tsx
import { useTts } from '@/insight-common/hooks/useTts';

function ReadAloudButton({ text }: { text: string }) {
  const { speak, stop, isSpeaking } = useTts({ engine: 'web_speech' });

  return (
    <button onClick={() => isSpeaking ? stop() : speak(text)}>
      {isSpeaking ? '停止' : '読み上げ'}
    </button>
  );
}
```

### React Native

```tsx
import { useTtsRN } from '@/insight-common/hooks/useTts.native';

function ReadAloudButton({ text }: { text: string }) {
  const { speak, stop, isSpeaking } = useTtsRN({ language: 'ja-JP' });

  return (
    <Pressable onPress={() => isSpeaking ? stop() : speak(text)}>
      <Text>{isSpeaking ? '停止' : '読み上げ'}</Text>
    </Pressable>
  );
}
```

### C# (WPF)

```csharp
using InsightCommon.Addon;

var service = new VoiceAndAvatarService(addonManager);
var result = await service.SpeakAsync("こんにちは", new SpeakOptions { Speed = 1.0 });

if (result.Success) {
    PlayAudio(result.AudioData);
    // リップシンク用フォネーム
    AnimateLipSync(result.Phonemes);
}
```

---

## 3. API リファレンス

### config/tts.ts

#### 型定義

| 型 | 説明 |
|----|------|
| `TtsEngineId` | エンジン ID (`'web_speech'` / `'voicevox'` / `'elevenlabs'`) |
| `TtsConfig` | アプリ単位の TTS 設定 |
| `TtsSpeakOptions` | speak() 呼び出し時のオプション |
| `TtsSpeakResult` | 読み上げ結果（成功/失敗、音声データ、フォネーム） |
| `TtsPhonemeEvent` | フォネームイベント（リップシンク用） |
| `TtsVoicePreset` | 音声プリセット定義 |
| `TtsQueueItem` | キュー内のアイテム |
| `TtsError` | エラー情報（日英メッセージ付き） |

#### ヘルパー関数

| 関数 | 説明 |
|------|------|
| `getDefaultTtsConfig(platform)` | プラットフォームに応じたデフォルト設定 |
| `getTtsVoicePreset(id)` | プリセットを ID で取得 |
| `getTtsVoicePresetsByLanguage(lang)` | 言語でフィルタしたプリセット一覧 |
| `getAvailableTtsEngines(platform)` | プラットフォームで利用可能なエンジン |
| `selectTtsEngine(preferred, platform, settings)` | エンジン自動選択（フォールバック付き） |
| `splitTextForTts(text, engine)` | 長文をエンジン上限に合わせて分割 |
| `validateTtsEngine(engineId, settings)` | エンジンの利用可否を検証 |
| `canUseTts(plan, engine)` | ライセンスプランでの利用可否判定 |
| `checkVoicevoxConnection(baseUrl)` | VoiceVox 接続テスト |

### hooks/useTts.ts

```typescript
const {
  speak,           // (text, options?) => Promise<TtsSpeakResult>
  stop,            // () => void
  pause,           // () => void
  resume,          // () => void
  enqueue,         // (texts[], options?) => void
  clearQueue,      // () => void
  state,           // TtsPlaybackState: 'idle' | 'speaking' | 'paused' | 'loading'
  isSpeaking,      // boolean
  queue,           // TtsQueueItem[]
  activeEngine,    // TtsEngineId（実際に使用中のエンジン）
  engineAvailable, // boolean
  updateConfig,    // (partial) => void
} = useTts({
  engine: 'web_speech',        // エンジン選択
  voicePreset: 'ja_female_default', // 音声プリセット
  speed: 1.0,                  // 速度 (0.5-2.0)
  pitch: 1.0,                  // ピッチ (0.5-2.0)
  volume: 1.0,                 // 音量 (0.0-1.0)
  language: 'ja-JP',           // 言語
  enablePhonemes: false,       // フォネーム抽出
  engineSettings: {},          // エンジン固有設定
  onError: (error) => {},      // グローバルエラーハンドラ
  onStateChange: (state) => {}, // 状態変化ハンドラ
});
```

### components/TtsPlayer.tsx

```tsx
<TtsPlayer
  // --- テキスト ---
  text="単一テキスト"            // 単一テキスト
  texts={['段落1', '段落2']}    // 複数テキスト（キュー読み上げ）

  // --- エンジン設定 ---
  engine="web_speech"           // エンジン選択
  voicePreset="ja_female_default" // 音声プリセット
  speed={1.0}                   // 速度
  pitch={1.0}                   // ピッチ
  volume={1.0}                  // 音量

  // --- UI オプション ---
  showEngineSelector            // エンジン選択 UI を表示
  showSpeedControl              // 速度スライダーを表示
  showVoiceSelector             // 音声プリセット選択を表示
  compact                       // コンパクトモード（ボタンのみ）
  disabled                      // 無効化

  // --- コールバック ---
  onComplete={(result) => {}}   // 読み上げ完了
  onError={(message) => {}}     // エラー
/>
```

---

## 4. 音声プリセット

| ID | 名前 | 性別 | 言語 | 推奨速度 |
|----|------|------|------|---------|
| `ja_female_default` | 日本語（女性・標準） | 女性 | ja-JP | 1.0 |
| `ja_female_slow` | 日本語（女性・ゆっくり） | 女性 | ja-JP | 0.75 |
| `ja_male_default` | 日本語（男性・標準） | 男性 | ja-JP | 1.0 |
| `ja_female_narrator` | 日本語（女性・ナレーター） | 女性 | ja-JP | 0.9 |
| `en_female_default` | 英語（女性・標準） | 女性 | en-US | 1.0 |
| `en_male_default` | 英語（男性・標準） | 男性 | en-US | 1.0 |

カスタムプリセットの追加は `config/tts.ts` の `TTS_VOICE_PRESETS` 配列に追加。

---

## 5. エンジン別セットアップ

### Web Speech API（推奨: Web アプリ）

セットアップ不要。ブラウザがサポートしていれば自動で利用される。

**注意事項:**
- Chrome / Edge で最も安定
- Safari は読み上げ途中で停止するバグがある場合あり
- Firefox は一部の日本語音声が不自然

### VoiceVox（推奨: デスクトップアプリ）

1. [VoiceVox をダウンロード](https://voicevox.hiroshiba.jp/)してインストール
2. VoiceVox を起動（`http://localhost:50021` で API が公開される）
3. エンジン設定:

```typescript
useTts({
  engine: 'voicevox',
  engineSettings: {
    voicevoxBaseUrl: 'http://localhost:50021',
    voicevoxSpeakerId: 3, // ずんだもん
  },
});
```

**接続テスト:**
```typescript
import { checkVoicevoxConnection } from '@/insight-common/config/tts';

const status = await checkVoicevoxConnection();
console.log(status.connected); // true/false
console.log(status.version);   // '0.21.1'
console.log(status.speakers);  // 22
```

### ElevenLabs（推奨: 多言語・カスタム音声）

1. [ElevenLabs](https://elevenlabs.io/) でアカウント作成
2. API キーを取得
3. エンジン設定:

```typescript
useTts({
  engine: 'elevenlabs',
  engineSettings: {
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    elevenlabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // オプション
  },
});
```

**API キーは環境変数で管理すること。ハードコード禁止。**

---

## 6. 製品別組み込みガイド

### InsightOffice 系（INSS / IOSH / IOSD）

AI アシスタントの応答を読み上げる場合:

```tsx
// AI アシスタントパネル内
import { useTts } from '@/insight-common/hooks/useTts';

function AiResponsePanel({ response }: { response: string }) {
  const { speak, stop, isSpeaking } = useTts({
    engine: 'web_speech',
    voicePreset: 'ja_female_narrator',
  });

  return (
    <div>
      <p>{response}</p>
      <button onClick={() => isSpeaking ? stop() : speak(response)}>
        {isSpeaking ? '停止' : '読み上げ'}
      </button>
    </div>
  );
}
```

### InsightOffice C# (WPF)

既存の `VoiceAndAvatarService` を使用:

```csharp
// VoiceVox エンジンで読み上げ
var service = new VoiceAndAvatarService(addonManager);
var result = await service.SpeakAsync("こんにちは", new SpeakOptions
{
    VoiceId = "3",   // VoiceVox speaker ID
    Speed = 1.0,
    Emotion = "happy",
});
```

### ユーティリティアプリ（VOICE_CLOCK 等）

```tsx
import { TtsPlayer } from '@/insight-common/components/TtsPlayer';

// 時報読み上げ
function TimeAnnouncement({ time }: { time: string }) {
  return (
    <TtsPlayer
      text={`現在の時刻は ${time} です。`}
      engine="web_speech"
      voicePreset="ja_female_default"
      compact
    />
  );
}
```

### React Native アプリ

```bash
# 依存ライブラリのインストール
npx expo install expo-speech
```

```tsx
import { useTtsRN } from '@/insight-common/hooks/useTts.native';

function ReadAloudScreen() {
  const { speak, stop, isSpeaking } = useTtsRN({
    language: 'ja-JP',
    speed: 1.0,
  });

  return (
    <Pressable onPress={() => isSpeaking ? stop() : speak('読み上げテスト')}>
      <Text>{isSpeaking ? '停止' : '読み上げ'}</Text>
    </Pressable>
  );
}
```

---

## 7. キュー読み上げ（長文・複数段落）

### Web

```tsx
const { enqueue, queue, stop } = useTts({ engine: 'web_speech' });

// 段落ごとにキューに追加
const paragraphs = document.querySelectorAll('p');
enqueue(Array.from(paragraphs).map(p => p.textContent));

// 進捗表示
const done = queue.filter(q => q.state === 'done').length;
console.log(`${done}/${queue.length} 完了`);
```

### 長文の自動分割

VoiceVox は 1 回のリクエストで処理できる文字数に制限があるため、
`splitTextForTts()` で自動的に句読点で分割される。

```typescript
import { splitTextForTts } from '@/insight-common/config/tts';

const chunks = splitTextForTts(longText, 'voicevox');
// → ['第1文。', '第2文。', '第3文。', ...]
```

---

## 8. フォネーム抽出（リップシンク連携）

VoiceVox エンジンのみ、モーラレベルのフォネーム情報を取得可能。
VRM アバターのリップシンクアニメーションに使用。

```tsx
const { speak } = useTts({
  engine: 'voicevox',
  enablePhonemes: true,
});

const result = await speak('こんにちは', {
  onPhoneme: (event) => {
    // event.timeMs: タイミング（ミリ秒）
    // event.phoneme: フォネーム文字列（a, i, u, e, o, ...）
    // event.durationMs: 持続時間
    updateAvatarMouth(event.phoneme);
  },
});

// 結果からもフォネーム一覧を取得可能
console.log(result.phonemes);
```

---

## 9. ライセンス連携

TTS 機能はライセンスプランで制御可能。

```typescript
import { canUseTts } from '@/insight-common/config/tts';

// Web Speech API / VoiceVox: 全プランで利用可能
canUseTts('STD', 'web_speech');  // { allowed: true }
canUseTts('STD', 'voicevox');    // { allowed: true }

// ElevenLabs: TRIAL / PRO / ENT のみ
canUseTts('STD', 'elevenlabs');  // { allowed: false, reasonJa: '...' }
canUseTts('PRO', 'elevenlabs');  // { allowed: true }
```

---

## 10. エラーハンドリング

全エラーは `TtsError` 型で統一。日本語・英語のメッセージを持つ。

| エラーコード | 説明 | 対処 |
|-------------|------|------|
| `ENGINE_NOT_AVAILABLE` | エンジンが利用不可 | 別エンジンにフォールバック |
| `ENGINE_CONNECTION_FAILED` | VoiceVox 接続失敗 | VoiceVox の起動を確認 |
| `API_KEY_MISSING` | API キー未設定 | 環境変数を設定 |
| `API_ERROR` | API エラー | レスポンスを確認 |
| `RATE_LIMIT` | レート制限 | 時間をおいて再試行 |
| `TEXT_TOO_LONG` | テキスト長超過 | `splitTextForTts()` で分割 |
| `VOICE_NOT_FOUND` | 音声が見つからない | プリセットを確認 |
| `AUDIO_PLAYBACK_FAILED` | 再生失敗 | ブラウザの自動再生ポリシーを確認 |
| `CANCELLED` | キャンセルされた | 正常（ユーザー操作） |

---

## 11. チェックリスト

新しいアプリに TTS を組み込む際のチェックリスト:

- [ ] `config/tts.ts` からインポートできること
- [ ] デフォルトエンジン（Web Speech API）で読み上げが動作すること
- [ ] 日本語テキストが正しく読み上げられること
- [ ] 停止ボタンで即座に停止すること
- [ ] 長文が自動分割されること
- [ ] エラー時に日本語メッセージが表示されること
- [ ] ライセンスチェックが実装されていること（有料エンジン利用時）
- [ ] API キーがハードコードされていないこと
- [ ] Ivory & Gold デザインシステムに準拠していること（TtsPlayer 使用時）

---

## 12. 禁止事項

| やってはいけない | 正しいやり方 |
|----------------|-------------|
| アプリ独自の TTS 実装 | `config/tts.ts` + `useTts` / `TtsPlayer` を使用 |
| ElevenLabs API キーのハードコード | 環境変数経由で参照 |
| VoiceVox の URL ハードコード | `engineSettings.voicevoxBaseUrl` で設定 |
| ライセンスチェックの省略 | `canUseTts(plan, engine)` を必ず実行 |
| 独自の音声プリセット管理 | `TTS_VOICE_PRESETS` に追加 |
