/**
 * /api/transcribe - Whisper音声文字起こしAPI
 *
 * iOSでも動作する音声入力
 * - MediaRecorder API で録音した音声を受け取る
 * - OpenAI Whisper API で文字起こし
 *
 * 環境変数:
 *   OPENAI_API_KEY - OpenAI APIキー
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withGateway, sendSuccess, sendError, ErrorCodes } from '../gateway';
import type { GatewayRequest } from '../gateway';

interface TranscribeResponse {
  text: string;
  duration?: number;
  language?: string;
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

  // OpenAI Whisper API 呼び出し
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'ja'); // 日本語優先
  formData.append('response_format', 'verbose_json');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Whisper API error:', error);
      sendError(req, res, ErrorCodes.SERVER_DEPENDENCY_ERROR, {
        service: 'OpenAI Whisper',
        error,
      });
      return { text: '' };
    }

    const result = await response.json();

    return {
      text: result.text || '',
      duration: result.duration,
      language: result.language,
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
  requireAuth: false, // 認証は任意（課金管理する場合はtrueに）
  rateLimit: 30,      // 30 req/min（コスト保護）
  audit: true,
});
