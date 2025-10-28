import { LocaleProps } from '@/i18n/config';
import {
  AnchorHTMLAttributes,
  DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS,
  HTMLAttributeAnchorTarget,
  SVGProps,
} from 'react';

export interface PageProps {
  params: Promise<{
    locale?: LocaleProps;
    all?: string[];
    uri?: string;
    slug?: string;
    id?: string;
    token?: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface StaticParamsProps extends Pick<PageProps, 'params'> {}

export type SvgProps = SVGProps<SVGSVGElement>;

export interface CustomButtonHTMLAttributes {
  disabled?: boolean | undefined;
  form?: string | undefined;
  formAction?:
    | string
    | ((formData: FormData) => void | Promise<void>)
    | DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS[keyof DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS]
    | undefined;
  formEncType?: string | undefined;
  formMethod?: string | undefined;
  formNoValidate?: boolean | undefined;
  formTarget?: string | undefined;
  name?: string | undefined;
  type?: 'submit' | 'reset' | 'button' | undefined | string;
  value?: string | readonly string[] | number | undefined;
}

export interface AnchorOrButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'type'>,
    CustomButtonHTMLAttributes {}

export interface LinkProps {
  url?: string;
  text?: string;
  target?: HTMLAttributeAnchorTarget;
  rel?: string;
}

export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  focalX?: number;
  focalY?: number;
}
export interface MediaProps {
  id?: number;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  filename?: string;
  filesize?: number;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface AspectRatioOptionsProps {
  aspectRatio?:
    | {
        widthUnit: number;
        heightUnit: number;
      }
    | 'auto';
  breakpoints?: Record<
    number,
    {
      aspectRatio?:
        | {
            widthUnit: number;
            heightUnit: number;
          }
        | 'auto';
    }
  >;
}

export enum MediaType {
  Image = 'image',
  Gif = 'gif',
  Video = 'video',
}
