import { useState, useCallback, useMemo } from "react";
import { Eye, ZoomIn, ZoomOut, Move, RotateCcw, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PathData {
  type: "line" | "arc" | "point";
  x: number;
  y: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
}

interface GerberPreviewData {
  width: number;
  height: number;
  paths: PathData[];
  drillPoints?: { x: number; y: number; diameter: number }[];
}

export function PreviewSection() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [activeLayer, setActiveLayer] = useState<"copper" | "mask" | "drill">("copper");

  const sampleData: GerberPreviewData = useMemo(() => ({
    width: 100,
    height: 80,
    paths: [
      { type: "line", x: 10, y: 10, x1: 10, y1: 10, x2: 30, y2: 10 },
      { type: "line", x: 30, y: 10, x1: 30, y1: 10, x2: 30, y2: 30 },
      { type: "line", x: 30, y: 30, x1: 30, y1: 30, x2: 10, y2: 30 },
      { type: "line", x: 10, y: 30, x1: 10, y1: 30, x2: 10, y2: 10 },
      { type: "arc", x: 50, y: 20, cx: 50, cy: 20, r: 15 },
      { type: "line", x: 65, y: 20, x1: 65, y1: 20, x2: 85, y2: 35 },
      { type: "line", x: 85, y: 35, x1: 85, y1: 35, x2: 65, y2: 50 },
      { type: "arc", x: 75, y: 65, cx: 75, cy: 65, r: 10 },
    ],
    drillPoints: [
      { x: 20, y: 20, diameter: 2 },
      { x: 20, y: 60, diameter: 2 },
      { x: 80, y: 20, diameter: 3 },
      { x: 80, y: 60, diameter: 3 },
      { x: 50, y: 40, diameter: 4 },
    ],
  }), []);

  const stats = useMemo(() => ({
    lineCount: sampleData.paths.filter(p => p.type === "line").length,
    arcCount: sampleData.paths.filter(p => p.type === "arc").length,
    drillCount: sampleData.drillPoints?.length || 0,
    totalLength: 125.6,
  }), [sampleData]);

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z * 1.2, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z / 1.2, 0.1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const gridLines = useMemo(() => {
    const lines = [];
    const gridSize = 10;
    for (let i = 0; i <= sampleData.width; i += gridSize) {
      lines.push({ x1: i, y1: 0, x2: i, y2: sampleData.height, isVertical: true });
    }
    for (let i = 0; i <= sampleData.height; i += gridSize) {
      lines.push({ x1: 0, y1: i, x2: sampleData.width, y2: i, isVertical: false });
    }
    return lines;
  }, [sampleData.width, sampleData.height]);

  const renderPath = (path: PathData, index: number) => {
    const strokeWidth = 0.5 / zoom;
    
    if (path.type === "line" && path.x1 !== undefined && path.y1 !== undefined && path.x2 !== undefined && path.y2 !== undefined) {
      return (
        <line
          key={index}
          x1={path.x1}
          y1={path.y1}
          x2={path.x2}
          y2={path.y2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    }
    
    if (path.type === "arc" && path.cx !== undefined && path.cy !== undefined && path.r !== undefined) {
      return (
        <circle
          key={index}
          cx={path.cx}
          cy={path.cy}
          r={path.r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      );
    }
    
    return null;
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-primary" />
            预览
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeLayer} onValueChange={(v) => setActiveLayer(v as typeof activeLayer)}>
          <TabsList className="mb-4">
            <TabsTrigger value="copper">铜层</TabsTrigger>
            <TabsTrigger value="mask">阻焊层</TabsTrigger>
            <TabsTrigger value="drill">钻孔</TabsTrigger>
          </TabsList>

          <TabsContent value={activeLayer}>
            <div className="relative border border-border rounded-lg overflow-hidden bg-card overflow-x-auto">
              <div 
                className="relative select-none cursor-move"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: 'center center',
                }}
              >
                <svg
                  width={sampleData.width * 10}
                  height={sampleData.height * 10}
                  viewBox={`0 0 ${sampleData.width} ${sampleData.height}`}
                  className="text-primary"
                >
                  {showGrid && gridLines.map((line, i) => (
                    <line
                      key={i}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="currentColor"
                      strokeWidth={0.05}
                      opacity={0.2}
                    />
                  ))}

                  {activeLayer !== "drill" && sampleData.paths.map((path, i) => renderPath(path, i))}

                  {activeLayer === "drill" && sampleData.drillPoints?.map((drill, i) => (
                    <circle
                      key={i}
                      cx={drill.x}
                      cy={drill.y}
                      r={drill.diameter / 2}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={0.3}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline">直线 {stats.lineCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">圆弧 {stats.arcCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">钻孔 {stats.drillCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">路径长度 {stats.totalLength.toFixed(1)} mm</Badge>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary">尺寸 {sampleData.width} × {sampleData.height} mm</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
