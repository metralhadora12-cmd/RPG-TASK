"""As 4 roupas: túnica, manto, armadura, colete (tronco + pernas; braços em arms.py)."""
from px import *
from kit import *
from arms import build_arm

TORSO = poly([(23.4, 30.6), (25.5, 28.8), (29, 27.4), (34.2, 27.4), (37.6, 28.6), (40.2, 30.6), (40.6, 33.2),
              (39.6, 36.2), (38.8, 38.2), (24.4, 38.2), (23.4, 35.4), (23.0, 32.6)])

def collar_v(g, within, trim):
    col = poly([(29.4, 27.2), (34.4, 27.2), (32.2, 31.8)])
    fill(g, col, SKIN, hi=False, deep=False)
    put(g, [(x, y) for (x, y) in col if y <= 28], 'S')
    put(g, border(col) & within, trim[1])

def belt(g, within, ramp=LEATH, buckle=GOLD, y=37.8):
    b = poly([(23.6, y), (33.5, y + 0.8), (39.8, y - 0.2), (40.0, y + 2.0), (33.5, y + 3.0), (23.8, y + 2.4)])
    b &= within
    fill(g, b, ramp, hi=False)
    for x in {x for x, _ in b}:
        top = min(yy for (xx, yy) in b if xx == x)
        g.set(x, top, ramp[0])
    g.stamp(keyed(["4444", "4124", "4234", "4444"], buckle), 32, int(y) - 0)

def tunic():
    g = Grid()
    legs(g)
    boots(g)
    skirt = poly([(24.2, 37.6), (39.2, 37.6), (40.0, 40.5), (41.4, 45.2), (36, 46.0), (30, 46.3), (22.4, 45.4), (23.8, 40.5)])
    body = TORSO | skirt
    fill(g, body, CLOTH)
    side_plane(g, body, CLOTH, 27.6, 26.6, 28, 46)
    put(g, poly([(35, 29), (39.2, 30.2), (39.4, 32.6), (36, 32)]), 'f', body)
    put(g, [(x, 35) for x in range(29, 39)] + [(x, 34) for x in range(36, 39)], 'C', body)
    for x0 in (30, 36):
        put(g, [(x0 + (1 if y > 43 else 0), y) for y in range(41, 46)], 'C', body)
    hem = {(x, max(y for (xx, y) in body if xx == x)) for x in {x for x, _ in body}}
    put(g, hem, 'a')
    put(g, {(x, y - 1) for (x, y) in hem}, 'A', body)
    collar_v(g, body, GOLD)
    belt(g, body)
    outline(g, body)
    keys = dict(sleeve=CLOTH, trim=GOLD, hand=LEATH, cuff=LEATH)
    return g, keys, 'short'

def robe():
    g = Grid()
    # manto até os tornozelos, abrindo embaixo; botas aparecem na barra
    boots(g, cuff=False,
          far=poly([(39.5, 56.0), (44.4, 56.0), (47.0, 56.8), (48.3, 58.0), (48.3, 59.95), (39.3, 59.95)]),
          near=poly([(22.0, 56.8), (27.5, 56.8), (30.4, 57.6), (31.5, 58.9), (31.5, 60.95), (21.8, 60.95)]))
    body = poly([(23.4, 30.6), (25.5, 28.8), (29, 27.4), (34.2, 27.4), (37.6, 28.6), (40.2, 30.6), (40.6, 33.2),
                 (39.6, 36.2), (39.4, 39.0), (41.4, 47.0), (44.2, 57.2), (37.0, 58.6), (30.0, 58.4), (19.4, 58.0),
                 (21.6, 47.0), (24.0, 39.0), (23.4, 35.4), (23.0, 32.6)])
    fill(g, body, CLOTH)
    side_plane(g, body, CLOTH, 27.4, 25.0, 28, 58)
    put(g, poly([(35, 29), (39.2, 30.2), (39.4, 32.6), (36, 32)]), 'f', body)
    # dobras verticais
    for (x0, y0, x1, y1) in [(30, 42, 29, 57), (35, 43, 36, 57), (39, 46, 41, 56), (26, 47, 24, 57)]:
        put(g, line((x0, y0), (x1, y1)), 'C', body)
    for (x0, y0, x1, y1) in [(31, 44, 31, 56), (36, 45, 37, 55)]:
        put(g, line((x0, y0), (x1, y1)), 'f', body)
    # barra e faixa da frente
    hem = {(x, max(y for (xx, y) in body if xx == x)) for x in {x for x, _ in body}}
    put(g, hem, 'a')
    put(g, {(x, y - 1) for (x, y) in hem}, 'A', body)
    front = poly([(32.2, 38), (35.0, 38), (36.6, 58.4), (33.0, 58.4)])
    put(g, front & body, 'a')
    put(g, {(x, y) for (x, y) in front & body if x == min(xx for (xx, yy) in front & body if yy == y)}, 'A')
    # gola alta
    col = poly([(28.8, 26.8), (35.0, 26.8), (35.6, 29.6), (32.2, 31.4), (28.4, 29.6)])
    fill(g, col, GOLD, deep=False)
    put(g, [(x, 29) for x in range(30, 35)], 'z', col)
    belt(g, body, ramp=GOLD, buckle=CLOTH, y=37.4)
    outline(g, body)
    keys = dict(sleeve=CLOTH, trim=GOLD, hand=SKIN)
    return g, keys, 'long'

