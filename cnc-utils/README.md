# 开发规范

## 技术栈

- 前端: React 19 + TypeScript
- 后端: Express 5 + TypeScript
- 数据库: Drizzle ORM + PostgreSQL
- 样式: Tailwind CSS v4
- UI 组件: shadcn/ui `import { Button } from "@/components/ui/button";`
- 图标: lucide-react `import { SearchIcon } from "lucide-react";`
- 图表: recharts `import { LineChart } from "recharts";`
- 动画: framer-motion `import { motion } from "framer-motion";`
- 路由: react-router-dom `import { Link, useNavigate } from "react-router-dom";`
- 校验: zod `import { z } from "zod";`

---

## 项目结构

```
├── client/src/                # 前端代码
│   ├── index.tsx              # 入口（Provider 层级 + 样式引入，勿修改）
│   ├── app.tsx                # 路由配置
│   ├── index.css              # 全局样式 + 主题变量
│   ├── api/                   # API 请求封装
│   │   └── index.ts
│   ├── components/            # 基础 UI 组件（禁止存放业务组件）
│   │   └── ui/                # shadcn/ui 内置组件（勿手动修改）
│   ├── pages/                 # 页面模块（每个页面一个目录）
│   │   ├── HomePage/          # 占位示例页，开发时替换为业务首页
│   │   │   └── HomePage.tsx   # 页面入口文件与目录同名
│   │   │   └── components/    # 页面专属组件
│   │   └── NotFoundPage/
│   │       └── NotFoundPage.tsx
│   ├── hooks/                 # 自定义 Hooks
│   └── lib/                   # 工具函数（cn() 等）
├── server/                    # 后端代码
│   ├── index.ts               # Express 入口
│   ├── routes/                # 路由
│   │   ├── index.ts           # 路由注册
│   │   └── view.ts            # 页面渲染（catch-all HTML 响应，勿修改）
│   └── db/                    # 数据库层
│       ├── schema.ts          # Drizzle schema 定义（工具自动生成，勿手动修改）
├── shared/                    # 前后端共享（不依赖 client 或 server）
│   ├── types.ts               # 数据模型类型
│   └── api.interface.ts       # zod schema + API 入参/出参类型
```

---

## 新增资源（以 posts 为例）

### 1. shared/ — 定义类型和校验

`shared/types.ts` 增加数据模型：

```typescript
export interface Post {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
}
```

`shared/api.interface.ts` 增加 zod schema 和 API 类型：

```typescript
export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
});
export type CreatePostRequest = z.infer<typeof createPostSchema>;
export type CreatePostResponse = Post;
export type ListPostsResponse = Post[];
```

### 2. server/ — 数据库和路由

`server/db/schema.ts` 由 `npm run gen:db-schema` 自动生成，无需手动编写。运行命令后会根据数据库表结构自动生成如下定义：

```typescript
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

`server/routes/posts.ts` 编写 CRUD 路由：

```typescript
import { Router } from "express";
import { db } from "@lark-apaas/express-core";
import { posts } from "../db/schema";
import { createPostSchema } from "@shared/api.interface";

const router = Router();
router.get("/", async (_req, res) => {
  const list = await db.select().from(posts);
  res.json(list);
});
router.post("/", async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const [post] = await db.insert(posts).values(parsed.data).returning();
  res.status(201).json(post);
});
export default router;
```

`server/routes/index.ts` 注册：

```typescript
import postsRouter from "./posts";
app.use("/api/posts", postsRouter);
```

### 3. client/ — API 封装和页面

> ⚠️ **客户端所有 HTTP 请求必须使用 `axiosForBackend`**
>
> `axiosForBackend` 由 `@lark-apaas/client-toolkit-lite` 提供，内置平台鉴权、CSRF token 注入和请求上下文。**禁止使用** `fetch`、`axios`、`XMLHttpRequest` 或其他 HTTP 客户端直接发起请求。

`client/src/api/index.ts` 增加封装：

```typescript
import { axiosForBackend } from "@lark-apaas/client-toolkit-lite";
import type { ListPostsResponse } from "@shared/api.interface";

