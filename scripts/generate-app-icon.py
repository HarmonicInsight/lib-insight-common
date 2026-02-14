"""
HARMONIC insight App Icon Generator
Generates platform-specific icons from master PNG icons (1024x1024).

Each product has a defined target platform. The script generates ONLY the
icon formats required for that platform.

Usage:
  # Generate icons for a specific product (auto-detects platform)
  python scripts/generate-app-icon.py --product IOSH --output ./Resources/

  # Override platform for a specific product
  python scripts/generate-app-icon.py --product IOSH --output ./Resources/ --platform windows

  # Generate from a specific master PNG
  python scripts/generate-app-icon.py --master brand/icons/png/icon-insight-sheet.png --output ./Resources/ --name InsightOfficeSheet

  # Generate icons for ALL products (each to its own platform)
  python scripts/generate-app-icon.py --all --output ./generated-icons/

  # List all available icons with platform info
  python scripts/generate-app-icon.py --list

Brand: Ivory & Gold Theme (#B8942F primary)
"""

import argparse
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageDraw


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

# Tauri icon sizes (src-tauri/icons/)
TAURI_PNG_SIZES = [32, 128, 256]
TAURI_LARGE_PNG = 512  # icon.png

# Launcher grid icon sizes (displayed inside the launcher app)
LAUNCHER_GRID_SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}


# =============================================================================
# Product → Platform mapping
# =============================================================================
# Each product specifies:
#   - name: display name / output file name
#   - icon: master PNG filename in brand/icons/png/
#   - platform: target platform determining which icon formats to generate
#   - build_path: recommended path to copy generated icons in the app repo
#
# Platforms:
#   wpf            → Windows ICO + PNGs (C# WPF apps, Inno Setup installer)
#   python         → Windows ICO + PNGs (PyInstaller bundled apps)
#   tauri          → Windows ICO + PNGs + icon.png (Tauri desktop apps)
#   expo           → iOS icon.png (1024x1024) + Android mipmap PNGs
#   android_native → Android vector drawable XMLs + mipmap PNGs (SVG + master PNG)
#   web            → favicon.ico + apple-touch-icon + manifest PNGs
#   service        → Windows ICO (tray icon only)
# =============================================================================

PRODUCT_ICONS = {
    # --- Tier 1: Business Transformation Tools ---
    'INCA': {
        'name': 'InsightNoCodeAnalyzer',
        'icon': 'icon-insight-nca.png',
        'platform': 'tauri',
        'build_path': 'src-tauri/icons/',
    },
    'INBT': {
        'name': 'InsightBot',
        'icon': 'icon-insight-bot.png',
        'platform': 'service',
        'build_path': 'Resources/',
    },
    'IVIN': {
        'name': 'InterviewInsight',
        'icon': 'icon-interview-insight.png',
        'platform': 'tauri',
        'build_path': 'src-tauri/icons/',
    },

    # --- Tier 2: AI Content Creation Tools ---
    'INMV': {
        'name': 'InsightMovie',
        'icon': 'icon-insight-movie.png',
        'platform': 'python',
        'build_path': 'resources/',
    },
    'INIG': {
        'name': 'InsightImageGen',
        'icon': 'icon-insight-imagegen.png',
        'platform': 'python',
        'build_path': 'resources/',
    },

    # --- Tier 3: InsightOffice Suite (WPF) ---
    'INSS': {
        'name': 'InsightOfficeSlide',
        'icon': 'icon-insight-slide.png',
        'platform': 'wpf',
        'build_path': 'Resources/',
    },
    'IOSH': {
        'name': 'InsightOfficeSheet',
        'icon': 'icon-insight-sheet.png',
        'platform': 'wpf',
        'build_path': 'Resources/',
    },
    'IOSD': {
        'name': 'InsightOfficeDoc',
        'icon': 'icon-insight-doc.png',
        'platform': 'wpf',
        'build_path': 'Resources/',
    },
    'INPY': {
        'name': 'InsightPy',
        'icon': 'icon-insight-py.png',
        'platform': 'python',
        'build_path': 'resources/',
    },

    # --- Tier 4: Senior Office ---
    'ISOF': {
        'name': 'InsightSeniorOffice',
        'icon': 'icon-senior-office.png',
        'platform': 'wpf',
        'build_path': 'Resources/',
    },
}

