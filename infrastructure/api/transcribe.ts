/**
 * /api/transcribe - Whisper音声文字起こしAPI
 *
 * iOSでも動作する音声入力
 * - MediaRecorder API で録音した音声を受け取る
 * - Groq Whisper API で文字起こし（無料枠: 7,000秒/月）
 *
 * 環境変数:
 *   GROQ_API_KEY - Groq APIキー (https://console.groq.com/keys)
 *
 * フォールバック:
 *   OPENAI_API_KEY が設定されていれば OpenAI を使用
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withGateway, sendSuccess, sendError, ErrorCodes } from './gateway';
import type { GatewayRequest } from './gateway';

interface TranscribeResponse {
  text: string;
  duration?: number;
  language?: string;
  provider?: 'groq' | 'openai';
}

// Vercel Pro: 60秒まで
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 音声ファイル用に拡張
    },
  },
  maxDuration: 60,
};

async function handler(
  req: GatewayRequest,
  res: NextApiResponse
): Promise<TranscribeResponse> {
  if (req.method !== 'POST') {
    sendError(req, res, ErrorCodes.REQ_METHOD_NOT_ALLOWED);
    return { text: '' };
  }

  const { audio, mimeType = 'audio/webm' } = req.body;

  if (!audio) {
    sendError(req, res, ErrorCodes.REQ_MISSING_FIELD, { field: 'audio' });
    return { text: '' };
  }

  // Base64デコード
  const audioBuffer = Buffer.from(audio, 'base64');

  // ファイル拡張子を決定
  const ext = mimeType.includes('webm') ? 'webm'
            : mimeType.includes('mp4') ? 'mp4'
            : mimeType.includes('mp3') ? 'mp3'
            : mimeType.includes('wav') ? 'wav'
            : 'webm';

  // プロバイダー選択（Groq優先）
  const useGroq = !!process.env.GROQ_API_KEY;
  const useOpenAI = !useGroq && !!process.env.OPENAI_API_KEY;

  if (!useGroq && !useOpenAI) {
    sendError(req, res, ErrorCodes.SERVER_ERROR, {
      message: 'GROQ_API_KEY または OPENAI_API_KEY が設定されていません',
    });
    return { text: '' };
  }

  // API設定
  const apiConfig = useGroq
    ? {
        url: 'https://api.groq.com/openai/v1/audio/transcriptions',
        apiKey: process.env.GROQ_API_KEY!,
        model: 'whisper-large-v3',
        provider: 'groq' as const,
      }
    : {
        url: 'https://api.openai.com/v1/audio/transcriptions',
        apiKey: process.env.OPENAI_API_KEY!,
        model: 'whisper-1',
        provider: 'openai' as const,
      };

  // FormData作成
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', apiConfig.model);
  formData.append('language', 'ja'); // 日本語優先
  formData.append('response_format', 'verbose_json');

  try {
    const response = await fetch(apiConfig.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
      },
      body: formData,
    });

    // レート制限チェック（Groq無料枠超過）
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      sendError(req, res, ErrorCodes.RATE_LIMIT_EXCEEDED, {
        message: '音声認識の利用制限に達しました。しばらく待ってからお試しください。',
        retryAfter: retryAfter ? parseInt(retryAfter) : 60,
      });
      return { text: '' };
    }

    if (!response.ok) {
      const error = await response.text();
      console.error(`${apiConfig.provider} Whisper API error:`, error);
      sendError(req, res, ErrorCodes.SERVER_DEPENDENCY_ERROR, {
        service: `${apiConfig.provider} Whisper`,
        error,
      });
      return { text: '' };
    }

    const result = await response.json();

    return {
      text: result.text || '',
      duration: result.duration,
      language: result.language,
      provider: apiConfig.provider,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    sendError(req, res, ErrorCodes.SERVER_ERROR, {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return { text: '' };
  }
}

export default withGateway(handler, {
  requireAuth: false, // プロトタイプは認証なし
  rateLimit: 20,      // 20 req/min（無料枠保護）
  audit: true,
});