export async function listPosts(): Promise<ListPostsResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/posts',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

`client/src/pages/PostsPage/PostsPage.tsx` 编写页面，`client/src/app.tsx` 注册路由。

---

## 页面与组件规范

**页面文件只做骨架编排，不包含具体 UI 实现。**

```tsx
// client/src/pages/DashboardPage/DashboardPage.tsx
import { StatsSection } from "./components/stats-section";
import { DataTableSection } from "./components/data-table-section";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <StatsSection />
      <DataTableSection />
    </div>
  );
}
```

**规则：**

- 每个视觉上独立的区块拆为一个组件文件，即使只出现一次
- 单个组件文件不超过 **150 行**，超出时进一步拆分子组件
- 页面专属组件放在 `pages/<page>/components/`
- `client/src/components/` 仅存放基础 UI 组件（如 shadcn/ui），**禁止存放业务组件**
- 文件名 kebab-case（`stat-card.tsx`），组件名 PascalCase（`StatCard`）
- 组件之间**禁止循环引用**

### Section 独立性（并行开发规范）

每个 Section 级组件（如 `StatsSection`、`DataTableSection`）必须做到**完全自包含**：

**1. 页面文件 = 纯布局组合器**

- 页面入口文件（如 `DashboardPage.tsx`）只做 import + JSX 排列，**禁止包含** `useState`、`useEffect`、数据请求或业务逻辑
- 页面文件无 props 接口定义，不承担任何数据协调职责

**2. Section 自包含原则**

每个 Section 组件独立拥有自己的：
- **数据获取**（API 调用、fetch）— 即使多个 Section 需要同一份数据，各自获取
- **状态管理**（useState、useReducer）
- **类型定义**（写在同文件或同目录下的 `types.ts`）
- **子组件**（如需拆分，平铺在 `components/` 目录下，禁止嵌套子目录）

**3. 禁止 Section 间横向依赖**

- 兄弟 Section 之间**禁止互相 import**
- 兄弟 Section 之间**禁止通过 Context、全局 store、事件总线、页面 props 共享状态**
- 每个 Section 可独立开发、独立测试，不依赖其他 Section 的存在

---

## 路由注册

新增页面在 `client/src/app.tsx` 中注册。

> ⚠️ **首页路由替换（必做）**
>
> 模板默认的 `HomePage` 是占位示例页，**不是业务首页**。开发时必须将 `index` 路由替换为真实的业务首页组件（如 `DashboardPage`），并删除 `HomePage` 目录。

**替换后的路由示例：**

```tsx
<Route element={<Layout />}>
  {/* 将 index 路由指向真实的业务首页 */}
  <Route index element={<DashboardPage />} />
  <Route path="todos" element={<TodosPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Route>
```

> **注意：** `BrowserRouter` 已在 `index.tsx` 中统一配置，`app.tsx` 中**禁止**再包裹 `BrowserRouter`，否则会报嵌套 Router 错误。

**新增页面步骤：**

1. 在 `client/src/pages/` 下新建页面目录（如 `SettingsPage`）和 `SettingsPage.tsx`
2. 在 `app.tsx` 的 `<Routes>` 内添加 `<Route>` 配置

**路由跳转必须使用 react-router-dom：**

- 组件内跳转：`<Link to="/dashboard">Dashboard</Link>`
- 编程式跳转：`const navigate = useNavigate(); navigate("/dashboard");`
- **禁止使用** `<a href="/">` 或 `window.location` 进行页面内跳转

---

## 样式与主题

### 主题变量

主题色定义在 `client/src/index.css` 中，通过 `:root` CSS 变量 + `@theme inline` 注册到 Tailwind。

**语义化颜色对照：**

