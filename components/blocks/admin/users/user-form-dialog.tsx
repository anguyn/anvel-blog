'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/common/input';
import { Textarea } from '@/components/common/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AdminUser, UserStatus } from '@/types';

interface Role {
  id: string;
  name: string;
  level: number;
  color: string | null;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
  roles: Role[];
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  roleId: z.string().optional(),
  status: z.enum([
    UserStatus.ACTIVE,
    UserStatus.PENDING,
    UserStatus.SUSPENDED,
    UserStatus.BANNED,
  ]),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

type UserFormData = z.infer<typeof userFormSchema>;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
  isLoading,
}: UserFormDialogProps) {
  const isEditMode = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
      password: '',
      roleId: user?.roleId || undefined,
      status: user?.status || UserStatus.ACTIVE,
      bio: user?.bio || '',
    },
  });

  const roleId = watch('roleId');
  const status = watch('status');

  const handleFormSubmit = async (data: UserFormData) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update user information and permissions'
              : 'Add a new user to your system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="John Doe" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                disabled={isEditMode}
                {...register('email')}
              />
              {isEditMode && (
                <p className="text-sm text-gray-500">
                  Email cannot be changed after creation
                </p>
              )}
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                className="resize-none"
                rows={3}
                {...register('bio')}
              />
              <p className="text-sm text-gray-500">Max 500 characters</p>
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Security</h3>

            <div className="space-y-2">
              <Label htmlFor="password">Password {!isEditMode && '*'}</Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  isEditMode
                    ? 'Leave blank to keep current password'
                    : 'Enter password'
                }
                {...register('password')}
              />
              {isEditMode && (
                <p className="text-sm text-gray-500">
                  Only fill this if you want to change the password
                </p>
              )}
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Role & Status</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="roleId">Role</Label>
                <Select
                  value={roleId}
                  onValueChange={value => setValue('roleId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          {role.color && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                          )}
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Assign a role to define user permissions
                </p>
                {errors.roleId && (
                  <p className="text-sm text-red-500">
                    {errors.roleId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={status}
                  onValueChange={value =>
                    setValue('status', value as UserStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={UserStatus.SUSPENDED}>
                      Suspended
                    </SelectItem>
                    <SelectItem value={UserStatus.BANNED}>Banned</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Current account status</p>
                {errors.status && (
                  <p className="text-sm text-red-500">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