def armor():
    g = Grid()
    legs(g, PANTS)
    # grevas e escarpes de metal, com joelheira
    greave_far = poly([(37.8, 49.6), (43.6, 49.6), (44.0, 54.0), (46.8, 55.0), (48.3, 57.0), (48.3, 59.95), (37.5, 59.95), (37.9, 54.0)])
    greave_near = poly([(20.4, 50.2), (27.0, 50.2), (27.4, 55.2), (30.2, 56.4), (31.5, 58.3), (31.5, 60.95), (19.9, 60.95), (20.6, 55.0)])
    for gr in (greave_far, greave_near):
        g.fill_mask(gr, 'm')
        xs = sorted({x for x, _ in gr}); ys = sorted({y for _, y in gr})
        x0 = min(xs)
        for (x, y) in gr:
            row = sorted(xx for (xx, yy) in gr if yy == y)
            if x <= row[0] + 1:
                g.set(x, y, 'M')
            if x == row[0]:
                g.set(x, y, 'n')
            if y == ys[-1]:
                g.set(x, y, 'n')
        # brilho vertical na canela e no peito do pé
        top = ys[0]
        cx = x0 + 4
        for y in range(top + 1, top + 6):
            g.set(cx, y, 'w')
        foot_y = ys[-1] - 2
        row = sorted(xx for (xx, yy) in gr if yy == foot_y)
        g.set(row[-2], foot_y, 'w'); g.set(row[-3], foot_y, 'w')
        # junta do tornozelo
        put(g, [(x, top + 6) for x in xs], 'M', gr)
        put(g, [(x, top) for x in xs], 'a', gr)
        outline(g, gr)
    for (cx, cy) in ((39.9, 48.8), (24.9, 49.4)):
        cop = ellipse(cx, cy, 2.6, 2.0)
        g.fill_mask(cop, 'm')
        g.set(int(cx), int(cy) - 1, 'w'); g.set(int(cx) + 1, int(cy) - 1, 'w')
        put(g, {(x, y) for (x, y) in cop if y == max(yy for (xx, yy) in cop if xx == x)}, 'M')
        outline(g, cop)
    # peitoral: planos, crista central, brilho especular
    chest = TORSO | poly([(24.2, 37.6), (39.0, 37.6), (39.6, 40.2), (24.0, 40.2)])
    g.fill_mask(chest, 'm')
    for (x, y) in chest:
        row = sorted(xx for (xx, yy) in chest if yy == y)
        if x < 28:
            g.set(x, y, 'M')
        if x == row[0]:
            g.set(x, y, 'n')
        if y >= 35:
            g.set(x, y, 'M' if x < 36 else 'm')
    put(g, [(32, y) for y in range(29, 37)], 'M', chest)
    put(g, [(33, y) for y in range(29, 35)], 'w', chest)
    put(g, poly([(35.2, 29.2), (39.4, 30.4), (39.4, 33.2), (36.2, 32.6)]), 'w', chest)
    put(g, [(x, 34) for x in range(28, 32)] + [(x, 34) for x in range(34, 39)], 'M', chest)
    put(g, [(39, 35), (39, 36)], 'w', chest)
    # debrum dourado no decote e na base
    for x in range(26, 38):
        col = [yy for (xx, yy) in chest if xx == x]
        if col:
            g.set(x, min(col), 'a')
    put(g, [(x, 37) for x in range(24, 40)], 'A', chest)
    g.stamp(keyed([".1.", "123", ".3."], GOLD), 32, 30)
    # tassets: 3 placas com rebite
    tas = poly([(23.4, 40.0), (40.2, 40.0), (41.4, 45.6), (22.2, 45.6)])
    g.fill_mask(tas, 'm')
    for (x, y) in tas:
        if y == 41:
            g.set(x, y, 'w')
        if y >= 44:
            g.set(x, y, 'M')
        if x < 26:
            g.set(x, y, 'M')
    for x0 in (28, 34):
        put(g, [(x0 + (1 if y >= 43 else 0), y) for y in range(40, 46)], 'n', tas)
    for (x, y) in ((25, 42), (31, 42), (37, 42)):
        g.set(x, y, 'a')
    put(g, [(x, 45) for x in range(21, 43)], 'n', tas)
    outline(g, tas)
    belt(g, chest, LEATH, GOLD, y=37.6)
    collar = poly([(28.6, 26.6), (35.2, 26.6), (35.6, 28.8), (28.2, 28.8)])
    g.fill_mask(collar, 'M')
    put(g, [(x, 27) for x in range(30, 35)], 'm', collar)
    g.set(33, 27, 'w')
    outline(g, chest)
    keys = dict(sleeve=PANTS, trim=GOLD, hand=METAL, cuff=PANTS, under=PANTS)
    return g, keys, 'armor'

