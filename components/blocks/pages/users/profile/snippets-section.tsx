'use client';

import { SnippetCard } from '@/components/blocks/snippet-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/common/card';
import { Snippet } from '@/types';
import { Code2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface UserSnippetsSectionProps {
  snippets: Snippet[];
  isOwner: boolean;
  locale: string;
  translations: {
    mySnippets: string;
    publicSnippets: string;
    createNew: string;
    noSnippetsYet: string;
    noPublicSnippets: string;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function UserSnippetsSection({
  snippets,
  isOwner,
  locale,
  translations,
}: UserSnippetsSectionProps) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold">
          {isOwner ? translations.mySnippets : translations.publicSnippets}
        </h2>
        {isOwner && (
          <Button asChild>
            <Link href={`/${locale}/snippets/new`}>
              <Code2 className="mr-2 h-4 w-4" />
              {translations.createNew}
            </Link>
          </Button>
        )}
      </motion.div>

      {snippets.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {snippets.map(snippet => (
            <motion.div key={snippet.id} variants={item}>
              <SnippetCard snippet={snippet} locale={locale} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-12 text-center">
              <Code2 className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" />
              <p className="text-[var(--color-muted-foreground)]">
                {isOwner
                  ? translations.noSnippetsYet
                  : translations.noPublicSnippets}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
