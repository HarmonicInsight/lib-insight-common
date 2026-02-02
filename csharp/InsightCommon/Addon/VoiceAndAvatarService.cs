using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace InsightCommon.Addon;

/// <summary>
/// 音声入力 + VRM アバター統合サービス（InsightOffice 共通）
///
/// ## 設計思想
///
/// VRM 3D アバターの見た目に惑わされがちだが、データレベルでは単純:
/// - speak (TTS): テキスト → 音声バイナリ + フォネーム
/// - listen (STT): 音声 → テキスト
/// - converse: listen → AI → speak のループ
///
/// 3D アニメーションは表現層であり、I/O コントラクトの範囲外。
///
/// ## I/O コントラクト
///
/// | 操作 | Input | Process | Output |
/// |------|-------|---------|--------|
/// | speak | text, voice_id, speed | TTS エンジン → 音声生成 | audio, duration_ms, phonemes |
/// | listen | audio_stream, language | STT エンジン → 認識 | text, is_final |
/// | converse | audio, context | STT → AI → TTS | user_text, ai_text, ai_audio, phonemes |
///
/// 使用例:
/// <code>
/// var service = new VoiceAndAvatarService(addonManager);
///
/// // TTS（テキスト読み上げ）
/// var speech = await service.SpeakAsync("こんにちは", new SpeakOptions { VoiceId = "voicevox-3" });
/// PlayAudio(speech.AudioData);
/// AnimateLipSync(speech.Phonemes);
///
/// // STT（音声認識）
/// var text = await service.ListenAsync(audioStream, "ja-JP");
/// InsertTextAtCursor(text.Text);
/// </code>
/// </summary>
public class VoiceAndAvatarService
{
    private readonly AddonManager _addonManager;
    private readonly HttpClient _httpClient = new();

    public VoiceAndAvatarService(AddonManager addonManager)
    {
        _addonManager = addonManager;
    }

    // =========================================================================
    // TTS: テキスト → 音声（I/O コントラクト: speak）
    // =========================================================================

    /// <summary>
    /// テキストを音声に変換
    ///
    /// TTS エンジン（VoiceVox or ElevenLabs）で音声を生成。
    /// フォネームも返すのでアバターのリップシンクに使える。
    /// </summary>
    public async Task<SpeakResult> SpeakAsync(string text, SpeakOptions? options = null)
    {
        options ??= new SpeakOptions();
        var engine = _addonManager.GetModuleSetting<string>("vrm_avatar", "tts_engine", "voicevox") ?? "voicevox";

        return engine switch
        {
            "voicevox" => await SpeakWithVoiceVoxAsync(text, options),
            "elevenlabs" => await SpeakWithElevenLabsAsync(text, options),
            _ => throw new NotSupportedException($"Unknown TTS engine: {engine}"),
        };
    }

    private async Task<SpeakResult> SpeakWithVoiceVoxAsync(string text, SpeakOptions options)
    {
        var speakerId = options.VoiceId ?? _addonManager.GetModuleSetting<int>(
            "vrm_avatar", "voicevox_speaker_id", 3).ToString();

        try
        {
            // VoiceVox は localhost:50021 で動作
            var baseUrl = "http://localhost:50021";

            // Step 1: 音声クエリ生成
            var queryResponse = await _httpClient.PostAsync(
                $"{baseUrl}/audio_query?text={Uri.EscapeDataString(text)}&speaker={speakerId}",
                null);

            if (!queryResponse.IsSuccessStatusCode)
            {
                return new SpeakResult { Success = false, Error = "VoiceVox audio_query failed" };
            }

            var queryJson = await queryResponse.Content.ReadAsStringAsync();

            // Step 2: 音声合成
            var synthResponse = await _httpClient.PostAsync(
                $"{baseUrl}/synthesis?speaker={speakerId}&speed_scale={options.Speed}",
                new StringContent(queryJson, Encoding.UTF8, "application/json"));

            if (!synthResponse.IsSuccessStatusCode)
            {
                return new SpeakResult { Success = false, Error = "VoiceVox synthesis failed" };
            }

            var audioData = await synthResponse.Content.ReadAsByteArrayAsync();

            // フォネーム抽出（VoiceVox の audio_query レスポンスから）
            var phonemes = ExtractPhonemesFromVoiceVoxQuery(queryJson);

            return new SpeakResult
            {
                Success = true,
                AudioData = audioData,
                AudioFormat = "wav",
                DurationMs = EstimateDurationFromWav(audioData),
                Phonemes = phonemes,
            };
        }
        catch (HttpRequestException)
        {
            return new SpeakResult
            {
                Success = false,
                Error = "VoiceVox に接続できません。VoiceVox が起動していることを確認してください。",
            };
        }
    }

