/**
 * G-code Parser - 解析 CNC G-code 文件并提取刀路轨迹数据
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ToolpathSegment {
  type: 'rapid' | 'feed' | 'arc';
  start: Point3D;
  end: Point3D;
  feedRate?: number;
  arc?: {
    center: Point3D;
    clockwise: boolean;
    plane: 'XY' | 'XZ' | 'YZ';
  };
  lineNumber?: number;
}

export interface GcodeParseResult {
  segments: ToolpathSegment[];
  bounds: {
    min: Point3D;
    max: Point3D;
  };
  stats: {
    totalLines: number;
    totalSegments: number;
    rapidMoves: number;
    feedMoves: number;
    arcMoves: number;
    estimatedLength: number;
    minFeedRate: number;
    maxFeedRate: number;
  };
  metadata: {
    filename?: string;
    parsedAt: string;
    hasArcs: boolean;
  };
}

interface ParserState {
  currentPos: Point3D;
  absoluteMode: boolean;
  units: 'mm' | 'inch';
  lastFeedRate: number;
}

/**
 * 解析一行 G-code 指令
 */
function parseLine(line: string, state: ParserState): {
  command?: string;
  params?: Record<string, number>;
  raw?: string;
} {
  const trimmed = line.trim();
  
  // 跳过空行和注释
  if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('(')) {
    return { raw: trimmed };
  }
  
  // 移除注释
  const cleanLine = trimmed.split(';')[0].split('(')[0].trim();
  if (!cleanLine) {
    return { raw: trimmed };
  }
  
  // 解析 G-code 指令
  const tokens = cleanLine.split(/\s+/).filter(t => t.length > 0);
  const command = tokens[0].toUpperCase();
  const params: Record<string, number> = {};
  
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.length > 1) {
      const key = token[0].toUpperCase();
      const value = parseFloat(token.substring(1));
      if (!isNaN(value)) {
        params[key] = value;
      }
    }
  }
  
  return { command, params };
}

/**
 * 解析 G-code 文件
 */
