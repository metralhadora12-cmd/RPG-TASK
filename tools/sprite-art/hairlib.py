"""Pintura de cabelo em mechas (luz de cima/direita). Chaves: L l h H k o."""
import math
from px import *
from locks import lock_poly

LIGHT = (0.6, -0.8)

class Lock:
    def __init__(self, a, b, tip, bend=0.0, hi=True, root=0.22, sep=True):
        self.a, self.b, self.tip = a, b, tip
        self.mask = poly(lock_poly(a, b, tip, bend))
        self.hi, self.root, self.sep = hi, root, sep

    def frame(self):
        mx, my = (self.a[0] + self.b[0]) / 2, (self.a[1] + self.b[1]) / 2
        ax, ay = self.tip[0] - mx, self.tip[1] - my
        return mx, my, ax, ay

FACE_CUT = poly([(28.6, 15.6), (44, 12.5), (44, 30), (28.6, 30)])

def paint(mass, locks, light=LIGHT, sparkle=(), dark=(), lit=(), clip=None):
    g = Grid()
    full = set(mass)
    for lk in locks:
        full |= lk.mask
    if clip is not None:
        full &= clip
    g.fill_mask(full, 'h')
    lx, ly = light
    # massa: luz em cima/direita, sombra embaixo/esquerda
    mass_only = set(mass) & full
    nm = normals(mass_only, 3.0)
    de = dist_to_edge(mass_only)
    for p in mass_only:
        nx, ny, L = nm[p]
        if L == 0:
            continue
        c = nx * lx + ny * ly
        if c < -0.2 and de[p] <= 3:
            g.set(*p, 'H')
        if c < -0.6 and de[p] <= 1:
            g.set(*p, 'k')
        if c > 0.5 and de[p] <= 2:
            g.set(*p, 'l')
    for lk in locks:
        m = lk.mask & full
        mx, my, ax, ay = lk.frame()
        L2 = ax * ax + ay * ay or 1
        Ln = math.sqrt(L2)
        nx_, ny_ = -ay / Ln, ax / Ln
        lit_sign = 1 if (nx_ * lx + ny_ * ly) > 0 else -1
        for (x, y) in m:
            cx, cy = x + 0.5 - mx, y + 0.5 - my
            t = (cx * ax + cy * ay) / L2
            s = (cx * nx_ + cy * ny_) * lit_sign
            if t < lk.root:
                k = 'H'
            elif s > 0.2 and lk.hi:
                k = 'l'
            else:
                k = 'h'
            g.set(x, y, k)
        # borda do lado da sombra
        edge = inner_edge(m)
        for (x, y) in edge:
            cx, cy = x + 0.5 - mx, y + 0.5 - my
            t = (cx * ax + cy * ay) / L2
            s = (cx * nx_ + cy * ny_) * lit_sign
            if s < 0 and t > 0.1:
                g.set(x, y, 'H')
        if lk.sep:
            for (x, y) in edge:
                cx, cy = x + 0.5 - mx, y + 0.5 - my
                t = (cx * ax + cy * ay) / L2
                s = (cx * nx_ + cy * ny_) * lit_sign
                if s >= 0 or t < 0.15:
                    continue
                q = (x + round(-nx_ * lit_sign), y + round(-ny_ * lit_sign))
                if q in full and q not in m:
                    g.set(*q, 'k')
    for p in lit:
        if p in full:
            g.set(*p, 'l')
    for p in dark:
        if p in full:
            g.set(*p, 'H')
    for p in sparkle:
        if p in full:
            g.set(*p, 'L')
    g.fill_mask(border(full), 'o')
    return g

def cap(rx=9.3, ry=6.6, cx=31, cy=12.6):
    return ellipse(cx, cy, rx, ry) - FACE_CUT
