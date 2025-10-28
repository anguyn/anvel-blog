import { PageModalDialog } from '@/components/custom/page-modal-dialog';
import { getTranslate, setStaticParamsLocale } from '@/i18n/server';
import { Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';
import { PageProps } from '@/types/global';
import { PrivacyPolicyRender } from '@/components/blocks/pages/legal/privacy-render';

interface PrivacyPolicyModalProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPolicyModal({ params }: PageProps) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  setStaticParamsLocale(locale);

  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const privacyTranslation = {
    heroTitle: t.privacy.heroTitle,
    heroSubtitle: t.privacy.heroSubtitle,
    lastUpdated: t.privacy.lastUpdated,
    infoCollectTitle: t.privacy.infoCollectTitle,
    infoCollectDesc: t.privacy.infoCollectDesc,
    infoItem1: t.privacy.infoItem1,
    infoItem2: t.privacy.infoItem2,
    infoItem3: t.privacy.infoItem3,
    infoItem4: t.privacy.infoItem4,
    infoItem5: t.privacy.infoItem5,
    howUseTitle: t.privacy.howUseTitle,
    howUseDesc: t.privacy.howUseDesc,
    useItem1: t.privacy.useItem1,
    useItem2: t.privacy.useItem2,
    useItem3: t.privacy.useItem3,
    useItem4: t.privacy.useItem4,
    useItem5: t.privacy.useItem5,
    sharingTitle: t.privacy.sharingTitle,
    sharingDesc: t.privacy.sharingDesc,
    shareItem1: t.privacy.shareItem1,
    shareItem2: t.privacy.shareItem2,
    shareItem3: t.privacy.shareItem3,
    shareItem4: t.privacy.shareItem4,
    securityTitle: t.privacy.securityTitle,
    securityDesc: t.privacy.securityDesc,
    rightsTitle: t.privacy.rightsTitle,
    rightsDesc: t.privacy.rightsDesc,
    rightItem1: t.privacy.rightItem1,
    rightItem2: t.privacy.rightItem2,
    rightItem3: t.privacy.rightItem3,
    rightItem4: t.privacy.rightItem4,
    rightItem5: t.privacy.rightItem5,
    contactTitle: t.privacy.contactTitle,
    contactDesc: t.privacy.contactDesc,
    contactEmail: t.privacy.contactEmail,
  };

  return (
    <PageModalDialog>
      <PrivacyPolicyRender translations={privacyTranslation} />
    </PageModalDialog>
  );
}
