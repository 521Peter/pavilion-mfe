import { Button, Input, ListBox, Select } from "@heroui/react";
import type { UsageOptions } from "../../api/usage";

export type UsageRangeKey = "24h" | "7d" | "30d" | "custom";
type FilterKey = "applicationId" | "virtualModelId" | "providerId" | "status";

interface UsageFiltersProps {
  rangeKey: UsageRangeKey;
  customFrom: string;
  customTo: string;
  options: UsageOptions;
  applicationId?: string;
  virtualModelId?: string;
  providerId?: string;
  status?: string;
  onRangeChange: (range: Exclude<UsageRangeKey, "custom">) => void;
  onCustomChange: (field: "from" | "to", value: string) => void;
  onApplyCustom: () => void;
  onFilterChange: (field: FilterKey, value: string) => void;
}

const ranges: Array<{ key: Exclude<UsageRangeKey, "custom">; label: string }> = [
  { key: "24h", label: "近 24 小时" },
  { key: "7d", label: "近 7 天" },
  { key: "30d", label: "近 30 天" }
];

function FilterSelect({
  id,
  label,
  value,
  items,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  items: Array<{ id: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-text-regular">
        {label}
      </label>
      <Select id={id} selectedKey={value} onSelectionChange={key => onChange(String(key ?? ""))} fullWidth>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="">全部</ListBox.Item>
            {items.map(item => (
              <ListBox.Item key={item.id} id={item.id}>
                {item.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}

export default function UsageFilters(props: UsageFiltersProps) {
  const customValid = Boolean(props.customFrom && props.customTo && props.customFrom <= props.customTo);

  return (
    <section aria-label="用量统计筛选" className="mb-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ranges.map(range => (
          <Button
            key={range.key}
            size="sm"
            variant={props.rangeKey === range.key ? "primary" : "outline"}
            aria-pressed={props.rangeKey === range.key}
            onPress={() => props.onRangeChange(range.key)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="usage-custom-from" className="mb-1.5 block text-[13px] font-medium text-text-regular">
            开始时间
          </label>
          <Input
            id="usage-custom-from"
            type="datetime-local"
            variant="primary"
            value={props.customFrom}
            onChange={event => props.onCustomChange("from", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="usage-custom-to" className="mb-1.5 block text-[13px] font-medium text-text-regular">
            结束时间
          </label>
          <Input
            id="usage-custom-to"
            type="datetime-local"
            variant="primary"
            value={props.customTo}
            onChange={event => props.onCustomChange("to", event.target.value)}
          />
        </div>
        <Button size="sm" variant="primary" isDisabled={!customValid} onPress={props.onApplyCustom}>
          应用时间
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          id="usage-application"
          label="来源应用"
          value={props.applicationId ?? ""}
          items={props.options.applications}
          onChange={value => props.onFilterChange("applicationId", value)}
        />
        <FilterSelect
          id="usage-virtual-model"
          label="Virtual Model"
          value={props.virtualModelId ?? ""}
          items={props.options.virtualModels}
          onChange={value => props.onFilterChange("virtualModelId", value)}
        />
        <FilterSelect
          id="usage-provider"
          label="Provider"
          value={props.providerId ?? ""}
          items={props.options.providers}
          onChange={value => props.onFilterChange("providerId", value)}
        />
        <FilterSelect
          id="usage-status"
          label="状态"
          value={props.status ?? ""}
          items={[
            { id: "completed", label: "成功" },
            { id: "failed", label: "失败" },
            { id: "cancelled", label: "已取消" }
          ]}
          onChange={value => props.onFilterChange("status", value)}
        />
      </div>
    </section>
  );
}
