import { Card, CardContent } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { formatDate } from '@/libs/utils';
import { Calendar, Code2, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfileHeaderProps {
  user: User;
  isOwner: boolean;
  locale: string;
  translations: {
    settings: string;
    joined: string;
    snippet: string;
    snippets: string;
  };
}

export function UserProfileHeader({
  user,
  isOwner,
  locale,
  translations,
}: UserProfileHeaderProps) {
  return (
    <Card className="pt-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex-shrink-0">
            {user.image ? (
              <Image
                key={user.image}
                src={user.image}
                alt={user.name || user.username || 'User'}
                width={128}
                height={128}
                className="h-32 w-32 rounded-full border-4 border-[var(--color-border)] object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-[var(--color-border)] bg-[var(--color-secondary)]">
                <Code2 className="h-16 w-16 text-[var(--color-muted-foreground)]" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <h1 className="text-3xl font-bold">
                  {user.name || user.username}
                </h1>
                <p className="mt-1 text-[var(--color-muted-foreground)]">
                  @{user.username}
                </p>
              </div>
              {isOwner && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    {translations.settings}
                  </Link>
                </Button>
              )}
            </div>

            {user.bio && (
              <p className="text-[var(--color-foreground)]">{user.bio}</p>
            )}

            {(user.website ||
              user.location ||
              user.github ||
              user.twitter ||
              user.linkedin) && (
              <div className="flex flex-wrap gap-3 text-sm">
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    🌐 Website
                  </a>
                )}
                {user.location && (
                  <span className="text-[var(--color-muted-foreground)]">
                    📍 {user.location}
                  </span>
                )}
                {user.github && (
                  <a
                    href={`https://github.com/${user.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    <svg
                      className="mr-1 inline h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {user.twitter && (
                  <a
                    href={`https://twitter.com/${user.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    𝕏 Twitter
                  </a>
                )}
                {user.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${user.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    💼 LinkedIn
                  </a>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)]">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {translations.joined} {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
