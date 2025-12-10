import { 
  User, 
  UserCircle, 
  UserRound, 
  UserCheck, 
  Users, 
  Contact,
  type LucideIcon 
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  'user': User,
  'user-circle': UserCircle,
  'user-round': UserRound,
  'user-check': UserCheck,
  'users': Users,
  'contact': Contact,
};

interface AvatarIconProps {
  icon?: string | null;
  className?: string;
  color?: string;
}

export function AvatarIcon({ icon, className = "h-5 w-5", color }: AvatarIconProps) {
  const Icon = iconMap[icon || 'user'] || User;
  return <Icon className={className} style={color ? { color } : undefined} />;
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#DC2626', '#EA580C', '#D97706', '#65A30D', '#16A34A', '#0D9488',
    '#0891B2', '#2563EB', '#7C3AED', '#C026D3', '#DB2777', '#E11D48'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}