| 用途 | Tailwind 类 | CSS 变量 |
|------|------------|----------|
| 页面背景 | `bg-background` | `--background` |
| 主文本 | `text-foreground` | `--foreground` |
| 卡片背景 | `bg-card` | `--card` |
| 次要文本 | `text-muted-foreground` | `--muted-foreground` |
| 主色 | `bg-primary` / `text-primary` | `--primary` |
| 强调色 | `bg-accent` | `--accent` |
| 边框 | `border-border` | `--border` |
| 危险色 | `text-destructive` | `--destructive` |
| 成功色 | `text-success-foreground` | `--success-foreground` |
| 警告色 | `text-warning-foreground` | `--warning-foreground` |
| 图表色 | `bg-chart-1` ~ `bg-chart-5` | `--chart-1` ~ `--chart-5` |

**颜色使用规则：**

- 主题色（背景、文本、主色、边框等）**必须使用语义化变量类**
- 灰阶辅助色（细节装饰、次要分隔线）可使用 Tailwind 原生色（如 `text-gray-500`）
- 类名合并使用 `cn()`：`import { cn } from "@/lib/utils"`

### 主题增量修改规范

修改主题时，**只覆盖需要变更的变量**：

```css
/* 正确：仅修改需要的变量 */
:root {
  --primary: hsl(150, 60%, 40%);
  --primary-foreground: hsl(0, 0%, 100%);
}

/* 禁止：复制整个 :root 块后修改 */
```

- 新增自定义颜色变量时，必须同时在 `:root` 和 `@theme inline` 中注册
- 禁止直接修改 `@theme inline` 中已有的 `--color-*` 映射关系
- 禁止删除已有的主题变量（可能被 shadcn/ui 组件依赖）

---

## 布局与交互

### 响应式布局

- 容器使用 `max-w-*` + `mx-auto` 居中，禁止内容在大屏贴边延伸
- 多列布局使用 `grid` + 断点类：`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- flex 子元素设置 `min-w-0`，多元素横排时加 `flex-wrap`
- 禁止固定像素宽度作为主容器（如 `w-[720px]`）

### 内容自适应

- 区块高度由内容撑开，禁止固定 `h-` 值（图表容器除外）
- 图片：`max-w-full h-auto`
- 长文本：`break-words`
- 单行截断：`truncate`
- 表格/代码块：`overflow-x-auto`

### 交互规范

- 所有交互元素（按钮、链接、标签页等）必须有**实际交互逻辑**和**可见反馈**
- 禁止空函数（`onClick={() => {}}`）或仅 `console.log` 的响应
- 禁止 `href="#"` 占位链接、无内容切换的标签页、空下拉菜单
- 禁止"导出"、"分享"等无法真正执行的操作按钮
- 如功能暂未实现，**删除该入口**，不实现假按钮

---

## 自检清单

| 检查项 | 验收标准 |
|--------|---------|
| 页面拆分 | 页面文件只做骨架编排（无 state/effect/逻辑）；每个 Section 自包含数据+状态+类型；兄弟 Section 间无互相 import；单文件 ≤150 行 |
| 命名规范 | 页面目录 PascalCase，页面入口文件与目录同名（PascalCase），组件文件名 kebab-case，组件名 PascalCase |
| 路由注册 | 默认 `HomePage` 已替换为业务首页；新页面已在 `app.tsx` 注册；跳转使用 `<Link>` / `useNavigate()`，无 `<a href>` |
| API 调用 | 统一在 `api/` 封装；必须使用 `axiosForBackend` 发起请求，禁止 `fetch`/`axios`；使用 `@shared` 类型 |
| 输入校验 | zod schema 定义在 `shared/api.interface.ts`；server 和 client 共用 |
| 主题色 | 使用语义化变量类（`bg-background`、`text-primary` 等）；未硬编码颜色值 |
| 主题修改 | 仅增量覆盖变更的变量；新增色同时注册 `:root` 和 `@theme inline` |
| 响应式 | 容器 `max-w-*` + `mx-auto`；多列布局窄屏退化单列；flex 有 `min-w-0` |
| 内容自适应 | 无固定 `h-`（图表除外）；长文本 `break-words`；表格 `overflow-x-auto` |
| 交互完整性 | 所有按钮/链接有实际处理器和可见反馈；无空响应、无假按钮 |
| 无循环引用 | client ↔ server 不直接 import；通过 shared/ 共享类型 |
