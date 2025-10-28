export interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  createdAt: Date;
}

export interface Snippet {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
  };
  complexity: string | null;
  isPublic: boolean;
  viewCount: number;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
  };
  tags: {
    tag: Tag;
  }[];
  _count?: {
    favorites: number;
  };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  type: 'LANGUAGE' | 'TOPIC';
  _count?: {
    snippets: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Language {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

export interface SearchResults {
  snippets: Snippet[];
  tags: Tag[];
  users: User[];
}
