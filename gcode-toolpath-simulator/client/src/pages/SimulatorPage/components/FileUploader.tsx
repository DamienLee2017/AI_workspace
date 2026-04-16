import { useCallback, useState } from "react";
import { Upload, FileCode, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseGcode } from "@/lib/gcode-parser";
import type { GcodeData } from "./types";

interface FileUploaderProps {
  onFileUpload: (data: GcodeData) => void;
  onLoading: (loading: boolean) => void;
  className?: string;
}

export function FileUploader({
  onFileUpload,
  onLoading,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      onLoading(true);
      setSelectedFile(file);
      
      try {
        const content = await file.text();
        const result = parseGcode(content, file.name);
        
        const gcodeData: GcodeData = {
          segments: result.segments,
          filename: file.name,
          stats: {
            totalLines: result.stats.totalLines,
            totalSegments: result.stats.totalSegments,
            rapidMoves: result.stats.rapidMoves,
            feedMoves: result.stats.feedMoves,
            arcMoves: result.stats.arcMoves,
            estimatedLength: result.stats.estimatedLength,
            minFeedRate: result.stats.minFeedRate,
            maxFeedRate: result.stats.maxFeedRate,
          },
          bounds: result.bounds,
        };
        
        onFileUpload(gcodeData);
      } catch (error) {
        console.error("Failed to parse G-code:", error);
      } finally {
        setIsProcessing(false);
        onLoading(false);
      }
    },
    [onFileUpload, onLoading]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.name.match(/\.(gcode|nc|ngc|tap)$/i)) {
          processFile(file);
        }
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  }, []);

  return (
    <div
      className={cn(
        "relative w-full max-w-md rounded-2xl border-2 border-dashed transition-all duration-300",
        isDragging
          ? "border-cyan-500 bg-cyan-500/5 scale-[1.02]"
          : "border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/30",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".gcode,.nc,.ngc,.tap"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      <div className="flex flex-col items-center justify-center p-12 text-center">
        {isProcessing ? (
          <>
            <Loader2 className="w-14 h-14 mb-4 text-cyan-500 animate-spin" />
            <p className="text-sm text-slate-400">正在解析 G-code 文件...</p>
          </>
        ) : selectedFile ? (
          <>
            <FileCode className="w-14 h-14 mb-4 text-cyan-500" />
            <p className="text-sm font-medium text-white truncate max-w-[240px]">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={handleClear}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-3 h-3" />
              移除
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
              <Upload className="w-10 h-10 text-cyan-500" />
            </div>
            <p className="text-base font-medium text-white mb-2">
              拖拽 G-code 文件到这里
            </p>
            <p className="text-xs text-slate-500">
              或点击选择文件 · 支持 .gcode .nc .ngc .tap 格式
            </p>
          </>
        )}
      </div>
    </div>
  );
}