    private async Task<SpeakResult> SpeakWithElevenLabsAsync(string text, SpeakOptions options)
    {
        var apiKey = _addonManager.GetModuleSetting<string>("vrm_avatar", "elevenlabs_api_key", "");
        if (string.IsNullOrEmpty(apiKey))
        {
            return new SpeakResult { Success = false, Error = "ElevenLabs API key not configured" };
        }

        var voiceId = options.VoiceId ?? "21m00Tcm4TlvDq8ikWAM"; // Default voice

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post,
                $"https://api.elevenlabs.io/v1/text-to-speech/{voiceId}");
            request.Headers.Add("xi-api-key", apiKey);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    text,
                    model_id = "eleven_multilingual_v2",
                    voice_settings = new { stability = 0.5, similarity_boost = 0.75 }
                }),
                Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return new SpeakResult { Success = false, Error = $"ElevenLabs API error: {response.StatusCode}" };
            }

            var audioData = await response.Content.ReadAsByteArrayAsync();

            return new SpeakResult
            {
                Success = true,
                AudioData = audioData,
                AudioFormat = "mp3",
                DurationMs = EstimateDurationFromSize(audioData.Length, "mp3"),
                Phonemes = GenerateEstimatedPhonemes(text),
            };
        }
        catch (Exception ex)
        {
            return new SpeakResult { Success = false, Error = $"ElevenLabs error: {ex.Message}" };
        }
    }

    // =========================================================================
    // STT: 音声 → テキスト（I/O コントラクト: listen）
    // =========================================================================

    /// <summary>
    /// 音声をテキストに変換
    ///
    /// 音声エンジンの選択は voice_input モジュールの設定に従う。
    /// </summary>
    public async Task<ListenResult> ListenAsync(byte[] audioData, string language = "ja-JP")
    {
        var engine = _addonManager.GetModuleSetting<string>("voice_input", "engine", "whisper") ?? "whisper";

        return engine switch
        {
            "whisper" => await ListenWithWhisperAsync(audioData, language),
            "web_speech" => new ListenResult
            {
                Success = false,
                Error = "Web Speech API は WebView2 内でのみ利用可能です",
            },
            _ => new ListenResult { Success = false, Error = $"Unknown STT engine: {engine}" },
        };
    }

    private async Task<ListenResult> ListenWithWhisperAsync(byte[] audioData, string language)
    {
        // Groq Whisper API（高速・無料枠あり）を優先
        var groqKey = _addonManager.GetModuleSetting<string>("voice_input", "groq_api_key", "");
        if (!string.IsNullOrEmpty(groqKey))
        {
            return await ListenWithGroqWhisperAsync(audioData, language, groqKey);
        }

        // OpenAI Whisper API フォールバック
        var openaiKey = _addonManager.GetModuleSetting<string>("voice_input", "openai_api_key", "");
        if (!string.IsNullOrEmpty(openaiKey))
        {
            return await ListenWithOpenAiWhisperAsync(audioData, language, openaiKey);
        }

        return new ListenResult
        {
            Success = false,
            Error = "Whisper API key not configured (Groq or OpenAI)",
        };
    }

    private async Task<ListenResult> ListenWithGroqWhisperAsync(byte[] audioData, string language, string apiKey)
    {
        try
        {
            var form = new MultipartFormDataContent();
            form.Add(new ByteArrayContent(audioData), "file", "audio.wav");
            form.Add(new StringContent("whisper-large-v3-turbo"), "model");
            form.Add(new StringContent(language[..2]), "language");

            var request = new HttpRequestMessage(HttpMethod.Post,
                "https://api.groq.com/openai/v1/audio/transcriptions");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = form;

            var response = await _httpClient.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json);

            return new ListenResult
            {
                Success = response.IsSuccessStatusCode,
                Text = result.TryGetProperty("text", out var text) ? text.GetString() ?? "" : "",
                IsFinal = true,
                Error = response.IsSuccessStatusCode ? null : json,
            };
        }
        catch (Exception ex)
        {
            return new ListenResult { Success = false, Error = ex.Message };
        }
    }

    private async Task<ListenResult> ListenWithOpenAiWhisperAsync(byte[] audioData, string language, string apiKey)
    {
        try
        {
            var form = new MultipartFormDataContent();
            form.Add(new ByteArrayContent(audioData), "file", "audio.wav");
            form.Add(new StringContent("whisper-1"), "model");
            form.Add(new StringContent(language[..2]), "language");

            var request = new HttpRequestMessage(HttpMethod.Post,
                "https://api.openai.com/v1/audio/transcriptions");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = form;

            var response = await _httpClient.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(json);

            return new ListenResult
            {
                Success = response.IsSuccessStatusCode,
                Text = result.TryGetProperty("text", out var text) ? text.GetString() ?? "" : "",
                IsFinal = true,
                Error = response.IsSuccessStatusCode ? null : json,
            };
        }
        catch (Exception ex)
        {
            return new ListenResult { Success = false, Error = ex.Message };
        }
    }

    // =========================================================================
    // 会話ループ（I/O コントラクト: converse）
    // =========================================================================

    /// <summary>
    /// 会話ループ: 音声入力 → AI 応答 → 音声読み上げ
    ///
    /// ホストアプリが AI 応答の処理を提供する。
    /// </summary>
    /// <param name="audioData">ユーザーの音声データ</param>
    /// <param name="aiHandler">テキスト → AI 応答テキストを返す関数</param>
    /// <param name="language">言語</param>
    public async Task<ConverseResult> ConverseAsync(
        byte[] audioData,
        Func<string, string?, Task<string>> aiHandler,
        string language = "ja-JP",
        string? documentContext = null)
    {
        // Step 1: STT
        var listenResult = await ListenAsync(audioData, language);
        if (!listenResult.Success)
        {
            return new ConverseResult { Success = false, Error = $"STT failed: {listenResult.Error}" };
        }

        // Step 2: AI 応答
        string aiText;
        try
        {
            aiText = await aiHandler(listenResult.Text, documentContext);
        }
        catch (Exception ex)
        {
            return new ConverseResult
            {
                Success = false,
                UserText = listenResult.Text,
                Error = $"AI response failed: {ex.Message}",
            };
        }

        // Step 3: TTS
        var speakResult = await SpeakAsync(aiText);

        return new ConverseResult
        {
            Success = speakResult.Success,
            UserText = listenResult.Text,
            AiText = aiText,
            AiAudioData = speakResult.AudioData,
            Phonemes = speakResult.Phonemes,
            Error = speakResult.Error,
        };
    }

    // =========================================================================
    // ヘルパー
    // =========================================================================

    private static List<PhonemeEntry> ExtractPhonemesFromVoiceVoxQuery(string queryJson)
    {
        var phonemes = new List<PhonemeEntry>();
        try
        {
            var query = JsonSerializer.Deserialize<JsonElement>(queryJson);
            if (query.TryGetProperty("accent_phrases", out var phrases))
            {
                double timeMs = 0;
                foreach (var phrase in phrases.EnumerateArray())
                {
                    if (phrase.TryGetProperty("moras", out var moras))
                    {
                        foreach (var mora in moras.EnumerateArray())
                        {
                            var vowel = mora.TryGetProperty("vowel", out var v) ? v.GetString() : null;
                            var duration = mora.TryGetProperty("vowel_length", out var d) ? d.GetDouble() : 0.1;
                            if (vowel != null)
                            {
                                phonemes.Add(new PhonemeEntry
                                {
                                    TimeMs = (int)timeMs,
                                    Phoneme = vowel,
                                });
                            }
                            timeMs += duration * 1000;
                        }
                    }
                }
            }
        }
        catch
        {
            // フォネーム抽出失敗は無視
        }
        return phonemes;
    }

    private static List<PhonemeEntry> GenerateEstimatedPhonemes(string text)
    {
        // テキスト長から概算のフォネームタイミングを生成（リップシンク用）
        var phonemes = new List<PhonemeEntry>();
        var avgCharDuration = 150; // 1文字あたり約150ms
        for (int i = 0; i < text.Length; i++)
        {
            if (char.IsWhiteSpace(text[i])) continue;
            phonemes.Add(new PhonemeEntry
            {
                TimeMs = i * avgCharDuration,
                Phoneme = "a", // 簡易: 全て開口
            });
        }
        return phonemes;
    }

    private static int EstimateDurationFromWav(byte[] wavData)
    {
        if (wavData.Length < 44) return 0;
        // WAV ヘッダーから推定: サンプルレート(offset 24), ビット深度(offset 34)
        try
        {
            var sampleRate = BitConverter.ToInt32(wavData, 24);
            var bitsPerSample = BitConverter.ToInt16(wavData, 34);
            var channels = BitConverter.ToInt16(wavData, 22);
            var dataSize = wavData.Length - 44;
            var bytesPerSample = bitsPerSample / 8 * channels;
            if (bytesPerSample <= 0 || sampleRate <= 0) return 0;
            return (int)(dataSize / (double)(sampleRate * bytesPerSample) * 1000);
        }
        catch
        {
            return 0;
        }
    }

    private static int EstimateDurationFromSize(int sizeBytes, string format)
    {
        // MP3: 約128kbps = 16KB/sec
        return format == "mp3" ? (int)(sizeBytes / 16.0) : 0;
    }
}

