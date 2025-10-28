import {
  FileText,
  Shield,
  User,
  FileWarning,
  Ban,
  AlertTriangle,
} from 'lucide-react';

export interface TermsTranslations {
  heroTitle: string;
  lastUpdated: string;
  acceptanceTitle: string;
  acceptanceDesc: string;
  serviceTitle: string;
  serviceDesc: string;
  accountTitle: string;
  accountDesc: string;
  accountItem1: string;
  accountItem2: string;
  accountItem3: string;
  accountItem4: string;
  contentTitle: string;
  contentDesc: string;
  prohibitedTitle: string;
  prohibitedDesc: string;
  prohibitedItem1: string;
  prohibitedItem2: string;
  prohibitedItem3: string;
  prohibitedItem4: string;
  prohibitedItem5: string;
  moderationTitle: string;
  moderationDesc: string;
  disclaimerTitle: string;
  disclaimerDesc: string;
  contactTitle: string;
  contactDesc: string;
  contactEmail: string;
}

interface TermsRenderProps {
  translations: TermsTranslations;
}

export function TermsRender({ translations }: TermsRenderProps) {
  const t = translations;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10">
          <FileText className="h-7 w-7 text-[var(--color-primary)]" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">{t.heroTitle}</h1>
        <p className="text-sm leading-normal text-[var(--color-muted-foreground)]">
          {t.lastUpdated}
        </p>
      </div>

      <div className="space-y-5">
        <section>
          <h2 className="mb-3 text-xl font-semibold">{t.acceptanceTitle}</h2>
          <p className="leading-normal text-[var(--color-muted-foreground)]">
            {t.acceptanceDesc}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">{t.serviceTitle}</h2>
          <p className="leading-normal text-[var(--color-muted-foreground)]">
            {t.serviceDesc}
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.accountTitle}</h2>
          </div>
          <p className="mb-3 leading-normal text-[var(--color-muted-foreground)]">
            {t.accountDesc}
          </p>
          <ul className="space-y-3 text-[var(--color-muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.accountItem1}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.accountItem2}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.accountItem3}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.accountItem4}
            </li>
          </ul>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.contentTitle}</h2>
          </div>
          <p className="leading-normal text-[var(--color-muted-foreground)]">
            {t.contentDesc}
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <Ban className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.prohibitedTitle}</h2>
          </div>
          <p className="mb-3 leading-normal text-[var(--color-muted-foreground)]">
            {t.prohibitedDesc}
          </p>
          <ul className="space-y-3 text-[var(--color-muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.prohibitedItem1}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.prohibitedItem2}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.prohibitedItem3}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.prohibitedItem4}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.prohibitedItem5}
            </li>
          </ul>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.moderationTitle}</h2>
          </div>
          <p className="leading-normal text-[var(--color-muted-foreground)]">
            {t.moderationDesc}
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.disclaimerTitle}</h2>
          </div>
          <p className="leading-normal text-[var(--color-muted-foreground)]">
            {t.disclaimerDesc}
          </p>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6">
          <h2 className="mb-3 text-xl font-semibold">{t.contactTitle}</h2>
          <p className="leading-normal text-[var(--color-muted-foreground)]">
            {t.contactDesc}{' '}
            <a
              href={`mailto:${t.contactEmail}`}
              className="text-[var(--color-primary)] hover:underline"
            >
              {t.contactEmail}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
