import { type AnalysisEvent, analysisEventSchema } from "@clauseguard/shared";

function parseBlock(block: string): AnalysisEvent | null {
    const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");

    return data ? analysisEventSchema.parse(JSON.parse(data)) : null;
}

export async function* readEventStream(response: Response): AsyncGenerator<AnalysisEvent> {
    if (!response.body) {
        throw new Error("The response has no body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n");

            let end = buffer.indexOf("\n\n");
            while (end !== -1) {
                const event = parseBlock(buffer.slice(0, end));
                buffer = buffer.slice(end + 2);
                if (event) {
                    yield event;
                }
                end = buffer.indexOf("\n\n");
            }
        }
    } finally {
        reader.releaseLock();
    }
}
