import { type Category, type Risk, categorySchema, riskSchema } from "@clauseguard/shared";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Select } from "@/components/base/select/select";
import { CATEGORY_LABELS } from "./clause-labels";

interface ClauseFiltersProps {
    risk: Risk | undefined;
    category: Category | undefined;
    categories: Category[];
    onRiskChange: (risk: Risk | undefined) => void;
    onCategoryChange: (category: Category | undefined) => void;
}

export const ClauseFilters = ({
    risk,
    category,
    categories,
    onRiskChange,
    onCategoryChange,
}: ClauseFiltersProps) => (
    <div className="flex flex-col gap-3">
        <ButtonGroup
            aria-label="Filter by risk"
            size="md"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[risk ?? "all"]}
            onSelectionChange={([key]) => onRiskChange(riskSchema.safeParse(key).data)}
        >
            <ButtonGroupItem id="all">All</ButtonGroupItem>
            <ButtonGroupItem id="high">High</ButtonGroupItem>
            <ButtonGroupItem id="medium">Medium</ButtonGroupItem>
            <ButtonGroupItem id="low">Low</ButtonGroupItem>
        </ButtonGroup>
        <Select
            aria-label="Filter by category"
            size="md"
            selectedKey={category ?? "all"}
            onSelectionChange={(key) => onCategoryChange(categorySchema.safeParse(key).data)}
            items={[
                { id: "all", label: "All categories" },
                ...categories.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
            ]}
        >
            {(item) => <Select.Item id={item.id} label={item.label} />}
        </Select>
    </div>
);
