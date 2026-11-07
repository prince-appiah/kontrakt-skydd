import { Module } from '@nestjs/common';
import { Redactor } from '@/application/services/redactor';
import {
  DOCUMENT_PARSER,
  PII_DETECTOR,
  type PiiDetector,
} from '@/domain/ports';
import { RegexNerPiiDetectorAdapter } from '@/infra/pii/regex-ner-pii-detector.adapter';
import { PdfDocxDocumentParserAdapter } from '@/infra/parsing/pdf-docx-document-parser.adapter';

@Module({
  providers: [
    { provide: DOCUMENT_PARSER, useClass: PdfDocxDocumentParserAdapter },
    { provide: PII_DETECTOR, useClass: RegexNerPiiDetectorAdapter },
    {
      provide: Redactor,
      useFactory: (detector: PiiDetector) => new Redactor(detector),
      inject: [PII_DETECTOR],
    },
  ],
})
export class AppModule {}
