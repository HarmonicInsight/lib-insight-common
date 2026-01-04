#!/usr/bin/env python3
"""
ライセンスキー発行 CLI ツール (Python版)

使用方法:
  python generate-license.py --product ALL --tier TRIAL
  python generate-license.py --product SLIDE --tier PRO --expires 2025-12-31
  python generate-license.py --product FORG --tier STD --months 12
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# パスを追加
sys.path.insert(0, str(Path(__file__).parent.parent / 'python'))

from __init__ import (
    generate_license_with_expiry,
    ProductCode,
    LicenseTier,
    PRODUCT_NAMES,
    TIER_NAMES,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description='Insight Series ライセンスキー発行ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
例:
  # 全製品トライアル（14日間）
  python generate-license.py -p ALL -t TRIAL

  # InsightSlide Professional（12ヶ月）
  python generate-license.py -p SLIDE -t PRO -m 12

  # InsightForguncy Standard（指定日まで）
  python generate-license.py -p FORG -t STD -e 2025-12-31

  # 10個一括発行
  python generate-license.py -p ALL -t TRIAL -n 10

製品コード:
  SALES  - SalesInsight
  SLIDE  - InsightSlide
  PY     - InsightPy
  INTV   - InterviewInsight
  FORG   - InsightForguncy
  ALL    - 全製品バンドル

ティア:
  TRIAL  - トライアル（デフォルト14日）
  STD    - Standard（年間）
  PRO    - Professional（年間）
  ENT    - Enterprise（永久）
'''
    )

    parser.add_argument(
        '-p', '--product',
        type=str,
        default='ALL',
        choices=['SALES', 'SLIDE', 'PY', 'INTV', 'FORG', 'ALL'],
        help='製品コード'
    )

    parser.add_argument(
        '-t', '--tier',
        type=str,
        default='TRIAL',
        choices=['TRIAL', 'STD', 'PRO', 'ENT'],
        help='ティア'
    )

    parser.add_argument(
        '-e', '--expires',
        type=str,
        help='有効期限 (YYYY-MM-DD形式)'
    )

    parser.add_argument(
        '-m', '--months',
        type=int,
        help='有効期間（月数）'
    )

    parser.add_argument(
        '-n', '--count',
        type=int,
        default=1,
        help='発行数'
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

    # 製品コードとティアを Enum に変換
    product = ProductCode(args.product)
    tier = LicenseTier(args.tier)

    # 有効期限の決定
    expires_at = None
    if args.expires:
        expires_at = datetime.strptime(args.expires, '%Y-%m-%d')
    elif args.months:
        expires_at = datetime.now()
        # 月数を加算
        new_month = expires_at.month + args.months
        new_year = expires_at.year + (new_month - 1) // 12
        new_month = (new_month - 1) % 12 + 1
        expires_at = datetime(new_year, new_month, min(expires_at.day, 28))

    # ライセンス生成
    licenses = []
    for i in range(args.count):
        result = generate_license_with_expiry(product, tier, expires_at)
        licenses.append({
            'licenseKey': result['license_key'],
            'expiresAt': format_date(result['expires_at']),
            'product': args.product,
            'tier': args.tier,
            'productName': PRODUCT_NAMES[product],
            'tierName': TIER_NAMES[tier],
        })

    # 出力
    if args.json:
        print(json.dumps(licenses, indent=2, ensure_ascii=False))
        return

    if args.csv:
        print('license_key,expires_at,product,tier')
        for l in licenses:
            print(f"{l['licenseKey']},{l['expiresAt']},{l['product']},{l['tier']}")
        return

    # 通常出力
    print('')
    print('========================================')
    print('  Insight Series ライセンス発行')
    print('========================================')
    print('')
    print(f"製品: {PRODUCT_NAMES[product]} ({args.product})")
    print(f"ティア: {TIER_NAMES[tier]} ({args.tier})")
    print(f"発行数: {args.count}")
    print('')
    print('----------------------------------------')

    for i, l in enumerate(licenses, 1):
        print(f"{i}. {l['licenseKey']}")
        print(f"   有効期限: {l['expiresAt']}")

    print('----------------------------------------')
    print('')

    if args.count > 1:
        print('CSV形式:')
        print('license_key,expires_at,product,tier')
        for l in licenses:
            print(f"{l['licenseKey']},{l['expiresAt']},{l['product']},{l['tier']}")
        print('')

    print('JSON形式:')
    print(json.dumps(licenses, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
