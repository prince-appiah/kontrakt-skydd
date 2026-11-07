import { useEffect, useRef, useState } from "react";
import { type AnalysisEvent, type AnalysisMode, type AnalysisResult, analysisResultSchema } from "@clauseguard/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ZodError } from "zod";
import { ApiError, postAnalysis } from "@/lib/api-client";
import { readEventStream } from "@/lib/read-event-stream";
import type { SampleId } from "./sample-picker";

export const analysisQueryKey = ["analysis"] as const;

export type AnalysisRequest = { source: "file"; file: File; mode: AnalysisMode } | { source: "sample"; sampleId: SampleId };

export type AnalysisStep = Extract<AnalysisEvent, { type: "progress" }>["step"];

async function loadSample(sampleId: SampleId, signal: AbortSignal): Promise<AnalysisResult> {
    const response = await fetch(`/samples/${sampleId}.result.json`, { signal });
    if (!response.ok) {
        throw new ApiError("SAMPLE_UNAVAILABLE", "The sample could not be loaded");
    }

    return analysisResultSchema.parse(await response.json());
}

async function analyzeFile(file: File, mode: AnalysisMode, signal: AbortSignal, onStep: (step: AnalysisStep) => void): Promise<AnalysisResult> {
    const response = await postAnalysis(file, mode, signal);

    for await (const event of readEventStream(response)) {
        if (event.type === "progress") {
            onStep(event.step);
        } else if (event.type === "result") {
            return event.data;
        } else {
            throw new ApiError(event.code, event.message);
        }
    }

    throw new ApiError("STREAM_ENDED", "The analysis ended unexpectedly");
}

function toMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }
    if (error instanceof ZodError) {
        return "The server sent a response that could not be read";
    }
    if (error instanceof TypeError) {
        return "Could not reach the server";
    }

    return "Something went wrong";
}

export function useAnalyzeContract() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [step, setStep] = useState<AnalysisStep | null>(null);
    const controller = useRef<AbortController | null>(null);

    useEffect(() => () => controller.current?.abort(), []);

    const mutation = useMutation({
        gcTime: 0,
        onMutate: () => queryClient.removeQueries({ queryKey: analysisQueryKey }),
        mutationFn: async (request: AnalysisRequest) => {
            controller.current = new AbortController();
            const { signal } = controller.current;

            return request.source === "sample" ? loadSample(request.sampleId, signal) : analyzeFile(request.file, request.mode, signal, setStep);
        },
        onSuccess: (result) => {
            queryClient.setQueryData(analysisQueryKey, result);
            return navigate({ to: "/results" });
        },
        onSettled: () => setStep(null),
    });

    return {
        analyze: mutation.mutate,
        isPending: mutation.isPending,
        step,
        error: mutation.error ? toMessage(mutation.error) : null,
    };
}
