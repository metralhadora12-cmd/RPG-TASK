"""Rampas de cor com desvio de matiz (sombra → vermelho/roxo, luz → amarelo), em HSV.
Espelhado em src/sprites/palette.ts (tone)."""
import colorsys
from px import hexrgb, rgbhex

def _hsv(c):
    r, g, b = (v / 255 for v in hexrgb(c))
    return colorsys.rgb_to_hsv(r, g, b)

def _rgb(h, s, v):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, max(0, min(1, s)), max(0, min(1, v)))
    return rgbhex((r * 255, g * 255, b * 255))

def _toward(h, target, amt):
    d = ((target - h + 0.5) % 1.0) - 0.5
    step = max(-abs(amt), min(abs(amt), d))
    return h + step

def tone(c, n):
    """n>0 clareia, n<0 escurece (passos de rampa; aceita frações)."""
    if n == 0:
        return c
    h, s, v = _hsv(c)
    gray = s < 0.12
    if n < 0:
        k = -n
        h2 = 0.70 if gray else _toward(h, 0.75, 0.025 * k)
        s2 = min(1, s + (0.04 if gray else 0.10) * k)
        v2 = v * (0.76 ** k)
        return _rgb(h2, s2, v2)
    k = n
    h2 = h if gray else _toward(h, 0.15, 0.02 * k)
    s2 = max(0, s - 0.10 * k)
    v2 = v + (1 - v) * 0.38 * k + 0.04 * k
    return _rgb(h2, s2, min(1, v2))
