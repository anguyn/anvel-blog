'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as z from 'zod';
import { PostType, PostStatus, PostVisibility } from '@prisma/client';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Textarea } from '@/components/common/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TiptapEditor } from '@/components/common/tiptap-editor';
// import { MediaUploader } from './media-uploader';
import { FeatureImageUploader } from './feature-image-uploader';
import { GalleryManager } from '@/components/custom/gallery-manager';
import { VideoSettings } from '@/components/custom/video-settings';
import { CollapsibleSection } from '@/components/custom/collapsible-section';
import { TagInput } from '@/components/custom/tag-input';
import { SEOPreview } from '@/components/custom/seo-preview';
import { CharacterCounter } from '@/components/custom/character-counter';
import { AutoSaveIndicator } from '@/components/custom/auto-save-indicator';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { CreateTagDialog } from './dialogs/create-tag-dialog';
import { CreateCategoryDialog } from './dialogs/create-category-dialog';
import { PostPreviewDialog } from './dialogs/preview-dialog';
import { toast } from 'sonner';
import { useUnsavedChanges } from '@/libs/hooks/use-unsaved-changes';
import { createPostAction, updatePostAction } from '@/app/actions/post.action';
import { PostWithRelations, MediaItem } from '@/types/post.types';
import {
  Loader2,
  Save,
  Eye,
  Calendar,
  X,
  Settings,
  Lock,
  Folder,
  Plus,
  Info,
  Shield,
  Globe,
  EyeOff,
  Key,
  UserCheck,
  Hash,
  Sparkles,
  ArrowLeft,
  Languages,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { uploadMediaAction } from '@/app/actions/media.action';
// ============================================
// UTILITY FUNCTIONS
// ============================================

// Custom debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// ============================================
// INTERFACES & TYPES
// ============================================

interface PostFormProps {
  post?: PostWithRelations;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    language: 'vi' | 'en';
  }>;
  tags: Array<{ id: string; name: string; slug: string }>;
}

// ============================================
// VALIDATION SCHEMA
// ============================================

const postFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().min(1, 'Slug is required').max(200),
    excerpt: z.string().max(500).optional(),
    content: z.string().min(1, 'Content is required'),
    type: z.nativeEnum(PostType),
    status: z.nativeEnum(PostStatus),
    visibility: z.nativeEnum(PostVisibility),
    language: z.enum(['vi', 'en']),
    categoryId: z.string().optional(),
    tagIds: z.array(z.string()),
    featuredImage: z.string().optional(),
    password: z.string().optional(),
    isPasswordProtected: z.boolean(),
    allowedUserEmails: z.array(z.string().email()).optional(),
    isFeatured: z.boolean(),
    isPinned: z.boolean(),
    publishedAt: z.string().optional(),
    scheduledFor: z.string().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    metaKeywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  })
  .refine(
    data =>
      data.visibility !== PostVisibility.PASSWORD ||
      (data.password && data.password.length >= 4),
    {
      message:
        'Password is required and must be at least 4 characters when visibility is set to PASSWORD',
      path: ['password'],
    },
  );

type PostFormData = z.infer<typeof postFormSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

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

// ============================================
// MAIN COMPONENT
// ============================================

