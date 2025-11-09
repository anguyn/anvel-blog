'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { List } from 'lucide-react';
import { cn } from '@/libs/utils';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
  title: string;
}

export function TableOfContents({ headings, title }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' },
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    console.log('Heading id: ', id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (headings.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <List className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-1">
          {headings.map(heading => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={cn(
                'hover:text-primary block w-full text-left text-sm transition-colors',
                heading.level === 2 && 'pl-0',
                heading.level === 3 && 'pl-4',
                heading.level === 4 && 'pl-8',
                activeId === heading.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground',
              )}
            >
              <span className="line-clamp-2">{heading.text}</span>
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
