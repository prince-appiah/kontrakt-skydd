import "dotenv/config";
import { z } from "zod";

const baseEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_ORIGIN: z.url().transform((value) => new URL(value).origin),
  LLM_MODEL: z.string().min(1),
  OLLAMA_URL: z.url().optional(),
});

export const envSchema = z.discriminatedUnion("LLM_PROVIDER", [
  baseEnvSchema.extend({
    LLM_PROVIDER: z.literal("anthropic"),
    ANTHROPIC_API_KEY: z.string().min(1),
  }),
  baseEnvSchema.extend({
    LLM_PROVIDER: z.literal("openai"),
    OPENAI_API_KEY: z.string().min(1),
  }),
  baseEnvSchema.extend({
    LLM_PROVIDER: z.literal("ollama"),
    OLLAMA_URL: z.url(),
  }),
]);

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
}

export const env: Env = result.data;
