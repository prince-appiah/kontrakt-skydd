import { FileIcon } from "@untitledui/file-icons";
import { Trash01 } from "@untitledui/icons";
import { getReadableFileSize } from "@/components/application/file-upload/file-upload-base";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

interface SelectedFileProps {
    file: File;
    isDisabled: boolean;
    onRemove: () => void;
}

export const SelectedFile = ({ file, isDisabled, onRemove }: SelectedFileProps) => {
    const type = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";

    return (
        <div className="flex items-center gap-3 rounded-xl bg-primary p-4 ring-1 ring-secondary ring-inset">
            <FileIcon className="size-10 shrink-0 dark:hidden" type={type} theme="light" />
            <FileIcon className="size-10 shrink-0 not-dark:hidden" type={type} theme="dark" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-secondary">{file.name}</p>
                <p className="text-sm text-tertiary">{getReadableFileSize(file.size)}</p>
            </div>
            <ButtonUtility color="tertiary" size="xs" icon={Trash01} tooltip="Remove file" isDisabled={isDisabled} onClick={onRemove} />
        </div>
    );
};
