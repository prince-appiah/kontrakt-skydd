import { Util } from "pdfjs-dist";
import type { PageViewport } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

export interface PdfPageText {
    viewport: PageViewport;
    items: TextItem[];
}

export interface ClauseBox {
    clauseIndex: number;
    pageIndex: number;
    left: number;
    top: number;
    width: number;
    height: number;
}

interface CharOwner {
    pageIndex: number;
    itemIndex: number;
    offset: number;
}

const ANCHOR_LENGTH = 30;
const MIN_LENGTH_FOR_ANCHORS = 80;
const ASCENT_RATIO = 0.8;
const MEASURE_FONT = "16px Arial, Helvetica, sans-serif";

let measurer: CanvasRenderingContext2D | null = null;

function widthShare(text: string, upTo: number): number {
    measurer ??= document.createElement("canvas").getContext("2d");
    if (!measurer) {
        return upTo / text.length;
    }

    measurer.font = MEASURE_FONT;
    const total = measurer.measureText(text).width;

    return total === 0
        ? upTo / text.length
        : measurer.measureText(text.slice(0, upTo)).width / total;
}

const compact = (value: string) => value.normalize("NFKC").replace(/\s/gu, "").toLowerCase();

function indexPages(pages: PdfPageText[]) {
    let flat = "";
    const owners: CharOwner[] = [];

    pages.forEach(({ items }, pageIndex) => {
        items.forEach((item, itemIndex) => {
            [...item.str].forEach((char, offset) => {
                const normalised = compact(char);
                flat += normalised;
                for (let index = 0; index < normalised.length; index += 1) {
                    owners.push({ pageIndex, itemIndex, offset });
                }
            });
        });
    });

    return { flat, owners };
}

function findRange(flat: string, quote: string): [number, number] | null {
    const exact = flat.indexOf(quote);
    if (exact !== -1) {
        return [exact, exact + quote.length];
    }
    if (quote.length < MIN_LENGTH_FOR_ANCHORS) {
        return null;
    }

    const head = quote.slice(0, ANCHOR_LENGTH);
    const tail = quote.slice(-ANCHOR_LENGTH);
    const start = flat.indexOf(head);
    const tailStart = start === -1 ? -1 : flat.indexOf(tail, start + head.length);

    return tailStart === -1 ? null : [start, tailStart + tail.length];
}

function toBoxes(
    clauseIndex: number,
    [start, end]: [number, number],
    owners: CharOwner[],
    pages: PdfPageText[],
): ClauseBox[] {
    const spans = new Map<
        string,
        { pageIndex: number; itemIndex: number; from: number; to: number }
    >();

    for (const { pageIndex, itemIndex, offset } of owners.slice(start, end)) {
        const key = `${pageIndex}:${itemIndex}`;
        const span = spans.get(key);
        if (span) {
            span.to = offset + 1;
        } else {
            spans.set(key, { pageIndex, itemIndex, from: offset, to: offset + 1 });
        }
    }

    return [...spans.values()].flatMap(({ pageIndex, itemIndex, from, to }) => {
        const page = pages[pageIndex];
        const item = page?.items[itemIndex];
        if (!page || !item || item.str.length === 0) {
            return [];
        }

        const { viewport } = page;
        const matrix = Util.transform(viewport.transform, item.transform);
        const height = Math.hypot(matrix[2], matrix[3]);
        const itemWidth = item.width * viewport.scale;
        const startShare = widthShare(item.str, from);
        const endShare = widthShare(item.str, to);

        return [
            {
                clauseIndex,
                pageIndex,
                left: matrix[4] + itemWidth * startShare,
                top: matrix[5] - height * ASCENT_RATIO,
                width: itemWidth * (endShare - startShare),
                height,
            },
        ];
    });
}

export function locateQuotesInPdf(pages: PdfPageText[], quotes: string[]): ClauseBox[] {
    const { flat, owners } = indexPages(pages);

    return quotes.flatMap((quote, clauseIndex) => {
        const range = findRange(flat, compact(quote));

        return range ? toBoxes(clauseIndex, range, owners, pages) : [];
    });
}
