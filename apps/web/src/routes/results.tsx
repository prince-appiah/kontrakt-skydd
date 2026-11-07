import { categorySchema, riskSchema } from "@clauseguard/shared";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResultsPage } from "@/features/analysis";

const searchSchema = z.object({
    risk: riskSchema.optional().catch(undefined),
    category: categorySchema.optional().catch(undefined),
    clause: z.number().int().nonnegative().optional().catch(undefined),
});

export const Route = createFileRoute("/results")({
    head: () => ({ meta: [{ title: "Analysis - Clause Guard" }] }),
    validateSearch: searchSchema,
    component: ResultsPage,
});
