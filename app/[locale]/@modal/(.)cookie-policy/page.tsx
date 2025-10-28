import { PageModalDialog } from '@/components/custom/page-modal-dialog';
import { CookieRender } from '@/components/blocks/pages/legal/cookie-render';
import { PageProps } from '@/types/global';
import { getTranslate } from '@/i18n/server';

export default async function CookieModal(props: PageProps) {
  const { translate } = await getTranslate();

  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };

  const t = await translate(dictionaries);

  const cookiePolicyTranslation = {
    heroTitle: t.cookie.heroTitle,
    lastUpdated: t.cookie.lastUpdated,
    whatTitle: t.cookie.whatTitle,
    whatDesc: t.cookie.whatDesc,
    essentialTitle: t.cookie.essentialTitle,
    essentialDesc: t.cookie.essentialDesc,
    essentialItem1: t.cookie.essentialItem1,
    essentialItem2: t.cookie.essentialItem2,
    essentialItem3: t.cookie.essentialItem3,
    functionalTitle: t.cookie.functionalTitle,
    functionalDesc: t.cookie.functionalDesc,
    functionalItem1: t.cookie.functionalItem1,
    functionalItem2: t.cookie.functionalItem2,
    functionalItem3: t.cookie.functionalItem3,
    analyticsTitle: t.cookie.analyticsTitle,
    analyticsDesc: t.cookie.analyticsDesc,
    analyticsItem1: t.cookie.analyticsItem1,
    analyticsItem2: t.cookie.analyticsItem2,
    analyticsItem3: t.cookie.analyticsItem3,
    managingTitle: t.cookie.managingTitle,
    managingDesc: t.cookie.managingDesc,
    managingItem1: t.cookie.managingItem1,
    managingItem2: t.cookie.managingItem2,
    managingItem3: t.cookie.managingItem3,
    contactTitle: t.cookie.contactTitle,
    contactDesc: t.cookie.contactDesc,
    contactEmail: t.cookie.contactEmail,
  };

  return (
    <PageModalDialog>
      <CookieRender translations={cookiePolicyTranslation} />
    </PageModalDialog>
  );
}
