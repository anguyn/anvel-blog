'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/common/input';
import { Textarea } from '@/components/common/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Upload, Loader2, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { useSession } from 'next-auth/react';

interface ProfileSettingsFormProps {
  user: any;
  translations: any;
}

export function ProfileSettingsForm({
  user,
  translations,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { update } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [imagePreview, setImagePreview] = useState(user.image || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    twitter: user.twitter || '',
    github: user.github || '',
    linkedin: user.linkedin || '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning(translations.selectImageFile || 'Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        translations.imageSizeLimit || 'Kích thước ảnh phải nhỏ hơn 5MB',
      );
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }

      const data = await response.json();

      setImagePreview(data.image);
      setSelectedFile(null);

      toast.success(
        translations.avatarUpdated || 'Cập nhật ảnh đại diện thành công',
      );

      startTransition(async () => {
        await update({ image: data?.image });
        router.refresh();
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(
        error.message ||
          translations.avatarUploadError ||
          'Không thể tải lên ảnh đại diện',
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!imagePreview || !imagePreview.includes('r2.dev')) {
      toast.error(
        translations.noAvatarToDelete || 'Không có ảnh đại diện để xóa',
      );
      return;
    }

    setShowConfirm(true);
  };

  const confirmDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete avatar');
      }

      setImagePreview('');
      setSelectedFile(null);
      toast.success(
        translations.avatarDeleted || 'Đã xóa ảnh đại diện thành công',
      );

      startTransition(async () => {
        await update({ image: null });
        router.refresh();
      });
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      toast.error(
        error.message ||
          translations.avatarDeleteError ||
          'Không thể xóa ảnh đại diện',
      );
    } finally {
      setIsDeletingAvatar(false);
      setShowConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();

      toast.success(translations.saveSuccess || 'Cập nhật hồ sơ thành công');

      startTransition(async () => {
        await update(data?.user);
        router.refresh();
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(
        error.message || translations.saveError || 'Không thể cập nhật hồ sơ',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearSelectedImage = () => {
    setSelectedFile(null);
    setImagePreview(user.image || '');
  };

  const hasAvatar = imagePreview && imagePreview.includes('r2.dev');

  return (
    <Card>
      <CardContent className="p-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {translations.profileInfo || 'Thông tin hồ sơ'}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {translations.profileDescription ||
                'Cập nhật thông tin cá nhân của bạn'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Label>{translations.profilePicture || 'Ảnh đại diện'}</Label>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="h-20 w-20 rounded-full border-2 border-[var(--color-border)] object-cover"
                      />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          disabled={
                            isUploadingAvatar ||
                            isDeletingAvatar ||
                            isLoading ||
                            isPending
                          }
                          className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                          aria-label={
                            translations.clearSelection || 'Xóa lựa chọn'
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-secondary)]">
                      <Upload className="h-8 w-8 text-[var(--color-muted-foreground)]" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="avatar-upload"
                    disabled={
                      isUploadingAvatar ||
                      isDeletingAvatar ||
                      isLoading ||
                      isPending
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          isUploadingAvatar ||
                          isDeletingAvatar ||
                          isLoading ||
                          isPending
                        }
                        asChild
                      >
                        <span>{translations.chooseImage || 'Chọn ảnh'}</span>
                      </Button>
                    </Label>
                    {selectedFile && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAvatarUpload}
                        disabled={
                          isUploadingAvatar ||
                          isDeletingAvatar ||
                          isLoading ||
                          isPending
                        }
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {translations.uploading || 'Đang tải lên...'}
                          </>
                        ) : (
                          translations.upload || 'Tải lên'
                        )}
                      </Button>
                    )}
                    {hasAvatar && !selectedFile && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleAvatarDelete}
                        disabled={
                          isUploadingAvatar ||
                          isDeletingAvatar ||
                          isLoading ||
                          isPending
                        }
                      >
                        {isDeletingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {translations.deleting || 'Đang xóa...'}
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {translations.deleteAvatar || 'Xóa ảnh'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {translations.imageRequirements ||
                      'JPG, PNG hoặc GIF. Tối đa 5MB. Sẽ được chuyển sang WebP.'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Label htmlFor="name">{translations.name || 'Tên'}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                minLength={2}
                maxLength={50}
                required
                className="mt-1"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Label htmlFor="username">
                {translations.username || 'Tên người dùng'}
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                pattern="[a-z0-9_-]{3,20}"
                required
                className="mt-1"
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {translations.usernameRequirements ||
                  '3-20 ký tự, chữ thường, số, gạch ngang và gạch dưới'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Label htmlFor="bio">{translations.bio || 'Tiểu sử'}</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder={
                  translations.bioPlaceholder || 'Viết vài điều về bản thân...'
                }
                rows={4}
                maxLength={500}
                className="mt-1"
              />
              <p className="mt-1 text-right text-xs text-[var(--color-muted-foreground)]">
                {formData.bio.length}/500
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Label htmlFor="location">
                {translations.location || 'Địa điểm'}
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="San Francisco, CA"
                maxLength={100}
                className="mt-1"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <Label htmlFor="website">
                {translations.website || 'Website'}
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                className="mt-1"
              />
            </motion.div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {translations.socialLinks || 'Liên kết mạng xã hội'}
              </h3>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Label htmlFor="github">
                  {translations.github || 'GitHub'}
                </Label>
                <div className="mt-1 flex items-center">
                  <span className="mr-2 text-sm whitespace-nowrap text-[var(--color-muted-foreground)]">
                    github.com/
                  </span>
                  <Input
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder={
                      translations.usernamePlaceholder || 'tên người dùng'
                    }
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                <Label htmlFor="twitter">
                  {translations.twitter || 'Twitter'}
                </Label>
                <div className="mt-1 flex items-center">
                  <span className="mr-2 text-sm whitespace-nowrap text-[var(--color-muted-foreground)]">
                    twitter.com/
                  </span>
                  <Input
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder={
                      translations.usernamePlaceholder || 'tên người dùng'
                    }
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Label htmlFor="linkedin">
                  {translations.linkedin || 'LinkedIn'}
                </Label>
                <div className="mt-1 flex items-center">
                  <span className="mr-2 text-sm whitespace-nowrap text-[var(--color-muted-foreground)]">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder={
                      translations.usernamePlaceholder || 'tên người dùng'
                    }
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.55 }}
              className="flex items-center gap-3 border-t border-[var(--color-border)] pt-4"
            >
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  isPending ||
                  isUploadingAvatar ||
                  isDeletingAvatar
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translations.saving || 'Đang lưu...'}
                  </>
                ) : (
                  translations.save || 'Lưu'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={
                  isLoading ||
                  isPending ||
                  isUploadingAvatar ||
                  isDeletingAvatar
                }
              >
                {translations.cancel || 'Hủy'}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </CardContent>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={translations.confirmDeleteAvatarTitle || 'Xóa ảnh đại diện?'}
        description={
          translations.confirmDeleteAvatar ||
          'Bạn có chắc chắn muốn xóa ảnh đại diện này?'
        }
        confirmText={translations.delete || 'Xóa'}
        cancelText={translations.cancel || 'Hủy'}
        waitingText={translations.processing || 'Đang xử lý'}
        variant="destructive"
        onConfirm={confirmDeleteAvatar}
        isLoading={isDeletingAvatar}
        disableClose
      />
    </Card>
  );
}
