'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Textarea } from '@/components/common/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Folder, Languages } from 'lucide-react';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (category: {
    id: string;
    name: string;
    slug: string;
    language: 'vi' | 'en';
  }) => void;
  categories?: Array<{ id: string; name: string; language: 'vi' | 'en' }>;
  defaultLanguage?: 'vi' | 'en'; // NEW: Pass from parent (e.g., from post form)
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onCategoryCreated,
  categories = [],
  defaultLanguage = 'vi',
}: CreateCategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [parentId, setParentId] = useState('');
  const [language, setLanguage] = useState<'vi' | 'en'>(defaultLanguage);

  // Filter parent categories by selected language
  const filteredCategories = categories.filter(
    cat => cat.language === language,
  );

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  // Reset parent category when language changes
  const handleLanguageChange = (value: 'vi' | 'en') => {
    setLanguage(value);
    // Reset parent if current parent is not in the new language
    const currentParent = categories.find(c => c.id === parentId);
    if (currentParent && currentParent.language !== value) {
      setParentId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug || generateSlug(name),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          color,
          parentId: parentId || undefined,
          language, // NEW: Include language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      toast.success('Category created successfully');
      onCategoryCreated(data.category);
      onOpenChange(false);

      // Reset form
      setName('');
      setSlug('');
      setDescription('');
      setIcon('');
      setColor('#3B82F6');
      setParentId('');
      setLanguage(defaultLanguage);
    } catch (error) {
      console.error('Create category error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create category',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Folder className="text-primary h-5 w-5" />
              <DialogTitle>Create New Category</DialogTitle>
            </div>
            <DialogDescription>
              Create a new category to organize your posts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Language - NEW */}
            <div className="space-y-2">
              <Label
                htmlFor="category-language"
                className="flex items-center gap-2"
              >
                <Languages className="h-4 w-4" />
                Language <span className="text-destructive">*</span>
              </Label>
              <Select
                value={language}
                onValueChange={handleLanguageChange}
                disabled={isLoading}
              >
                <SelectTrigger id="category-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Categories are language-specific. Create separately for each
                language.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="category-name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                placeholder={
                  language === 'vi'
                    ? 'e.g., Công nghệ, Thiết kế'
                    : 'e.g., Technology, Design'
                }
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                placeholder="auto-generated"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                Leave empty to auto-generate from name
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="category-description">
                Description{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="category-description"
                placeholder={
                  language === 'vi'
                    ? 'Mô tả ngắn về danh mục này...'
                    : 'Brief description of this category...'
                }
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-icon">
                  Icon <span className="text-muted-foreground">(emoji)</span>
                </Label>
                <Input
                  id="category-icon"
                  placeholder="🎨"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  disabled={isLoading}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="category-color"
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="h-10 w-16"
                    disabled={isLoading}
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="#3B82F6"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Parent Category */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parent-category">
                  Parent Category{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <select
                  id="parent-category"
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  disabled={isLoading}
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">None (Top Level)</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {filteredCategories.length === 0 && categories.length > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    No parent categories available for{' '}
                    {language === 'vi' ? 'Vietnamese' : 'English'}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
