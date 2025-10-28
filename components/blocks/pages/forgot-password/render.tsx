'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Loader2, Mail, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';

interface ForgotPasswordBlockProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    sendResetLink: string;
    sending: string;
    success: string;
    successMessage: string;
    error: string;
    invalidEmail: string;
    backToLogin: string;
    resendIn: string;
    canResendNow: string;
  };
}

export default function ForgotPasswordBlock({
  locale,
  translations,
}: ForgotPasswordBlockProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(0);

  const forgotPasswordSchema = z.object({
    email: z.string().email(translations.invalidEmail),
  });

  type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Resend timer (3 minutes from env)
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Expiry timer (3 minutes for reset link)
  useEffect(() => {
    if (expiryTimer > 0) {
      const timer = setTimeout(() => setExpiryTimer(expiryTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expiryTimer]);

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success(translations.success);

        // Set timers
        const resendCooldown = parseInt(
          process.env.NEXT_PUBLIC_RESEND_COOLDOWN || '180',
        ); // 3 minutes
        const linkExpiry = result.expiresIn || 180; // 3 minutes

        setResendTimer(resendCooldown);
        setExpiryTimer(linkExpiry);
      } else {
        toast.error(result.error || translations.error);
      }
    } catch (error) {
      toast.error(translations.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    const email = getValues('email');
    if (email) {
      onSubmit({ email });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="from-background to-secondary/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href={`/${locale}`}
            className="mx-auto mb-4 inline-flex items-center gap-2"
          >
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={48}
                height={48}
                priority
              />
            </div>
          </Link>
          <CardTitle>{translations.title}</CardTitle>
          <CardDescription>{translations.subtitle}</CardDescription>
        </CardHeader>

        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {translations.email} <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={translations.emailPlaceholder}
                    className="pl-10"
                    disabled={isLoading}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? translations.sending : translations.sendResetLink}
              </Button>

              <Link href={`/${locale}/login`}>
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {translations.backToLogin}
                </Button>
              </Link>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {translations.success}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {translations.successMessage}
                    </p>
                  </div>
                </div>
              </div>

              {expiryTimer > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div className="flex-1">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Reset link expires in:{' '}
                        <strong>{formatTime(expiryTimer)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {resendTimer > 0 ? (
                  <Button variant="outline" className="w-full" disabled>
                    {translations.resendIn} {formatTime(resendTimer)}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                  >
                    {translations.canResendNow}
                  </Button>
                )}
              </div>

              <Link href={`/${locale}/login`}>
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {translations.backToLogin}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
