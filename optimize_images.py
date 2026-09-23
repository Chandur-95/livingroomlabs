#!/usr/bin/env python3
"""Living Room Labs - makes the small, fast copies of website photos.

For every photo the site uses (and every photo just uploaded) it creates:
  images/thumbs/<file>.webp + .jpg   small copies for the photo strips (short side 800px)
  images/full/<file>.webp            the copy shown in the photo viewer (long side 2000px)
  images/hero/<file>-<w>.webp        4 widths (800/1280/1920/2400) for the big banner photos
It also shrinks any giant original (camera-size) photo in place. The originals are never deleted.
The website falls back to the original photo whenever a small copy is missing, so nothing can break.

usage:  python tools/optimize_images.py [--root .] [--changed images/uploads/a.jpg ...] [--force]
"""
import argparse, json, os, sys
from PIL import Image, ImageOps

THUMB_SHORT, FULL_LONG, HERO_WIDTHS = 800, 2000, (800, 1280, 1920, 2400)
Q = {"thumb_jpg": 82, "thumb_webp": 76, "full_webp": 78, "hero_webp": 76, "orig": 84}
GIANT_LONG, GIANT_BYTES, ORIG_LONG = 2600, 1_600_000, 2400
EXT = (".jpg", ".jpeg", ".png", ".webp")

def rd(root, rel):
    try: return json.load(open(os.path.join(root, rel), encoding="utf-8"))
    except Exception: return {}

def referenced(root):
    """{file name: set(roles)} for every photo content.json points at"""
    d, out = rd(root, "content.json"), {}
    def add(src, role):
        if isinstance(src, str) and src.startswith("/images/uploads/"):
            name = src.split("/images/uploads/", 1)[1].split("?")[0]
            if name.lower().endswith(EXT): out.setdefault(name, set()).add(role)
    for p in d.get("photos", []): add(p.get("src"), "photo")
    for s in d.get("bandSlides", []): add(s.get("src"), "hero")
    add(d.get("bandImg"), "hero"); add(d.get("teamHeroImg"), "hero")
    for m in d.get("team", []): add(m.get("photo"), "team"); add(m.get("photo2"), "team")
    return out

def load(path):
    im = Image.open(path); icc = im.info.get("icc_profile"); im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.getchannel("A")); im = bg
    elif im.mode != "RGB": im = im.convert("RGB")
    return im, icc

def sharpness(a, b):
    """0..1, 1 = identical. Needs scikit-image; without it we just use a safe fixed quality."""
    try:
        import numpy as np
        from skimage.metrics import structural_similarity
        return structural_similarity(np.asarray(a.convert("L")), np.asarray(b.convert("L")))
    except Exception:
        return None

def save_webp(im, path, icc, first_q, target=0.97):
    """Saves a WebP at the LOWEST quality that still looks the same as the original (sharpness >= target).
    Simple photos stay tiny; detail-heavy photos (fur, fabric, foliage) automatically get more quality."""
    import io
    kw = {"icc_profile": icc} if icc else {}
    data = None
    for q in (first_q, first_q + 4, first_q + 8, first_q + 12, 96):
        buf = io.BytesIO(); im.save(buf, "WEBP", quality=q, method=6, **kw); data = buf.getvalue()
        s = sharpness(im, Image.open(io.BytesIO(data)).convert("RGB"))
        if s is None or s >= target: break
    os.makedirs(os.path.dirname(path), exist_ok=True); open(path, "wb").write(data)

def save(im, path, fmt, q, icc):
    os.makedirs(os.path.dirname(path), exist_ok=True); kw = {"icc_profile": icc} if icc else {}
    if fmt == "JPEG": im.save(path, "JPEG", quality=q, optimize=True, progressive=True, **kw)
    else: save_webp(im, path, icc, q)

def fit(im, long_side=None, short_side=None, width=None):
    W, H = im.size
    s = 1.0
    if long_side: s = min(1.0, long_side / max(W, H))
    if short_side: s = min(1.0, short_side / min(W, H))
    if width: s = min(1.0, width / W)
    return im if s >= 1.0 else im.resize((max(1, round(W * s)), max(1, round(H * s))), Image.LANCZOS)

