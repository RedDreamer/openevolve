'use client';
import { useMemo } from 'react';

const PY_KEYWORDS = /\b(def|return|for|while|if|else|elif|import|from|as|class|try|except|finally|with|lambda|pass|break|continue|True|False|None)\b/g;
const YAML_KEY = /^(\s*)([^:\n#]+):/gm;
const YAML_COMMENT = /(#.*)$/gm;
const JSON_KEY = /"([^"\\]+)":/g;

function highlight(code: string, language: 'python' | 'yaml' | 'json' = 'python') {
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (language === 'python') {
    escaped = escaped.replace(
      PY_KEYWORDS,
      '<span class="text-purple-600 font-medium">$1</span>',
    );
  } else if (language === 'yaml') {
    escaped = escaped
      .replace(
        YAML_KEY,
        '$1<span class="text-blue-600 font-medium">$2</span>:',
      )
      .replace(YAML_COMMENT, '<span class="text-slate-400">$1</span>');
  } else if (language === 'json') {
    escaped = escaped.replace(
      JSON_KEY,
      '"<span class="text-blue-600 font-medium">$1</span>":',
    );
  }

  return escaped;
}

export default function MonacoEditor({
  value,
  onChange,
  height = 420,
  language = 'python',
  readOnly = false,
}:{
  value: string;
  onChange?: (v: string) => void;
  height?: number;
  language?: 'python' | 'yaml' | 'json';
  readOnly?: boolean;
}) {
  const highlighted = useMemo(
    () => highlight(value, language),
    [value, language],
  );
  return (
    <div className="relative w-full" style={{ minHeight: height }}>
      <textarea
        value={value}
        onChange={readOnly ? undefined : e => onChange?.(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className={`absolute inset-0 h-full w-full resize-none rounded-xl border border-slate-200 bg-transparent p-3 font-mono text-base leading-6 text-transparent caret-slate-900 ${readOnly ? 'cursor-not-allowed' : ''}`}
      />
      <pre
        aria-hidden
        className={`pointer-events-none h-full w-full overflow-auto rounded-xl border border-slate-200 bg-white p-3 font-mono text-base leading-6 text-slate-900 ${readOnly ? 'opacity-80' : ''}`}
        dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
      />
    </div>
  );
}