export function parseGcode(content: string, filename?: string): GcodeParseResult {
  const lines = content.split('\n');
  const segments: ToolpathSegment[] = [];
  
  const state: ParserState = {
    currentPos: { x: 0, y: 0, z: 0 },
    absoluteMode: true,
    units: 'mm',
    lastFeedRate: 0,
  };
  
  let rapidMoves = 0;
  let feedMoves = 0;
  let arcMoves = 0;
  let hasArcs = false;
  
  const bounds = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
  
  function updateBounds(pos: Point3D) {
    bounds.min.x = Math.min(bounds.min.x, pos.x);
    bounds.min.y = Math.min(bounds.min.y, pos.y);
    bounds.min.z = Math.min(bounds.min.z, pos.z);
    bounds.max.x = Math.max(bounds.max.x, pos.x);
    bounds.max.y = Math.max(bounds.max.y, pos.y);
    bounds.max.z = Math.max(bounds.max.z, pos.z);
  }
  
  function getPosition(params: Record<string, number>): Point3D {
    if (state.absoluteMode) {
      return {
        x: params.X ?? state.currentPos.x,
        y: params.Y ?? state.currentPos.y,
        z: params.Z ?? state.currentPos.z,
      };
    } else {
      return {
        x: state.currentPos.x + (params.X ?? 0),
        y: state.currentPos.y + (params.Y ?? 0),
        z: state.currentPos.z + (params.Z ?? 0),
      };
    }
  }
  
  function addSegment(segment: ToolpathSegment) {
    segments.push(segment);
    updateBounds(segment.start);
    updateBounds(segment.end);
  }
  
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const parsed = parseLine(lines[i], state);
    
    if (parsed.raw !== undefined) continue;
    if (!parsed.command) continue;
    
    const { command, params = {} } = parsed;
    
    // 处理 G90 (绝对坐标) 和 G91 (相对坐标)
    if (command === 'G90') {
      state.absoluteMode = true;
      continue;
    }
    if (command === 'G91') {
      state.absoluteMode = false;
      continue;
    }
    
    // 处理 G20 (英寸) 和 G21 (毫米)
    if (command === 'G20') {
      state.units = 'inch';
      continue;
    }
    if (command === 'G21') {
      state.units = 'mm';
      continue;
    }
    
    // 处理 G00 (快速定位)
    if (command === 'G00' || command === 'G0') {
      const newPos = getPosition(params);
      addSegment({
        type: 'rapid',
        start: { ...state.currentPos },
        end: newPos,
        lineNumber,
      });
      state.currentPos = newPos;
      rapidMoves++;
      continue;
    }
    
    // 处理 G01 (直线进给)
    if (command === 'G01' || command === 'G1') {
      const newPos = getPosition(params);
      if (params.F !== undefined) {
        state.lastFeedRate = params.F;
      }
      addSegment({
        type: 'feed',
        start: { ...state.currentPos },
        end: newPos,
        feedRate: state.lastFeedRate,
        lineNumber,
      });
      state.currentPos = newPos;
      feedMoves++;
      continue;
    }
    
    // 处理 G02/G03 (圆弧)
    if (command === 'G02' || command === 'G03' || command === 'G2' || command === 'G3') {
      hasArcs = true;
      const clockwise = command === 'G02' || command === 'G2';
      const newPos = getPosition(params);
      
      // 计算圆弧中心点
      let center: Point3D;
      if (params.I !== undefined || params.J !== undefined || params.K !== undefined) {
        center = {
          x: state.currentPos.x + (params.I ?? 0),
          y: state.currentPos.y + (params.J ?? 0),
          z: state.currentPos.z + (params.K ?? 0),
        };
      } else {
        // R 模式：计算圆弧中心
        const r = params.R ?? 0;
        const midX = (state.currentPos.x + newPos.x) / 2;
        const midY = (state.currentPos.y + newPos.y) / 2;
        const dx = newPos.x - state.currentPos.x;
        const dy = newPos.y - state.currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0 && r > 0) {
          const offset = Math.sqrt(r * r - (dist / 2) * (dist / 2));
          center = {
            x: midX - (dy / dist) * offset * (clockwise ? 1 : -1),
            y: midY + (dx / dist) * offset * (clockwise ? 1 : -1),
            z: state.currentPos.z,
          };
        } else {
          center = { ...state.currentPos };
        }
      }
      
      if (params.F !== undefined) {
        state.lastFeedRate = params.F;
      }
      
      // 确定圆弧平面
      const plane: 'XY' | 'XZ' | 'YZ' = params.X !== undefined && params.Y !== undefined ? 'XY' :
                                        params.X !== undefined && params.Z !== undefined ? 'XZ' : 'XY';
      
      addSegment({
        type: 'arc',
        start: { ...state.currentPos },
        end: newPos,
        feedRate: state.lastFeedRate,
        arc: {
          center,
          clockwise,
          plane,
        },
        lineNumber,
      });
      state.currentPos = newPos;
      arcMoves++;
      continue;
    }
    
    // 处理 M02/M30 (程序结束)
    if (command === 'M02' || command === 'M30') {
      continue;
    }
  }
  
  // 如果没有有效的边界数据，设置默认值
  if (bounds.min.x === Infinity) {
    bounds.min = { x: 0, y: 0, z: 0 };
    bounds.max = { x: 100, y: 100, z: 100 };
  }
  
  // 计算总长度
  let totalLength = 0;
  for (const seg of segments) {
    if (seg.type === 'rapid' || seg.type === 'feed') {
      const dx = seg.end.x - seg.start.x;
      const dy = seg.end.y - seg.start.y;
      const dz = seg.end.z - seg.start.z;
      totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
    } else if (seg.type === 'arc' && seg.arc) {
      // 简化：使用弦长估算圆弧长度
      const dx = seg.end.x - seg.start.x;
      const dy = seg.end.y - seg.start.y;
      const dz = seg.end.z - seg.start.z;
      totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz) * 1.5;
    }
  }
  
  // 收集进给速率
  const feedRates = segments
    .filter(s => s.feedRate && s.feedRate > 0)
    .map(s => s.feedRate!);
  
  return {
    segments,
    bounds,
    stats: {
      totalLines: lines.length,
      totalSegments: segments.length,
      rapidMoves,
      feedMoves,
      arcMoves,
      estimatedLength: Math.round(totalLength * 100) / 100,
      minFeedRate: feedRates.length > 0 ? Math.min(...feedRates) : 0,
      maxFeedRate: feedRates.length > 0 ? Math.max(...feedRates) : 0,
    },
    metadata: {
      filename,
      parsedAt: new Date().toISOString(),
      hasArcs,
    },
  };
}

/**
 * 生成示例 G-code 数据（用于演示）
 */
export function generateSampleGcode(): string {
  return `G21 ; 设置为毫米单位
G90 ; 绝对坐标
G00 Z5.0 ; 快速移动到安全高度
G00 X0 Y0 ; 移动到原点
G01 Z-1.0 F100 ; 下降到切削深度
G01 X10 Y0 F200 ; 直线切削
G01 X10 Y10 ; 直线切削
G01 X0 Y10 ; 直线切削
G01 X0 Y0 ; 回到起点
G00 Z5.0 ; 抬刀到安全高度
G00 X20 Y0 ; 移动到下一个位置
G01 Z-2.0 F100 ; 下降到切削深度
G02 X30 Y10 I5 J0 F200 ; 顺时针圆弧
G01 X30 Y20 ; 直线切削
G03 X40 Y10 I0 J-5 F200 ; 逆时针圆弧
G01 X40 Y0 ; 直线切削
G00 Z50 ; 抬刀到安全高度
M30 ; 程序结束`;
}