UTILITY_ICONS = {
    'LAUNCHER': {
        'name': 'InsightLauncher',
        'icon': 'icon-launcher.png',
        'platform': 'wpf',
        'build_path': 'Resources/',
    },
    'LAUNCHER_ANDROID': {
        'name': 'InsightLauncherAndroid',
        'icon': 'icon-launcher.png',
        'svg': 'icon-launcher.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'CAMERA': {
        'name': 'InsightCamera',
        'icon': 'icon-camera.png',
        'svg': 'icon-camera.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'VOICE_CLOCK': {
        'name': 'InsightVoiceClock',
        'icon': 'icon-voice-clock.png',
        'svg': 'icon-voice-clock.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'INCLINE': {
        'name': 'InclineInsight',
        'icon': 'icon-incline.png',
        'svg': 'icon-incline.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'CONSUL_TYPE': {
        'name': 'InsightConsulType',
        'icon': 'icon-consul-type.png',
        'svg': 'icon-consul-type.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'HOROSCOPE': {
        'name': 'HarmonicHoroscope',
        'icon': 'icon-horoscope.png',
        'svg': 'icon-horoscope.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'FOOD_MEDICINE': {
        'name': 'FoodMedicineInsight',
        'icon': 'icon-food-medicine.png',
        'svg': 'icon-food-medicine.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'CONSUL_EVALUATE': {
        'name': 'InsightConsulEvaluate',
        'icon': 'icon-consul-evaluate.png',
        'svg': 'icon-consul-evaluate.svg',
        'platform': 'android_native',
        'build_path': 'app/src/main/res/',
    },
    'QR': {
        'name': 'InsightQR',
        'icon': 'icon-qr.png',
        'platform': 'expo',
        'build_path': 'assets/',
    },
    'PINBOARD': {
        'name': 'InsightPinBoard',
        'icon': 'icon-pinboard.png',
        'platform': 'wpf',
        'build_path': 'Resources/',
    },
    'VOICE_TASK_CALENDAR': {
        'name': 'VoiceTaskCalendar',
        'icon': 'icon-voice-clock.png',
        'platform': 'expo',
        'build_path': 'assets/',
    },
    'VOICE_MEMO': {
        'name': 'InsightVoiceMemo',
        'icon': 'icon-voice-memo.png',
        'platform': 'expo',
        'build_path': 'assets/',
    },
}

ALL_ICONS = {**PRODUCT_ICONS, **UTILITY_ICONS}

# Platform display names
PLATFORM_LABELS = {
    'wpf': 'C# WPF (Windows)',
    'python': 'Python/PyInstaller (Windows)',
    'tauri': 'Tauri + React (Desktop)',
    'expo': 'Expo/React Native (iOS/Android)',
    'android_native': 'Android Native (Kotlin/Compose)',
    'web': 'Next.js/React (Web)',
    'service': 'Windows Service + Tray',
}


def find_insight_common_root() -> Path:
    """Find the insight-common root directory."""
    script_dir = Path(__file__).resolve().parent
    return script_dir.parent


def get_master_icon_path(key: str) -> Path:
    """Get the master icon path for a product/utility key."""
    root = find_insight_common_root()
    if key in ALL_ICONS:
        return root / 'brand' / 'icons' / 'png' / ALL_ICONS[key]['icon']
    raise ValueError(f"Unknown icon key: {key}")


def get_svg_icon_path(key: str) -> Path:
    """Get the SVG icon path for a product/utility key (android_native)."""
    root = find_insight_common_root()
    if key in ALL_ICONS and 'svg' in ALL_ICONS[key]:
        return root / 'brand' / 'icons' / 'svg' / ALL_ICONS[key]['svg']
    raise ValueError(f"No SVG defined for icon key: {key}")


def resize_icon(master: Image.Image, size: int) -> Image.Image:
    """Resize master icon to target size with high-quality downsampling."""
    img = master.copy()
    img = img.resize((size, size), Image.LANCZOS)
    return img


def flatten_to_rgb(img: Image.Image) -> Image.Image:
    """Remove alpha channel by compositing onto Ivory background."""
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, IVORY)
        bg.paste(img, mask=img.split()[3])
        return bg
    return img


def save_ico(master: Image.Image, filepath: str):
    """Generate multi-resolution ICO file from master PNG.

    Creates an ICO containing all WINDOWS_ICO_SIZES (16-256px).
    The largest image must be first for Pillow to correctly embed all sizes.
    """
    sizes_to_save = []
    for s in sorted(WINDOWS_ICO_SIZES, reverse=True):
        img = resize_icon(master, s)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        sizes_to_save.append(img)

    if sizes_to_save:
        sizes_to_save[0].save(
            filepath,
            format='ICO',
            append_images=sizes_to_save[1:]
        )


# =============================================================================
# Platform-specific generators
# =============================================================================

def generate_windows(master: Image.Image, name: str, output_dir: str):
    """Generate Windows ICO + individual PNGs for WPF / PyInstaller / Service."""
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


