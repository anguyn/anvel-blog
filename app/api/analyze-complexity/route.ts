import { NextResponse } from 'next/server';
import { getTranslate } from '@/i18n/server';

function analyzeComplexity(code: string): string {
  code = code.toLowerCase();

  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/\/\/.*/g, '');
  code = code.replace(/"[^"]*"/g, '');
  code = code.replace(/'[^']*'/g, '');

  const forLoops = (code.match(/\bfor\s*\(/g) || []).length;
  const whileLoops = (code.match(/\bwhile\s*\(/g) || []).length;
  const forEachLoops = (code.match(/\.foreach\s*\(/g) || []).length;
  const mapCalls = (code.match(/\.map\s*\(/g) || []).length;

  const totalLoops = forLoops + whileLoops + forEachLoops + mapCalls;

  let maxNesting = 0;
  let currentNesting = 0;
  const loopKeywords = ['for', 'while', 'foreach', 'map'];

  const tokens = code.split(/[\s\n;{}()]/);
  for (let i = 0; i < tokens.length; i++) {
    if (loopKeywords.some(keyword => tokens[i].includes(keyword))) {
      currentNesting++;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
  }

  const hasRecursion =
    /function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)[\s\S]*?\1\s*\(/.test(code);
  const hasSorting = /\.sort\s*\(/.test(code);
  const hasBinarySearch = /binary.*search/i.test(code);
  const hasHashMap = /(map|dict|set|hash)/i.test(code);
  const hasLinearSearch = /\.find\s*\(|\.indexof\s*\(/.test(code);

  if (hasRecursion) {
    if (code.includes('divide') || code.includes('split')) {
      return 'O(n log n)';
    }
    return 'O(2^n)';
  }

  if (maxNesting >= 3 || totalLoops >= 3) {
    return 'O(n³)';
  }

  if (maxNesting >= 2 || totalLoops >= 2) {
    return 'O(n²)';
  }

  if (hasSorting) {
    return 'O(n log n)';
  }

  if (hasBinarySearch) {
    return 'O(log n)';
  }

  if (totalLoops >= 1 || hasLinearSearch) {
    return 'O(n)';
  }

  if (hasHashMap) {
    return 'O(1)';
  }

  return 'O(1)';
}

export async function POST(request: Request) {
  const { translate } = await getTranslate();
  const dictionaries = {
    en: (await import('@/translations/dictionaries/en.json')).default,
    vi: (await import('@/translations/dictionaries/vi.json')).default,
  };
  const t = (await translate(dictionaries)).api.analyzeComplexity;

  try {
    const { code, language } = await request.json();

    if (!code) {
      return NextResponse.json({ error: t.noCodeProvided }, { status: 400 });
    }

    const complexity = analyzeComplexity(code);

    const explanations: { [key: string]: string } = {
      'O(1)': t.o1,
      'O(log n)': t.oLogN,
      'O(n)': t.oN,
      'O(n log n)': t.oNLogN,
      'O(n²)': t.oN2,
      'O(n³)': t.oN3,
      'O(2^n)': t.o2N,
    };

    return NextResponse.json({
      complexity,
      explanation: explanations[complexity] || t.unknownComplexity,
      confidence: complexity === 'O(1)' ? 'low' : 'medium',
      note: t.note,
    });
  } catch (error) {
    console.error('Analyze complexity error:', error);
    return NextResponse.json({ error: t.failedToAnalyze }, { status: 500 });
  }
}
