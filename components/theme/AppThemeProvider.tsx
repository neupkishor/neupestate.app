import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'Dark' | 'Light' | 'System';

const palettes = {
  light: { background: '#ffffff', surface: '#ffffff', navigation: '#f1f3f5', text: '#173d35', muted: '#71817b', border: '#e3ebe6', subtle: '#eaf2e3', accent: '#4c7953' },
  dark: { background: '#101815', surface: '#19231e', navigation: '#19211d', text: '#edf5ee', muted: '#a6b5ad', border: '#34443b', subtle: '#29392f', accent: '#b3d49f' },
} as const;

type Palette = { background: string; surface: string; navigation: string; text: string; muted: string; border: string; subtle: string; accent: string };
type ThemeContextValue = { preference: ThemePreference; isDark: boolean; colors: Palette; setPreference: (value: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('System');

  useEffect(() => {
    void SecureStore.getItemAsync('settings.theme').then((saved) => {
      if (saved === 'Dark' || saved === 'Light' || saved === 'System') setPreferenceState(saved);
    }).catch((error) => console.warn('Unable to load theme preference:', error));
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    void SecureStore.setItemAsync('settings.theme', value).catch((error) => console.warn('Unable to save theme preference:', error));
  }, []);

  const isDark = preference === 'Dark' || (preference === 'System' && systemScheme === 'dark');
  const value = useMemo(() => ({ preference, isDark, colors: isDark ? palettes.dark : palettes.light, setPreference }), [preference, isDark, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return context;
}