def generate_tauri(master: Image.Image, name: str, output_dir: str):
    """Generate Tauri desktop app icons (ICO + PNGs + icon.png)."""
    os.makedirs(output_dir, exist_ok=True)

    # icon.ico for Windows
    ico_path = os.path.join(output_dir, "icon.ico")
    save_ico(master, ico_path)

    # icon.png (512x512 for Tauri)
    img_512 = resize_icon(master, TAURI_LARGE_PNG)
    img_512.save(os.path.join(output_dir, "icon.png"))

    # Sized PNGs: 32x32.png, 128x128.png, 128x128@2x.png
    for s in TAURI_PNG_SIZES:
        img = resize_icon(master, s)
        img.save(os.path.join(output_dir, f"{s}x{s}.png"))

    # 128x128@2x.png (256x256)
    img_2x = resize_icon(master, 256)
    img_2x.save(os.path.join(output_dir, "128x128@2x.png"))

    # Square150x150Logo.png, Square310x310Logo.png (Windows Store)
    for s in [150, 310]:
        img = resize_icon(master, s)
        img.save(os.path.join(output_dir, f"Square{s}x{s}Logo.png"))

    # StoreLogo.png (50x50)
    img_50 = resize_icon(master, 50)
    img_50.save(os.path.join(output_dir, "StoreLogo.png"))

    print(f"  Tauri: icon.ico + icon.png + {len(TAURI_PNG_SIZES)} sized PNGs + Store logos")


def make_round_icon(img: Image.Image) -> Image.Image:
    """Apply circular mask to create a round icon variant."""
    size = img.size[0]
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(img, mask=mask)
    return result


def generate_android(master: Image.Image, name: str, output_dir: str,
                     include_round: bool = True):
    """Generate Android mipmap PNGs (ic_launcher + ic_launcher_round)."""
    for density, size in ANDROID_SIZES.items():
        density_dir = os.path.join(output_dir, f"mipmap-{density}")
        os.makedirs(density_dir, exist_ok=True)
        img = resize_icon(master, size)
        img.save(os.path.join(density_dir, "ic_launcher.png"))
        if include_round:
            round_img = make_round_icon(img)
            round_img.save(os.path.join(density_dir, "ic_launcher_round.png"))

    round_label = " + round" if include_round else ""
    print(f"  Android: {len(ANDROID_SIZES)} density variants{round_label}")


def generate_ios(master: Image.Image, name: str, output_dir: str):
    """Generate iOS/Expo 1024x1024 PNG (no transparency)."""
    os.makedirs(output_dir, exist_ok=True)
    img = resize_icon(master, IOS_SIZE)
    img = flatten_to_rgb(img)
    img.save(os.path.join(output_dir, "icon.png"))
    print(f"  iOS/Expo: icon.png (1024x1024)")


def generate_expo(master: Image.Image, name: str, output_dir: str):
    """Generate Expo/React Native icons (iOS + Android + Web).

    Generates all files referenced by templates/expo/app.json:
      - icon.png          (1024x1024, RGB, no transparency) — iOS app icon
      - adaptive-icon.png (1024x1024, RGBA) — Android adaptive icon foreground
      - notification-icon.png (96x96, white silhouette recommended) — Android notification
      - splash-icon.png   (200x200) — Splash screen logo
      - favicon.png       (48x48) — Web/PWA favicon
      - android/mipmap-*/ic_launcher.png — Android launcher mipmaps
    """
    # iOS icon (1024x1024, no transparency — required by App Store)
    generate_ios(master, name, output_dir)

    # Android adaptive icon foreground (1024x1024, with transparency OK)
    img_adaptive = resize_icon(master, 1024)
    img_adaptive.save(os.path.join(output_dir, "adaptive-icon.png"))

    # Android notification icon (96x96)
    img_notif = resize_icon(master, 96)
    img_notif.save(os.path.join(output_dir, "notification-icon.png"))

    # Android launcher mipmaps
    android_dir = os.path.join(output_dir, 'android')
    generate_android(master, name, android_dir)

    # Splash screen icon (200x200)
    img_splash = resize_icon(master, 200)
    img_splash.save(os.path.join(output_dir, "splash-icon.png"))

    # Web favicon (48x48)
    img_favicon = resize_icon(master, 48)
    img_favicon = flatten_to_rgb(img_favicon)
    img_favicon.save(os.path.join(output_dir, "favicon.png"))

    print(f"  Expo: icon.png + adaptive-icon.png + notification-icon.png + splash-icon.png + favicon.png + Android mipmaps")


# =============================================================================
# SVG → Android Vector Drawable converter
# =============================================================================

