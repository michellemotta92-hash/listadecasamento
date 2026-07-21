import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  icon: LucideIcon;
  color: string;
  progress?: number;
}

export default function MetricCard({ label, value, sub, icon: Icon, color, progress }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sage-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
