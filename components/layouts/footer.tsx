import Link from 'next/link';
import { Github, Linkedin, Mail, Heart } from 'lucide-react';
import Image from 'next/image';
import LocaleFooter from '@/components/common/locale-footer';

interface FooterTranslations {
  description: string;
  product: string;
  blog: string;
  snippets: string;
  createSnippet: string;
  tags: string;
  about: string;
  legal: string;
  privacy: string;
  terms: string;
  cookiePolicy: string;
  copyright: string;
  contact: string;
  company: string;
}

interface FooterProps {
  locale: string;
  translations: FooterTranslations;
}

export function Footer({ locale, translations }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: translations.blog, href: `/${locale}/blog` },
      { name: translations.snippets, href: `/${locale}/snippets` },
      { name: translations.createSnippet, href: `/${locale}/snippets/new` },
      { name: translations.tags, href: `/${locale}/tags` },
    ],
    company: [
      { name: translations.about, href: `/${locale}/about` },
      { name: translations.contact, href: `/${locale}/contact` },
    ],
    legal: [
      { name: translations.privacy, href: `/${locale}/privacy-policy` },
      { name: translations.terms, href: `/${locale}/terms-of-service` },
      { name: translations.cookiePolicy, href: `/${locale}/cookie-policy` },
    ],
    social: [
      { name: 'GitHub', href: 'https://github.com/anguyn', icon: Github },
      {
        name: 'LinkedIn',
        href: 'https://www.linkedin.com/in/nguyen-an-226a84149/',
        icon: Linkedin,
      },
      { name: 'Email', href: 'mailto:contact@anvel.dev', icon: Mail },
    ],
  };

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="container mx-auto p-4 pt-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href={`/${locale}`}
              className="mb-4 flex items-center gap-2 font-semibold"
            >
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={32}
                height={32}
                priority
              />
              <span className="text-xl">Anvel</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-[var(--color-muted-foreground)]">
              {translations.description}
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.social.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="sr-only">{item.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold">{translations.product}</h3>
            <ul className="space-y-3">
              {footerLinks.product.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold">{translations.company}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 font-semibold">{translations.legal}</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                    prefetch
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4 sm:flex-row">
          <p className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            © {currentYear} Anvel. {translations.copyright}
            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          </p>
          <LocaleFooter />
        </div>
      </div>
    </footer>
  );
}
