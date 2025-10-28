import { cn } from '@/libs/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';

// SETUP - UI: Go to https://fluidtypography.com/ to make typography responsive (if it needed)

const typographyVariants = cva([''], {
  variants: {
    variant: {
      'big-title': 'leading-none font-sans text-[48px] lg:text-[64px]',
      h1: 'font-sans leading-none text-[36px] lg:text-[48px]',
      h2: 'font-sans leading-none lg:text-[40px]',
      h3: 'font-semibold leading-none lg:text-[32px]',
      h4: 'font-bold leading-none lg:text-[24px]',
      h5: 'font-semibold leading-none lg:text-[22px]',
      h6: 'leading-none lg:text-[20px]',
      title: 'font-Manrope leading-[0.87] text-[24px] lg:text-[36px]',
      label: 'font-Manrope leading-none text-[14px] lg:text-[18px]',
      'small-label': 'font-Manrope leading-none text-[16px]',
      'sub-label': 'font-Manrope leading-[0.75] text-[12px]',
      body: 'leading-[0.667] text-[16px]',
      'sub-body': 'font-Manrope leading-none text-[11px]',
      'button-label': 'font-medium leading-none text-[18px] lg:text-[20px]',
      'small-number': 'font-Manrope leading-none text-[14px]',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

export interface TypographyProps
  extends ComponentProps<'div'>,
    VariantProps<typeof typographyVariants> {
  asChild?: boolean;
}

const Typography = ({
  className,
  variant,
  asChild = false,
  ...props
}: TypographyProps) => {
  const Comp = asChild ? Slot : 'div';
  return (
    // @ts-ignore: Shadcn UI v4 Comp
    <Comp
      data-slot="typography"
      className={cn(typographyVariants({ variant, className }))}
      {...props}
    />
  );
};

export { Typography, typographyVariants };
