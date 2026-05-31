import { cn } from "../lib/cn";
import { Card, CardContent } from "./card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
            {description && <p className="text-xs text-zinc-500">{description}</p>}
            {trend && <p className="text-xs text-pink-400">{trend}</p>}
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
