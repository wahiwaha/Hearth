import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Locale } from '../i18n/translations';

interface LanguageStoreContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageStoreContext = createContext<LanguageStoreContextType | null>(null);

export function LanguageStoreProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ko');

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  return (
    <LanguageStoreContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageStoreContext.Provider>
  );
}

export function useLanguageStore() {
  const context = useContext(LanguageStoreContext);
  if (!context) throw new Error('useLanguageStore must be used within LanguageStoreProvider');
  return context;
}
