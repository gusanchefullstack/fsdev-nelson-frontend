import { create } from 'zustand';

export type ThemePreference = 'SYSTEM' | 'LIGHT' | 'DARK';
type Resolved = 'light' | 'dark';

const STORAGE_KEY = 'nelson.theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function resolve(pref: ThemePreference): Resolved {
  if (pref === 'SYSTEM') return media().matches ? 'dark' : 'light';
  return pref === 'DARK' ? 'dark' : 'light';
}

function readStored(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'LIGHT' || v === 'DARK' || v === 'SYSTEM' ? v : 'SYSTEM';
  } catch {
    return 'SYSTEM';
  }
}

interface ThemeState {
  preference: ThemePreference;
  resolved: Resolved;
  setPreference: (pref: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const preference = readStored();
  return {
    preference,
    resolved: resolve(preference),
    setPreference: (pref) => {
      try {
        localStorage.setItem(STORAGE_KEY, pref);
      } catch {
        /* storage unavailable: keep in memory only */
      }
      set({ preference: pref, resolved: resolve(pref) });
    },
  };
});

/** Keeps <html data-theme> in sync with the store and the OS setting (FR-045). */
export function initTheme(): void {
  const apply = () => {
    document.documentElement.dataset.theme = useThemeStore.getState().resolved;
  };
  apply();
  useThemeStore.subscribe(apply);
  media().addEventListener('change', () => {
    const { preference } = useThemeStore.getState();
    if (preference === 'SYSTEM') useThemeStore.setState({ resolved: resolve('SYSTEM') });
  });
}
