'use client';
import { useMemo } from 'react';
import { highlight } from './MonacoEditor';

interface Props {
  code: string;
  language?: 'python' | 'yaml' | 'json';
}

export default function CodeBlock({ code, language = 'python' }: Props) {
  const highlighted = useMemo(() => highlight(code, language), [code, language]);
  return (
    <pre
      className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs md:text-sm font-mono leading-relaxed text-slate-900"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

