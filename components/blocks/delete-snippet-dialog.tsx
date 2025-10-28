'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { toast } from 'sonner';
import { Loader2, Trash2, AlertTriangle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DeleteSnippetDialogProps {
  snippetId: string;
  snippetTitle: string;
  locale: string;
  onClose?: () => void;
}

export function DeleteSnippetDialog({
  snippetId,
  snippetTitle,
  locale,
  onClose,
}: DeleteSnippetDialogProps) {
  const t = useTranslations('deleteSnippet');
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      onClose?.();
    }, 200);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete snippet');
      }

      toast.success(t('toast.success'));
      handleClose();
      setTimeout(() => {
        router.push(`/${locale}/my-snippets`);
        router.refresh();
      }, 300);
    } catch (error) {
      toast.error(t('toast.error'));
      setIsDeleting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        {t('actions.delete')}
      </Button>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <Card
        className={`relative w-full max-w-md transform transition-all duration-200 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div className="flex-1 pt-1">
              <CardTitle className="text-xl">{t('title')}</CardTitle>
              <CardDescription className="mt-1">
                {t('description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {t('confirm', { title: snippetTitle })}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:flex-1"
          >
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:flex-1"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? t('actions.deleting') : t('actions.deleteSnippet')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
