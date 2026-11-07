import type { Category, Risk } from "@clauseguard/shared";

export const CATEGORY_LABELS: Record<Category, string> = {
    termination: "Termination",
    liability: "Liability",
    payment: "Payment",
    ip: "IP",
    non_compete: "Non-compete",
    auto_renewal: "Auto-renewal",
    other: "Other",
};

export const RISK_LABELS: Record<Risk, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
};

export const RISK_BADGE_COLORS = {
    high: "error",
    medium: "warning",
    low: "gray",
} as const satisfies Record<Risk, "error" | "warning" | "gray">;

export const RISK_HIGHLIGHT_CLASSES: Record<Risk, string> = {
    high: "bg-error-primary decoration-fg-error-primary decoration-solid",
    medium: "bg-warning-primary decoration-fg-warning-primary decoration-dashed",
    low: "bg-tertiary decoration-fg-tertiary decoration-dotted",
};
