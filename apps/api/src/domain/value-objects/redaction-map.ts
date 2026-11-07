import type { PiiType } from '@/domain/ports';

const TOKEN_PATTERN = /\[[A-Z]+_\d+\]/g;

export class RedactionMap {
  readonly #valueByToken = new Map<string, string>();
  readonly #tokenByKey = new Map<string, string>();
  readonly #countByType = new Map<PiiType, number>();

  tokenFor(type: PiiType, value: string): string {
    const key = `${type}:${value}`;
    const existing = this.#tokenByKey.get(key);
    if (existing) {
      return existing;
    }

    const count = (this.#countByType.get(type) ?? 0) + 1;
    const token = `[${type}_${count}]`;

    this.#countByType.set(type, count);
    this.#tokenByKey.set(key, token);
    this.#valueByToken.set(token, value);

    return token;
  }

  restore(text: string): string {
    return text.replace(
      TOKEN_PATTERN,
      (token) => this.#valueByToken.get(token) ?? token,
    );
  }

  toJSON(): never {
    throw new Error('RedactionMap must not be serialised');
  }
}
