'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Textarea } from '@/components/common/textarea';
import { CodeEditor } from '@/components/blocks/code-editor';
import { Badge } from '@/components/common/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { toast } from 'sonner';
import { Loader2, X, Zap, Lock } from 'lucide-react';
import { Snippet, Language } from '@/types';
import { useTranslations } from 'next-intl';

const snippetSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  languageId: z.string().min(1, 'Language is required'),
  languageTag: z.string(),
  topicTags: z.array(z.string()).max(5, 'Maximum 5 topic tags allowed'),
  isPublic: z.boolean().default(true),
  complexity: z.string().optional(),
});

type SnippetFormData = z.infer<typeof snippetSchema>;

interface SnippetFormProps {
  locale: string;
  snippet?: Snippet;
  mode: 'create' | 'edit';
  languages: Language[];
}

export function SnippetForm({
  locale,
  snippet,
  mode,
  languages,
}: SnippetFormProps) {
  const router = useRouter();
  const t = useTranslations('snippetForm');

  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [topicTags, setTopicTags] = useState<string[]>(
    snippet?.tags.filter(t => t.tag.type === 'TOPIC').map(t => t.tag.name) ||
      [],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SnippetFormData>({
    resolver: zodResolver(snippetSchema) as unknown as Resolver<
      SnippetFormData,
      object
    >,
    defaultValues: {
      title: snippet?.title || '',
      description: snippet?.description || '',
      code: snippet?.code || '',
      languageId: snippet?.language?.id || languages[0]?.id || '',
      languageTag: snippet?.language?.name || languages[0]?.name || '',
      topicTags: topicTags,
      isPublic: snippet?.isPublic ?? true,
      complexity: snippet?.complexity || '',
    },
  });

  const watchedCode = watch('code');
  const watchedLanguageId = watch('languageId');

  const currentLanguage = languages.find(l => l.id === watchedLanguageId);
  const languageSlug = currentLanguage?.slug || 'javascript';

  useEffect(() => {
    if (currentLanguage) {
      setValue('languageTag', currentLanguage.name);
    }
  }, [currentLanguage, setValue]);

  useEffect(() => {
    if (!isDirty || isLoading) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (link && link.href && !link.target) {
        const isSameOrigin = link.href.startsWith(window.location.origin);
        if (isSameOrigin && link.href !== window.location.href) {
          const confirmed = window.confirm(t('confirmLeave'));
          if (!confirmed) e.preventDefault();
        }
      }
    };
    document.addEventListener('click', handleClick);

    const handlePopState = (e: PopStateEvent) => {
      const confirmed = window.confirm(t('confirmLeave'));
      if (!confirmed) {
        e.preventDefault();
        router.push(window.location.pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, isLoading, router]);

  useEffect(() => {
    setValue('topicTags', topicTags);
  }, [topicTags, setValue]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !topicTags.includes(tag) && topicTags.length < 5) {
      setTopicTags([...topicTags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTopicTags(topicTags.filter(tag => tag !== tagToRemove));
  };

  const handleAnalyzeComplexity = async () => {
    if (!watchedCode) {
      toast.error(t('analyzeEmpty'));
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-complexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: watchedCode,
          language: languageSlug,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze complexity');
      }

      const data = await response.json();
      setValue('complexity', data.complexity);
      toast.success(t('analyzeSuccess', { complexity: data.complexity }));
    } catch (error) {
      toast.error(t('analyzeError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit: SubmitHandler<SnippetFormData> = async data => {
    setIsLoading(true);

    try {
      const url =
        mode === 'create' ? '/api/snippets' : `/api/snippets/${snippet?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const payload = {
        ...data,
        tags: {
          languageTag: data.languageTag,
          topicTags: data.topicTags,
        },
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save snippet');
      }

      const savedSnippet = await response.json();

      toast.success(
        mode === 'create' ? t('saveSuccessCreate') : t('saveSuccessUpdate'),
      );
      setIsCompleted(true);

      router.push(`/${locale}/snippets/${savedSnippet.slug}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || t('generalError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <div className="mb-2">
          <Label htmlFor="title" className="text-sm font-medium">
            {t('title')} <span className="text-red-400">*</span>
          </Label>
        </div>
        <Input
          id="title"
          placeholder={t('titlePlaceholder')}
          disabled={isLoading}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-[var(--color-destructive)]">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="mb-2">
          <Label htmlFor="description" className="text-sm font-medium">
            {t('description')}
          </Label>
        </div>
        <Textarea
          id="description"
          placeholder={t('descriptionPlaceholder')}
          rows={3}
          disabled={isLoading}
          {...register('description')}
        />
      </div>

      <div className="space-y-2">
        <div className="mb-2">
          <Label htmlFor="languageId" className="text-sm font-medium">
            {t('language')} <span className="text-red-400">*</span>
          </Label>
        </div>
        <select
          id="languageId"
          className="flex h-10 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm ring-offset-[var(--color-background)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          {...register('languageId')}
        >
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
        {errors.languageId && (
          <p className="text-sm text-[var(--color-destructive)]">
            {errors.languageId.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="mb-2">
          <Label className="text-sm font-medium">
            {t('code')} <span className="text-red-400">*</span>
          </Label>
        </div>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <CodeEditor
              value={field.value}
              onChange={field.onChange}
              language={languageSlug}
              placeholder={t('codePlaceholder')}
              height="500px"
            />
          )}
        />
        {errors.code && (
          <p className="text-sm text-[var(--color-destructive)]">
            {errors.code.message}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('complexity')}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAnalyzeComplexity}
              disabled={isAnalyzing || !watchedCode}
            >
              {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('analyze')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="complexity"
            control={control}
            render={({ field }) => (
              <Input
                placeholder={t('complexityPlaceholder')}
                {...field}
                disabled={isLoading}
              />
            )}
          />
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            {t('complexityHint')}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="mb-2">
          <Label className="text-sm font-medium"></Label>
        </div>

        <div className="mb-3">
          <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
            {t('languageTag')}
          </p>
          <Badge
            variant="default"
            className="gap-2"
            style={{
              backgroundColor: currentLanguage?.color || 'var(--color-primary)',
            }}
          >
            <Lock className="h-3 w-3" />
            {currentLanguage?.name || 'Unknown'}
          </Badge>
        </div>

        <div>
          <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
            {t('topicTags')}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder={t('topicTagPlaceholder')}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              disabled={isLoading || topicTags.length >= 5}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={isLoading || topicTags.length >= 5}
            >
              {t('add')}
            </Button>
          </div>
          {topicTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {topicTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-[var(--color-destructive)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {errors.topicTags && (
            <p className="text-sm text-[var(--color-destructive)]">
              {errors.topicTags.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          className="h-4 w-4 rounded border-[var(--color-input)]"
          {...register('isPublic')}
          disabled={isLoading}
        />
        <Label
          htmlFor="isPublic"
          className="cursor-pointer text-sm font-medium"
        >
          {t('public')}
        </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || isAnalyzing || isCompleted}
          className="flex-1"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? t('create') : t('update')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading || isAnalyzing || isCompleted}
        >
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
