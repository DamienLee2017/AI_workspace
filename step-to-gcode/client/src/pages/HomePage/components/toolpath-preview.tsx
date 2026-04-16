"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, Grid3X3, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

interface ToolpathPoint {
  x: number;
  y: number;
  z: number;
  type?: "rapid" | "feed" | "plunge" | "retract";
}

interface ToolpathPreviewProps {
  toolpath?: ToolpathPoint[];
  modelBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

const colorMap: Record<string, string> = {
  rapid: "#fbbf24",   // 黄色 - 快进
  feed: "#22c55e",    // 绿色 - 切削
  plunge: "#ef4444",  // 红色 - 下刀
  retract: "#38bdf8", // 蓝色 - 退刀
  default: "#22c55e",
};

type ViewMode = "xy" | "xz" | "yz" | "3d";

function ToolpathCanvas({ 
  toolpath, 
  modelBounds, 
  viewMode 
}: { 
  toolpath: ToolpathPoint[];
  modelBounds?: ToolpathPreviewProps["modelBounds"];
  viewMode: ViewMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 获取投影坐标
  const getProjection = useCallback((point: ToolpathPoint) => {
    switch (viewMode) {
      case "xy":
        return { x: point.x, y: point.y };
      case "xz":
        return { x: point.x, y: point.z };
      case "yz":
        return { x: point.y, y: point.z };
      default:
        return { x: point.x, y: point.y };
    }
  }, [viewMode]);

  // 计算包围盒和缩放
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !modelBounds) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置canvas尺寸
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    // 清空画布
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // 计算bounds
    let minX, maxX, minY, maxY;
    switch (viewMode) {
      case "xy":
        minX = modelBounds.minX;
        maxX = modelBounds.maxX;
        minY = modelBounds.minY;
        maxY = modelBounds.maxY;
        break;
      case "xz":
        minX = modelBounds.minX;
        maxX = modelBounds.maxX;
        minY = modelBounds.minZ;
        maxY = modelBounds.maxZ;
        break;
      case "yz":
        minX = modelBounds.minY;
        maxX = modelBounds.maxY;
        minY = modelBounds.minZ;
        maxY = modelBounds.maxZ;
        break;
      default:
        minX = modelBounds.minX;
        maxX = modelBounds.maxX;
        minY = modelBounds.minY;
        maxY = modelBounds.maxY;
    }

    const modelWidth = maxX - minX;
    const modelHeight = maxY - minY;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    const scaleX = modelWidth > 0 ? availableWidth / modelWidth : 1;
    const scaleY = modelHeight > 0 ? availableHeight / modelHeight : 1;
    const newScale = Math.min(scaleX, scaleY) * scale * 0.9;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const transformX = (x: number) => (x - centerX) * newScale + width / 2 + offset.x;
    const transformY = (y: number) => -(y - centerY) * newScale + height / 2 + offset.y;

    // 绘制网格
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    const gridSize = Math.pow(10, Math.floor(Math.log10(Math.max(modelWidth, modelHeight)))) / 2;
    for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(transformX(x), 0);
      ctx.lineTo(transformX(x), height);
      ctx.stroke();
    }
    for (let y = Math.floor(minY / gridSize) * gridSize; y <= maxY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, transformY(y));
      ctx.lineTo(width, transformY(y));
      ctx.stroke();
    }

    // 绘制工件边界
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      transformX(minX),
      transformY(maxY),
      (maxX - minX) * newScale,
      (maxY - minY) * newScale
    );

    // 绘制坐标轴
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(transformX(minX) - 20, transformY(0));
    ctx.lineTo(transformX(maxX) + 20, transformY(0));
    ctx.moveTo(transformX(0), transformY(minY) - 20);
    ctx.lineTo(transformX(0), transformY(maxY) + 20);
    ctx.stroke();

    // 绘制刀路
    if (toolpath && toolpath.length > 1) {
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < toolpath.length - 1; i++) {
        const p1 = getProjection(toolpath[i]);
        const p2 = getProjection(toolpath[i + 1]);

        ctx.strokeStyle = colorMap[toolpath[i].type || "default"];
        ctx.beginPath();
        ctx.moveTo(transformX(p1.x), transformY(p1.y));
        ctx.lineTo(transformX(p2.x), transformY(p2.y));
        ctx.stroke();
      }

      // 绘制起点和终点
      const start = getProjection(toolpath[0]);
      const end = getProjection(toolpath[toolpath.length - 1]);

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(transformX(start.x), transformY(start.y), 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(transformX(end.x), transformY(end.y), 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制标签
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px monospace";
    ctx.fillText(`视图: ${viewMode.toUpperCase()}`, 10, 20);
    if (modelBounds) {
      const axisLabels: Record<ViewMode, string[]> = {
        xy: ["X", "Y"],
        xz: ["X", "Z"],
        yz: ["Y", "Z"],
        "3d": ["X", "Y"],
      };
      ctx.fillText(`轴: ${axisLabels[viewMode].join(" × ")}`, 10, 38);
    }
  }, [toolpath, modelBounds, viewMode, scale, offset, getProjection]);

  // 鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.1, Math.min(10, prev * delta)));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const event = new Event("resize");
        window.dispatchEvent(event);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const observer = new ResizeObserver(() => {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
    </div>
  );
}

