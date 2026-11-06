import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { NumberingSystem } from '@neup/numbering-system';

const NUMBERING_SYSTEM_KEY = 'settings.numberingSystem';
const DEFAULT_NUMBERING_SYSTEM: NumberingSystem = 'International';

type NumberingSystemContextValue = {
  numberingSystem: NumberingSystem;
  setNumberingSystem: (system: NumberingSystem) => void;
};

const NumberingSystemContext = createContext<NumberingSystemContextValue | null>(null);

/** Loads and shares the user's number grouping preference across app screens. */
export function NumberingSystemProvider({ children }: PropsWithChildren) {
  const [numberingSystem, setNumberingSystemState] = useState<NumberingSystem>(DEFAULT_NUMBERING_SYSTEM);
  const preferenceChanged = useRef(false);

  useEffect(() => {
    void SecureStore.getItemAsync(NUMBERING_SYSTEM_KEY).then((saved) => {
      if (!preferenceChanged.current && isNumberingSystem(saved)) setNumberingSystemState(saved);
    }).catch(() => {});
  }, []);

  const setNumberingSystem = useCallback((system: NumberingSystem) => {
    preferenceChanged.current = true;
    setNumberingSystemState(system);
    void SecureStore.setItemAsync(NUMBERING_SYSTEM_KEY, system).catch(() => {});
  }, []);

  const value = useMemo(() => ({ numberingSystem, setNumberingSystem }), [numberingSystem, setNumberingSystem]);
  return <NumberingSystemContext.Provider value={value}>{children}</NumberingSystemContext.Provider>;
}

/** Reads the current number grouping preference from the app provider. */
export function useNumberingSystem() {
  const context = useContext(NumberingSystemContext);
  if (!context) throw new Error('useNumberingSystem must be used inside NumberingSystemProvider');
  return context;
}

/** Checks whether a stored preference is a supported grouping system. */
function isNumberingSystem(value: string | null): value is NumberingSystem {
  return value != null && [
    'Indian', 'Nepali', 'Indian.readable', 'Nepali.readable', 'Indian.readable2', 'Nepali.readable2',
    'Indian.readable.devanagari', 'Nepali.readable.devanagari', 'Chinese', 'Japanese', 'Korean',
    'France', 'Germany', 'Switzerland', 'International',
  ].includes(value);
}
