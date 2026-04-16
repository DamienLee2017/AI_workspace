import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, RotateCcw, ZoomIn, ZoomOut, Move, Layers, Info, Play, Pause, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { GcodeViewer } from "./components/GcodeViewer";
import { InfoPanel } from "./components/InfoPanel";
import { FileUploader } from "./components/FileUploader";
import { Toolbar } from "./components/Toolbar";
import type { GcodeData, ToolpathStats } from "./components/types";

export default function SimulatorPage() {
  const [gcodeData, setGcodeData] = useState<GcodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "xy" | "xz" | "yz">("3d");
  const [showPaths, setShowPaths] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [animatePlayback, setAnimatePlayback] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [lineWidth, setLineWidth] = useState(1.5);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  const handleFileUpload = useCallback((data: GcodeData) => {
    setGcodeData(data);
    setIsLoading(false);
    setPlaybackProgress(0);
    setAnimatePlayback(false);
  }, []);

  const handleLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleReset = useCallback(() => {
    setGcodeData(null);
    setPlaybackProgress(0);
    setAnimatePlayback(false);
  }, []);

  const stats: ToolpathStats | null = gcodeData?.stats || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex-none h-16 px-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">G-code 刀路模拟器</h1>
              <p className="text-xs text-slate-500">CNC Toolpath Visualization</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {gcodeData && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-slate-300 font-medium">{gcodeData.filename}</span>
            </div>
          )}
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={cn(
              "p-2.5 rounded-lg transition-all duration-200",
              showInfoPanel 
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"
            )}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showPaths={showPaths}
          onShowPathsChange={setShowPaths}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          onReset={handleReset}
          hasData={!!gcodeData}
          lineWidth={lineWidth}
          onLineWidthChange={setLineWidth}
        />

        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {!gcodeData ? (
              <motion.div
                key="uploader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <FileUploader
                  onFileUpload={handleFileUpload}
                  onLoading={handleLoading}
                />
              </motion.div>
            ) : (
              <motion.div
                key="viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <GcodeViewer
                  gcodeData={gcodeData}
                  viewMode={viewMode}
                  showPaths={showPaths}
                  showGrid={showGrid}
                  animatePlayback={animatePlayback}
                  playbackProgress={playbackProgress}
                  onPlaybackProgress={setPlaybackProgress}
                  lineWidth={lineWidth}
                />
                
                {/* Playback Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
                  <button
                    onClick={() => setPlaybackProgress(Math.max(0, playbackProgress - 10))}
                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setAnimatePlayback(!animatePlayback)}
                    className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 transition-all"
                  >
                    {animatePlayback ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setPlaybackProgress(Math.min(100, playbackProgress + 10))}
                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="w-32 h-1.5 rounded-full bg-slate-700 ml-2">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono w-10">{playbackProgress}%</span>
                </div>

                {/* Zoom Controls */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <button className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/90 transition-all shadow-lg">
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/90 transition-all shadow-lg">
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <div className="w-full h-px bg-slate-700/50" />
                  <button className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/90 transition-all shadow-lg">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                  <p className="text-slate-400 font-medium animate-pulse">正在解析 G-code 文件...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Info Panel */}
        <AnimatePresence>
          {showInfoPanel && gcodeData && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-80 flex-none border-l border-slate-800/50 bg-slate-950/50 backdrop-blur-xl overflow-y-auto"
            >
              <InfoPanel stats={stats} gcodeData={gcodeData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
