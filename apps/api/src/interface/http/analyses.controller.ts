import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { AnalyzeContractUseCase } from '@/application/use-cases/analyze-contract.use-case';
import { DomainError } from '@/domain/errors';
import {
  MAX_FILE_SIZE_BYTES,
  parseAnalysisRequest,
  type UploadedDocument,
} from './analysis-request';
import {
  formatServerSentEvent,
  toAnalysisEvent,
  toErrorEvent,
} from './analysis-event';

@Controller('analyses')
export class AnalysesController {
  constructor(
    private readonly analyzeContract: AnalyzeContractUseCase,
    private readonly logger: PinoLogger,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
        fields: 4,
        fieldSize: 1024,
      },
    }),
  )
  async analyze(
    @UploadedFile() file: UploadedDocument | undefined,
    @Body('mode') mode: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const input = parseAnalysisRequest(file, mode);

    const clientLeft = new AbortController();

    response.on('close', () => clientLeft.abort());
    response.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });
    response.flushHeaders();

    const startedAt = performance.now();
    let outcome = 'completed';
    let clauseCount = 0;

    try {
      for await (const update of this.analyzeContract.execute(
        input,
        clientLeft.signal,
      )) {
        if (clientLeft.signal.aborted) {
          outcome = 'client_left';
          break;
        }
        if (update.type === 'result') {
          clauseCount = update.result.clauses.length;
        }
        response.write(formatServerSentEvent(toAnalysisEvent(update)));
      }
    } catch (error) {
      if (clientLeft.signal.aborted) {
        outcome = 'client_left';
      } else {
        outcome = error instanceof DomainError ? error.code : 'INTERNAL_ERROR';
        response.write(formatServerSentEvent(toErrorEvent(error)));
      }
    } finally {
      response.end();
      this.logger.info(
        {
          fileSize: input.data.byteLength,
          durationMs: Math.round(performance.now() - startedAt),
          clauseCount,
          outcome,
        },
        'analysis finished',
      );
    }
  }
}
