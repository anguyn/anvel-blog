'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/common/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Plus, Search, RefreshCw, Tag } from 'lucide-react';

interface TagType {
  id: string;
  name: string;
  slug: string;
  type: 'LANGUAGE' | 'TOPIC' | 'TECHNOLOGY' | 'CATEGORY';
  color: string | null;
  _count: {
    snippets: number;
    posts: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface TagsManagementProps {
  locale: string;
  user: User;
}

export function TagsManagement({ locale, user }: TagsManagementProps) {
  const t = useTranslations('tags');
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterType) params.set('type', filterType);
      params.set('limit', '-1');

      const response = await fetch(`/api/tags?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      setTags(data || []);
    } catch (error) {
      console.error('Fetch tags error:', error);
      toast.error(t('messages.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType, t]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleDelete = async (tagId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      toast.success(t('messages.deleteSuccess'));
      fetchTags();
    } catch (error) {
      console.error('Delete tag error:', error);
      toast.error(t('messages.deleteError'));
    }
  };

  const tagTypes = [
    { value: '', label: t('filters.all') },
    { value: 'LANGUAGE', label: 'Language' },
    { value: 'TOPIC', label: 'Topic' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'CATEGORY', label: 'Category' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button onClick={() => setShowFormDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('total')}</CardTitle>
          <CardDescription>{tags.length} tags</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t('search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            >
              {tagTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tags.map(tag => (
          <Card key={tag.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Tag
                    className="h-4 w-4"
                    style={{ color: tag.color || undefined }}
                  />
                  <div>
                    <p className="font-medium">{tag.name}</p>
                    <p className="text-muted-foreground text-xs">{tag.type}</p>
                  </div>
                </div>
              </div>
              <div className="text-muted-foreground mt-3 flex gap-2 text-xs">
                <span>{tag._count.posts} posts</span>
                <span>{tag._count.snippets} snippets</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTag(tag);
                    setShowFormDialog(true);
                  }}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(tag.id)}
                  className="text-destructive"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('noResults')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
