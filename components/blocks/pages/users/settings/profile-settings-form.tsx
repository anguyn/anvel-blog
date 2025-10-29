'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/common/input';
import { Textarea } from '@/components/common/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Upload, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';

interface ProfileSettingsFormProps {
  user: any;
  translations: any;
}

export function ProfileSettingsForm({
  user,
  translations,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [imagePreview, setImagePreview] = useState(user.image || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
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
        translations.avatarUpdated || 'Avatar updated successfully',
      );
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
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
      toast.success(translations.saveSuccess);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || translations.saveError);
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

  return (
    <Card>
      <CardContent className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{translations.profileInfo}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {translations.profileDescription}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Label>Profile Picture</Label>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-full border-2 border-[var(--color-border)] object-cover"
                      />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
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
                    disabled={isUploadingAvatar}
                  />
                  <div className="flex gap-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={isUploadingAvatar}
                      >
                        <span>Choose Image</span>
                      </Button>
                    </Label>
                    {selectedFile && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload'
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    JPG, PNG or GIF. Max 5MB. Will be converted to WebP.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Label htmlFor="name">{translations.name}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                minLength={2}
                maxLength={50}
                className="mt-1"
              />
            </motion.div>

            {/* Username */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Label htmlFor="username">{translations.username}</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                pattern="[a-z0-9_-]{3,20}"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                3-20 characters, lowercase letters, numbers, hyphens and
                underscores only
              </p>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Label htmlFor="email">{translations.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                className="mt-1 bg-[var(--color-secondary)]"
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Email cannot be changed
              </p>
            </motion.div>

            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Label htmlFor="bio">{translations.bio}</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder={translations.bioPlaceholder}
                rows={4}
                maxLength={500}
                className="mt-1"
              />
              <p className="mt-1 text-right text-xs text-[var(--color-muted-foreground)]">
                {formData.bio.length}/500
              </p>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <Label htmlFor="location">{translations.location}</Label>
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

            {/* Website */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Label htmlFor="website">{translations.website}</Label>
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

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Links</h3>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 }}
              >
                <Label htmlFor="github">{translations.github}</Label>
                <div className="mt-1 flex items-center">
                  <span className="mr-2 text-sm text-[var(--color-muted-foreground)]">
                    github.com/
                  </span>
                  <Input
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="username"
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
                <Label htmlFor="twitter">{translations.twitter}</Label>
                <div className="mt-1 flex items-center">
                  <span className="mr-2 text-sm text-[var(--color-muted-foreground)]">
                    twitter.com/
                  </span>
                  <Input
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="username"
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.55 }}
              >
                <Label htmlFor="linkedin">{translations.linkedin}</Label>
                <div className="mt-1 flex items-center">
                  <span className="mr-2 text-sm text-[var(--color-muted-foreground)]">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="username"
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="flex items-center gap-3 pt-4"
            >
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translations.saving}
                  </>
                ) : (
                  translations.save
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {translations.cancel}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </CardContent>
    </Card>
  );
}