SVG_NS = '{http://www.w3.org/2000/svg}'


def _svg_rect_to_path(elem) -> str:
    """Convert SVG <rect> to Android path data."""
    x = float(elem.get('x', 0))
    y = float(elem.get('y', 0))
    w = float(elem.get('width'))
    h = float(elem.get('height'))
    rx = float(elem.get('rx', 0))

    if rx > 0:
        return (f"M{x+rx},{y} L{x+w-rx},{y} Q{x+w},{y} {x+w},{y+rx} "
                f"L{x+w},{y+h-rx} Q{x+w},{y+h} {x+w-rx},{y+h} "
                f"L{x+rx},{y+h} Q{x},{y+h} {x},{y+h-rx} "
                f"L{x},{y+rx} Q{x},{y} {x+rx},{y} Z")
    return f"M{x},{y}h{w}v{h}h-{w}z"


def _svg_circle_to_path(elem) -> str:
    """Convert SVG <circle> to Android path data."""
    cx = float(elem.get('cx'))
    cy = float(elem.get('cy'))
    r = float(elem.get('r'))
    return f"M{cx},{cy}m-{r},0a{r},{r} 0,1 1,{2*r},0a{r},{r} 0,1 1,-{2*r},0"


def _svg_line_to_path(elem) -> str:
    """Convert SVG <line> to Android path data."""
    return f"M{elem.get('x1')},{elem.get('y1')} L{elem.get('x2')},{elem.get('y2')}"


def _svg_elem_to_android(elem) -> dict | None:
    """Convert a single SVG element to Android vector path attributes."""
    tag = elem.tag.replace(SVG_NS, '')
    attrs = {}

    if tag == 'rect':
        attrs['pathData'] = _svg_rect_to_path(elem)
    elif tag == 'circle':
        attrs['pathData'] = _svg_circle_to_path(elem)
    elif tag == 'path':
        attrs['pathData'] = elem.get('d', '')
    elif tag == 'line':
        attrs['pathData'] = _svg_line_to_path(elem)
    else:
        return None  # Skip comments, etc.

    fill = elem.get('fill')
    if fill and fill != 'none':
        attrs['fillColor'] = '#FFFFFF' if fill == 'white' else fill
    stroke = elem.get('stroke')
    if stroke:
        attrs['strokeColor'] = '#FFFFFF' if stroke == 'white' else stroke
        attrs['strokeWidth'] = elem.get('stroke-width', '1')
    if elem.get('stroke-linecap'):
        attrs['strokeLineCap'] = elem.get('stroke-linecap')
    if elem.get('opacity'):
        attrs['fillAlpha'] = elem.get('opacity')
    if elem.get('fill') == 'none' and not stroke:
        return None  # Invisible element

    return attrs


def _build_android_path_xml(attrs: dict, indent: str = '    ') -> str:
    """Build a single <path .../> XML element."""
    parts = [f'{indent}<path']
    for svg_key, android_key in [
        ('fillColor', 'android:fillColor'),
        ('fillAlpha', 'android:fillAlpha'),
        ('strokeColor', 'android:strokeColor'),
        ('strokeWidth', 'android:strokeWidth'),
        ('strokeLineCap', 'android:strokeLineCap'),
        ('pathData', 'android:pathData'),
    ]:
        if svg_key in attrs:
            parts.append(f'{indent}    {android_key}="{attrs[svg_key]}"')
    # Close the tag on the pathData line
    last = parts[-1]
    parts[-1] = last + ' />'
    return '\n'.join(parts)


def svg_to_android_drawables(svg_path: str) -> tuple[str, str]:
    """Convert SVG icon to Android foreground + background vector drawable XML.

    Returns (foreground_xml, background_xml).
    """
    tree = ET.parse(svg_path)
    root = tree.getroot()

    foreground_paths = []
    for elem in root:
        tag = elem.tag.replace(SVG_NS, '')
        # Skip the background rect (first rect with Ivory fill)
        if tag == 'rect' and elem.get('fill', '') in ('#FAF8F5', '#faf8f5'):
            continue
        android_attrs = _svg_elem_to_android(elem)
        if android_attrs:
            foreground_paths.append(android_attrs)

    # Build foreground XML
    fg_lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
        '    android:width="108dp"',
        '    android:height="108dp"',
        '    android:viewportWidth="108"',
        '    android:viewportHeight="108">',
        '',
    ]
    for attrs in foreground_paths:
        fg_lines.append(_build_android_path_xml(attrs))
        fg_lines.append('')
    fg_lines.append('</vector>')
    fg_lines.append('')
    foreground_xml = '\n'.join(fg_lines)

    # Background XML (simple Ivory fill)
    background_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
        '    android:width="108dp"\n'
        '    android:height="108dp"\n'
        '    android:viewportWidth="108"\n'
        '    android:viewportHeight="108">\n'
        '    <path\n'
        '        android:fillColor="#FAF8F5"\n'
        '        android:pathData="M0,0h108v108h-108z" />\n'
        '</vector>\n'
    )

    return foreground_xml, background_xml


