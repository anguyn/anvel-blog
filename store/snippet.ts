import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SnippetFilter {
  language: string | null;
  tags: string[];
  search: string;
}

interface SnippetStore {
  filters: SnippetFilter;
  setLanguage: (language: string | null) => void;
  setTags: (tags: string[]) => void;
  setSearch: (search: string) => void;
  clearFilters: () => void;
}

export const useSnippetStore = create<SnippetStore>(set => ({
  filters: {
    language: null,
    tags: [],
    search: '',
  },
  setLanguage: language =>
    set(state => ({
      filters: { ...state.filters, language },
    })),
  setTags: tags =>
    set(state => ({
      filters: { ...state.filters, tags },
    })),
  setSearch: search =>
    set(state => ({
      filters: { ...state.filters, search },
    })),
  clearFilters: () =>
    set({
      filters: {
        language: null,
        tags: [],
        search: '',
      },
    }),
}));
