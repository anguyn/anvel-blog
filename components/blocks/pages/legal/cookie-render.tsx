import { Cookie, Shield, Settings, BarChart3, Wrench } from 'lucide-react';

export interface CookieTranslations {
  heroTitle: string;
  lastUpdated: string;
  whatTitle: string;
  whatDesc: string;
  essentialTitle: string;
  essentialDesc: string;
  essentialItem1: string;
  essentialItem2: string;
  essentialItem3: string;
  functionalTitle: string;
  functionalDesc: string;
  functionalItem1: string;
  functionalItem2: string;
  functionalItem3: string;
  analyticsTitle: string;
  analyticsDesc: string;
  analyticsItem1: string;
  analyticsItem2: string;
  analyticsItem3: string;
  managingTitle: string;
  managingDesc: string;
  managingItem1: string;
  managingItem2: string;
  managingItem3: string;
  contactTitle: string;
  contactDesc: string;
  contactEmail: string;
}

interface CookieRenderProps {
  translations: CookieTranslations;
}

export function CookieRender({ translations }: CookieRenderProps) {
  const t = translations;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10">
          <Cookie className="h-7 w-7 text-[var(--color-primary)]" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">{t.heroTitle}</h1>
        <p className="text-sm leading-normal text-[var(--color-muted-foreground)]">
          {t.lastUpdated}
        </p>
      </div>

      <div className="space-y-5">
        <section>
          <h2 className="mb-3 text-xl font-semibold">{t.whatTitle}</h2>
          <p className="leading-normal text-[var(--color-muted-foreground)]">
            {t.whatDesc}
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.essentialTitle}</h2>
          </div>
          <p className="mb-3 text-[var(--color-muted-foreground)]">
            {t.essentialDesc}
          </p>
          <ul className="space-y-3 leading-normal text-[var(--color-muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.essentialItem1}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.essentialItem2}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.essentialItem3}
            </li>
          </ul>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.functionalTitle}</h2>
          </div>
          <p className="mb-3 leading-normal text-[var(--color-muted-foreground)]">
            {t.functionalDesc}
          </p>
          <ul className="space-y-3 leading-normal text-[var(--color-muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.functionalItem1}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.functionalItem2}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.functionalItem3}
            </li>
          </ul>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.analyticsTitle}</h2>
          </div>
          <p className="mb-3 leading-normal text-[var(--color-muted-foreground)]">
            {t.analyticsDesc}
          </p>
          <ul className="space-y-3 leading-normal text-[var(--color-muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.analyticsItem1}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.analyticsItem2}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.analyticsItem3}
            </li>
          </ul>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <Wrench className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-xl font-semibold">{t.managingTitle}</h2>
          </div>
          <p className="mb-3 leading-normal text-[var(--color-muted-foreground)]">
            {t.managingDesc}
          </p>
          <ul className="space-y-3 leading-normal text-[var(--color-muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.managingItem1}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.managingItem2}
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              {t.managingItem3}
            </li>
          </ul>
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
