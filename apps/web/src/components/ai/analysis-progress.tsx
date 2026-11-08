import { useEffect, useState } from "react";
import { CheckCircle } from "@untitledui/icons";

const MESSAGE_INTERVAL_MS = 6000;

export interface ProgressStage {
    id: string;
    label: string;
    messages?: string[];
}

interface AnalysisProgressProps {
    stages: ProgressStage[];
    activeId: string;
}

const ActiveLabel = ({ stage }: { stage: ProgressStage }) => {
    const messages = stage.messages ?? [stage.label];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index >= messages.length - 1) {
            return;
        }

        const timer = setTimeout(() => setIndex((current) => current + 1), MESSAGE_INTERVAL_MS);

        return () => clearTimeout(timer);
    }, [index, messages.length]);

    return (
        <span key={index} className="ai-shimmer text-md font-medium motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-700">
            {messages[index]}
        </span>
    );
};

export const AnalysisProgress = ({ stages, activeId }: AnalysisProgressProps) => {
    const activeIndex = stages.findIndex(({ id }) => id === activeId);
    const reached = stages.slice(0, activeIndex + 1);
    const active = stages[activeIndex];

    return (
        <div>
            <ol aria-label="Analysis progress" className="flex flex-col gap-3">
                {reached.map((stage, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <li key={stage.id} className="flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-700">
                            {isActive ? (
                                <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
                                    <span className="size-2 rounded-full bg-brand-solid motion-safe:animate-pulse" />
                                </span>
                            ) : (
                                <CheckCircle aria-hidden="true" className="size-5 shrink-0 text-fg-success-secondary" />
                            )}
                            {isActive ? <ActiveLabel stage={stage} /> : <span className="text-md text-tertiary">{stage.label}</span>}
                        </li>
                    );
                })}
            </ol>
            <p role="status" className="sr-only">
                {active?.label}
            </p>
        </div>
    );
};
