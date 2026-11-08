import { type KeyboardEvent, useRef } from "react";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { CATEGORY_LABELS, RISK_BADGE_COLORS, RISK_LABELS } from "./clause-labels";
import type { LocatedClauseView } from "./results-page";

interface ClauseListProps {
    items: LocatedClauseView[];
    selectedIndex: number | undefined;
    onSelect: (index: number) => void;
}

export const ClauseList = ({ items, selectedIndex, onSelect }: ClauseListProps) => {
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
        const current = items.findIndex((item) => item.index === selectedIndex);
        let target: number;
        switch (event.key) {
            case "ArrowDown":
                target = current + 1;
                break;
            case "ArrowUp":
                target = current - 1;
                break;
            case "Home":
                target = 0;
                break;
            case "End":
                target = items.length - 1;
                break;
            default:
                return;
        }
        const next = items[target];
        if (!next) {
            return;
        }
        event.preventDefault();
        onSelect(next.index);
        buttons.current[target]?.focus();
    };

    return (
        <ul
            aria-label="Findings"
            onKeyDown={handleKeyDown}
            className="flex max-h-72 flex-col gap-2 overflow-y-auto"
        >
            {items.map(({ clause, index }, position) => (
                <li key={index}>
                    <button
                        ref={(element) => {
                            buttons.current[position] = element;
                        }}
                        type="button"
                        tabIndex={index === selectedIndex ? 0 : -1}
                        aria-current={index === selectedIndex ? "true" : undefined}
                        onClick={() => onSelect(index)}
                        className={cx(
                            "flex w-full cursor-pointer flex-col gap-1 rounded-lg p-3 text-left",
                            "ring-1 ring-secondary outline-brand ring-inset hover:bg-primary_hover",
                            "focus-visible:outline-2 focus-visible:outline-offset-2",
                            index === selectedIndex && "bg-secondary ring-2 ring-brand",
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Badge size="sm" color={RISK_BADGE_COLORS[clause.risk]}>
                                {RISK_LABELS[clause.risk]}
                            </Badge>
                            <span className="text-sm font-medium text-primary">
                                {CATEGORY_LABELS[clause.category]}
                            </span>
                        </span>
                        <span className="line-clamp-2 text-sm text-tertiary">{clause.quote}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
};
