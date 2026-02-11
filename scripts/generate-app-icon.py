"""
HARMONIC insight App Icon Generator
Generates ICO files and multi-size PNGs from master PNG icons.

Usage:
  # Generate icons for a specific product (uses master PNG from brand/icons/png/)
  python scripts/generate-app-icon.py --product IOSH --output ./Resources/

  # Generate icons from a specific master PNG
  python scripts/generate-app-icon.py --master brand/icons/png/icon-insight-sheet.png --output ./Resources/ --name InsightOfficeSheet

  # Generate icons for ALL products
  python scripts/generate-app-icon.py --all --output ./generated-icons/

  # List all available icons
  python scripts/generate-app-icon.py --list

Brand: Ivory & Gold Theme (#B8942F primary)
"""

import argparse
import json
import os
import sys
from pathlib import Path

from PIL import Image


# Brand colors
GOLD = (184, 148, 47)        # #B8942F
IVORY = (250, 248, 245)      # #FAF8F5

# Icon sizes for each platform
WINDOWS_ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
ANDROID_SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}
IOS_SIZE = 1024
WEB_SIZES = {
    'favicon-16': 16,
    'favicon-32': 32,
    'apple-touch-icon': 180,
    'icon-192': 192,
    'icon-512': 512,
}

# Product code → master icon mapping
PRODUCT_ICONS = {
    'INSS': {'name': 'InsightOfficeSlide', 'icon': 'icon-insight-slide.png'},
    'IOSH': {'name': 'InsightOfficeSheet', 'icon': 'icon-insight-sheet.png'},
    'IOSD': {'name': 'InsightOfficeDoc', 'icon': 'icon-insight-doc.png'},
    'INPY': {'name': 'InsightPy', 'icon': 'icon-insight-py.png'},
    'INMV': {'name': 'InsightMovie', 'icon': 'icon-insight-movie.png'},
    'INIG': {'name': 'InsightImageGen', 'icon': 'icon-insight-imagegen.png'},
    'INBT': {'name': 'InsightBot', 'icon': 'icon-insight-bot.png'},
    'INCA': {'name': 'InsightNoCodeAnalyzer', 'icon': 'icon-insight-nca.png'},
    'IVIN': {'name': 'InterviewInsight', 'icon': 'icon-interview-insight.png'},
    'ISOF': {'name': 'InsightSeniorOffice', 'icon': 'icon-senior-office.png'},
}

UTILITY_ICONS = {
    'LAUNCHER': {'name': 'InsightLauncher', 'icon': 'icon-launcher.png'},
    'CAMERA': {'name': 'InsightCamera', 'icon': 'icon-camera.png'},
    'VOICE_CLOCK': {'name': 'InsightVoiceClock', 'icon': 'icon-voice-clock.png'},
    'QR': {'name': 'InsightQR', 'icon': 'icon-qr.png'},
    'PINBOARD': {'name': 'InsightPinBoard', 'icon': 'icon-pinboard.png'},
    'VOICE_MEMO': {'name': 'InsightVoiceMemo', 'icon': 'icon-voice-memo.png'},
}

ALL_ICONS = {**PRODUCT_ICONS, **UTILITY_ICONS}


def find_insight_common_root() -> Path:
    """Find the insight-common root directory."""
    script_dir = Path(__file__).resolve().parent
    # scripts/ is one level below root
    return script_dir.parent


def get_master_icon_path(key: str) -> Path:
    """Get the master icon path for a product/utility key."""
    root = find_insight_common_root()
    if key in ALL_ICONS:
        return root / 'brand' / 'icons' / 'png' / ALL_ICONS[key]['icon']
    raise ValueError(f"Unknown icon key: {key}")


def resize_icon(master: Image.Image, size: int) -> Image.Image:
    """Resize master icon to target size with high-quality downsampling."""
    img = master.copy()
    img = img.resize((size, size), Image.LANCZOS)
    return img


def save_ico(master: Image.Image, filepath: str):
    """Generate multi-resolution ICO file from master PNG."""
    sizes_to_save = []
    for s in WINDOWS_ICO_SIZES:
        img = resize_icon(master, s)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        sizes_to_save.append(img)

    if sizes_to_save:
        sizes_to_save[0].save(
            filepath,
            format='ICO',
            sizes=[(img.width, img.height) for img in sizes_to_save],
            append_images=sizes_to_save[1:]
        )


def generate_windows(master: Image.Image, name: str, output_dir: str):
    """Generate Windows ICO + individual PNGs."""
    os.makedirs(output_dir, exist_ok=True)

    # Individual PNGs
    for s in WINDOWS_ICO_SIZES:
        img = resize_icon(master, s)
        img.save(os.path.join(output_dir, f"{name}_{s}.png"))

    # Multi-resolution ICO
    ico_path = os.path.join(output_dir, f"{name}.ico")
    save_ico(master, ico_path)
    print(f"  Windows: {ico_path} ({len(WINDOWS_ICO_SIZES)} sizes)")

    return ico_path


