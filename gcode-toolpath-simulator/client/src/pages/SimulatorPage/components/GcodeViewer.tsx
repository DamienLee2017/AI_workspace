import { Viewer3D, type ToolpathData } from "./Viewer3D";
import type { GcodeData, ToolpathStats } from "./types";

interface GcodeViewerProps {
  gcodeData: GcodeData;
  viewMode: "3d" | "xy" | "xz" | "yz";
  showPaths: boolean;
  showGrid: boolean;
  animatePlayback: boolean;
  playbackProgress: number;
  onPlaybackProgress: (progress: number) => void;
  lineWidth: number;
}

export function GcodeViewer({
  gcodeData,
  viewMode,
  showPaths,
  showGrid,
  animatePlayback,
  playbackProgress,
  onPlaybackProgress,
  lineWidth,
}: GcodeViewerProps) {
  const toolpathData: ToolpathData = {
    movements: gcodeData.segments.map((seg) => ({
      x: seg.end.x,
      y: seg.end.y,
      z: seg.end.z,
      type: seg.type,
      start: seg.arc ? undefined : seg.start,
      end: seg.arc ? undefined : seg.end,
      center: seg.arc?.center,
    })),
    bounds: {
      minX: gcodeData.bounds.min.x,
      maxX: gcodeData.bounds.max.x,
      minY: gcodeData.bounds.min.y,
      maxY: gcodeData.bounds.max.y,
      minZ: gcodeData.bounds.min.z,
      maxZ: gcodeData.bounds.max.z,
    },
    stats: {
      totalLines: gcodeData.stats.totalLines,
      totalRapid: gcodeData.stats.rapidMoves,
      totalFeed: gcodeData.stats.feedMoves,
      totalArc: gcodeData.stats.arcMoves,
      totalDistance: gcodeData.stats.estimatedLength,
    },
  };

  return (
    <Viewer3D
      toolpathData={toolpathData}
      viewMode={viewMode}
      showPaths={showPaths}
      showGrid={showGrid}
      animatePlayback={animatePlayback}
      playbackProgress={playbackProgress}
      onPlaybackProgress={onPlaybackProgress}
      lineWidth={lineWidth}
    />
  );
}
