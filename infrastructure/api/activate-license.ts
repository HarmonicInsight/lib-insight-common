/**
 * /api/entitlement/activate - 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ譛牙柑蛹・
 *
 * Vercel Functions 繝・Φ繝励Ξ繝ｼ繝・
 *
 * 讖溯・:
 *   - 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ讀懆ｨｼ
 *   - licenses 繝・・繝悶Ν縺ｫ逋ｻ骭ｲ
 *
 * 繝ｪ繧ｯ繧ｨ繧ｹ繝・
 *   POST { license_key: "INSS-PRO-2512-XXXX-XXXX-XXXX" }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRequest } from '../auth/firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Supabase 繧ｯ繝ｩ繧､繧｢繝ｳ繝茨ｼ・ervice Role・・
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ蠖｢蠑・ PPPP-PLAN-YYMM-HASH-SIG1-SIG2
const LICENSE_KEY_REGEX = /^(INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN)-(STD|PRO|ENT)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

interface ActivateRequest {
  license_key: string;
}

interface ActivateResponse {
  success: boolean;
  product_code?: string;
  plan?: string;
  expires_at?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ActivateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // 繝医・繧ｯ繝ｳ讀懆ｨｼ
  const authResult = await verifyRequest(req.headers.authorization);
  if (!authResult.success || !authResult.uid) {
    return res.status(401).json({ success: false, error: '隱崎ｨｼ繧ｨ繝ｩ繝ｼ' });
  }

  const { license_key } = req.body as ActivateRequest;

  if (!license_key) {
    return res.status(400).json({ success: false, error: '繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺悟ｿ・ｦ√〒縺・ });
  }

  // 蠖｢蠑上メ繧ｧ繝・け
  const match = LICENSE_KEY_REGEX.exec(license_key.toUpperCase().trim());
  if (!match) {
    return res.status(400).json({ success: false, error: '繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｮ蠖｢蠑上′辟｡蜉ｹ縺ｧ縺・ });
  }

  const [, productCode, plan, yymm] = match;

  // 譛牙柑譛滄剞險育ｮ暦ｼ・YMM縺九ｉ12繝ｶ譛亥ｾ鯉ｼ・
  const year = 2000 + parseInt(yymm.substring(0, 2), 10);
  const month = parseInt(yymm.substring(2, 4), 10) - 1;
  const expiresAt = new Date(year, month + 12, 1);

  try {
    // 繝ｦ繝ｼ繧ｶ繝ｼ蜿門ｾ・
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', authResult.uid)
      .single();

    if (!user) {
      return res.status(400).json({ success: false, error: '繝ｦ繝ｼ繧ｶ繝ｼ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ' });
    }

    // 繧ｭ繝ｼ縺梧里縺ｫ菴ｿ繧上ｌ縺ｦ縺・↑縺・°遒ｺ隱・
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('id, user_id')
      .eq('license_key', license_key.toUpperCase())
      .single();

    if (existingLicense) {
      if (existingLicense.user_id === user.id) {
        return res.status(400).json({ success: false, error: '縺薙・繝ｩ繧､繧ｻ繝ｳ繧ｹ縺ｯ譌｢縺ｫ譛牙柑蛹悶＆繧後※縺・∪縺・ });
      } else {
        return res.status(400).json({ success: false, error: '縺薙・繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｯ譌｢縺ｫ菴ｿ逕ｨ縺輔ｌ縺ｦ縺・∪縺・ });
      }
    }

    // 繝ｩ繧､繧ｻ繝ｳ繧ｹ逋ｻ骭ｲ・・psert・・
    const { data: license, error } = await supabase
      .from('licenses')
      .upsert(
        {
          user_id: user.id,
          product_code: productCode,
          plan: plan,
          license_key: license_key.toUpperCase(),
          activated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
        },
        {
          onConflict: 'user_id,product_code',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('License activation error:', error);
      return res.status(500).json({ success: false, error: '繝ｩ繧､繧ｻ繝ｳ繧ｹ逋ｻ骭ｲ縺ｫ螟ｱ謨励＠縺ｾ縺励◆' });
    }

    return res.status(200).json({
      success: true,
      product_code: productCode,
      plan: plan,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Activation error:', error);
    return res.status(500).json({ success: false, error: '繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ' });
  }
}
