import type { ClauseLocator, Redactor } from '@/application/services';
import type { AnalysisResult, LocatedClause } from '@/domain/entities';
import { DocumentTooLongError } from '@/domain/errors';
import type {
  DocumentFileType,
  DocumentParser,
  LlmProvider,
} from '@/domain/ports';

export type AnalysisStep = 'parsing' | 'redacting' | 'analyzing';

export type AnalysisUpdate =
  | { readonly type: 'progress'; readonly step: AnalysisStep }
  | { readonly type: 'result'; readonly result: AnalysisResult };

export interface AnalyzeContractInput {
  readonly data: Uint8Array;
  readonly fileType: DocumentFileType;
}

const MAX_TEXT_LENGTH = 500_000;

export class AnalyzeContractUseCase {
  constructor(
    private readonly parser: DocumentParser,
    private readonly redactor: Redactor,
    private readonly llm: LlmProvider,
    private readonly locator: ClauseLocator,
  ) {}

  async *execute(
    { data, fileType }: AnalyzeContractInput,
    signal?: AbortSignal,
  ): AsyncGenerator<AnalysisUpdate, void> {
    yield { type: 'progress', step: 'parsing' };
    const text = await this.parser.parse(data, fileType);
    if (text.length > MAX_TEXT_LENGTH) {
      throw new DocumentTooLongError();
    }

    yield { type: 'progress', step: 'redacting' };
    const redaction = this.redactor.redact(text);
    const { redactedText, map } = redaction;

    yield { type: 'progress', step: 'analyzing' };
    const analysis = await this.llm.analyze(redactedText, signal);

    const clauses = analysis.clauses.map((clause): LocatedClause => {
      const redactedSpan = this.locator.locate(redactedText, clause.quote);
      const span =
        redactedSpan && this.redactor.toOriginalSpan(redactedSpan, redaction);

      return {
        quote: span
          ? text.slice(span.start, span.end)
          : map.restore(clause.quote),
        category: clause.category,
        risk: clause.risk,
        explanation: map.restore(clause.explanation),
        counterClause: map.restore(clause.counterClause),
        span,
      };
    });

    yield {
      type: 'result',
      result: {
        summary: map.restore(analysis.summary),
        clauses,
        text,
        redactedText,
      },
    };
  }
}
