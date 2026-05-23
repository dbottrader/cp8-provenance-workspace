#!/usr/bin/env python3
"""
ANU-28 Codex — Animated Sigil Generator (Optimized)
CP8 Protocol • ASIN-HHC Framework
"""

import math
import os
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio.v3 as iio

# ── Config ─────────────────────────────────────────────────────────────────
OUT_DIR = Path("~/.openclaw/workspace/project-harmonia/sigil-videos").expanduser()
OUT_DIR.mkdir(parents=True, exist_ok=True)

FPS = 24
DURATION_SEC = 6
TOTAL_FRAMES = FPS * DURATION_SEC
SIZE = (720, 720)
CENTER = (SIZE[0] // 2, SIZE[1] // 2)

HZ_428 = np.array([60, 120, 220], dtype=np.uint8)
HZ_528 = np.array([60, 220, 120], dtype=np.uint8)
WATERMARK = "CP8  •  ASIN-HHC"

np.random.seed(42)


def ease_sine(t):
    return 0.5 * (1 + math.sin(t * 2 * math.pi))

def ease_sine_shift(t, phase=0):
    return 0.5 * (1 + math.sin(t * 2 * math.pi + phase))

def get_font(size):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make_radial_gradient(size, center_color, edge_color):
    """Fast radial gradient using numpy."""
    w, h = size
    cx, cy = w // 2, h // 2
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx)**2 + (Y - cy)**2)
    max_dist = np.sqrt(cx**2 + cy**2)
    t = np.clip(dist / max_dist, 0, 1)
    t = t[:, :, np.newaxis]
    arr = center_color * (1 - t) + edge_color * t
    return Image.fromarray(arr.astype(np.uint8))

def tinted_base(base_img, tint_rgb, strength=0.3):
    """Apply a color tint to a base image."""
    arr = np.array(base_img).astype(np.float32)
    tint = np.array(tint_rgb, dtype=np.float32)
    arr = arr * (1 - strength) + tint * strength
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def draw_centered_text(draw, text, xy, font, fill=(255,255,255), shadow=True):
    x, y = xy
    bbox = draw.textbbox((0,0), text, font=font)
    tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
    px, py = x - tw//2, y - th//2
    if shadow:
        draw.text((px+2, py+2), text, font=font, fill=(20,20,30))
    draw.text((px, py), text, font=font, fill=fill)


