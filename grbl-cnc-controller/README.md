# GRBL CNC 控制器项目

<div align="center">

![CNC Controller](docs/images/cnc-controller-banner.png)

**开源的 G 代码 CNC 控制器，支持 Arduino 和 ESP32-S3 双平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Arduino](https://img.shields.io/badge/Platform-Arduino-green.svg)](https://www.arduino.cc/)
[![ESP32](https://img.shields.io/badge/Platform-ESP32--S3-orange.svg)](https://www.espressif.com/)

[English](README_EN.md) | 中文

</div>

---

## 项目简介

本项目提供两个版本的 GRBL 风格 CNC 控制器：

| 版本 | 平台 | 特点 | 适用场景 |
|------|------|------|----------|
| **Arduino 版本** | Arduino Uno/Nano/Mega | 串口通信，稳定可靠 | 入门级 CNC，桌面雕刻机 |
| **ESP32-S3 版本** | ESP32-S3 | WiFi 网络控制，性能更强 | 高级应用，无线控制需求 |

### 核心功能

- ✅ G 代码解析与执行
- ✅ 三轴步进电机控制 (X/Y/Z)
- ✅ 串口通信 (Arduino) / WiFi + 串口 (ESP32-S3)
- ✅ 实时位置显示
- ✅ 速度与进给率控制
- ✅ 原点设置与归零
- ✅ 急停功能

---

## 快速开始

### Arduino 版本

```
cd arduino/grbl-controller
# 使用 Arduino IDE 打开 grbl-controller.ino
# 选择板卡: Arduino Uno/Nano
# 上传代码
```

详细说明: [Arduino 部署指南](arduino/README.md)

### ESP32-S3 版本

```
cd esp32s3/grbl-controller-wifi
# 使用 Arduino IDE 打开 grbl-controller-wifi.ino
# 选择板卡: ESP32S3 Dev Module
# 配置 WiFi SSID 和密码
# 上传代码
```

详细说明: [ESP32-S3 部署指南](esp32s3/README.md)

---

## 硬件要求

### 通用配件

| 配件 | 规格 | 数量 |
|------|------|------|
| 步进电机 | NEMA 17 或 equivalent | 3 |
| 步进电机驱动 | A4988 / DRV8825 / TB6600 | 3 |
| CNC 屏蔽板 | GRBL 兼容 | 1 |
| 电源 | 12V/24V 根据电机规格 | 1 |
| 限位开关 | 机械式或光学式 | 6 (每轴2个) |

### Arduino 版本额外配件

- Arduino Uno / Nano / Mega
- USB 数据线 (Type-A to Type-B 或 Type-C)

### ESP32-S3 版本额外配件

- ESP32-S3 DevKitC-1 或兼容板
- WiFi 网络环境

---

## G 代码支持

本控制器支持标准 G 代码指令集：

### 运动指令

| G 代码 | 功能 | 示例 |
|--------|------|------|
| G0 | 快速移动 | `G0 X10 Y20` |
| G1 | 线性进给 | `G1 X50 Y30 F100` |
| G28 | 归零 | `G28` |
| G90 | 绝对坐标 | `G90` |
| G91 | 相对坐标 | `G91` |

### 设置指令

| G 代码 | 功能 | 示例 |
|--------|------|------|
| M3 | 主轴正转 | `M3 S1000` |
| M5 | 主轴停止 | `M5` |
| F | 设置进给率 | `F200` |
| S | 设置转速 | `S5000` |

---

## 接线指南

### Arduino 版本

详细接线图请参考: [Arduino 接线说明](arduino/WIRING.md)

```
Arduino Pinout:
├── D2  → X Step
├── D3  → X Dir
├── D4  → Y Step
├── D5  → Y Dir
├── D6  → Z Step
├── D7  → Z Dir
├── D8  → Enable (低电平使能)
├── D9  → X Limit
├── D10 → Y Limit
├── D11 → Z Limit
└── A0  → Spindle PWM
```

### ESP32-S3 版本

详细接线图请参考: [ESP32-S3 接线说明](esp32s3/WIRING.md)

```
ESP32-S3 Pinout:
├── GPIO1  → X Step
├── GPIO2  → X Dir
├── GPIO3  → Y Step
├── GPIO4  → Y Dir
├── GPIO5  → Z Step
├── GPIO6  → Z Dir
├── GPIO7  → Enable
├── GPIO8  → X Limit
├── GPIO9  → Y Limit
├── GPIO10 → Z Limit
├── GPIO11 → Spindle PWM
└── GPIO12 → Probe
```

---

## WiFi 控制 (ESP32-S3)

连接 ESP32-S3 创建的 WiFi 热点：

```
SSID: CNC_Controller_XXXX
Password: 12345678
```

### Telnet 命令

```bash
telnet <ESP32_IP> 23
```

### Web 控制界面

在浏览器中访问: `http://<ESP32_IP>`

支持功能：
- 实时位置显示
- JOG 手轮控制
- G 代码文件上传
- 状态监控

---

## 项目结构

```
grbl-cnc-controller/
├── README.md                 # 项目主文档
├── README_EN.md              # 英文版文档
├── LICENSE                   # MIT 许可证
│
├── arduino/                  # Arduino 版本
│   ├── grbl-controller/      # 主程序
│   │   ├── grbl-controller.ino
│   │   └── Config.h          # 配置文件
│   ├── README.md             # Arduino 部署指南
│   └── WIRING.md             # 接线说明
│
├── esp32s3/                  # ESP32-S3 版本
│   ├── grbl-controller-wifi/ # 主程序
│   │   ├── grbl-controller-wifi.ino
│   │   ├── Config.h          # 配置文件
│   │   └── WebServer.h       # Web 服务
│   ├── README.md             # ESP32-S3 部署指南
│   └── WIRING.md             # 接线说明
│
└── docs/                     # 文档资源
    ├── arduino-guide.md      # 详细使用教程
    ├── esp32s3-guide.md      # ESP32 详细教程
    └── images/               # 图片资源
```

---

## 软件架构

### Arduino 版本架构

```
┌─────────────────────────────────────────┐
│            Serial Interface             │
│         (G-code Input / Status)         │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           GCode Parser                  │
│   - Line parsing                        │
│   - Command validation                 │
│   - Parameter extraction               │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          Motion Planner                 │
│   - Trajectory calculation             │
│   - Acceleration/deceleration          │
│   - Buffer management                  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           Stepper Driver                │
│   - Pulse generation                   │
│   - Direction control                  │
│   - Limit switch handling              │
└─────────────────────────────────────────┘
```

### ESP32-S3 版本架构

```
┌─────────────────────────────────────────┐
│     WiFi / WebSocket / Telnet          │
│         (Multiple interfaces)           │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          Command Router                │
│   - Protocol parsing                   │
│   - Session management                │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           GCode Parser                  │
│   (Same as Arduino version)            │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│     FreeRTOS Task Scheduler            │
│  - Motion Task                         │
│  - Network Task                        │
│  - Status Task                         │
└─────────────────────────────────────────┘
```

---

## 性能对比

| 特性 | Arduino | ESP32-S3 |
|------|---------|----------|
| 主频 | 16 MHz | 240 MHz |
| RAM | 2 KB | 512 KB |
| Flash | 32 KB | 4-16 MB |
| 通信方式 | USB Serial | WiFi + USB Serial |
| 最大步率 | ~10 kHz | ~100 kHz |
| Web 界面 | ❌ | ✅ |
| OTA 更新 | ❌ | ✅ |

---

## 常见问题

### Q: 步进电机抖动或失步?

A: 检查以下设置:
- 驱动电流设置 (参考驱动模块说明书)
- 电源电压是否充足
- 步进脉冲频率是否过高
- 电机接线顺序是否正确

### Q: ESP32-S3 无法连接 WiFi?

A: 确认:
- WiFi 密码是否正确
- 路由器频段 (ESP32-S3 支持 2.4GHz)
- 信号强度

### Q: G 代码无法识别?

A: 检查:
- G 代码格式是否正确
- 是否使用了不支持的指令
- 坐标参数是否在行程范围内

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 致谢

- 基于 GRBL 项目理念: https://github.com/grbl/grbl
- 参考了开源社区的 CNC 控制技术

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 作者

DamienLee2017 - https://github.com/DamonneLee2017

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️**

</div>
