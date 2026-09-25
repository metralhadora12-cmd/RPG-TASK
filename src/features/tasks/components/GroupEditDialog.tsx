import { useEffect, useId, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import { Dialog } from '@/ui/Dialog';

export function GroupEditDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const group = useGameStore((s) => s.groups.find((g) => g.id === groupId));
  const [name, setName] = useState(group?.name ?? '');
  const nameRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    nameRef.current?.select();
  }, []);

  if (!group) return null;
  const save = () => {
    useGameStore.getState().updateGroup(groupId, { name: name.trim() || group.name });
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('lists.group.editTitle')}
      initialFocusRef={nameRef}
      actions={[
        { label: t('lists.save'), variant: 'solid', onSelect: save },
        { label: t('common.cancel'), onSelect: onClose },
        {
          label: t('lists.group.delete'),
          variant: 'danger',
          onSelect: () => {
            useGameStore.getState().deleteGroup(groupId);
            onClose();
          },
        },
      ]}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label htmlFor={id} className="font-title text-[0.55rem] text-win-accent">
          {t('lists.name')}
        </label>
        <input
          ref={nameRef}
          id={id}
          className="px-input mt-1"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Dialog>
  );
}
