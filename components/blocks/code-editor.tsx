'use client';

import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

const getLanguageExtension = (languageSlug: string) => {
  const slug = languageSlug.toLowerCase();

  if (slug.includes('javascript') || slug === 'js')
    return javascript({ jsx: true });
  if (slug.includes('typescript') || slug === 'ts')
    return javascript({ typescript: true });
  if (slug === 'tsx' || slug === 'jsx')
    return javascript({ jsx: true, typescript: true });

  return javascript();
};

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  placeholder = 'Enter your code here...',
  readOnly = false,
  height = '400px',
}: CodeEditorProps) {
  const t = useTranslations('common');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-[var(--color-input)] bg-[var(--color-muted)]"
        style={{ height }}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t('editorLoading')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-input)]">
      <CodeMirror
        value={value}
        height={height}
        theme={resolvedTheme == 'dark' ? vscodeDark : 'light'}
        extensions={[getLanguageExtension(language)]}
        onChange={onChange}
        placeholder={t('editorEnterCode')}
        readOnly={readOnly}
        editable={!readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
        }}
        className="text-sm"
      />
    </div>
  );
}
