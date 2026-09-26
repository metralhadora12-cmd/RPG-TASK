/**
 * Ícones pixel 9×9 das listas (arte original).
 * '#' = contorno, 'c' = cor da lista, 'w' = brilho, '.' = transparente.
 */
export const listIcons = {
  scroll: ['.#######.', '#ccccccc#', '.#c###c#.', '.#ccccc#.', '.#c###c#.', '.#ccccc#.', '.#c##cc#.', '#ccccccc#', '.#######.'],
  sword: ['.......#.', '......#w#', '.....#w#.', '....#w#..', '.#.#w#...', '..#c#....', '..##c#...', '.#c#.....', '#c#......'],
  shield: ['#########', '#cwccccc#', '#cwccccc#', '#ccccccc#', '#ccccccc#', '.#ccccc#.', '.#ccccc#.', '..#ccc#..', '...###...'],
  potion: ['...###...', '...#w#...', '...#w#...', '..#www#..', '.#ccccc#.', '#cwccccc#', '#cwccccc#', '#ccccccc#', '.#######.'],
  star: ['....#....', '...#c#...', '####c####', '#cccwccc#', '.#ccccc#.', '..#ccc#..', '.#cc#cc#.', '.#c#.#c#.', '.##...##.'],
  heart: ['.##...##.', '#cc#.#cc#', '#wcc#ccc#', '#wcccccc#', '#ccccccc#', '.#ccccc#.', '..#ccc#..', '...#c#...', '....#....'],
  house: ['....#....', '...#c#...', '..#ccc#..', '.#ccccc#.', '#########', '.#wwwww#.', '.#ww#ww#.', '.#ww#ww#.', '.#######.'],
  book: ['########.', '#ccccccc#', '#cwwwwwc#', '#ccccccc#', '#cwwwwwc#', '#ccccccc#', '#ccccccc#', '#wwwwwww#', '#########'],
  coin: ['..#####..', '.#ccccc#.', '#ccwwccc#', '#cwccccc#', '#cwccccc#', '#ccccccc#', '#ccccccc#', '.#ccccc#.', '..#####..'],
  key: ['.........', '.###.....', '#ccc#....', '#cwc#####', '#ccc#ccc#', '.###.#.#.', '.........', '.........', '.........'],
  gem: ['..#####..', '.#wcccc#.', '#wcccccc#', '#########', '.#ccccc#.', '..#ccc#..', '...#c#...', '....#....', '.........'],
  flag: ['#........', '#######..', '#ccccc#..', '#cwcccc#.', '#ccccc#..', '######...', '#........', '#........', '#........'],
  sun: ['....c....', '.c.....c.', '...###...', '..#ccc#..', 'c.#cwc#.c', '..#ccc#..', '...###...', '.c.....c.', '....c....'],
  calendar: ['.#.....#.', '#########', '#ccccccc#', '#########', '#wwwwwww#', '#wcwcwcw#', '#wwwwwww#', '#wcwcwww#', '#########'],
  check: ['.........', '.......##', '......#c#', '#....#c#.', '##..#c#..', '#c##c#...', '.#cc#....', '..##.....', '.........'],
} as const satisfies Record<string, readonly string[]>;

export type ListIconId = keyof typeof listIcons;

/** Ícones que o usuário pode escolher para suas listas. */
export const pickableListIcons = [
  'scroll',
  'sword',
  'shield',
  'potion',
  'star',
  'heart',
  'house',
  'book',
  'coin',
  'key',
  'gem',
  'flag',
] as const satisfies readonly ListIconId[];

export function isListIconId(id: string): id is ListIconId {
  return id in listIcons;
}
