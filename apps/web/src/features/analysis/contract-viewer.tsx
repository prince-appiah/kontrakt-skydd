import { useEffect, useRef } from "react";
import { cx } from "@/utils/cx";
import { RISK_HIGHLIGHT_CLASSES } from "./clause-labels";
import type { LocatedClauseView } from "./results-page";

type Segment = { kind: "text"; value: string } | { kind: "mark"; value: string; index: number; item: LocatedClauseView };

function toSegments(text: string, items: LocatedClauseView[]): Segment[] {
    const spans = items
        .flatMap((item) => (item.clause.start !== null && item.clause.end !== null ? [{ item, start: item.clause.start, end: item.clause.end }] : []))
        .sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];
    let cursor = 0;
    for (const { item, start: rawStart, end } of spans) {
        const start = Math.max(rawStart, cursor);
        if (end <= start) {
            continue;
        }
        if (start > cursor) {
            segments.push({ kind: "text", value: text.slice(cursor, start) });
        }
        segments.push({ kind: "mark", value: text.slice(start, end), index: item.index, item });
        cursor = end;
    }
    if (cursor < text.length) {
        segments.push({ kind: "text", value: text.slice(cursor) });
    }

    return segments;
}

interface ContractViewerProps {
    text: string;
    items: LocatedClauseView[];
    selectedIndex: number | undefined;
    onSelect: (index: number) => void;
}

export const ContractViewer = ({ text, items, selectedIndex, onSelect }: ContractViewerProps) => {
    const selectedRef = useRef<HTMLElement>(null);
    const previousIndex = useRef(selectedIndex);

    useEffect(() => {
        if (previousIndex.current === selectedIndex) {
            return;
        }
        previousIndex.current = selectedIndex;
        selectedRef.current?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    return (
        <div className="rounded-xl bg-primary p-6 text-md leading-7 whitespace-pre-wrap text-primary ring-1 ring-secondary ring-inset">
            {toSegments(text, items).map((segment, position) =>
                segment.kind === "text" ? (
                    <span key={position}>{segment.value}</span>
                ) : (
                    <mark
                        key={position}
                        ref={segment.index === selectedIndex ? selectedRef : undefined}
                        onClick={() => onSelect(segment.index)}
                        className={cx(
                            "cursor-pointer rounded-sm [box-decoration-break:clone] px-0.5 text-primary underline decoration-2 underline-offset-4 transition duration-100 ease-linear",
                            RISK_HIGHLIGHT_CLASSES[segment.item.clause.risk],
                            segment.index === selectedIndex && "ring-2 ring-brand",
                        )}
                    >
                        {segment.value}
                    </mark>
                ),
            )}
        </div>
    );
};
