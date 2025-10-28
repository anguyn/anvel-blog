import { headers } from 'next/headers';
import { ContactRender } from '@/components/blocks/pages/contact/render';
import { PageProps } from '@/types/global';

export default async function ContactModal(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  //   const headersList = await headers();
  //   const referer = headersList.get('referer') || '';

  //   if (referer) {
  //     const refererUrl = new URL(referer);
  //     const refererPath = refererUrl.pathname.replace(/^\/(en|vi)/, '');
  //     const refererLocale = refererUrl.pathname.match(/^\/(en|vi)/)?.[1];

  //     console.log(refererLocale)
  //     if (refererPath === '/contact') {
  //       return null;
  //     }
  //   }

  const { PageModalDialog } = await import(
    '@/components/custom/page-modal-dialog'
  );

  return (
    <PageModalDialog>
      <ContactRender locale={locale as string} />
    </PageModalDialog>
  );
}
