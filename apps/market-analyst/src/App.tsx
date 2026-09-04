import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SettingsPanel } from "./components/sidebar/SettingsPanel";

function App() {
  const [showSettingDrawer, setShowSettingDrawer] = useState(false);
  return (
    <>
      <Sidebar openSettingDrawer={setShowSettingDrawer}></Sidebar>
      <SettingsPanel isOpen={showSettingDrawer} onOpenChange={setShowSettingDrawer} />
    </>
  );
}

export default App;