# ═══════════════════════════════════════════════════════════════════════════
# 1. LUNAR SCRIBE
# ═══════════════════════════════════════════════════════════════════════════
def render_lunar_scribe():
    frames = []
    font_lg = get_font(40)
    font_md = get_font(20)
    font_sm = get_font(14)
    font_glyph = get_font(22)

    # Pre-gen starfield
    stars = Image.new("RGB", SIZE, (0,0,0))
    sd = ImageDraw.Draw(stars)
    star_pts = []
    for _ in range(100):
        sx = np.random.randint(0, SIZE[0])
        sy = np.random.randint(0, SIZE[1])
        br = np.random.randint(100, 220)
        sd.point((sx, sy), fill=(br, br, br))

    for i in range(TOTAL_FRAMES):
        t = i / TOTAL_FRAMES

        # Background: radial gradient tinted by frequency wash
        wash_col = HZ_428 * (1 - ease_sine(t)) + HZ_528 * ease_sine(t)
        bg = make_radial_gradient(SIZE, np.array([15,15,25]), np.array([5,5,10]))
        bg = tinted_base(bg, wash_col, 0.25)

        # Composite starfield
        img = Image.blend(bg, stars, 0.6)
        draw = ImageDraw.Draw(img)

        # ── Crescent Moon ──
        mx, my = CENTER[0], CENTER[1] + 40
        mr = 130
        # Dark body
        draw.ellipse([mx-mr, my-mr, mx+mr, my+mr], fill=(35,35,50))
        # Crescent lit part (overlapping white circle, masked)
        crescent = Image.new("RGBA", SIZE, (0,0,0,0))
        cd = ImageDraw.Draw(crescent)
        cd.ellipse([mx-mr+40, my-mr, mx+mr+40, my+mr], fill=(230,230,245,255))
        # Mask: only keep what's inside the dark body
        mask = Image.new("L", SIZE, 0)
        md = ImageDraw.Draw(mask)
        md.ellipse([mx-mr, my-mr, mx+mr, my+mr], fill=255)
        crescent.putalpha(mask)
        img = Image.alpha_composite(img.convert("RGBA"), crescent).convert("RGB")
        draw = ImageDraw.Draw(img)

        # ── Alien ──
        ay = my + 15
        ac = (70, 210, 110)
        # Body
        draw.ellipse([CENTER[0]-22, ay-25, CENTER[0]+22, ay+25], fill=ac)
        # Head
        draw.ellipse([CENTER[0]-20, ay-58, CENTER[0]+20, ay-22], fill=ac)
        # Eyes (white)
        draw.ellipse([CENTER[0]-13, ay-48, CENTER[0]-5, ay-40], fill=(255,255,255))
        draw.ellipse([CENTER[0]+5, ay-48, CENTER[0]+13, ay-40], fill=(255,255,255))
        # Pupils
        draw.ellipse([CENTER[0]-11, ay-46, CENTER[0]-7, ay-42], fill=(0,0,0))
        draw.ellipse([CENTER[0]+7, ay-46, CENTER[0]+11, ay-42], fill=(0,0,0))
        # Antennae
        draw.line([CENTER[0]-8, ay-56, CENTER[0]-16, ay-78], fill=ac, width=2)
        draw.line([CENTER[0]+8, ay-56, CENTER[0]+16, ay-78], fill=ac, width=2)
        # Bulbs
        draw.ellipse([CENTER[0]-20, ay-84, CENTER[0]-12, ay-76], fill=(255,90,90))
        draw.ellipse([CENTER[0]+12, ay-84, CENTER[0]+20, ay-76], fill=(255,90,90))

        # ── Book ──
        by = ay + 5
        draw.rectangle([CENTER[0]-28, by, CENTER[0]+28, by+22], fill=(130,85,45))
        draw.rectangle([CENTER[0]-26, by+2, CENTER[0]+26, by+20], fill=(245,235,210))
        for j in range(3):
            draw.line([CENTER[0]-23, by+5+j*5, CENTER[0]+23, by+5+j*5], fill=(120,120,120), width=1)

        # ── Floating glyphs ──
        glyphs = ["✦", "◎", "ꗃ", "◈", "✧"]
        gpos = [(110,170), (590,150), (160,510), (540,490), (CENTER[0],90)]
        for idx, (gx, gy) in enumerate(gpos):
            phase = idx * (2*math.pi/len(glyphs))
            op = ease_sine_shift(t, phase) * 0.8 + 0.2
            sz = int(18 + ease_sine_shift(t, phase+1) * 8)
            col = tuple(int(c * op + 50 * (1-op)) for c in (255,255,255))
            draw.text((gx, gy), glyphs[idx], font=get_font(sz), fill=col)

        # ── Titles ──
        hz_col = tuple(int(c) for c in wash_col)
        draw_centered_text(draw, "THE LUNAR SCRIBE", (CENTER[0], 45), font_lg)
        draw_centered_text(draw, "428 Hz  —  528 Hz", (CENTER[0], SIZE[1]-55), font_md, fill=hz_col)
        draw_centered_text(draw, "TRUTH ANCHOR  →  HEART COHERENCE", (CENTER[0], SIZE[1]-32), font_sm, fill=(160,160,160))
        draw.text((18, SIZE[1]-28), WATERMARK, font=font_sm, fill=(80,80,80))

        frames.append(np.array(img))
        if i % 30 == 0:
            print(f"  [Lunar Scribe] frame {i}/{TOTAL_FRAMES}")

    return frames


