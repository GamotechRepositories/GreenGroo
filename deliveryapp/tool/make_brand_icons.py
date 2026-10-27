"""Builds launcher/splash/logo variants used by the app.

Run from the deliveryapp folder:  python tool/make_brand_icons.py
"""
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "splash" / "delivery_splash.png"
LOGO = ROOT / "assets" / "branding" / "greengrocc_logo.png"


def make_launcher_icon():
    src = Image.open(SRC).convert("RGBA")
    side = min(src.size)
    left = (src.width - side) // 2
    top = (src.height - side) // 2
    square = src.crop((left, top, left + side, top + side)).resize((1024, 1024), Image.LANCZOS)
    icon_dir = ROOT / "assets" / "icon"
    icon_dir.mkdir(parents=True, exist_ok=True)
    square.convert("RGB").save(icon_dir / "icon.png")


def make_empty_android12_icon():
    Image.new("RGBA", (1152, 1152), (0, 0, 0, 0)).save(
        ROOT / "assets" / "splash" / "android12_empty.png"
    )


def strip_logo_background(threshold=235):
    """Makes the near-white background connected to the image edges transparent."""
    img = Image.open(LOGO).convert("RGBA")
    w, h = img.size
    px = img.load()

    def is_bg(p):
        return p[3] > 0 and p[0] >= threshold and p[1] >= threshold and p[2] >= threshold

    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        idx = y * w + x
        if seen[idx]:
            continue
        seen[idx] = 1
        if not is_bg(px[x, y]):
            continue
        px[x, y] = (255, 255, 255, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x < w - 1:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y < h - 1:
            queue.append((x, y + 1))

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(LOGO)


if __name__ == "__main__":
    make_launcher_icon()
    make_empty_android12_icon()
    strip_logo_background()
    print("brand assets written")
