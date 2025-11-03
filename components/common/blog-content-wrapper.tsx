'use client';

import { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface BlogContentWrapperProps {
  content: string;
  className?: string;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="code-block-wrapper my-8 overflow-hidden rounded-lg">
      <div className="code-block-header border-border/50 bg-muted/50 flex items-center justify-between border-b px-4 py-2">
        <span className="code-block-lang text-muted-foreground font-mono text-xs tracking-wider uppercase">
          {language || 'plaintext'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || 'plaintext'}
        style={vscDarkPlus}
        os
        customStyle={{
          margin: 0,
          borderRadius: '0 0 0.5rem 0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.7',
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function BlogContentWrapper({
  content,
  className = '',
}: BlogContentWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>(
    [],
  );

  useEffect(() => {
    if (!content) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const codeBlocks = doc.querySelectorAll('pre code');

    const elements: React.ReactNode[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    codeBlocks.forEach((codeElement, index) => {
      const preElement = codeElement.parentElement;
      if (!preElement) return;

      const code = codeElement.textContent || '';
      const classNames = codeElement.className || '';
      const languageMatch = classNames.match(/language-(\w+)/);
      const language = languageMatch ? languageMatch[1] : 'plaintext';

      // Create placeholder
      const placeholder = document.createElement('div');
      placeholder.setAttribute('data-code-block', index.toString());
      placeholder.setAttribute('data-language', language);
      placeholder.textContent = code;
      preElement.replaceWith(placeholder);
    });
    // console.log(codeBlocks)

    // Split content by placeholders
    const parts: React.ReactNode[] = [];
    let currentHtml = '';
    let partIndex = 0;

    console.log('Temp div: ', tempDiv);

    Array.from(tempDiv.childNodes).forEach(node => {
      console.log('Dô 0: ', node.nodeType === Node.ELEMENT_NODE);
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as Element).classList.contains('code-block-content')
      ) {
        console.log('Dô 1: ', currentHtml);
        // Push accumulated HTML
        if (currentHtml.trim()) {
          parts.push(
            <div
              key={`html-${partIndex++}`}
              dangerouslySetInnerHTML={{ __html: currentHtml }}
            />,
          );
          currentHtml = '';
        }

        // Push code block
        const code = node.textContent || '';
        const language =
          (node as Element).getAttribute('data-language') || 'plaintext';

        console.log(language);
        parts.push(
          <CodeBlock
            key={`code-${partIndex++}`}
            code={code}
            language={language}
          />,
        );
      } else {
        // Accumulate HTML
        console.log('Dô 2: ', currentHtml);
        if (node.nodeType === Node.ELEMENT_NODE) {
          currentHtml += (node as Element).outerHTML;
        } else if (node.nodeType === Node.TEXT_NODE) {
          currentHtml += node.textContent;
        }
      }
    });

    // Push remaining HTML
    if (currentHtml.trim()) {
      parts.push(
        <div
          key={`html-${partIndex}`}
          dangerouslySetInnerHTML={{ __html: currentHtml }}
        />,
      );
    }

    setProcessedContent(parts);
  }, [content]);

  return (
    <div ref={contentRef} className={`blog-content ${className}`}>
      {processedContent.length > 0 ? (
        processedContent
      ) : (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
}
