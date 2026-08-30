import { icons, type LucideProps } from "lucide-react";

// 所有合法的 Lucide 图标名
type IconName = keyof typeof icons;

interface IconProps extends LucideProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    // 兜底图标
    return <icons.Menu {...props} />;
  }

  return <LucideIcon {...props} />;
}
