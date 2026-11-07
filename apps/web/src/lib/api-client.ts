import type { AnalysisMode } from "@clauseguard/shared";
import { z } from "zod";

const apiUrl = z
    .url()
    .default("http://localhost:3001")
    .parse(import.meta.env.VITE_API_URL);

const errorBodySchema = z.object({ code: z.string(), message: z.string() });

export class ApiError extends Error {
    constructor(
        readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export async function postAnalysis(file: File, mode: AnalysisMode, signal: AbortSignal): Promise<Response> {
    const body = new FormData();
    body.append("file", file);
    body.append("mode", mode);

    const response = await fetch(new URL("/api/v1/analyses", apiUrl), { method: "POST", body, signal });
    if (!response.ok) {
        const parsed = errorBodySchema.safeParse(await response.json().catch(() => null));
        throw parsed.success ? new ApiError(parsed.data.code, parsed.data.message) : new ApiError("INTERNAL_ERROR", "Something went wrong");
    }

    return response;
}
