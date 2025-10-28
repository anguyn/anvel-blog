'use client';

import {
  Heart,
  Target,
  Eye,
  Lightbulb,
  Github,
  Linkedin,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AboutTranslations {
  heroTitle: string;
  heroSubtitle: string;
  storyTitle: string;
  storySubtitle: string;
  storyP1: string;
  storyP2: string;
  storyP3: string;
  missionTitle: string;
  missionDesc: string;
  visionTitle: string;
  visionDesc: string;
  valuesTitle: string;
  valuesDesc: string;
  creatorTitle: string;
  creatorName: string;
  creatorRole: string;
  creatorBio: string;
  github: string;
  linkedin: string;
  contactMe: string;
  techTitle: string;
  techSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  getStarted: string;
  contactUs: string;
}

interface AboutRenderProps {
  locale: string;
  translations: AboutTranslations;
}

export function AboutRender({ locale, translations }: AboutRenderProps) {
  const t = translations;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10">
          <Heart className="h-8 w-8 text-[var(--color-primary)]" />
        </div>
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t.heroTitle}</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          {t.heroSubtitle}
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t.storyTitle}</h2>
          <p className="mb-2 text-sm font-medium text-[var(--color-primary)]">
            {t.storySubtitle}
          </p>
          <div className="space-y-4 text-[var(--color-muted-foreground)]">
            <p className="leading-normal">{t.storyP1}</p>
            <p className="leading-normal">{t.storyP2}</p>
            <p className="leading-normal">{t.storyP3}</p>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6">
            <Target className="mb-4 h-8 w-8 text-[var(--color-primary)]" />
            <h3 className="mb-2 text-lg font-semibold">{t.missionTitle}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {t.missionDesc}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6">
            <Eye className="mb-4 h-8 w-8 text-[var(--color-primary)]" />
            <h3 className="mb-2 text-lg font-semibold">{t.visionTitle}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {t.visionDesc}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6">
            <Lightbulb className="mb-4 h-8 w-8 text-[var(--color-primary)]" />
            <h3 className="mb-2 text-lg font-semibold">{t.valuesTitle}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {t.valuesDesc}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-8">
          <h2 className="mb-6 text-2xl font-semibold">{t.creatorTitle}</h2>
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <span className="text-4xl font-bold text-[var(--color-primary)]">
                AN
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="mb-2 text-xl font-semibold">{t.creatorName}</h3>
              <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
                {t.creatorRole}
              </p>
              <p className="mb-6 leading-normal text-[var(--color-muted-foreground)]">
                {t.creatorBio}
              </p>
              <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                <a
                  href="https://github.com/anguyn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                >
                  <Github className="h-4 w-4" />
                  {t.github}
                </a>
                <a
                  href="https://www.linkedin.com/in/nguyen-an-226a84149/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                >
                  <Linkedin className="h-4 w-4" />
                  {t.linkedin}
                </a>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
                >
                  <Mail className="h-4 w-4" />
                  {t.contactMe}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="mb-4 text-2xl font-semibold">{t.techTitle}</h2>
          <p className="mb-8 leading-normal text-[var(--color-muted-foreground)]">
            {t.techSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Next.js',
              'React',
              'TypeScript',
              'Prisma',
              'PostgreSQL',
              'Tailwind CSS',
            ].map(tech => (
              <span
                key={tech}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-4 py-2 text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-8 text-center">
          <h2 className="mb-4 text-2xl font-semibold">{t.ctaTitle}</h2>
          <p className="mb-6 leading-normal text-[var(--color-muted-foreground)]">
            {t.ctaSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href={`/${locale}/register`}>{t.getStarted}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/contact`}>{t.contactUs}</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
