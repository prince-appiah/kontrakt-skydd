import type { Clause, LocatedClause } from './clause';

export interface ContractAnalysis {
  readonly summary: string;
  readonly clauses: readonly Clause[];
}

export interface AnalysisResult {
  readonly summary: string;
  readonly clauses: readonly LocatedClause[];
  readonly text: string;
  readonly redactedText: string;
}
