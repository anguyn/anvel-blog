'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  message?: string;
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesProps) {
  const router = useRouter();

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          throw new Error('Navigation cancelled');
        }
      }
    };

    return () => {
      // Cleanup
    };
  }, [hasUnsavedChanges, message, router]);

  const confirmNavigation = useCallback(
    (callback: () => void) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message);
        if (confirmed) {
          callback();
        }
      } else {
        callback();
      }
    },
    [hasUnsavedChanges, message],
  );

  return { confirmNavigation };
}
