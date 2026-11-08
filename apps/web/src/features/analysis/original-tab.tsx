import { useEffect, useMemo, useRef } from "react";
import type { AnalysisResult } from "@clauseguard/shared";
import { useQuery } from "@tanstack/react-query";
import type { SourceDocument } from "@/features/upload";
import { loadPdfPages } from "./load-pdf-pages";
import { type ClauseBox, locateQuotesInPdf } from "./locate-quotes-in-pdf";
import { PdfPage } from "./pdf-page";
import type { LocatedClauseView } from "./results-page";

const NO_BOXES: ClauseBox[] = [];

const sourceKey = (source: SourceDocument) =>
    source.kind === "file"
        ? `${source.file.name}:${source.file.size}:${source.file.lastModified}`
        : source.sampleId;

interface OriginalTabProps {
    source: SourceDocument;
    clauses: AnalysisResult["clauses"];
    visible: LocatedClauseView[];
    selectedIndex: number | undefined;
    onSelect: (index: number) => void;
}

export const OriginalTab = ({
    source,
    clauses,
    visible,
    selectedIndex,
    onSelect,
}: OriginalTabProps) => {
    const root = useRef<HTMLDivElement>(null);
    const { data: pdf, isError } = useQuery({
        queryKey: ["original-pdf", sourceKey(source)],
        queryFn: ({ signal }) => loadPdfPages(source, signal),
        gcTime: 0,
    });

    useEffect(() => () => void pdf?.destroy(), [pdf]);

    const boxes = useMemo(
        () =>
            pdf
                ? locateQuotesInPdf(
                      pdf.pages,
                      clauses.map(({ quote }) => quote),
                  )
                : NO_BOXES,
        [pdf, clauses],
    );
    const riskByClause = useMemo(
        () => new Map(clauses.map(({ risk }, index) => [index, risk])),
        [clauses],
    );
    const boxesByPage = useMemo(() => {
        const visibleIndexes = new Set(visible.map(({ index }) => index));
        const grouped = new Map<number, ClauseBox[]>();
        for (const box of boxes) {
            if (visibleIndexes.has(box.clauseIndex)) {
                grouped.set(box.pageIndex, [...(grouped.get(box.pageIndex) ?? []), box]);
            }
        }

        return grouped;
    }, [boxes, visible]);

    useEffect(() => {
        if (selectedIndex === undefined || !pdf) {
            return;
        }

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        root.current
            ?.querySelector(`[data-clause="${selectedIndex}"]`)
            ?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }, [selectedIndex, pdf]);

    if (isError) {
        return (
            <p role="alert" className="text-sm text-tertiary">
                The original PDF could not be displayed.
            </p>
        );
    }

    if (!pdf) {
        return (
            <p role="status" className="text-sm text-tertiary">
                Loading the original
            </p>
        );
    }

    const isSelectedPlaced =
        selectedIndex === undefined ||
        boxes.some(({ clauseIndex }) => clauseIndex === selectedIndex);

    return (
        <div ref={root} className="flex flex-col gap-4">
            {!isSelectedPlaced && (
                <p role="status" className="text-sm text-tertiary">
                    This finding could not be placed on the page.
                </p>
            )}
            {pdf.pages.map(({ page, viewport }, pageIndex) => {
                const pageBoxes = boxesByPage.get(pageIndex) ?? NO_BOXES;
                const hasSelected = pageBoxes.some(
                    ({ clauseIndex }) => clauseIndex === selectedIndex,
                );

                return (
                    <PdfPage
                        key={pageIndex}
                        page={page}
                        viewport={viewport}
                        pageNumber={pageIndex + 1}
                        pageCount={pdf.pages.length}
                        boxes={pageBoxes}
                        riskByClause={riskByClause}
                        selectedIndex={hasSelected ? selectedIndex : undefined}
                        onSelect={onSelect}
                    />
                );
            })}
        </div>
    );
};
