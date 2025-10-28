'use client';

import { useEffect, useState } from 'react';
import { TableOfContents } from './table-of-contents';

interface TableOfContentsWrapperProps {
  content: string;
  title: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContentsWrapper({
  content,
  title,
}: TableOfContentsWrapperProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    // Extract headings from blog content after render
    const contentElement = document.querySelector('.blog-content');
    if (contentElement) {
      const headingElements = contentElement.querySelectorAll('h2, h3, h4');
      const extractedHeadings = Array.from(headingElements).map(
        (heading, index) => {
          const id = `heading-${index}`;
          heading.id = id;
          return {
            id,
            text: heading.textContent || '',
            level: parseInt(heading.tagName[1]),
          };
        },
      );
      setHeadings(extractedHeadings);
    }
  }, [content]);

  if (headings.length === 0) return null;

  return <TableOfContents headings={headings} title={title} />;
}
