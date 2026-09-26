"""Os 10 penteados em 3/4 (frente e, quando houver, trás)."""
import math
from px import *
from hairlib import Lock, paint, cap, FACE_CUT

NAPE = poly([(21.6, 11), (27, 9), (28.2, 21), (24.4, 23.2), (21.6, 19.5)])
EAR_COVER = poly([(24.5, 14), (28.8, 14), (28.8, 22.5), (25.5, 22.5)])

def arc(cx, cy, rx, ry, a0, a1, n=40):
    pts = set()
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        pts.add((math.floor(cx + rx * math.cos(a)), math.floor(cy + ry * math.sin(a))))
    return pts

def bangs(style='spiky'):
    if style == 'soft':
        return [
            Lock((25.6, 12.5), (30.4, 11.8), (27.4, 21.0), bend=0.05),
            Lock((30.0, 10.8), (35.0, 10.6), (32.8, 17.4), bend=0.18),
            Lock((34.4, 10.6), (39.8, 11.8), (40.2, 16.8), bend=0.22),
        ]
    return [
        Lock((26.0, 12.5), (30.5, 11.8), (27.5, 21.5), bend=0.05),
        Lock((30.0, 10.5), (35.0, 10.5), (32.5, 18.2), bend=0.12),
        Lock((34.2, 10.4), (39.8, 11.6), (40.4, 17.6), bend=0.22),
    ]

def spiky():
    mass = cap() | NAPE
    locks = [
        Lock((22.5, 18), (26.5, 22.5), (17.5, 25.5), bend=0.1),
        Lock((21.5, 13.5), (23.5, 19.5), (12.5, 18.5), bend=0.15),
        Lock((21.8, 9.0), (24.5, 14.5), (13.0, 8.5), bend=-0.05),
        Lock((23.5, 7.2), (29.5, 5.5), (17.5, 0.8), bend=-0.2),
        Lock((28.0, 5.6), (34.0, 5.4), (29.5, -0.2), bend=-0.1),
        Lock((33.0, 5.5), (38.5, 8.0), (40.0, 0.6), bend=0.15),
        Lock((37.5, 8.0), (40.6, 12.2), (46.0, 6.0), bend=0.2),
    ] + bangs()
    spark = {(31, 8), (32, 8), (33, 9), (27, 9), (36, 10), (37, 11)}
    return paint(mass, locks, sparkle=spark), None

def short():
    mass = cap(9.0, 6.5) | NAPE | EAR_COVER
    locks = [
        Lock((22.4, 16.8), (25.6, 21.6), (19.2, 24.0), bend=0.12),
        Lock((21.8, 11.6), (23.4, 17.2), (16.6, 15.6), bend=0.12),
        Lock((22.6, 8.6), (26.4, 7.0), (18.4, 6.4), bend=-0.1),
        Lock((25.6, 6.8), (31.0, 6.0), (23.0, 2.6), bend=-0.25),
        Lock((30.4, 6.0), (35.6, 6.4), (31.4, 2.8), bend=-0.2),
        Lock((35.0, 7.0), (39.0, 9.6), (40.8, 5.6), bend=0.2),
    ] + bangs('soft')
    spark = {(30, 8), (31, 8), (32, 8), (33, 9), (35, 10)}
    return paint(mass, locks, sparkle=spark), None

def bowl():
    mass = (ellipse(31, 13.2, 9.8, 7.6) & {(x, y) for x in range(10, 50) for y in range(0, 23)})
    face = {(x, y) for (x, y) in mass if x >= 29 and y >= 16}
    mass -= face
    # franja reta com pontas
    for x in range(29, 41):
        mass.add((x, 15))
    for x in (30, 33, 36, 39):
        mass.add((x, 16))
    locks = [
        Lock((29.5, 9.0), (33.5, 9.0), (31.5, 16.5), bend=0.0, hi=False, sep=True),
        Lock((33.5, 9.2), (37.5, 9.6), (36.5, 16.5), bend=0.1, hi=False, sep=True),
        Lock((24.0, 12.0), (28.0, 11.0), (25.0, 22.4), bend=0.0, hi=False, sep=True),
    ]
    ring = arc(31, 12.6, 7.6, 5.4, 200, 330) & mass
    g = paint(mass, locks, sparkle=ring)
    return g, None

def long_():
    mass = cap() | NAPE | EAR_COVER
    front_lock = [Lock((24.2, 14.0), (28.8, 14.5), (25.0, 37.0), bend=-0.08)]
    locks = [
        Lock((24.0, 7.6), (30.0, 6.0), (21.5, 4.2), bend=-0.2),
        Lock((29.0, 6.0), (35.0, 6.2), (33.0, 3.8), bend=0.1),
    ] + bangs('soft') + front_lock
    spark = arc(31.5, 11.5, 6.5, 4.2, 210, 320)
    front = paint(mass, locks, sparkle=spark)
    back_mass = poly([(20.5, 10), (29, 7), (37.5, 10), (40.8, 22), (39.5, 32), (33, 34), (29.5, 40), (27.5, 46.5),
                      (22.5, 47.5), (17.2, 45.5), (16.2, 36), (17.2, 22)])
    back_locks = [
        Lock((18.5, 30), (22.5, 30), (17.8, 47.0), bend=0.05),
        Lock((22.0, 32), (27.0, 32), (24.5, 48.0), bend=-0.05),
        Lock((36.0, 22), (40.5, 22), (38.2, 34.0), bend=-0.1),
    ]
    back = paint(back_mass, back_locks, dark=arc(22, 24, 6, 16, 90, 200))
    return front, back

