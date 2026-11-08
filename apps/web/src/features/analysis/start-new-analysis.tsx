import { File05 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";

export const StartNewAnalysis = () => (
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
