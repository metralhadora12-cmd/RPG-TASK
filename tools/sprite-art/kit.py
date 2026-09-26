"""Kit comum das roupas: rampas de chaves, preenchimento sombreado, pernas, braços."""
from px import *
from skel import *

SKIN = ('t', 's', 'S', 'u')
CLOTH = ('f', 'c', 'C', 'd')
PANTS = ('q', 'p', 'P', 'Q')
LEATH = ('j', 'b', 'B', 'N')
GOLD = ('g', 'a', 'A', 'z')
METAL = ('w', 'm', 'M', 'n')
SLEEVE = ('y', 'v', 'V', 'Y')

LIGHT = (0.6, -0.8)

def fill(g, mask, ramp, hi=True, deep=True, light=LIGHT, sh_depth=2):
    lite, base, sh, dp = ramp
    g.fill_mask(mask, base)
    bands = ((-0.25, sh_depth, sh),) + (((-0.7, 1, dp),) if deep else ())
    for p, k in shade(mask, light=light, bands=bands, hi=(0.55, 1, lite) if hi else None).items():
        g.set(*p, k)

def outline(g, mask, key='o'):
    g.fill_mask(border(mask) - mask, key)

def put(g, pts, key, within=None):
    for p in pts:
        if within is None or p in within:
            g.set(*p, key)

def keyed(rows, ramp):
    m = {'1': ramp[0], '2': ramp[1], '3': ramp[2], '4': ramp[3]}
    return [''.join(m.get(c, c) for c in r) for r in rows]

def side_plane(g, mask, ramp, x_at_top, x_at_bottom, y0, y1):
    """Plano lateral (lado de perto, à esquerda) um tom abaixo."""
    lite, base, sh, dp = ramp
    for (x, y) in mask:
        if y < y0 or y > y1:
            continue
        xb = x_at_top + (x_at_bottom - x_at_top) * (y - y0) / max(1, y1 - y0)
        if x < xb and g.get(x, y) in (lite, base):
            g.set(x, y, sh)

# ---------------------------------------------------------------------------
# Pernas e botas
# ---------------------------------------------------------------------------

LEG_FAR = capsule((35.4, 41.0), FAR_KNEE, 3.5, 2.9) | capsule(FAR_KNEE, (40.7, 53.0), 2.9, 2.4)
LEG_NEAR = capsule((28.2, 41.0), NEAR_KNEE, 3.6, 3.0) | capsule(NEAR_KNEE, (23.8, 53.5), 3.0, 2.5)

BOOT_FAR = poly([(37.6, 50.6), (44.0, 50.6), (44.2, 54.2), (46.6, 55.2), (48.3, 57.0), (48.3, 59.95), (37.5, 59.95), (37.8, 55.0)])
BOOT_NEAR = poly([(20.2, 51.2), (27.3, 51.2), (27.4, 55.4), (30.2, 56.6), (31.5, 58.4), (31.5, 60.95), (19.9, 60.95), (20.5, 56.0)])

def boots(g, ramp=LEATH, cuff=True, far=BOOT_FAR, near=BOOT_NEAR):
    lite, base, sh, dp = ramp
    for boot in (far, near):
        fill(g, boot, ramp)
        ys = [y for _, y in boot]
        y0, y1 = min(ys), max(ys)
        if cuff:
            for (x, y) in boot:
                if y == y0:
                    g.set(x, y, lite)
                elif y == y0 + 1:
                    g.set(x, y, base)
                elif y == y0 + 2:
                    g.set(x, y, dp)
        for (x, y) in boot:
            if y == y1:
                g.set(x, y, dp)
        # brilho no bico
        xs = [x for (x, y) in boot if y == y1 - 2]
        if xs:
            g.set(max(xs) - 1, y1 - 2, lite)
            g.set(max(xs) - 2, y1 - 2, lite)
        outline(g, boot)

def legs(g, ramp=PANTS):
    for leg in (LEG_FAR, LEG_NEAR):
        fill(g, leg, ramp)
        outline(g, leg)
    # joelho: dobra
    put(g, [(24, 49), (25, 50)], ramp[2], LEG_NEAR)
    put(g, [(39, 48), (40, 49)], ramp[2], LEG_FAR)
