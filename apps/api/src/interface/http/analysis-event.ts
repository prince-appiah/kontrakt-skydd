import type { AnalysisEvent } from '@clauseguard/shared';
import type { AnalysisUpdate } from '@/application/use-cases/analyze-contract.use-case';
import { DomainError } from '@/domain/errors';

export function toAnalysisEvent(update: AnalysisUpdate): AnalysisEvent {
  if (update.type === 'progress') return update;

  const { summary, clauses, text, redactedText } = update.result;

  return {
    type: 'result',
    data: {
      summary,
      text,
      redactedText,
      clauses: clauses.map(({ span, ...clause }) => ({
        ...clause,
        start: span?.start ?? null,
        end: span?.end ?? null,
      })),
    },
  };
}

export function toErrorEvent(error: unknown): AnalysisEvent {
  return error instanceof DomainError
    ? { type: 'error', code: error.code, message: error.message }
    : {
        type: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      };
}

export function formatServerSentEvent(event: AnalysisEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