export function PostForm({
  post,
  categories: initialCategories,
  tags: initialTags,
}: PostFormProps) {
  const t = useTranslations('posts.form');
  const router = useRouter();
  const isEditMode = !!post;

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [lastSaved, setLastSaved] = useState<Date | undefined>();

  // Gallery & Video
  const [galleryImages, setGalleryImages] = useState<MediaItem[]>(
    post?.media?.map(m => m.media) || [],
  );
  const [videoSettings, setVideoSettings] = useState<{
    video?: MediaItem | undefined;
    videoUrl?: string;
    thumbnail?: string;
    duration?: number;
  }>({
    video: undefined as MediaItem | undefined,
    videoUrl: '',
    thumbnail: post?.featuredImage || '',
    duration: 0,
  });

  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);

  // Dialogs
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // ============================================
  // FORM SETUP
  // ============================================

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      excerpt: post?.excerpt || '',
      content: post?.content || '',
      type: post?.type || PostType.ARTICLE,
      status: post?.status || PostStatus.DRAFT,
      visibility: post?.visibility || PostVisibility.PUBLIC,
      language: (post?.language as 'vi' | 'en') || 'vi',
      categoryId: post?.categoryId || '0',
      tagIds: post?.tags?.map(t => t.tag.id) || [],
      featuredImage: post?.featuredImage || '',
      password: '',
      isPasswordProtected: false,
      allowedUserEmails: [],
      isFeatured: post?.isFeatured || false,
      isPinned: post?.isPinned || false,
      publishedAt: post?.publishedAt?.toISOString() || '',
      scheduledFor: post?.scheduledFor?.toISOString() || '',
      metaTitle: post?.metaTitle || '',
      metaDescription: post?.metaDescription || '',
      metaKeywords: post?.metaKeywords || [],
      ogImage: post?.ogImage || '',
    },
    mode: 'onBlur',
  });

  const {
    setValue,
    getValues,
    formState: { isDirty, errors },
  } = form;

  // ============================================
  // OPTIMIZED WATCHERS - Only watch what's necessary
  // ============================================

  // Use getValues() instead of watch() where possible to avoid re-renders
  const currentType = form.watch('type');
  const currentVisibility = form.watch('visibility');
  const currentStatus = form.watch('status');
  const currentLanguage = form.watch('language');

  const filteredCategories = useMemo(
    () => categories.filter(cat => true),
    // () => categories.filter(cat => cat.language === currentLanguage),
    [categories, currentLanguage],
  );

  // ============================================
  // UNSAVED CHANGES WARNING
  // ============================================

  const { confirmNavigation } = useUnsavedChanges({
    hasUnsavedChanges: isDirty,
  });

  // ============================================
  // AUTO-SAVE WITH DEBOUNCE
  // ============================================

  const performAutoSave = useCallback(
    async (data: PostFormData) => {
      if (!isEditMode) return;

      setAutoSaveStatus('saving');

      try {
        const formData = {
          ...data,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt)
            : undefined,
          scheduledFor: data.scheduledFor
            ? new Date(data.scheduledFor)
            : undefined,
        };
        const result = await updatePostAction(post.id, formData);

        if (result.success) {
          setAutoSaveStatus('saved');
          setLastSaved(new Date());

          setTimeout(() => {
            setAutoSaveStatus('idle');
          }, 3000);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        setAutoSaveStatus('error');

        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 3000);
      }
    },
    [isEditMode, post],
  );

  // Debounced auto-save - only save after 2 seconds of no changes
  const debouncedAutoSave = useMemo(
    () => debounce(performAutoSave, 2000),
    [performAutoSave],
  );

  // Auto-save trigger on form change
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return;

    const subscription = form.watch(data => {
      debouncedAutoSave(data as PostFormData);
    });

    return () => {
      subscription.unsubscribe();
      debouncedAutoSave.cancel();
    };
  }, [autoSaveEnabled, isDirty, form, debouncedAutoSave]);

  // ============================================
  // SLUG GENERATION WITH DEBOUNCE
  // ============================================

  const updateSlug = useMemo(
    () =>
      debounce((title: string) => {
        const currentSlug = getValues('slug');
        const postSlug = generateSlug(post?.title || '');

        // Only auto-generate if slug is empty or matches the original post slug
        if (!currentSlug || currentSlug === postSlug) {
          setValue('slug', generateSlug(title), { shouldDirty: true });
        }
      }, 300),
    [setValue, getValues, post],
  );

  const updateIsPasswordProtected = useMemo(
    () =>
      debounce((password: string) => {
        if (password && password.length >= 4) {
          setValue('isPasswordProtected', true, {
            shouldDirty: true,
          });
        } else {
          setValue('isPasswordProtected', false, {
            shouldDirty: true,
          });
        }
      }, 300),
    [setValue, getValues, post],
  );

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && value.title) {
        updateSlug(value.title);
      }
      if (name === 'password' && value.password) {
        updateIsPasswordProtected(value.password);
      }
    });

    return () => {
      subscription.unsubscribe();
      updateSlug.cancel();
      updateIsPasswordProtected.cancel();
    };
  }, [form, updateSlug, updateIsPasswordProtected]);

  // Reset category when language changes
  // useEffect(() => {
  //   const currentCategory = categories.find(
  //     c => c.id === getValues('categoryId'),
  //   );
  //   if (currentCategory && currentCategory.language !== currentLanguage) {
  //     setValue('categoryId', '', { shouldDirty: true });
  //     toast.info(t('categoryResetDueToLanguageChange'));
  //   }
  // }, [currentLanguage, categories, getValues, setValue, t]);

  // ============================================
  // FEATURED IMAGE
  // ============================================

  const handleFeaturedImageSelect = useCallback(
    (images: MediaItem[]) => {
      console.log('Images: ', images);
      if (images.length > 0) {
        setValue('featuredImage', images[0].url, { shouldDirty: true });
      }
    },
    [setValue],
  );

  const handleFeaturedImageRemove = useCallback(() => {
    setValue('featuredImage', '', { shouldDirty: true });
  }, [setValue]);

  // ============================================
  // FORM SUBMISSION - PREVENT ACCIDENTAL SUBMIT
  // ============================================

  const handleSubmit = useCallback(
    async (data: PostFormData, action: 'draft' | 'publish' | 'schedule') => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        let featuredImageUrl = data.featuredImage;

        if (featuredImageFile) {
          const formData = new FormData();
          formData.append('file', featuredImageFile);

          const result = await uploadMediaAction(formData);

          if (result.success && result.media) {
            featuredImageUrl = result.media.url;
          } else {
            toast.error('Failed to upload featured image');
            setIsSubmitting(false);
            return;
          }
        }

        const status =
          action === 'draft'
            ? PostStatus.DRAFT
            : action === 'schedule'
              ? PostStatus.SCHEDULED
              : PostStatus.PUBLISHED;

        const formData = {
          ...data,
          featuredImage: featuredImageUrl,
          status,
          publishedAt: action === 'publish' ? new Date() : undefined,
          scheduledFor: data.scheduledFor
            ? new Date(data.scheduledFor)
            : undefined,
          ...(currentType === PostType.GALLERY && {
            mediaIds: galleryImages.map(img => img.id),
          }),
          ...(currentType === PostType.VIDEO && videoSettings),
        };

        let result;
        if (isEditMode) {
          result = await updatePostAction(post.id, formData);
        } else {
          result = await createPostAction(formData as any);
        }

        if (result.success) {
          toast.success(
            isEditMode
              ? t('postUpdatedSuccessfully')
              : action === 'draft'
                ? t('draftSavedSuccessfully')
                : t('postPublishedSuccessfully'),
          );

          form.reset(data);

          // ✅ Reset file state
          setFeaturedImageFile(null);

          router.push('/admin/posts');
          router.refresh();
        } else {
          toast.error(result.error || t('failedToSavePost'));
        }
      } catch (error) {
        console.error('Submit error:', error);
        toast.error(t('errorOccurredWhileSaving'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      featuredImageFile, // ✅ Add dependency
      currentType,
      galleryImages,
      videoSettings,
      isEditMode,
      post,
      form,
      router,
      t,
    ],
  );

  // Wrap form onSubmit to prevent default and handle properly
  const onFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      form.handleSubmit(data => handleSubmit(data, 'publish'))();
    },
    [form, handleSubmit],
  );

  // ============================================
  // TAG & CATEGORY CREATION
  // ============================================

  const handleTagCreated = useCallback(
    (tag: { id: string; name: string; slug: string }) => {
      setTags(prev => [...prev, tag]);
      const currentTagIds = getValues('tagIds');
      setValue('tagIds', [...currentTagIds, tag.id], { shouldDirty: true });
    },
    [getValues, setValue],
  );

  const handleCategoryCreated = useCallback(
    (category: {
      id: string;
      name: string;
      slug: string;
      language: 'vi' | 'en';
    }) => {
      setCategories(prev => [...prev, category]);
      setValue('categoryId', category.id, { shouldDirty: true });
    },
    [setValue],
  );

  // ============================================
  // EMAIL VALIDATION
  // ============================================

  const validateEmail = useCallback(
    (email: string): boolean | string => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return t('invalidEmailFormat');
      }
      return true;
    },
    [t],
  );

  // ============================================
  // PREVIEW HANDLER
  // ============================================

  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <form onSubmit={onFormSubmit} className="space-y-6">
        <div className="bg-background/95 sticky top-0 z-20 border-b pb-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="">
              <Link
                href="/admin/posts"
                className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Posts
              </Link>
              <h1 className="text-3xl font-bold">Create New Post</h1>
              <p className="text-muted-foreground mt-1 leading-normal">
                Write and publish your content
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-4">
                {isDirty && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-600 dark:bg-yellow-500" />
                    {t('unsavedChanges')}
                  </span>
                )}

                {autoSaveEnabled && (
                  <AutoSaveIndicator
                    status={autoSaveStatus}
                    lastSaved={lastSaved}
                  />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={isSubmitting}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('preview')}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const data = getValues();
                  handleSubmit(data, 'draft');
                }}
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {t('saveDraft')}
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || Object.keys(errors).length > 0}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? t('update') : t('publish')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Language Selector */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  {t('language')}
                  <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="language"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEditMode}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">🇻🇳 {t('vietnamese')}</SelectItem>
                        <SelectItem value="en">🇬🇧 {t('english')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {isEditMode && (
                  <p className="text-muted-foreground text-xs">
                    {t('languageCannotBeChanged')}
                  </p>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {t('title')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder={t('titlePlaceholder')}
                className="h-auto py-3 text-2xl font-bold"
              />
              <div className="flex items-center justify-between">
                {errors.title && (
                  <p className="text-destructive text-sm">
                    {errors.title.message}
                  </p>
                )}
                <CharacterCounter
                  current={getValues('title')?.length || 0}
                  max={200}
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                {t('slug')} <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/blog/</span>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder={t('slugPlaceholder')}
                />
              </div>
              {errors.slug && (
                <p className="text-destructive text-sm">
                  {errors.slug.message}
                </p>
              )}
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">
                {t('excerpt')}{' '}
                <span className="text-muted-foreground">({t('optional')})</span>
              </Label>
              <Textarea
                id="excerpt"
                {...form.register('excerpt')}
                placeholder={t('excerptPlaceholder')}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  {t('excerptHelperText')}
                </p>
                <CharacterCounter
                  current={getValues('excerpt')?.length || 0}
                  max={500}
                />
              </div>
            </div>

            {/* Content Editor - Memoized to prevent unnecessary re-renders */}
            <div className="space-y-2">
              <Label>
                {t('content')} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="content"
                control={form.control}
                render={({ field }) => (
                  <TiptapEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('contentPlaceholder')}
                    minHeight="600px"
                  />
                )}
              />
              {errors.content && (
                <p className="text-destructive text-sm">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Featured Image */}
            {currentType !== PostType.GALLERY && (
              <div className="space-y-2">
                <Label>{t('featuredImage')}</Label>
                <FeatureImageUploader
                  value={getValues('featuredImage')}
                  onChange={(file, previewUrl) => {
                    if (file) {
                      setFeaturedImageFile(file);
                      setValue('featuredImage', previewUrl || '', {
                        shouldDirty: true,
                      });
                    }
                  }}
                  onRemove={() => {
                    setFeaturedImageFile(null);
                    setValue('featuredImage', '', { shouldDirty: true });
                  }}
                />
              </div>
            )}

            {/* Gallery Manager */}
            {currentType === PostType.GALLERY && (
              <div className="space-y-2">
                <GalleryManager
                  images={galleryImages}
                  onChange={setGalleryImages}
                />
              </div>
            )}

            {/* Video Settings */}
            {currentType === PostType.VIDEO && (
              <div className="space-y-2">
                <VideoSettings
                  video={videoSettings.video}
                  videoUrl={videoSettings.videoUrl}
                  thumbnail={videoSettings.thumbnail}
                  duration={videoSettings.duration}
                  onChange={setVideoSettings}
                />
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {/* Auto-Save Toggle */}
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary h-4 w-4" />
                  <Label htmlFor="auto-save" className="cursor-pointer">
                    {t('autoSave')}
                  </Label>
                </div>
                <Switch
                  id="auto-save"
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {t('autoSaveDescription')}
              </p>
            </div>

            <CollapsibleSection
              title={t('generalSettings')}
              icon={<Settings className="h-4 w-4" />}
              defaultOpen={true}
            >
              <div className="space-y-4">
                {/* Post Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">{t('postType')}</Label>
                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PostType.ARTICLE}>
                            📄 {t('article')}
                          </SelectItem>
                          <SelectItem value={PostType.GALLERY}>
                            🖼️ {t('gallery')}
                          </SelectItem>
                          <SelectItem value={PostType.VIDEO}>
                            🎥 {t('video')}
                          </SelectItem>
                          <SelectItem value={PostType.DOCUMENT}>
                            📁 {t('document')}
                          </SelectItem>
                          <SelectItem value={PostType.LINK}>
                            🔗 {t('link')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('status')}</Label>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PostStatus.DRAFT}>
                            {t('draft')}
                          </SelectItem>
                          <SelectItem value={PostStatus.PUBLISHED}>
                            {t('published')}
                          </SelectItem>
                          <SelectItem value={PostStatus.SCHEDULED}>
                            {t('scheduled')}
                          </SelectItem>
                          <SelectItem value={PostStatus.ARCHIVED}>
                            {t('archived')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Publish Date */}
                {currentStatus === PostStatus.PUBLISHED && (
                  <div className="space-y-2">
                    <Label htmlFor="publishedAt">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {t('publishDate')}
                    </Label>
                    <Input
                      id="publishedAt"
                      type="datetime-local"
                      {...form.register('publishedAt')}
                    />
                  </div>
                )}

                {/* Schedule Date */}
                {currentStatus === PostStatus.SCHEDULED && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledFor">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {t('scheduleFor')}
                    </Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      {...form.register('scheduledFor')}
                    />
                    <p className="text-muted-foreground text-xs">
                      {t('scheduleHelperText')}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Visibility & Security */}
            <CollapsibleSection
              title={t('visibilityAndSecurity')}
              icon={<Shield className="h-4 w-4" />}
              defaultOpen={true}
            >
              <div className="space-y-4">
                {/* Visibility Options */}
                <div className="space-y-3">
                  <Label>{t('visibility')}</Label>

                  {/* Public */}
                  <Label className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
                    <input
                      type="radio"
                      value={PostVisibility.PUBLIC}
                      {...form.register('visibility')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        <Globe className="h-4 w-4 text-green-600" />
                        {t('publicPost')}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t('publicPostDescription')}
                      </p>
                    </div>
                  </Label>

                  {/* Unlisted */}
                  <Label className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
                    <input
                      type="radio"
                      value={PostVisibility.UNLISTED}
                      {...form.register('visibility')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        <Hash className="h-4 w-4 text-blue-600" />
                        {t('unlistedPost')}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t('unlistedPostDescription')}
                      </p>
                    </div>
                  </Label>

                  {/* Private */}
                  <Label className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
                    <input
                      type="radio"
                      value={PostVisibility.PRIVATE}
                      {...form.register('visibility')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        <EyeOff className="h-4 w-4 text-gray-600" />
                        {t('privatePost')}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t('privatePostDescription')}
                      </p>
                    </div>
                  </Label>

                  <Label className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
                    <input
                      type="radio"
                      value={PostVisibility.PASSWORD}
                      {...form.register('visibility')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        <Key className="h-4 w-4 text-yellow-600" />
                        {t('passwordProtected')}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t('passwordProtectedDescription')}
                      </p>
                    </div>
                  </Label>

                  {/* Restricted */}
                  <Label className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
                    <input
                      type="radio"
                      value={PostVisibility.RESTRICTED}
                      {...form.register('visibility')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        <UserCheck className="h-4 w-4 text-purple-600" />
                        {t('restrictedPost')}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t('restrictedPostDescription')}
                      </p>
                    </div>
                  </Label>
                </div>

                {/* Password Field */}
                {currentVisibility === PostVisibility.PASSWORD && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                    <Label htmlFor="password">
                      <Key className="mr-1 inline h-3 w-3" />
                      {t('password')}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...form.register('password')}
                      placeholder={t('passwordPlaceholder')}
                    />
                    <p className="text-muted-foreground text-xs">
                      {t('passwordHelperText')}
                    </p>
                    {errors.password && (
                      <p className="text-destructive text-sm">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Allowed Users */}
                {currentVisibility === PostVisibility.RESTRICTED && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                    <Label>
                      <UserCheck className="mr-1 inline h-3 w-3" />
                      {t('allowedUsers')}
                    </Label>
                    <Controller
                      name="allowedUserEmails"
                      control={form.control}
                      render={({ field }) => (
                        <TagInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder={t('allowedUsersPlaceholder')}
                          validate={validateEmail}
                        />
                      )}
                    />
                    <p className="text-muted-foreground text-xs">
                      {t('allowedUsersHelperText')}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Categorization */}
            <CollapsibleSection
              title={t('categorization')}
              icon={<Folder className="h-4 w-4" />}
              defaultOpen={true}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">{t('category')}</Label>
                  <div className="flex gap-2">
                    <Controller
                      name="categoryId"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={value => {
                            field.onChange(value == '0' ? '' : value);
                          }}
                        >
                          <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">{t('noCategory')}</SelectItem>
                            {filteredCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateCategory(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {filteredCategories.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      {t('noCategoriesAvailable', {
                        language:
                          currentLanguage === 'vi'
                            ? t('vietnamese')
                            : t('english'),
                      })}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('tags')}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateTag(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {t('newTag')}
                    </Button>
                  </div>
                  <Controller
                    name="tagIds"
                    control={form.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => {
                            const isSelected = field.value.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    field.onChange(
                                      field.value.filter(id => id !== tag.id),
                                    );
                                  } else {
                                    field.onChange([...field.value, tag.id]);
                                  }
                                }}
                                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {t('tagsSelected', { count: field.value.length })}
                        </p>
                      </div>
                    )}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* SEO Settings */}
            <CollapsibleSection
              title={t('seoSettings')}
              icon={<Info className="h-4 w-4" />}
              defaultOpen={false}
            >
              <div className="space-y-4">
                {/* Meta Title */}
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">{t('metaTitle')}</Label>
                  <Input
                    id="metaTitle"
                    {...form.register('metaTitle')}
                    placeholder={
                      getValues('title') || t('metaTitlePlaceholder')
                    }
                  />
                  <CharacterCounter
                    current={getValues('metaTitle')?.length || 0}
                    max={60}
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">
                    {t('metaDescription')}
                  </Label>
                  <Textarea
                    id="metaDescription"
                    {...form.register('metaDescription')}
                    placeholder={t('metaDescriptionPlaceholder')}
                    rows={3}
                  />
                  <CharacterCounter
                    current={getValues('metaDescription')?.length || 0}
                    max={160}
                  />
                </div>

                {/* SEO Preview */}
                <div className="pt-2">
                  <SEOPreview
                    title={getValues('metaTitle') || getValues('title')}
                    description={
                      getValues('metaDescription') || getValues('excerpt') || ''
                    }
                    url={`https://yoursite.com/blog/${getValues('slug')}`}
                  />
                </div>

                {/* Meta Keywords */}
                <div className="space-y-2">
                  <Label>{t('metaKeywords')}</Label>
                  <Controller
                    name="metaKeywords"
                    control={form.control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder={t('metaKeywordsPlaceholder')}
                      />
                    )}
                  />
                </div>

                {/* OG Image */}
                <div className="space-y-2">
                  <Label>{t('ogImage')}</Label>
                  <p className="text-muted-foreground text-xs">
                    {t('ogImageHelperText')}
                  </p>
                  {getValues('ogImage') ? (
                    <div className="group relative overflow-hidden rounded border">
                      <img
                        src={getValues('ogImage')}
                        alt="OG"
                        className="h-32 w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setValue('ogImage', '', { shouldDirty: true })
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <FeatureImageUploader
                      value={getValues('ogImage')}
                      onChange={(file, previewUrl) => {
                        if (file) {
                          setValue('ogImage', previewUrl || '', {
                            shouldDirty: true,
                          });
                        }
                      }}
                      onRemove={() => {
                        setValue('ogImage', '', { shouldDirty: true });
                      }}
                    />
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Featured Options */}
            <CollapsibleSection
              title={t('featuredOptions')}
              icon={<Sparkles className="h-4 w-4" />}
              defaultOpen={false}
            >
              <div className="space-y-4">
                {/* Is Featured */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isFeatured">{t('featuredPost')}</Label>
                    <p className="text-muted-foreground text-xs">
                      {t('featuredPostDescription')}
                    </p>
                  </div>
                  <Controller
                    name="isFeatured"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="isFeatured"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* Is Pinned */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPinned">{t('pinnedPost')}</Label>
                    <p className="text-muted-foreground text-xs">
                      {t('pinnedPostDescription')}
                    </p>
                  </div>
                  <Controller
                    name="isPinned"
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id="isPinned"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </form>

      {/* Dialogs */}
      <PostPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        post={{
          title: getValues('title'),
          excerpt: getValues('excerpt'),
          content: getValues('content'),
          featuredImage: getValues('featuredImage'),
          author: {
            name: 'You',
            image: undefined,
          },
          category: categories.find(c => c.id === getValues('categoryId')),
          tags: tags.filter(t => getValues('tagIds').includes(t.id)),
        }}
      />

      <CreateTagDialog
        open={showCreateTag}
        onOpenChange={setShowCreateTag}
        onTagCreated={handleTagCreated}
      />

      <CreateCategoryDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        onCategoryCreated={handleCategoryCreated}
        categories={categories}
      />

      <ConfirmDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        title={t('discardChangesTitle')}
        description={t('discardChangesDescription')}
        confirmText={t('discard')}
        cancelText={t('keepEditing')}
        variant="destructive"
        onConfirm={() => router.push('/admin/posts')}
      />
    </>
  );
}
