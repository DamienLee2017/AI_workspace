# CNC 工具集

本仓库包含一系列由 AI 辅助开发的 CNC（计算机数控）相关工具应用。

## 项目列表

### 1. [gcode-toolpath-simulator](gcode-toolpath-simulator/README.md)
G 代码刀路模拟器，支持 G 代码文件上传、3D 可视化、刀路分析和模拟控制。

**功能特性**：
- G 代码文件上传与解析
- 3D 刀路可视化（Three.js）
- 刀路信息统计（总距离、加工时间等）
- 模拟控制（播放/暂停/重置）
- 多视图切换（俯视、侧视、等轴测）

**运行效果截图**：
![gcode-toolpath-simulator 截图](screenshots/gcode-toolpath-simulator.png)

### 2. [grbl-cnc-controller](grbl-cnc-controller/README.md)
基于 GRBL 的 CNC 控制器，支持 Arduino 和 ESP32-S3，提供 Web 界面控制。

**功能特性**：
- Web 界面实时控制（坐标、移动、主轴、冷却）
- G 代码文件上传与执行
- 手动控制（JOG 模式、归零）
- WiFi 控制（ESP32-S3 版本）
- 固件配置与参数管理

**运行效果截图**：
![grbl-cnc-controller 截图](screenshots/grbl-cnc-controller.png)

### 3. [step-to-gcode](step-to-gcode/README.md)
STEP 文件转 G 代码工具，支持 STEP/STL 文件导入并生成加工路径。

**功能特性**：
- STEP/STL 文件上传与预览
- 加工参数设置（刀具直径、切削深度等）
- 自动生成 G 代码
- 刀路预览与模拟
- 支持 2.5D 铣削

**运行效果截图**：
![step-to-gcode 截图](screenshots/step-to-gcode.png)

### 4. [cnc-utils](cnc-utils/README.md)
CNC 实用工具集合，包含切削参数计算、单位换算、公差计算等。

**功能特性**：
- 切削参数计算（主轴转速、进给速度、材料去除率）
- 刀具参数库（5种刀具材料 + 10种工件材料）
- 公差配合计算（孔轴极限偏差、公差带图示）
- 单位换算（长度、转速、进给、温度、压力、扭矩）
- 公式速查（16个常用切削公式）

**运行效果截图**：
![cnc-utils 截图](screenshots/cnc-utils.png)

### 5. [cnc-tools-app](https://xcnmv6snfgei.aiforce.cloud/app/app_4jy9c9bygga3m)
在线 CNC 工具应用，提供切削参数计算、刀具参数库、公差配合计算等功能。

**运行效果截图**：
![cnc-tools-app 截图](screenshots/cnc-tools-app.png)

## 技术栈

所有 Web 应用均采用现代前端技术栈：
- **前端**：React + TypeScript + Vite
- **UI 组件**：自定义组件库 + Tailwind CSS
- **3D 可视化**：Three.js / @react-three
- **后端**：Node.js + Express（部分项目）
- **构建工具**：Vite、pnpm

## 使用说明

每个项目均为独立应用，进入对应目录后执行：

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:5173` 即可运行。

## 部署

所有项目均支持静态部署，可使用：

```bash
pnpm build
```

生成静态文件后部署至任意静态托管服务。

## 贡献

本项目为 AI 辅助开发示例，欢迎反馈与改进建议。

## 许可证

MIT License

## 联系

- GitHub: [DamienLee2017](https://github.com/DamienLee2017)
- 项目地址: [AI_workspace](https://github.com/DamienLee2017/AI_workspace)