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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tag } from 'lucide-react';

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagCreated: (tag: { id: string; name: string; slug: string }) => void;
}

export function CreateTagDialog({
  open,
  onOpenChange,
  onTagCreated,
}: CreateTagDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug || generateSlug(name),
          type: 'TOPIC',
          color,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tag');
      }

      toast.success('Tag created successfully');
      onTagCreated(data.tag);
      onOpenChange(false);
      setName('');
      setSlug('');
      setColor('#3B82F6');
    } catch (error) {
      console.error('Create tag error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create tag',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Tag className="text-primary h-5 w-5" />
              <DialogTitle>Create New Tag</DialogTitle>
            </div>
            <DialogDescription>
              Create a new tag to organize your posts better.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">
                Tag Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tag-name"
                placeholder="e.g., JavaScript, Web Development"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-slug">Slug</Label>
              <Input
                id="tag-slug"
                placeholder="auto-generated"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                Leave empty to auto-generate from name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="tag-color"
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="h-10 w-20"
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
              {isLoading ? 'Creating...' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
