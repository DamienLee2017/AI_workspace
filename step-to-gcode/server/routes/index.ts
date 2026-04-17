import type { Router } from "express";
import { registerViewRoute } from "./view";
import gcodeRouter from "./gcode";
import stepRouter from "./step";

export function registerRoutes(router: Router) {
  // STEP 文件解析路由
  router.use("/api/step", stepRouter);
  
  // G代码生成路由
  router.use("/api/gcode", gcodeRouter);

  // HTML 页面渲染（catch-all，必须放在最后）
  registerViewRoute(router);
}