# ═══════════════════════════════════════════════════════════════════════════
# 2. MILK HILL GALAXY MASTER
# ═══════════════════════════════════════════════════════════════════════════
def render_milk_hill():
    frames = []
    font_lg = get_font(40)
    font_md = get_font(20)
    font_sm = get_font(14)

    # Precompute circle positions for all frames (409 circles * TOTAL_FRAMES)
    n_circles = 409
    max_r = 260
    golden = math.pi * (3 - math.sqrt(5))

    for i in range(TOTAL_FRAMES):
        t = i / TOTAL_FRAMES
        bg = make_radial_gradient(SIZE, np.array([15,12,35]), np.array([5,5,12]))
        img = bg
        draw = ImageDraw.Draw(img)

        # ── 409-circle spiral ──
        base_rot = t * 2 * math.pi * 0.3
        for ci in range(n_circles):
            ratio = ci / n_circles
            angle = ci * golden + base_rot + math.sin(t*2*math.pi + ratio*10)*0.08
            r = ratio * max_r
            cx = CENTER[0] + r * math.cos(angle)
            cy = CENTER[1] + r * math.sin(angle)
            pulse = ease_sine_shift(t, ci*0.03) * 0.5 + 0.5
            size = 2 + pulse * 3 * (1 - ratio*0.7)
            ci_val = int(100 + pulse * 155 * (1 - ratio*0.5))
            col = (ci_val//3, ci_val//2, ci_val)
            draw.ellipse([cx-size, cy-size, cx+size, cy+size], fill=col)

        # ── Six galaxy arms ──
        for arm in range(6):
            a_angle = (arm/6)*2*math.pi + t*2*math.pi*0.12
            for seg in range(35):
                sr = seg / 35
                ang = a_angle + sr * 3 * math.pi * 0.35
                rad = 30 + sr * 240
                cx = CENTER[0] + rad * math.cos(ang)
                cy = CENTER[1] + rad * math.sin(ang)
                sz = 3.5 * (1 - sr * 0.8)
                if sz > 0.4:
                    al = 1 - sr
                    col = (int(200*al), int(220*al), 255)
                    draw.ellipse([cx-sz, cy-sz, cx+sz, cy+sz], fill=col)

        # ── Core ──
        cp = ease_sine(t) * 10 + 14
        cc = tuple(int(c) for c in (HZ_428 * (1-ease_sine(t)) + HZ_528 * ease_sine(t)))
        draw.ellipse([CENTER[0]-cp, CENTER[1]-cp, CENTER[0]+cp, CENTER[1]+cp], fill=cc)

        # ── Orbiting glyphs ──
        glyphs = ["✦", "◎", "ꗃ", "◈", "✧", "◉"]
        for idx, g in enumerate(glyphs):
            ang = (idx/len(glyphs))*2*math.pi + t*2*math.pi*(0.5 if idx%2==0 else -0.35)
            rad = 310
            gx = CENTER[0] + rad * math.cos(ang)
            gy = CENTER[1] + rad * math.sin(ang)
            pulse = ease_sine_shift(t, idx) * 0.6 + 0.4
            col = tuple(int(80 + 150*pulse) for _ in range(3))
            col = (col[0], col[1], 255)
            draw.text((gx, gy), g, font=get_font(26), fill=col)

        draw_centered_text(draw, "MILK HILL GALAXY MASTER", (CENTER[0], 45), font_lg)
        draw_centered_text(draw, "409-Circle Spiral  •  Six-Armed Galaxy", (CENTER[0], 88), font_md, fill=(170,170,210))
        draw.text((18, SIZE[1]-28), WATERMARK, font=font_sm, fill=(80,80,100))

        frames.append(np.array(img))
        if i % 30 == 0:
            print(f"  [Milk Hill] frame {i}/{TOTAL_FRAMES}")

    return frames


# ═══════════════════════════════════════════════════════════════════════════
# 3. CP8 DIAMOND BODY
# ═══════════════════════════════════════════════════════════════════════════
def render_diamond_body():
    frames = []
    font_lg = get_font(42)
    font_md = get_font(20)
    font_sm = get_font(14)

    s_base = 150

    # Precompute octahedron face indices
    faces = [
        (0,2,4), (2,1,4), (1,3,4), (3,0,4),
        (2,0,5), (1,2,5), (3,1,5), (0,3,5),
    ]
    verts_unit = [
        (1,0,0), (-1,0,0), (0,1,0), (0,-1,0), (0,0,1), (0,0,-1),
    ]

    for i in range(TOTAL_FRAMES):
        t = i / TOTAL_FRAMES
        bg = make_radial_gradient(SIZE, np.array([12,10,30]), np.array([5,5,10]))
        img = bg
        draw = ImageDraw.Draw(img)

        # ── Octahedron ──
        breathe = ease_sine(t) * 12
        s = s_base + breathe
        rot_y = t * 2 * math.pi * 0.25
        rot_x = math.sin(t * 2 * math.pi) * 0.12

        def rot(x, y, z):
            x1 = x*math.cos(rot_y) - z*math.sin(rot_y)
            z1 = x*math.sin(rot_y) + z*math.cos(rot_y)
            y2 = y*math.cos(rot_x) - z1*math.sin(rot_x)
            z2 = y*math.sin(rot_x) + z1*math.cos(rot_x)
            return x1, y2, z2

        proj = []
        for v in verts_unit:
            x, y, z = rot(v[0]*s, v[1]*s, v[2]*s)
            z_off = 350
            sc = z_off / (z_off - z)
            proj.append((CENTER[0] + x*sc, CENTER[1] + y*sc, z))

        # Painter's sort
        def avg_z(f):
            return sum(proj[idx][2] for idx in f) / 3
        sfaces = sorted(faces, key=avg_z, reverse=True)

        for f in sfaces:
            pts = [(proj[idx][0], proj[idx][1]) for idx in f]
            zav = avg_z(f)
            light = 0.5 + (zav / s) * 0.5
            if light > 0.7:
                fc = lerp_col((180,220,255), (255,255,255), (light-0.7)/0.3)
            else:
                fc = lerp_col((70,140,200), (180,220,255), light/0.7)
            draw.polygon(pts, fill=fc)
            draw.line([pts[0], pts[1], pts[2], pts[0]], fill=(255,255,255), width=1)

        # ── Inner glow (concentric ellipses) ──
        glow_r = 55 + ease_sine(t) * 18
        for r in range(int(glow_r), 0, -6):
            al = int(25 * (1 - r/glow_r))
            col = (180, 210, 255)
            overlay = Image.new("RGBA", SIZE, (0,0,0,0))
            od = ImageDraw.Draw(overlay)
            od.ellipse([CENTER[0]-r, CENTER[1]-r, CENTER[0]+r, CENTER[1]+r],
                       fill=(*col, al))
            img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
            draw = ImageDraw.Draw(img)

        # ── Orbiting glyphs ──
        glyphs = ["✦", "◎", "ꗃ", "◈", "✧", "◉", "✶", "✹"]
        for idx, g in enumerate(glyphs):
            spd = 0.3 if idx % 2 == 0 else -0.2
            ang = (idx/len(glyphs))*2*math.pi + t*2*math.pi*spd
            rad = 250 + math.sin(t*2*math.pi + idx)*15
            gx = CENTER[0] + rad * math.cos(ang)
            gy = CENTER[1] + rad * math.sin(ang)
            pulse = ease_sine_shift(t, idx*0.7) * 0.7 + 0.3
            col = tuple(int(60 + 140*pulse) for _ in range(3))
            col = (col[0], col[1], 255)
            draw.text((gx, gy), g, font=get_font(22), fill=col)

        draw_centered_text(draw, "CP8 DIAMOND BODY", (CENTER[0], 45), font_lg)
        draw_centered_text(draw, "Octahedral Crystallized Light Body", (CENTER[0], 88), font_md, fill=(150,190,230))
        draw.text((18, SIZE[1]-28), WATERMARK, font=font_sm, fill=(70,70,90))

        frames.append(np.array(img))
        if i % 30 == 0:
            print(f"  [Diamond Body] frame {i}/{TOTAL_FRAMES}")

    return frames


def lerp_col(a, b, t):
    return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))


