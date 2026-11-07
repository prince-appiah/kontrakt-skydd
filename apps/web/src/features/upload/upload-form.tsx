import { useState } from "react";
import type { AnalysisMode } from "@clauseguard/shared";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { Dropzone } from "./dropzone";
import { PrivacyNotice } from "./privacy-notice";
import { SamplePicker } from "./sample-picker";
import { SelectedFile } from "./selected-file";
import { type AnalysisStep, useAnalyzeContract } from "./use-analyze-contract";

const STEP_MESSAGES: Record<AnalysisStep, string> = {
    parsing: "Reading the document",
    redacting: "Redacting personal data",
    analyzing: "Analyzing the contract",
};

const STEP_PROGRESS: Record<AnalysisStep, number> = {
    parsing: 15,
    redacting: 35,
    analyzing: 65,
};

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
                        <ButtonGroupItem id="private" isDisabled aria-label="Private, not available yet">
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
                {step && (
                    <div role="group" aria-label="Analysis progress">
                        <ProgressBar value={STEP_PROGRESS[step]} labelPosition="bottom" valueFormatter={() => STEP_MESSAGES[step]} />
                    </div>
                )}
                <p role="status" className="sr-only">
                    {step ? STEP_MESSAGES[step] : ""}
                </p>
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
