import { Injectable } from '@nestjs/common';
import { extractRawText } from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { DocumentParseError } from '@/domain/errors';
import type { DocumentFileType, DocumentParser } from '@/domain/ports';

async function extractPdfText(data: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(data) });
  try {
    const { text } = await parser.getText({ pageJoiner: '' });
    return text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(data: Uint8Array): Promise<string> {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const { value } = await extractRawText({ buffer });
  return value;
}

@Injectable()
export class PdfDocxDocumentParserAdapter implements DocumentParser {
  async parse(data: Uint8Array, fileType: DocumentFileType): Promise<string> {
    let text: string;
    try {
      text =
        fileType === 'pdf'
          ? await extractPdfText(data)
          : await extractDocxText(data);
    } catch (cause) {
      throw new DocumentParseError({ cause });
    }
    if (text.trim().length === 0) {
      throw new DocumentParseError();
    }
    return text;
  }
}
