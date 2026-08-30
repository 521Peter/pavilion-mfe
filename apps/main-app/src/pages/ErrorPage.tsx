import { useNavigate } from "react-router-dom";
import { useTabs } from "@pavilion-mfe/tabs/react";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export default function ErrorPage({ img, title, desc }: { img: string; title: string; desc: string }) {
  const navigate = useNavigate();
  const { activeTabId, closeTab } = useTabs();

  function goHome() {
    if (activeTabId) closeTab(activeTabId);
    navigate("/");
  }

  return (
    <div className="flex flex-col justify-center items-center h-full gap-4">
      <img src={img} alt={title} className="w-80 max-w-[60%]" />
      <h2 className="text-xl font-bold text-text-primary m-0">{title}</h2>
      <p className="text-sm font-medium text-text-muted m-0">{desc}</p>
      <Button variant="primary" onPress={goHome}>
        <ArrowLeft size={16} />
        返回首页
      </Button>
    </div>
  );
}
