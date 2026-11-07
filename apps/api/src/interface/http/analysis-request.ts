import { MAX_FILE_SIZE_BYTES, analysisModeSchema } from '@clauseguard/shared';
import type { AnalyzeContractInput } from '@/application/use-cases/analyze-contract.use-case';
import {
  FileTooLargeError,
  InvalidRequestError,
  UnsupportedFileTypeError,
} from '@/domain/errors';
import type { DocumentFileType } from '@/domain/ports';

const PDF_SIGNATURE_WINDOW = 1024;
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

export interface UploadedDocument {
  readonly buffer: Uint8Array;
}

function detectFileType(data: Uint8Array): DocumentFileType {
  const head = Buffer.from(
    data.buffer,
    data.byteOffset,
    Math.min(PDF_SIGNATURE_WINDOW, data.byteLength),
  );
  if (head.includes('%PDF-')) {
    return 'pdf';
  }
  if (ZIP_SIGNATURE.every((byte, index) => data[index] === byte)) {
    return 'docx';
  }
  throw new UnsupportedFileTypeError();
}

export function parseAnalysisRequest(
  file: UploadedDocument | undefined,
  mode: unknown,
): AnalyzeContractInput {
  if (!file) {
    throw new InvalidRequestError('A file is required');
  }
  const parsedMode = analysisModeSchema.safeParse(mode);
  if (!parsedMode.success) {
    throw new InvalidRequestError('mode must be "cloud" or "private"');
  }
  if (parsedMode.data === 'private') {
    throw new InvalidRequestError('Private mode is not available yet');
  }
  if (file.buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError();
  }
  return { data: file.buffer, fileType: detectFileType(file.buffer) };
}
