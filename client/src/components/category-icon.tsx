import { 
  Coffee, 
  Flame, 
  Tent, 
  Snowflake, 
  Lightbulb, 
  Car, 
  Heart, 
  Music, 
  Package,
  type LucideIcon 
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  coffee: Coffee,
  flame: Flame,
  tent: Tent,
  snowflake: Snowflake,
  lightbulb: Lightbulb,
  car: Car,
  heart: Heart,
  music: Music,
};

interface CategoryIconProps {
  icon: string;
  className?: string;
  color?: string;
}

export function CategoryIcon({ icon, className = "h-5 w-5", color }: CategoryIconProps) {
  const Icon = iconMap[icon] || Package;
  return <Icon className={className} style={color ? { color } : undefined} />;
}