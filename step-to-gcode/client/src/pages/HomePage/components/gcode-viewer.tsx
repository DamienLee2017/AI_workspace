"use client";

import { useMemo, useState } from "react";
import { Download, Copy, Check, FileCode, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface GcodeViewerProps {
  gcode: string;
  filename?: string;
  onDownload?: () => void;
}

// 解析G代码统计信息
function parseGcodeStats(gcode: string) {
  const lines = gcode.split('\n');
  
  let totalLines = 0;
  let g0Count = 0;
  let g1Count = 0;
  let g2g3Count = 0;
  let m3Count = 0;
  let m5Count = 0;
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';')) continue;
    
    totalLines++;
    
    if (trimmed.includes('G0') || trimmed.includes('G00')) g0Count++;
    if (trimmed.includes('G1') || trimmed.includes('G01')) g1Count++;
    if (trimmed.includes('G2') || trimmed.includes('G02') || 
        trimmed.includes('G3') || trimmed.includes('G03')) g2g3Count++;
    if (trimmed.includes('M3') || trimmed.includes('M03')) m3Count++;
    if (trimmed.includes('M5') || trimmed.includes('M05')) m5Count++;
    
    const xMatch = trimmed.match(/X([-+]?[0-9]*\.?[0-9]+)/);
    const yMatch = trimmed.match(/Y([-+]?[0-9]*\.?[0-9]+)/);
    const zMatch = trimmed.match(/Z([-+]?[0-9]*\.?[0-9]+)/);
    
    if (xMatch) {
      const x = parseFloat(xMatch[1]);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (yMatch) {
      const y = parseFloat(yMatch[1]);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    if (zMatch) {
      const z = parseFloat(zMatch[1]);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }
  
  return {
    totalLines,
    g0Count,
    g1Count,
    g2g3Count,
    m3Count,
    m5Count,
    bounds: {
      x: minX === Infinity ? 0 : minX,
      y: minY === Infinity ? 0 : minY,
      z: minZ === Infinity ? 0 : minZ,
      width: maxX === -Infinity ? 0 : maxX - minX,
      height: maxY === -Infinity ? 0 : maxY - minY,
      depth: maxZ === -Infinity ? 0 : maxZ - minZ,
    }
  };
}

// 代码行高亮
function highlightGcode(code: string): string {
  return code
    .replace(/^;.*/gm, '<span class="text-slate-500">$&</span>')
    .replace(/\b(G[0-9]+|M[0-9]+|S[0-9]+|F[0-9]+|X[0-9.-]+|Y[0-9.-]+|Z[0-9.-]+|I[0-9.-]+|J[0-9.-]+|K[0-9.-]+|D[0-9]+|P[0-9.-]+)\b/gi, 
      '<span class="text-cyan-400">$&</span>')
    .replace(/([()])/g, '<span class="text-yellow-400">$1</span>');
}

export function GcodeViewer({ gcode, filename = "toolpath.nc", onDownload }: GcodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const stats = useMemo(() => parseGcodeStats(gcode), [gcode]);
  const highlightedCode = useMemo(() => highlightGcode(gcode), [gcode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(gcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([gcode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  if (!gcode) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700 border-dashed">
        <div className="text-center text-slate-500">
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">配置参数后生成 G-code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-medium text-white">{filename}</h3>
            <p className="text-xs text-slate-400">{stats.totalLines} 行代码</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              showPreview
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            )}
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "隐藏" : "显示"}预览
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                复制
              </>
            )}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            下载 .nc
          </button>
        </div>
      </div>

      {/* 预览区域 */}
      {showPreview && (
        <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-700">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">快进 (G0)</p>
              <p className="text-sm font-mono text-yellow-400">{stats.g0Count} 次</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">直线切削 (G1)</p>
              <p className="text-sm font-mono text-green-400">{stats.g1Count} 次</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">圆弧切削 (G2/G3)</p>
              <p className="text-sm font-mono text-blue-400">{stats.g2g3Count} 次</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">工件尺寸</p>
              <p className="text-sm font-mono text-slate-300">
                {stats.bounds.width.toFixed(1)} × {stats.bounds.height.toFixed(1)} × {stats.bounds.depth.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 代码区域 */}
      <div className="flex-1 overflow-auto">
        <pre
          className="p-4 text-xs font-mono leading-relaxed overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </div>
  );
}
