'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setProgress(100);

      const timer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        const currentPath = window.location.pathname + window.location.search;

        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('/#') &&
          href !== currentPath
        ) {
          setIsLoading(true);
          setProgress(0);
          setTimeout(() => setProgress(10), 0);
        }
      }
    };

    const handlePopState = () => {
      setIsLoading(true);
      setProgress(0);
      setTimeout(() => setProgress(10), 0);
    };

    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isLoading || progress >= 90) return;

    const increment = () => {
      setProgress(prev => {
        if (prev >= 90) return 90;

        const diff = 90 - prev;
        const inc = diff * 0.1;

        return prev + inc;
      });
    };

    const timer = setInterval(increment, 300);

    return () => clearInterval(timer);
  }, [isLoading, progress]);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 right-0 left-0 z-[9999] h-[2.5px]"
      style={{
        opacity: progress === 100 ? 0 : 1,
        transition: progress === 100 ? 'opacity 0.2s ease-out' : 'none',
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? 'width 0.2s ease-out'
              : progress === 0
                ? 'none'
                : 'width 0.3s ease-out',
          boxShadow:
            '0 0 10px rgba(59, 130, 246, 0.5), 0 0 5px rgba(168, 85, 247, 0.3)',
        }}
      >
        <div
          className="absolute top-0 right-0 h-full w-[100px]"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.4))',
            transform: 'skewX(-10deg)',
            opacity: progress > 0 && progress < 100 ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
