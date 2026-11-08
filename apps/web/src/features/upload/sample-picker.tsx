import { File05 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

const SAMPLES = [
    { id: "lease-agreement", title: "Residential lease" },
    { id: "freelance-agreement", title: "Freelance agreement" },
    { id: "saas-terms", title: "SaaS terms" },
] as const;

export type SampleId = (typeof SAMPLES)[number]["id"];

interface SamplePickerProps {
    isDisabled: boolean;
    onSelect: (id: SampleId) => void;
}

export const SamplePicker = ({ isDisabled, onSelect }: SamplePickerProps) => (
    <section aria-labelledby="samples-heading" className="flex flex-col gap-3">
        <h2 id="samples-heading" className="text-md font-semibold text-primary">
            Try a sample
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
            {SAMPLES.map(({ id, title }) => (
                <Button
                    key={id}
                    color="secondary"
                    size="lg"
                    iconLeading={File05}
                    isDisabled={isDisabled}
                    onClick={() => onSelect(id)}
                >
                    {title}
                </Button>
            ))}
        </div>
    </section>
);
