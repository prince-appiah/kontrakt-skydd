import type { PiiDetector } from '@/domain/ports';
import { RedactionMap, type TextSpan } from '@/domain/value-objects';

export interface Redaction {
  readonly redactedText: string;
  readonly map: RedactionMap;
}

export class Redactor {
  constructor(private readonly detector: PiiDetector) {}

  redact(text: string): Redaction {
    const map = new RedactionMap();
    let redactedText = '';
    let cursor = 0;
    for (const { type, span } of this.detector.detect(text)) {
      const value = text.slice(span.start, span.end);
      redactedText +=
        text.slice(cursor, span.start) + map.tokenFor(type, value);
      cursor = span.end;
    }
    return { redactedText: redactedText + text.slice(cursor), map };
  }

  toOriginalSpan(span: TextSpan, { redactedText, map }: Redaction): TextSpan {
    return {
      start: map.restore(redactedText.slice(0, span.start)).length,
      end: map.restore(redactedText.slice(0, span.end)).length,
    };
  }
}
