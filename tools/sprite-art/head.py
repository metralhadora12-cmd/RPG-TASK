"""Cabeça 3/4 voltada para a direita: pele, orelha, pescoço e rostos."""
from px import *

# extensão da pele por linha (x inicial, x final), inclusive
HEAD_SPANS = {
    9: (28, 34), 10: (26, 36), 11: (25, 37), 12: (24, 38), 13: (24, 38),
    14: (23, 39), 15: (23, 39), 16: (23, 39), 17: (23, 39), 18: (23, 39),
    19: (24, 39), 20: (24, 39), 21: (25, 38), 22: (26, 38), 23: (28, 37),
    24: (30, 36), 25: (32, 35),
}
NECK_SPANS = {24: (29, 32), 25: (29, 32), 26: (29, 32), 27: (29, 33), 28: (28, 33)}

def spans_mask(spans):
    return {(x, y) for y, (a, b) in spans.items() for x in range(a, b + 1)}

HEAD_MASK = spans_mask(HEAD_SPANS)
NECK_MASK = spans_mask(NECK_SPANS)

def head_layer():
    g = Grid()
    # pescoço (atrás do queixo, na sombra)
    g.fill_mask(NECK_MASK, 'S')
    for y in (24, 25, 26):
        for x in range(29, 33):
            g.set(x, y, 'u')
    g.set(32, 27, 's'); g.set(33, 28, 's'); g.set(32, 28, 's')
    g.fill_mask(border(NECK_MASK) - HEAD_MASK, 'o')
    # cabeça
    g.fill_mask(HEAD_MASK, 's')
    # lado (plano da orelha) e parte de baixo do rosto na sombra
    for y, (a, b) in HEAD_SPANS.items():
        n = 2 if y <= 18 else 3 if y <= 21 else 4
        for x in range(a, min(b, a + n)):
            g.set(x, y, 'S')
        if y >= 18:
            g.set(a, y, 'u')
    for (x, y) in [(29, 22), (30, 22), (30, 23), (31, 23), (31, 24), (32, 24), (32, 25), (33, 25)]:
        g.set(x, y, 'S')
    # luz na maçã do rosto (lado da luz)
    for (x, y) in [(38, 19), (38, 20), (37, 21)]:
        g.set(x, y, 't')
    g.fill_mask(border(HEAD_MASK, diag=True) - HEAD_MASK - NECK_MASK, 'o')
    # orelha
    ear = [
        "oo.",
        "sSo",
        "sus",
        "Suo",
        "oS.",
    ]
    g.stamp(ear, 25, 17)
    return g

# rostos: carimbos na posição (28, 16)
FACE_OPEN = [
    #28 ...
    ".kkk...kk..",   # 16 sobrancelhas
    "ooooo.oooo.",   # 17 cílios
    ".WEEo.WEo..",   # 18
    ".WeiS.Wi...",   # 19
    "...........",   # 20
    ".........S.",   # 21 nariz
    "...........",   # 22
    "........r..",   # 23 boca
]

# rostos (carimbados em (28, 16)); k = sobrancelha (cor do cabelo)
FACE_AT = (28, 16)
FACES = {
    'open': [
        "..kkk...kk.",
        ".oooo..ooo.",
        "..EEW...EW.",
        "..eEW...eW.",
        "..iie...i..",
        ".........S.",
        "...........",
        ".......xr..",
    ],
    'happy': [
        "..kkk...kkk",
        "...........",
        "..ooo...oo.",
        ".o...o.o..o",
        "...........",
        ".........S.",
        "......xxx..",
        ".......rr..",
    ],
    'closed': [
        "...........",
        "...kk....k.",
        "...........",
        ".oooo..ooo.",
        "...........",
        ".........S.",
        "...........",
        ".......xx..",
    ],
}

def face_layer(kind='open'):
    g = Grid()
    g.stamp(FACES[kind], *FACE_AT)
    return g
