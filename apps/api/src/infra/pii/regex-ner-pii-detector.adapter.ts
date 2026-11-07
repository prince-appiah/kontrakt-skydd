import nlp from 'compromise';
import { z } from 'zod';
import type { PiiDetector, PiiMatch, PiiType } from '@/domain/ports';

const REGEX_RULES: ReadonlyArray<{ type: PiiType; pattern: RegExp }> = [
  {
    type: 'EMAIL',
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g,
  },
  {
    type: 'IBAN',
    pattern: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g,
  },
  {
    type: 'PERSONNUMMER',
    pattern: /\b(?:\d{6}|\d{8})[-+]\d{4}\b|\b(?:19|20)\d{10}\b/g,
  },
  {
    type: 'PHONE',
    pattern:
      /(?:\+|\b00)\d{1,3}[\s-]?\d{1,4}(?:[\s-]?\d{2,4}){2,4}\b|\b0\d{1,3}[\s-]?\d{2,3}(?:[\s-]?\d{2,3}){2,3}\b/g,
  },
  {
    type: 'AMOUNT',
    pattern:
      /\b\d+(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?\s?(?:SEK|NOK|DKK|EUR|USD|GBP|kr|kronor|euro|dollars?)\b|[€$£]\s?\d+(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?|\b(?:SEK|NOK|DKK|EUR|USD|GBP)\s?\d+(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?/gi,
  },
  {
    type: 'POSTCODE',
    pattern: /\b\d{3}\s?\d{2}\b(?=\s+\p{Lu}\p{Ll}+)/gu,
  },
  {
    type: 'ADDRESS',
    pattern:
      /(?<![\p{L}\d])\p{Lu}\p{L}*(?:gatan|vägen|gränd|allén|torget|stigen|backen|kajen|stråket|leden)\s+\d+[A-Za-z]?(?![\p{L}\d])|(?<![\p{L}\d])\d+[A-Za-z]?\s+(?:\p{Lu}\p{L}*\s+){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Drive|Boulevard)(?![\p{L}\d])/gu,
  },
  {
    type: 'ORG',
    pattern:
      /(?<![\p{L}\d])(?:\p{Lu}[\p{L}&-]*\s+){1,3}(?:AB|HB|KB|Ltd|Limited|Inc|LLC|GmbH|AG|Oy|PLC|Corp)(?![\p{L}\d])/gu,
  },
];

const nerRowsSchema = z.array(
  z.object({
    offset: z.object({ start: z.number().int(), length: z.number().int() }),
  }),
);

function findWithRegex(text: string): PiiMatch[] {
  return REGEX_RULES.flatMap(({ type, pattern }) =>
    [...text.matchAll(pattern)].map((match) => ({
      type,
      span: { start: match.index, end: match.index + match[0].length },
    })),
  );
}

const NER_CHUNK_SIZE = 20_000;

function splitForNer(text: string): { offset: number; chunk: string }[] {
  const chunks: { offset: number; chunk: string }[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + NER_CHUNK_SIZE, text.length);
    if (end < text.length) {
      const lineBreak = text.lastIndexOf('\n', end - 1);
      const space = text.lastIndexOf(' ', end - 1);
      if (lineBreak > start) {
        end = lineBreak + 1;
      } else if (space > start) {
        end = space + 1;
      }
    }
    chunks.push({ offset: start, chunk: text.slice(start, end) });
    start = end;
  }
  return chunks;
}

function toMatches(
  chunk: string,
  offset: number,
  rows: unknown,
  type: PiiType,
): PiiMatch[] {
  return nerRowsSchema.parse(rows).flatMap((row) => {
    const { start, length } = row.offset;
    const raw = chunk.slice(start, start + length);
    const trimmedLength = raw.replace(/[\s,.;:()[\]]+$/, '').length;
    return trimmedLength > 0
      ? [
          {
            type,
            span: {
              start: offset + start,
              end: offset + start + trimmedLength,
            },
          },
        ]
      : [];
  });
}

function findWithNer(text: string): PiiMatch[] {
  return splitForNer(text).flatMap(({ offset, chunk }) =>
    toMatches(
      chunk,
      offset,
      nlp(chunk).people().json({ offset: true }),
      'PERSON',
    ),
  );
}

function keepNonOverlapping(
  candidates: PiiMatch[],
  taken: Uint8Array,
): PiiMatch[] {
  const longestFirst = [...candidates].sort(
    (a, b) => b.span.end - b.span.start - (a.span.end - a.span.start),
  );
  const kept: PiiMatch[] = [];
  for (const candidate of longestFirst) {
    const { start, end } = candidate.span;
    if (taken.subarray(start, end).some(Boolean)) {
      continue;
    }
    taken.fill(1, start, end);
    kept.push(candidate);
  }
  return kept;
}

export class RegexNerPiiDetectorAdapter implements PiiDetector {
  detect(text: string): PiiMatch[] {
    const taken = new Uint8Array(text.length);
    const kept = [
      ...keepNonOverlapping(findWithRegex(text), taken),
      ...keepNonOverlapping(findWithNer(text), taken),
    ];
    return kept.sort((a, b) => a.span.start - b.span.start);
  }
}
