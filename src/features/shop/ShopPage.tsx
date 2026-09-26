import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { originOf, spawnCoins, spawnFloats } from '@/features/progression/fxStore';
import { useToday } from '@/features/tasks/useToday';
import { t, type MessageKey } from '@/lib/i18n';
import { CharacterSprite } from '@/sprites/CharacterSprite';
import { owns } from '@/store/shopActions';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/ui/Button';
import { CursorSlot } from '@/ui/Cursor';
import { Dialog } from '@/ui/Dialog';
import { palette, themes, themeToCssVars } from '@/ui/palette';
import { Tabs } from '@/ui/Tabs';
import { useMediaQuery } from '@/ui/useMediaQuery';
import { useMenuNavigation } from '@/ui/useMenuNavigation';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useTypewriter } from '@/ui/useTypewriter';
import { Window } from '@/ui/Window';
import { catalog, categories, getItem, slotOf, type ItemCategory, type Rarity, type ShopItem } from './catalog';
import { HeroSprite } from './HeroSprite';
import { HeroStage } from './HeroStage';
import { ItemIcon } from './ItemIcon';
import { merchantEquipment, merchantLook } from './merchant';
import { dailyOffers, priceFor } from './offers';

type Tab = 'offers' | ItemCategory;

export const rarityColor: Record<Rarity, string> = {
  common: palette.rarityCommon,
  uncommon: palette.rarityUncommon,
  rare: palette.rarityRare,
  epic: palette.rarityEpic,
  legendary: palette.rarityLegendary,
};

const itemName = (item: ShopItem) => t(`item.${item.id}` as MessageKey);
const itemDesc = (item: ShopItem) => t(`item.${item.id}.desc` as MessageKey);

