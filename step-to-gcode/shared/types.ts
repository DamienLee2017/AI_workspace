// STEP转G代码应用 - 共享类型定义

/** 刀路点类型 */
export type ToolpathMoveType = "rapid" | "feed" | "plunge" | "retract";

/** 刀路点 */
export interface ToolpathPoint {
  x: number;
  y: number;
  z: number;
  type: ToolpathMoveType;
}

/** 模型包围盒 */
export interface ModelBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/** 模型信息 */
export interface ModelInfo {
  name: string;
  bounds: ModelBounds;
  /** 顶点数 */
  vertexCount?: number;
  /** 面数 */
  faceCount?: number;
}

/** 刀路统计 */
export interface ToolpathStats {
  totalPoints: number;
  totalLength: number;
  rapidLength: number;
  feedLength: number;
  estimatedTime: number;
}

/** 刀路数据 */
export interface Toolpath {
  points: ToolpathPoint[];
  stats: ToolpathStats;
}

/** G代码生成结果 */
export interface GcodeResult {
  gcode: string;
  toolpath: Toolpath;
  modelInfo: ModelInfo;
  generatedAt: string;
}

/** 加工参数 */
export interface MachiningParameters {
  /** 进给速度 mm/min */
  feedRate: number;
  /** 主轴转速 RPM */
  spindleSpeed: number;
  /** 切削深度 mm */
  cuttingDepth: number;
  /** 步距 mm */
  stepOver: number;
  /** 刀具直径 mm */
  toolDiameter: number;
  /** 安全高度 mm */
  safeHeight: number;
  /** 退刀高度 mm */
  retractHeight: number;
  /** 是否开启冷却液 */
  coolantEnabled: boolean;
  /** 是否精加工 */
  finishPass: boolean;
  /** 精加工余量 mm */
  finishPassAllowance: number;
}

/** 默认加工参数 */
export const DEFAULT_MACHINING_PARAMS: MachiningParameters = {
  feedRate: 800,
  spindleSpeed: 3000,
  cuttingDepth: 2.0,
  stepOver: 0.5,
  toolDiameter: 6.0,
  safeHeight: 10.0,
  retractHeight: 3.0,
  coolantEnabled: true,
  finishPass: true,
  finishPassAllowance: 0.2,
};