function Legend() {
  const items = [
    { color: "bg-yellow-400", label: "快进 (Rapid)", hex: "#fbbf24" },
    { color: "bg-green-500", label: "切削 (Feed)", hex: "#22c55e" },
    { color: "bg-red-500", label: "下刀 (Plunge)", hex: "#ef4444" },
    { color: "bg-sky-400", label: "退刀 (Retract)", hex: "#38bdf8" },
  ];

  return (
    <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-slate-400 mb-2">刀路类型</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: item.hex }}
            />
            <span className="text-xs text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsPanel({ toolpath }: { toolpath: ToolpathPoint[] }) {
  if (!toolpath || toolpath.length === 0) return null;

  let totalDistance = 0;
  let rapidDistance = 0;
  let feedDistance = 0;

  for (let i = 0; i < toolpath.length - 1; i++) {
    const p1 = toolpath[i];
    const p2 = toolpath[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    totalDistance += dist;

    if (p1.type === "rapid") rapidDistance += dist;
    else feedDistance += dist;
  }

  return (
    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-slate-400 mb-2">刀路统计</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-slate-400">点数</span>
          <span className="text-white font-mono">{toolpath.length}</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-slate-400">总长度</span>
          <span className="text-white font-mono">{totalDistance.toFixed(1)} mm</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-slate-400">切削长度</span>
          <span className="text-green-400 font-mono">{feedDistance.toFixed(1)} mm</span>
        </div>
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-slate-400">快进长度</span>
          <span className="text-yellow-400 font-mono">{rapidDistance.toFixed(1)} mm</span>
        </div>
      </div>
    </div>
  );
}

export function ToolpathPreview({
  toolpath = [],
  modelBounds,
}: ToolpathPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("xy");

  const resetView = () => {
    // Force re-render by toggling view mode
    setViewMode((prev) => {
      const modes: ViewMode[] = ["xy", "xz", "yz", "3d"];
      const idx = modes.indexOf(prev);
      return modes[(idx + 1) % modes.length];
    });
    setTimeout(() => {
      setViewMode("xy");
    }, 0);
  };

  const zoomIn = () => {
    // Trigger zoom through canvas wheel event simulation
  };

  if (!modelBounds) {
    return (
      <div className="w-full h-full min-h-[300px] bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">上传 STEP 文件后显示刀路预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] relative">
      {/* 视图切换按钮 */}
      <div className="absolute top-4 right-4 flex gap-1 z-10">
        {(["xy", "xz", "yz"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === mode
                ? "bg-cyan-500 text-white"
                : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 控制按钮 */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={resetView}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
          title="重置视角"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Canvas */}
      <div className="w-full h-full rounded-xl overflow-hidden border border-slate-700">
        <ToolpathCanvas 
          toolpath={toolpath} 
          modelBounds={modelBounds}
          viewMode={viewMode}
        />
      </div>

      {/* Legend */}
      <Legend />

      {/* Stats */}
      <StatsPanel toolpath={toolpath} />
    </div>
  );
}
