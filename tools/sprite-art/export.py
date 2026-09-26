"""Exporta a arte para src/sprites/layerData.ts e itemData.ts."""
from px import Grid
from head import head_layer, face_layer
import hair as hairmod, outfits, items

import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'sprites') + os.sep

def trim(rows):
    rows = [r.rstrip('.') for r in rows]
    while rows and rows[-1] == '':
        rows.pop()
    return rows

def ts_layer(name, g, doc=None):
    lines = []
    if doc:
        lines.append(f'/** {doc} */')
    lines.append(f'export const {name}: LayerSource = {{')
    lines.append('  rows: [')
    for r in trim(g.rows()):
        lines.append(f"    '{r}',")
    lines.append('  ],')
    lines.append('};\n')
    return '\n'.join(lines)

header = """/**
 * Camadas do herói (arte original gerada em código, 64×64, JRPG 32-bit em vista 3/4 voltada para a direita).
 * '.' é transparente; as linhas são cortadas à direita e completadas em tempo de execução.
 *
 * Chaves (cada material tem luz · base · sombra · sombra profunda):
 *   o contorno · pele t s S u · cabelo L l h H k · olhos W E e i · boca r x · sobrancelha k
 *   roupa f c C d · detalhe g a A z · calça q p P Q · couro j b B N · metal w m M n · manga y v V Y
 *
 * Gerado por scripts de arte (formas + sombreamento por direção de luz + retoques à mão).
 */
import type { LayerSource } from './types';

"""
parts = [header]
parts.append(ts_layer('body', head_layer(), 'Cabeça e pescoço (pele).'))
parts.append(ts_layer('faceOpen', face_layer('open'), 'Rosto: olhos abertos.'))
parts.append(ts_layer('faceHappy', face_layer('happy'), 'Rosto da vitória: olhos sorrindo e boca aberta.'))
parts.append(ts_layer('faceClosed', face_layer('closed'), 'Rosto desmaiado: olhos fechados.'))
names = {'tunic': 'Tunic', 'robe': 'Robe', 'armor': 'Armor', 'vest': 'Vest'}
for shape, nm in names.items():
    body, near, far = outfits.build(shape, 'idle')
    _, _, up = outfits.build(shape, 'victory')
    parts.append(ts_layer('outfit' + nm, body, f'Roupa ({shape}): tronco, pernas e botas.'))
    parts.append(ts_layer('arms' + nm + 'Near', near, 'Braço da frente (segura a arma).'))
    parts.append(ts_layer('arms' + nm + 'Far', far, 'Braço de trás em guarda (atrás do corpo).'))
    parts.append(ts_layer('arms' + nm + 'Up', up, 'Braço de trás erguido (vitória).'))
hnames = {'short': 'Short', 'bowl': 'Bowl', 'spiky': 'Spiky', 'long': 'Long', 'ponytail': 'Pony', 'bun': 'Bun',
          'afro': 'Afro', 'twinTails': 'Twin', 'mohawk': 'Mohawk', 'bald': 'Bald'}
for key, nm in hnames.items():
    front, back = hairmod.STYLES[key]()
    parts.append(ts_layer('hair' + nm, front))
    if back is not None:
        parts.append(ts_layer('hair' + nm + 'Back', back))
open(OUT + 'layerData.ts', 'w').write('\n'.join(parts))

iheader = """/**
 * Arte original dos itens da loja (64×64, alinhada à pose 3/4 do herói).
 * Chaves: o contorno · roupa f c C d · detalhe g a A z · couro j b B N · metal w m M n
 *         W branco · e olhos (mascotes) · H bigode.
 */
import type { LayerSource } from './types';

"""
parts = [iheader]
for nm, fn in {**items.HATS, **items.WEAPONS}.items():
    parts.append(ts_layer(nm, fn()))
for nm, fn in items.ACCS.items():
    parts.append(ts_layer(nm, fn()))
    if nm == 'accCape':
        parts.append(ts_layer('accCapeFront', items.cape_front(), 'Gola e fecho da capa (na frente do ombro).'))
for nm, fn in items.PETS.items():
    parts.append(ts_layer(nm, fn()))
parts.append(ts_layer('npcMustache', items.mustache()))
open(OUT + 'itemData.ts', 'w').write('\n'.join(parts))

# chaves usadas
used = set()
for f in ('layerData.ts', 'itemData.ts'):
    for line in open(OUT + f):
        line = line.strip()
        if line.startswith("'") and line.endswith("',"):
            used |= set(line[1:-2])
print('chaves:', ''.join(sorted(used)))