def ponytail():
    mass = cap() | NAPE | EAR_COVER
    locks = [
        Lock((24.0, 7.6), (30.0, 6.0), (22.5, 4.6), bend=-0.2),
    ] + bangs('soft')
    spark = arc(32, 11.5, 6.5, 4.2, 215, 320)
    front = paint(mass, locks, sparkle=spark)
    # laço
    front.stamp(["oooo", "oaAo", "oAAo", "oooo"], 19, 11)
    tail = poly([(19.5, 11.5), (22.5, 12.5), (21.0, 20), (19.5, 29), (16.5, 36.5), (14.0, 38.5), (13.2, 33), (15.0, 24), (16.2, 15)])
    back_locks = [Lock((16.0, 16), (20.5, 16), (13.8, 38.0), bend=0.15)]
    back = paint(tail, back_locks)
    return front, back

def bun():
    mass = cap() | NAPE | EAR_COVER
    locks = bangs('soft')
    bunm = ellipse(24.5, 6.8, 4.6, 4.2)
    spark = arc(32.5, 11.5, 6.2, 4.2, 220, 320) | {(24, 4), (25, 4), (26, 5)}
    front = paint(mass | bunm, locks + [Lock((21, 8), (27, 5), (24.5, 3.5), bend=0, hi=True, sep=False)], sparkle=spark)
    front.stamp(["aa", "aA"], 27, 9)
    front.stamp(["aa"], 26, 10)
    return front, None

def afro():
    import random
    rnd = random.Random(7)
    mass = ellipse(30.4, 11.0, 11.6, 9.6)
    # borda ondulada: bolinhas ao redor
    bumps = set()
    for a in range(0, 360, 24):
        ax = 30.4 + 11.2 * math.cos(math.radians(a)); ay = 11.0 + 9.2 * math.sin(math.radians(a))
        bumps |= ellipse(ax, ay, 2.2, 2.0)
    mass = (mass | bumps) - poly([(29.4, 16.2), (46, 13.2), (46, 30), (29.4, 30)])
    mass = {(x, y) for (x, y) in mass if y >= 0}
    mass |= EAR_COVER
    curls = set()
    for (cx, cy) in [(22, 6), (27, 3), (33, 2), (38, 5), (41, 10), (19, 11), (19, 17), (25, 9), (31, 7), (36, 10), (24, 15), (29, 12), (39, 15)]:
        curls |= arc(cx, cy, 1.8, 1.6, 30, 200)
    lit_pts = set()
    for (cx, cy) in [(33, 3), (38, 6), (35, 9), (30, 6), (40, 11)]:
        lit_pts |= arc(cx, cy, 1.8, 1.6, 200, 340)
    front = paint(mass, [], dark=curls, lit=lit_pts, sparkle={(33, 2), (38, 5), (36, 9), (41, 10)})
    return front, None

def twin():
    mass = cap() | NAPE | EAR_COVER
    locks = [Lock((24.0, 7.6), (30.0, 6.0), (22.5, 4.6), bend=-0.2)] + bangs('soft')
    spark = arc(32, 11.5, 6.5, 4.2, 215, 320)
    front = paint(mass, locks, sparkle=spark)
    front.stamp(["oooo", "oaAo", "oAAo", "oooo"], 21, 14)
    near = poly([(21.5, 15.5), (24.5, 16.5), (23.5, 26), (21.5, 34), (18.5, 40), (16.0, 41.5), (15.6, 36), (18.0, 27)])
    far = poly([(37.5, 9.5), (40.5, 10.5), (43.5, 18), (45.2, 28), (44.6, 36), (42.6, 38.5), (41.4, 30), (39.2, 19)])
    back = paint(near | far, [Lock((17.5, 26), (22.5, 26), (16.2, 41.0), bend=0.1), Lock((40.0, 20), (44.0, 20), (43.2, 38.0), bend=-0.1)])
    back.stamp(["oooo", "oaAo", "oAAo", "oooo"], 37, 8)
    return front, back

def mohawk():
    crest = poly([(21.6, 17.0), (22.0, 11.0), (25.0, 7.4), (30.0, 5.6), (35.0, 6.0), (38.6, 8.6), (39.8, 11.0),
                  (36.8, 10.4), (32.0, 9.0), (27.6, 9.8), (24.8, 12.6), (24.4, 17.6)])
    locks = [
        Lock((21.8, 12.6), (24.4, 17.0), (15.6, 15.4), bend=0.1),
        Lock((22.4, 8.8), (26.4, 7.2), (16.8, 4.6), bend=-0.1),
        Lock((26.2, 6.6), (31.4, 5.6), (22.6, 0.4), bend=-0.18),
        Lock((31.0, 5.6), (35.8, 6.2), (30.2, -0.4), bend=-0.12),
        Lock((35.4, 6.4), (39.2, 9.8), (40.4, 2.4), bend=0.08),
    ]
    front = paint(crest, locks, sparkle={(30, 7), (31, 7), (34, 8)})
    # laterais raspadas: pontinhos de cabelo curto na pele
    for (x, y) in [(25, 11), (27, 10), (26, 13), (28, 12), (30, 11), (32, 11), (34, 11), (36, 12), (24, 14), (38, 13)]:
        if front.get(x, y) == '.':
            front.set(x, y, 'H')
    return front, None

def bald():
    return Grid(), None

STYLES = {
    'short': short, 'bowl': bowl, 'spiky': spiky, 'long': long_, 'ponytail': ponytail,
    'bun': bun, 'afro': afro, 'twinTails': twin, 'mohawk': mohawk, 'bald': bald,
}
