import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SettingsPanel } from "./components/sidebar/SettingsPanel";
import { Group, Panel, Separator } from "react-resizable-panels";

function App() {
  const [showSettingDrawer, setShowSettingDrawer] = useState(false);
  return (
    <>
      <Group className="h-full bg-slate-100">
        {/* 侧边栏 */}
        <Sidebar openSettingDrawer={setShowSettingDrawer}></Sidebar>
        {/* 分割条 */}
        <Separator aria-label="Resize panels" className="resize-separator" />
        {/* 流程节点 */}
        <Panel className="h-full" minSize="80%">
          <section className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
            right
          </section>
        </Panel>
      </Group>

      <SettingsPanel isOpen={showSettingDrawer} onOpenChange={setShowSettingDrawer} />
    </>
  );
}

export default App;
