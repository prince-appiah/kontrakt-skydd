import type { TextSpan } from '@/domain/value-objects';

export type PiiType =
  | 'EMAIL'
  | 'PHONE'
  | 'PERSONNUMMER'
  | 'IBAN'
  | 'POSTCODE'
  | 'AMOUNT'
  | 'PERSON'
  | 'ORG'
  | 'ADDRESS';

export interface PiiMatch {
  readonly type: PiiType;
  readonly span: TextSpan;
}

export interface PiiDetector {
  detect(text: string): PiiMatch[];
}

export const PII_DETECTOR = Symbol('PII_DETECTOR');
