import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_img_work")
SRC = sys.argv[1] if len(sys.argv) > 1 else "candidates.json"
SHEET_PREFIX = sys.argv[2] if len(sys.argv) > 2 else "sheet_"
data = json.load(open(os.path.join(DIR, SRC), encoding="utf8"))
COLS = max(len(item["picks"]) for item in data)
THUMB = 210
LABEL_W = 230
ROWS = 9
try:
    font = ImageFont.truetype("arial.ttf", 15)
    small = ImageFont.truetype("arial.ttf", 22)
except OSError:
    font = small = ImageFont.load_default()

for sheet_no in range(0, len(data), ROWS):
    rows = data[sheet_no:sheet_no + ROWS]
    sheet = Image.new("RGB", (LABEL_W + COLS * (THUMB + 6), len(rows) * (THUMB + 6)), "white")
    draw = ImageDraw.Draw(sheet)
    for r, item in enumerate(rows):
        y = r * (THUMB + 6)
        words, line, lines = item["name"].split(), "", []
        for w in words:
            if len(line + " " + w) > 24:
                lines.append(line)
                line = w
            else:
                line = (line + " " + w).strip()
        lines.append(line)
        draw.text((6, y + 8), f"#{sheet_no + r}", fill="red", font=small)
        for i, text in enumerate(lines):
            draw.text((6, y + 40 + i * 18), text, fill="black", font=font)
        draw.text((6, y + THUMB - 24), f"need {item['need']}", fill="blue", font=font)
        for c, pick in enumerate(item["picks"]):
            path = os.path.join(DIR, pick.get("file", ""))
            if not os.path.exists(path):
                continue
            try:
                img = Image.open(path).convert("RGB")
            except Exception:
                continue
            img.thumbnail((THUMB, THUMB))
            x = LABEL_W + c * (THUMB + 6)
            sheet.paste(img, (x + (THUMB - img.width) // 2, y + (THUMB - img.height) // 2))
            draw.rectangle([x, y, x + 26, y + 26], fill="black")
            draw.text((x + 7, y + 2), str(c), fill="yellow", font=small)
    sheet.save(os.path.join(DIR, f"{SHEET_PREFIX}{sheet_no // ROWS}.jpg"), quality=80)
print("sheets", (len(data) + ROWS - 1) // ROWS)
