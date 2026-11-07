import { Lock01 } from "@untitledui/icons";

export const PrivacyNotice = () => (
    <p className="flex items-start gap-2 text-sm text-tertiary">
        <Lock01 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
        Personal data is redacted before AI sees your contract. Nothing is stored.
    </p>
);
