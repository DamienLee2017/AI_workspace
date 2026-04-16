import { motion } from "framer-motion";
import { 
  Box, 
  Layers, 
  Clock, 
  Ruler, 
  Activity,
  Zap,
  Layers3
} from "lucide-react";

interface ToolpathInfoProps {
  totalLines: number;
  totalDistance: number;
  estimatedTime: string;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  feedRates: {
    min: number;
    max: number;
    avg: number;
  };
  layers: number;
}

export function ToolpathInfo({
  totalLines,
  totalDistance,
  estimatedTime,
  bounds,
  feedRates,
  layers,
}: ToolpathInfoProps) {
  const infoItems = [
    {
      icon: Box,
      label: "加工范围",
      value: `${(bounds.maxX - bounds.minX).toFixed(1)} × ${(bounds.maxY - bounds.minY).toFixed(1)} × ${(bounds.maxZ - bounds.minZ).toFixed(1)} mm`,
      subLabel: `X: ${bounds.minX.toFixed(1)}~${bounds.maxX.toFixed(1)} | Y: ${bounds.minY.toFixed(1)}~${bounds.maxY.toFixed(1)} | Z: ${bounds.minZ.toFixed(1)}~${bounds.maxZ.toFixed(1)}`,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Layers,
      label: "刀路层数",
      value: `${layers} 层`,
      subLabel: "Z轴分层加工",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Layers3,
      label: "总行数",
      value: totalLines.toLocaleString(),
      subLabel: "G-code 指令",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      icon: Ruler,
      label: "路径总长",
      value: `${(totalDistance / 1000).toFixed(2)} m`,
      subLabel: `${totalDistance.toFixed(1)} mm`,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Clock,
      label: "预估时间",
      value: estimatedTime,
      subLabel: "基于 100% 进给率",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Activity,
      label: "进给速率",
      value: `${feedRates.avg.toFixed(0)} mm/min`,
      subLabel: `范围: ${feedRates.min.toFixed(0)} - ${feedRates.max.toFixed(0)}`,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">刀路信息</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {infoItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-base font-semibold text-foreground truncate">
                  {item.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70 truncate">
                {item.subLabel}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
