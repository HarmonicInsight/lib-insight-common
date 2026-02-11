#!/usr/bin/env python3
"""
ライセンスキー発行 CLI ツール

キー形式: PPPP-PLAN-YYMM-HASH-SIG1-SIG2

使用方法:
  python generate-license.py --product INSS --plan PRO --email user@example.com --expires 2027-01-31
  python generate-license.py --product INSS --trial --email user@example.com
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# パスを追加
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
        description='Insight Series ライセンスキー発行ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
例:
  # InsightOfficeSlide Pro（2027年1月まで）
  python generate-license.py -p INSS --plan PRO -e user@example.com --expires 2027-01-31

  # InsightOfficeSlide Standard（12ヶ月）
  python generate-license.py -p INSS --plan STD -e user@example.com -m 12

  # InsightPy トライアル（14日間）
  python generate-license.py -p INPY --trial -e user@example.com

  # InsightMovie Pro（12ヶ月）
  python generate-license.py -p INMV --plan PRO -e user@example.com -m 12

  # InsightBot Pro（12ヶ月）
  python generate-license.py -p INBT --plan PRO -e user@example.com -m 12

  # InterviewInsight Standard（12ヶ月）
  python generate-license.py -p IVIN --plan STD -e user@example.com -m 12

製品コード:
  INSS  - InsightOfficeSlide
  IOSH  - InsightOfficeSheet
  IOSD  - InsightOfficeDoc
  INPY  - InsightPy
  INMV  - InsightMovie
  INIG  - InsightImageGen
  INBT  - InsightBot
  INCA  - InsightNoCodeAnalyzer
  IVIN  - InterviewInsight

プラン:
  TRIAL  - トライアル（14日間）
  STD    - Standard
  PRO    - Professional
'''
    )

    parser.add_argument(
        '-p', '--product',
        type=str,
        required=True,
        choices=['INSS', 'IOSH', 'IOSD', 'INPY', 'INMV', 'INIG', 'INBT', 'INCA', 'IVIN'],
        help='製品コード'
    )

    parser.add_argument(
        '--plan',
        type=str,
        choices=['STD', 'PRO'],
        help='プラン（--trial と排他）'
    )

    parser.add_argument(
        '--trial',
        action='store_true',
        help='トライアル発行（14日間）'
    )

    parser.add_argument(
        '-e', '--email',
        type=str,
        required=True,
        help='メールアドレス（必須）'
    )

    parser.add_argument(
        '--expires',
        type=str,
        help='有効期限 (YYYY-MM-DD形式)'
    )

    parser.add_argument(
        '-m', '--months',
        type=int,
        help='有効期間（月数）'
    )

    parser.add_argument(
        '--json',
        action='store_true',
        help='JSON形式のみ出力'
    )

    parser.add_argument(
        '--csv',
        action='store_true',
        help='CSV形式のみ出力'
    )

    return parser.parse_args()


def format_date(dt):
    if dt is None:
        return '永久'
    return dt.strftime('%Y-%m-%d')


def main():
    args = parse_args()

    # バリデーション
    if not args.trial and not args.plan:
        print("エラー: --plan または --trial を指定してください", file=sys.stderr)
        sys.exit(1)

    if args.trial and args.plan:
        print("エラー: --plan と --trial は同時に指定できません", file=sys.stderr)
        sys.exit(1)

    # 製品コード
    product_code = ProductCode(args.product)

    # トライアルの場合
    if args.trial:
        license_key = generate_trial_key(product_code, args.email)
        expires_at = datetime.now() + timedelta(days=TRIAL_DAYS)
        plan = Plan.TRIAL
    else:
        plan = Plan(args.plan)

        # 有効期限の決定
        if args.expires:
            expires_at = datetime.strptime(args.expires, '%Y-%m-%d')
        elif args.months:
            expires_at = datetime.now()
            new_month = expires_at.month + args.months
            new_year = expires_at.year + (new_month - 1) // 12
            new_month = (new_month - 1) % 12 + 1
            expires_at = datetime(new_year, new_month, min(expires_at.day, 28))
        else:
            # デフォルト: 12ヶ月
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

    # 出力
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    if args.csv:
        print('license_key,expires_at,product,plan,email')
        print(f"{result['licenseKey']},{result['expiresAt']},{result['product']},{result['plan']},{result['email']}")
        return

    # 通常出力
    print('')
    print('========================================')
    print('  Insight Series ライセンス発行')
    print('========================================')
    print('')
    print(f"製品:       {result['productName']} ({result['product']})")
    print(f"プラン:     {result['planName']} ({result['plan']})")
    print(f"メール:     {result['email']}")
    print(f"有効期限:   {result['expiresAt']}")
    print('')
    print('----------------------------------------')
    print(f"ライセンスキー: {result['licenseKey']}")
    print('----------------------------------------')
    print('')
    print('JSON形式:')
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
