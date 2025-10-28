import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LocaleProps } from '@/i18n/config';
import { useTransition } from 'react';

interface LocaleState {
  locale: LocaleProps;
  isChanging: boolean;
  isHydrated: boolean;

  setLocale: (locale: LocaleProps) => void;
  setChanging: (changing: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

const setLocaleCookie = (locale: LocaleProps) => {
  if (typeof document === 'undefined') return;
  document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
};

const applyLocaleToDOM = (locale: LocaleProps) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      isChanging: false,
      isHydrated: false,

      setLocale: (locale: LocaleProps) => {
        applyLocaleToDOM(locale);
        setLocaleCookie(locale);
        set({ locale });
      },

      setChanging: (isChanging: boolean) => set({ isChanging }),
      setHydrated: (isHydrated: boolean) => set({ isHydrated }),
    }),
    {
      name: 'bus-locale',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ locale: state.locale }),
      skipHydration: true,
    },
  ),
);
