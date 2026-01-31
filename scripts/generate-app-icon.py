"""
Harmonic Insight App Icon Generator
Generates ICO files for HarmonicSheet, HarmonicDoc, HarmonicSlide
Brand: Ivory & Gold Theme (#B8942F primary)
"""

import io
import math
from PIL import Image, ImageDraw, ImageFont

# Brand colors
GOLD = (184, 148, 47)        # #B8942F
GOLD_DARK = (140, 113, 30)   # #8C711E
GOLD_LIGHT = (240, 230, 200) # #F0E6C8
IVORY = (250, 248, 245)      # #FAF8F5
WHITE = (255, 255, 255)
TEXT_PRIMARY = (28, 25, 23)   # #1C1917
SUCCESS = (22, 163, 74)      # #16A34A (green for Sheet)
INFO_BLUE = (37, 99, 235)    # #2563EB (blue for Doc - semantic, not primary)
AMBER = (217, 119, 6)        # #D97706 (amber for Slide)


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    r = radius
    # Corners
    draw.pieslice([x0, y0, x0+2*r, y0+2*r], 180, 270, fill=fill, outline=outline, width=width)
    draw.pieslice([x1-2*r, y0, x1, y0+2*r], 270, 360, fill=fill, outline=outline, width=width)
    draw.pieslice([x0, y1-2*r, x0+2*r, y1], 90, 180, fill=fill, outline=outline, width=width)
    draw.pieslice([x1-2*r, y1-2*r, x1, y1], 0, 90, fill=fill, outline=outline, width=width)
    # Edges
    draw.rectangle([x0+r, y0, x1-r, y1], fill=fill)
    draw.rectangle([x0, y0+r, x0+r, y1-r], fill=fill)
    draw.rectangle([x1-r, y0+r, x1, y1-r], fill=fill)


