import 'dotenv/config';
import { z } from 'zod';

const baseEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_ORIGIN: z.url().transform((value) => new URL(value).origin),
  LLM_MODEL: z.string().min(1),
  OLLAMA_URL: z.url().optional(),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  RATE_LIMIT_PER_IP_PER_HOUR: z.coerce.number().int().min(1).default(3),
  RATE_LIMIT_PER_DAY: z.coerce.number().int().min(1).default(50),
  MAX_DOCUMENT_CHARACTERS: z.coerce.number().int().min(1).default(60_000),
});

export const envSchema = z.discriminatedUnion('LLM_PROVIDER', [
  baseEnvSchema.extend({
    LLM_PROVIDER: z.literal('anthropic'),
    ANTHROPIC_API_KEY: z.string().min(1),
  }),
  baseEnvSchema.extend({
    LLM_PROVIDER: z.literal('openai'),
    OPENAI_API_KEY: z.string().min(1),
  }),
  baseEnvSchema.extend({
    LLM_PROVIDER: z.literal('ollama'),
    OLLAMA_URL: z.url(),
  }),
]);

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(result.error)}`,
  );
}

export const env: Env = result.data;
