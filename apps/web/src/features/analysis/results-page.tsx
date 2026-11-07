import type { AnalysisResult, Category } from "@clauseguard/shared";
import { skipToken, useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { File05 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { analysisQueryKey } from "@/features/upload";
import { ClauseFilters } from "./clause-filters";
import { ClauseList } from "./clause-list";
import { ClausePanel } from "./clause-panel";
import { ContractViewer } from "./contract-viewer";
import { RedactedTextTab } from "./redacted-text-tab";
import { RiskSummary } from "./risk-summary";

export interface LocatedClauseView {
    clause: AnalysisResult["clauses"][number];
    index: number;
}

const route = getRouteApi("/results");

const AnalysisView = ({ result }: { result: AnalysisResult }) => {
    const { risk, category, clause: selectedParam } = route.useSearch();
    const navigate = route.useNavigate();

    const items: LocatedClauseView[] = result.clauses.map((clause, index) => ({ clause, index }));
    const visible = items.filter(({ clause }) => (!risk || clause.risk === risk) && (!category || clause.category === category));
    const selected = visible.find(({ index }) => index === selectedParam) ?? visible[0];
    const categories = [...new Set(result.clauses.map((clause) => clause.category))] satisfies Category[];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-display-sm font-semibold text-primary">Analysis</h1>
                <Button color="secondary" size="md" href="/">
                    New analysis
                </Button>
            </div>

            <RiskSummary summary={result.summary} clauses={result.clauses} />

            <Tabs defaultSelectedKey="contract">
                <Tabs.List type="underline" aria-label="Result views">
                    <Tabs.Item id="contract" label="Contract" />
                    <Tabs.Item id="sent" label="Sent to AI" />
                </Tabs.List>

                <Tabs.Panel id="contract" className="pt-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
                        <div className="order-2 lg:order-1">
                            <ContractViewer
                                text={result.text}
                                items={visible}
                                selectedIndex={selected?.index}
                                onSelect={(index) => navigate({ search: (previous) => ({ ...previous, clause: index }), replace: true })}
                            />
                        </div>
                        <aside
                            aria-label="Findings"
                            className="order-1 flex flex-col gap-4 lg:sticky lg:top-6 lg:order-2 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto"
                        >
                            <ClauseFilters
                                risk={risk}
                                category={category}
                                categories={categories}
                                onRiskChange={(next) => navigate({ search: (previous) => ({ ...previous, risk: next }), replace: true })}
                                onCategoryChange={(next) => navigate({ search: (previous) => ({ ...previous, category: next }), replace: true })}
                            />
                            {selected ? (
                                <>
                                    <ClauseList
                                        items={visible}
                                        selectedIndex={selected.index}
                                        onSelect={(index) => navigate({ search: (previous) => ({ ...previous, clause: index }), replace: true })}
                                    />
                                    <ClausePanel clause={selected.clause} />
                                </>
                            ) : (
                                <p className="text-sm text-tertiary">No findings match these filters.</p>
                            )}
                        </aside>
                    </div>
                </Tabs.Panel>

                <Tabs.Panel id="sent" className="pt-6">
                    <RedactedTextTab text={result.redactedText} />
                </Tabs.Panel>
            </Tabs>
        </div>
    );
};

export const ResultsPage = () => {
    const { data: result } = useQuery<AnalysisResult>({ queryKey: analysisQueryKey, queryFn: skipToken });

    if (!result) {
        return (
            <EmptyState size="lg">
                <EmptyState.Header>
                    <EmptyState.FeaturedIcon icon={File05} color="gray" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>Start a new analysis</EmptyState.Title>
                </EmptyState.Content>
                <EmptyState.Footer>
                    <Button size="lg" href="/">
                        Upload a contract
                    </Button>
                </EmptyState.Footer>
            </EmptyState>
        );
    }

    return <AnalysisView result={result} />;
};
