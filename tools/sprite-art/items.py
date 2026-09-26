"""Itens da loja em 3/4 (64×64, alinhados à pose base). Chaves de material como nas roupas."""
import math
from px import *
from kit import fill, outline, put, keyed, CLOTH, GOLD, METAL, LEATH, PANTS, SLEEVE

FIST_NEAR = rect(15, 40, 20, 45)  # área do punho da frente (arma passa por baixo)

def done(g):
    return g

# ---------------------------------------------------------------------------
# Armas (na mão da frente; a camada fica atrás do braço)
# ---------------------------------------------------------------------------

def sword():
    g = Grid()
    blade = poly([(14.6, 46.0), (16.8, 48.0), (6.4, 58.0), (3.2, 59.2), (4.2, 56.2)])
    fill(g, blade, METAL, hi=False, deep=False)
    for (x, y) in blade:
        if x + y >= 63:
            g.set(x, y, 'M')
    put(g, line((14, 47), (6, 55)), 'w', blade)
    put(g, {(4, 58), (5, 57)}, 'w', blade)
    outline(g, blade)
    guard = capsule((12.6, 44.4), (18.2, 49.6), 1.05)
    fill(g, guard, GOLD, hi=False, deep=False)
    put(g, {(x, y) for (x, y) in guard if x + y >= 62}, 'A')
    outline(g, guard)
    grip = capsule((16.4, 45.6), (20.4, 41.4), 0.85)
    g.fill_mask(grip - guard, 'b')
    pom = ellipse(21.3, 40.3, 1.35, 1.35)
    fill(g, pom, GOLD, hi=False, deep=False)
    g.set(21, 39, 'g')
    g.fill_mask(border(grip | pom) - guard - blade - grip - pom, 'o')
    return g

def staff():
    g = Grid()
    shaft = capsule((16.8, 60.4), (17.2, 11.0), 1.0)
    fill(g, shaft, LEATH, hi=False, deep=False)
    put(g, {(x, y) for (x, y) in shaft if x == 17}, 'j')
    outline(g, shaft)
    # cabeça: garra de madeira segurando o cristal
    claw = poly([(13.2, 12.5), (15.0, 9.2), (17.0, 12.2), (19.2, 9.2), (21.0, 12.5), (19.0, 15.4), (15.2, 15.4)])
    fill(g, claw, LEATH, hi=False)
    outline(g, claw)
    gem = poly([(17.1, 2.6), (20.2, 6.8), (17.1, 12.2), (14.0, 6.8)])
    fill(g, gem, CLOTH, hi=True)
    put(g, {(16, 5), (16, 6), (17, 4)}, 'w', gem)
    put(g, {(x, y) for (x, y) in gem if x >= 18 and y >= 7}, 'C')
    outline(g, gem)
    return g

def axe():
    g = Grid()
    handle = capsule((20.6, 48.6), (8.6, 21.2), 1.0)
    fill(g, handle, LEATH, hi=False, deep=False)
    outline(g, handle)
    head = poly([(10.6, 22.2), (4.4, 16.0), (2.2, 20.8), (2.4, 27.8), (5.0, 32.2), (11.8, 27.4)])
    fill(g, head, METAL)
    put(g, {(x, y) for (x, y) in head if x <= 4}, 'w', head)
    put(g, {(x, y) for (x, y) in head if x >= 9}, 'M', head)
    outline(g, head)
    back = poly([(10.0, 21.2), (14.6, 19.6), (13.2, 25.4), (11.2, 25.8)])
    fill(g, back, METAL, hi=False)
    outline(g, back)
    cap = ellipse(8.4, 20.6, 1.3, 1.3)
    fill(g, cap, GOLD, hi=False, deep=False)
    outline(g, cap)
    return g

def bow():
    g = Grid()
    limb = set()
    for i in range(0, 41):
        t = i / 40
        y = 25 + 34 * t
        x = 17.5 - 5.6 * (2 * t - 1) ** 2
        limb |= ellipse(x, y, 1.0, 1.0)
    fill(g, limb, LEATH, hi=False, deep=False)
    put(g, {(x, y) for (x, y) in limb if x == min(xx for (xx, yy) in limb if yy == y)}, 'j')
    outline(g, limb)
    for y in range(26, 59):
        if g.get(12, y) in ('.', 'o'):
            g.set(12, y, 'w')
    g.stamp(keyed(["1", "2", "3"], GOLD), 17, 38)
    return g

