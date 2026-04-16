import type { Point3D as ParserPoint3D, ToolpathSegment as ParserToolpathSegment } from "@/lib/gcode-parser";

// Re-export from gcode-parser
export type Point3D = ParserPoint3D;
export type ToolpathSegment = ParserToolpathSegment;

export interface GcodeData {
  segments: ParserToolpathSegment[];
  filename: string;
  stats: ToolpathStats;
  bounds: {
    min: ParserPoint3D;
    max: ParserPoint3D;
  };
}

export interface ToolpathStats {
  totalLines: number;
  totalSegments: number;
  rapidMoves: number;
  feedMoves: number;
  arcMoves: number;
  estimatedLength: number;
  minFeedRate: number;
  maxFeedRate: number;
}
