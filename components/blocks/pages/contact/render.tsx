'use client';

import { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Github,
  Linkedin,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

interface ContactRenderProps {
  locale: string;
}

export function ContactRender({ locale }: ContactRenderProps) {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const contactSchema = z.object({
    name: z.string().min(2, t('nameTooShort')).max(100, t('nameTooLong')),
    email: z.string().email(t('invalidEmail')),
    subject: z
      .string()
      .min(5, t('subjectTooShort'))
      .max(200, t('subjectTooLong')),
    message: z
      .string()
      .min(20, t('messageTooShort'))
      .max(2000, t('messageTooLong')),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      contactSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          if (issue.path[0]) {
            newErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="mb-4 text-3xl font-bold">{t('successTitle')}</h2>
        <p className="mb-8 text-lg text-[var(--color-muted-foreground)]">
          {t('successMessage')}
        </p>
        <Button onClick={() => setStatus('idle')} variant="outline">
          {t('formTitle')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10">
          <MessageSquare className="h-8 w-8 text-[var(--color-primary)]" />
        </div>
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          {t('heroTitle')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          {t('heroSubtitle')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6 md:p-8">
            <h2 className="mb-6 text-2xl font-semibold">{t('formTitle')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  {t('nameLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('namePlaceholder')}
                  disabled={status === 'loading'}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  {t('emailLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('emailPlaceholder')}
                  disabled={status === 'loading'}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium"
                >
                  {t('subjectLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('subjectPlaceholder')}
                  disabled={status === 'loading'}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium"
                >
                  {t('messageLabel')} <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('messagePlaceholder')}
                  disabled={status === 'loading'}
                  rows={6}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                )}
              </div>

              {status === 'error' && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                  {t('errorMessage')}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Send className="h-5 w-5 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {t('sendButton')}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6">
            <Mail className="mb-4 h-8 w-8 text-[var(--color-primary)]" />
            <h3 className="mb-2 font-semibold">{t('emailTitle')}</h3>
            <a
              href={`mailto:${t('emailValue')}`}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              {t('emailValue')}
            </a>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6">
            <h3 className="mb-4 font-semibold">{t('socialTitle')}</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com/anguyn"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/nguyen-an-226a84149/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary)]/5 p-6">
            <Clock className="mb-4 h-8 w-8 text-[var(--color-primary)]" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {t('responseTime')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