// =========================================================================
// 型定義
// =========================================================================

public class SpeakOptions
{
    /// <summary>音声 ID（VoiceVox speaker_id or ElevenLabs voice_id）</summary>
    public string? VoiceId { get; set; }

    /// <summary>読み上げ速度（0.5〜2.0、デフォルト: 1.0）</summary>
    public double Speed { get; set; } = 1.0;

    /// <summary>感情（アバター表情に反映）</summary>
    public string Emotion { get; set; } = "neutral";
}

public class SpeakResult
{
    public bool Success { get; set; }
    public byte[]? AudioData { get; set; }
    public string AudioFormat { get; set; } = "wav";
    public int DurationMs { get; set; }
    public List<PhonemeEntry> Phonemes { get; set; } = [];
    public string? Error { get; set; }
}

public class PhonemeEntry
{
    public int TimeMs { get; set; }
    public string Phoneme { get; set; } = "";
}

public class ListenResult
{
    public bool Success { get; set; }
    public string Text { get; set; } = "";
    public bool IsFinal { get; set; }
    public string? Error { get; set; }
}

public class ConverseResult
{
    public bool Success { get; set; }
    public string UserText { get; set; } = "";
    public string AiText { get; set; } = "";
    public byte[]? AiAudioData { get; set; }
    public List<PhonemeEntry> Phonemes { get; set; } = [];
    public string? Error { get; set; }
}
