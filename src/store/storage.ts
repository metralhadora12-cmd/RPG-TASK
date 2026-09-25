import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/** Adaptador de `persist` do Zustand sobre IndexedDB (idb-keyval). */
export const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};
