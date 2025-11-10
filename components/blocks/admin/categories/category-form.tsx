'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/common/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages } from 'lucide-react';

interface CategoryTranslation {
  id?: string;
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
  _count?: {
    posts: number;
    children: number;
  };
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  categories: Category[];
  onSuccess: () => void;
  t: any;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  categories,
  onSuccess,
  t,
}: CategoryFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    parentId: '',
    language: 'vi' as 'vi' | 'en',
    isActive: true,
  });

  const [translations, setTranslations] = useState<CategoryTranslation[]>([
    { language: 'vi', name: '', description: '' },
    { language: 'en', name: '', description: '' },
  ]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#3B82F6',
        parentId: category.parentId || '',
        language: category.language,
        isActive: category.isActive,
      });

      if (category.translations && category.translations.length > 0) {
        setTranslations(
          category.translations.map(t => ({
            id: t.id,
            language: t.language,
            name: t.name,
            description: t.description || '',
          })),
        );
      }
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        color: '#3B82F6',
        parentId: '',
        language: 'vi',
        isActive: true,
      });
      setTranslations([
        { language: 'vi', name: '', description: '' },
        { language: 'en', name: '', description: '' },
      ]);
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        color: formData.color,
        parentId: formData.parentId || undefined,
        language: formData.language,
        isActive: formData.isActive,
        translations: translations.filter(t => t.name.trim() !== ''),
      };

      const url = category ? `/api/category/${category.id}` : '/api/category';
      const method = category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }

      toast.success(
        category ? t('messages.updateSuccess') : t('messages.createSuccess'),
      );
      onSuccess();
    } catch (error: any) {
      console.error('Save category error:', error);
      toast.error(
        error.message ||
          (category ? t('messages.updateError') : t('messages.createError')),
      );
    } finally {
      setLoading(false);
    }
  };

  const updateTranslation = (
    language: 'vi' | 'en',
    field: 'name' | 'description',
    value: string,
  ) => {
    setTranslations(prev =>
      prev.map(t => (t.language === language ? { ...t, [field]: value } : t)),
    );
  };

  const availableParents = categories.filter(
    c =>
      c.id !== category?.id &&
      c.parentId !== category?.id &&
      c.language === formData.language,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{category ? t('edit') : t('create')}</DialogTitle>
          <DialogDescription>
            {category ? `${t('edit')} ${category.name}` : t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Main Info</TabsTrigger>
              <TabsTrigger value="translations">
                <Languages className="mr-2 h-4 w-4" />
                Translations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">
                  {t('form.language')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: 'vi' | 'en') =>
                    setFormData({ ...formData, language: value })
                  }
                  disabled={!!category}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
                {category && (
                  <p className="text-muted-foreground text-xs">
                    Language cannot be changed after creation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('form.name')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t('form.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t('form.slug')}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={e =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder={t('form.slugPlaceholder')}
                />
                <p className="text-muted-foreground text-xs">
                  {t('form.slugHelp')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('form.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t('form.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="icon">{t('form.icon')}</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={e =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder={t('form.iconPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">{t('form.color')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={e =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="h-10 w-20"
                    />
                    <Input
                      value={formData.color}
                      onChange={e =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder={t('form.colorPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent">{t('form.parent')}</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      parentId: value === 'none' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.parentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('form.noneParent')}</SelectItem>
                    {availableParents.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    {t('form.isActive')}
                  </Label>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t('form.isActiveHelp')}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="translations" className="mt-4 space-y-4">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Languages className="h-4 w-4" />
                  <span>Manage translations for other languages</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-lg">🇻🇳</span>
                    <span>Tiếng Việt</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trans-vi-name">Name</Label>
                    <Input
                      id="trans-vi-name"
                      value={
                        translations.find(t => t.language === 'vi')?.name || ''
                      }
                      onChange={e =>
                        updateTranslation('vi', 'name', e.target.value)
                      }
                      placeholder="Vietnamese name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trans-vi-desc">Description</Label>
                    <Textarea
                      id="trans-vi-desc"
                      value={
                        translations.find(t => t.language === 'vi')
                          ?.description || ''
                      }
                      onChange={e =>
                        updateTranslation('vi', 'description', e.target.value)
                      }
                      placeholder="Vietnamese description"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="border-t pt-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-lg">🇬🇧</span>
                    <span>English</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trans-en-name">Name</Label>
                    <Input
                      id="trans-en-name"
                      value={
                        translations.find(t => t.language === 'en')?.name || ''
                      }
                      onChange={e =>
                        updateTranslation('en', 'name', e.target.value)
                      }
                      placeholder="English name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trans-en-desc">Description</Label>
                    <Textarea
                      id="trans-en-desc"
                      value={
                        translations.find(t => t.language === 'en')
                          ?.description || ''
                      }
                      onChange={e =>
                        updateTranslation('en', 'description', e.target.value)
                      }
                      placeholder="English description"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  💡 Tip: Leave translations empty to use AI auto-translation.
                  You can edit them later.
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