def create_harmonic_sheet_icon(size):
    """HarmonicSheet: Gold spreadsheet grid icon with 'H' accent."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = size // 8
    r = size // 6

    # Background rounded rect - Gold
    draw_rounded_rect(draw, [margin, margin, size-margin, size-margin], r, fill=GOLD)

    # Grid lines (white) - spreadsheet feel
    inner_margin = size // 4
    grid_area = (inner_margin, inner_margin, size - inner_margin, size - inner_margin)
    gx0, gy0, gx1, gy1 = grid_area
    gw = gx1 - gx0
    gh = gy1 - gy0

    line_w = max(1, size // 64)

    # Draw white grid background
    grid_r = max(2, size // 32)
    draw_rounded_rect(draw, [gx0, gy0, gx1, gy1], grid_r, fill=WHITE)

    # Horizontal lines
    rows = 4
    for i in range(1, rows):
        y = gy0 + (gh * i) // rows
        draw.line([(gx0 + line_w, y), (gx1 - line_w, y)], fill=GOLD_LIGHT, width=line_w)

    # Vertical lines
    cols = 3
    for i in range(1, cols):
        x = gx0 + (gw * i) // cols
        draw.line([(x, gy0 + line_w), (x, gy1 - line_w)], fill=GOLD_LIGHT, width=line_w)

    # Top header row - darker gold
    header_h = gh // rows
    draw_rounded_rect(draw, [gx0, gy0, gx1, gy0 + header_h], grid_r, fill=GOLD_DARK)

    # Left column accent
    col_w = gw // cols
    for row_i in range(1, rows):
        ry = gy0 + (gh * row_i) // rows
        draw.rectangle([gx0, ry + line_w, gx0 + col_w, ry + (gh // rows) - line_w], fill=GOLD_LIGHT)

    return img


def create_harmonic_doc_icon(size):
    """HarmonicDoc: Gold document icon with lines."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = size // 8
    r = size // 6

    # Background rounded rect - Gold
    draw_rounded_rect(draw, [margin, margin, size-margin, size-margin], r, fill=GOLD)

    # Document shape (white page with fold)
    doc_margin = size // 4
    dx0 = doc_margin
    dy0 = doc_margin - size // 16
    dx1 = size - doc_margin
    dy1 = size - doc_margin + size // 16
    fold_size = size // 6

    # Page body
    doc_r = max(2, size // 32)
    draw_rounded_rect(draw, [dx0, dy0, dx1, dy1], doc_r, fill=WHITE)

    # Fold corner (top-right)
    fold_pts = [
        (dx1 - fold_size, dy0),
        (dx1, dy0 + fold_size),
        (dx1 - fold_size, dy0 + fold_size),
    ]
    draw.polygon(fold_pts, fill=GOLD_LIGHT)
    draw.line([(dx1 - fold_size, dy0), (dx1 - fold_size, dy0 + fold_size)], fill=GOLD, width=max(1, size // 64))
    draw.line([(dx1 - fold_size, dy0 + fold_size), (dx1, dy0 + fold_size)], fill=GOLD, width=max(1, size // 64))

    # Text lines
    line_w = max(1, size // 48)
    text_margin_x = dx0 + size // 8
    text_end_x = dx1 - size // 6
    line_start_y = dy0 + fold_size + size // 8
    line_gap = size // 8

    for i in range(4):
        ly = line_start_y + i * line_gap
        end_x = text_end_x if i < 3 else text_end_x - size // 6
        if ly + line_w < dy1 - size // 16:
            draw.rounded_rectangle(
                [text_margin_x, ly, end_x, ly + line_w],
                radius=line_w // 2,
                fill=GOLD_LIGHT if i > 0 else GOLD_DARK
            )

    return img


def create_harmonic_slide_icon(size):
    """HarmonicSlide: Gold presentation/slide icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = size // 8
    r = size // 6

    # Background rounded rect - Gold
    draw_rounded_rect(draw, [margin, margin, size-margin, size-margin], r, fill=GOLD)

    # Presentation screen (white)
    screen_margin_x = size // 4
    screen_margin_top = size // 4 - size // 16
    screen_margin_bottom = size // 3
    sx0 = screen_margin_x
    sy0 = screen_margin_top
    sx1 = size - screen_margin_x
    sy1 = size - screen_margin_bottom

    screen_r = max(2, size // 24)
    draw_rounded_rect(draw, [sx0, sy0, sx1, sy1], screen_r, fill=WHITE)

    # Presentation stand/base
    center_x = size // 2
    base_top = sy1 + max(2, size // 32)
    base_bottom = size - margin - size // 8
    stand_w = max(2, size // 24)

    # Vertical stand
    draw.rectangle([center_x - stand_w//2, base_top, center_x + stand_w//2, base_bottom], fill=WHITE)

    # Horizontal base
    base_w = size // 4
    draw.rounded_rectangle(
        [center_x - base_w, base_bottom - stand_w//2, center_x + base_w, base_bottom + stand_w//2],
        radius=stand_w // 2,
        fill=WHITE
    )

    # Content on slide - title bar
    title_y = sy0 + (sy1 - sy0) // 5
    title_h = max(2, size // 32)
    title_margin = size // 8
    draw.rounded_rectangle(
        [sx0 + title_margin, title_y, sx1 - title_margin, title_y + title_h],
        radius=title_h // 2,
        fill=GOLD_DARK
    )

    # Content blocks
    block_y = title_y + title_h + size // 12
    block_h = (sy1 - block_y - size // 12)
    block_w = (sx1 - sx0 - title_margin * 2 - size // 16) // 2

    if block_h > 0 and block_w > 0:
        # Left block
        draw.rounded_rectangle(
            [sx0 + title_margin, block_y, sx0 + title_margin + block_w, block_y + block_h],
            radius=max(1, size // 64),
            fill=GOLD_LIGHT
        )
        # Right block
        draw.rounded_rectangle(
            [sx1 - title_margin - block_w, block_y, sx1 - title_margin, block_y + block_h],
            radius=max(1, size // 64),
            fill=GOLD_LIGHT
        )

    return img


def save_ico(images_by_size, filepath):
    """Save multiple sizes as a single ICO file."""
    sizes_to_save = []
    for s in [16, 24, 32, 48, 64, 128, 256]:
        if s in images_by_size:
            img = images_by_size[s].copy()
            # Convert to RGBA for ICO
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


def generate_icons(name, create_func, output_dir):
    """Generate multi-resolution ICO and individual PNGs."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    sizes = [16, 24, 32, 48, 64, 128, 256]
    images = {}

    for s in sizes:
        # Render at 4x then downscale for antialiasing
        render_size = s * 4
        img = create_func(render_size)
        img = img.resize((s, s), Image.LANCZOS)
        images[s] = img
        img.save(os.path.join(output_dir, f"{name}_{s}.png"))

    # Save ICO
    ico_path = os.path.join(output_dir, f"{name}.ico")
    save_ico(images, ico_path)
    print(f"  Created: {ico_path}")

    # Also save a 256px PNG for reference
    images[256].save(os.path.join(output_dir, f"{name}_icon.png"))

    return ico_path


if __name__ == "__main__":
    import os

    base = "/tmp/app-Insight-excel"

    apps = [
        ("HarmonicSheet", create_harmonic_sheet_icon, f"{base}/src/HarmonicSheet.App/Resources"),
        ("HarmonicDoc", create_harmonic_doc_icon, f"{base}/src/HarmonicDoc.App/Resources"),
        ("HarmonicSlide", create_harmonic_slide_icon, f"{base}/src/HarmonicSlide.App/Resources"),
    ]

    for name, func, out_dir in apps:
        print(f"Generating {name} icons...")
        generate_icons(name, func, out_dir)

    print("\nAll icons generated successfully!")
