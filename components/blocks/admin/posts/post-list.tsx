'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PostStatus, PostType, PostVisibility } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Badge } from '@/components/common/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  FileText,
  MoreVertical,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { deletePostAction } from '@/app/actions/post.action';
import { PostWithRelations, PostListResponse } from '@/types/post.types';
import { formatDistanceToNow } from 'date-fns';

interface PostsListClientProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  user: {
    id: string;
    roleName: string | null;
  };
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canPublish: boolean;
  };
}

export function PostsListClient({
  categories,
  tags,
  user,
  permissions,
}: PostsListClientProps) {
  const t = useTranslations('posts');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || '',
  );
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>(
    (searchParams.get('status') as PostStatus) || 'all',
  );
  const [typeFilter, setTypeFilter] = useState<PostType | 'all'>(
    (searchParams.get('type') as PostType) || 'all',
  );
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get('categoryId') || 'all',
  );

  // Load posts
  useEffect(() => {
    loadPosts();
  }, [searchParams]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      const page = searchParams.get('page') || '1';
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const type = searchParams.get('type') || '';
      const categoryId = searchParams.get('categoryId') || '';

      params.set('page', page);
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      if (categoryId) params.set('categoryId', categoryId);

      // If not admin, only show own posts
      if (user.roleName !== 'ADMIN') {
        params.set('authorId', user.id);
      }

      const response = await fetch(`/api/posts?${params.toString()}`);
      const data: PostListResponse = await response.json();

      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Load posts error:', error);
      toast.error(t('messages.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');

    startTransition(() => {
      router.push(`/admin/posts?${params.toString()}`);
    });
  };

  const handleSearch = () => {
    updateURL('search', searchQuery);
  };

  const handleDelete = async (postId: string, postTitle: string) => {
    if (!confirm(t('messages.confirmDelete', { title: postTitle }))) return;

    const result = await deletePostAction(postId);
    if (result.success) {
      toast.success(t('messages.deleteSuccess'));
      loadPosts();
    } else {
      toast.error(result.error || t('messages.deleteError'));
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/posts?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    router.push('/admin/posts');
  };

  const getStatusBadge = (status: PostStatus) => {
    const variants: Record<
      PostStatus,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      DRAFT: 'secondary',
      PUBLISHED: 'default',
      SCHEDULED: 'outline',
      ARCHIVED: 'secondary',
      DELETED: 'destructive',
    };

    return (
      <Badge variant={variants[status]}>
        {t(`status.${status.toLowerCase()}`)}
      </Badge>
    );
  };

  const getVisibilityIcon = (visibility: PostVisibility) => {
    const colors = {
      PUBLIC: 'text-green-600',
      PRIVATE: 'text-red-600',
      UNLISTED: 'text-blue-600',
      PASSWORD: 'text-yellow-600',
      RESTRICTED: 'text-purple-600',
    };
    return <Eye className={`h-4 w-4 ${colors[visibility]}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 leading-normal">
            {t('description')}
          </p>
        </div>
        {permissions.canCreate && (
          <Link href="/admin/posts/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.create')}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.total')}
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.published')}
            </CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'PUBLISHED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.drafts')}
            </CardTitle>
            <Edit className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'DRAFT').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.scheduled')}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'SCHEDULED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search & Toggle Filters */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder={t('filters.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {t('filters.title')}
              </Button>
              {(statusFilter !== 'all' ||
                typeFilter !== 'all' ||
                categoryFilter !== 'all' ||
                searchQuery) && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  {t('filters.clear')}
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('filters.status')}</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={value => {
                      setStatusFilter(value as PostStatus | 'all');
                      updateURL('status', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('filters.allStatus')}
                      </SelectItem>
                      <SelectItem value="DRAFT">{t('status.draft')}</SelectItem>
                      <SelectItem value="PUBLISHED">
                        {t('status.published')}
                      </SelectItem>
                      <SelectItem value="SCHEDULED">
                        {t('status.scheduled')}
                      </SelectItem>
                      <SelectItem value="ARCHIVED">
                        {t('status.archived')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('filters.type')}</Label>
                  <Select
                    value={typeFilter}
                    onValueChange={value => {
                      setTypeFilter(value as PostType | 'all');
                      updateURL('type', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('filters.allTypes')}
                      </SelectItem>
                      <SelectItem value="ARTICLE">
                        {t('types.article')}
                      </SelectItem>
                      <SelectItem value="GALLERY">
                        {t('types.gallery')}
                      </SelectItem>
                      <SelectItem value="VIDEO">{t('types.video')}</SelectItem>
                      <SelectItem value="DOCUMENT">
                        {t('types.document')}
                      </SelectItem>
                      <SelectItem value="LINK">{t('types.link')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('filters.category')}</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={value => {
                      setCategoryFilter(value);
                      updateURL('categoryId', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('filters.allCategories')}
                      </SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.post')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.stats')}</TableHead>
              <TableHead>{t('table.date')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-32 text-center"
                >
                  {t('table.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              posts.map(post => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-16 w-16 flex-shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="hover:text-primary line-clamp-1 font-medium"
                        >
                          {post.title}
                        </Link>
                        <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                          {post.excerpt || t('table.noExcerpt')}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {getVisibilityIcon(post.visibility)}
                          {post.isFeatured && (
                            <Badge variant="secondary">
                              {t('badges.featured')}
                            </Badge>
                          )}
                          {post.isPinned && (
                            <Badge variant="outline">
                              {t('badges.pinned')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {t(`types.${post.type.toLowerCase()}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-muted-foreground flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {post._count?.comments || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {post.publishedAt
                      ? formatDistanceToNow(new Date(post.publishedAt), {
                          addSuffix: true,
                        })
                      : formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="flex items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('actions.view')}
                          </Link>
                        </DropdownMenuItem>
                        {permissions.canUpdate && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/posts/${post.id}/edit`}
                              className="flex items-center"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t('actions.edit')}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {permissions.canDelete && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(post.id, post.title)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-muted-foreground text-sm">
              {t('pagination.showing', {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                ),
                total: pagination.total,
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isPending}
              >
                {t('pagination.previous')}
              </Button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={isPending}
                    >
                      {page}
                    </Button>
                  );
                } else if (
                  page === pagination.page - 2 ||
                  page === pagination.page + 2
                ) {
                  return (
                    <span key={page} className="px-2">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={
                  pagination.page === pagination.totalPages || isPending
                }
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
