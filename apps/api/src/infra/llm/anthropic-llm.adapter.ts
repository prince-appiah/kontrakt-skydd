import Anthropic from '@anthropic-ai/sdk';
import type { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import { contractAnalysisSchema } from '@clauseguard/shared';
import type { ContractAnalysis } from '@/domain/entities';
import { LlmOutputInvalidError, LlmRequestFailedError } from '@/domain/errors';
import type { LlmProvider } from '@/domain/ports';
import {
  analyzeContractSystemPrompt,
  buildAnalyzeContractUserMessage,
  buildRetryMessage,
} from '@/infra/llm/prompts/analyze-contract.prompt';

const MAX_TOKENS = 16_000;

type ParsedReply = { analysis: ContractAnalysis } | { problem: string };

function parseReply(reply: string): ParsedReply {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start === -1 || end < start) {
    return { problem: 'The reply did not contain a JSON object.' };
  }
  let json: unknown;
  try {
    json = JSON.parse(reply.slice(start, end + 1));
  } catch {
    return { problem: 'The reply was not valid JSON.' };
  }
  const result = contractAnalysisSchema.safeParse(json);
  return result.success
    ? { analysis: result.data }
    : { problem: z.prettifyError(result.error) };
}

export class AnthropicLlmAdapter implements LlmProvider {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
    private readonly logger: PinoLogger,
  ) {}

  async analyze(
    redactedText: string,
    signal?: AbortSignal,
  ): Promise<ContractAnalysis> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: buildAnalyzeContractUserMessage(redactedText) },
    ];

    const reply = await this.complete(messages, signal);
    const first = parseReply(reply);
    if ('analysis' in first) {
      return first.analysis;
    }

    messages.push(
      { role: 'assistant', content: reply },
      { role: 'user', content: buildRetryMessage(first.problem) },
    );

    const second = parseReply(await this.complete(messages, signal));
    if ('analysis' in second) {
      return second.analysis;
    }

    throw new LlmOutputInvalidError();
  }

  private async complete(
    messages: Anthropic.MessageParam[],
    signal?: AbortSignal,
  ): Promise<string> {
    const startedAt = performance.now();
    let message: Anthropic.Message;

    try {
      message = await this.client.messages
        .stream(
          {
            model: this.model,
            max_tokens: MAX_TOKENS,
            system: analyzeContractSystemPrompt,
            messages,
          },
          { signal },
        )
        .finalMessage();
    } catch (cause) {
      throw new LlmRequestFailedError({ cause });
    }

    this.logger.info(
      {
        provider: 'anthropic',
        model: this.model,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        latencyMs: Math.round(performance.now() - startedAt),
      },
      'llm request finished',
    );

    if (
      message.stop_reason === 'refusal' ||
      message.stop_reason === 'max_tokens'
    ) {
      throw new LlmOutputInvalidError();
    }

    return message.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('');
  }
}