# Adaptive icon XML templates
ADAPTIVE_ICON_XML = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '    <background android:drawable="@drawable/ic_launcher_background" />\n'
    '    <foreground android:drawable="@drawable/ic_launcher_foreground" />\n'
    '</adaptive-icon>\n'
)

ADAPTIVE_ICON_WITH_MONOCHROME_XML = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '    <background android:drawable="@drawable/ic_launcher_background" />\n'
    '    <foreground android:drawable="@drawable/ic_launcher_foreground" />\n'
    '    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />\n'
    '</adaptive-icon>\n'
)


def get_monochrome_svg_path(svg_path: str) -> Path:
    """Get the monochrome SVG path for an icon (e.g., icon-camera.svg -> icon-camera-monochrome.svg)."""
    p = Path(svg_path)
    monochrome_path = p.parent / f"{p.stem}-monochrome{p.suffix}"
    return monochrome_path


def generate_android_native(svg_path: str, name: str, output_dir: str,
                            master: 'Image.Image | None' = None):
    """Generate Android native icons: vector drawable XMLs + mipmap PNGs.

    Combines SVG → vector drawable conversion AND master PNG → mipmap generation
    to produce the complete Android res/ icon set.

    Output structure:
      drawable/ic_launcher_foreground.xml     (SVG → vector drawable)
      drawable/ic_launcher_background.xml     (Ivory fill)
      drawable/ic_launcher_monochrome.xml     (if monochrome SVG exists)
      mipmap-mdpi/ic_launcher.png             (master PNG → 48px)
      mipmap-mdpi/ic_launcher_round.png       (master PNG → 48px circular)
      mipmap-hdpi/ic_launcher.png             (master PNG → 72px)
      mipmap-hdpi/ic_launcher_round.png       (master PNG → 72px circular)
      mipmap-xhdpi/ic_launcher.png            (master PNG → 96px)
      mipmap-xhdpi/ic_launcher_round.png      (master PNG → 96px circular)
      mipmap-xxhdpi/ic_launcher.png           (master PNG → 144px)
      mipmap-xxhdpi/ic_launcher_round.png     (master PNG → 144px circular)
      mipmap-xxxhdpi/ic_launcher.png          (master PNG → 192px)
      mipmap-xxxhdpi/ic_launcher_round.png    (master PNG → 192px circular)
      mipmap-anydpi-v26/ic_launcher.xml       (adaptive icon definition)
      mipmap-anydpi-v26/ic_launcher_round.xml (adaptive icon definition)

    Args:
        svg_path: Path to the SVG master icon for vector drawable conversion.
        name: Product/app name for logging.
        output_dir: Target res/ directory.
        master: Optional PIL Image (1024x1024 master PNG) for mipmap generation.
                If None, only vector drawable XMLs are generated.
    """
    foreground_xml, background_xml = svg_to_android_drawables(svg_path)

    # drawable/
    drawable_dir = os.path.join(output_dir, 'drawable')
    os.makedirs(drawable_dir, exist_ok=True)
    with open(os.path.join(drawable_dir, 'ic_launcher_foreground.xml'), 'w') as f:
        f.write(foreground_xml)
    with open(os.path.join(drawable_dir, 'ic_launcher_background.xml'), 'w') as f:
        f.write(background_xml)

    # Check for monochrome SVG (e.g., icon-camera-monochrome.svg)
    monochrome_svg = get_monochrome_svg_path(svg_path)
    has_monochrome = monochrome_svg.exists()
    if has_monochrome:
        monochrome_xml, _ = svg_to_android_drawables(str(monochrome_svg))
        with open(os.path.join(drawable_dir, 'ic_launcher_monochrome.xml'), 'w') as f:
            f.write(monochrome_xml)

    # mipmap PNGs (from master PNG)
    if master is not None:
        generate_android(master, name, output_dir, include_round=True)
    else:
        print(f"  [WARN] No master PNG — skipping mipmap PNG generation for {name}")

    # mipmap-anydpi-v26/
    adaptive_xml = ADAPTIVE_ICON_WITH_MONOCHROME_XML if has_monochrome else ADAPTIVE_ICON_XML
    mipmap_dir = os.path.join(output_dir, 'mipmap-anydpi-v26')
    os.makedirs(mipmap_dir, exist_ok=True)
    with open(os.path.join(mipmap_dir, 'ic_launcher.xml'), 'w') as f:
        f.write(adaptive_xml)
    with open(os.path.join(mipmap_dir, 'ic_launcher_round.xml'), 'w') as f:
        f.write(adaptive_xml)

    mono_label = " + monochrome" if has_monochrome else ""
    mipmap_label = f" + {len(ANDROID_SIZES)} mipmap densities (png + round)" if master is not None else ""
    print(f"  Android Native: drawable/ic_launcher_{{foreground,background}}.xml{mono_label} + mipmap-anydpi-v26/ic_launcher{{,_round}}.xml{mipmap_label}")


