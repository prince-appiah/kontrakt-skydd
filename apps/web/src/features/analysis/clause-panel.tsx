import { Check, Copy01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useClipboard } from "@/hooks/use-clipboard";
import { CATEGORY_LABELS, RISK_BADGE_COLORS, RISK_LABELS } from "./clause-labels";
import type { LocatedClauseView } from "./results-page";

export const ClausePanel = ({ clause }: { clause: LocatedClauseView["clause"] }) => {
    const clipboard = useClipboard();

    return (
        <section aria-labelledby="finding-heading" className="flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-secondary ring-inset">
            <h2 id="finding-heading" className="sr-only">
                Finding details
            </h2>
            <div className="flex items-center gap-2">
                <Badge size="md" color={RISK_BADGE_COLORS[clause.risk]}>
                    {RISK_LABELS[clause.risk]}
                </Badge>
                <Badge size="md" color="gray">
                    {CATEGORY_LABELS[clause.category]}
                </Badge>
            </div>
            <blockquote className="border-l-2 border-secondary pl-3 text-sm text-tertiary">{clause.quote}</blockquote>
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-primary">Why it matters</h3>
                <p className="text-sm text-secondary">{clause.explanation}</p>
            </div>
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-primary">Suggested counter-clause</h3>
                    <ButtonUtility
                        color="tertiary"
                        size="xs"
                        icon={clipboard.copied ? Check : Copy01}
                        tooltip={clipboard.copied ? "Copied" : "Copy"}
                        onClick={() => clipboard.copy(clause.counterClause)}
                    />
                </div>
                <p className="rounded-lg bg-secondary p-3 text-sm text-secondary">{clause.counterClause}</p>
            </div>
        </section>
    );
};
