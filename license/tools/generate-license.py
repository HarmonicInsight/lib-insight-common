#!/usr/bin/env python3
"""
繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ逋ｺ陦・CLI 繝・・繝ｫ

繧ｭ繝ｼ蠖｢蠑・ PPPP-PLAN-YYMM-HASH-SIG1-SIG2

菴ｿ逕ｨ譁ｹ豕・
  python generate-license.py --product INSS --plan PRO --email user@example.com --expires 2027-01-31
  python generate-license.py --product INSS --trial --email user@example.com
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 繝代せ繧定ｿｽ蜉
sys.path.insert(0, str(Path(__file__).parent.parent / 'python'))

from __init__ import (
    generate_license_key,
    generate_trial_key,
    ProductCode,
    Plan,
    PRODUCT_NAMES,
    PLAN_NAMES,
    TRIAL_DAYS,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description='Insight Series 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ逋ｺ陦後ヤ繝ｼ繝ｫ',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
萓・
  # InsightOfficeSlide Pro・・027蟷ｴ1譛医∪縺ｧ・・
  python generate-license.py -p INSS --plan PRO -e user@example.com --expires 2027-01-31

  # InsightOfficeSlide Standard・・2繝ｶ譛茨ｼ・
  python generate-license.py -p INSS --plan STD -e user@example.com -m 12

  # InsightPy 繝医Λ繧､繧｢繝ｫ・・4譌･髢難ｼ・
  python generate-license.py -p INPY --trial -e user@example.com

  # InsightCast Pro・・2繝ｶ譛茨ｼ・
  python generate-license.py -p INMV --plan PRO -e user@example.com -m 12

  # InsightBot Pro・・2繝ｶ譛茨ｼ・
  python generate-license.py -p INBT --plan PRO -e user@example.com -m 12

  # InterviewInsight Standard・・2繝ｶ譛茨ｼ・
  python generate-license.py -p IVIN --plan STD -e user@example.com -m 12

陬ｽ蜩√さ繝ｼ繝・
  INSS  - InsightOfficeSlide
  IOSH  - InsightOfficeSheet
  IOSD  - InsightOfficeDoc
  INPY  - InsightPy
  INMV  - InsightCast
  INIG  - InsightImageGen
  INBT  - InsightBot
  INCA  - InsightNoCodeAnalyzer
  IVIN  - InterviewInsight

繝励Λ繝ｳ:
  TRIAL  - 繝医Λ繧､繧｢繝ｫ・・4譌･髢難ｼ・
  STD    - Standard
  PRO    - Professional
'''
    )

    parser.add_argument(
        '-p', '--product',
        type=str,
        required=True,
        choices=['INSS', 'IOSH', 'IOSD', 'INPY', 'INMV', 'INIG', 'INBT', 'INCA', 'IVIN'],
        help='陬ｽ蜩√さ繝ｼ繝・
    )

    parser.add_argument(
        '--plan',
        type=str,
        choices=['STD', 'PRO'],
        help='繝励Λ繝ｳ・・-trial 縺ｨ謗剃ｻ厄ｼ・
    )

    parser.add_argument(
        '--trial',
        action='store_true',
        help='繝医Λ繧､繧｢繝ｫ逋ｺ陦鯉ｼ・4譌･髢難ｼ・
    )

    parser.add_argument(
        '-e', '--email',
        type=str,
        required=True,
        help='繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ・亥ｿ・茨ｼ・
    )

    parser.add_argument(
        '--expires',
        type=str,
        help='譛牙柑譛滄剞 (YYYY-MM-DD蠖｢蠑・'
    )

    parser.add_argument(
        '-m', '--months',
        type=int,
        help='譛牙柑譛滄俣・域怦謨ｰ・・
    )

    parser.add_argument(
        '--json',
        action='store_true',
        help='JSON蠖｢蠑上・縺ｿ蜃ｺ蜉・
    )

    parser.add_argument(
        '--csv',
        action='store_true',
        help='CSV蠖｢蠑上・縺ｿ蜃ｺ蜉・
    )

    return parser.parse_args()


def format_date(dt):
    if dt is None:
        return '豌ｸ荵・
    return dt.strftime('%Y-%m-%d')


def main():
    args = parse_args()

    # 繝舌Μ繝・・繧ｷ繝ｧ繝ｳ
    if not args.trial and not args.plan:
        print("繧ｨ繝ｩ繝ｼ: --plan 縺ｾ縺溘・ --trial 繧呈欠螳壹＠縺ｦ縺上□縺輔＞", file=sys.stderr)
        sys.exit(1)

    if args.trial and args.plan:
        print("繧ｨ繝ｩ繝ｼ: --plan 縺ｨ --trial 縺ｯ蜷梧凾縺ｫ謖・ｮ壹〒縺阪∪縺帙ｓ", file=sys.stderr)
        sys.exit(1)

    # 陬ｽ蜩√さ繝ｼ繝・
    product_code = ProductCode(args.product)

    # 繝医Λ繧､繧｢繝ｫ縺ｮ蝣ｴ蜷・
    if args.trial:
        license_key = generate_trial_key(product_code, args.email)
        expires_at = datetime.now() + timedelta(days=TRIAL_DAYS)
        plan = Plan.TRIAL
    else:
        plan = Plan(args.plan)

        # 譛牙柑譛滄剞縺ｮ豎ｺ螳・
        if args.expires:
            expires_at = datetime.strptime(args.expires, '%Y-%m-%d')
        elif args.months:
            expires_at = datetime.now()
            new_month = expires_at.month + args.months
            new_year = expires_at.year + (new_month - 1) // 12
            new_month = (new_month - 1) % 12 + 1
            expires_at = datetime(new_year, new_month, min(expires_at.day, 28))
        else:
            # 繝・ヵ繧ｩ繝ｫ繝・ 12繝ｶ譛・
            expires_at = datetime.now()
            new_month = expires_at.month + 12
            new_year = expires_at.year + (new_month - 1) // 12
            new_month = (new_month - 1) % 12 + 1
            expires_at = datetime(new_year, new_month, min(expires_at.day, 28))

        license_key = generate_license_key(product_code, plan, args.email, expires_at)

    result = {
        'licenseKey': license_key,
        'expiresAt': format_date(expires_at),
        'product': args.product,
        'plan': plan.value,
        'email': args.email,
        'productName': PRODUCT_NAMES[product_code],
        'planName': PLAN_NAMES[plan],
    }

    # 蜃ｺ蜉・
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    if args.csv:
        print('license_key,expires_at,product,plan,email')
        print(f"{result['licenseKey']},{result['expiresAt']},{result['product']},{result['plan']},{result['email']}")
        return

    # 騾壼ｸｸ蜃ｺ蜉・
    print('')
    print('========================================')
    print('  Insight Series 繝ｩ繧､繧ｻ繝ｳ繧ｹ逋ｺ陦・)
    print('========================================')
    print('')
    print(f"陬ｽ蜩・       {result['productName']} ({result['product']})")
    print(f"繝励Λ繝ｳ:     {result['planName']} ({result['plan']})")
    print(f"繝｡繝ｼ繝ｫ:     {result['email']}")
    print(f"譛牙柑譛滄剞:   {result['expiresAt']}")
    print('')
    print('----------------------------------------')
    print(f"繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ: {result['licenseKey']}")
    print('----------------------------------------')
    print('')
    print('JSON蠖｢蠑・')
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
