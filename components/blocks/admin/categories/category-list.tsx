'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/common/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit2, Trash2, FileText, FolderTree, Languages } from 'lucide-react';
import { Badge } from '@/components/common/badge';

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

interface CategoryListProps {
  categories: Category[];
  loading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  t: any;
}

export function CategoryList({
  categories,
  loading,
  onEdit,
  onDelete,
  t,
}: CategoryListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      onDelete(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card className="pt-6">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            <span className="text-muted-foreground ml-3">{t('loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="pt-6">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('noResults')}</p>
        </CardContent>
      </Card>
    );
  }

  const getLanguageIcon = (lang: 'vi' | 'en') => {
    return lang === 'vi' ? '🇻🇳' : '🇬🇧';
  };

  const hasTranslations = (category: Category) => {
    return category.translations && category.translations.length > 0;
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => (
          <Card key={category.id} className="overflow-hidden pt-6">
            <CardContent className="p-6">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {category.icon && (
                    <span className="text-2xl">{category.icon}</span>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      <span className="text-sm">
                        {getLanguageIcon(category.language)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {category.slug}
                    </p>
                  </div>
                </div>
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                />
              </div>

              {category.description && (
                <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
                  {category.description}
                </p>
              )}

              <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {category._count.posts}
                </div>
                <div className="flex items-center gap-1">
                  <FolderTree className="h-3 w-3" />
                  {category._count.children}
                </div>

                {hasTranslations(category) && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Languages className="h-3 w-3" />
                    {category.translations!.length}
                  </Badge>
                )}

                {!category.isActive && (
                  <Badge variant="destructive" className="text-xs">
                    {t('inactive')}
                  </Badge>
                )}
              </div>

              {/* Show available translations */}
              {hasTranslations(category) && (
                <div className="mt-3 border-t pt-3">
                  <div className="text-muted-foreground mb-1 text-xs">
                    Translations:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {category.translations!.map(trans => (
                      <Badge
                        key={trans.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {getLanguageIcon(trans.language)} {trans.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(category)}
                  className="flex-1"
                >
                  <Edit2 className="mr-1 h-3 w-3" />
                  {t('edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(category)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteWarning')}
              {categoryToDelete && (
                <div className="bg-muted mt-2 rounded p-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{categoryToDelete.name}</p>
                    <span>{getLanguageIcon(categoryToDelete.language)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {categoryToDelete._count.posts} posts
                  </p>
                  {hasTranslations(categoryToDelete) && (
                    <p className="text-muted-foreground text-xs">
                      {categoryToDelete.translations!.length} translations
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:cursor-pointer">
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
