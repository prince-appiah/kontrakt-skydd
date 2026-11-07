import { describe, expect, it } from 'vitest';
import { Redactor } from '@/application/services/redactor';
import { RegexNerPiiDetectorAdapter } from '@/infra/pii/regex-ner-pii-detector.adapter';

const redactor = new Redactor(new RegexNerPiiDetectorAdapter());

const contract = `This Agreement is made between Nordlys Software AB, Storgatan 12, 111 22 Stockholm, and Anna Lindqvist (personnummer 850312-1234, anna.lindqvist@example.test, +46 70 123 45 67).
Termination. Either party may terminate this Agreement with 30 days written notice.
Payment. The Client shall pay the Consultant 45 000 SEK per month to IBAN SE35 5000 0000 0549 1000 0003. Karl Ek of Acme Holdings Ltd signs for the Client.`;

describe('Redactor', () => {
  it('gives back the original text after redacting and restoring', () => {
    const { redactedText, map } = redactor.redact(contract);

    expect(redactedText).not.toBe(contract);
    expect(map.restore(redactedText)).toBe(contract);
  });

  it.each([
    [
      'EMAIL',
      'Write to anna.lindqvist@example.test today.',
      'anna.lindqvist@example.test',
    ],
    ['PHONE', 'Call +46 70 123 45 67 for help.', '+46 70 123 45 67'],
    ['PHONE', 'Call 070-123 45 67 for help.', '070-123 45 67'],
    ['PERSONNUMMER', 'Personnummer 850312-1234 is on file.', '850312-1234'],
    [
      'IBAN',
      'Pay to SE35 5000 0000 0549 1000 0003 monthly.',
      'SE35 5000 0000 0549 1000 0003',
    ],
    ['POSTCODE', 'The office is at 111 22 Stockholm.', '111 22'],
    ['AMOUNT', 'The fee is 45 000 SEK per month.', '45 000 SEK'],
    ['ADDRESS', 'The office is at Storgatan 12 in town.', 'Storgatan 12'],
    ['ORG', 'Signed by Nordlys Software AB today.', 'Nordlys Software AB'],
    ['PERSON', 'The Consultant is Anna Lindqvist.', 'Anna Lindqvist'],
  ])('catches %s in "%s"', (type, sentence, value) => {
    const { redactedText } = redactor.redact(sentence);

    expect(redactedText).toContain(`[${type}_1]`);
    expect(redactedText).not.toContain(value);
  });

  it('uses the same token for the same value', () => {
    const { redactedText } = redactor.redact(
      'Anna Lindqvist signs. Later, Anna Lindqvist pays Karl Ek.',
    );

    expect(redactedText).toBe(
      '[PERSON_1] signs. Later, [PERSON_1] pays [PERSON_2].',
    );
  });

  it('leaves ordinary contract wording alone', () => {
    const wording =
      'Termination. Either party may terminate with 30 days notice by 2026-01-31. PROVIDED AS IS.';

    expect(redactor.redact(wording).redactedText).toBe(wording);
  });

  it('maps a span in the redacted text back to the original text', () => {
    const redaction = redactor.redact(contract);
    const quote = 'shall pay the Consultant [AMOUNT_1] per month';
    const start = redaction.redactedText.indexOf(quote);

    const span = redactor.toOriginalSpan(
      { start, end: start + quote.length },
      redaction,
    );

    expect(contract.slice(span.start, span.end)).toBe(
      'shall pay the Consultant 45 000 SEK per month',
    );
  });
});
