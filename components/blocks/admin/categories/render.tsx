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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryFormDialog } from './category-form';
import { CategoryList } from './category-list';
import { Plus, Search, RefreshCw, Languages } from 'lucide-react';

interface CategoryTranslation {
  id: string;
  language: 'vi' | 'en';
  name: string;
  description?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  language: 'vi' | 'en';
  isActive: boolean;
  translations?: CategoryTranslation[];
  _count: {
    posts: number;
    children: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  roleName: string | null;
  roleLevel: number;
}

interface CategoriesManagementProps {
  locale: string;
  user: User;
}

export function CategoriesManagement({
  locale,
  user,
}: CategoriesManagementProps) {
  const t = useTranslations('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'vi' | 'en'>(
    locale as 'vi' | 'en',
  );
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (showInactive) params.set('includeInactive', 'true');
        params.set('language', selectedLanguage);

        const response = await fetch(`/api/category?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Fetch categories error:', error);
        toast.error(t('messages.fetchError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, showInactive, selectedLanguage, t],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setShowFormDialog(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowFormDialog(true);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/category/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      toast.success(t('messages.deleteSuccess'));
      fetchCategories();
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error(t('messages.deleteError'));
    }
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleRefresh = () => {
    fetchCategories(true);
  };

  const categoriesByLanguage = categories.filter(
    c => c.language === selectedLanguage,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 leading-normal">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('create')}
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('total')}</CardTitle>
          <CardDescription>
            {categories.length} {t('total').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">{t('active')}:</span>{' '}
              <span className="font-semibold">
                {categories.filter(c => c.isActive).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('inactive')}:</span>{' '}
              <span className="font-semibold">
                {categories.filter(c => !c.isActive).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">🇻🇳 Vietnamese:</span>{' '}
              <span className="font-semibold">
                {categories.filter(c => c.language === 'vi').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">🇬🇧 English:</span>{' '}
              <span className="font-semibold">
                {categories.filter(c => c.language === 'en').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
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

        {/* Language Filter */}
        <Select
          value={selectedLanguage}
          onValueChange={(value: 'vi' | 'en') => setSelectedLanguage(value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
            <SelectItem value="en">🇬🇧 English</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="showInactive" className="text-sm whitespace-nowrap">
            {t('filters.showInactive')}
          </label>
        </div>
      </div>

      {/* Categories List */}
      <CategoryList
        categories={categoriesByLanguage}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        t={t}
      />

      {/* Form Dialog */}
      <CategoryFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        category={editingCategory}
        categories={categories}
        onSuccess={handleFormSuccess}
        t={t}
      />
    </div>
  );
}
