// stores/useColorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ColorState = {
  textColors: string[];
  highlightColors: string[];
  addTextColor: (color: string) => void;
  addHighlightColor: (color: string) => void;
  removeTextColor: (color: string) => void;
  removeHighlightColor: (color: string) => void;
};

export const useColorStore = create<ColorState>()(
  persist(
    set => ({
      textColors: [],
      highlightColors: [],

      addTextColor: (color: string) =>
        set(state => ({
          textColors: [...new Set([...state.textColors, color])].slice(-12),
        })),

      addHighlightColor: (color: string) =>
        set(state => ({
          highlightColors: [
            ...new Set([...state.highlightColors, color]),
          ].slice(-12),
        })),

      removeTextColor: (color: string) =>
        set(state => ({
          textColors: state.textColors.filter(c => c !== color),
        })),

      removeHighlightColor: (color: string) =>
        set(state => ({
          highlightColors: state.highlightColors.filter(c => c !== color),
        })),
    }),
    {
      name: 'color-store',
    },
  ),
);
