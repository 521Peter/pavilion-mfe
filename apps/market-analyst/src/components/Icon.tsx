import { icons, type LucideProps } from "lucide-react";

type IconName = keyof typeof icons;

interface IconProps extends LucideProps {
  name?: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = name ? icons[name] : icons.Menu;

  return <LucideIcon {...props} />;
}
