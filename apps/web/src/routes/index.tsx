import { createFileRoute } from "@tanstack/react-router";
import { UploadForm } from "@/features/upload";

export const Route = createFileRoute("/")({
    head: () => ({ meta: [{ title: "Upload a contract - Clause Guard" }] }),
    component: UploadForm,
});
