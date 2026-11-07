import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import { ClauseLocator, Redactor } from '@/application/services';
import { AnalyzeContractUseCase } from '@/application/use-cases/analyze-contract.use-case';
import {
  DOCUMENT_PARSER,
  LLM_PROVIDER,
  PII_DETECTOR,
  type DocumentParser,
  type LlmProvider,
  type PiiDetector,
} from '@/domain/ports';
import { AnthropicLlmAdapter } from '@/infra/llm/anthropic-llm.adapter';
import { PdfDocxDocumentParserAdapter } from '@/infra/parsing/pdf-docx-document-parser.adapter';
import { RegexNerPiiDetectorAdapter } from '@/infra/pii/regex-ner-pii-detector.adapter';
import { env } from '@/interface/config/env';
import { AnalysesController, GlobalExceptionFilter } from '@/interface/http';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (_request, response) => {
          const id = randomUUID();
          response.setHeader('X-Request-Id', id);
          return id;
        },
        serializers: {
          req: (request: Request) => ({
            id: request.id,
            method: request.method,
            url: request.url.split('?')[0],
          }),
          res: (response: Response) => ({ statusCode: response.statusCode }),
        },
        redact: {
          paths: ['req.body', 'req.headers', 'res.headers'],
          remove: true,
        },
      },
    }),
    ThrottlerModule.forRoot([
      { ttl: RATE_LIMIT_WINDOW_MS, limit: RATE_LIMIT_MAX_REQUESTS },
    ]),
  ],
  controllers: [AnalysesController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    ClauseLocator,
    { provide: DOCUMENT_PARSER, useClass: PdfDocxDocumentParserAdapter },
    { provide: PII_DETECTOR, useClass: RegexNerPiiDetectorAdapter },
    {
      provide: Redactor,
      useFactory: (detector: PiiDetector) => new Redactor(detector),
      inject: [PII_DETECTOR],
    },
    {
      provide: LLM_PROVIDER,
      useFactory: (logger: PinoLogger): LlmProvider => {
        if (env.LLM_PROVIDER !== 'anthropic') {
          throw new Error(
            `LLM_PROVIDER=${env.LLM_PROVIDER} has no adapter yet`,
          );
        }
        return new AnthropicLlmAdapter(
          new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }),
          env.LLM_MODEL,
          logger,
        );
      },
      inject: [PinoLogger],
    },
    {
      provide: AnalyzeContractUseCase,
      useFactory: (
        parser: DocumentParser,
        redactor: Redactor,
        llm: LlmProvider,
        locator: ClauseLocator,
      ) => new AnalyzeContractUseCase(parser, redactor, llm, locator),
      inject: [DOCUMENT_PARSER, Redactor, LLM_PROVIDER, ClauseLocator],
    },
  ],
})
export class AppModule {}
