import { useState } from 'react';
import { t } from '@/lib/i18n';
import { HeroArt } from '@/sprites/HeroArt';
import { useGameStore } from '@/store/useGameStore';
import { useFxStore } from '@/features/progression/fxStore';
import { Dialog } from '@/ui/Dialog';

/** Lúmen, a mentora: usa a arte da clériga. */

const STEPS = ['mentor.1', 'mentor.2', 'mentor.3'] as const;

/** Três diálogos curtos explicando o básico, na primeira vez que o herói entra no jogo. */
export function Onboarding() {
  const show = useGameStore((s) => !s.onboardingDone && Boolean(s.character.name));
  const name = useGameStore((s) => s.character.name);
  const finish = useGameStore((s) => s.finishOnboarding);
  const busy = useFxStore((s) => Boolean(s.levelUp));
  const [step, setStep] = useState(0);
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
          <HeroArt classId="cleric" scale={2} label={t('mentor.name')} />
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
