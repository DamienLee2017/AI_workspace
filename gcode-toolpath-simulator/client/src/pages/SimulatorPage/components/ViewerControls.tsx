import { useCallback } from "react";
import { 
  RotateCcw, 
  Maximize2, 
  Grid3x3, 
  Box, 
  Eye, 
  Layers,
  Move3d
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ViewMode = "path" | "transparent" | "solid";
export type ViewPreset = "front" | "side" | "top" | "iso";

interface ViewerControlsProps {
  className?: string;
  onResetView?: () => void;
  onFitView?: () => void;
  onToggleGrid?: (show: boolean) => void;
  onToggleBoundingBox?: (show: boolean) => void;
  onChangeViewMode?: (mode: ViewMode) => void;
  onChangeViewPreset?: (preset: ViewPreset) => void;
  onChangeZoom?: (zoom: number) => void;
  onChangeRotationSpeed?: (speed: number) => void;
  showGrid?: boolean;
  showBoundingBox?: boolean;
  viewMode?: ViewMode;
  viewPreset?: ViewPreset;
  zoom?: number;
  rotationSpeed?: number;
}

export function ViewerControls({
  className,
  onResetView,
  onFitView,
  onToggleGrid,
  onToggleBoundingBox,
  onChangeViewMode,
  onChangeViewPreset,
  onChangeZoom,
  onChangeRotationSpeed,
  showGrid = true,
  showBoundingBox = false,
  viewMode = "path",
  viewPreset = "iso",
  zoom = 100,
  rotationSpeed = 50,
}: ViewerControlsProps) {
  const handleGridToggle = useCallback(() => {
    onToggleGrid?.(!showGrid);
  }, [showGrid, onToggleGrid]);

  const handleBoundingBoxToggle = useCallback(() => {
    onToggleBoundingBox?.(!showBoundingBox);
  }, [showBoundingBox, onToggleBoundingBox]);

  return (
    <div className={cn(
      "flex flex-col gap-4 p-4 bg-card rounded-xl border border-border",
      className
    )}>
      {/* 视图操作 */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          视图操作
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetView}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onFitView}
            className="w-full"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            适应
          </Button>
        </div>
      </div>

      {/* 显示选项 */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          显示选项
        </Label>
        <div className="space-y-2">
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={handleGridToggle}
            className="w-full justify-start"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            {showGrid ? "隐藏网格" : "显示网格"}
          </Button>
          <Button
            variant={showBoundingBox ? "default" : "outline"}
            size="sm"
            onClick={handleBoundingBoxToggle}
            className="w-full justify-start"
          >
            <Box className="w-4 h-4 mr-2" />
            {showBoundingBox ? "隐藏边界框" : "显示边界框"}
          </Button>
        </div>
      </div>

      {/* 显示模式 */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          显示模式
        </Label>
        <Select value={viewMode} onValueChange={(v) => onChangeViewMode?.(v as ViewMode)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择显示模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="path">
              <div className="flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                仅路径
              </div>
            </SelectItem>
            <SelectItem value="transparent">
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                半透明
              </div>
            </SelectItem>
            <SelectItem value="solid">
              <div className="flex items-center">
                <Box className="w-4 h-4 mr-2" />
                实体
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 视角预设 */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          视角预设
        </Label>
        <Select value={viewPreset} onValueChange={(v) => onChangeViewPreset?.(v as ViewPreset)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择视角" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="front">
              <div className="flex items-center">
                <Move3d className="w-4 h-4 mr-2" />
                正视图
              </div>
            </SelectItem>
            <SelectItem value="side">
              <div className="flex items-center">
                <Move3d className="w-4 h-4 mr-2" />
                侧视图
              </div>
            </SelectItem>
            <SelectItem value="top">
              <div className="flex items-center">
                <Move3d className="w-4 h-4 mr-2" />
                俯视图
              </div>
            </SelectItem>
            <SelectItem value="iso">
              <div className="flex items-center">
                <Move3d className="w-4 h-4 mr-2" />
                等轴测
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 缩放控制 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            缩放
          </Label>
          <span className="text-xs text-muted-foreground">{zoom}%</span>
        </div>
        <Slider
          value={[zoom]}
          min={10}
          max={500}
          step={10}
          onValueChange={([v]) => onChangeZoom?.(v)}
          className="w-full"
        />
      </div>

      {/* 旋转速度 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            旋转速度
          </Label>
          <span className="text-xs text-muted-foreground">{rotationSpeed}%</span>
        </div>
        <Slider
          value={[rotationSpeed]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => onChangeRotationSpeed?.(v)}
          className="w-full"
        />
      </div>
    </div>
  );
}
