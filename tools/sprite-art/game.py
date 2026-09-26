"""Paletas do jogo (copiadas de characterParts.ts / catalog.ts) + derivação igual à do TS."""
from tones import tone

INK = '#1c1226'

skinTones = [
  {'s': '#fce0c8', 'S': '#e0b090'}, {'s': '#f8d0b0', 'S': '#d8a080'}, {'s': '#f0c090', 'S': '#c88860'},
  {'s': '#e0a878', 'S': '#b07850'}, {'s': '#c88c5c', 'S': '#98643c'}, {'s': '#a86c40', 'S': '#784828'},
  {'s': '#8a5430', 'S': '#603818'}, {'s': '#6a3c20', 'S': '#482410'},
]
eyeColors = ['#3050c0', '#289048', '#704020', '#607080', '#7838b0', '#d08010']
hairColors = [
  {'h': '#302838', 'H': '#18121e', 'l': '#585070'}, {'h': '#5a3820', 'H': '#381f10', 'l': '#80583a'},
  {'h': '#8a5a30', 'H': '#5a3818', 'l': '#b8844c'}, {'h': '#c05028', 'H': '#803018', 'l': '#f08850'},
  {'h': '#e88028', 'H': '#a85010', 'l': '#f8b860'}, {'h': '#f0c848', 'H': '#b88c20', 'l': '#fff098'},
  {'h': '#e8e0c8', 'H': '#b0a890', 'l': '#ffffff'}, {'h': '#a8acb8', 'H': '#707480', 'l': '#e0e4f0'},
  {'h': '#3868d8', 'H': '#203c90', 'l': '#78a8f8'}, {'h': '#38a048', 'H': '#1f6028', 'l': '#78d880'},
  {'h': '#8848c0', 'H': '#582880', 'l': '#c088f0'}, {'h': '#f070a8', 'H': '#b04070', 'l': '#ffb0d0'},
]
leather = {'b': '#704020', 'B': '#402010'}
gold = {'a': '#f0c030', 'A': '#b08010'}
classOutfits = {
  'warrior': [
    ('armor', {**leather, **gold, 'm': '#d0d8e8', 'M': '#8890a8', 'p': '#687088', 'P': '#485068', 'v': '#a0a8b8', 'V': '#687088'}),
    ('armor', {**leather, **gold, 'm': '#f0b868', 'M': '#a86828', 'p': '#584838', 'P': '#382818', 'v': '#c07838', 'V': '#884818'}),
    ('tunic', {**leather, **gold, 'c': '#c03830', 'C': '#882020', 'p': '#584838', 'P': '#382818', 'v': '#c03830', 'V': '#882020'}),
  ],
  'mage': [
    ('robe', {**leather, **gold, 'c': '#3050b8', 'C': '#203080', 'v': '#3050b8', 'V': '#203080'}),
    ('robe', {**leather, 'c': '#7040a8', 'C': '#482878', 'a': '#c8c8f0', 'A': '#9090c0', 'v': '#7040a8', 'V': '#482878'}),
    ('tunic', {**leather, 'c': '#20a098', 'C': '#107068', 'a': '#f0e0a0', 'A': '#c0b070', 'p': '#484060', 'P': '#302840', 'v': '#20a098', 'V': '#107068'}),
  ],
  'rogue': [
    ('vest', {**leather, 'c': '#8a5a30', 'C': '#603818', 'a': '#e8e0c8', 'A': '#b8b098', 'p': '#383040', 'P': '#201828', 'v': '#e8e0c8', 'V': '#b8b098'}),
    ('vest', {'b': '#282830', 'B': '#141418', 'c': '#303848', 'C': '#182028', 'a': '#704880', 'A': '#482858', 'p': '#202028', 'P': '#101018', 'v': '#303848', 'V': '#182028'}),
    ('tunic', {**leather, 'c': '#4a8a40', 'C': '#2a5a28', 'a': '#d0b060', 'A': '#907830', 'p': '#584838', 'P': '#382818', 'v': '#4a8a40', 'V': '#2a5a28'}),
  ],
  'cleric': [
    ('robe', {**leather, **gold, 'c': '#f0f0f8', 'C': '#b8b8d0', 'v': '#f0f0f8', 'V': '#b8b8d0'}),
    ('robe', {**leather, 'c': '#9a7a58', 'C': '#6a5038', 'a': '#e8e0c8', 'A': '#b8b098', 'v': '#9a7a58', 'V': '#6a5038'}),
    ('armor', {**leather, 'a': '#f8f8f8', 'A': '#c8c8d8', 'm': '#f0e8c0', 'M': '#b8a060', 'p': '#8890a8', 'P': '#606880', 'v': '#f0e8c0', 'V': '#b8a060'}),
  ],
}
basePalette = {'o': INK, 'r': '#a84040'}