# ---------------------------------------------------------------------------
# Chapéus
# ---------------------------------------------------------------------------

def wizard():
    g = Grid()
    brim = ellipse(31.6, 10.6, 14.2, 3.2)
    cone = poly([(22.8, 10.8), (25.4, 5.6), (28.0, 1.8), (24.6, 0.6), (19.6, 1.4), (15.8, 3.6), (18.2, 0.2), (24.0, -1.8),
                 (31.4, -1.6), (36.4, 2.6), (38.8, 6.4), (41.0, 10.6)])
    g.fill_mask(cone, 'c')
    for (x, y) in cone:
        if x <= 27 and y >= 2:
            g.set(x, y, 'C')
        if x <= 23:
            g.set(x, y, 'C')
        if x >= 35 and 2 <= y <= 6:
            g.set(x, y, 'f')
    put(g, line((29, 0), (35, 5)), 'f', cone)
    band = {(x, y) for (x, y) in cone if 7 <= y <= 8}
    g.fill_mask(band, 'a')
    put(g, {(x, 8) for x in range(20, 44)} & cone, 'A')
    outline(g, cone)
    g.fill_mask(brim, 'c')
    for (x, y) in brim:
        if y >= 11:
            g.set(x, y, 'C')
        if y >= 12:
            g.set(x, y, 'd')
        if y <= 8 and x >= 34:
            g.set(x, y, 'f')
    outline(g, brim)
    g.stamp(keyed(["11", "23"], GOLD), 31, 7)
    return g

def helmet():
    g = Grid()
    dome = ellipse(31.2, 12.8, 9.8, 8.4) - poly([(29.2, 16.2), (45, 14.8), (45, 30), (29.2, 30)])
    cheek = poly([(22.6, 14.0), (29.4, 15.6), (29.6, 23.6), (26.6, 24.8), (23.2, 21.4)])
    shape = dome | cheek
    g.fill_mask(shape, 'm')
    for (x, y) in shape:
        dx, dy = x + 0.5 - 31.2, y + 0.5 - 12.8
        v = dx * 0.6 - dy * 0.8
        if v < -3.2:
            g.set(x, y, 'M')
        if v < -6.6:
            g.set(x, y, 'n')
    put(g, arc_pts(31.6, 12.2, 6.0, 5.0, 225, 300), 'w', shape)
    put(g, {(34, 7), (35, 8)}, 'w', shape)
    # faixa da testa com rebites
    put(g, {(x, y) for (x, y) in shape if 14 <= y <= 15 and x >= 23}, 'a')
    put(g, {(x, 15) for x in range(23, 42)} & shape, 'A')
    put(g, {(25, 14), (30, 14), (35, 14), (39, 14)}, 'g', shape)
    put(g, {(26, 18), (26, 21), (28, 22)}, 'n', shape)
    outline(g, shape)
    # crista (aleta)
    crest = poly([(22.4, 8.6), (26.0, 3.6), (32.0, 1.6), (37.6, 2.8), (38.0, 4.8), (31.6, 4.2), (26.8, 6.6), (24.4, 10.0)])
    g.fill_mask(crest, 'a')
    put(g, {(x, y) for (x, y) in crest if y <= 3 or x >= 36}, 'g')
    put(g, {(x, y) for (x, y) in crest if x <= 24}, 'A')
    outline(g, crest)
    return g

def arc_pts(cx, cy, rx, ry, a0, a1, n=40):
    pts = set()
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        pts.add((math.floor(cx + rx * math.cos(a)), math.floor(cy + ry * math.sin(a))))
    return pts

