// CNC工具集 API 接口契约定义
// zod schema 做校验，z.infer 推导类型，前后端共享

import { z } from "zod";

// ============ CNC参数计算器 ============

// 丝杠导程计算
export const leadScrewSchema = z.object({
  pitch: z.number().positive("螺距必须为正数"),
  starts: z.number().int().min(1).default(1),
});
export type LeadScrewRequest = z.infer<typeof leadScrewSchema>;
export type LeadScrewResponse = {
  lead: number;           // 导程 (mm)
  threadsPerMm: number;   // 每mm螺纹数
};

// 步进电机细分计算
export const microstepSchema = z.object({
  stepsPerRev: z.number().int().min(200).max(51200),  // 电机每转步数 (200/400/800)
  microsteps: z.number().int().min(1).max(256),       // 驱动器细分
  fullStepsPerRev: z.number().int().default(200),     // 电机整步数
});
export type MicrostepRequest = z.infer<typeof microstepSchema>;
export type MicrostepResponse = {
  stepsPerRev: number;        // 每转总步数
  degreesPerStep: number;      // 每步角度 (°)
  microstepAngle: number;      // 细分后每步角度 (°)
};

// 速度与加速度计算
export const speedAccelerationSchema = z.object({
  lead: z.number().positive(),           // 导程 (mm)
  maxRpm: z.number().positive(),          // 最大转速 (rpm)
  acceleration: z.number().positive(),   // 加速度 (mm/s²)
  pulsesPerRev: z.number().positive(),   // 每转脉冲数
});
export type SpeedAccelerationRequest = z.infer<typeof speedAccelerationSchema>;
export type SpeedAccelerationResponse = {
  maxLinearSpeed: number;        // 最大线速度 (mm/min)
  maxPulseFreq: number;          // 最大脉冲频率 (Hz)
  timeToReachSpeed: number;      // 加速到最高速时间 (s)
  accelerationTime: number;      // 加速时间 (s)
  decelerationTime: number;      // 减速时间 (s)
};

// 脉冲频率计算
export const pulseFreqSchema = z.object({
  feedRate: z.number().positive(),      // 进给速度 (mm/min)
  pitch: z.number().positive(),         // 螺距/导程 (mm)
  pulsesPerRev: z.number().positive(), // 每转脉冲数
});
export type PulseFreqRequest = z.infer<typeof pulseFreqSchema>;
export type PulseFreqResponse = {
  pulseFreq: number;        // 脉冲频率 (Hz)
  rpm: number;              // 转速 (rpm)
};

// 切削参数计算
export const cuttingParamsSchema = z.object({
  spindleSpeed: z.number().positive(),     // 主轴转速 (rpm)
  feedPerTooth: z.number().positive(),      // 每齿进给 (mm)
  numTeeth: z.number().int().positive(),    // 刀具齿数
  diameter: z.number().positive(),          // 刀具直径 (mm)
  cuttingDepth: z.number().positive(),      // 切削深度 (mm)
  widthOfCut: z.number().positive(),        // 切削宽度 (mm)
});
export type CuttingParamsRequest = z.infer<typeof cuttingParamsSchema>;
export type CuttingParamsResponse = {
  feedRate: number;           // 进给速度 (mm/min)
  materialRemovalRate: number; // 材料去除率 (cm³/min)
  cuttingForce: number;       // 切削力 (N)
  powerRequired: number;       // 所需功率 (kW)
  chipload: number;            // 每转进给 (mm/rev)
};

// ============ Gcode编辑器 ============

// Gcode后处理请求
export const gcodeProcessSchema = z.object({
  code: z.string().min(1, "Gcode内容不能为空"),
  operations: z.array(z.object({
    type: z.enum([
      "remove-comments",      // 去除注释
      "compress",             // 压缩代码(合并连续空移)
      "adjust-feedrate",      // 调整进给速度
      "scale-coords",         // 坐标缩放
      "add-home",             // 添加回零指令
      "add-safety",           // 添加安全高度
      "batch-replace",        // 批量替换
      "remove-duplicates",    // 去除重复行
    ]),
    params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })).min(1, "至少选择一个操作"),
});
export type GcodeProcessRequest = z.infer<typeof gcodeProcessSchema>;
export type GcodeProcessResponse = {
  originalLines: number;       // 原始行数
  processedLines: number;      // 处理后行数
  changes: Record<string, number>;  // 各操作影响的行数
  code: string;                // 处理后的Gcode
};

// ============ Gerber转Gcode ============

// Gerber文件解析
export const gerberToGcodeSchema = z.object({
  files: z.object({
    copper: z.string().describe("铜层Gerber文件内容"),
    mask: z.string().optional().describe("阻焊层Gerber文件内容"),
    drill: z.string().optional().describe("钻孔文件内容"),
  }),
  options: z.object({
    feedRate: z.number().positive().default(100),        // 移动速度 (mm/min)
    plungeRate: z.number().positive().default(50),        // 下刀速度 (mm/min)
    cuttingDepth: z.number().positive().default(0.1),     // 切削深度 (mm)
    toolDiameter: z.number().positive().default(0.2),     // 刀具直径 (mm)
    safetyHeight: z.number().positive().default(2),       // 安全高度 (mm)
    rapidHeight: z.number().positive().default(1),        // 快进高度 (mm)
    isolationWidth: z.number().positive().default(0.1),   // 隔离宽度 (mm)
    homePosition: z.object({
      x: z.number().default(0),
      y: z.number().default(0),
    }).optional(),
  }),
});
export type GerberToGcodeRequest = z.infer<typeof gerberToGcodeSchema>;
export type GerberToGcodeResponse = {
  gcode: string;               // 生成的Gcode
  stats: {
    toolpathLength: number;     // 刀具路径长度 (mm)
    estimatedTime: number;      // 预估时间 (秒)
    cutCount: number;           // 切削段数
    arcCount: number;           // 圆弧数
    lineCount: number;          // 直线数
  };
};