def vest():
    g = Grid()
    legs(g)
    boots(g)
    shirt = TORSO | poly([(24.2, 37.6), (39.0, 37.6), (39.6, 41.6), (24.0, 41.6)])
    fill(g, shirt, SLEEVE)
    side_plane(g, shirt, SLEEVE, 27.6, 27.0, 28, 42)
    # colete aberto (duas bandas)
    vl = poly([(23.4, 30.6), (25.5, 28.8), (29.2, 27.6), (31.0, 32.0), (31.6, 43.2), (23.2, 43.4), (24.2, 38), (23.4, 35.4), (23.0, 32.6)])
    vr = poly([(34.6, 27.6), (37.6, 28.6), (40.2, 30.6), (40.6, 33.2), (39.6, 36.2), (39.2, 38.0), (40.4, 43.2), (36.0, 43.4), (35.2, 33.0)])
    for v in (vl, vr):
        fill(g, v, CLOTH)
    side_plane(g, vl, CLOTH, 27.4, 26.6, 28, 44)
    put(g, poly([(36, 29.6), (39.2, 30.8), (39.2, 33), (37, 32.6)]), 'f', vr)
    for v in (vl, vr):
        edge = {(x, y) for (x, y) in v if (x + 1, y) not in v and x > 30} | {(x, y) for (x, y) in v if (x - 1, y) not in v and x > 30}
        put(g, edge, 'a')
        outline(g, v)
    # laço da gola da camisa
    g.stamp(["y.y", ".v."], 31, 28)
    belt(g, shirt, LEATH, GOLD, y=38.2)
    outline(g, shirt)
    keys = dict(sleeve=SLEEVE, trim=SLEEVE, hand=SKIN, cuff=LEATH)
    return g, keys, 'shirt'

SHAPES = {'tunic': tunic, 'robe': robe, 'armor': armor, 'vest': vest}

def build(shape, pose='idle'):
    body, keys, style = SHAPES[shape]()
    near = build_arm('near', pose, style, keys)
    far = build_arm('far', pose, style, keys)
    return body, near, far
