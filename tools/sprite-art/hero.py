"""Espelho em Python do compositor do app (compose.ts) para as prévias."""
from px import *
from tones import tone
from head import head_layer, face_layer
import hair as hairmod, outfits
from game import *

HAIR_ORDER = ['short', 'bowl', 'spiky', 'long', 'ponytail', 'bun', 'afro', 'twinTails', 'mohawk', 'bald']
_cache = {}

def cached(key, fn):
    if key not in _cache:
        _cache[key] = fn()
    return _cache[key]

def widen(rows, start=27):
    out = []
    for y, r in enumerate(rows):
        passes = 0 if y < start else (1 if y < start + 2 else 2)
        for _ in range(passes):
            r = r[1:32] + r[31] + r[32] + r[32:63]
        out.append(r)
    return out

def shift(rows, dx):
    if dx > 0:
        return ['.' * dx + r[:64 - dx] for r in rows]
    if dx < 0:
        return [r[-dx:] + '.' * (-dx) for r in rows]
    return rows

def breathe(rows, waist=36):
    return ['.' * 64 if y == 0 else (rows[y - 1] if y <= waist else r) for y, r in enumerate(rows)]

def lay_down(grid):
    n = 64
    rot = [[None] * n for _ in range(n)]
    for y in range(n):
        for x in range(n):
            rot[n - 1 - x][y] = grid[y][x]
    bottom = max((y for y in range(n) if any(rot[y])), default=-1)
    sh = n - 1 - bottom
    out = [[None] * n for _ in range(n)]
    for y in range(n - sh):
        out[y + sh] = rot[y]
    return out

def layers_for(classId='warrior', ap=None, eq=None, pose='idle0'):
    ap = {'body': 'a', 'skin': 0, 'hairStyle': 0, 'hairColor': 0, 'eyes': 0, 'outfit': 0, **(ap or {})}
    eq = eq or {}
    shape, opal = eq.get('outfit') or classOutfits[classId][ap['outfit']]
    arm_pose = 'victory' if pose == 'victory' else 'idle'
    body_g, near_g, far_g = cached(('fit', shape, arm_pose), lambda: outfits.build(shape, arm_pose))
    hs = HAIR_ORDER[ap['hairStyle']]
    front_g, back_g = cached(('hair', hs), lambda: hairmod.STYLES[hs]())
    head_g = cached('head', head_layer)
    face_kind = {'fainted': 'closed', 'victory': 'happy'}.get(pose, 'open')
    face_g = cached(('face', face_kind), lambda: face_layer(face_kind))
    P = outfit_pal(opal, ap['skin'])
    HP = hair_pal(ap['hairColor'])
    clip = eq.get('hairClip')
    hide = eq.get('hideHair')
    def hair_rows(g):
        rows = g.rows()
        if clip is not None:
            rows = ['.' * 64 if y < clip else r for y, r in enumerate(rows)]
        return rows
    L = []  # (slot, rows, palette, mode)
    for (rows, pal, mode) in eq.get('back', []):
        L.append(('back', rows, pal, mode))
    if back_g is not None and not hide:
        L.append(('hairBack', hair_rows(back_g), HP, 'widen'))
    L.append(('armBack', far_g.rows(), P, 'right'))
    L.append(('body', head_g.rows(), skin_layer(ap['skin']), 'none'))
    L.append(('outfit', body_g.rows(), P, 'widen'))
    L.append(('face', face_g.rows(), face_pal(ap['skin'], ap['eyes'], ap['hairColor']), 'none'))
    if not hide:
        L.append(('hairFront', hair_rows(front_g), HP, 'none'))
    for slot in ('hat', 'weapon'):
        for (rows, pal, mode) in eq.get(slot, []):
            L.append((slot, rows, pal, mode))
    L.append(('arms', near_g.rows(), P, 'left'))
    for slot in ('accessory', 'pet'):
        for (rows, pal, mode) in eq.get(slot, []):
            L.append((slot, rows, pal, mode))
    wide = ap['body'] == 'b'
    out = []
    for slot, rows, pal, mode in L:
        rows = [r.ljust(64, '.')[:64] for r in rows] + ['.' * 64] * (64 - len(rows))
        if mode != 'fixed':
            if wide:
                rows = widen(rows) if mode == 'widen' else shift(rows, -2) if mode == 'left' else shift(rows, 2) if mode == 'right' else rows
            if pose == 'idle1':
                rows = breathe(rows)
        out.append((rows, pal))
    return out

def grid_for(*a, **k):
    layers = layers_for(*a, **k)
    grid = [[None] * 64 for _ in range(64)]
    for rows, pal in layers:
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch != '.':
                    grid[y][x] = pal[ch]
    if k.get('pose') == 'fainted' or (len(a) > 3 and a[3] == 'fainted'):
        grid = lay_down(grid)
    return grid

def render_grid(grid, scale=4, bg=(120, 130, 150)):
    from PIL import Image
    img = Image.new('RGBA', (64, 64), bg + (255,))
    px_ = img.load()
    for y in range(64):
        for x in range(64):
            if grid[y][x]:
                px_[x, y] = hexrgb(grid[y][x]) + (255,)
    return img.resize((64 * scale, 64 * scale), Image.NEAREST)

def hero_img(*a, scale=4, **k):
    return render_grid(grid_for(*a, **k), scale)
