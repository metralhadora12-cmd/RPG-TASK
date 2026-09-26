"""Braços: da frente (segura a arma) e de trás (guarda / punho erguido na vitória)."""
import math
from px import *
from kit import *

NEAR = dict(shoulder=(24.6, 30.4), elbow=(21.2, 36.4), wrist=(18.8, 40.6))
FAR = {
    'idle': dict(shoulder=(39.2, 30.6), elbow=(42.4, 35.6), wrist=(45.4, 38.4)),
    'victory': dict(shoulder=(39.0, 30.2), elbow=(42.8, 24.6), wrist=(44.8, 18.4)),
}

FISTS = {
    'near': ([
        ".oooo.",
        "o1122o",
        "o2223o",
        "o2323o",
        "o3334o",
        ".oooo.",
    ], (15, 40)),
    'far': ([
        ".ooo.",
        "o1123o",
        "o2223o",
        "o2334o",
        ".oooo.",
    ], (44, 37)),
    'up': ([
        ".oooo.",
        "o1122o",
        "o2323o",
        "o2233o",
        ".o334o",
        "..ooo.",
    ], (42, 12)),
}

def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

def band(p0, p1, t0, t1, r):
    """Faixa perpendicular ao segmento p0→p1 entre as frações t0..t1."""
    return capsule(lerp(p0, p1, t0), lerp(p0, p1, t1), r)

def build_arm(which, pose, style, pal_keys):
    """style: 'short' | 'long' | 'armor' | 'shirt'."""
    J = NEAR if which == 'near' else FAR[pose]
    sh, el, wr = J['shoulder'], J['elbow'], J['wrist']
    fist_rows, fist_at = FISTS['near' if which == 'near' else ('far' if pose == 'idle' else 'up')]
    g = Grid()
    sleeve, trim, hand, cuff = pal_keys['sleeve'], pal_keys['trim'], pal_keys['hand'], pal_keys.get('cuff')
    upper = capsule(sh, el, 3.1, 2.7)
    fore = capsule(el, wr, 2.3, 2.0)
    if style == 'short':
        fill(g, fore, SKIN); outline(g, fore)
        if cuff:
            c = band(el, wr, 0.62, 1.0, 2.35)
            fill(g, c, cuff, hi=False); outline(g, c)
        up = capsule(sh, lerp(sh, el, 0.8), 3.2, 2.8)
        fill(g, up, sleeve); outline(g, up)
        end = lerp(sh, el, 0.8)
        rim = {p for p in up if (p[0] + 0.5 - end[0]) ** 2 + (p[1] + 0.5 - end[1]) ** 2 <= 3.3 ** 2
               and (p[0] + 0.5 - end[0]) ** 2 + (p[1] + 0.5 - end[1]) ** 2 > 1.9 ** 2 and ((p[0] - sh[0]) * (el[0] - sh[0]) + (p[1] - sh[1]) * (el[1] - sh[1])) > 0}
        rim = {p for p in rim if all(q in up for q in [(p[0], p[1] - 1)]) or True}
        edge = {p for p in up if ((p[0] + 0.5 - sh[0]) * (el[0] - sh[0]) + (p[1] + 0.5 - sh[1]) * (el[1] - sh[1])) / ((el[0] - sh[0]) ** 2 + (el[1] - sh[1]) ** 2) > 0.62}
        g.fill_mask(edge, trim[2])
        g.fill_mask({p for p in edge if ((p[0] + 0.5 - sh[0]) * (el[0] - sh[0]) + (p[1] + 0.5 - sh[1]) * (el[1] - sh[1])) / ((el[0] - sh[0]) ** 2 + (el[1] - sh[1]) ** 2) > 0.72}, trim[1])
    elif style == 'long':
        fill(g, upper, sleeve); outline(g, upper)
        # manga larga que abre no punho
        wide = capsule(el, lerp(el, wr, 0.9), 2.6, 3.2)
        fill(g, wide, sleeve); outline(g, wide)
        t = band(el, wr, 0.72, 0.92, 3.3) & wide
        g.fill_mask(t, trim[1])
    elif style == 'armor':
        fill(g, fore, cuff or sleeve); outline(g, fore)
        fill(g, upper, pal_keys.get('under', PANTS)); outline(g, upper)
        # manopla
        gaunt = band(el, wr, 0.45, 1.0, 2.6)
        fill(g, gaunt, METAL); outline(g, gaunt)
        # ombreira
        pcx, pcy = sh[0] + (0.8 if which == 'far' else -0.6), sh[1] - 0.6
        pad = ellipse(pcx, pcy, 4.2, 3.4)
        g.fill_mask(pad, 'm')
        for (x, y) in pad:
            dx, dy = x + 0.5 - pcx, y + 0.5 - pcy
            if dx * 0.6 - dy * 0.8 > 2.0:
                g.set(x, y, 'w')
            elif dx * 0.6 - dy * 0.8 < -1.4:
                g.set(x, y, 'M')
        rim = {(x, y) for (x, y) in pad if y == max(yy for (xx, yy) in pad if xx == x)}
        g.fill_mask(rim, trim[1])
        g.fill_mask({(x, y - 1) for (x, y) in rim if (x, y - 1) in pad}, 'n')
        outline(g, pad)
    elif style == 'shirt':
        fill(g, fore, SKIN); outline(g, fore)
        if cuff:
            c = band(el, wr, 0.55, 1.0, 2.35)
            fill(g, c, cuff, hi=False); outline(g, c)
        up = capsule(sh, lerp(sh, el, 1.0), 2.8, 2.5)
        fill(g, up, sleeve); outline(g, up)
        roll = band(sh, el, 0.82, 1.0, 2.6) & up
        g.fill_mask(roll, sleeve[2])
        g.fill_mask(band(sh, el, 0.9, 1.0, 2.6) & up, sleeve[1])
    g.stamp(keyed(fist_rows, hand), *fist_at)
    return g
