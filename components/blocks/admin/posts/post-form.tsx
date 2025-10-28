'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { MediaUploader } from './media-uploader';
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
} from 'lucide-react';

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

const postFormSchema = z.object({
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
  allowedUserEmails: z.array(z.string().email()).optional(),
  isFeatured: z.boolean(),
  isPinned: z.boolean(),
  publishedAt: z.string().optional(),
  scheduledFor: z.string().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
});

type PostFormData = z.infer<typeof postFormSchema>;

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
      categoryId: post?.categoryId || '',
      tagIds: post?.tags?.map(t => t.tag.id) || [],
      featuredImage: post?.featuredImage || '',
      password: '',
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
  });

  const {
    watch,
    setValue,
    formState: { isDirty, errors },
  } = form;

  // Watch form values
  const watchType = watch('type');
  const watchVisibility = watch('visibility');
  const watchTitle = watch('title');
  const watchSlug = watch('slug');
  const watchContent = watch('content');
  const watchMetaTitle = watch('metaTitle');
  const watchMetaDescription = watch('metaDescription');
  const watchLanguage = watch('language');

  // Filter categories by selected language
  const filteredCategories = categories.filter(
    cat => cat.language === watchLanguage,
  );

  // ============================================
  // UNSAVED CHANGES WARNING
  // ============================================

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  const { confirmNavigation } = useUnsavedChanges({
    hasUnsavedChanges,
  });

  // ============================================
  // AUTO-SAVE
  // ============================================

  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled || !hasUnsavedChanges || !isEditMode) return;

    setAutoSaveStatus('saving');

    try {
      const data = form.getValues();
      const formData = {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        scheduledFor: data.scheduledFor
          ? new Date(data.scheduledFor)
          : undefined,
      };
      const result = await updatePostAction(post.id, formData);

      if (result.success) {
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        setHasUnsavedChanges(false);

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
  }, [autoSaveEnabled, hasUnsavedChanges, isEditMode, post, form]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      autoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveEnabled]);

  // ============================================
  // SLUG GENERATION
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

  useEffect(() => {
    if (!watchSlug || watchSlug === generateSlug(post?.title || '')) {
      setValue('slug', generateSlug(watchTitle));
    }
  }, [watchTitle, watchSlug, post, setValue]);

  // Reset category when language changes
  useEffect(() => {
    const currentCategory = categories.find(c => c.id === watch('categoryId'));
    if (currentCategory && currentCategory.language !== watchLanguage) {
      setValue('categoryId', '');
      toast.info(t('categoryResetDueToLanguageChange'));
    }
  }, [watchLanguage, categories, watch, setValue, t]);

  // ============================================
  // FEATURED IMAGE
  // ============================================

  const handleFeaturedImageSelect = (images: MediaItem[]) => {
    if (images.length > 0) {
      setValue('featuredImage', images[0].url);
      setHasUnsavedChanges(true);
    }
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================

  const onSubmit = async (
    data: PostFormData,
    action: 'draft' | 'publish' | 'schedule',
  ) => {
    setIsSubmitting(true);

    try {
      const status =
        action === 'draft'
          ? PostStatus.DRAFT
          : action === 'schedule'
            ? PostStatus.SCHEDULED
            : PostStatus.PUBLISHED;

      const formData = {
        ...data,
        status,
        publishedAt: action === 'publish' ? new Date() : undefined,
        scheduledFor: data.scheduledFor
          ? new Date(data.scheduledFor)
          : undefined,
        ...(watchType === PostType.GALLERY && {
          mediaIds: galleryImages.map(img => img.id),
        }),
        ...(watchType === PostType.VIDEO && videoSettings),
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
        setHasUnsavedChanges(false);
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
  };

  // ============================================
  // TAG & CATEGORY CREATION
  // ============================================

  const handleTagCreated = (tag: {
    id: string;
    name: string;
    slug: string;
  }) => {
    setTags([...tags, tag]);
    const currentTagIds = watch('tagIds');
    setValue('tagIds', [...currentTagIds, tag.id]);
    setHasUnsavedChanges(true);
  };

  const handleCategoryCreated = (category: {
    id: string;
    name: string;
    slug: string;
    language: 'vi' | 'en';
  }) => {
    setCategories([...categories, category]);
    setValue('categoryId', category.id);
    setHasUnsavedChanges(true);
  };

  // ============================================
  // EMAIL VALIDATION
  // ============================================

  const validateEmail = (email: string): boolean | string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t('invalidEmailFormat');
    }
    return true;
  };

  // ============================================
  // DISCARD CHANGES
  // ============================================

  const handleDiscard = () => {
    confirmNavigation(() => {
      router.push('/admin/posts');
    });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <form
        onSubmit={form.handleSubmit(data => onSubmit(data, 'publish'))}
        className="space-y-6"
      >
        {/* Header with Actions */}
        <div className="bg-background/95 sticky top-0 z-20 border-b pb-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {hasUnsavedChanges && (
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

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                disabled={isSubmitting}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('preview')}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onSubmit(form.getValues(), 'draft')}
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
                {!isEditMode && (
                  <p className="text-muted-foreground text-xs">
                    {t('selectPrimaryLanguage')}
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
                <CharacterCounter current={watchTitle.length} max={200} />
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
                  current={watch('excerpt')?.length || 0}
                  max={500}
                />
              </div>
            </div>

            {/* Content Editor */}
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
            {watchType !== PostType.GALLERY && (
              <div className="space-y-2">
                <Label>{t('featuredImage')}</Label>
                {watch('featuredImage') ? (
                  <div className="group relative overflow-hidden rounded-lg border">
                    <img
                      src={watch('featuredImage')}
                      alt="Featured"
                      className="h-64 w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setValue('featuredImage', '');
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t('remove')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <MediaUploader
                    onSelect={handleFeaturedImageSelect}
                    accept={['image/*']}
                  />
                )}
              </div>
            )}

            {/* Gallery Manager */}
            {watchType === PostType.GALLERY && (
              <div className="space-y-2">
                <GalleryManager
                  images={galleryImages}
                  onChange={images => {
                    setGalleryImages(images);
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
            )}

            {/* Video Settings */}
            {watchType === PostType.VIDEO && (
              <div className="space-y-2">
                <VideoSettings
                  video={videoSettings.video}
                  videoUrl={videoSettings.videoUrl}
                  thumbnail={videoSettings.thumbnail}
                  duration={videoSettings.duration}
                  onChange={data => {
                    setVideoSettings(data);
                    setHasUnsavedChanges(true);
                  }}
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

            {/* General Settings */}
            <CollapsibleSection
              title={t('generalSettings')}
              icon={<Settings className="h-4 w-4" />}
              defaultOpen={true}
            >
              <div className="space-y-4">
                {/* Post Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">{t('postType')}</Label>
                  <select
                    id="type"
                    {...form.register('type')}
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value={PostType.ARTICLE}>📄 {t('article')}</option>
                    <option value={PostType.GALLERY}>🖼️ {t('gallery')}</option>
                    <option value={PostType.VIDEO}>🎥 {t('video')}</option>
                    <option value={PostType.DOCUMENT}>
                      📁 {t('document')}
                    </option>
                    <option value={PostType.LINK}>🔗 {t('link')}</option>
                  </select>
                </div>

                {/* Post Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">{t('status')}</Label>
                  <select
                    id="status"
                    {...form.register('status')}
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value={PostStatus.DRAFT}>{t('draft')}</option>
                    <option value={PostStatus.PUBLISHED}>
                      {t('published')}
                    </option>
                    <option value={PostStatus.SCHEDULED}>
                      {t('scheduled')}
                    </option>
                    <option value={PostStatus.ARCHIVED}>{t('archived')}</option>
                  </select>
                </div>

                {/* Publish Date */}
                {watch('status') === PostStatus.PUBLISHED && (
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
                {watch('status') === PostStatus.SCHEDULED && (
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

                  {/* Password Protected */}
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
                {watchVisibility === PostVisibility.PASSWORD && (
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
                  </div>
                )}

                {/* Allowed Users */}
                {watchVisibility === PostVisibility.RESTRICTED && (
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
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="categoryId">{t('category')}</Label>
                  <div className="flex gap-2">
                    <select
                      id="categoryId"
                      {...form.register('categoryId')}
                      className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="">{t('noCategory')}</option>
                      {filteredCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
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
                          watchLanguage === 'vi'
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
                    placeholder={watchTitle || t('metaTitlePlaceholder')}
                  />
                  <CharacterCounter
                    current={watchMetaTitle?.length || 0}
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
                    current={watchMetaDescription?.length || 0}
                    max={160}
                  />
                </div>

                {/* SEO Preview */}
                <div className="pt-2">
                  <SEOPreview
                    title={watchMetaTitle || watchTitle}
                    description={watchMetaDescription || watch('excerpt') || ''}
                    url={`https://yoursite.com/blog/${watchSlug}`}
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
                  {watch('ogImage') ? (
                    <div className="group relative overflow-hidden rounded border">
                      <img
                        src={watch('ogImage')}
                        alt="OG"
                        className="h-32 w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setValue('ogImage', '')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <MediaUploader
                      onSelect={images => {
                        if (images.length > 0) {
                          setValue('ogImage', images[0].url);
                        }
                      }}
                      accept={['image/*']}
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
          title: watchTitle,
          excerpt: watch('excerpt'),
          content: watchContent,
          featuredImage: watch('featuredImage'),
          author: {
            name: 'You',
            image: undefined,
          },
          category: categories.find(c => c.id === watch('categoryId')),
          tags: tags.filter(t => watch('tagIds').includes(t.id)),
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
