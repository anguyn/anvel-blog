import { useThemeStore } from '@/store/theme';

export function useSafeTheme() {
  const store = useThemeStore();

  if (!store.isHydrated) {
    return {
      theme: 'system' as const,
      resolvedTheme: 'light' as const,
      isDark: false,
      isLight: true,
      setTheme: store.setTheme,
      toggleTheme: store.toggleTheme,
      isHydrated: false,
    };
  }

  return store;
}
