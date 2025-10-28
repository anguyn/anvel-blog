import { PageModalDialog } from '@/components/custom/page-modal-dialog';
import { TermsRender } from '@/components/blocks/pages/legal/terms-render';
import { PageProps } from '@/types/global';
import { getTranslate } from '@/i18n/server';

export default async function TermsModal(props: PageProps) {
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const tosTranslation = {
    heroTitle: t.terms.heroTitle,
    lastUpdated: t.terms.heroTitle,
    acceptanceTitle: t.terms.acceptanceTitle,
    acceptanceDesc: t.terms.acceptanceDesc,
    serviceTitle: t.terms.serviceTitle,
    serviceDesc: t.terms.serviceDesc,
    accountTitle: t.terms.accountTitle,
    accountDesc: t.terms.accountDesc,
    accountItem1: t.terms.accountItem1,
    accountItem2: t.terms.accountItem2,
    accountItem3: t.terms.accountItem3,
    accountItem4: t.terms.accountItem4,
    contentTitle: t.terms.contentTitle,
    contentDesc: t.terms.contentDesc,
    prohibitedTitle: t.terms.prohibitedTitle,
    prohibitedDesc: t.terms.prohibitedDesc,
    prohibitedItem1: t.terms.prohibitedItem1,
    prohibitedItem2: t.terms.prohibitedItem2,
    prohibitedItem3: t.terms.prohibitedItem3,
    prohibitedItem4: t.terms.prohibitedItem4,
    prohibitedItem5: t.terms.prohibitedItem5,
    moderationTitle: t.terms.moderationTitle,
    moderationDesc: t.terms.moderationDesc,
    disclaimerTitle: t.terms.disclaimerTitle,
    disclaimerDesc: t.terms.disclaimerDesc,
    contactTitle: t.terms.contactTitle,
    contactDesc: t.terms.contactDesc,
    contactEmail: t.terms.contactEmail,
  };

  return (
    <PageModalDialog>
      <TermsRender translations={tosTranslation} />
    </PageModalDialog>
  );
}
