import { Button, Input, ListBox, Select } from "@heroui/react";
import { CalendarDays, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
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
      <Select
        id={id}
        aria-label={label}
        selectedKey={value}
        onSelectionChange={key => onChange(String(key ?? ""))}
        fullWidth
      >
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
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const fromTime = new Date(props.customFrom).getTime();
  const toTime = new Date(props.customTo).getTime();
  const customValid =
    Number.isFinite(fromTime) &&
    Number.isFinite(toTime) &&
    fromTime < toTime &&
    toTime - fromTime <= 366 * 24 * 60 * 60 * 1000;
  const activeFilterCount = [props.applicationId, props.virtualModelId, props.providerId, props.status].filter(
    Boolean
  ).length;

  return (
    <section aria-label="用量统计筛选" className="mb-5 rounded-xl border border-border bg-card-bg p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="时间范围">
          <span className="mr-1 inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
            <CalendarDays aria-hidden="true" className="size-4 text-primary" />
            时间范围
          </span>
          {ranges.map(range => (
            <Button
              key={range.key}
              size="sm"
              className="min-h-10"
              variant={props.rangeKey === range.key ? "primary" : "outline"}
              aria-pressed={props.rangeKey === range.key}
              onPress={() => {
                setShowCustomRange(false);
                props.onRangeChange(range.key);
              }}
            >
              {range.label}
            </Button>
          ))}
          <Button
            size="sm"
            className="min-h-10"
            variant={props.rangeKey === "custom" ? "primary" : "outline"}
            aria-expanded={showCustomRange}
            aria-controls="usage-custom-range"
            onPress={() => setShowCustomRange(current => !current)}
          >
            自定义
          </Button>
        </div>

        <Button
          size="sm"
          className="min-h-10"
          variant="ghost"
          aria-expanded={showMoreFilters}
          aria-controls="usage-advanced-filters"
          onPress={() => setShowMoreFilters(current => !current)}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          更多筛选{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform duration-200 ${showMoreFilters ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      {showCustomRange && (
        <div id="usage-custom-range" className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <div>
            <label htmlFor="usage-custom-from" className="mb-1.5 block text-[13px] font-semibold text-text-regular">
              开始时间
            </label>
            <Input
              id="usage-custom-from"
              aria-label="开始时间"
              type="datetime-local"
              variant="primary"
              value={props.customFrom}
              onChange={event => props.onCustomChange("from", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="usage-custom-to" className="mb-1.5 block text-[13px] font-semibold text-text-regular">
              结束时间
            </label>
            <Input
              id="usage-custom-to"
              aria-label="结束时间"
              type="datetime-local"
              variant="primary"
              value={props.customTo}
              onChange={event => props.onCustomChange("to", event.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="min-h-10"
            variant="primary"
            isDisabled={!customValid}
            onPress={props.onApplyCustom}
          >
            应用时间
          </Button>
        </div>
      )}

      {showMoreFilters && (
        <div
          id="usage-advanced-filters"
          className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 md:grid-cols-2 xl:grid-cols-4"
        >
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
      )}
    </section>
  );
}
