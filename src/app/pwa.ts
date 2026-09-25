import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import { t } from '@/lib/i18n';
import { showToast } from '@/ui/toastStore';

/** Registra o service worker e avisa quando o app está pronto offline ou há versão nova. */
export function setupPwa() {
  // No APK (Capacitor) os arquivos já estão no aparelho: o service worker só serve no navegador.
  if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator)) return;
  const update = registerSW({
    onOfflineReady() {
      showToast({ message: t('pwa.offline') });
    },
    onNeedRefresh() {
      showToast({
        message: t('pwa.update'),
        actionLabel: t('pwa.reload'),
        duration: 60_000,
        onAction: () => void update(true),
      });
    },
  });
}
