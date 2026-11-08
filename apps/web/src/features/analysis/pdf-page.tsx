import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Risk } from "@clauseguard/shared";
import { RenderingCancelledException } from "pdfjs-dist";
import type { PDFPageProxy, PageViewport } from "pdfjs-dist";
import { cx } from "@/utils/cx";
import type { ClauseBox } from "./locate-quotes-in-pdf";

const HIGHLIGHT_CLASSES: Record<Risk, string> = {
    high: "bg-fg-error-secondary/20 border-solid border-fg-error-secondary",
    medium: "bg-fg-warning-secondary/25 border-dashed border-fg-warning-secondary",
    low: "bg-fg-quaternary/20 border-dotted border-fg-quaternary",
};

const percent = (value: number, total: number) => `${(value / total) * 100}%`;

interface PdfPageProps {
    page: PDFPageProxy;
    viewport: PageViewport;
    pageNumber: number;
    pageCount: number;
    boxes: ClauseBox[];
    riskByClause: ReadonlyMap<number, Risk>;
    selectedIndex: number | undefined;
    onSelect: (index: number) => void;
}

export const PdfPage = memo(
    ({
        page,
        viewport,
        pageNumber,
        pageCount,
        boxes,
        riskByClause,
        selectedIndex,
        onSelect,
    }: PdfPageProps) => {
        const canvas = useRef<HTMLCanvasElement>(null);
        const [isNear, setIsNear] = useState(false);

        const watchProximity = useCallback((node: HTMLElement | null) => {
            if (!node) {
                return;
            }

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry?.isIntersecting) {
                        setIsNear(true);
                        observer.disconnect();
                    }
                },
                { rootMargin: "800px 0px" },
            );
            observer.observe(node);

            return () => observer.disconnect();
        }, []);

        useEffect(() => {
            const target = canvas.current;
            if (!isNear || !target) {
                return;
            }

            const ratio = window.devicePixelRatio || 1;
            target.width = Math.floor(viewport.width * ratio);
            target.height = Math.floor(viewport.height * ratio);
            const task = page.render({
                canvas: target,
                viewport,
                transform: [ratio, 0, 0, ratio, 0, 0],
            });
            task.promise.catch((error: unknown) => {
                if (!(error instanceof RenderingCancelledException)) {
                    throw error;
                }
            });

            return () => task.cancel();
        }, [isNear, page, viewport]);

        return (
            <section
                ref={watchProximity}
                aria-label={`Page ${pageNumber} of ${pageCount}`}
                className={cx(
                    "relative w-full overflow-hidden rounded-lg bg-secondary shadow-xs ring-1",
                    "ring-secondary",
                )}
                style={{ aspectRatio: `${viewport.width} / ${viewport.height}` }}
            >
                <canvas
                    ref={canvas}
                    role="img"
                    aria-label={`Page ${pageNumber} of the original document`}
                    className="size-full"
                />
                {boxes.map((box, index) => (
                    <button
                        key={`${box.clauseIndex}-${index}`}
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        data-clause={box.clauseIndex}
                        onClick={() => onSelect(box.clauseIndex)}
                        className={cx(
                            "absolute cursor-pointer border-b-2",
                            HIGHLIGHT_CLASSES[riskByClause.get(box.clauseIndex) ?? "low"],
                            box.clauseIndex === selectedIndex && "ring-2 ring-brand",
                        )}
                        style={{
                            left: percent(box.left, viewport.width),
                            top: percent(box.top, viewport.height),
                            width: percent(box.width, viewport.width),
                            height: percent(box.height, viewport.height),
                        }}
                    />
                ))}
            </section>
        );
    },
);
