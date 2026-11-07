export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class UnsupportedFileTypeError extends DomainError {
  readonly code = 'UNSUPPORTED_FILE_TYPE';

  constructor(options?: ErrorOptions) {
    super('Only PDF and DOCX files are supported', options);
  }
}

export class FileTooLargeError extends DomainError {
  readonly code = 'FILE_TOO_LARGE';

  constructor(options?: ErrorOptions) {
    super('The file is larger than the 5 MB limit', options);
  }
}

export class DocumentParseError extends DomainError {
  readonly code = 'DOCUMENT_PARSE_FAILED';

  constructor(options?: ErrorOptions) {
    super('The document could not be read', options);
  }
}

export class LlmOutputInvalidError extends DomainError {
  readonly code = 'LLM_OUTPUT_INVALID';

  constructor(options?: ErrorOptions) {
    super('The AI returned a response that could not be used', options);
  }
}

export class LlmRequestFailedError extends DomainError {
  readonly code = 'LLM_REQUEST_FAILED';

  constructor(options?: ErrorOptions) {
    super('The AI service could not be reached', options);
  }
}

export class DocumentTooLongError extends DomainError {
  readonly code = 'DOCUMENT_TOO_LONG';

  constructor(options?: ErrorOptions) {
    super('The document is too long to analyse', options);
  }
}

export class InvalidRequestError extends DomainError {
  readonly code = 'INVALID_REQUEST';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
