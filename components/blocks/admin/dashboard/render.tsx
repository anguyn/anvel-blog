'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string;
  roleName: string | null;
  roleLevel: number;
}

interface DashboardManagementProps {
  locale: string;
}

export function DashboardManagement({ locale }: DashboardManagementProps) {
  const t = useTranslations('dashboard');

  return <div className="space-y-6"> Dashboard</div>;
}
