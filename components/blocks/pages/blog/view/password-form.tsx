'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PasswordFormProps {
  slug: string;
  locale: string;
  translations: {
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    incorrectPassword: string;
  };
}

export function PasswordForm({
  slug,
  locale,
  translations,
}: PasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/posts/${slug}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(
          `/${locale}/blog/${slug}?password=${encodeURIComponent(password)}`,
        );
        router.refresh();
      } else {
        toast.error(translations.incorrectPassword);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          {translations.passwordLabel}
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={translations.passwordPlaceholder}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !password.trim()}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {translations.submit}
      </Button>
    </form>
  );
}
