'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/common/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { Loader2 } from 'lucide-react';
import { updateAppMetadata } from '@/app/actions/config.action';
import { useToast } from '@/libs/hooks/use-toast';
import { AppMetadata } from '@prisma/client';

interface MetadataCardProps {
  metadata: AppMetadata;
}

export function MetadataCard({ metadata: initialMetadata }: MetadataCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({
    name: initialMetadata.name,
    shortName: initialMetadata.shortName,
    description: initialMetadata.description,
    keywords: initialMetadata.keywords.join(', '),
    themeColor: initialMetadata.themeColor,
    bgColor: initialMetadata.bgColor,
  });
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateAppMetadata(initialMetadata.locale, {
        ...formData,
        keywords: formData.keywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean),
      });

      if (result.success) {
        toast.success('Metadata updated successfully');
        setShowEdit(false);
      } else {
        toast.error(result?.error || 'Internal error');
      }
    });
  };

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-white"
                style={{ backgroundColor: initialMetadata.themeColor }}
              >
                {initialMetadata.locale.toUpperCase()}
              </div>
              <div>
                <CardTitle>{initialMetadata.name}</CardTitle>
                <CardDescription>
                  {initialMetadata.locale === 'en' ? 'English' : 'Tiếng Việt'}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({
                  name: initialMetadata.name,
                  shortName: initialMetadata.shortName,
                  description: initialMetadata.description,
                  keywords: initialMetadata.keywords.join(', '),
                  themeColor: initialMetadata.themeColor,
                  bgColor: initialMetadata.bgColor,
                });
                setShowEdit(true);
              }}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-1 text-sm">Description</p>
            <p className="text-sm">{initialMetadata.description}</p>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-sm">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {initialMetadata.keywords.map((kw, i) => (
                <Badge key={i} variant="secondary">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Theme:</span>
              <div
                className="h-6 w-6 rounded border"
                style={{ backgroundColor: initialMetadata.themeColor }}
              />
              <code className="text-xs">{initialMetadata.themeColor}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Background:</span>
              <div
                className="h-6 w-6 rounded border"
                style={{ backgroundColor: initialMetadata.bgColor }}
              />
              <code className="text-xs">{initialMetadata.bgColor}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit App Metadata</DialogTitle>
            <DialogDescription>
              Update metadata for{' '}
              {initialMetadata.locale === 'en' ? 'English' : 'Vietnamese'}{' '}
              locale
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">Short Name</Label>
                <Input
                  id="shortName"
                  value={formData.shortName}
                  onChange={e => handleChange('shortName', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">
                Keywords{' '}
                <span className="text-muted-foreground text-xs">
                  (comma-separated)
                </span>
              </Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={e => handleChange('keywords', e.target.value)}
                placeholder="code snippets, programming, developer tools"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="themeColor">Theme Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="themeColor"
                    value={formData.themeColor}
                    onChange={e => handleChange('themeColor', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    value={formData.themeColor}
                    onChange={e => handleChange('themeColor', e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgColor">Background Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="bgColor"
                    value={formData.bgColor}
                    onChange={e => handleChange('bgColor', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    value={formData.bgColor}
                    onChange={e => handleChange('bgColor', e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <p className="mb-2 text-sm font-medium">Preview</p>
              <div className="bg-background flex items-center gap-3 rounded border p-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded text-lg font-bold text-white"
                  style={{ backgroundColor: formData.themeColor }}
                >
                  {formData.shortName.charAt(0)}
                </div>
                <div>
                  <h5 className="font-semibold">{formData.name}</h5>
                  <p className="text-muted-foreground text-sm">
                    {formData.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
