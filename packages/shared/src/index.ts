import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const riskSchema = z.enum(["low", "medium", "high"]);

export const categorySchema = z.enum([
  "termination",
  "liability",
  "payment",
  "ip",
  "non_compete",
  "auto_renewal",
  "other",
]);

export const clauseSchema = z.object({
  quote: z.string(),
  category: categorySchema,
  risk: riskSchema,
  explanation: z.string(),
  counterClause: z.string(),
});

export const contractAnalysisSchema = z.object({
  summary: z.string(),
  clauses: z.array(clauseSchema),
});

export const locatedClauseSchema = clauseSchema.extend({
  start: z.number().int().nonnegative().nullable(),
  end: z.number().int().nonnegative().nullable(),
});

export const analysisResultSchema = z.object({
  summary: z.string(),
  clauses: z.array(locatedClauseSchema),
  text: z.string(),
  redactedText: z.string(),
});

export const analysisModeSchema = z.enum(["cloud", "private"]);

export const analysisEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("progress"),
    step: z.enum(["parsing", "redacting", "analyzing"]),
  }),
  z.object({ type: z.literal("result"), data: analysisResultSchema }),
  z.object({ type: z.literal("error"), code: z.string(), message: z.string() }),
]);

export type Risk = z.infer<typeof riskSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Clause = z.infer<typeof clauseSchema>;
export type ContractAnalysis = z.infer<typeof contractAnalysisSchema>;
export type LocatedClause = z.infer<typeof locatedClauseSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AnalysisMode = z.infer<typeof analysisModeSchema>;
export type AnalysisEvent = z.infer<typeof analysisEventSchema>;
