import { TableOfContents } from './table-of-contents';

interface TableOfContentsWrapperProps {
  headings: Array<{ id: string; text: string; level: number }>;
  title: string;
}

export function TableOfContentsWrapper({
  headings,
  title,
}: TableOfContentsWrapperProps) {
  if (headings.length === 0) return null;

  return <TableOfContents headings={headings} title={title} />;
}
