'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';

interface RegisterFormTranslations {
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  createAccount: string;
  alreadyHaveAccount: string;
  signIn: string;
  nameMinLength: string;
  invalidEmail: string;
  passwordMinLength: string;
  passwordsDontMatch: string;
  registrationFailed: string;
  accountCreatedSuccess: string;
  somethingWentWrong: string;
  passwordRequirements: string;
  requirement8Chars: string;
  requirementUppercase: string;
  requirementLowercase: string;
  requirementNumber: string;
  requirementSpecial: string;
  verificationEmailSent: string;
  verificationEmailSentMessage: string;
  checkYourEmail: string;
  resendVerificationEmail: string;
  resending: string;
  closeDialog: string;
  resendIn: string;
}

interface RegisterFormProps {
  locale: string;
  translations: RegisterFormTranslations;
}

const createRegisterSchema = (t: RegisterFormTranslations) =>
  z
    .object({
      name: z.string().min(2, t.nameMinLength).max(50, 'Name too long'),
      email: z.string().email(t.invalidEmail),
      password: z
        .string()
        .min(8, t.requirement8Chars)
        .regex(/[A-Z]/, t.requirementUppercase)
        .regex(/[a-z]/, t.requirementLowercase)
        .regex(/[0-9]/, t.requirementNumber)
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, t.requirementSpecial),
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t.passwordsDontMatch,
      path: ['confirmPassword'],
    });

export function RegisterForm({ locale, translations }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const registerSchema = useMemo(
    () => createRegisterSchema(translations),
    [translations],
  );

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchPassword = watch('password');

  useEffect(() => {
    setPassword(watchPassword || '');
  }, [watchPassword]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || translations.registrationFailed);
        return;
      }

      setRegisteredEmail(data.email);
      setShowSuccessDialog(true);
      setResendTimer(180); // 3 minutes cooldown

      toast.success(translations.accountCreatedSuccess);
    } catch (error) {
      toast.error(translations.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Verification email resent successfully');
        setResendTimer(180);
      } else if (response.status === 429) {
        const waitMinutes = Math.ceil((result.retryAfter || 180000) / 60000);
        toast.error(`Please wait ${waitMinutes} minutes before resending`);
        setResendTimer(Math.ceil((result.retryAfter || 180000) / 1000));
      } else {
        toast.error(result.error || 'Failed to resend email');
      }
    } catch (error) {
      toast.error('Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="text-muted-foreground h-3 w-3" />
      )}
      <span
        className={
          met ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
        }
      >
        {text}
      </span>
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            {translations.name} <span className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder={translations.namePlaceholder}
            disabled={isLoading}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {translations.email} <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={translations.emailPlaceholder}
            disabled={isLoading}
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {translations.password} <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={translations.passwordPlaceholder}
              disabled={isLoading}
              autoComplete="new-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}

          {password && password.length > 0 && (
            <div className="bg-muted/50 space-y-1.5 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {translations.passwordRequirements}
              </p>
              <PasswordRequirement
                met={passwordChecks.length}
                text={translations.requirement8Chars}
              />
              <PasswordRequirement
                met={passwordChecks.uppercase}
                text={translations.requirementUppercase}
              />
              <PasswordRequirement
                met={passwordChecks.lowercase}
                text={translations.requirementLowercase}
              />
              <PasswordRequirement
                met={passwordChecks.number}
                text={translations.requirementNumber}
              />
              <PasswordRequirement
                met={passwordChecks.special}
                text={translations.requirementSpecial}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            {translations.confirmPassword}{' '}
            <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={translations.confirmPasswordPlaceholder}
              disabled={isLoading}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-destructive text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {translations.createAccount}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {translations.alreadyHaveAccount}{' '}
          </span>
          <Link
            href={`/${locale}/login`}
            className="text-primary font-medium hover:underline"
          >
            {translations.signIn}
          </Link>
        </div>
      </form>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">
              {translations.verificationEmailSent}
            </DialogTitle>
            <DialogDescription className="text-center">
              {translations.verificationEmailSentMessage ||
                `We've sent a verification email to ${registeredEmail}. Please check your inbox and click the verification link.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {translations.checkYourEmail}
                  </p>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    {registeredEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {resendTimer > 0 ? (
                <Button variant="outline" className="w-full" disabled>
                  {translations.resendIn} {formatTime(resendTimer)}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {translations.resendVerificationEmail}
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push(`/${locale}/login`);
                }}
              >
                {translations.closeDialog || 'Go to Login'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
