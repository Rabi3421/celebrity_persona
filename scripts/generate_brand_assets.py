from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"
IMAGES = PUBLIC / "assets" / "images"
APP = ROOT / "src" / "app"

DARK = "#120B18"
DARK_2 = "#1B1025"
INK = "#151018"
IVORY = "#F8F1E7"
GOLD = "#D8B36A"
GOLD_2 = "#F3D89C"
MUTED = "#B9AFA2"
ROSE = "#C78C93"


def ensure_dirs():
    BRAND.mkdir(parents=True, exist_ok=True)
    IMAGES.mkdir(parents=True, exist_ok=True)
    APP.mkdir(parents=True, exist_ok=True)


def font(paths, size, index=0):
    for path in paths:
        try:
            return ImageFont.truetype(path, size=size, index=index)
        except Exception:
            continue
    return ImageFont.load_default()


SERIF_PATHS = [
    "/System/Library/Fonts/Supplemental/Didot.ttc",
    "/System/Library/Fonts/Supplemental/Bodoni 72.ttc",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
]

SANS_PATHS = [
    "/System/Library/Fonts/Avenir Next.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]


def write(path, content):
    path.write_text(content.strip() + "\n", encoding="utf-8")


def mark_svg(bg=DARK, border=GOLD, c=GOLD, p=IVORY, mono=False):
    if mono:
        bg = "transparent"
        border = "currentColor"
        c = "currentColor"
        p = "currentColor"

    return f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="CelebrityPersona CP monogram">
  <rect x="7" y="7" width="82" height="82" rx="22" fill="{bg}" stroke="{border}" stroke-width="3"/>
  <path d="M24 74h48" stroke="{border}" stroke-width="2" stroke-linecap="round" opacity=".75"/>
  <path d="M72 20l4 4-4 4-4-4 4-4Z" fill="{border}"/>
  <text x="40" y="60" text-anchor="middle"
    font-family="Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif"
    font-size="43" font-weight="700" fill="{c}">C</text>
  <text x="58" y="60" text-anchor="middle"
    font-family="Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif"
    font-size="43" font-weight="700" fill="{p}">P</text>
</svg>
"""


def logo_svg(kind="dark", compact=False, icon=False):
    light = kind == "light"
    mono = kind == "mono"
    text = INK if light else IVORY
    sub = "#6B6258" if light else MUTED
    bg = IVORY if light else DARK
    mark_text_p = INK if light else IVORY
    mark = mark_svg(
        bg=bg,
        border=INK if mono else GOLD,
        c=INK if mono else GOLD,
        p=INK if mono else mark_text_p,
        mono=mono,
    )
    inner = mark.split(">", 1)[1].rsplit("</svg>", 1)[0]

    if icon:
        return mark

    if compact:
        return f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" role="img" aria-label="CelebrityPersona compact logo">
  <g>{inner}</g>
  <text x="114" y="55"
    font-family="Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif"
    font-size="31" font-weight="700" letter-spacing=".2" fill="{text if not mono else 'currentColor'}">CelebrityPersona</text>
</svg>
"""

    return f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 128" role="img" aria-label="CelebrityPersona logo">
  <g transform="translate(16 16)">{inner}</g>
  <text x="132" y="65"
    font-family="Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif"
    font-size="43" font-weight="700" letter-spacing=".4" fill="{text if not mono else 'currentColor'}">CelebrityPersona</text>
  <text x="136" y="92"
    font-family="Avenir Next, Helvetica Neue, Arial, sans-serif"
    font-size="12" font-weight="600" letter-spacing="4.3" fill="{sub if not mono else 'currentColor'}">CELEBRITY / FASHION / FILM</text>
</svg>
"""


def generate_svgs():
    for kind in ("dark", "light", "mono"):
        write(BRAND / f"celebritypersona-logo-{kind}.svg", logo_svg(kind))
        write(BRAND / f"celebritypersona-compact-{kind}.svg", logo_svg(kind, compact=True))
        write(BRAND / f"celebritypersona-icon-{kind}.svg", logo_svg(kind, icon=True))

    write(BRAND / "celebritypersona-mark.svg", logo_svg("dark", icon=True))
    write(PUBLIC / "icon.svg", logo_svg("dark", icon=True))
    write(PUBLIC / "favicon.svg", logo_svg("dark", icon=True))
    write(APP / "icon.svg", logo_svg("dark", icon=True))


def draw_mark(size, theme="dark", scale=4):
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if theme == "light":
        bg, border, c_fill, p_fill = IVORY, INK, INK, GOLD
    else:
        bg, border, c_fill, p_fill = DARK, GOLD, GOLD, IVORY

    margin = int(canvas * 0.075)
    radius = int(canvas * 0.22)
    draw.rounded_rectangle(
        [margin, margin, canvas - margin, canvas - margin],
        radius=radius,
        fill=bg,
        outline=border,
        width=max(2, int(canvas * 0.032)),
    )

    line_y = int(canvas * 0.77)
    draw.line(
        [int(canvas * 0.25), line_y, int(canvas * 0.75), line_y],
        fill=border,
        width=max(1, int(canvas * 0.018)),
    )

    cx = int(canvas * 0.755)
    cy = int(canvas * 0.25)
    diamond = int(canvas * 0.048)
    draw.polygon([(cx, cy - diamond), (cx + diamond, cy), (cx, cy + diamond), (cx - diamond, cy)], fill=border)

    serif = font(SERIF_PATHS, int(canvas * 0.46))
    c_box = draw.textbbox((0, 0), "C", font=serif)
    p_box = draw.textbbox((0, 0), "P", font=serif)
    c_w = c_box[2] - c_box[0]
    p_w = p_box[2] - p_box[0]
    overlap = int(canvas * 0.13)
    total = c_w + p_w - overlap
    x = int((canvas - total) / 2)
    y = int(canvas * 0.285)
    draw.text((x, y), "C", font=serif, fill=c_fill)
    draw.text((x + c_w - overlap, y), "P", font=serif, fill=p_fill)

    return img.resize((size, size), Image.Resampling.LANCZOS)


def draw_social(path, title="CelebrityPersona"):
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), DARK)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, w, h], fill=DARK)
    draw.rectangle([0, 0, 84, h], fill="#0B0710")
    draw.rectangle([84, 0, 88, h], fill=GOLD)
    draw.rectangle([w - 260, 0, w, h], fill=DARK_2)
    draw.line([136, 104, 1030, 104], fill=(216, 179, 106), width=2)
    draw.line([136, 526, 1030, 526], fill=(216, 179, 106), width=2)

    mark = draw_mark(184, "dark")
    img.paste(mark, (136, 176), mark)

    serif_big = font(SERIF_PATHS, 88)
    serif_mid = font(SERIF_PATHS, 43)
    sans = font(SANS_PATHS, 24)
    sans_small = font(SANS_PATHS, 17)

    draw.text((360, 190), title, font=serif_big, fill=IVORY)
    draw.text((364, 284), "Celebrity profiles, fashion, news, and film culture", font=serif_mid, fill=GOLD_2)
    draw.text((366, 366), "A modern editorial destination for star style, outfit breakdowns, movie reviews, and upcoming releases.", font=sans, fill=MUTED)
    draw.text((366, 446), "CELEBRITY / FASHION / FILM", font=sans_small, fill=ROSE)

    for i, label in enumerate(("PROFILES", "OUTFITS", "REVIEWS")):
        x = 842
        y = 170 + i * 78
        draw.rectangle([x, y, x + 210, y + 42], outline=(216, 179, 106), width=1)
        draw.text((x + 20, y + 13), label, font=sans_small, fill=IVORY)

    img.save(path, "PNG", optimize=True)


def draw_placeholder(path):
    size = 500
    img = Image.new("RGB", (size, size), DARK)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, size, size], fill=DARK)
    draw.rectangle([34, 34, size - 34, size - 34], outline=GOLD, width=2)
    mark = draw_mark(154, "dark")
    img.paste(mark, (173, 128), mark)
    serif = font(SERIF_PATHS, 38)
    sans = font(SANS_PATHS, 15)
    draw.text((78, 322), "CelebrityPersona", font=serif, fill=IVORY)
    draw.text((119, 372), "EDITORIAL IMAGE", font=sans, fill=MUTED)
    img.save(path, "PNG", optimize=True)


def editorial_svg(title, subtitle, accent=GOLD):
    return f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="{title}">
  <rect width="1200" height="800" fill="{DARK}"/>
  <rect x="0" y="0" width="92" height="800" fill="#0B0710"/>
  <rect x="92" y="0" width="4" height="800" fill="{accent}"/>
  <rect x="835" y="0" width="365" height="800" fill="{DARK_2}"/>
  <rect x="132" y="104" width="936" height="592" rx="34" fill="none" stroke="{accent}" stroke-width="2" opacity=".85"/>
  <text x="170" y="202" font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="82" font-weight="700" fill="{IVORY}">{title}</text>
  <text x="174" y="270" font-family="Avenir Next, Helvetica Neue, Arial, sans-serif" font-size="24" font-weight="600" letter-spacing="5" fill="{accent}">{subtitle}</text>
  <text x="174" y="610" font-family="Avenir Next, Helvetica Neue, Arial, sans-serif" font-size="19" font-weight="600" letter-spacing="4" fill="{MUTED}">CELEBRITYPERSONA</text>
  <g transform="translate(858 178) scale(2.6)">
    <rect x="7" y="7" width="82" height="82" rx="22" fill="{DARK}" stroke="{accent}" stroke-width="3"/>
    <path d="M24 74h48" stroke="{accent}" stroke-width="2" stroke-linecap="round" opacity=".75"/>
    <path d="M72 20l4 4-4 4-4-4 4-4Z" fill="{accent}"/>
    <text x="40" y="60" text-anchor="middle" font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="43" font-weight="700" fill="{accent}">C</text>
    <text x="58" y="60" text-anchor="middle" font-family="Didot, 'Bodoni 72', Georgia, serif" font-size="43" font-weight="700" fill="{IVORY}">P</text>
  </g>
</svg>
"""


def generate_images():
    icon512 = draw_mark(512, "dark")
    icon512.save(PUBLIC / "icon.png", "PNG", optimize=True)
    icon512.save(PUBLIC / "android-chrome-512x512.png", "PNG", optimize=True)
    draw_mark(192, "dark").save(PUBLIC / "android-chrome-192x192.png", "PNG", optimize=True)
    draw_mark(180, "dark").save(PUBLIC / "apple-touch-icon.png", "PNG", optimize=True)
    draw_mark(32, "dark").save(PUBLIC / "favicon-32x32.png", "PNG", optimize=True)
    draw_mark(16, "dark").save(PUBLIC / "favicon-16x16.png", "PNG", optimize=True)
    draw_mark(150, "dark").save(PUBLIC / "mstile-150x150.png", "PNG", optimize=True)

    ico_sizes = [draw_mark(size, "dark") for size in (16, 32, 48, 64, 128, 256)]
    ico_sizes[-1].save(PUBLIC / "favicon.ico", format="ICO", sizes=[(im.width, im.height) for im in ico_sizes], append_images=ico_sizes[:-1])

    draw_social(PUBLIC / "og-image.png")
    copyfile(PUBLIC / "og-image.png", PUBLIC / "twitter-image.png")
    copyfile(PUBLIC / "og-image.png", APP / "opengraph-image.png")
    copyfile(PUBLIC / "twitter-image.png", APP / "twitter-image.png")
    copyfile(PUBLIC / "apple-touch-icon.png", APP / "apple-icon.png")

    draw_placeholder(IMAGES / "no_image.png")

    write(IMAGES / "editorial-celebrity.svg", editorial_svg("Profiles", "BIOGRAPHY / STYLE / CAREER"))
    write(IMAGES / "editorial-fashion.svg", editorial_svg("Fashion", "OUTFITS / DESIGNERS / DETAILS", ROSE))
    write(IMAGES / "editorial-movies.svg", editorial_svg("Movies", "REVIEWS / RELEASES / CAST", GOLD_2))
    write(IMAGES / "editorial-news.svg", editorial_svg("News", "STORIES / CULTURE / TRENDS", "#C9A9FF"))
    write(IMAGES / "avatar-placeholder.svg", logo_svg("dark", icon=True))


def main():
    ensure_dirs()
    generate_svgs()
    generate_images()


if __name__ == "__main__":
    main()