def generate_web(master: Image.Image, name: str, output_dir: str):
    """Generate Web favicons and manifest icons."""
    os.makedirs(output_dir, exist_ok=True)
    for label, size in WEB_SIZES.items():
        img = resize_icon(master, size)
        img.save(os.path.join(output_dir, f"{label}.png"))

    # favicon.ico (16+32)
    save_ico(master, os.path.join(output_dir, "favicon.ico"))
    print(f"  Web: favicon.ico + {len(WEB_SIZES)} PNG variants")


def generate_launcher_icon(master: Image.Image, code: str, output_dir: str):
    """Generate Android mipmap icons for the launcher app grid.

    This generates mipmap PNGs at all Android densities for a single product,
    to be displayed as a tile icon inside the InsightLauncher Android app.

    Output structure:
        {output_dir}/{code}/mipmap-{density}/ic_launcher.png
    """
    product_dir = os.path.join(output_dir, code)
    for density, size in LAUNCHER_GRID_SIZES.items():
        density_dir = os.path.join(product_dir, f"mipmap-{density}")
        os.makedirs(density_dir, exist_ok=True)
        img = resize_icon(master, size)
        img.save(os.path.join(density_dir, "ic_launcher.png"))


def generate_launcher_all(output_dir: str):
    """Generate launcher icons for ALL products + utilities.

    Creates Android mipmap icons for every product so the InsightLauncher
    Android app can display them in a tile grid. Also generates a
    launcher-manifest.json for the app to consume.

    Args:
        output_dir: Base output directory (e.g., brand/icons/generated/launcher)
    """
    import json

    manifest_entries = []
    generated = 0
    skipped = 0

    # Category mapping for manifest
    category_map = {
        'INSS': 'office', 'IOSH': 'office', 'IOSD': 'office',
        'INMV': 'ai_tools', 'INIG': 'ai_tools', 'INPY': 'ai_tools',
        'INCA': 'enterprise', 'INBT': 'enterprise', 'IVIN': 'enterprise',
        'ISOF': 'senior',
        'CAMERA': 'utility', 'VOICE_CLOCK': 'utility', 'VOICE_TASK_CALENDAR': 'utility',
        'QR': 'utility', 'PINBOARD': 'utility', 'VOICE_MEMO': 'utility',
        'INCLINE': 'utility', 'CONSUL_TYPE': 'utility', 'HOROSCOPE': 'utility',
        'FOOD_MEDICINE': 'utility', 'CONSUL_EVALUATE': 'utility',
    }

    # Display order for manifest
    display_order = {
        'INSS': 100, 'IOSH': 110, 'IOSD': 120, 'ISOF': 130,
        'INPY': 200, 'INMV': 210, 'INIG': 220,
        'INCA': 300, 'INBT': 310, 'IVIN': 320,
        'CAMERA': 400, 'VOICE_CLOCK': 410, 'VOICE_TASK_CALENDAR': 415,
        'PINBOARD': 420, 'VOICE_MEMO': 430, 'QR': 440,
        'INCLINE': 450, 'CONSUL_TYPE': 460, 'HOROSCOPE': 470,
        'FOOD_MEDICINE': 480, 'CONSUL_EVALUATE': 490,
    }

    # Process all icons (products + utilities, excluding LAUNCHER itself)
    all_entries = {**PRODUCT_ICONS, **{k: v for k, v in UTILITY_ICONS.items() if k != 'LAUNCHER'}}

    for code, info in all_entries.items():
        try:
            path = get_master_icon_path(code)
            if not path.exists():
                print(f"  [SKIP] {code}: master icon not found at {path}")
                skipped += 1
                continue

            master = Image.open(path).convert('RGBA')
            generate_launcher_icon(master, code, output_dir)

            manifest_entries.append({
                'code': code,
                'name': info['name'],
                'masterIcon': f"brand/icons/png/{info['icon']}",
                'category': category_map.get(code, 'utility'),
                'displayOrder': display_order.get(code, 999),
                'isProduct': code in PRODUCT_ICONS,
                'densities': {d: s for d, s in LAUNCHER_GRID_SIZES.items()},
            })
            generated += 1
            print(f"  [OK] {code}: {info['name']} ({len(LAUNCHER_GRID_SIZES)} densities)")

        except Exception as e:
            print(f"  [ERROR] {code}: {e}")
            skipped += 1

    # Sort manifest by display order
    manifest_entries.sort(key=lambda e: e['displayOrder'])

    # Write manifest JSON
    manifest_path = os.path.join(output_dir, 'launcher-manifest.json')
    manifest = {
        'version': 1,
        'description': 'HARMONIC insight Launcher icon manifest — maps product codes to Android mipmap icons',
        'basePath': 'brand/icons/generated/launcher',
        'densities': dict(LAUNCHER_GRID_SIZES),
        'iconFileName': 'ic_launcher.png',
        'entries': manifest_entries,
    }
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\n  Launcher icons generated: {generated} products, {skipped} skipped")
    print(f"  Manifest: {manifest_path}")


