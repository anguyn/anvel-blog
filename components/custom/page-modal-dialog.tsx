'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageModalDialogProps {
  children: React.ReactNode;
}

export function PageModalDialog({ children }: PageModalDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    scrollPositionRef.current = window.scrollY;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant',
        });
      });
    };
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-200"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl"
      >
        <button
          onClick={handleClose}
          className="sticky top-4 right-4 z-10 mt-4 mr-4 ml-auto flex rounded-full border border-[var(--color-border)] bg-[var(--color-background)]/95 p-2 backdrop-blur-sm transition-all hover:scale-110 hover:cursor-pointer hover:bg-[var(--color-secondary)]"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto p-8 pt-0 md:p-12 md:pt-0">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
