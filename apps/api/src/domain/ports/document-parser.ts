export type DocumentFileType = 'pdf' | 'docx';

export interface DocumentParser {
  parse(data: Uint8Array, fileType: DocumentFileType): Promise<string>;
}

export const DOCUMENT_PARSER = Symbol('DOCUMENT_PARSER');