def generate_all_platforms(master: Image.Image, name: str, output_dir: str):
    """Generate icons for all platforms (fallback when no platform specified)."""
    generate_windows(master, name, os.path.join(output_dir, 'windows'))
    generate_android(master, name, os.path.join(output_dir, 'android'))
    generate_ios(master, name, os.path.join(output_dir, 'ios'))
    generate_web(master, name, os.path.join(output_dir, 'web'))


# =============================================================================
# Platform → generator mapping
# =============================================================================

def generate_for_platform(platform: str, master: Image.Image, name: str, output_dir: str):
    """Generate icons for the specified platform."""
    if platform == 'wpf':
        generate_windows(master, name, output_dir)
    elif platform == 'python':
        generate_windows(master, name, output_dir)
    elif platform == 'tauri':
        generate_tauri(master, name, output_dir)
    elif platform == 'expo':
        generate_expo(master, name, output_dir)
    elif platform == 'android_native':
        # android_native mipmap PNGs are generated via generate_android_native()
        # which is called separately with both SVG and master PNG.
        # If called here (e.g., via --platform override), generate mipmaps only.
        generate_android(master, name, output_dir, include_round=True)
    elif platform == 'web':
        generate_web(master, name, output_dir)
    elif platform == 'service':
        generate_windows(master, name, output_dir)
    elif platform == 'all':
        generate_all_platforms(master, name, output_dir)
    else:
        # Legacy: direct platform name (windows/android/ios/web)
        generators = {
            'windows': generate_windows,
            'android': generate_android,
            'ios': generate_ios,
        }
        gen = generators.get(platform)
        if gen:
            gen(master, name, output_dir)
        else:
            print(f"  Unknown platform: {platform}")


# =============================================================================
# List / CLI
# =============================================================================

def list_icons():
    """List all available icons with platform info."""
    print(f"\n=== Product Icons ({len(PRODUCT_ICONS)}) ===")
    print(f"  {'Code':<6s}  {'Name':<30s}  {'Platform':<32s}  {'Build Path'}")
    print(f"  {'----':<6s}  {'----':<30s}  {'--------':<32s}  {'----------'}")
    for code, info in PRODUCT_ICONS.items():
        path = get_master_icon_path(code)
        exists = "+" if path.exists() else "x"
        platform_label = PLATFORM_LABELS.get(info['platform'], info['platform'])
        print(f"  [{exists}] {code:<6s}  {info['name']:<30s}  {platform_label:<32s}  {info['build_path']}")

    print(f"\n=== Utility Icons ({len(UTILITY_ICONS)}) ===")
    print(f"  {'Code':<12s}  {'Name':<30s}  {'Platform':<32s}  {'Build Path'}")
    print(f"  {'----':<12s}  {'----':<30s}  {'--------':<32s}  {'----------'}")
    for code, info in UTILITY_ICONS.items():
        path = get_master_icon_path(code)
        exists = "+" if path.exists() else "x"
        platform_label = PLATFORM_LABELS.get(info['platform'], info['platform'])
        print(f"  [{exists}] {code:<12s}  {info['name']:<30s}  {platform_label:<32s}  {info['build_path']}")

    print(f"\nTotal: {len(ALL_ICONS)} icons")

    # Summary by platform
    print("\n=== Platform Summary ===")
    platform_groups = {}
    for code, info in ALL_ICONS.items():
        p = info['platform']
        platform_groups.setdefault(p, []).append(code)
    for p, codes in platform_groups.items():
        label = PLATFORM_LABELS.get(p, p)
        print(f"  {label}: {', '.join(codes)}")


