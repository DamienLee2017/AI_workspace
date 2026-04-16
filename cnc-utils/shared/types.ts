// CNC工具集共享类型定义

// ==================== CNC参数计算器 ====================

/** 丝杠导程计算参数 */
export interface LeadScrewParams {
  stepsPerRevolution: number;    // 步进电机每转步数 (steps/rev)
  microstepping: number;          // 细分倍数 (1, 2, 4, 8, 16, 32)
  leadscrewPitch: number;         // 丝杠导程 (mm/rev)
}

/** 丝杠导程计算结果 */
export interface LeadScrewResult {
  resolution: number;             // 分辨率 (mm/step)
  stepsPerMm: number;             // 每毫米步数
  maxSpeed: number;               // 最大速度 (mm/min)
}

/** 步进电机参数 */
export interface StepperParams {
  stepsPerRevolution: number;     // 电机固有步数 (200=1.8°, 400=0.9°)
  microstepping: number;          // 驱动器细分
  stepsPerMm: number;             // 当前每毫米步数
}

/** 步进电机计算结果 */
export interface StepperResult {
  resolution: number;             // 分辨率 (mm/step)
  pulseFrequency: number;         // 脉冲频率 (Hz) at max speed
}

/** 速度加速度参数 */
export interface MotionParams {
  maxSpeed: number;               // 最大速度 (mm/min)
  acceleration: number;           // 加速度 (mm/s²)
  maxFrequency: number;          // 驱动器最大频率 (Hz)
}

/** 速度加速度计算结果 */
export interface MotionResult {
  timeToSpeed: number;           // 加速到最大速度时间 (s)
  distanceToSpeed: number;       // 加速距离 (mm)
  pulseFrequency: number;        // 脉冲频率 (Hz)
}

/** 脉冲频率参数 */
export interface PulseParams {
  stepsPerMm: number;             // 每毫米步数
  feedRate: number;              // 进给速度 (mm/min)
}

/** 脉冲频率结果 */
export interface PulseResult {
  frequency: number;             // 脉冲频率 (Hz)
  period: number;                // 脉冲周期 (μs)
}

/** 切削参数 */
export interface CuttingParams {
  spindleSpeed: number;          // 主轴转速 (RPM)
  feedPerTooth: number;          // 每齿进给量 (mm/tooth)
  numberOfTeeth: number;         // 刀具齿数
  cuttingDepth: number;          // 切削深度 (mm)
  cuttingWidth: number;          // 切削宽度 (mm)
}

/** 切削计算结果 */
export interface CuttingResult {
  feedRate: number;              // 进给速度 (mm/min)
  materialRemovalRate: number;   // 材料去除率 (mm³/min)
  cuttingTime: number;            // 切削时间 (min)
}

// ==================== Gcode编辑器 ====================

/** Gcode文件信息 */
export interface GcodeFile {
  id: string;
  name: string;
  content: string;
  originalSize: number;
  processedSize: number;
  lineCount: number;
  processedLineCount: number;
  createdAt: string;
}

/** Gcode后处理选项 */
export interface GcodeProcessOptions {
  removeComments: boolean;       // 去除注释
  removeEmptyLines: boolean;    // 去除空行
  compactCode: boolean;          // 压缩代码
  adjustFeedRate: boolean;       // 调整进给速度
  feedRateMultiplier: number;   // 进给速度倍率
  addHomeCommand: boolean;      // 添加回零指令
  homePosition: 'origin' | 'park' | 'custom'; // 回零位置
  customHomeX?: number;
  customHomeY?: number;
  customHomeZ?: number;
  batchReplace: BatchReplace[];  // 批量替换规则
}

/** 批量替换规则 */
export interface BatchReplace {
  id: string;
  search: string;
  replace: string;
  isRegex: boolean;
  caseSensitive: boolean;
}

/** Gcode处理结果 */
export interface GcodeProcessResult {
  original: string;
  processed: string;
  originalLines: number;
  processedLines: number;
  originalSize: number;
  processedSize: number;
  removedComments: number;
  removedEmptyLines: number;
  replacedCount: number;
}

// ==================== Gerber转Gcode ====================

/** Gerber文件信息 */
export interface GerberFile {
  id: string;
  name: string;
  content: string;
  apertureCount: number;
  pathCount: number;
}

/** Gerber转Gcode参数 */
export interface GerberToGcodeParams {
  // 刀具参数
  toolDiameter: number;          // 刀具直径 (mm)
  toolAperture: number;         // 导孔直径 (mm)
  
  // 加工参数
  feedRate: number;             // 切削进给速度 (mm/min)
  plungeRate: number;           // 下刀速度 (mm/min)
  retractRate: number;          // 退刀速度 (mm/min)
  zSafe: number;                 // 安全高度 (mm)
  zPlunge: number;               // 下刀深度 (mm)
  zRetract: number;             // 退刀高度 (mm)
  
  // PCB参数
  isolationWidth: number;       // 隔离宽度 (mm)
  boardThickness: number;        // PCB板厚 (mm)
  
  // 选项
  useAperture: boolean;          // 使用导孔
  mergeArcs: boolean;            // 合并圆弧
  reversePath: boolean;          // 反转路径
  convertPadsToRects: boolean;   // 将焊盘转换为矩形
}

/** 转换结果 */
export interface GerberToGcodeResult {
  gcode: string;
  lineCount: number;
  estimatedTime: number;         // 预估时间 (秒)
  toolPathLength: number;        // 刀具路径长度 (mm)
  layers: GerberLayer[];
}

/** Gerber图层 */
export interface GerberLayer {
  name: string;
  type: 'copper' | 'soldermask' | 'silkscreen' | 'drill';
  pathCount: number;
  apertureCount: number;
}

// ==================== 通用类型 ====================

/** 工具类型枚举 */
export type ToolType = 'calculator' | 'gcode-editor' | 'gerber-to-gcode';

/** 计算器类型 */
export type CalculatorType = 
  | 'leadscrew'      // 丝杠导程
  | 'stepper'        // 步进电机
  | 'motion'         // 速度加速度
  | 'pulse'          // 脉冲频率
  | 'cutting';       // 切削参数

/** 单位制 */
export type UnitSystem = 'metric' | 'imperial';

/** 操作结果 */
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
