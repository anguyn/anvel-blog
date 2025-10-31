'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import { Badge } from '@/components/common/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { AdminUser, UserStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn, getThumbnailUrlFromAvatar } from '@/libs/utils';

interface UsersTableProps {
  users: AdminUser[];
  selectedUsers: string[];
  onSelectUser: (userId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function UsersTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onEdit,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: UsersTableProps) {
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && !allSelected;

  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      [UserStatus.ACTIVE]: {
        variant: 'default' as const,
        icon: CheckCircle,
        label: 'Active',
      },
      [UserStatus.PENDING]: {
        variant: 'secondary' as const,
        icon: Clock,
        label: 'Pending',
      },
      [UserStatus.SUSPENDED]: {
        variant: 'outline' as const,
        icon: ShieldAlert,
        label: 'Suspended',
      },
      [UserStatus.BANNED]: {
        variant: 'destructive' as const,
        icon: Ban,
        label: 'Banned',
      },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: AdminUser['role']) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;

    return (
      <Badge
        variant="outline"
        style={{
          borderColor: role.color || undefined,
          color: role.color || undefined,
        }}
        className="gap-1"
      >
        <Shield className="h-3 w-3" />
        {role.name}
      </Badge>
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="data-[state=open]:bg-accent -ml-3 h-8"
      onClick={() => onSort(field)}
    >
      {label}
      <ArrowUpDown
        className={cn('ml-2 h-4 w-4', sortBy === field && 'text-primary')}
      />
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
                className={cn(
                  someSelected && 'data-[state=checked]:bg-primary',
                )}
              />
            </TableHead>
            <TableHead className="w-[250px]">
              <SortButton field="name" label="User" />
            </TableHead>
            <TableHead>
              <SortButton field="email" label="Email" />
            </TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>
              <SortButton field="lastLoginAt" label="Last Login" />
            </TableHead>
            <TableHead>
              <SortButton field="createdAt" label="Joined" />
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => onSelectUser(user.id)}
                    aria-label={`Select ${user.name || user.email}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          getThumbnailUrlFromAvatar(user.image || '') ||
                          undefined
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.name || 'No Name'}
                      </div>
                      {user.username && (
                        <div className="text-muted-foreground text-sm">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {user.email}
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>
                  {user.twoFactorEnabled ? (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="h-3 w-3 text-green-500" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground gap-1"
                    >
                      Disabled
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.lastLoginAt
                    ? formatDistanceToNow(new Date(user.lastLoginAt), {
                        addSuffix: true,
                      })
                    : 'Never'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
