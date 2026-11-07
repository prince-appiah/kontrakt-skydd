import type { ContractAnalysis } from '@/domain/entities';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmProvider {
  analyze(redactedText: string): Promise<ContractAnalysis>;
}
