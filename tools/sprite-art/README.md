# Arte dos sprites (geradores)

Scripts em Python (Pillow só para as prévias) que desenham o herói e os itens da loja e exportam as camadas como texto para `src/sprites/layerData.ts` e `src/sprites/itemData.ts`.

- `skel.py`: esqueleto da pose base (vista 3/4 voltada para a direita).
- `head.py`, `hair.py` (+ `hairlib.py`, `locks.py`): cabeça, rostos e os 10 penteados.
- `outfits.py`, `arms.py`, `kit.py`: as 4 roupas e os braços de cada uma.
- `items.py`: chapéus, armas, acessórios, mascotes.
- `tones.py`, `game.py`, `hero.py`: rampas de cor e um espelho do compositor para gerar prévias.

```sh
cd tools/sprite-art
python3 export.py   # regrava layerData.ts e itemData.ts
```

Depois de exportar, rode `npm test` (os testes conferem tamanho, chaves e paletas de cada camada).
