# AI Workspace 项目集

这是一个专注于 CNC（计算机数控）和 G 代码相关工具的开源项目集合。所有项目都采用现代化的开发技术栈，旨在为 CNC 爱好者和专业用户提供完整的工具链。

## 📁 项目目录

### 1. [cnc-utils](./cnc-utils/README.md)
**CNC 实用工具集** - 提供各种 CNC 加工相关的辅助工具和实用程序。

- **技术栈**: React 19 + TypeScript, Express 5 + TypeScript, PostgreSQL, Tailwind CSS v4
- **功能**: CNC 加工参数计算、材料数据库、刀具管理、加工时间估算等
- **状态**: 开发中

### 2. [grbl-cnc-controller](./grbl-cnc-controller/README.md)
**GRBL CNC 控制器** - 开源的 G 代码 CNC 控制器，支持 Arduino 和 ESP32-S3 双平台。

- **平台**: Arduino Uno/Nano/Mega (串口版本) 和 ESP32-S3 (WiFi 版本)
- **核心功能**: G 代码解析与执行、实时状态监控、手动控制、限位开关支持
- **特点**: 双平台支持、网络控制、扩展性强
- **状态**: 稳定版本可用

### 3. [step-to-gcode](./step-to-gcode/README.md)
**STEP 转 G 代码转换器** - 将 3D CAD 模型（STEP 格式）转换为 CNC 可执行的 G 代码。

- **技术栈**: React 19 + TypeScript, Express 5 + TypeScript, PostgreSQL, Tailwind CSS v4
- **功能**: STEP 文件上传与解析、加工参数配置、G 代码生成、3D 预览
- **状态**: 开发中

### 4. [gcode-toolpath-simulator](./gcode-toolpath-simulator/)
**G 代码工具路径模拟器** - 可视化 G 代码执行过程，模拟 CNC 机床的加工路径。

- **状态**: 项目规划中（目录预留）
- **计划功能**: G 代码可视化、碰撞检测、加工时间估算、3D 模拟

## 🚀 快速开始

### 环境要求
- Node.js 18+ 和 npm/pnpm/yarn
- PostgreSQL 数据库
- Arduino IDE 或 PlatformIO（用于 grbl-cnc-controller）

### 克隆仓库
```bash
git clone https://github.com/DamienLee2017/AI_workspace.git
cd AI_workspace
```

### 项目选择
每个项目都是独立的，可以单独运行。进入对应项目目录查看具体的安装和运行说明。

## 📊 项目状态

| 项目 | 状态 | 版本 | 最后更新 |
|------|------|------|----------|
| cnc-utils | 🟡 开发中 | v0.1.0 | 2026-04 |
| grbl-cnc-controller | 🟢 稳定 | v1.0.0 | 2026-04 |
| step-to-gcode | 🟡 开发中 | v0.1.0 | 2026-04 |
| gcode-toolpath-simulator | 🔵 规划中 | - | - |

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

所有项目均采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过 GitHub Issues 提交。

---

*最后更新: 2026年4月*