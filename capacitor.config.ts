import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.questlog.rpg',
  appName: 'QuestLog',
  webDir: 'dist',
  backgroundColor: '#050514',
  android: {
    // O app é 100% offline: nada de conteúdo misto nem depuração no release.
    allowMixedContent: false,
  },
};

export default config;
