'use client';

import { useState } from 'react';
import { Button } from '@/components/common/button';
import { Check, Copy } from 'lucide-react';
import { cn, copyToClipboard } from '@/libs/utils';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: CopyButtonProps) {
  const t = useTranslations('common');
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      toast.success(t('copySuccess'));
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error(t('copyError'));
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn(className, 'gap-2')}
    >
      {isCopied ? (
        <>
          <Check className="h-4 w-4" />
          {t('copied')}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
