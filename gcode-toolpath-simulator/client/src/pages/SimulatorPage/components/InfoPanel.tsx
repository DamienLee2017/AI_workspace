import { cn } from "@/lib/utils";
import type { GcodeData, ToolpathStats } from "./types";
import {
  Box,
  Ruler,
  Route,
  Zap,
  Clock,
  Layers,
  Activity,
} from "lucide-react";

interface InfoPanelProps {
  stats: ToolpathStats | null;
  gcodeData: GcodeData;
}

function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatLength(mm: number): string {
  if (mm >= 1000) {
    return `${formatNumber(mm / 1000)} m`;
  }
  return `${formatNumber(mm)} mm`;
}

export function InfoPanel({ stats, gcodeData }: InfoPanelProps) {
  if (!stats) {
    return (
      <div className="p-4 text-slate-400 text-sm">
        暂无刀路数据
      </div>
    );
  }

  const { bounds } = gcodeData;
  const sizeX = bounds.max.x - bounds.min.x;
  const sizeY = bounds.max.y - bounds.min.y;
  const sizeZ = bounds.max.z - bounds.min.z;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">刀路信息</h3>
        <p className="text-xs text-slate-500 truncate">{gcodeData.filename}</p>
      </div>

      {/* Size Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Box className="w-4 h-4 text-cyan-500" />
          工件尺寸
        </div>
        <div className="grid grid-cols-3 gap-2">
          <SizeCard label="X" value={formatLength(sizeX)} color="text-cyan-400" />
          <SizeCard label="Y" value={formatLength(sizeY)} color="text-emerald-400" />
          <SizeCard label="Z" value={formatLength(sizeZ)} color="text-amber-400" />
        </div>
      </div>

      {/* Bounds */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Ruler className="w-4 h-4 text-cyan-500" />
          边界范围
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <BoundItem label="X" min={bounds.min.x} max={bounds.max.x} />
          <BoundItem label="Y" min={bounds.min.y} max={bounds.max.y} />
          <BoundItem label="Z" min={bounds.min.z} max={bounds.max.z} />
        </div>
      </div>

      {/* Movement Stats */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Route className="w-4 h-4 text-cyan-500" />
          移动统计
        </div>
        <div className="space-y-2">
          <StatRow
            icon={<Zap className="w-3 h-3" />}
            label="快速定位"
            value={stats.rapidMoves.toString()}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
          />
          <StatRow
            icon={<Activity className="w-3 h-3" />}
            label="进给移动"
            value={stats.feedMoves.toString()}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
          />
          <StatRow
            icon={<Layers className="w-3 h-3" />}
            label="圆弧移动"
            value={stats.arcMoves.toString()}
            color="text-amber-400"
            bgColor="bg-amber-500/10"
          />
        </div>
      </div>

      {/* Feed Rate */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Clock className="w-4 h-4 text-cyan-500" />
          进给速率
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-slate-500 mb-1">最小</div>
            <div className="text-emerald-400 font-mono font-medium">
              {stats.minFeedRate > 0 ? `${formatNumber(stats.minFeedRate)} mm/min` : "-"}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-slate-500 mb-1">最大</div>
            <div className="text-cyan-400 font-mono font-medium">
              {stats.maxFeedRate > 0 ? `${formatNumber(stats.maxFeedRate)} mm/min` : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <div className="text-xs text-slate-400 mb-2">路径总长度</div>
        <div className="text-2xl font-bold text-white font-mono">
          {formatLength(stats.estimatedLength)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          共 {stats.totalSegments.toLocaleString()} 个线段，{stats.totalLines.toLocaleString()} 行代码
        </div>
      </div>
    </div>
  );
}

function SizeCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
      <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function BoundItem({ label, min, max }: { label: string; min: number; max: number }) {
  return (
    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="text-xs text-slate-400 font-mono">
          {formatNumber(min, 1)} → {formatNumber(max, 1)}
        </span>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center gap-2">
        <span className={cn("p-1 rounded", bgColor, color)}>{icon}</span>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className={cn("font-mono font-medium", color)}>{value}</span>
    </div>
  );
}
