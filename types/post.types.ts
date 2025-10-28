import {
  Post as PostPrisma,
  PostStatus,
  PostVisibility,
  PostType,
  ContentFormat,
} from '@prisma/client';

export interface Post extends PostPrisma {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentFormat: 'MARKDOWN' | 'HTML' | 'RICH_TEXT';

  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  ogImage: string | null;

  type:
    | 'ARTICLE'
    | 'GALLERY'
    | 'VIDEO'
    | 'SNIPPET'
    | 'DOCUMENT'
    | 'PORTFOLIO'
    | 'LINK';
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | 'DELETED';
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | 'PASSWORD' | 'RESTRICTED';

  isPasswordProtected: boolean;
  passwordHash: string | null;

  isFeatured: boolean;
  isPinned: boolean;
  featuredImage: string | null;

  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  readingTime: number | null;

  authorId: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    email: string;
    image: string | null;
    bio: string | null;
  };

  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  } | null;

  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
      type: 'LANGUAGE' | 'TOPIC' | 'TECHNOLOGY' | 'CATEGORY';
      color: string | null;
    };
  }>;

  media: Array<{
    id: string;
    media: MediaItem & { id: string };
    order: number;
  }>;

  translations?: Array<{
    id: string;
    language: string;
    title: string;
    excerpt: string | null;
    content: string;
    slug: string;
  }>;

  _count?: {
    comments: number;
    favorites: number;
    views: number;
  };
}

// ============================================
// POST FILTERS & QUERIES
// ============================================

export interface PostFilters {
  status?: PostStatus[];
  type?: PostType[];
  visibility?: PostVisibility[];
  categoryId?: string;
  tags?: string[];
  authorId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isFeatured?: boolean;
  isPinned?: boolean;
}

export interface PostSortOptions {
  field:
    | 'createdAt'
    | 'updatedAt'
    | 'publishedAt'
    | 'viewCount'
    | 'title'
    | 'likeCount';
  order: 'asc' | 'desc';
}

export interface PostPagination {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface PostListParams {
  filters?: PostFilters;
  sort?: PostSortOptions;
  pagination?: PostPagination;
}

// ============================================
// POST FORM DATA
// ============================================

export interface PostFormData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  contentFormat?: ContentFormat;

  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;

  type?: PostType;
  status?: PostStatus;
  visibility?: PostVisibility;

  isPasswordProtected?: boolean;
  password?: string;
  allowedUserEmails?: string[];

  isFeatured?: boolean;
  isPinned?: boolean;
  featuredImage?: string;

  categoryId?: string;
  tags?: string[];

  publishedAt?: Date;
  scheduledFor?: Date;

  mediaIds?: string[];
  readingTime?: number;
}

// ============================================
// POST WITH RELATIONS
// ============================================

export interface PostAuthor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio?: string | null;
}

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
}

export interface PostTagItem {
  tag: {
    id: string;
    name: string;
    slug: string;
    type: string;
    color?: string | null;
  };
}

export interface PostMediaItem {
  id: string;
  order: number;
  media: MediaItem;
}

export interface PostWithRelations extends PostPrisma {
  author: PostAuthor;
  category?: PostCategory | null;
  tags: PostTagItem[];
  media?: PostMediaItem[];
  _count?: {
    comments: number;
    views: number;
    favorites: number;
  };
}

// ============================================
// API RESPONSES
// ============================================

export interface PostListResponse {
  posts: PostWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: PostFilters;
}

export interface PostDetailResponse {
  post: PostWithRelations;
  relatedPosts?: PostWithRelations[];
  translations?: {
    language: string;
    title: string;
    slug: string;
  }[];
}

export interface CreatePostResponse {
  success: boolean;
  post?: PostWithRelations;
  error?: string;
}

export interface UpdatePostResponse {
  success: boolean;
  post?: PostWithRelations;
  error?: string;
}

export interface DeletePostResponse {
  success: boolean;
  error?: string;
}

// ============================================
// LAYOUT CONFIGS
// ============================================

export type PostLayout =
  | 'article-standard'
  | 'article-featured-image'
  | 'article-full-width'
  | 'gallery-grid'
  | 'gallery-masonry'
  | 'gallery-carousel'
  | 'video-player'
  | 'video-playlist'
  | 'document-viewer';

export interface PostLayoutConfig {
  layout: PostLayout;
  settings?: {
    columns?: number;
    aspectRatio?: string;
    autoplay?: boolean;
    showThumbnails?: boolean;
    [key: string]: any;
  };
}

// ============================================
// COMMENTS
// ============================================

export interface CommentFormData {
  content: string;
  postId: string;
  parentId?: string;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  likeCount: number;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  replies?: CommentWithAuthor[];
  _count?: {
    replies: number;
  };
}

// ============================================
// MEDIA UPLOAD
// ============================================

export interface MediaUploadData {
  file: File;
  alt?: string;
  caption?: string;
  postId?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
  caption: string | null;
  type: string;
  width: number | null;
  height: number | null;
  size: number;
  mimeType: string;
  filename: string;
  originalName: string;
  duration?: number;
}

// ============================================
// POST STATS
// ============================================

export interface PostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
}
