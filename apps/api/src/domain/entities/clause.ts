import type { RiskLevel, TextSpan } from '@/domain/value-objects';

export type ClauseCategory =
  | 'termination'
  | 'liability'
  | 'payment'
  | 'ip'
  | 'non_compete'
  | 'auto_renewal'
  | 'other';

export interface Clause {
  readonly quote: string;
  readonly category: ClauseCategory;
  readonly risk: RiskLevel;
  readonly explanation: string;
  readonly counterClause: string;
}

export interface LocatedClause extends Clause {
  readonly span: TextSpan | null;
}