def generate_android(master: Image.Image, name: str, output_dir: str):
    """Generate Android mipmap PNGs."""
    for density, size in ANDROID_SIZES.items():
        density_dir = os.path.join(output_dir, f"mipmap-{density}")
        os.makedirs(density_dir, exist_ok=True)
        img = resize_icon(master, size)
        img.save(os.path.join(density_dir, "ic_launcher.png"))

    print(f"  Android: {len(ANDROID_SIZES)} density variants")


def generate_ios(master: Image.Image, name: str, output_dir: str):
    """Generate iOS/Expo 1024x1024 PNG (no transparency)."""
    os.makedirs(output_dir, exist_ok=True)
    img = resize_icon(master, IOS_SIZE)
    # iOS requires no transparency - flatten to white background
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, IVORY)
        bg.paste(img, mask=img.split()[3])
        img = bg
    img.save(os.path.join(output_dir, "icon.png"))
    print(f"  iOS/Expo: icon.png (1024x1024)")


def generate_web(master: Image.Image, name: str, output_dir: str):
    """Generate Web favicons and manifest icons."""
    os.makedirs(output_dir, exist_ok=True)
    for label, size in WEB_SIZES.items():
        img = resize_icon(master, size)
        img.save(os.path.join(output_dir, f"{label}.png"))

    # Also generate favicon.ico (16+32)
    save_ico(master, os.path.join(output_dir, "favicon.ico"))
    print(f"  Web: favicon.ico + {len(WEB_SIZES)} PNG variants")


def generate_all_platforms(master: Image.Image, name: str, output_dir: str):
    """Generate icons for all platforms."""
    generate_windows(master, name, os.path.join(output_dir, 'windows'))
    generate_android(master, name, os.path.join(output_dir, 'android'))
    generate_ios(master, name, os.path.join(output_dir, 'ios'))
    generate_web(master, name, os.path.join(output_dir, 'web'))


def list_icons():
    """List all available icons."""
    print("\n=== Product Icons (10) ===")
    for code, info in PRODUCT_ICONS.items():
        path = get_master_icon_path(code)
        exists = "✓" if path.exists() else "✗"
        print(f"  [{exists}] {code:6s}  {info['name']:30s}  {info['icon']}")

    print("\n=== Utility Icons (6) ===")
    for code, info in UTILITY_ICONS.items():
        path = get_master_icon_path(code)
        exists = "✓" if path.exists() else "✗"
        print(f"  [{exists}] {code:12s}  {info['name']:30s}  {info['icon']}")

    print(f"\nTotal: {len(ALL_ICONS)} icons")


def main():
    parser = argparse.ArgumentParser(
        description='HARMONIC insight App Icon Generator - Generate platform-specific icons from master PNGs'
    )
    parser.add_argument('--product', '-p', help='Product code (e.g., IOSH, INSS, LAUNCHER)')
    parser.add_argument('--master', '-m', help='Path to master PNG (overrides product lookup)')
    parser.add_argument('--name', '-n', help='Output name (default: derived from product)')
    parser.add_argument('--output', '-o', default='./generated-icons', help='Output directory')
    parser.add_argument('--platform', choices=['windows', 'android', 'ios', 'web', 'all'], default='all',
                        help='Target platform (default: all)')
    parser.add_argument('--all', action='store_true', help='Generate icons for ALL products')
    parser.add_argument('--list', action='store_true', help='List all available icons')

    args = parser.parse_args()

    if args.list:
        list_icons()
        return

    if args.all:
        for code, info in ALL_ICONS.items():
            try:
                path = get_master_icon_path(code)
                if not path.exists():
                    print(f"[SKIP] {code}: master icon not found at {path}")
                    continue
                print(f"\n[{code}] {info['name']}")
                master = Image.open(path).convert('RGBA')
                product_dir = os.path.join(args.output, info['name'])
                generate_all_platforms(master, info['name'], product_dir)
            except Exception as e:
                print(f"[ERROR] {code}: {e}")
        print("\nAll icons generated!")
        return

    # Single product mode
    if not args.product and not args.master:
        parser.print_help()
        sys.exit(1)

    if args.master:
        master_path = Path(args.master)
        name = args.name or master_path.stem
    else:
        key = args.product.upper()
        if key not in ALL_ICONS:
            print(f"Error: Unknown product '{key}'. Use --list to see available icons.")
            sys.exit(1)
        master_path = get_master_icon_path(key)
        name = args.name or ALL_ICONS[key]['name']

    if not master_path.exists():
        print(f"Error: Master icon not found: {master_path}")
        sys.exit(1)

    print(f"Master: {master_path}")
    print(f"Name: {name}")
    print(f"Output: {args.output}")
    print(f"Platform: {args.platform}")
    print()

    master = Image.open(master_path).convert('RGBA')

    generators = {
        'windows': generate_windows,
        'android': generate_android,
        'ios': generate_ios,
        'web': generate_web,
        'all': generate_all_platforms,
    }

    gen_func = generators[args.platform]
    if args.platform == 'all':
        gen_func(master, name, args.output)
    else:
        gen_func(master, name, args.output)

    print("\nDone!")


if __name__ == "__main__":
    main()
