import { useEffect, useId, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { pickableListIcons } from '@/sprites/listIcons';
import { useGameStore } from '@/store/useGameStore';
import { Dialog } from '@/ui/Dialog';
import { ListIcon } from '@/ui/ListIcon';
import { showToast } from '@/ui/toastStore';
import { INBOX_LIST_ID, listColors } from '../constants';

export interface ListEditDialogProps {
  listId: string;
  onClose: () => void;
  /** Chamado depois que a lista é excluída. */
  onDeleted?: () => void;
}

export function ListEditDialog({ listId, onClose, onDeleted }: ListEditDialogProps) {
  const list = useGameStore((s) => s.lists.find((l) => l.id === listId));
  const groups = useGameStore((s) => s.groups);
  const taskCount = useGameStore((s) => s.tasks.filter((task) => task.listId === listId).length);
  const [name, setName] = useState(list?.name ?? '');
  const [icon, setIcon] = useState(list?.icon ?? 'scroll');
  const [color, setColor] = useState(list?.color ?? listColors[0]!);
  const [groupId, setGroupId] = useState(list?.groupId ?? '');
  const [confirming, setConfirming] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const ids = { name: useId(), group: useId() };

  useEffect(() => {
    nameRef.current?.select();
  }, []);

  if (!list) return null;

  const save = () => {
    useGameStore.getState().updateList(listId, {
      name: name.trim() || list.name,
      icon,
      color,
      groupId: groupId || undefined,
    });
    onClose();
  };

  const remove = () => {
    const removed = useGameStore.getState().deleteList(listId);
    onClose();
    onDeleted?.();
    if (removed) {
      showToast({
        message: t('lists.deletedToast'),
        actionLabel: t('tasks.undo'),
        onAction: () => useGameStore.getState().restoreList(removed.list, removed.tasks),
      });
    }
  };

  if (confirming) {
    return (
      <Dialog
        open
        onClose={() => setConfirming(false)}
        title={t('lists.delete')}
        text={t('lists.deleteConfirm', { name: list.name, n: taskCount })}
        actions={[
          { label: t('common.no'), onSelect: () => setConfirming(false) },
          { label: t('common.yes'), variant: 'danger', onSelect: remove },
        ]}
      />
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('lists.edit')}
      initialFocusRef={nameRef}
      actions={[
        { label: t('lists.save'), variant: 'solid' as const, onSelect: save },
        { label: t('common.cancel'), onSelect: onClose },
        ...(listId !== INBOX_LIST_ID
          ? [{ label: t('lists.delete'), variant: 'danger' as const, onSelect: () => setConfirming(true) }]
          : []),
      ]}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label htmlFor={ids.name} className="font-title text-[0.55rem] text-win-accent">
          {t('lists.name')}
        </label>
        <input
          ref={nameRef}
          id={ids.name}
          className="px-input"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <fieldset>
          <legend className="font-title mb-1 text-[0.55rem] text-win-accent">{t('lists.icon')}</legend>
          <div className="flex flex-wrap gap-1">
            {pickableListIcons.map((id) => (
              <button
                key={id}
                type="button"
                className="px-icon-btn"
                aria-pressed={icon === id}
                aria-label={t(`lists.iconName.${id}`)}
                onClick={() => setIcon(id)}
              >
                <ListIcon icon={id} color={color} scale={3} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-title mb-1 text-[0.55rem] text-win-accent">{t('lists.color')}</legend>
          <div className="flex flex-wrap gap-1">
            {listColors.map((c, i) => (
              <button
                key={c}
                type="button"
                className="px-icon-btn"
                aria-pressed={color === c}
                aria-label={t('lists.colorName', { n: i + 1 })}
                onClick={() => setColor(c)}
              >
                <span className="inline-block size-5 border-2 border-black" style={{ background: c }} />
              </button>
            ))}
          </div>
        </fieldset>

        {listId !== INBOX_LIST_ID ? (
          <>
            <label htmlFor={ids.group} className="font-title text-[0.55rem] text-win-accent">
              {t('lists.group')}
            </label>
            <select id={ids.group} className="px-input" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">{t('lists.noGroup')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
