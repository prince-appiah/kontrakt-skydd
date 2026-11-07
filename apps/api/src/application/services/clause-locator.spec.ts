import { describe, expect, it } from 'vitest';
import { ClauseLocator } from './clause-locator';

const locator = new ClauseLocator();

const text = `1. Payment. The Client shall pay [PERSON_1] [AMOUNT_1] per month.

2. Termination. Either party may terminate this Agreement with thirty (30) days written notice to the other party.

3. Liability. The “Consultant” is liable without limit for all losses of the Client.

4. Renewal. The term is 12\u2013month and renews \u2014 unless cancelled in writing.`;

function slice(span: { start: number; end: number } | null): string | null {
  return span ? text.slice(span.start, span.end) : null;
}

describe('ClauseLocator', () => {
  it('finds an exact quote', () => {
    const quote =
      'Either party may terminate this Agreement with thirty (30) days written notice to the other party.';

    expect(slice(locator.locate(text, quote))).toBe(quote);
  });

  it('finds a quote that differs in case, spacing and punctuation style', () => {
    const quote =
      'The "consultant"   is LIABLE without limit\nfor all losses of the Client.';

    expect(slice(locator.locate(text, quote))).toBe(
      'The “Consultant” is liable without limit for all losses of the Client.',
    );
  });

  it('treats long dashes and plain hyphens as the same', () => {
    const quote =
      'The term is 12-month and renews - unless cancelled in writing.';

    expect(slice(locator.locate(text, quote))).toBe(
      'The term is 12\u2013month and renews \u2014 unless cancelled in writing.',
    );
  });

  it('finds a quote with a word added in the middle', () => {
    const quote =
      'Either party may terminate this Agreement with thirty (30) days prior written notice to the other party.';

    expect(slice(locator.locate(text, quote))).toBe(
      'Either party may terminate this Agreement with thirty (30) days written notice to the other party.',
    );
  });

  it('never cuts a token in half', () => {
    expect(slice(locator.locate(text, 'AMOUNT_1] per month.'))).toBe(
      '[AMOUNT_1] per month.',
    );
    expect(slice(locator.locate(text, 'shall pay [PERSON_1'))).toBe(
      'shall pay [PERSON_1]',
    );
  });

  it('returns null when the quote is not in the text', () => {
    expect(
      locator.locate(text, 'This sentence is nowhere in the contract at all.'),
    ).toBeNull();
    expect(locator.locate(text, '   ')).toBeNull();
  });
});
