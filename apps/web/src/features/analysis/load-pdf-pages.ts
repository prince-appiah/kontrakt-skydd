import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import type { SourceDocument } from "@/features/upload";
import type { PdfPageText } from "./locate-quotes-in-pdf";

GlobalWorkerOptions.workerSrc = workerUrl;

const RENDER_SCALE = 1.5;

export interface LoadedPage extends PdfPageText {
    page: PDFPageProxy;
}

export interface LoadedPdf {
    pages: LoadedPage[];
    destroy: () => Promise<void>;
}

const isTextItem = (item: TextItem | TextMarkedContent): item is TextItem => "str" in item;

async function readSource(source: SourceDocument, signal: AbortSignal): Promise<Uint8Array> {
    if (source.kind === "file") {
        return new Uint8Array(await source.file.arrayBuffer());
    }

    const response = await fetch(`/samples/${source.sampleId}.pdf`, { signal });
    if (!response.ok) {
        throw new Error("The sample PDF could not be loaded");
    }

    return new Uint8Array(await response.arrayBuffer());
}

export async function loadPdfPages(
    source: SourceDocument,
    signal: AbortSignal,
): Promise<LoadedPdf> {
    const data = await readSource(source, signal);
    const task = getDocument({ data });
    signal.addEventListener("abort", () => void task.destroy(), { once: true });
    const document = await task.promise;

    const pages = await Promise.all(
        Array.from({ length: document.numPages }, async (_, index): Promise<LoadedPage> => {
            const page = await document.getPage(index + 1);
            const content = await page.getTextContent();

            return {
                page,
                viewport: page.getViewport({ scale: RENDER_SCALE }),
                items: content.items.filter(isTextItem),
            };
        }),
    );

    return { pages, destroy: () => task.destroy() };
}
