import { z } from "zod";
import type { MachiningParameters, ModelBounds } from "./types";

// ============ 文件上传 ============

export const uploadStepFileSchema = z.object({
  filename: z.string().min(1),
  fileSize: z.number().positive(),
});

export type UploadStepFileRequest = z.infer<typeof uploadStepFileSchema>;

export const uploadStepFileResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string().optional(),
  modelInfo: z.object({
    name: z.string(),
    bounds: z.object({
      minX: z.number(),
      maxX: z.number(),
      minY: z.number(),
      maxY: z.number(),
      minZ: z.number(),
      maxZ: z.number(),
    }),
    vertexCount: z.number().optional(),
    faceCount: z.number().optional(),
  }).optional(),
  error: z.string().optional(),
});

export type UploadStepFileResponse = z.infer<typeof uploadStepFileResponseSchema>;

// ============ G代码生成 ============

export const generateGcodeRequestSchema = z.object({
  modelBounds: z.object({
    minX: z.number(),
    maxX: z.number(),
    minY: z.number(),
    maxY: z.number(),
    minZ: z.number(),
    maxZ: z.number(),
  }),
  params: z.object({
    feedRate: z.number().positive(),
    spindleSpeed: z.number().positive(),
    cuttingDepth: z.number().positive(),
    stepOver: z.number().positive(),
    toolDiameter: z.number().positive(),
    safeHeight: z.number().nonnegative(),
    retractHeight: z.number().nonnegative(),
    coolantEnabled: z.boolean(),
    finishPass: z.boolean(),
    finishPassAllowance: z.number().nonnegative(),
  }),
});

export type GenerateGcodeRequest = z.infer<typeof generateGcodeRequestSchema>;

export const generateGcodeResponseSchema = z.object({
  success: z.boolean(),
  gcode: z.string(),
  stats: z.object({
    totalLines: z.number(),
    estimatedTime: z.number(),
    toolpathLength: z.number(),
  }),
  generatedAt: z.string(),
  error: z.string().optional(),
});

export type GenerateGcodeResponse = z.infer<typeof generateGcodeResponseSchema>;
