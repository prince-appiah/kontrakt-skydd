import { type Ref, memo, useEffect, useMemo, useRef } from "react";
import type { Risk } from "@clauseguard/shared";
import { cx } from "@/utils/cx";
import { RISK_HIGHLIGHT_CLASSES } from "./clause-labels";
import type { LocatedClauseView } from "./results-page";

type Segment =
    { kind: "text"; value: string } | { kind: "mark"; value: string; index: number; risk: Risk };

function toSegments(text: string, items: LocatedClauseView[]): Segment[] {
    const spans = items
        .flatMap(({ clause, index }) =>
            clause.start !== null && clause.end !== null
                ? [{ index, risk: clause.risk, start: clause.start, end: clause.end }]
                : [],
        )
        .sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];
    let cursor = 0;
    for (const { index, risk, start: rawStart, end } of spans) {
        const start = Math.max(rawStart, cursor);
        if (end <= start) {
            continue;
        }
        if (start > cursor) {
            segments.push({ kind: "text", value: text.slice(cursor, start) });
        }
        segments.push({ kind: "mark", value: text.slice(start, end), index, risk });
        cursor = end;
    }
    if (cursor < text.length) {
        segments.push({ kind: "text", value: text.slice(cursor) });
    }

    return segments;
}

interface ClauseMarkProps {
    value: string;
    index: number;
    risk: Risk;
    isSelected: boolean;
    markRef: Ref<HTMLElement> | undefined;
    onSelect: (index: number) => void;
}

const ClauseMark = memo(
    ({ value, index, risk, isSelected, markRef, onSelect }: ClauseMarkProps) => (
        <mark
            ref={markRef}
            onClick={() => onSelect(index)}
            className={cx(
                "cursor-pointer rounded-sm [box-decoration-break:clone] px-0.5 text-primary",
                "underline decoration-2 underline-offset-4 transition duration-100 ease-linear",
                RISK_HIGHLIGHT_CLASSES[risk],
                isSelected && "ring-2 ring-brand",
            )}
        >
            {value}
        </mark>
    ),
);

interface ContractViewerProps {
    text: string;
    items: LocatedClauseView[];
    selectedIndex: number | undefined;
    onSelect: (index: number) => void;
}

export const ContractViewer = ({ text, items, selectedIndex, onSelect }: ContractViewerProps) => {
    const selectedRef = useRef<HTMLElement>(null);
    const previousIndex = useRef(selectedIndex);
    const segments = useMemo(() => toSegments(text, items), [text, items]);

    useEffect(() => {
        if (previousIndex.current === selectedIndex) {
            return;
        }
        previousIndex.current = selectedIndex;
        selectedRef.current?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    return (
        <div
            className={cx(
                "rounded-xl bg-primary p-6 text-md leading-7 whitespace-pre-wrap text-primary",
                "ring-1 ring-secondary ring-inset",
            )}
        >
            {segments.map((segment, position) =>
                segment.kind === "text" ? (
                    <span key={position}>{segment.value}</span>
                ) : (
                    <ClauseMark
                        key={position}
                        value={segment.value}
                        index={segment.index}
                        risk={segment.risk}
                        isSelected={segment.index === selectedIndex}
                        markRef={segment.index === selectedIndex ? selectedRef : undefined}
                        onSelect={onSelect}
                    />
                ),
            )}
        </div>
    );
};