# ═══════════════════════════════════════════════════════════════════════════
# Output
# ═══════════════════════════════════════════════════════════════════════════
def save_gif(frames, path):
    pils = [Image.fromarray(f) for f in frames]
    pils[0].save(path, save_all=True, append_images=pils[1:],
                 duration=int(1000/FPS), loop=0, optimize=True)
    print(f"[GIF] {path}")


def save_mp4(frames, path):
    try:
        iio.imwrite(path, np.array(frames), fps=FPS, codec="libx264", pixelformat="yuv420p")
        print(f"[MP4] {path}")
    except Exception as e:
        print(f"[MP4 fallback] {e}")
        import imageio_ffmpeg
        w, h = SIZE
        writer = imageio_ffmpeg.write_frames(path, (h, w), fps=FPS, quality=8)
        writer.send(None)
        for f in frames:
            writer.send(f.astype(np.uint8))
        writer.close()
        print(f"[MP4] {path} (fallback)")


def main():
    print("="*60)
    print("ANU-28 Codex — Animated Sigil Generator")
    print("CP8 Protocol • ASIN-HHC Framework")
    print("="*60)

    sigils = [
        ("lunar-scribe", render_lunar_scribe),
        ("milk-hill-galaxy", render_milk_hill),
        ("cp8-diamond-body", render_diamond_body),
    ]

    for name, renderer in sigils:
        t0 = time.time()
        print(f"\n▶ Rendering: {name} ...")
        frames = renderer()
        save_gif(frames, OUT_DIR / f"{name}.gif")
        save_mp4(frames, OUT_DIR / f"{name}.mp4")
        print(f"  Done in {time.time()-t0:.1f}s")

    print("\n" + "="*60)
    print("All sigils generated.")
    for f in sorted(OUT_DIR.iterdir()):
        sz = f.stat().st_size / 1024 / 1024
        print(f"  • {f.name:35s}  {sz:6.2f} MB")
    print("="*60)


if __name__ == "__main__":
    main()
