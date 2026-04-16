// API 接口契约定义
// zod schema 做校验，z.infer 推导类型，前后端共享
//
// import { z } from "zod";
// import type { Post } from "./types";
//
// 使用示例：
// export const createPostSchema = z.object({
//   title: z.string().min(1).max(200),
//   content: z.string().optional(),
// });
// export type CreatePostRequest = z.infer<typeof createPostSchema>;
// export type CreatePostResponse = Post;
