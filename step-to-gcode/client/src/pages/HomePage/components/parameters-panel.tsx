import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Settings2, 
  RotateCw, 
  Move3D, 
  Layers, 
  Gauge, 
  Sword,
  RotateCcw
} from "lucide-react";

export interface MachiningParameters {
  feedRate: number;
  spindleSpeed: number;
  cuttingDepth: number;
  stepOver: number;
  toolDiameter: number;
  safeHeight: number;
  retractHeight: number;
  coolantEnabled: boolean;
  finishPass: boolean;
  finishPassAllowance: number;
}

interface ParametersPanelProps {
  parameters: MachiningParameters;
  onChange: (params: MachiningParameters) => void;
}

const defaultParameters: MachiningParameters = {
  feedRate: 800,
  spindleSpeed: 3000,
  cuttingDepth: 2.0,
  stepOver: 0.5,
  toolDiameter: 6.0,
  safeHeight: 10.0,
  retractHeight: 3.0,
  coolantEnabled: true,
  finishPass: true,
  finishPassAllowance: 0.2,
};

export function ParametersPanel({ parameters, onChange }: ParametersPanelProps) {
  const [activePreset, setActivePreset] = useState<string>("custom");

  const presets = [
    { id: "rough", name: "粗加工", params: { feedRate: 600, spindleSpeed: 2000, cuttingDepth: 3.0 } },
    { id: "finish", name: "精加工", params: { feedRate: 1200, spindleSpeed: 4000, cuttingDepth: 0.5 } },
    { id: "drill", name: "钻孔", params: { feedRate: 300, spindleSpeed: 1500, cuttingDepth: 5.0 } },
  ];

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      onChange({ ...parameters, ...preset.params });
    }
  };

  const updateParam = <K extends keyof MachiningParameters>(
    key: K,
    value: MachiningParameters[K]
  ) => {
    setActivePreset("custom");
    onChange({ ...parameters, [key]: value });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="w-5 h-5 text-primary" />
          加工参数
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 预设快捷选择 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            快速预设
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                  activePreset === preset.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background hover:bg-accent border-border"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* 主轴转速 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">主轴转速 (RPM)</Label>
            </div>
            <span className="text-lg font-mono font-semibold text-primary">
              {parameters.spindleSpeed}
            </span>
          </div>
          <Slider
            value={[parameters.spindleSpeed]}
            onValueChange={([v]) => updateParam("spindleSpeed", v)}
            min={500}
            max={12000}
            step={100}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>500</span>
            <span>12000</span>
          </div>
        </div>

        {/* 进给速度 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Move3D className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">进给速度 (mm/min)</Label>
            </div>
            <span className="text-lg font-mono font-semibold text-primary">
              {parameters.feedRate}
            </span>
          </div>
          <Slider
            value={[parameters.feedRate]}
            onValueChange={([v]) => updateParam("feedRate", v)}
            min={100}
            max={3000}
            step={50}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>100</span>
            <span>3000</span>
          </div>
        </div>

        {/* 切削深度 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">切削深度 (mm)</Label>
            </div>
            <span className="text-lg font-mono font-semibold text-primary">
              {parameters.cuttingDepth.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[parameters.cuttingDepth]}
            onValueChange={([v]) => updateParam("cuttingDepth", v)}
            min={0.1}
            max={10}
            step={0.1}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.1</span>
            <span>10</span>
          </div>
        </div>

        {/* 步距 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">步距 (mm)</Label>
            </div>
            <span className="text-lg font-mono font-semibold text-primary">
              {parameters.stepOver.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[parameters.stepOver]}
            onValueChange={([v]) => updateParam("stepOver", v)}
            min={0.1}
            max={2}
            step={0.05}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.1</span>
            <span>2.0</span>
          </div>
        </div>

        <Separator />

        {/* 刀具参数 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">刀具参数</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">刀具直径 (mm)</Label>
              <Input
                type="number"
                value={parameters.toolDiameter}
                onChange={(e) => updateParam("toolDiameter", parseFloat(e.target.value) || 0)}
                min={1}
                max={50}
                step={0.5}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">安全高度 (mm)</Label>
              <Input
                type="number"
                value={parameters.safeHeight}
                onChange={(e) => updateParam("safeHeight", parseFloat(e.target.value) || 0)}
                min={1}
                max={50}
                step={0.5}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        {/* 退刀高度 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">退刀高度 (mm)</Label>
            </div>
            <span className="font-mono font-semibold">{parameters.retractHeight.toFixed(1)}</span>
          </div>
          <Slider
            value={[parameters.retractHeight]}
            onValueChange={([v]) => updateParam("retractHeight", v)}
            min={1}
            max={20}
            step={0.5}
            className="py-1"
          />
        </div>

        <Separator />

        {/* 精加工设置 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">精加工</Label>
            <button
              onClick={() => updateParam("finishPass", !parameters.finishPass)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                parameters.finishPass ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  parameters.finishPass ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {parameters.finishPass && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">精加工余量 (mm)</Label>
              <Input
                type="number"
                value={parameters.finishPassAllowance}
                onChange={(e) => updateParam("finishPassAllowance", parseFloat(e.target.value) || 0)}
                min={0.05}
                max={1}
                step={0.05}
                className="font-mono"
              />
            </div>
          )}
        </div>

        {/* 冷却液 */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">冷却液</Label>
          <button
            onClick={() => updateParam("coolantEnabled", !parameters.coolantEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              parameters.coolantEnabled ? "bg-info" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                parameters.coolantEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export { defaultParameters };
