import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileCode, Download, Trash2, MessageSquare, Minimize2, Gauge,
  Home, Shield, Replace, Columns, Settings, Plus, X,
  ChevronDown, ChevronUp, Copy, FileUp, Check
} from "lucide-react";

export interface GcodeOptions {
  removeComments: boolean;
  compressCode: boolean;
  adjustFeedRate: boolean;
  feedRateMultiplier: number;
  addHomeCommand: boolean;
  addSafetyHeight: boolean;
  safetyHeight: number;
  removeDuplicates: boolean;
  batchReplaces: BatchReplace[];
}

export interface BatchReplace {
  id: string;
  search: string;
  replace: string;
  enabled: boolean;
}

interface GcodeToolbarProps {
  options: GcodeOptions;
  onOptionsChange: (options: GcodeOptions) => void;
  onProcess: () => void;
  onImport: () => void;
  onExport: () => void;
  onClear: () => void;
  originalLines: number;
  processedLines: number;
  isProcessing: boolean;
}

export function GcodeToolbar({
  options,
  onOptionsChange,
  onProcess,
  onImport,
  onExport,
  onClear,
  originalLines,
  processedLines,
  isProcessing
}: GcodeToolbarProps) {
  const [activeTab, setActiveTab] = useState("operations");

  const handleToggle = (key: keyof GcodeOptions, value: boolean) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const handleNumberChange = (key: keyof GcodeOptions, value: string) => {
    const numValue = parseFloat(value) || 0;
    onOptionsChange({ ...options, [key]: numValue });
  };

  const addBatchReplace = () => {
    const newReplace: BatchReplace = {
      id: Date.now().toString(),
      search: "",
      replace: "",
      enabled: true
    };
    onOptionsChange({ ...options, batchReplaces: [...options.batchReplaces, newReplace] });
  };

  const updateBatchReplace = (id: string, updates: Partial<BatchReplace>) => {
    onOptionsChange({
      ...options,
      batchReplaces: options.batchReplaces.map(r => r.id === id ? { ...r, ...updates } : r)
    });
  };

  const removeBatchReplace = (id: string) => {
    onOptionsChange({
      ...options,
      batchReplaces: options.batchReplaces.filter(r => r.id !== id)
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            后处理操作
          </CardTitle>
          <div className="flex items-center gap-2">
            {originalLines > 0 && (
              <div className="text-sm text-muted-foreground mr-4">
                <span className="font-mono">{originalLines}</span> 行 →{" "}
                <span className="font-mono text-primary">{processedLines}</span> 行
                {processedLines > 0 && (
                  <span className="ml-2 text-success">
                    <Check className="w-4 h-4 inline" /> 
                    -{Math.round((1 - processedLines / originalLines) * 100)}%
                  </span>
                )}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onImport}>
              <FileUp className="w-4 h-4 mr-1" />
              导入
            </Button>
            <Button variant="outline" size="sm" onClick={onExport} disabled={processedLines === 0}>
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
            <Button variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="w-4 h-4 mr-1" />
              清空
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="operations" className="text-xs sm:text-sm">
              <FileCode className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">基础操作</span>
            </TabsTrigger>
            <TabsTrigger value="feedrate" className="text-xs sm:text-sm">
              <Gauge className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">进给调整</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs sm:text-sm">
              <Replace className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">批量替换</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ToggleItem
                icon={<MessageSquare className="w-4 h-4" />}
                label="去除注释"
                description="移除 (;) 和 ( ) 包裹的注释"
                checked={options.removeComments}
                onCheckedChange={(v) => handleToggle("removeComments", v)}
              />
              <ToggleItem
                icon={<Minimize2 className="w-4 h-4" />}
                label="压缩代码"
                description="合并连续空移，去除重复行"
                checked={options.compressCode}
                onCheckedChange={(v) => handleToggle("compressCode", v)}
              />
              <ToggleItem
                icon={<Home className="w-4 h-4" />}
                label="添加回零"
                description="在开头和结尾添加 G28 回零指令"
                checked={options.addHomeCommand}
                onCheckedChange={(v) => handleToggle("addHomeCommand", v)}
              />
              <ToggleItem
                icon={<Shield className="w-4 h-4" />}
                label="添加安全高度"
                description="在加工前抬刀到安全高度"
                checked={options.addSafetyHeight}
                onCheckedChange={(v) => handleToggle("addSafetyHeight", v)}
              />
              <ToggleItem
                icon={<Columns className="w-4 h-4" />}
                label="去除重复行"
                description="移除完全相同的连续行"
                checked={options.removeDuplicates}
                onCheckedChange={(v) => handleToggle("removeDuplicates", v)}
              />
            </div>

            {options.addSafetyHeight && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Label className="text-sm whitespace-nowrap">安全高度</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number"
                      value={options.safetyHeight}
                      onChange={(e) => handleNumberChange("safetyHeight", e.target.value)}
                      className="w-24 font-mono"
                      step="0.5"
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <Button 
              className="w-full" 
              size="lg" 
              onClick={onProcess}
              disabled={originalLines === 0 || isProcessing}
            >
              {isProcessing ? (
                <>处理中...</>
              ) : (
                <>
                  <FileCode className="w-4 h-4 mr-2" />
                  执行后处理
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="feedrate" className="space-y-4 pt-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-primary" />
                  <div>
                    <Label className="text-sm font-medium">进给速度调整</Label>
                    <p className="text-xs text-muted-foreground">按比例缩放所有 F 值</p>
                  </div>
                </div>
                <Switch
                  checked={options.adjustFeedRate}
                  onCheckedChange={(v) => handleToggle("adjustFeedRate", v)}
                />
              </div>

              {options.adjustFeedRate && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm whitespace-nowrap w-16">倍率</Label>
                    <Input
                      type="number"
                      value={options.feedRateMultiplier}
                      onChange={(e) => handleNumberChange("feedRateMultiplier", e.target.value)}
                      className="w-32 font-mono"
                      step="0.1"
                      min="0.1"
                      max="10"
                    />
                    <span className="text-sm text-muted-foreground">
                      ({Math.round(options.feedRateMultiplier * 100)}%)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {[0.5, 0.75, 1.0, 1.25, 1.5].map((mult) => (
                      <Button
                        key={mult}
                        variant={options.feedRateMultiplier === mult ? "default" : "outline"}
                        size="sm"
                        onClick={() => onOptionsChange({ ...options, feedRateMultiplier: mult })}
                      >
                        {mult * 100}%
                      </Button>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    示例: 当前倍率 1.25 表示 F1000 → F1250
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">批量替换规则</h3>
                <p className="text-xs text-muted-foreground">定义多组搜索/替换对</p>
              </div>
              <Button size="sm" variant="outline" onClick={addBatchReplace}>
                <Plus className="w-4 h-4 mr-1" />
                添加规则
              </Button>
            </div>

            {options.batchReplaces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Replace className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无替换规则</p>
                <p className="text-xs mt-1">点击上方按钮添加</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {options.batchReplaces.map((rule, index) => (
                    <Card key={rule.id} className="relative">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              规则 {index + 1}
                            </span>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(v) => updateBatchReplace(rule.id, { enabled: v })}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeBatchReplace(rule.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">搜索</Label>
                            <Input
                              value={rule.search}
                              onChange={(e) => updateBatchReplace(rule.id, { search: e.target.value })}
                              placeholder="查找内容"
                              className="h-8 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">替换为</Label>
                            <Input
                              value={rule.replace}
                              onChange={(e) => updateBatchReplace(rule.id, { replace: e.target.value })}
                              placeholder="替换内容"
                              className="h-8 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ToggleItem({
  icon,
  label,
  description,
  checked,
  onCheckedChange
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div 
      className={`
        flex items-start gap-3 p-3 rounded-lg border cursor-pointer
        transition-colors
        ${checked 
          ? "bg-primary/5 border-primary/20" 
          : "bg-muted/30 border-transparent hover:bg-muted/50"
        }
      `}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className={`shrink-0 mt-0.5 ${checked ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${checked ? "text-primary" : ""}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {description}
        </div>
      </div>
      <div className="shrink-0">
        <div className={`
          w-4 h-4 rounded border flex items-center justify-center
          ${checked 
            ? "bg-primary border-primary" 
            : "border-muted-foreground"
          }
        `}>
          {checked && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </div>
  );
}
