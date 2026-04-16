import { axiosForBackend } from "@lark-apaas/client-toolkit-lite";

export interface ModelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface MachiningParams {
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

export interface GcodeStats {
  totalLines: number;
  estimatedTime: number;
  toolpathLength: number;
}

export interface GenerateGcodeResponse {
  success: boolean;
  gcode: string;
  stats: GcodeStats;
  generatedAt: string;
  error?: string;
}

export async function generateGcode(
  modelBounds: ModelBounds,
  params: MachiningParams
): Promise<GenerateGcodeResponse> {
  const response = await axiosForBackend({
    url: "/api/gcode/generate",
    method: "POST",
    data: {
      modelBounds,
      params,
    },
  });
  return response.data;
}

export function downloadGcode(gcode: string, filename: string = "toolpath"): void {
  const blob = new Blob([gcode], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.nc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
