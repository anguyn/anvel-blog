import { PropsWithChildren } from 'react';
import { HomeTemplate, HomeTemplateProps } from './home';
import { NotFoundTemplate } from './not-found';
import { ForbiddenTemplate } from './forbidden';
import { StandardTemplate, StandardTemplateProps } from './standard';

const templates = {
  notFound: NotFoundTemplate,
  forbidden: ForbiddenTemplate,
  standard: StandardTemplate,
  home: HomeTemplate,
};

export type TemplateNamesProps = keyof typeof templates;

export interface TemplateProps extends PropsWithChildren {
  name?: TemplateNamesProps;
  standard?: StandardTemplateProps;
  home?: HomeTemplateProps;
}

const Template = ({ name, standard, home, children }: TemplateProps) => {
  if (!name) {
    return null;
  }
  const Comp = templates[name as TemplateNamesProps];
  if (!Comp) {
    return null;
  }
  let props;
  switch (name) {
    case 'home':
      props = home;
      break;
    default:
      props = standard;
  }
  return <Comp {...props}>{children}</Comp>;
};

export { Template };
