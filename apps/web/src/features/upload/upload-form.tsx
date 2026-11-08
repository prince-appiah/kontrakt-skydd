import { useState } from "react";
import type { AnalysisMode } from "@clauseguard/shared";
import { AnalysisProgress, type ProgressStage } from "@/components/ai/analysis-progress";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { Dropzone } from "./dropzone";
import { PrivacyNotice } from "./privacy-notice";
import { SamplePicker } from "./sample-picker";
import { SelectedFile } from "./selected-file";
import { type AnalysisStep, useAnalyzeContract } from "./use-analyze-contract";

const STAGES: (ProgressStage & { id: AnalysisStep })[] = [
    { id: "uploading", label: "Uploading your contract" },
    { id: "parsing", label: "Reading the document" },
    { id: "redacting", label: "Redacting sensitive info" },
    {
        id: "analyzing",
        label: "Reviewing for red flags",
        messages: [
            "Reviewing for red flags",
            "Checking termination and liability terms",
            "Looking at payment and renewal terms",
            "Drafting counter-clauses",
        ],
    },
    { id: "ready", label: "Preparing your results" },
];

export const UploadForm = () => {
    const { analyze, isPending, step, error: analysisError } = useAnalyzeContract();
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [mode, setMode] = useState<AnalysisMode>("cloud");
    const message = fileError ?? analysisError;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
            <div className="flex flex-col gap-3">
                <h1 className="text-display-sm font-semibold text-primary">Upload a contract</h1>
                <PrivacyNotice />
            </div>

            <div className="flex flex-col gap-4">
                <Dropzone
                    isDisabled={isPending}
                    onFile={(selected) => {
                        setFile(selected);
                        setFileError(null);
                    }}
                    onReject={setFileError}
                />
                {message && (
                    <p role="alert" className="text-sm text-error-primary">
                        {message}
                    </p>
                )}
                {file && (
                    <SelectedFile
                        file={file}
                        isDisabled={isPending}
                        onRemove={() => {
                            setFile(null);
                            setFileError(null);
                        }}
                    />
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <ButtonGroup
                        aria-label="Analysis mode"
                        selectionMode="single"
                        disallowEmptySelection
                        isDisabled={isPending}
                        selectedKeys={[mode]}
                        onSelectionChange={(keys) => {
                            const [key] = keys;
                            if (key === "cloud" || key === "private") {
                                setMode(key);
                            }
                        }}
                    >
                        <ButtonGroupItem id="cloud">Cloud</ButtonGroupItem>
                        <ButtonGroupItem
                            id="private"
                            isDisabled
                            aria-label="Private, not available yet"
                        >
                            Private
                        </ButtonGroupItem>
                    </ButtonGroup>
                    <Button
                        size="lg"
                        isDisabled={!file}
                        isLoading={isPending}
                        onClick={() => {
                            if (file) {
                                setFileError(null);
                                analyze({ source: "file", file, mode });
                            }
                        }}
                    >
                        Analyze
                    </Button>
                </div>
                {step && <AnalysisProgress stages={STAGES} activeId={step} />}
            </div>

            <SamplePicker
                isDisabled={isPending}
                onSelect={(sampleId) => {
                    setFileError(null);
                    analyze({ source: "sample", sampleId });
                }}
            />
        </div>
    );
};