def process(root, name, roles, force, log):
    up = os.path.join(root, "images", "uploads", name)
    if not os.path.isfile(up): return
    made = []
    im, icc = load(up)
    W, H = im.size
    if name.lower().endswith((".jpg", ".jpeg")) and (max(W, H) > GIANT_LONG or os.path.getsize(up) > GIANT_BYTES):
        big = fit(im, long_side=ORIG_LONG); save(big, up, "JPEG", Q["orig"], icc); im = big; made.append("shrunk original")
    def want(rel): return force or not os.path.isfile(os.path.join(root, rel))
    t_jpg, t_web = f"images/thumbs/{name}.jpg", f"images/thumbs/{name}.webp"
    if want(t_jpg) or want(t_web):
        t = fit(im, short_side=THUMB_SHORT)
        if want(t_jpg): save(t, os.path.join(root, t_jpg), "JPEG", Q["thumb_jpg"], icc)
        if want(t_web): save(t, os.path.join(root, t_web), "WEBP", Q["thumb_webp"], icc)
        made.append("thumbs")
    f_web = f"images/full/{name}.webp"
    if want(f_web): save(fit(im, long_side=FULL_LONG), os.path.join(root, f_web), "WEBP", Q["full_webp"], icc); made.append("viewer copy")
    if "hero" in roles:
        for w in HERO_WIDTHS:
            rel = f"images/hero/{name}-{w}.webp"
            if want(rel): save(fit(im, width=w), os.path.join(root, rel), "WEBP", Q["hero_webp"], icc); made.append(f"hero {w}")
    if made: log.append(f"  {name}: {', '.join(made)}")

def update_colors(root, refs, changed, log):
    """images/colors.json = {file name: "#rrggbb"}, each photo's average colour. The website paints
    it behind a photo while it loads, so a card shows the photo's own tone instead of an empty box.
    Kept in its own small file (never content.json, which the editors write to)."""
    path = os.path.join(root, "images", "colors.json")
    try: colors = json.load(open(path, encoding="utf-8"))
    except Exception: colors = {}
    if not isinstance(colors, dict): colors = {}
    before = json.dumps(colors, sort_keys=True)
    colors = {k: v for k, v in colors.items() if k in refs}          # photos that were deleted
    for name in sorted(refs):
        if name in colors and name not in changed: continue
        for rel in (f"images/thumbs/{name}.jpg", f"images/thumbs/{name}.webp", f"images/uploads/{name}"):
            full = os.path.join(root, rel)
            if not os.path.isfile(full): continue
            try:
                im = Image.open(full); im.draft("RGB", (160, 160)); im = ImageOps.exif_transpose(im)
                if im.mode in ("RGBA", "LA", "P"):
                    im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.getchannel("A")); im = bg
                im = im.convert("RGB"); im.thumbnail((64, 64))
                r, g, b = im.resize((1, 1), Image.BOX).getpixel((0, 0))
                colors[name] = "#%02x%02x%02x" % (r, g, b)
            except Exception as e:
                log.append(f"  {name}: no colour ({type(e).__name__})")
            break
    if json.dumps(colors, sort_keys=True) != before:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(colors, f, sort_keys=True, separators=(",", ":")); f.write("\n")
        log.append(f"  colours: {len(colors)} photos in images/colors.json")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--root", default="."); ap.add_argument("--changed", nargs="*", default=[]); ap.add_argument("--force", action="store_true")
    a = ap.parse_args(); root = os.path.abspath(a.root)
    refs = referenced(root); changed = {os.path.basename(c) for c in a.changed if "images/uploads/" in c.replace("\\", "/") and c.lower().endswith(EXT)}
    log = []
    for name in sorted(set(refs) | changed):
        try:
            process(root, name, refs.get(name, set()), a.force or name in changed, log)
        except Exception as e:      # one unreadable file must never stop the others
            log.append(f"  {name}: SKIPPED ({type(e).__name__}: {e})")
    try:
        update_colors(root, set(refs), changed, log)
    except Exception as e:          # colours are a nice-to-have - never fail the run over them
        log.append(f"  colours: SKIPPED ({type(e).__name__}: {e})")
    print("\n".join(log) if log else "nothing to do - all small copies already exist")

if __name__ == "__main__": main()