function MerchantWindow({ message }: { message: string }) {
  const reduced = useReducedMotion();
  const { shown, done } = useTypewriter(message, { instant: reduced });
  return (
    <Window className="flex items-end gap-4">
      <div className="stage shrink-0">
        <CharacterSprite look={merchantLook} equipment={merchantEquipment} scale={2} label={t('shop.merchant')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-title mb-2 text-[0.6rem] text-win-accent">{t('shop.merchant')}</p>
        <p className="min-h-[2lh] text-shadow-pixel" aria-live="polite">
          <span aria-hidden={!done}>{shown}</span>
          {!done ? <span className="sr-only">{message}</span> : null}
        </p>
      </div>
    </Window>
  );
}

/** Amostra de janela com as cores do tema (prévia de tema). */
function ThemeSample({ item }: { item: Extract<ShopItem, { category: 'theme' }> }) {
  const style = themeToCssVars(themes[item.theme]) as CSSProperties;
  return (
    <div style={style} className="rounded p-2" aria-hidden>
      <div className="win">
        <p className="win-title">{itemName(item)}</p>
        <p className="text-shadow-pixel">{t('shop.greeting')}</p>
      </div>
    </div>
  );
}

export function ShopPage() {
  const character = useGameStore((s) => s.character);
  const today = useToday();
  const offers = useMemo(() => dailyOffers(today), [today]);
  const [tab, setTab] = useState<Tab>('offers');
  const [selectedId, setSelectedId] = useState<string | null>(offers[0] ?? null);
  const [message, setMessage] = useState(t('shop.greetingOffers'));
  const [confirming, setConfirming] = useState(false);
  const buyRef = useRef<HTMLButtonElement>(null);
  const wide = useMediaQuery('(min-width: 1024px)');
  const medium = useMediaQuery('(min-width: 640px)');
  const columns = wide ? 4 : medium ? 3 : 2;

  const items = useMemo(
    () => (tab === 'offers' ? offers.map((id) => getItem(id)!) : catalog.filter((i) => i.category === tab)),
    [tab, offers],
  );
  const selected = getItem(selectedId ?? undefined);

  useEffect(() => {
    if (!items.some((i) => i.id === selectedId)) setSelectedId(items[0]?.id ?? null);
    // Ao trocar de aba, a seleção vai para o primeiro item.
  }, [items]);

  const status = (item: ShopItem) => {
    const owned = item.category !== 'consumable' && owns(character, item.id);
    const equipped = item.category !== 'consumable' && character.equipped[slotOf[item.category]] === item.id;
    const qty = character.inventory.find((i) => i.itemId === item.id)?.qty ?? 0;
    return { owned, equipped, qty, price: priceFor(item, today), locked: character.level < item.minLevel };
  };

  const tryBuy = () => {
    if (!selected) return;
    const st = status(selected);
    if (st.owned) return setMessage(t('shop.owned'));
    if (st.locked) return setMessage(t('shop.lowLevel'));
    if (character.gold < st.price) return setMessage(t('shop.noGold'));
    setConfirming(true);
  };

  const confirmBuy = () => {
    setConfirming(false);
    if (!selected) return;
    const result = useGameStore.getState().buyItem(selected.id);
    if (!result.ok) {
      setMessage(t(result.reason === 'gold' ? 'shop.noGold' : result.reason === 'level' ? 'shop.lowLevel' : 'shop.owned'));
      return;
    }
    const origin = originOf(buyRef.current);
    spawnCoins(origin);
    spawnFloats(origin, [{ kind: 'gold', text: `−${result.price} G` }]);
    setMessage(t('shop.thanks'));
  };

  const toggleEquip = () => {
    if (!selected || selected.category === 'consumable') return;
    const store = useGameStore.getState();
    if (status(selected).equipped) store.unequip(slotOf[selected.category]);
    else store.equipItem(selected.id);
  };

  const nav = useMenuNavigation({
    count: items.length,
    orientation: 'grid',
    columns,
    onMove: (i) => setSelectedId(items[i]?.id ?? null),
    onSelect: (i) => {
      setSelectedId(items[i]?.id ?? null);
      buyRef.current?.focus();
    },
  });

  const previewEquipped =
    selected && selected.category !== 'consumable' && selected.category !== 'theme'
      ? { ...character.equipped, [slotOf[selected.category]]: selected.id }
      : character.equipped;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'offers', label: t('shop.cat.offers') },
    ...categories.map((c) => ({ id: c as Tab, label: t(`shop.cat.${c}`) })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <MerchantWindow message={message} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Window aria-label={t('shop.items')}>
          <Tabs aria-label={t('shop.categories')} tabs={tabs} value={tab} onChange={setTab}>
            {tab === 'offers' ? <p className="mb-2 text-win-dim">{t('shop.offersTitle')} · −20%</p> : null}
            <ul
              aria-label={t('shop.items')}
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              onKeyDown={nav.onKeyDown}
            >
              {items.map((item, i) => {
                const st = status(item);
                const onOffer = offers.includes(item.id);
                // Passar o mouse não troca a seleção (senão, ao fechar o diálogo de compra, o cartão sob o cursor roubaria a vez).
                const { onMouseEnter: _hover, ...cardProps } = nav.getItemProps(i);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="shop-card"
                      style={{ borderColor: rarityColor[item.rarity] }}
                      aria-current={item.id === selectedId || undefined}
                      aria-label={t('shop.itemLabel', {
                        item: itemName(item),
                        rarity: t(`rarity.${item.rarity}`),
                        price: st.price,
                      })}
                      {...cardProps}
                    >
                      <CursorSlot visible={nav.activeIndex === i} />
                      <span className="flex h-14 items-center justify-center">
                        <ItemIcon item={item} />
                      </span>
                      <span className="line-clamp-2 w-full text-center leading-tight text-shadow-pixel">{itemName(item)}</span>
                      <span className="flex flex-wrap items-center justify-center gap-x-2 text-base">
                        {onOffer ? <s className="text-win-dim">{item.price}</s> : null}
                        <span className="text-win-accent">{t('shop.price', { n: st.price })}</span>
                        {st.locked ? <span className="text-win-dim">🔒{t('shop.levelReq', { n: item.minLevel })}</span> : null}
                      </span>
                      {st.equipped ? (
                        <span className="shop-badge">{t('shop.equippedBadge')}</span>
                      ) : st.owned ? (
                        <span className="shop-badge">{t('shop.ownedBadge')}</span>
                      ) : st.qty > 0 ? (
                        <span className="shop-badge">{t('shop.qty', { n: st.qty })}</span>
                      ) : onOffer ? (
                        <span className="shop-badge">{t('shop.offerBadge')}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Tabs>
        </Window>

        <Window title={t('shop.preview')} className="flex flex-col gap-3" aria-live="polite">
          {selected ? (
            <>
              {selected.category === 'theme' ? (
                <ThemeSample item={selected} />
              ) : selected.category === 'consumable' ? (
                <div className="stage flex justify-center py-6">
                  <ItemIcon item={selected} scale={4} />
                </div>
              ) : (
                <HeroStage equipped={previewEquipped} scale={4} width={256}>
                  <span className="flex items-end gap-3">
                    <HeroSprite equipped={previewEquipped} scale={2} />
                    {selected.category !== 'background' && selected.category !== 'pet' ? (
                      <span className="mb-2">
                        <ItemIcon item={selected} scale={2} />
                      </span>
                    ) : null}
                  </span>
                </HeroStage>
              )}
              <div>
                <p className="font-title text-[0.65rem]" style={{ color: rarityColor[selected.rarity] }}>
                  {itemName(selected)}
                </p>
                <p className="text-win-dim">
                  {t(`rarity.${selected.rarity}`)} · {t('shop.levelReq', { n: selected.minLevel })}
                </p>
                <p className="mt-1 text-shadow-pixel">{itemDesc(selected)}</p>
                <p className="mt-1 text-base text-win-dim">
                  {selected.category === 'consumable' ? '' : t('shop.cosmetic')}
                </p>
              </div>
              <p className="text-win-accent text-shadow-pixel">
                {t('shop.price', { n: status(selected).price })}
                {offers.includes(selected.id) ? (
                  <span className="ml-2 text-win-dim">({t('shop.priceWas', { n: selected.price })})</span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  ref={buyRef}
                  variant="solid"
                  onClick={tryBuy}
                  disabled={status(selected).owned}
                >
                  {t('shop.buy')}
                </Button>
                {status(selected).owned ? (
                  <Button onClick={toggleEquip}>{t(status(selected).equipped ? 'shop.unequip' : 'shop.equip')}</Button>
                ) : null}
                {selected.category === 'consumable' && status(selected).qty > 0 ? (
                  <Link to="/personagem/equipamento" className="px-btn">
                    {t('shop.use')}
                  </Link>
                ) : null}
              </div>
              {status(selected).locked ? <p className="text-win-dim">{t('shop.needLevel', { n: selected.minLevel })}</p> : null}
            </>
          ) : (
            <p className="text-win-dim">{t('shop.selectItem')}</p>
          )}
        </Window>
      </div>

      <Dialog
        open={confirming && Boolean(selected)}
        onClose={() => setConfirming(false)}
        title={t('shop.buy')}
        text={selected ? t('shop.confirm', { item: itemName(selected), n: status(selected).price }) : ''}
        actions={[
          { label: t('common.yes'), variant: 'solid', onSelect: confirmBuy },
          { label: t('common.no'), onSelect: () => setConfirming(false) },
        ]}
      />
    </div>
  );
}
