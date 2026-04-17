import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = Router();

// 配置 multer 处理文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // 只接受 STEP 文件
    const allowedExtensions = ['.step', '.stp', '.STEP', '.STP'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 STEP/STP 格式文件'));
    }
  }
});

// ============ STEP 文件解析 ============

router.post("/parse", upload.single('stepFile'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ 
        success: false, 
        error: "未上传文件" 
      });
      return;
    }

    const stepFilePath = req.file.path;
    console.log(`Processing STEP file: ${stepFilePath}`);

    // 调用 Python 处理器
    const pythonScript = path.join(__dirname, '../python/step_processor.py');
    
    if (!fs.existsSync(pythonScript)) {
      // 如果 Python 脚本不存在，返回模拟数据（向后兼容）
      console.warn('Python processor not found, using simulation');
      const simulatedData = generateSimulatedData(req.file.originalname);
      res.json({
        success: true,
        data: simulatedData,
        simulated: true,
        note: "正在开发真实 STEP 解析功能，目前为模拟数据"
      });
      return;
    }

    // 执行 Python 解析
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScript}" "${stepFilePath}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB 输出限制
    );

    if (stderr) {
      console.error(`Python stderr: ${stderr}`);
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.error(`Failed to parse Python output: ${parseError}`);
      console.error(`Raw output: ${stdout}`);
      throw new Error('Python 处理器返回无效数据');
    }

    if (!result.success) {
      throw new Error(result.error || 'STEP 解析失败');
    }

    // 清理上传的文件
    fs.unlink(stepFilePath, (err) => {
      if (err) console.error(`Failed to delete temp file: ${err}`);
    });

    res.json({
      success: true,
      data: result,
      simulated: false
    });

  } catch (error) {
    console.error('STEP parsing error:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'STEP 解析失败',
      note: "确保已安装 Python 依赖: pip install meshio trimesh"
    });
  }
});

// ============ 模拟数据生成（兼容模式） ============

function generateSimulatedData(filename: string) {
  // 生成随机但合理的模型数据
  const sizeX = 50 + Math.random() * 100;
  const sizeY = 30 + Math.random() * 80;
  const sizeZ = 10 + Math.random() * 40;
  
  const vertices: number[][] = [];
  const faces: number[][] = [];
  
  // 生成简单的立方体网格（8个顶点，12个三角面）
  // 立方体角点
  const corners = [
    [0, 0, 0],
    [sizeX, 0, 0],
    [sizeX, sizeY, 0],
    [0, sizeY, 0],
    [0, 0, sizeZ],
    [sizeX, 0, sizeZ],
    [sizeX, sizeY, sizeZ],
    [0, sizeY, sizeZ]
  ];
  
  // 立方体的三角面（12个面）
  const cubeFaces = [
    [0, 1, 2], [0, 2, 3], // 底面
    [4, 5, 6], [4, 6, 7], // 顶面
    [0, 1, 5], [0, 5, 4], // 前面
    [1, 2, 6], [1, 6, 5], // 右面
    [2, 3, 7], [2, 7, 6], // 后面
    [3, 0, 4], [3, 4, 7]  // 左面
  ];
  
  // 添加一些随机扰动，使其看起来更真实
  for (let i = 0; i < 100; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = Math.random() * 5;
    
    const x = sizeX / 2 + r * Math.sin(phi) * Math.cos(theta);
    const y = sizeY / 2 + r * Math.sin(phi) * Math.sin(theta);
    const z = sizeZ / 2 + r * Math.cos(phi);
    
    corners.push([x, y, z]);
  }
  
  // 添加一些三角面片
  for (let i = 0; i < 50; i++) {
    const v1 = Math.floor(Math.random() * corners.length);
    const v2 = Math.floor(Math.random() * corners.length);
    const v3 = Math.floor(Math.random() * corners.length);
    if (v1 !== v2 && v1 !== v3 && v2 !== v3) {
      cubeFaces.push([v1, v2, v3]);
    }
  }
  
  return {
    mesh: {
      vertices: corners,
      faces: cubeFaces,
      vertex_count: corners.length,
      face_count: cubeFaces.length,
    },
    geometry: {
      bounds: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: sizeX, y: sizeY, z: sizeZ },
        size: { x: sizeX, y: sizeY, z: sizeZ }
      },
      centroid: [sizeX / 2, sizeY / 2, sizeZ / 2],
      volume: sizeX * sizeY * sizeZ,
      watertight: true,
      convex: true
    },
    metadata: {
      filename,
      file_size: 1024 * 1024, // 1MB
      units: 'mm'
    }
  };
}

// ============ 切片生成 ============

const sliceRequestSchema = z.object({
  meshData: z.object({
    vertices: z.array(z.array(z.number())),
    faces: z.array(z.array(z.number()))
  }),
  params: z.object({
    layerHeight: z.number().positive(),
    toolDiameter: z.number().positive(),
    feedRate: z.number().positive(),
    spindleSpeed: z.number().positive(),
    safeHeight: z.number().nonnegative()
  })
});

router.post("/slice", async (req, res) => {
  try {
    const validation = sliceRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        success: false, 
        error: "参数校验失败", 
        details: validation.error.flatten() 
      });
      return;
    }

    const { meshData, params } = validation.data;
    
    // 这里应该调用 Python 进行真实切片
    // 目前返回模拟切片数据
    const slices = generateSimulatedSlices(meshData, params);
    
    res.json({
      success: true,
      slices,
      simulated: true,
      note: "切片功能开发中"
    });
    
  } catch (error) {
    console.error('Slicing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '切片生成失败'
    });
  }
});

function generateSimulatedSlices(meshData: any, params: any) {
  const bounds = calculateMeshBounds(meshData.vertices);
  const minZ = bounds.min.z;
  const maxZ = bounds.max.z;
  const layerHeight = params.layerHeight || 2.0;
  
  const slices = [];
  let currentZ = minZ + layerHeight / 2;
  
  while (currentZ <= maxZ) {
    // 生成模拟轮廓（矩形）
    const sizeX = bounds.max.x - bounds.min.x;
    const sizeY = bounds.max.y - bounds.min.y;
    
    const offset = currentZ * 0.1; // 随高度变化的偏移
    
    const contour = [
      [bounds.min.x + offset, bounds.min.y + offset],
      [bounds.max.x - offset, bounds.min.y + offset],
      [bounds.max.x - offset, bounds.max.y - offset],
      [bounds.min.x + offset, bounds.max.y - offset],
      [bounds.min.x + offset, bounds.min.y + offset] // 闭合
    ];
    
    slices.push({
      z: currentZ,
      contours: [contour], // 可以包含多个轮廓（如孔洞）
      is_closed: true
    });
    
    currentZ += layerHeight;
  }
  
  return slices;
}

function calculateMeshBounds(vertices: number[][]) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (const [x, y, z] of vertices) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ }
  };
}

export default router;