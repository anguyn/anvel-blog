'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import {
  UserPlus,
  MoreVertical,
  Ban,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { AdminUser, UserStatus } from '@/types';
import { UserFiltersBar } from './user-filters-bar';
import { UsersTable } from './users-table';
import { UserFormDialog } from './user-form-dialog';
import { Pagination } from '@/components/common/pagination';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUserStatus,
  getAllRoles,
} from '@/app/actions/users.action';

interface Role {
  id: string;
  name: string;
  level: number;
  color: string | null;
}

interface AdminUserRenderProps {
  locale: string;
}

export function AdminUserRender({ locale }: AdminUserRenderProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as UserStatus | 'all',
    roleId: 'all',
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Load users
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getUsers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy as any,
        sortOrder,
      });

      if (result.success && result.data) {
        setUsers(result.data.data);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error || 'Failed to load users');
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Load roles
  const loadRoles = async () => {
    const result = await getAllRoles();
    if (result.success && result.data) {
      setRoles(result.data);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters, sortBy, sortOrder, pagination.page]);

  useEffect(() => {
    loadRoles();
  }, []);

  // Handle filter change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Handle select user
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setSelectedUsers(selected ? users.map(u => u.id) : []);
  };

  // Handle create user
  const handleCreateUser = async (data: any) => {
    setIsFormLoading(true);
    try {
      const result = await createUser(data);
      if (result.success) {
        toast.success(result.message || 'User created successfully');
        setIsFormOpen(false);
        loadUsers();
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async (data: any) => {
    if (!editingUser) return;

    setIsFormLoading(true);
    try {
      const result = await updateUser(editingUser.id, data);
      if (result.success) {
        toast.success(result.message || 'User updated successfully');
        setIsFormOpen(false);
        setEditingUser(null);
        loadUsers();
      } else {
        toast.error(result.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const result = await deleteUser(deletingUser.id);
      if (result.success) {
        toast.success(result.message || 'User deleted successfully');
        setDeletingUser(null);
        loadUsers();
      } else {
        toast.error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: UserStatus) => {
    if (selectedUsers.length === 0) return;

    try {
      const result = await bulkUpdateUserStatus(selectedUsers, status);
      if (result.success) {
        toast.success(result.message || 'Users updated successfully');
        setSelectedUsers([]);
        loadUsers();
      } else {
        toast.error(result.error || 'Failed to update users');
      }
    } catch (error) {
      toast.error('Failed to update users');
    }
  };

  // Handle open create form
  const handleOpenCreateForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: AdminUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground leading-normal">
            Manage system users and permissions
          </p>
        </div>
        <Button onClick={handleOpenCreateForm}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <UserFiltersBar onFilterChange={handleFilterChange} roles={roles} />

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-muted/50 flex items-center gap-2 rounded-lg border p-4">
          <span className="text-sm font-medium">
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}{' '}
            selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="mr-2 h-4 w-4" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleBulkStatusUpdate(UserStatus.ACTIVE)}
              >
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Set as Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusUpdate(UserStatus.SUSPENDED)}
              >
                <Ban className="mr-2 h-4 w-4 text-yellow-500" />
                Suspend Users
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkStatusUpdate(UserStatus.BANNED)}
                className="text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Ban Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUsers([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <UsersTable
            users={users}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            onSelectAll={handleSelectAll}
            onEdit={handleOpenEditForm}
            onDelete={setDeletingUser}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={page => setPagination({ ...pagination, page })}
            />
          )}
        </>
      )}

      {/* Form Dialog */}
      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editingUser}
        roles={roles}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        isLoading={isFormLoading}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={() => setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{' '}
              <span className="font-semibold">
                {deletingUser?.name || deletingUser?.email}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
