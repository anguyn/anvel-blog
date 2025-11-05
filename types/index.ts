export interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;

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

// export interface Tag {
//   id: string;
//   name: string;
//   slug: string;
//   type: 'LANGUAGE' | 'TOPIC';
//   _count?: {
//     snippets: number;
//   };
// }

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

// ============================================
// ADMIN DASHBOARD TYPE DEFINITIONS
// ============================================

// User Types
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  status: UserStatus;
  emailVerified: Date | null;
  roleId: string | null;
  role: Role | null;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  _count?: {
    posts: number;
    comments: number;
    sessions: number;
  };
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  PENDING = 'PENDING',
}

export interface UserAction {
  type:
    | 'ban'
    | 'suspend'
    | 'activate'
    | 'delete'
    | 'reset_password'
    | 'resend_verification'
    | 'revoke_sessions';
  reason?: string;
  duration?: number; // days for suspension
}

export interface AdminUserFormData {
  name: string | null;
  email: string;
  username: string | null;
  password: string | null;
  image?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  twitter?: string | null;
  github?: string | null;
  linkedin?: string | null;
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  status?: UserStatus;
  emailVerified?: Date | null;
  roleId: string | null;
  role?: Role | null;
  twoFactorEnabled?: boolean;
}

export interface AdminUserUpdateData {
  name: string | null;
  email: string;
  username: string | null;
  password: string | null;
  image?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  twitter?: string | null;
  github?: string | null;
  linkedin?: string | null;
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  status?: UserStatus;
  emailVerified?: Date | null;
  roleId: string | null;
  role?: Role | null;
  twoFactorEnabled?: boolean;
}

// ==================== ROLES & PERMISSIONS ====================
export interface Role {
  id: string;
  name: string;
  description: string | null;
  level: number;
  isSystem: boolean;
  color: string | null;
  permissions: RolePermission[];
  _count?: {
    users: number;
    permissions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
  _count?: {
    roles: number;
  };
}

export interface PermissionFormData {
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

// ==================== SESSIONS ====================
export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  expires: Date;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface RevokedSession {
  id: string;
  userId: string;
  sessionToken: string;
  reason: string | null;
  revokedAt: Date;
  expiresAt: Date;
}

// ==================== ACTIVITY LOGS ====================
export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  importance: LogLevel;
  createdAt: Date;
  user?: {
    name: string | null;
    email: string;
  };
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// ==================== SYSTEM CONFIG ====================
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  type: ConfigType;
  category: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export enum ConfigType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  DURATION = 'DURATION',
}

export interface ConfigHistory {
  id: string;
  configKey: string;
  oldValue: string | null;
  newValue: string;
  changedBy: string | null;
  reason: string | null;
  createdAt: Date;
}

// ==================== FEATURE FLAGS ====================
export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  percentage: number;
  rules: any;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== POSTS ====================
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: PostStatus;
  visibility: PostVisibility;
  type: PostType;
  isFeatured: boolean;
  isPinned: boolean;
  featuredImage: string | null;
  publishedAt: Date | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  authorId: string;
  author: {
    name: string | null;
    email: string;
    image: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  UNLISTED = 'UNLISTED',
  PRIVATE = 'PRIVATE',
  PASSWORD = 'PASSWORD',
  RESTRICTED = 'RESTRICTED',
}

export enum PostType {
  ARTICLE = 'ARTICLE',
  GALLERY = 'GALLERY',
  VIDEO = 'VIDEO',
  SNIPPET = 'SNIPPET',
  DOCUMENT = 'DOCUMENT',
  PORTFOLIO = 'PORTFOLIO',
  LINK = 'LINK',
}

// ==================== COMMENTS ====================
export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  status: CommentStatus;
  isEdited: boolean;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    name: string | null;
    email: string;
    image: string | null;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
  _count?: {
    replies: number;
  };
}

export enum CommentStatus {
  PUBLISHED = 'PUBLISHED',
  PENDING = 'PENDING',
  SPAM = 'SPAM',
  DELETED = 'DELETED',
}

// ==================== CATEGORIES & TAGS ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  language: string;
  _count?: {
    posts: number;
    children: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;
  color: string | null;
  _count?: {
    posts: number;
    snippets: number;
  };
  createdAt: Date;
}

export enum TagType {
  LANGUAGE = 'LANGUAGE',
  TOPIC = 'TOPIC',
  TECHNOLOGY = 'TECHNOLOGY',
  CATEGORY = 'CATEGORY',
}

// ==================== MEDIA ====================
export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  url: string;
  thumbnailUrl: string | null;
  storageKey: string;
  type: MediaType;
  alt: string | null;
  caption: string | null;
  status: MediaStatus;
  uploadedById: string;
  uploadedBy: {
    name: string | null;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER',
}

export enum MediaStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

// ==================== CONTACT MESSAGES ====================
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string | null;
    email: string;
  };
}

export enum ContactStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  RESPONDED = 'RESPONDED',
  ARCHIVED = 'ARCHIVED',
}

// ==================== EMAIL SUBSCRIPTIONS ====================
export interface EmailSubscription {
  id: string;
  email: string;
  userId: string | null;
  authorId: string;
  isActive: boolean;
  frequency: EmailFrequency;
  categories: string[];
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  author: {
    name: string | null;
    email: string;
  };
  user?: {
    name: string | null;
  };
}

export enum EmailFrequency {
  IMMEDIATE = 'IMMEDIATE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

// ==================== DASHBOARD STATS ====================
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  posts: {
    total: number;
    published: number;
    draft: number;
    views?: number;
  };
  comments: {
    total: number;
    pending: number;
    spam: number;
  };
  media: {
    total: number;
    size: number;
    thisMonth: number;
  };
  recentActivity: ActivityLog[];
  topPosts: Post[];
  recentUsers: AdminUser[];
}

// ==================== API RESPONSES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== FILTERS ====================
export interface BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters extends BaseFilters {
  status?: UserStatus | 'all';
  roleId?: string | 'all';
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
}

export interface PostFilters extends BaseFilters {
  status?: PostStatus | 'all';
  visibility?: PostVisibility | 'all';
  type?: PostType | 'all';
  authorId?: string | 'all';
  categoryId?: string | 'all';
  sortBy?: 'title' | 'createdAt' | 'publishedAt' | 'viewCount';
}

export interface CommentFilters extends BaseFilters {
  status?: CommentStatus | 'all';
  postId?: string | 'all';
  sortBy?: 'createdAt' | 'likeCount';
}

export interface ActivityLogFilters extends BaseFilters {
  action?: string | 'all';
  entity?: string | 'all';
  userId?: string | 'all';
  importance?: LogLevel | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt';
}

export interface MediaFilters extends BaseFilters {
  type?: MediaType | 'all';
  status?: MediaStatus | 'all';
  uploadedById?: string | 'all';
  sortBy?: 'createdAt' | 'size';
}

// ==================== MODAL & UI STATE ====================
export type ModalMode = 'create' | 'edit' | 'view';

export interface ModalState<T = any> {
  isOpen: boolean;
  mode: ModalMode;
  data?: T;
}

export interface BulkAction {
  ids: string[];
  action: string;
  metadata?: any;
}
