'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${slug}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || translations.incorrectPassword);
        if (passwordInputRef && passwordInputRef.current)
          passwordInputRef.current.focus();
        setError(data.error || translations.incorrectPassword);
        return;
      }

      router.push(`/${locale}/blog/${slug}`);
      router.refresh();
    } catch (err) {
      toast.error('An error occurred. Please try again');
      setError('An error occurred. Please try again.');
      console.error('Password verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{translations.passwordLabel}</Label>
        <Input
          ref={passwordInputRef}
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={translations.passwordPlaceholder}
          required
          disabled={isLoading}
          autoFocus
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          translations.submit
        )}
      </Button>
    </form>
  );
}
