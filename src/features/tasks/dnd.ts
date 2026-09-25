import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { t } from '@/lib/i18n';

export function useSortableSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

type SortableData = { sortable?: { index: number } } | undefined;
const position = (data: SortableData) => (data?.sortable?.index ?? 0) + 1;

const announcements: Announcements = {
  onDragStart: ({ active }) => t('dnd.pickedUp', { pos: position(active.data.current as SortableData) }),
  onDragOver: ({ over }) =>
    over ? t('dnd.movedTo', { pos: position(over.data.current as SortableData) }) : undefined,
  onDragEnd: ({ over }) =>
    over ? t('dnd.dropped', { pos: position(over.data.current as SortableData) }) : t('dnd.cancelled'),
  onDragCancel: () => t('dnd.cancelled'),
};

/** Textos de acessibilidade do dnd-kit em pt-BR. */
export function dndAccessibility() {
  return { announcements, screenReaderInstructions: { draggable: t('dnd.instructions') } };
}

/** Nova ordem de ids após soltar, ou null se nada mudou. */
export function reorderedIds(ids: UniqueIdentifier[], event: DragEndEvent): string[] | null {
  const { active, over } = event;
  if (!over || active.id === over.id) return null;
  const from = ids.indexOf(active.id);
  const to = ids.indexOf(over.id);
  if (from < 0 || to < 0) return null;
  return arrayMove(ids, from, to).map(String);
}
