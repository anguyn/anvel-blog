'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/common/input';
import { Mail, CheckCircle2, AlertCircle, Send, Sparkles } from 'lucide-react';

interface NewsletterTranslations {
  title: string;
  description: string;
  emailPlaceholder: string;
  subscribe: string;
  subscribing: string;
  subscribed: string;
  invalidEmail: string;
  successMessage: string;
  errorMessage: string;
  privacy: string;
  feature1: string;
  feature2: string;
  feature3: string;
}

interface NewsletterProps {
  locale: string;
  translations: NewsletterTranslations;
}

export function Newsletter({ locale, translations }: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage(translations.invalidEmail);
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage(translations.successMessage);
        setEmail('');
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.message || translations.errorMessage);
      }
    } catch (error) {
      setStatus('error');
      setMessage(translations.errorMessage);
    }

    setTimeout(() => {
      if (status !== 'success') {
        setStatus('idle');
        setMessage('');
      }
    }, 5000);
  };

  return (
    <section className="relative overflow-hidden border-t border-[var(--color-border)] py-20 md:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-10 -left-20 h-64 w-64 rounded-full bg-[var(--color-primary)]/5 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-[var(--color-primary)]/5 blur-3xl"
        />
      </div>

      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-background)]/80 p-8 backdrop-blur-sm md:p-12">
            {/* Decorative Elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-10 -right-10 h-32 w-32 rounded-full border border-[var(--color-primary)]/20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full border border-[var(--color-primary)]/20"
            />

            <div className="relative">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary)]/10"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Mail className="h-8 w-8 text-[var(--color-primary)]" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mb-4 text-center"
              >
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                  {translations.title}
                </h2>
                <p className="text-lg text-[var(--color-muted-foreground)]">
                  {translations.description}
                </p>
              </motion.div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                onSubmit={handleSubmit}
                className="mx-auto max-w-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                    <Input
                      type="email"
                      placeholder={translations.emailPlaceholder}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={status === 'loading' || status === 'success'}
                      className="pl-10"
                    />
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="submit"
                      disabled={status === 'loading' || status === 'success'}
                      className="group w-full gap-2 sm:w-auto"
                    >
                      {status === 'loading' ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          >
                            <Sparkles className="h-5 w-5" />
                          </motion.div>
                          {translations.subscribing}
                        </>
                      ) : status === 'success' ? (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          {translations.subscribed}
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                          {translations.subscribe}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{message}</span>
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{message}</span>
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 text-center text-xs text-[var(--color-muted-foreground)]"
                >
                  {translations.privacy}
                </motion.p>
              </motion.form>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                {[
                  { icon: CheckCircle2, text: translations.feature1 },
                  { icon: CheckCircle2, text: translations.feature2 },
                  { icon: CheckCircle2, text: translations.feature3 },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center justify-center gap-2 text-sm text-[var(--color-muted-foreground)]"
                  >
                    <feature.icon className="h-4 w-4 text-[var(--color-primary)]" />
                    <span>{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
