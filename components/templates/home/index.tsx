import { PropsWithChildren } from 'react';

export interface HomeTemplateProps extends PropsWithChildren {}

const HomeTemplate = ({ children }: HomeTemplateProps) => {
  return <>{children}</>;
};

export { HomeTemplate };
