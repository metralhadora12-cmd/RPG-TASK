"""Mechas de cabelo com sombreamento por lado (luz vinda de cima/direita)."""
import math
from px import *

def bez(p0, c, p1, n=10):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]
        pts.append((x, y))
    return pts

def lock_poly(a, b, tip, bend=0.0):
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    ax, ay = tip[0] - mx, tip[1] - my
    L = math.hypot(ax, ay) or 1
    px_, py_ = -ay / L, ax / L
    def ctrl(p):
        return ((p[0] + tip[0]) / 2 + px_ * bend * L * 0.3, (p[1] + tip[1]) / 2 + py_ * bend * L * 0.3)
    return bez(a, ctrl(a), tip) + bez(tip, ctrl(b), b)[1:]

class Lock:
    def __init__(self, a, b, tip, bend=0.0, sep=True):
        self.a, self.b, self.tip = a, b, tip
        self.mask = poly(lock_poly(a, b, tip, bend))
        self.sep = sep  # linha de sombra projetada sobre o que está atrás

def edge_facing(mask, light, radius=2.0):
    """Pixels da borda da máscara classificados: +1 voltado para a luz, -1 contra, 0 neutro."""
    nm = normals(mask, radius)
    res = {}
    for p in inner_edge(mask, diag=False):
        nx, ny, L = nm[p]
        if L == 0:
            continue
        c = nx * light[0] + ny * light[1]
        res[p] = 1 if c > 0.3 else (-1 if c < -0.3 else 0)
    return res

def paint_hair(mass, locks, light=(0.6, -0.8), shadow_line=None, hi_arc=None):
    """Devolve a grade do cabelo (chaves L l h H k o)."""
    g = Grid()
    full = set(mass)
    for lk in locks:
        full |= lk.mask
    g.fill_mask(full, 'h')
    # sombra geral na parte de trás/baixo
    if shadow_line:
        for (x, y) in full:
            if shadow_line(x, y):
                g.set(x, y, 'H')
    # mechas: luz na borda voltada para a luz, sombra na borda oposta
    for lk in locks:
        m = lk.mask
        for (x, y), f in edge_facing(m, light).items():
            if f > 0:
                g.set(x, y, 'l')
            elif f < 0:
                g.set(x, y, 'H')
        if lk.sep:
            # linha de sombra logo fora da borda de sombra (separa da mecha de trás)
            nm = normals(m, 2.0)
            for (x, y) in inner_edge(m):
                nx, ny, L = nm[(x, y)]
                if L == 0 or nx * light[0] + ny * light[1] > -0.2:
                    continue
                q = (x + round(nx), y + round(ny))
                if q in full and q not in m:
                    g.set(q[0], q[1], 'k')
    if hi_arc:
        for (x, y) in hi_arc:
            if (x, y) in full and g.get(x, y) in ('h', 'l'):
                g.set(x, y, 'L')
    g.fill_mask(border(full), 'o')
    return g