RULES = [
    ('S', ['s'], lambda c: tone(c, -1)), ('t', ['s'], lambda c: tone(c, 0.8)), ('u', ['S', 's'], lambda c: tone(c, -1)),
    ('H', ['h'], lambda c: tone(c, -1)), ('l', ['h'], lambda c: tone(c, 1)), ('L', ['l', 'h'], lambda c: tone(c, 1)),
    ('k', ['H', 'h'], lambda c: tone(c, -1)),
    ('E', ['e'], lambda c: tone(c, -1.5)), ('i', ['e'], lambda c: tone(c, 1.6)),
    ('C', ['c'], lambda c: tone(c, -1)), ('f', ['c'], lambda c: tone(c, 1)), ('d', ['C', 'c'], lambda c: tone(c, -1)),
    ('A', ['a'], lambda c: tone(c, -1)), ('g', ['a'], lambda c: tone(c, 1)), ('z', ['A', 'a'], lambda c: tone(c, -1)),
    ('P', ['p'], lambda c: tone(c, -1)), ('q', ['p'], lambda c: tone(c, 1)), ('Q', ['P', 'p'], lambda c: tone(c, -1)),
    ('B', ['b'], lambda c: tone(c, -1)), ('j', ['b'], lambda c: tone(c, 1)), ('N', ['B', 'b'], lambda c: tone(c, -1)),
    ('M', ['m'], lambda c: tone(c, -1)), ('w', ['m'], lambda c: tone(c, 1.6)), ('n', ['M', 'm'], lambda c: tone(c, -1)),
    ('V', ['v'], lambda c: tone(c, -1)), ('y', ['v'], lambda c: tone(c, 1)), ('Y', ['V', 'v'], lambda c: tone(c, -1)),
]

def derive(p):
    out = {'W': '#ffffff', **p}
    for key, frm, make in RULES:
        if key in out:
            continue
        src = next((k for k in frm if k in out), None)
        if src:
            out[key] = make(out[src])
    if 'w' not in out:
        out['w'] = '#f8f8f8'
    return out

def skin(i):
    d = derive(skinTones[i])
    return d

def skin_layer(i):
    d = skin(i)
    return {**d, 'o': tone(d['S'], -2.4)}

def hair_pal(i):
    d = derive(hairColors[i])
    return {**d, 'o': tone(d['k'], -1), 'a': '#e83870', 'A': '#a02850'}

def face_pal(skin_i, eye_i, hair_i):
    sk = skin(skin_i)
    e = derive({'e': eyeColors[eye_i]})
    hp = derive(hairColors[hair_i])
    return {'o': '#231a2a', 'W': '#ffffff', 'E': e['E'], 'e': e['e'], 'i': e['i'], 'S': sk['S'], 's': sk['s'], 'u': sk['u'],
            'r': tone(sk['S'], -1.2), 'x': tone(sk['S'], -2), 'k': hp['k']}

def outfit_pal(palette, skin_i=2):
    return derive({**basePalette, **skin(skin_i), **palette})
