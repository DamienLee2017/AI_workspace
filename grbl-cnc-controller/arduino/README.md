# Arduino GRBL CNC 控制器部署指南

本文档详细介绍如何在 Arduino 平台上部署 GRBL CNC 控制器固件。

---

## 硬件要求

### 必需组件

| 组件 | 规格 | 数量 |
|------|------|------|
| Arduino | Uno / Nano / Mega | 1 |
| 步进电机 | NEMA 17 (1.8°/步) | 3 |
| 步进电机驱动 | A4988 / DRV8825 / TB6600 | 3 |
| CNC 屏蔽板 | GRBL 兼容型 | 1 |
| 电源 | 12V/24V (根据电机规格) | 1 |
| 限位开关 | 机械式或光学式 | 6 |
| USB 数据线 | Type-A to Type-B 或 Type-C | 1 |

### 推荐配置

- **Arduino Uno**: 适合入门级项目，最大步率约 10kHz
- **Arduino Mega**: 推荐用于复杂项目，更多引脚资源
- **Arduino Nano**: 适合空间受限的紧凑型安装

---

## 软件准备

### 1. 安装 Arduino IDE

1. 访问 [Arduino 官网](https://www.arduino.cc/en/software)
2. 下载对应操作系统的 Arduino IDE (建议版本 2.x)
3. 完成安装并启动 IDE

### 2. 安装 ESP32 开发板（仅 ESP32-S3 版本需要）

Arduino IDE 默认不包含 ESP32-S3 支持，需要手动添加：

1. 打开 Arduino IDE
2. 进入 **文件 → 首选项**
3. 在「附加开发板管理器网址」中添加：
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. 点击「好」保存
5. 进入 **工具 → 开发板 → 开发板管理器**
6. 搜索「ESP32」
7. 选择「ESP32 by Espressif Systems」并点击「安装」

---

## 代码部署

### 1. 获取源代码

```bash
# 进入项目目录
cd arduino/grbl-controller

# 或克隆整个仓库
git clone https://github.com/DamonneLee2017/AI_workspace.git
cd AI_workspace/grbl-cnc-controller/arduino/grbl-controller
```

### 2. 配置参数

在上传代码前，建议根据您的硬件配置修改 `Config.h` 文件：

```cpp
// Config.h 关键配置项

// 轴步数设置（根据细分和丝杆导程计算）
#define X_STEPS_PER_MM 80.0
#define Y_STEPS_PER_MM 80.0
#define Z_STEPS_PER_MM 400.0

// 最大进给速度 (mm/min)
#define MAX_FEEDRATE 1000.0

// 最大加速度 (mm/s²)
#define MAX_ACCELERATION 100.0

// 归零速度 (mm/min)
#define HOMING_FEEDRATE 200.0

// 限位开关有效电平 (HIGH 或 LOW)
#define LIMIT_MASK B111

// 主轴 PWM 频率 (Hz)
#define SPINDLE_PWM_FREQ 1000
```

### 3. 选择开发板

1. 连接 Arduino 与电脑
2. 在 Arduino IDE 中选择对应开发板：
   - **工具 → 开发板 → Arduino AVR Boards → Arduino Uno**
   - 或选择您使用的具体型号

### 4. 选择串口号

- **工具 → 端口 → COMx**（Windows）
- **工具 → 端口 → /dev/tty.usbmodemxxx**（macOS）
- **工具 → 端口 → /dev/ttyUSB0**（Linux）

### 5. 上传固件

1. 打开 `grbl-controller.ino`
2. 点击上传按钮（→）或 **Ctrl+U**（**Cmd+U** on macOS）
3. 等待上传完成（进度条走完，显示「上传完成」）

### 6. 验证安装

上传成功后，打开串口监视器（**工具 → 串口监视器**），设置波特率为 115200：

```
Grbl 1.1 [Arduino Uno]
'$' to dump old settings
'' to report settings
```

输入 `$$` 查看当前配置参数：

```
$0=10 (Step pulse time, usec)
$1=25 (Step idle delay, msec)
$2=0 (Step port invert mask:00000000)
$3=0 (Direction port invert mask:00000000)
...
```

---

## 接线指南

### 标准接线图

```
Arduino UNO                    CNC Shield
┌─────────────┐                ┌─────────────────┐
│             │                │                 │
│    D2  ─────┼────────────────┼─→ X Step       │
│    D3  ─────┼────────────────┼─→ X Direction   │
│    D4  ─────┼────────────────┼─→ Y Step       │
│    D5  ─────┼────────────────┼─→ Y Direction   │
│    D6  ─────┼────────────────┼─→ Z Step       │
│    D7  ─────┼────────────────┼─→ Z Direction   │
│    D8  ─────┼────────────────┼─→ Enable       │
│             │                │                 │
│    D9  ─────┼────────────────┼─→ X Limit      │
│    D10 ─────┼────────────────┼─→ Y Limit      │
│    D11 ─────┼────────────────┼─→ Z Limit      │
│             │                │                 │
│    A0  ─────┼────────────────┼─→ Spindle PWM  │
│             │                │                 │
│    5V  ─────┼────────────────┼─→ VCC          │
│    GND ─────┼────────────────┼─→ GND          │
│             │                │                 │
└─────────────┘                └─────────────────┘
```

### 详细接线说明

#### 步进电机连接

| Arduino 引脚 | CNC Shield | 步进电机 |
|-------------|------------|---------|
| D2 | X Step | - |
| D3 | X Dir | - |
| D4 | Y Step | - |
| D5 | Y Dir | - |
| D6 | Z Step | - |
| D7 | Z Dir | - |
| D8 | Enable | - |

每个轴的步进电机连接至对应的 4P 绿色端子：
- 2A, 2B 端子：电机线圈 A
- 1A, 1B 端子：电机线圈 B

#### 限位开关连接

| Arduino 引脚 | CNC Shield | 功能 |
|-------------|------------|------|
| D9 | X Limit | X 轴正向限位 |
| D9 | X Limit | X 轴负向限位 |
| D10 | Y Limit | Y 轴正向限位 |
| D10 | Y Limit | Y 轴负向限位 |
| D11 | Z Limit | Z 轴正向限位 |
| D11 | Z Limit | Z 轴负向限位 |

#### 主轴控制

| Arduino 引脚 | CNC Shield | 功能 |
|-------------|------------|------|
| A0 | Spindle PWM | 主轴转速控制 (0-5V) |
| D12 | Spindle Enable | 主轴启停控制 |

### 电源连接

1. **主电源 (12V/24V)**：连接 CNC Shield 的 DC 输入端子
2. **USB 供电**：仅用于通信，不要使用 USB 供电驱动电机
3. **共地**：确保 Arduino 和 CNC Shield 共地

---

## 功能测试

### 1. 串口通信测试

使用串口监视器或 GRBL 控制软件（如 Candle、Universal G-code Sender）：

```bash
# 基本命令测试
?           # 查询状态
$G          # 查看 G 代码参数
$$          # 查看所有设置
$h          # 执行归零
$X          # 解锁
```

### 2. 电机测试

```bash
# 移动测试（相对坐标）
G91         # 切换到相对坐标
G1 X10 F500 # X轴移动 10mm，进给率 500mm/min
G1 Y10      # Y轴移动 10mm
G1 Z5       # Z轴移动 5mm

# 返回绝对坐标
G90         # 切换回绝对坐标
```

### 3. 限位开关测试

```bash
# 手动触发各轴限位开关
# 检查串口是否返回限位触发信息
```

### 4. 归零测试

```bash
$h          # 执行归零序列
```

---

## 固件配置参数

### 常用 GRBL 设置

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| $0 | 步进脉冲时间 (μs) | 10 |
| $1 | 步进空闲延迟 (ms) | 25 |
| $2 | 步进脉冲反相掩码 | 0 |
| $3 | 方向信号反相掩码 | 0-3 |
| $4 | 使能信号反相 | 0 |
| $5 | 限位开关反相 | 0 |
| $10 | 状态报告掩码 | 3 |
| $11 | 拐角加速度融合 | 0.020 |
| $12 | 弧形精度 | 0.002 |
| $13 | 坐标单位（0=mm, 1=inch） | 0 |
| $20 | 软件限位使能 | 0 |
| $21 | 硬件限位使能 | 1 |
| $22 | 归零循环使能 | 1 |
| $23 | 归零方向设置 | 3 |
| $24 | 归零进给率 | 25 |
| $25 | 归零寻找速率 | 500 |
| $26 | 归零去抖延迟 | 50 |
| $27 | 归零去抖距离 | 1.000 |
| $100 | X 轴步数/mm | 80 |
| $101 | Y 轴步数/mm | 80 |
| $102 | Z 轴步数/mm | 400 |
| $110 | X 轴最大速率 | 1000 |
| $111 | Y 轴最大速率 | 1000 |
| $112 | Z 轴最大速率 | 500 |
| $120 | X 轴加速度 | 100 |
| $121 | Y 轴加速度 | 100 |
| $122 | Z 轴加速度 | 50 |
| $130 | X 轴行程 | 300 |
| $131 | Y 轴行程 | 300 |
| $132 | Z 轴行程 | 100 |

### 自定义参数

```bash
# 保存默认参数
$号参数 (100-149) 可用于存储用户自定义数据

# 示例：保存当前坐标原点
G10 L2 P0 X0 Y0 Z0
```

---

## 常见问题排查

### 问题 1: 上传失败

**可能原因**：
- 串口选择错误
- 驱动程序未安装
- USB 线不支持数据传输

**解决方案**：
1. 确认选择正确的 COM 端口
2. 安装 Arduino 驱动程序
3. 更换高质量的 USB 线

### 问题 2: 步进电机抖动或失步

**可能原因**：
- 驱动电流设置过低
- 电源电压不足
- 脉冲频率过高

**解决方案**：
1. 调整驱动模块上的电流调节电位器
2. 确保电源功率充足（建议 200W+）
3. 降低进给速率

### 问题 3: 限位开关无效

**可能原因**：
- 限位开关连接错误
- 限位触发电平设置错误

**解决方案**：
1. 检查限位开关接线
2. 使用 `$5` 切换限位电平

### 问题 4: 串口通信异常

**可能原因**：
- 波特率设置错误
- 串口被其他程序占用

**解决方案**：
1. 确认波特率为 115200
2. 关闭其他占用串口的程序

### 问题 5: 电机不转但有声音

**可能原因**：
- 电机线圈接线顺序错误
- 驱动模块损坏

**解决方案**：
1. 调换电机线圈接线顺序
2. 更换驱动模块

---

## 推荐控制软件

### 桌面端

| 软件 | 平台 | 特点 |
|------|------|------|
| [Candle](https://github.com/Denvi/Candle) | Windows/Linux | 轻量、功能全面 |
| [Universal G-code Sender](https://winder.github.io/ugs_website/) | Windows/Mac/Linux | Java 实现，跨平台 |
| [GrblPanel](https://github.com/kitus/GRBLpanel) | Windows | 简洁易用 |
| [LaserGRBL](https://lasergrbl.com/) | Windows | 专为激光雕刻设计 |

### 移动端

| 软件 | 平台 | 特点 |
|------|------|------|
| Grbl Controller | Android | 基础控制功能 |
| bCNC | iOS | 功能丰富 |

---

## 性能优化建议

### 1. 提高最大步率

Arduino Uno 的最大步率受限于处理器性能：
- 标准固件：约 30kHz
- 优化固件：可达 45kHz

如需更高性能，建议使用 Arduino Mega 或切换至 ESP32-S3 版本。

### 2. 减少串口延迟

在 Arduino IDE 中：
- 工具 → 处理器 → ATmega328P (Old Bootloader)
- 或在 Config.h 中启用 `USE_SERIAL1`（仅 Mega）

### 3. 优化电机性能

- 使用 1/16 或 1/32 细分驱动
- 确保良好的散热
- 使用屏蔽线减少干扰

---

## 技术支持

- **问题反馈**: [GitHub Issues](https://github.com/DamonneLee2017/AI_workspace/issues)
- **讨论交流**: [GitHub Discussions](https://github.com/DamonneLee2017/AI_workspace/discussions)

---

## 下一步

- 了解完整的 G 代码支持 → [G 代码参考手册](../docs/gcode-reference.md)
- 查看接线图 → [接线说明](./WIRING.md)
- 快速开始 → [入门指南](../docs/getting-started.md)
