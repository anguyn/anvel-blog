import { getLocale, setRequestLocale } from 'next-intl/server';
import { TranslateDictionariesProps } from './routing';
import { i18n, LocaleProps } from './config';

const getCurrentLocale = async () => {
  return (await getLocale()) as LocaleProps;
};

const getTranslate = async () => {
  const currentLocale = await getCurrentLocale();
  const translate = async (dictionaries: TranslateDictionariesProps) => {
    return dictionaries[currentLocale];
  };
  return { translate };
};

const getStaticParams = () => {
  return i18n.locales.map(locale => ({ locale }));
};

const setStaticParamsLocale = (locale?: LocaleProps) => {
  setRequestLocale(locale ?? i18n.defaultLocale);
};

export {
  getCurrentLocale,
  getStaticParams,
  getTranslate,
  setStaticParamsLocale,
};