def crown():
    g = Grid()
    base = poly([(24.8, 6.8), (38.6, 7.6), (38.4, 10.4), (25.0, 9.8)])
    pts = poly([(24.8, 7.0), (24.6, 2.8), (27.4, 5.2), (30.2, 1.6), (32.6, 5.4), (35.4, 2.2), (37.0, 5.8), (38.8, 3.2), (38.6, 7.8)])
    shape = base | pts
    fill(g, shape, GOLD)
    put(g, {(x, y) for (x, y) in shape if x <= 27}, 'A')
    outline(g, shape)
    for (x, y) in ((28, 8), (33, 8), (37, 8)):
        g.set(x, y, 'c')
    g.set(30, 3, 'g'); g.set(35, 4, 'g')
    return g

def bandana():
    g = Grid()
    band = poly([(22.4, 10.4), (30.0, 8.6), (40.8, 10.0), (40.8, 13.0), (30.0, 11.8), (22.6, 13.8)])
    fill(g, band, CLOTH)
    outline(g, band)
    knot = ellipse(21.8, 12.2, 1.8, 1.8)
    fill(g, knot, CLOTH, hi=False)
    tails = poly([(21.2, 12.0), (14.2, 15.2), (15.6, 16.6), (20.4, 14.2), (16.0, 19.4), (17.8, 20.2), (22.0, 14.2)])
    fill(g, tails, CLOTH, hi=False)
    outline(g, knot | tails)
    for (x, y) in ((28, 10), (34, 10), (38, 11)):
        g.set(x, y, 'a')
    return g

def hood():
    g = Grid()
    outer = ellipse(30.6, 14.0, 10.8, 10.4) | poly([(19.8, 16), (24.0, 30.4), (34.0, 31.0), (40.4, 28.0), (41.6, 18)])
    opening = poly([(28.2, 14.4), (40.4, 13.0), (41.8, 20.0), (38.4, 26.6), (33.6, 28.0), (29.0, 25.4), (27.6, 19.0)])
    shape = outer - opening
    fill(g, shape, CLOTH)
    put(g, {(x, y) for (x, y) in shape if x <= 24}, 'C')
    # sombra interna do capuz na testa
    inner = border(opening) & shape
    put(g, inner, 'd')
    outline(g, shape)
    # ponta do capuz para trás
    tip = poly([(20.4, 9.4), (15.0, 13.6), (13.6, 19.2), (19.6, 16.4)])
    fill(g, tip, CLOTH)
    outline(g, tip)
    return g

def straw():
    g = Grid()
    brim = ellipse(31.2, 10.8, 13.4, 3.4)
    dome = ellipse(31.0, 6.8, 7.2, 5.0) & {(x, y) for x in range(0, 64) for y in range(0, 11)}
    fill(g, brim, CLOTH)
    put(g, {(x, y) for (x, y) in brim if y >= 12}, 'C')
    put(g, {(x, 13) for x in range(20, 44)} & brim, 'd')
    outline(g, brim)
    fill(g, dome, CLOTH)
    put(g, {(x, y) for (x, y) in dome if 8 <= y <= 9}, 'a')
    outline(g, dome)
    # trama da palha
    for (x, y) in ((27, 5), (31, 4), (34, 6), (21, 11), (25, 12), (36, 12), (40, 11)):
        if g.get(x, y) in ('c', 'f'):
            g.set(x, y, 'C')
    return g

def wreath():
    g = Grid()
    ring = set()
    for (x, y) in arc_pts(31.0, 11.2, 9.4, 2.6, 150, 390, 60):
        ring |= ellipse(x + 0.5, y + 0.5, 1.4, 1.2)
    fill(g, ring, CLOTH, hi=True)
    outline(g, ring)
    for (x, y) in ((24, 10), (29, 9), (35, 10), (39, 12)):
        g.stamp(keyed([".1.", "121", ".1."], GOLD), x - 1, y - 1)
    return g

# ---------------------------------------------------------------------------
# Acessórios
# ---------------------------------------------------------------------------

def glasses():
    g = Grid()
    g.stamp([
        ".ooooo..oooo.",
        "oWWW.WoooWW.o",
        "oW.....oW...o",
        ".ooooo..oooo.",
    ], 28, 16)
    g.stamp(["ooo"], 25, 17)
    return g

