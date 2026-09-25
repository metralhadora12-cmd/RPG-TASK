import { palette } from '@/ui/palette';

const O = palette.ink;

export const navIcons = {
  quests: {
    matrix: ['.########.', '#PPPPPPPP#', '.#PLLLLP#.', '.#PPPPPP#.', '.#PLLLLP#.', '.#PPPPPP#.', '.#PLLLPP#.', '#PPPPPPPP#', '.########.'],
    colors: { '#': O, P: '#f0dca8', L: '#8a6030' },
  },
  character: {
    matrix: ['...####...', '..#GGGG#..', '.#GWGGGG#.', '.#GGGGGG#.', '.#G#SS#G#.', '.##SKKS##.', '..#SSSS#..', '...####...'],
    colors: { '#': O, G: palette.gray, W: palette.white, S: '#f0b890', K: O },
  },
  shop: {
    matrix: ['...####...', '..#....#..', '.########.', '#BBBBBBBB#', '#BBBYYBBB#', '#BBYBBBBB#', '#BBBYYBBB#', '#BBBBBBBB#', '.########.'],
    colors: { '#': O, B: '#a86830', Y: palette.gold },
  },
  menu: {
    matrix: ['...#..#...', '..#W##W#..', '.#WWWWWW#.', '#WWW##WWW#', '.#W#..#W#.', '.#W#..#W#.', '#WWW##WWW#', '.#WWWWWW#.', '..#W##W#..', '...#..#...'],
    colors: { '#': O, W: palette.frost },
  },
} as const;

export type NavIconId = keyof typeof navIcons;
