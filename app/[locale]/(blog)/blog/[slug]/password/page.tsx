import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { PasswordForm } from '@/components/blocks/pages/blog/view/password-form';
import {
  getTranslate,
  setStaticParamsLocale,
  getStaticParams,
} from '@/i18n/server';
import { PageProps } from '@/types/global';
import { MainLayout } from '@/components/layouts/main-layout';
import { Lock } from 'lucide-react';

export const generateStaticParams = getStaticParams;

export default async function PasswordPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const translations = {
    title: t.blog.passwordRequired || 'Password Required',
    description:
      t.blog.passwordDescription ||
      'This post is protected. Please enter the password to view the content.',
    passwordLabel: t.blog.passwordLabel || 'Password',
    passwordPlaceholder: t.blog.passwordPlaceholder || 'Enter password',
    submit: t.common.submit || 'Submit',
    incorrectPassword: t.blog.incorrectPassword || 'Incorrect password',
  };

  return (
    <MainLayout locale={locale}>
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Lock className="text-primary h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">{translations.title}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {translations.description}
              </p>
            </CardHeader>
            <CardContent>
              <PasswordForm
                slug={slug}
                locale={locale}
                translations={translations}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
