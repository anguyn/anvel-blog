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

  // Handle browser/tab close
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

  // Handle navigation within app
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          // This won't actually prevent navigation in Next.js App Router
          // but we can show a warning
          throw new Error('Navigation cancelled');
        }
      }
    };

    // Note: Next.js App Router doesn't have a direct way to intercept navigation
    // This is a limitation we need to work around by disabling navigation buttons
    // when there are unsaved changes

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
