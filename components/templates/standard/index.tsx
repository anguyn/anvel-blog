import { PropsWithChildren } from 'react';

export interface StandardTemplateProps extends PropsWithChildren {}

const StandardTemplate = ({ children }: StandardTemplateProps) => {
  return <>{children}</>;
};

export { StandardTemplate };
