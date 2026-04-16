import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3d,
  Layers,
  Grid3x3,
  Eye,
  EyeOff,
  FileX,
  Minus,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ToolbarProps {
  viewMode: "3d" | "xy" | "xz" | "yz";
  onViewModeChange: (mode: "3d" | "xy" | "xz" | "yz") => void;
  showPaths: boolean;
  onShowPathsChange: (show: boolean) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  onReset: () => void;
  hasData: boolean;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  showPaths,
  onShowPathsChange,
  showGrid,
  onShowGridChange,
  onReset,
  hasData,
  lineWidth,
  onLineWidthChange,
}: ToolbarProps) {
  return (
    <div className="w-56 flex-none border-r border-slate-800/50 bg-slate-950/50 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* View Mode */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            视图模式
          </Label>
          <Select value={viewMode} onValueChange={(v) => onViewModeChange(v as typeof viewMode)}>
            <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50">
              <SelectValue placeholder="选择视图" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3d">
                <div className="flex items-center gap-2">
                  <Move3d className="w-4 h-4" />
                  3D 视图
                </div>
              </SelectItem>
              <SelectItem value="xy">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  XY 平面
                </div>
              </SelectItem>
              <SelectItem value="xz">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  XZ 平面
                </div>
              </SelectItem>
              <SelectItem value="yz">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  YZ 平面
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display Options */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            显示选项
          </Label>
          <div className="space-y-2">
            <Button
              variant={showPaths ? "default" : "outline"}
              size="sm"
              onClick={() => onShowPathsChange(!showPaths)}
              className={cn(
                "w-full justify-start",
                showPaths
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30"
                  : "bg-slate-900/50 border-slate-700/50 text-slate-400"
              )}
            >
              {showPaths ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              显示路径
            </Button>
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={() => onShowGridChange(!showGrid)}
              className={cn(
                "w-full justify-start",
                showGrid
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30"
                  : "bg-slate-900/50 border-slate-700/50 text-slate-400"
              )}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              显示网格
            </Button>
          </div>
        </div>

        {/* Line Width */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            线宽调整
          </Label>
          <div className="px-1">
            <Slider
              value={[lineWidth]}
              onValueChange={([v]) => onLineWidthChange(v)}
              min={0.5}
              max={5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <Minus className="w-3 h-3" />
              <span className="font-mono text-slate-400">{lineWidth}px</span>
              <Plus className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            操作
          </Label>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!hasData}
              className="w-full justify-start bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <FileX className="w-4 h-4 mr-2" />
              清除文件
            </Button>
          </div>
        </div>

        {/* Help */}
        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-400 mb-2">操作提示</p>
            <p>鼠标左键：旋转视图</p>
            <p>鼠标右键：平移视图</p>
            <p>滚轮：缩放视图</p>
          </div>
        </div>
      </div>
    </div>
  );
}
