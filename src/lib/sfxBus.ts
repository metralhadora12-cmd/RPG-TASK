/** Efeitos sonoros disponíveis. A UI só emite nomes; o módulo de áudio decide como tocar. */
export type SfxName =
  | 'cursor'
  | 'confirm'
  | 'cancel'
  | 'complete'
  | 'coins'
  | 'damage'
  | 'levelUp'
  | 'purchase'
  | 'heal'
  | 'achievement'
  | 'faint';

type Handler = (name: SfxName) => void;
let handler: Handler | null = null;

/** Registra quem toca os sons (o sintetizador). Devolve a função de remoção. */
export function setSfxHandler(fn: Handler | null): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

export function emitSfx(name: SfxName): void {
  handler?.(name);
}
