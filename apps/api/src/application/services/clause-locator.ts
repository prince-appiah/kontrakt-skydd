import { TOKEN_PATTERN, type TextSpan } from '@/domain/value-objects';

interface NormalisedText {
  readonly value: string;
  readonly offsets: readonly number[];
}

const CHARACTER_REPLACEMENTS: Readonly<Record<string, string>> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u2011': '-',
  '\u2026': '...',
};

const MIN_WORDS_FOR_ANCHORS = 6;
const MAX_ANCHOR_WORDS = 5;
const MIN_LENGTH_RATIO = 0.5;
const MAX_LENGTH_RATIO = 1.5;

function normalise(text: string): NormalisedText {
  let value = '';
  const offsets: number[] = [];
  let previousWasSpace = true;
  for (let index = 0; index < text.length; index++) {
    const character = text.charAt(index);
    if (/\s/.test(character)) {
      if (!previousWasSpace) {
        value += ' ';
        offsets.push(index);
        previousWasSpace = true;
      }
      continue;
    }
    previousWasSpace = false;
    const replacement = (
      CHARACTER_REPLACEMENTS[character] ?? character
    ).toLowerCase();
    for (let unit = 0; unit < replacement.length; unit++) {
      value += replacement.charAt(unit);
      offsets.push(index);
    }
  }
  return { value, offsets };
}

function findByAnchors(value: string, target: string): TextSpan | null {
  const words = target.split(' ');
  if (words.length < MIN_WORDS_FOR_ANCHORS) {
    return null;
  }
  const anchorSize = Math.min(MAX_ANCHOR_WORDS, Math.floor(words.length / 2));
  const head = words.slice(0, anchorSize).join(' ');
  const tail = words.slice(-anchorSize).join(' ');
  for (
    let start = value.indexOf(head);
    start !== -1;
    start = value.indexOf(head, start + 1)
  ) {
    const tailStart = value.indexOf(tail, start + head.length);
    if (tailStart === -1) {
      return null;
    }
    const end = tailStart + tail.length;
    const length = end - start;
    if (
      length >= target.length * MIN_LENGTH_RATIO &&
      length <= target.length * MAX_LENGTH_RATIO
    ) {
      return { start, end };
    }
  }
  return null;
}

function snapToTokens(text: string, span: TextSpan): TextSpan {
  let { start, end } = span;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const tokenStart = match.index;
    const tokenEnd = tokenStart + match[0].length;
    if (tokenStart >= end) {
      break;
    }
    if (tokenStart < start && start < tokenEnd) {
      start = tokenStart;
    }
    if (tokenStart < end && end < tokenEnd) {
      end = tokenEnd;
    }
  }
  return { start, end };
}

export class ClauseLocator {
  locate(text: string, quote: string): TextSpan | null {
    const needle = quote.trim();
    if (needle.length === 0) {
      return null;
    }

    const exactStart = text.indexOf(needle);
    if (exactStart !== -1) {
      return snapToTokens(text, {
        start: exactStart,
        end: exactStart + needle.length,
      });
    }

    const haystack = normalise(text);
    const target = normalise(needle).value.trim();
    const normalisedStart = haystack.value.indexOf(target);
    const found =
      normalisedStart !== -1
        ? { start: normalisedStart, end: normalisedStart + target.length }
        : findByAnchors(haystack.value, target);
    if (!found) {
      return null;
    }
    return snapToTokens(text, {
      start: haystack.offsets[found.start] ?? 0,
      end: (haystack.offsets[found.end - 1] ?? 0) + 1,
    });
  }
}
