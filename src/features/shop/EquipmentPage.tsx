import { useState } from 'react';
import { Link } from 'react-router-dom';
import { spawnFloats } from '@/features/progression/fxStore';
import { t, type MessageKey } from '@/lib/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { Slot } from '@/store/types';
import { Button } from '@/ui/Button';
import { CursorSlot } from '@/ui/Cursor';
import { showToast } from '@/ui/toastStore';
import { useMenuNavigation } from '@/ui/useMenuNavigation';
import { Window } from '@/ui/Window';
import { catalog, getItem, POTION_ID, slotOf } from './catalog';
import { HeroSprite } from './HeroSprite';
import { HeroStage } from './HeroStage';
import { ItemIcon } from './ItemIcon';
import { rarityColor } from './ShopPage';

const slots: Slot[] = ['hat', 'armor', 'weapon', 'accessory', 'pet', 'background', 'theme'];
const itemName = (id: string) => t(`item.${id}` as MessageKey);

/** Tela de equipamento: espaços à esquerda, itens do espaço escolhido e a bolsa. */
export function EquipmentPage() {
  const character = useGameStore((s) => s.character);
  const [slot, setSlot] = useState<Slot>('hat');
  const ownedForSlot = catalog.filter(
    (item) =>
      item.category !== 'consumable' &&
      slotOf[item.category] === slot &&
      character.inventory.some((i) => i.itemId === item.id),
  );
  const options: (string | null)[] = [null, ...ownedForSlot.map((i) => i.id)];

  const slotNav = useMenuNavigation({
    count: slots.length,
    onMove: (i) => setSlot(slots[i]!),
    onSelect: (i) => {
      setSlot(slots[i]!);
      requestAnimationFrame(() => itemNav.setActiveIndex(0));
    },
  });

  const choose = (id: string | null) => {
    const store = useGameStore.getState();
    if (id) store.equipItem(id);
    else store.unequip(slot);
  };

  const itemNav = useMenuNavigation({
    count: options.length,
    onSelect: (i) => choose(options[i] ?? null),
    onCancel: () => slotNav.setActiveIndex(slots.indexOf(slot)),
  });

  const potions = character.inventory.find((i) => i.itemId === POTION_ID)?.qty ?? 0;
  const drink = (el: HTMLElement) => {
    const healed = useGameStore.getState().usePotion();
    if (healed > 0) {
      const r = el.getBoundingClientRect();
      spawnFloats({ x: r.left + r.width / 2, y: r.top }, [{ kind: 'heal', text: `+${healed} HP` }]);
      showToast({ message: t('equip.potionUsed', { n: healed }) });
    } else {
      showToast({ message: t('equip.hpFull') });
    }
  };

  const noneLabel = slot === 'armor' ? t('equip.starter') : slot === 'theme' ? t('equip.classic') : t('equip.none');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Window title={t('equip.title')}>
          <HeroStage scale={5} width={260}>
            <HeroSprite scale={5} label={character.name} />
          </HeroStage>
        </Window>
        <Window title={t('equip.consumables')}>
          {potions > 0 ? (
            <div className="flex items-center gap-3">
              <ItemIcon item={getItem(POTION_ID)!} />
              <span className="flex-1 text-shadow-pixel">
                {itemName(POTION_ID)} {t('shop.qty', { n: potions })}
              </span>
              <Button variant="solid" onClick={(e) => drink(e.currentTarget)}>
                {t('shop.use')}
              </Button>
            </div>
          ) : (
            <p className="text-win-dim">{t('equip.noConsumables')}</p>
          )}
        </Window>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        <Window title={t('equip.slots')}>
          <ul className="flex flex-col gap-0.5" onKeyDown={slotNav.onKeyDown}>
            {slots.map((s, i) => {
              const id = character.equipped[s];
              return (
                <li key={s}>
                  <button type="button" className="px-menu-item" aria-current={s === slot || undefined} {...slotNav.getItemProps(i)}>
                    <CursorSlot visible={slotNav.activeIndex === i} />
                    <span className="w-24 shrink-0 text-win-dim">{t(`equip.slot.${s}`)}</span>
                    <span className="truncate">
                      {id ? itemName(id) : s === 'armor' ? t('equip.starter') : s === 'theme' ? t('equip.classic') : t('equip.none')}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Window>

        <Window title={t('equip.choose', { slot: t(`equip.slot.${slot}`) })}>
          <ul className="flex flex-col gap-0.5" onKeyDown={itemNav.onKeyDown}>
            {options.map((id, i) => {
              const item = getItem(id ?? undefined);
              const equipped = (character.equipped[slot] ?? null) === id;
              return (
                <li key={id ?? 'none'}>
                  <button type="button" className="px-menu-item" aria-pressed={equipped} {...itemNav.getItemProps(i)}>
                    <CursorSlot visible={itemNav.activeIndex === i} />
                    {item ? (
                      <span className="mr-2 inline-flex w-10 justify-center">
                        <ItemIcon item={item} scale={1} />
                      </span>
                    ) : null}
                    <span className="truncate" style={item ? { color: rarityColor[item.rarity] } : undefined}>
                      {item ? itemName(item.id) : noneLabel}
                    </span>
                    {equipped ? <span className="ml-auto pl-2 text-win-accent">{t('shop.equippedBadge')}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {ownedForSlot.length === 0 ? (
            <p className="mt-2 text-win-dim">
              {t('equip.empty')}{' '}
              <Link to="/loja" className="text-win-accent underline">
                {t('equip.goShop')}
              </Link>
            </p>
          ) : null}
        </Window>
      </div>
    </div>
  );
}
