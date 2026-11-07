import { MAX_FILE_SIZE_BYTES } from "@clauseguard/shared";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";

interface DropzoneProps {
    isDisabled: boolean;
    onFile: (file: File) => void;
    onReject: (message: string) => void;
}

export const Dropzone = ({ isDisabled, onFile, onReject }: DropzoneProps) => (
    <FileUploadDropZone
        isDisabled={isDisabled}
        accept=".pdf,.docx"
        allowsMultiple={false}
        maxSize={MAX_FILE_SIZE_BYTES}
        hint="PDF or DOCX, up to 5 MB"
        onDropFiles={(files) => {
            const file = files.item(0);
            if (file) {
                onFile(file);
            }
        }}
        onDropUnacceptedFiles={() => onReject("Only PDF and DOCX files are supported.")}
        onSizeLimitExceed={() => onReject("The file is larger than 5 MB.")}
    />
);
