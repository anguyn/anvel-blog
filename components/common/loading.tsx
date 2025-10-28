export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]`}
      />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <div className="space-y-2">
        <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-secondary)]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-secondary)]" />
      </div>
      <div className="h-32 animate-pulse rounded bg-[var(--color-secondary)]" />
      <div className="flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--color-secondary)]" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--color-secondary)]" />
      </div>
    </div>
  );
}
