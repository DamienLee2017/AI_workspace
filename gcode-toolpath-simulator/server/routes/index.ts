import type { Router } from "express";
import { registerViewRoute } from "./view";
// import postsRouter from "./posts";

export function registerRoutes(router: Router) {
  // 在此注册 API 路由
  //
  // 使用示例：
  // router.use("/api/posts", postsRouter);

  // HTML 页面渲染（catch-all，必须放在最后）
  registerViewRoute(router);
}
