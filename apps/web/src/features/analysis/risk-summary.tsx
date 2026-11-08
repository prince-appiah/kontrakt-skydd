import type { AnalysisResult, Risk } from "@clauseguard/shared";
import { Badge } from "@/components/base/badges/badges";
import { RISK_BADGE_COLORS, RISK_LABELS } from "./clause-labels";

const RISKS: Risk[] = ["high", "medium", "low"];

interface RiskSummaryProps {
    summary: string;
    clauses: AnalysisResult["clauses"];
}

export const RiskSummary = ({ summary, clauses }: RiskSummaryProps) => (
    <section
        aria-labelledby="summary-heading"
        className="flex flex-col gap-3 rounded-xl bg-secondary p-5 ring-1 ring-secondary ring-inset"
    >
        <div className="flex flex-wrap items-center gap-2">
            <h2 id="summary-heading" className="text-md font-semibold text-primary">
                Summary
            </h2>
            {RISKS.map((risk) => (
                <Badge key={risk} size="md" color={RISK_BADGE_COLORS[risk]}>
                    {clauses.filter((clause) => clause.risk === risk).length} {RISK_LABELS[risk]}
                </Badge>
            ))}
        </div>
        <p className="text-md text-secondary">{summary}</p>
    </section>
);
