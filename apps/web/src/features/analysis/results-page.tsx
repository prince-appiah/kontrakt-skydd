import { type ReactNode, Suspense, lazy, useCallback, useMemo } from "react";
import type { AnalysisResult, Category } from "@clauseguard/shared";
import { skipToken, useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { type SourceDocument, analysisQueryKey, sourceDocumentQueryKey } from "@/features/upload";
import { cx } from "@/utils/cx";
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

const StartNewAnalysis = lazy(() =>
    import("./start-new-analysis").then((module) => ({ default: module.StartNewAnalysis })),
);

const loadOriginalTab = () => import("./original-tab");
const OriginalTab = lazy(() =>
    loadOriginalTab().then((module) => ({ default: module.OriginalTab })),
);

const preloadOriginalTab = () => {
    void loadOriginalTab();
};

type SearchPatch = Partial<ReturnType<typeof route.useSearch>>;

const AnalysisView = ({ result }: { result: AnalysisResult }) => {
    const { risk, category, clause: selectedParam } = route.useSearch();
    const navigate = route.useNavigate();
    const { data: source } = useQuery<SourceDocument | null>({
        queryKey: sourceDocumentQueryKey,
        queryFn: skipToken,
    });

    const updateSearch = useCallback(
        (patch: SearchPatch) =>
            navigate({
                search: (previous) => ({ ...previous, ...patch }),
                replace: true,
                resetScroll: false,
            }),
        [navigate],
    );
    const selectClause = useCallback(
        (index: number) => updateSearch({ clause: index }),
        [updateSearch],
    );

    const visible: LocatedClauseView[] = useMemo(
        () =>
            result.clauses
                .map((clause, index) => ({ clause, index }))
                .filter(
                    ({ clause }) =>
                        (!risk || clause.risk === risk) &&
                        (!category || clause.category === category),
                ),
        [result.clauses, risk, category],
    );

    const categories = useMemo(
        () => [...new Set(result.clauses.map((clause) => clause.category))] satisfies Category[],
        [result.clauses],
    );

    const selected = visible.find(({ index }) => index === selectedParam) ?? visible[0];

    const withFindings = (main: ReactNode) => (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="order-2 lg:order-1">{main}</div>
            <aside
                aria-label="Findings"
                className={cx(
                    "order-1 flex flex-col gap-4 lg:sticky lg:top-6 lg:order-2",
                    "lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto",
                )}
            >
                <ClauseFilters
                    risk={risk}
                    category={category}
                    categories={categories}
                    onRiskChange={(next) => updateSearch({ risk: next })}
                    onCategoryChange={(next) => updateSearch({ category: next })}
                />
                {selected ? (
                    <>
                        <ClauseList
                            items={visible}
                            selectedIndex={selected.index}
                            onSelect={selectClause}
                        />
                        <ClausePanel clause={selected.clause} />
                    </>
                ) : (
                    <p className="text-sm text-tertiary">No findings match these filters.</p>
                )}
            </aside>
        </div>
    );

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
                    {source && (
                        <Tabs.Item
                            id="original"
                            label="Original"
                            onHoverStart={preloadOriginalTab}
                            onFocus={preloadOriginalTab}
                        />
                    )}
                    <Tabs.Item id="sent" label="Sent to AI" />
                </Tabs.List>

                <Tabs.Panel id="contract" className="pt-6">
                    {withFindings(
                        <ContractViewer
                            text={result.text}
                            items={visible}
                            selectedIndex={selected?.index}
                            onSelect={selectClause}
                        />,
                    )}
                </Tabs.Panel>

                {source && (
                    <Tabs.Panel id="original" className="pt-6">
                        {withFindings(
                            <Suspense
                                fallback={
                                    <p role="status" className="text-sm text-tertiary">
                                        Loading the original
                                    </p>
                                }
                            >
                                <OriginalTab
                                    source={source}
                                    clauses={result.clauses}
                                    visible={visible}
                                    selectedIndex={selected?.index}
                                    onSelect={selectClause}
                                />
                            </Suspense>,
                        )}
                    </Tabs.Panel>
                )}

                <Tabs.Panel id="sent" className="pt-6">
                    <RedactedTextTab text={result.redactedText} />
                </Tabs.Panel>
            </Tabs>
        </div>
    );
};

export const ResultsPage = () => {
    const { data: result } = useQuery<AnalysisResult>({
        queryKey: analysisQueryKey,
        queryFn: skipToken,
    });

    if (!result) {
        return (
            <Suspense fallback={null}>
                <StartNewAnalysis />
            </Suspense>
        );
    }

    return <AnalysisView result={result} />;
};
