"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Cog, Gauge, Ruler, Layers } from "lucide-react";

interface GerberSettings {
  // 刀具参数
  toolDiameter: number;
  toolAperture: number;
  // 加工参数
  feedRate: number;
  plungeRate: number;
  retractRate: number;
  zSafe: number;
  zPlunge: number;
  zRetract: number;
  // PCB参数
  isolationWidth: number;
  boardThickness: number;
  // 选项
  useAperture: boolean;
  mergeArcs: boolean;
  reversePath: boolean;
  convertPadsToRects: boolean;
}

interface SettingsSectionProps {
  value?: GerberSettings;
  onChange?: (settings: GerberSettings) => void;
}

const defaultSettings: GerberSettings = {
  toolDiameter: 0.2,
  toolAperture: 0.8,
  feedRate: 100,
  plungeRate: 50,
  retractRate: 200,
  zSafe: 2,
  zPlunge: -0.1,
  zRetract: 1,
  isolationWidth: 0.15,
  boardThickness: 1.6,
  useAperture: true,
  mergeArcs: true,
  reversePath: false,
  convertPadsToRects: true,
};

export function SettingsSection({ value, onChange }: SettingsSectionProps) {
  const settings = value || defaultSettings;
  
  const updateSetting = <K extends keyof GerberSettings>(
    key: K,
    newValue: GerberSettings[K]
  ) => {
    if (onChange) {
      onChange({ ...settings, [key]: newValue });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" />
          转换设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 刀具参数 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Cog className="w-4 h-4" />
            刀具参数
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tool-diameter" className="text-xs">刀具直径 (mm)</Label>
              <div className="flex">
                <Input
                  id="tool-diameter"
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="5"
                  value={settings.toolDiameter}
                  onChange={(e) => updateSetting("toolDiameter", parseFloat(e.target.value) || 0.2)}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tool-aperture" className="text-xs">导孔直径 (mm)</Label>
              <Input
                id="tool-aperture"
                type="number"
                step="0.01"
                min="0.1"
                max="10"
                value={settings.toolAperture}
                onChange={(e) => updateSetting("toolAperture", parseFloat(e.target.value) || 0.8)}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* 加工参数 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Gauge className="w-4 h-4" />
            加工参数
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feed-rate" className="text-xs">切削进给 (mm/min)</Label>
              <Input
                id="feed-rate"
                type="number"
                step="1"
                min="1"
                max="2000"
                value={settings.feedRate}
                onChange={(e) => updateSetting("feedRate", parseFloat(e.target.value) || 100)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plunge-rate" className="text-xs">下刀速度 (mm/min)</Label>
              <Input
                id="plunge-rate"
                type="number"
                step="1"
                min="1"
                max="500"
                value={settings.plungeRate}
                onChange={(e) => updateSetting("plungeRate", parseFloat(e.target.value) || 50)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retract-rate" className="text-xs">退刀速度 (mm/min)</Label>
              <Input
                id="retract-rate"
                type="number"
                step="1"
                min="1"
                max="2000"
                value={settings.retractRate}
                onChange={(e) => updateSetting("retractRate", parseFloat(e.target.value) || 200)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-safe" className="text-xs">安全高度 (mm)</Label>
              <Input
                id="z-safe"
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={settings.zSafe}
                onChange={(e) => updateSetting("zSafe", parseFloat(e.target.value) || 2)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-plunge" className="text-xs">下刀深度 (mm)</Label>
              <Input
                id="z-plunge"
                type="number"
                step="0.01"
                min="-2"
                max="0"
                value={settings.zPlunge}
                onChange={(e) => updateSetting("zPlunge", parseFloat(e.target.value) || -0.1)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-retract" className="text-xs">退刀高度 (mm)</Label>
              <Input
                id="z-retract"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={settings.zRetract}
                onChange={(e) => updateSetting("zRetract", parseFloat(e.target.value) || 1)}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* PCB参数 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Layers className="w-4 h-4" />
            PCB参数
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isolation-width" className="text-xs">隔离宽度 (mm)</Label>
              <Input
                id="isolation-width"
                type="number"
                step="0.01"
                min="0.05"
                max="1"
                value={settings.isolationWidth}
                onChange={(e) => updateSetting("isolationWidth", parseFloat(e.target.value) || 0.15)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-thickness" className="text-xs">板厚 (mm)</Label>
              <Input
                id="board-thickness"
                type="number"
                step="0.1"
                min="0.4"
                max="3.2"
                value={settings.boardThickness}
                onChange={(e) => updateSetting("boardThickness", parseFloat(e.target.value) || 1.6)}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* 选项开关 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Ruler className="w-4 h-4" />
            转换选项
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-aperture" className="text-sm cursor-pointer">使用导孔</Label>
                <p className="text-xs text-muted-foreground">将 Gerber 导孔转换为 CNC 钻孔指令</p>
              </div>
              <Switch
                id="use-aperture"
                checked={settings.useAperture}
                onCheckedChange={(checked) => updateSetting("useAperture", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="merge-arcs" className="text-sm cursor-pointer">合并圆弧</Label>
                <p className="text-xs text-muted-foreground">将连续小圆弧合并为单一指令</p>
              </div>
              <Switch
                id="merge-arcs"
                checked={settings.mergeArcs}
                onCheckedChange={(checked) => updateSetting("mergeArcs", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reverse-path" className="text-sm cursor-pointer">反转路径</Label>
                <p className="text-xs text-muted-foreground">反向处理刀具路径</p>
              </div>
              <Switch
                id="reverse-path"
                checked={settings.reversePath}
                onCheckedChange={(checked) => updateSetting("reversePath", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="convert-pads" className="text-sm cursor-pointer">焊盘转矩形</Label>
                <p className="text-xs text-muted-foreground">将圆形焊盘转换为矩形雕刻路径</p>
              </div>
              <Switch
                id="convert-pads"
                checked={settings.convertPadsToRects}
                onCheckedChange={(checked) => updateSetting("convertPadsToRects", checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
