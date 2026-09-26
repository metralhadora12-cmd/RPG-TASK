"""Ferramentas de pixel art em texto: grade de chaves de paleta, formas e render."""
import colorsys, math
from PIL import Image, ImageDraw

W = H = 64

class Grid:
    def __init__(self, w=W, h=H, fill='.'):
        self.w, self.h = w, h
        self.a = [[fill] * w for _ in range(h)]

    @classmethod
    def of(cls, rows, w=W, h=H):
        g = cls(w, h)
        g.stamp(rows, 0, 0)
        return g

    def copy(self):
        g = Grid(self.w, self.h)
        g.a = [r[:] for r in self.a]
        return g

    def inb(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def get(self, x, y):
        return self.a[y][x] if self.inb(x, y) else '.'

    def set(self, x, y, k):
        if self.inb(x, y):
            self.a[y][x] = k

    def rows(self):
        return [''.join(r) for r in self.a]

    def pixels(self, keys=None):
        for y in range(self.h):
            for x in range(self.w):
                k = self.a[y][x]
                if k != '.' and (keys is None or k in keys):
                    yield x, y, k

    def stamp(self, rows, x0=0, y0=0, transparent='.', only_on=None, replace=None):
        """Carimba linhas de texto. `only_on`: só onde a grade já tem uma dessas chaves."""
        for dy, r in enumerate(rows):
            for dx, k in enumerate(r):
                if k == transparent or k == ' ':
                    continue
                x, y = x0 + dx, y0 + dy
                if not self.inb(x, y):
                    continue
                if only_on is not None and self.a[y][x] not in only_on:
                    continue
                if k == '_':  # apaga
                    self.a[y][x] = '.'
                    continue
                self.a[y][x] = replace.get(k, k) if replace else k

    def over(self, other):
        """Desenha outra grade por cima desta."""
        for y in range(min(self.h, other.h)):
            for x in range(min(self.w, other.w)):
                k = other.a[y][x]
                if k != '.':
                    self.a[y][x] = k
        return self

    def fill_mask(self, mask, k, only_on=None):
        for x, y in mask:
            if self.inb(x, y) and (only_on is None or self.a[y][x] in only_on):
                self.a[y][x] = k

    def mask(self, keys=None):
        return {(x, y) for x, y, _ in self.pixels(keys)}

    def replace(self, mapping, region=None):
        for y in range(self.h):
            for x in range(self.w):
                if region is not None and (x, y) not in region:
                    continue
                k = self.a[y][x]
                if k in mapping:
                    self.a[y][x] = mapping[k]

    def shift(self, dx, dy):
        g = Grid(self.w, self.h)
        for x, y, k in self.pixels():
            g.set(x + dx, y + dy, k)
        return g

    def flip(self):
        g = Grid(self.w, self.h)
        for x, y, k in self.pixels():
            g.set(self.w - 1 - x, y, k)
        return g

    def erase(self, mask):
        for x, y in mask:
            self.set(x, y, '.')

    def bbox(self):
        ps = list(self.pixels())
        if not ps:
            return None
        xs = [p[0] for p in ps]; ys = [p[1] for p in ps]
        return min(xs), min(ys), max(xs), max(ys)

# ---------------------------------------------------------------------------
# Formas (máscaras)
# ---------------------------------------------------------------------------

def poly(pts):
    """Máscara de um polígono (amostrando o centro dos pixels)."""
    m = set()
    ys = [p[1] for p in pts]
    for y in range(math.floor(min(ys)) - 1, math.ceil(max(ys)) + 2):
        cy = y + 0.5
        xs = []
        n = len(pts)
        for i in range(n):
            (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
            if (y1 <= cy < y2) or (y2 <= cy < y1):
                xs.append(x1 + (cy - y1) * (x2 - x1) / (y2 - y1))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            a, b = xs[i], xs[i + 1]
            for x in range(math.floor(a) - 1, math.ceil(b) + 1):
                if a <= x + 0.5 < b:
                    m.add((x, y))
    return m

def ellipse(cx, cy, rx, ry):
    m = set()
    for y in range(math.floor(cy - ry) - 1, math.ceil(cy + ry) + 2):
        for x in range(math.floor(cx - rx) - 1, math.ceil(cx + rx) + 2):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1.0:
                m.add((x, y))
    return m

def capsule(p0, p1, r0, r1=None):
    """Segmento grosso (raio r0 em p0 e r1 em p1)."""
    if r1 is None:
        r1 = r0
    (x0, y0), (x1, y1) = p0, p1
    m = set()
    R = max(r0, r1)
    for y in range(math.floor(min(y0, y1) - R) - 1, math.ceil(max(y0, y1) + R) + 2):
        for x in range(math.floor(min(x0, x1) - R) - 1, math.ceil(max(x0, x1) + R) + 2):
            px, py = x + 0.5, y + 0.5
            dx, dy = x1 - x0, y1 - y0
            L2 = dx * dx + dy * dy
            t = 0 if L2 == 0 else max(0, min(1, ((px - x0) * dx + (py - y0) * dy) / L2))
            qx, qy = x0 + t * dx, y0 + t * dy
            r = r0 + (r1 - r0) * t
            if (px - qx) ** 2 + (py - qy) ** 2 <= r * r:
                m.add((x, y))
    return m

def line(p0, p1):
    """Linha de Bresenham (pontos inteiros)."""
    (x0, y0), (x1, y1) = p0, p1
    m = set()
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        m.add((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy; x0 += sx
        if e2 <= dx:
            err += dx; y0 += sy
    return m

def rect(x0, y0, x1, y1):
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}

def border(mask, diag=False):
    """Pixels de fora que encostam na máscara."""
    out = set()
    nb = [(1, 0), (-1, 0), (0, 1), (0, -1)] + ([(1, 1), (1, -1), (-1, 1), (-1, -1)] if diag else [])
    for x, y in mask:
        for dx, dy in nb:
            q = (x + dx, y + dy)
            if q not in mask:
                out.add(q)
    return out

def inner_edge(mask, diag=False):
    """Pixels da máscara que encostam no lado de fora."""
    nb = [(1, 0), (-1, 0), (0, 1), (0, -1)] + ([(1, 1), (1, -1), (-1, 1), (-1, -1)] if diag else [])
    return {(x, y) for x, y in mask if any((x + dx, y + dy) not in mask for dx, dy in nb)}

def erode(mask, n=1):
    for _ in range(n):
        mask = mask - inner_edge(mask)
    return mask

def normals(mask, radius=3.0):
    """Normal 2D aproximada de cada pixel (aponta para fora da forma)."""
    out = {}
    R = int(math.ceil(radius))
    for x, y in mask:
        nx = ny = 0.0
        for dy in range(-R, R + 1):
            for dx in range(-R, R + 1):
                if dx == 0 and dy == 0:
                    continue
                d2 = dx * dx + dy * dy
                if d2 > radius * radius:
                    continue
                if (x + dx, y + dy) not in mask:
                    w = 1.0 / d2
                    nx += dx * w; ny += dy * w
        L = math.hypot(nx, ny)
        out[(x, y)] = (nx / L, ny / L, L) if L > 0 else (0.0, 0.0, 0.0)
    return out

def dist_to_edge(mask):
    """Distância (em passos 4-vizinhos) até o lado de fora."""
    d = {}
    frontier = inner_edge(mask)
    for p in frontier:
        d[p] = 1
    cur = frontier
    k = 1
    while cur:
        k += 1
        nxt = set()
        for x, y in cur:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q in mask and q not in d:
                    d[q] = k
                    nxt.add(q)
        cur = nxt
    return d

def shade(mask, light=(0.55, -0.83), bands=((-0.35, 2, 'S'), (-0.75, 1, 'u')), hi=(0.55, 1, 'l'), radius=3.0):
    """Tons por direção da borda: devolve {pixel: chave} só para os pixels sombreados/iluminados.

    bands: (limiar do cosseno, profundidade máxima, chave) do mais claro ao mais escuro.
    """
    nm = normals(mask, radius)
    de = dist_to_edge(mask)
    lx, ly = light
    res = {}
    for p in mask:
        nx, ny, L = nm[p]
        if L == 0:
            continue
        c = nx * lx + ny * ly
        depth = de[p]
        key = None
        for thr, maxd, k in bands:
            if c <= thr and depth <= maxd:
                key = k
        if key is None and hi and c >= hi[0] and depth <= hi[1]:
            key = hi[2]
        if key:
            res[p] = key
    return res

# ---------------------------------------------------------------------------
# Cores
# ---------------------------------------------------------------------------

def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def rgbhex(c):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in c)

def _hls(h):
    r, g, b = (v / 255 for v in hexrgb(h))
    return colorsys.rgb_to_hls(r, g, b)

def _from_hls(hh, l, s):
    r, g, b = colorsys.hls_to_rgb(hh % 1.0, max(0, min(1, l)), max(0, min(1, s)))
    return rgbhex((r * 255, g * 255, b * 255))

def _toward(hue, target, amt):
    d = ((target - hue + 0.5) % 1.0) - 0.5
    return hue + d * amt

def darker(h, k):
    """Sombra com leve desvio de matiz para o roxo/azul (k de 0 a 1)."""
    hh, l, s = _hls(h)
    hh = _toward(hh, 0.72, 0.12 * k if s > 0.08 else 0)
    return _from_hls(hh, l * (1 - 0.55 * k), min(1, s * (1 + 0.15 * k)) if s > 0.05 else s)

def lighter(h, k):
    """Luz com leve desvio de matiz para o amarelo (k de 0 a 1)."""
    hh, l, s = _hls(h)
    hh = _toward(hh, 0.14, 0.10 * k if s > 0.08 else 0)
    return _from_hls(hh, l + (1 - l) * 0.55 * k, s * (1 - 0.1 * k))

# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

def render(layers, scale=8, bg=(120, 130, 150), size=(W, H)):
    img = Image.new('RGBA', size, bg + (255,))
    px = img.load()
    for rows, pal in layers:
        for y, r in enumerate(rows):
            if y >= size[1]:
                break
            for x, ch in enumerate(r):
                if ch == '.' or x >= size[0]:
                    continue
                col = pal.get(ch)
                if col is None:
                    raise KeyError(f'chave {ch!r} sem cor em ({x},{y})')
                px[x, y] = hexrgb(col) + (255,)
    return img.resize((size[0] * scale, size[1] * scale), Image.NEAREST)

def sheet(images, cols=None, gap=6, bg=(20, 20, 30), labels=None):
    cols = cols or len(images)
    rows = math.ceil(len(images) / cols)
    cw = max(i.width for i in images); ch = max(i.height for i in images)
    lh = 14 if labels else 0
    out = Image.new('RGBA', (cols * cw + (cols - 1) * gap, rows * (ch + lh) + (rows - 1) * gap), bg + (255,))
    d = ImageDraw.Draw(out)
    for i, im in enumerate(images):
        x = (i % cols) * (cw + gap); y = (i // cols) * (ch + lh + gap)
        out.paste(im, (x, y))
        if labels:
            d.text((x + 2, y + ch + 1), labels[i], fill=(230, 230, 230))
    return out
