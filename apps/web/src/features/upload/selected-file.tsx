import { Docx } from "@untitledui/file-icons/dist/docx";
import { Pdf } from "@untitledui/file-icons/dist/pdf";
import { Trash01 } from "@untitledui/icons";
import { getReadableFileSize } from "@/components/application/file-upload/file-upload-base";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

interface SelectedFileProps {
    file: File;
    isDisabled: boolean;
    onRemove: () => void;
}

export const SelectedFile = ({ file, isDisabled, onRemove }: SelectedFileProps) => {
    const Icon = file.name.toLowerCase().endsWith(".pdf") ? Pdf : Docx;

    return (
        <div
            className={cx(
                "flex items-center gap-3 rounded-xl bg-primary p-4 ring-1 ring-secondary",
                "ring-inset",
            )}
        >
            <Icon className="size-10 shrink-0 dark:hidden" theme="light" />
            <Icon className="size-10 shrink-0 not-dark:hidden" theme="dark" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-secondary">{file.name}</p>
                <p className="text-sm text-tertiary">{getReadableFileSize(file.size)}</p>
            </div>
            <ButtonUtility
                color="tertiary"
                size="xs"
                icon={Trash01}
                tooltip="Remove file"
                isDisabled={isDisabled}
                onClick={onRemove}
            />
        </div>
    );
};
