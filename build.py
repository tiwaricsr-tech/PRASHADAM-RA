#!/usr/bin/env python3
"""Builds the single self-contained index.html (CSS + JS + logo inlined)."""
import base64
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"

css = (SRC / "style.css").read_text(encoding="utf-8")
body = (SRC / "body.html").read_text(encoding="utf-8")
seed = (SRC / "seed.js").read_text(encoding="utf-8")
core = (SRC / "app-core.js").read_text(encoding="utf-8")
admin = (SRC / "app-admin.js").read_text(encoding="utf-8")

# embed the uploaded image as brand logo (if reasonably small)
logo_js = "var LOGO = null;"
up = pathlib.Path("/home/user/uploads/images.jpg")
if up.exists() and up.stat().st_size < 600_000:
    b64 = base64.b64encode(up.read_bytes()).decode("ascii")
    logo_js = 'var LOGO = "data:image/jpeg;base64,%s";' % b64

# embed the product photo library (photos/P*.jpg -> PHOTOS map, kept OUT of localStorage)
import json as _json
photos = {}
pdir = ROOT / "photos"
if pdir.exists():
    for f in sorted(pdir.glob("P*.jpg")):
        photos[f.stem] = "data:image/jpeg;base64," + base64.b64encode(f.read_bytes()).decode("ascii")
photos_js = "var PHOTOS = " + _json.dumps(photos, separators=(",", ":")) + ";"

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prashadam — POS & Billing</title>
<style>
{css}
</style>
</head>
<body>
{body}
<script>
{logo_js}
{photos_js}
{seed}
{core}
{admin}
</script>
</body>
</html>
"""

out = ROOT / "index.html"
out.write_text(html, encoding="utf-8")
print("Built", out, f"({out.stat().st_size/1024:.1f} KB)")
