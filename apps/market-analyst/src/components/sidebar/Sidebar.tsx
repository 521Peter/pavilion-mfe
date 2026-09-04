import { Group, Panel, Separator } from "react-resizable-panels";
import { Button, Label, Input, Separator as Divider } from "@heroui/react";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export function Sidebar({ openSettingDrawer }: { openSettingDrawer: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("");
  const [customerGroup, setCustomerGroup] = useState("");
  const [customerGroups, setCustomerGroups] = useState<string[]>([]);

  const canAddCustomerGroup = customerGroups.length < 6;

  const addCustomerGroup = () => {
    const value = customerGroup.trim();

    if (!value || !canAddCustomerGroup || customerGroups.includes(value)) {
      return;
    }

    setCustomerGroups([...customerGroups, value]);
    setCustomerGroup("");
  };

  return (
    <Group className="h-full bg-slate-100">
      <Panel className="h-full" defaultSize="20%" minSize="20%">
        <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          <div className="flex items-center justify-between p-3">
            <div>market analyst</div>
            <Button isIconOnly aria-label="设置" variant="secondary" onPress={() => openSettingDrawer(true)}>
              <Icon name="Bolt" />
            </Button>
          </div>

          <Divider />

          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="product-input">产品</Label>
                <Input
                  fullWidth
                  id="product-input"
                  onChange={event => setProduct(event.target.value)}
                  placeholder="输入产品名称或描述"
                  type="text"
                  value={product}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="goal-input">目标</Label>
                <Input
                  fullWidth
                  id="goal-input"
                  onChange={event => setGoal(event.target.value)}
                  placeholder="输入分析目标"
                  type="text"
                  value={goal}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="customer-group-input">客户群体</Label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5">
                      {customerGroups.length > 0 ? (
                        customerGroups.map((item, index) => (
                          <div
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                            key={item}
                          >
                            <span className="truncate text-slate-700">{item}</span>
                            <span className="text-xs text-slate-400">{index + 1}/6</span>
                          </div>
                        ))
                      ) : (
                        <p className="px-1 text-xs text-slate-400">尚未添加客户群体</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        disabled={!canAddCustomerGroup}
                        fullWidth
                        id="customer-group-input"
                        onChange={event => setCustomerGroup(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === "Enter") {
                            addCustomerGroup();
                          }
                        }}
                        placeholder={canAddCustomerGroup ? "输入后点击添加" : "最多添加 6 项"}
                        type="text"
                        value={customerGroup}
                      />
                      <Button isDisabled={!canAddCustomerGroup} onPress={addCustomerGroup}>
                        <Icon name="Plus" />
                        添加
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-3">
            <Button fullWidth>开始分析</Button>
          </div>
        </section>
      </Panel>
      <Separator aria-label="Resize panels" className="resize-separator" />
      <Panel className="h-full" minSize="80%">
        <section className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          right
        </section>
      </Panel>
    </Group>
  );
}