def scarf():
    g = Grid()
    wrap = poly([(27.6, 25.4), (35.8, 25.0), (36.8, 28.2), (33.0, 30.2), (27.4, 29.4)])
    fill(g, wrap, CLOTH)
    tail = poly([(27.8, 26.0), (22.0, 27.4), (15.2, 31.8), (16.6, 34.6), (21.8, 31.4), (28.2, 29.6)])
    fill(g, tail, CLOTH, hi=False)
    put(g, {(x, 28) for x in range(26, 37)} & wrap, 'C')
    outline(g, wrap | tail)
    for (x, y) in ((17, 32), (19, 31), (21, 30)):
        g.set(x, y, 'a')
    return g

def cape():
    g = Grid()
    shape = poly([(24.6, 28.4), (38.0, 28.6), (40.6, 31.4), (42.8, 45.0), (44.0, 55.8), (37.0, 54.2),
                  (24.0, 57.6), (15.0, 58.8), (7.6, 57.4), (11.6, 47.0), (16.6, 36.0), (20.0, 30.6)])
    g.fill_mask(shape, 'c')
    for (x, y) in shape:
        if x <= 16 or (x <= 20 and y <= 40):
            g.set(x, y, 'C')
        if x + (58 - y) * 0.2 <= 11:
            g.set(x, y, 'd')
    for (x0, y0, x1, y1) in [(19, 34, 12, 56), (22, 38, 18, 57), (16, 44, 9, 55)]:
        put(g, line((x0, y0), (x1, y1)), 'd', shape)
    for (x0, y0, x1, y1) in [(21, 36, 15, 56), (24, 40, 21, 56)]:
        put(g, line((x0, y0), (x1, y1)), 'f', shape)
    ys = {}
    for (x, y) in shape:
        ys[x] = max(ys.get(x, 0), y)
    put(g, {(x, y) for x, y in ys.items()}, 'a')
    outline(g, shape)
    return g

def cape_front():
    """Gola/fecho da capa, por cima do ombro da frente."""
    g = Grid()
    col = poly([(22.2, 29.6), (26.6, 27.4), (29.6, 27.6), (27.6, 30.6), (24.2, 32.6)])
    g.fill_mask(col, 'c')
    put(g, {(x, y) for (x, y) in col if x <= 24}, 'C')
    outline(g, col)
    clasp = ellipse(29.6, 28.6, 1.5, 1.5)
    fill(g, clasp, GOLD, hi=False, deep=False)
    g.set(29, 28, 'g')
    outline(g, clasp)
    return g

def amulet():
    g = Grid()
    chain = arc_pts(32.0, 26.6, 3.6, 4.6, 20, 160)
    put(g, chain, 'a')
    gem = poly([(33.2, 30.4), (35.2, 32.2), (33.2, 34.6), (31.2, 32.2)])
    fill(g, gem, CLOTH, hi=True)
    g.set(32, 31, 'w')
    outline(g, gem)
    return g

def wings():
    g = Grid()
    near = poly([(24.6, 33.0), (19.0, 25.6), (12.0, 20.6), (4.6, 18.6), (6.8, 23.0), (2.6, 25.8), (7.4, 29.6),
                 (3.4, 32.8), (9.4, 35.8), (6.8, 39.2), (13.6, 41.2), (19.6, 39.6), (24.0, 37.0)])
    far = poly([(37.4, 30.2), (41.2, 23.4), (46.2, 17.6), (51.4, 15.4), (49.6, 20.2), (53.4, 21.0), (49.4, 25.8),
                (51.4, 27.8), (45.4, 31.8), (40.2, 33.8)])
    for w, is_far in ((far, True), (near, False)):
        g.fill_mask(w, 'w')
        # fileiras de penas: sombra na base de cada fileira
        for (x, y) in w:
            if is_far:
                continue
            if (y - 20) % 5 == 4 and x < 22:
                g.set(x, y, 'c')
        put(g, {(x, y) for (x, y) in w if (x, y + 1) not in w}, 'c')
        put(g, {(x, y) for (x, y) in w if (x + 1, y) not in w and x > 20}, 'c')
        if is_far:
            g.fill_mask({(x, y) for (x, y) in w if x <= 43}, 'c')
        outline(g, w)
    return g

# ---------------------------------------------------------------------------
# Mascotes (fixos no canto inferior direito, virados para a direita)
# ---------------------------------------------------------------------------