def main():
    parser = argparse.ArgumentParser(
        description='HARMONIC insight App Icon Generator - Generate platform-specific icons from master PNGs'
    )
    parser.add_argument('--product', '-p', help='Product code (e.g., IOSH, INSS, LAUNCHER)')
    parser.add_argument('--master', '-m', help='Path to master PNG (overrides product lookup)')
    parser.add_argument('--name', '-n', help='Output name (default: derived from product)')
    parser.add_argument('--output', '-o', default='./generated-icons', help='Output directory')
    parser.add_argument('--platform', choices=['windows', 'android', 'ios', 'web', 'wpf', 'python', 'tauri', 'expo', 'android_native', 'service', 'all'],
                        default=None,
                        help='Target platform (default: auto-detect from product)')
    parser.add_argument('--all', action='store_true', help='Generate icons for ALL products (using each product\'s platform)')
    parser.add_argument('--launcher', action='store_true',
                        help='Generate Android mipmap icons for ALL products (for InsightLauncher app grid)')
    parser.add_argument('--list', action='store_true', help='List all available icons with platform info')

    args = parser.parse_args()

    if args.list:
        list_icons()
        return

    if args.launcher:
        launcher_dir = os.path.join(args.output, 'launcher') if args.output != './generated-icons' else os.path.join(
            str(find_insight_common_root()), 'brand', 'icons', 'generated', 'launcher'
        )
        print(f"\n=== Generating Launcher Icons (Android mipmap for all products) ===")
        print(f"Output: {launcher_dir}\n")
        generate_launcher_all(launcher_dir)
        print("\nDone!")
        return

    if args.all:
        for code, info in ALL_ICONS.items():
            try:
                platform = args.platform or info['platform']
                platform_label = PLATFORM_LABELS.get(platform, platform)
                product_dir = os.path.join(args.output, info['name'])

                if platform == 'android_native':
                    svg_path = get_svg_icon_path(code)
                    if not svg_path.exists():
                        print(f"[SKIP] {code}: SVG not found at {svg_path}")
                        continue
                    # Load master PNG for mipmap generation
                    master_img = None
                    try:
                        png_path = get_master_icon_path(code)
                        if png_path.exists():
                            master_img = Image.open(png_path).convert('RGBA')
                    except (ValueError, FileNotFoundError):
                        pass
                    print(f"\n[{code}] {info['name']} ({platform_label})")
                    generate_android_native(str(svg_path), info['name'], product_dir, master=master_img)
                else:
                    path = get_master_icon_path(code)
                    if not path.exists():
                        print(f"[SKIP] {code}: master icon not found at {path}")
                        continue
                    print(f"\n[{code}] {info['name']} ({platform_label})")
                    master = Image.open(path).convert('RGBA')
                    generate_for_platform(platform, master, info['name'], product_dir)
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
        platform = args.platform or 'all'
    else:
        key = args.product.upper()
        if key not in ALL_ICONS:
            print(f"Error: Unknown product '{key}'. Use --list to see available icons.")
            sys.exit(1)
        name = args.name or ALL_ICONS[key]['name']
        platform = args.platform or ALL_ICONS[key]['platform']

        # android_native uses SVG + master PNG
        if platform == 'android_native':
            svg_path = get_svg_icon_path(key)
            if not svg_path.exists():
                print(f"Error: SVG icon not found: {svg_path}")
                sys.exit(1)
            # Load master PNG for mipmap generation
            master_img = None
            try:
                png_path = get_master_icon_path(key)
                if png_path.exists():
                    master_img = Image.open(png_path).convert('RGBA')
            except (ValueError, FileNotFoundError):
                pass
            platform_label = PLATFORM_LABELS.get(platform, platform)
            print(f"SVG: {svg_path}")
            print(f"PNG: {png_path if master_img else '(none)'}")
            print(f"Name: {name}")
            print(f"Output: {args.output}")
            print(f"Platform: {platform_label}")
            print()
            generate_android_native(str(svg_path), name, args.output, master=master_img)
            print("\nDone!")
            return

        master_path = get_master_icon_path(key)

    if not master_path.exists():
        print(f"Error: Master icon not found: {master_path}")
        sys.exit(1)

    platform_label = PLATFORM_LABELS.get(platform, platform)
    print(f"Master: {master_path}")
    print(f"Name: {name}")
    print(f"Output: {args.output}")
    print(f"Platform: {platform_label}")
    print()

    master = Image.open(master_path).convert('RGBA')
    generate_for_platform(platform, master, name, args.output)

    print("\nDone!")


if __name__ == "__main__":
    main()
