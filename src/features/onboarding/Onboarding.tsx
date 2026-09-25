import { useMemo, useState } from 'react';
import { equipmentFor } from '@/features/shop/equipment';
import { t } from '@/lib/i18n';
import { CharacterSprite } from '@/sprites/CharacterSprite';
import type { CharacterLook } from '@/sprites/compose';
import { useGameStore } from '@/store/useGameStore';
import { useFxStore } from '@/features/progression/fxStore';
import { Dialog } from '@/ui/Dialog';

/** Lúmen, a mentora (NPC original montado com peças do jogo). */
const mentorLook: CharacterLook = {
  classId: 'mage',
  appearance: { body: 'a', skin: 1, hairStyle: 3, hairColor: 7, eyes: 4, outfit: 1 },
};
const MENTOR_ITEMS = { hat: 'hat-wizard-astral', weapon: 'wpn-staff-arcane', armor: 'armor-oracle' };

const STEPS = ['mentor.1', 'mentor.2', 'mentor.3'] as const;

/** Três diálogos curtos explicando o básico, na primeira vez que o herói entra no jogo. */
export function Onboarding() {
  const show = useGameStore((s) => !s.onboardingDone && Boolean(s.character.name));
  const name = useGameStore((s) => s.character.name);
  const finish = useGameStore((s) => s.finishOnboarding);
  const busy = useFxStore((s) => Boolean(s.levelUp));
  const [step, setStep] = useState(0);
  const equipment = useMemo(() => equipmentFor(MENTOR_ITEMS), []);
  if (!show || busy) return null;

  const last = step === STEPS.length - 1;
  return (
    <Dialog
      key={step}
      open
      onClose={finish}
      title={`${t('mentor.name')} (${step + 1}/${STEPS.length})`}
      text={t(STEPS[step]!, { name })}
      portrait={
        <div className="stage">
          <CharacterSprite look={mentorLook} equipment={equipment} scale={3} label={t('mentor.name')} />
        </div>
      }
      actions={[
        {
          label: last ? t('mentor.done') : t('mentor.next'),
          variant: 'solid',
          onSelect: () => (last ? finish() : setStep((n) => n + 1)),
        },
        ...(last ? [] : [{ label: t('mentor.skip'), onSelect: finish }]),
      ]}
    />
  );
}