def slime():
    g = Grid()
    body = poly([(49.6, 62.0), (50.2, 57.0), (53.6, 52.6), (57.4, 51.4), (60.4, 54.2), (62.4, 58.6), (62.4, 62.0)])
    fill(g, body, CLOTH)
    put(g, {(x, 61) for x in range(50, 63)} & body, 'C')
    g.stamp(["ww", "w."], 54, 54)
    g.stamp(["e.e", "e.e"], 57, 56)
    outline(g, body)
    return g

def chick():
    g = Grid()
    body = ellipse(56.0, 57.6, 5.0, 4.2)
    head = ellipse(58.6, 53.0, 3.2, 3.0)
    fill(g, body | head, CLOTH)
    wing = ellipse(54.4, 57.8, 2.2, 1.6)
    fill(g, wing, CLOTH, hi=False)
    outline(g, body | head)
    g.stamp(["aa", "a."], 61, 53)
    g.set(59, 52, 'e')
    g.stamp(["a.a"], 54, 62)
    return g

def cat():
    g = Grid()
    body = ellipse(55.0, 58.8, 5.4, 3.4)
    head = ellipse(58.6, 53.6, 3.6, 3.2)
    ears = poly([(55.6, 52.0), (56.2, 48.8), (58.0, 51.0)]) | poly([(59.6, 50.8), (61.4, 48.6), (61.8, 52.0)])
    tail = capsule((50.0, 58.0), (48.6, 51.8), 0.9)
    fill(g, body | head | ears | tail, CLOTH)
    outline(g, body | head | ears | tail)
    g.set(57, 53, 'e'); g.set(60, 53, 'e')
    g.set(59, 55, 'a')
    g.set(56, 50, 'a'); g.set(61, 50, 'a')
    return g

def ghost():
    g = Grid()
    body = poly([(50.4, 60.4), (50.6, 53.4), (53.6, 49.6), (58.6, 49.4), (61.8, 52.6), (62.2, 61.8), (60.0, 59.6),
                 (57.8, 61.8), (55.6, 59.6), (53.2, 61.8)])
    fill(g, body, CLOTH)
    outline(g, body)
    g.stamp(["e..e", "e..e"], 55, 53)
    g.stamp(["aa..aa"], 54, 56)
    g.stamp(["ww", "w."], 52, 51)
    return g

def dragon():
    g = Grid()
    body = ellipse(55.2, 58.4, 4.6, 3.6)
    head = ellipse(59.4, 52.6, 3.4, 3.0) | poly([(60.6, 51.4), (63.6, 52.6), (63.4, 55.0), (60.4, 55.0)])
    tail = capsule((50.8, 59.6), (48.2, 54.8), 1.0, 0.6)
    wing = poly([(53.6, 55.6), (51.0, 49.6), (55.2, 51.6), (57.2, 55.6)])
    horn = poly([(57.2, 50.4), (56.0, 47.2), (58.8, 49.6)])
    fill(g, wing, CLOTH, hi=False)
    outline(g, wing)
    fill(g, body | head | tail, CLOTH)
    put(g, {(x, y) for (x, y) in body if y >= 60}, 'a')
    fill(g, horn, GOLD, hi=False, deep=False)
    outline(g, body | head | tail | horn)
    g.set(60, 52, 'e')
    g.stamp(["a.a"], 53, 62)
    return g

def mustache():
    g = Grid()
    g.stamp([
        "..HHHHH.",
        ".HHHHHHH",
        "HH....HH",
    ], 31, 22)
    return g

HATS = {'hatWizard': wizard, 'hatHelmet': helmet, 'hatCrown': crown, 'hatBandana': bandana, 'hatHood': hood,
        'hatStraw': straw, 'hatWreath': wreath}
WEAPONS = {'wpnSword': sword, 'wpnStaff': staff, 'wpnAxe': axe, 'wpnBow': bow}
ACCS = {'accCape': cape, 'accScarf': scarf, 'accGlasses': glasses, 'accAmulet': amulet, 'accWings': wings}
PETS = {'petSlime': slime, 'petCat': cat, 'petChick': chick, 'petDragon': dragon, 'petGhost': ghost}
