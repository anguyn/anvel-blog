'use client';

import { useState } from 'react';
import { Input } from '@/components/common/input';
import { Button } from '@/components/common/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { UserStatus } from '@/types';

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface UserFiltersBarProps {
  onFilterChange: (filters: {
    search: string;
    status: UserStatus | 'all';
    roleId: string;
  }) => void;
  roles: Role[];
}

export function UserFiltersBar({ onFilterChange, roles }: UserFiltersBarProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [roleId, setRoleId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, status, roleId });
  };

  const handleStatusChange = (value: UserStatus | 'all') => {
    setStatus(value);
    onFilterChange({ search, status: value, roleId });
  };

  const handleRoleChange = (value: string) => {
    setRoleId(value);
    onFilterChange({ search, status, roleId: value });
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setRoleId('all');
    onFilterChange({ search: '', status: 'all', roleId: 'all' });
  };

  const hasActiveFilters = search || status !== 'all' || roleId !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full sm:w-auto"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground ml-2 flex h-5 w-5 items-center justify-center rounded-full text-xs">
              {
                [search, status !== 'all', roleId !== 'all'].filter(Boolean)
                  .length
              }
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                <SelectItem value={UserStatus.BANNED}>Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role Filter */}
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium">Role</label>
            <Select value={roleId} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
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
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="w-full sm:w-auto sm:self-end"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
