import { useEffect, useRef, useState } from "react";
import {
    type AnalysisEvent,
    type AnalysisMode,
    type AnalysisResult,
    analysisResultSchema,
} from "@clauseguard/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ZodError } from "zod";
import { ApiError, postAnalysis } from "@/lib/api-client";
import { readEventStream } from "@/lib/read-event-stream";
import type { SampleId } from "./sample-picker";

export const analysisQueryKey = ["analysis"] as const;
export const sourceDocumentQueryKey = ["analysis-source"] as const;

export type SourceDocument = { kind: "file"; file: File } | { kind: "sample"; sampleId: SampleId };

export type AnalysisRequest =
    { source: "file"; file: File; mode: AnalysisMode } | { source: "sample"; sampleId: SampleId };

export type AnalysisStep =
    "uploading" | Extract<AnalysisEvent, { type: "progress" }>["step"] | "ready";

const MIN_STEP_MS = 900;
const READY_HOLD_MS = 1400;

async function loadSample(sampleId: SampleId, signal: AbortSignal): Promise<AnalysisResult> {
    const response = await fetch(`/samples/${sampleId}.result.json`, { signal });
    if (!response.ok) {
        throw new ApiError("SAMPLE_UNAVAILABLE", "The sample could not be loaded");
    }

    return analysisResultSchema.parse(await response.json());
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(signal.reason);
            return;
        }

        const onAbort = () => {
            clearTimeout(timer);
            reject(signal.reason);
        };
        const timer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        signal.addEventListener("abort", onAbort, { once: true });
    });
}

function createStepReporter(onStep: (step: AnalysisStep) => void, signal: AbortSignal) {
    let shownAt = Number.NEGATIVE_INFINITY;

    return async (step: AnalysisStep) => {
        const wait = shownAt + MIN_STEP_MS - performance.now();
        if (wait > 0) {
            await pause(wait, signal);
        }
        onStep(step);
        shownAt = performance.now();
    };
}

async function analyzeFile(
    file: File,
    mode: AnalysisMode,
    signal: AbortSignal,
    onStep: (step: AnalysisStep) => void,
): Promise<AnalysisResult> {
    const report = createStepReporter(onStep, signal);
    await report("uploading");
    const response = await postAnalysis(file, mode, signal);

    for await (const event of readEventStream(response)) {
        if (event.type === "progress") {
            await report(event.step);
        } else if (event.type === "result") {
            await report("ready");
            await pause(READY_HOLD_MS, signal);
            return event.data;
        } else {
            throw new ApiError(event.code, event.message);
        }
    }

    throw new ApiError("STREAM_ENDED", "The analysis ended unexpectedly");
}

function toSourceDocument(request: AnalysisRequest): SourceDocument | null {
    if (request.source === "sample") {
        return { kind: "sample", sampleId: request.sampleId };
    }

    return request.file.name.toLowerCase().endsWith(".pdf")
        ? { kind: "file", file: request.file }
        : null;
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
        onMutate: () => {
            queryClient.removeQueries({ queryKey: analysisQueryKey });
            queryClient.removeQueries({ queryKey: sourceDocumentQueryKey });
        },
        mutationFn: async (request: AnalysisRequest) => {
            controller.current = new AbortController();
            const { signal } = controller.current;

            return request.source === "sample"
                ? loadSample(request.sampleId, signal)
                : analyzeFile(request.file, request.mode, signal, setStep);
        },
        onSuccess: (result, request) => {
            queryClient.setQueryData(analysisQueryKey, result);
            queryClient.setQueryData(sourceDocumentQueryKey, toSourceDocument(request));
            return navigate({ to: "/results", viewTransition: true });
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
