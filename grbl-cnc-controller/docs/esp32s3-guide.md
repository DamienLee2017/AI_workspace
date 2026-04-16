# ESP32-S3 CNC 控制器详细使用教程

本文档提供 ESP32-S3 版本 GRBL CNC 控制器的完整使用指南。

## 目录

1. [硬件准备](#硬件准备)
2. [软件安装](#软件安装)
3. [固件烧录](#固件烧录)
4. [WiFi 连接配置](#wifi-连接配置)
5. [Web 控制界面](#web-控制界面)
6. [Telnet 连接](#telnet-连接)
7. [串口通信](#串口通信)
8. [高级功能](#高级功能)
9. [故障排除](#故障排除)

---

## 硬件准备

### 必需组件

| 组件 | 规格 | 数量 | 说明 |
|------|------|------|------|
| ESP32-S3 开发板 | ESP32-S3-DevKitC-1 或兼容板 | 1 | 主控制器 |
| 步进电机 | NEMA 17 (1.8°/步) | 3 | X/Y/Z 轴 |
| 步进电机驱动 | A4988 / DRV8825 / TMC2209 | 3 | 电机驱动 |
| CNC 屏蔽板 | GRBL 兼容 | 1 | 接口板 |
| 电源 | 12V/24V 5A+ | 1 | 根据电机规格 |
| 限位开关 | 机械式 (V-153 或等效) | 6 | 每轴 2 个 |

### 可选组件

- 主轴电机 (12V/24V DC 无刷电机或电主轴)
- 冷却泵
- 急停按钮
- 电磁阀 (气动/液压)
- 探针 (工件零点校准)

### 引脚分配

```
ESP32-S3 DevKitC-1 引脚定义:

电源:
├── 5V    → 电源输入 (USB 或外部 5V)
├── 3.3V  → 内部供电
├── GND   → 地线

步进电机控制:
├── GPIO1  → X 轴步进脉冲 (Step)
├── GPIO2  → X 轴方向控制 (Dir)
├── GPIO3  → Y 轴步进脉冲 (Step)
├── GPIO4  → Y 轴方向控制 (Dir)
├── GPIO5  → Z 轴步进脉冲 (Step)
├── GPIO6  → Z 轴方向控制 (Dir)
├── GPIO7  → 电机使能控制 (Enable, 低电平使能)

限位开关:
├── GPIO8  → X 轴限位开关 (X Limit)
├── GPIO9  → Y 轴限位开关 (Y Limit)
├── GPIO10 → Z 轴限位开关 (Z Limit)

主轴控制:
├── GPIO11 → 主轴 PWM 输出 (Spindle PWM)
├── GPIO12 → 探针输入 (Probe)

其他:
├── GPIO0  → 急停输入 (E-Stop)
└── GPIO21 → 状态 LED (Status LED)
```

---

## 软件安装

### 1. Arduino IDE 安装

1. 下载并安装 Arduino IDE 2.x 或更高版本
   - 官网: https://www.arduino.cc/en/software

2. 安装 ESP32 开发板支持:
   ```
   Arduino IDE → 文件 → 首选项 → 附加开发板管理器网址
   ```
   添加以下 URL:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```

3. 安装开发板:
   ```
   工具 → 开发板 → 开发板管理器
   搜索 "ESP32" → 安装 "esp32 by Espressif Systems"
   ```

### 2. 必需库安装

通过库管理器安装以下库:

| 库名称 | 版本 | 用途 |
|--------|------|------|
| WebServer | 内置 | HTTP 服务器 |
| WiFi | 内置 | WiFi 连接 |
| SPIFFS | 内置 | 文件系统 |
| Update | 内置 | OTA 更新 |

### 3. 硬件配置

```
工具 → 开发板 → ESP32 Arduino → ESP32S3 Dev Module

配置选项:
├── Upload Speed: 921600
├── CPU Frequency: 240MHz (WiFi)
├── Flash Size: 4MB (或更大)
├── Partition Scheme: Huge APP (3MB OTA)
├── PSRAM: Disabled (或 Enabled 视型号)
└── Upload Method: USB 或 UART (根据板子)
```

---

## 固件烧录

### 步骤 1: 配置文件修改

编辑 `esp32s3/grbl-controller-wifi/Config.h`:

```cpp
// ==================== WiFi 配置 ====================
#define WIFI_MODE_AP              // AP 模式 (热点)
// #define WIFI_MODE_STA          // STA 模式 (连接路由器)

// AP 模式配置
#define WIFI_SSID_PREFIX "CNC_Controller_"
#define WIFI_PASSWORD "12345678"

// STA 模式配置 (取消注释并填写)
// #define STA_WIFI_SSID "YourNetworkName"
// #define STA_WIFI_PASSWORD "YourPassword"

// ==================== 机械参数 ====================
#define STEPS_PER_MM_X     80.0    // X 轴每毫米步数
#define STEPS_PER_MM_Y     80.0    // Y 轴每毫米步数
#define STEPS_PER_MM_Z     400.0   // Z 轴每毫米步数
#define MAX_FEED_RATE     1000.0   // 最大进给率 (mm/min)
#define MAX_RAPID_RATE    2000.0   // 最大快速移动速率
#define DEFAULT_FEED_RATE  300.0   // 默认进给率

// ==================== 行程限位 ====================
#define MAX_TRAVEL_X      300.0    // X 轴行程 (mm)
#define MAX_TRAVEL_Y      300.0    // Y 轴行程 (mm)
#define MAX_TRAVEL_Z      100.0    // Z 轴行程 (mm)
```

### 步骤 2: 编译上传

1. 打开固件文件:
   ```
   文件 → 打开 → esp32s3/grbl-controller-wifi/grbl-controller-wifi.ino
   ```

2. 编译固件:
   ```
   草图 → 验证/编译
   ```

3. 上传固件:
   - 使用 USB 数据线连接 ESP32-S3
   - 按住 BOOT 按钮,点击 EN/RST 按钮进入下载模式
   - 点击上传按钮

4. 等待上传完成:
   ```
   上传成功后显示:
   Hard resetting via RTS pin...
   ```

### 步骤 3: 验证运行

1. 打开串口监视器 (波特率 115200)
2. 观察启动信息:
   ```
   GRBL CNC Controller (ESP32-S3)
   Version: 1.0.0
   WiFi Mode: AP
   SSID: CNC_Controller_XXXX
   Password: 12345678
   IP Address: 192.168.4.1
   Web Server: http://192.168.4.1
   Ready
   ```

---

## WiFi 连接配置

### AP 模式 (默认)

控制器创建 WiFi 热点:

1. 使用手机/电脑搜索 WiFi 网络
2. 找到 `CNC_Controller_XXXX` (XXXX 为随机数字)
3. 输入密码: `12345678`
4. 连接成功后即可访问控制界面

### STA 模式 (连接路由器)

修改 `Config.h`:

```cpp
#define WIFI_MODE_STA
#define STA_WIFI_SSID "YourWiFiName"
#define STA_WIFI_PASSWORD "YourWiFiPassword"
```

重新烧录固件后,控制器会自动连接指定网络。

### 混合模式

同时启用 AP 和 STA:

```cpp
#define WIFI_MODE_AP_AND_STA
#define WIFI_SSID_PREFIX "CNC_Controller_"
#define WIFI_PASSWORD "12345678"
#define STA_WIFI_SSID "YourWiFiName"
#define STA_WIFI_PASSWORD "YourWiFiPassword"
```

---

## Web 控制界面

### 访问方式

- AP 模式: `http://192.168.4.1`
- STA 模式: `http://<分配到的IP地址>`

### 界面功能

#### 1. 状态显示区

- 当前坐标 (X/Y/Z)
- 运行状态 (Idle/Run/Alarm)
- 进给率
- 主轴状态

#### 2. 坐标显示

- 工件坐标 (G54)
- 机械坐标
- 实时位置更新

#### 3. JOG 手轮控制

```
     [ +Y ]
[ -X ] [ 0 ] [ +X ]
     [ -Y ]

[ -Z ]  [0]  [ +Z ]
```

- 点击按钮进行连续移动
- 可设置步进距离

#### 4. 快速操作

| 按钮 | 功能 |
|------|------|
| 归零 | 执行归零程序 |
| 解锁 | 解除报警锁定 |
| 急停 | 立即停止所有运动 |
| 复位 | 软件复位 |

#### 5. G 代码发送

- 输入框: 直接输入 G 代码命令
- 发送按钮: 执行命令
- 清空按钮: 清空输出日志

#### 6. 文件上传

1. 点击"选择文件"
2. 选择 NC/GC 文件
3. 点击"上传并执行"
4. 观察执行进度

### 设置页面

访问 `http://<IP>/settings`:

- 修改 WiFi 配置
- 调整运动参数
- 设置行程限位
- 固件更新

---

## Telnet 连接

### 连接方式

```bash
telnet 192.168.4.1 23
# 或
telnet <ESP32_IP> 23
```

### 交互命令

| 命令 | 功能 |
|------|------|
| `?` | 显示帮助信息 |
| `$G` | 显示 GRBL 参数 |
| `$H` | 执行归零 |
| `$X` | 解锁报警 |
| `$$` | 显示设置参数 |
| `$0=80` | 设置 X 轴步数 |
| `G0 X10` | 快速移动到 X=10 |
| `G1 X50 F200` | 线性进给到 X=50 |
| `M3 S1000` | 启动主轴 |
| `M5` | 停止主轴 |
| `Ctrl+X` | 软复位 |

### 示例会话

```
Connected to CNC Controller
> $G
[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0 S0]
> $H
Homing cycle initiated
> G0 X50 Y50
> G1 Z-5 F100
> M3 S5000
> G1 X100
> M5
```

---

## 串口通信

### 参数配置

| 参数 | 值 |
|------|-----|
| 波特率 | 115200 |
| 数据位 | 8 |
| 停止位 | 1 |
| 校验位 | None |
| 流控制 | None |

### Arduino 串口监视器使用

1. 打开 Arduino IDE 串口监视器
2. 设置换行符: "NL & CR"
3. 波特率: 115200

### GRBL 兼容命令

#### 运动命令

| 命令 | 功能 |
|------|------|
| `G0 X Y Z` | 快速定位 |
| `G1 X Y Z F` | 线性进给 |
| `G2 X Y I J F` | 顺时针圆弧 |
| `G3 X Y I J F` | 逆时针圆弧 |
| `G28` | 返回原点 |
| `G28.1` | 设置原点 |
| `G92 X Y Z` | 设置当前位置 |

#### 坐标系

| 命令 | 功能 |
|------|------|
| `G54` | 选择工件坐标系 1 |
| `G55` | 选择工件坐标系 2 |
| `G90` | 绝对坐标 |
| `G91` | 相对坐标 |

#### 主轴控制

| 命令 | 功能 |
|------|------|
| `M3 Sxxx` | 主轴正转 (速度 xxx) |
| `M4 Sxxx` | 主轴反转 (速度 xxx) |
| `M5` | 主轴停止 |

#### 冷却液

| 命令 | 功能 |
|------|------|
| `M7` | 雾状冷却开启 |
| `M8` | 液状冷却开启 |
| `M9` | 冷却液关闭 |

---

## 高级功能

### OTA 无线更新

1. 访问 `http://<IP>/update`
2. 选择固件文件 (.bin)
3. 点击上传
4. 等待更新完成

### 文件系统 (SPIFFS)

上传文件到 ESP32:

1. 创建数据文件夹
2. 放入要上传的文件
3. 工具 → ESP32 Sketch Data Upload

### WebSocket 实时通信

支持实时状态更新:

```javascript
// 连接 WebSocket
const ws = new WebSocket('ws://192.168.4.1/ws');

// 接收状态更新
ws.onmessage = (event) => {
  const status = JSON.parse(event.data);
  console.log('Position:', status.x, status.y, status.z);
};

// 发送命令
ws.send('?');
```

### JSON API

#### 获取状态

```bash
curl http://192.168.4.1/api/status
```

响应:
```json
{
  "status": "idle",
  "mpc": 0.000,
  "wco": {"x":0,"y":0,"z":0},
  "wcs": "G54",
  "feed": 0,
  "spindle": 0,
  "pin": {"limit_x":0,"limit_y":0,"limit_z":0}
}
```

#### 发送命令

```bash
curl -X POST -d '{"cmd":"G0 X10 Y10"}' http://192.168.4.1/api/command
```

#### JOG 移动

```bash
curl -X POST -d '{"axis":"X","distance":10}' http://192.168.4.1/api/jog
```

---

## 故障排除

### WiFi 连接问题

#### 问题: 找不到 WiFi 热点

解决方案:
1. 检查 ESP32-S3 是否正常供电
2. 检查固件是否成功烧录
3. 观察串口输出确认 WiFi 初始化
4. 尝试重置 ESP32 (按下 EN 按钮)

#### 问题: 连接后无法访问 Web

解决方案:
1. 确认使用正确的 IP 地址
2. 检查防火墙设置
3. 尝试使用 ping 命令检测连接
4. 重启浏览器或清除缓存

### 串口通信问题

#### 问题: 串口输出乱码

解决方案:
1. 确认波特率设置为 115200
2. 检查 USB 数据线质量
3. 尝试不同的 USB 端口

#### 问题: 命令无响应

解决方案:
1. 检查是否处于报警模式 (`$X` 解锁)
2. 确认限位开关状态
3. 检查是否有错误消息

### 运动控制问题

#### 问题: 电机不转动

解决方案:
1. 检查电机驱动供电 (12V/24V)
2. 检查 ENABLE 引脚电平
3. 验证步进脉冲信号
4. 检查电机接线

#### 问题: 电机抖动

解决方案:
1. 降低步进脉冲频率
2. 调整驱动电流设置
3. 检查电源电压稳定性
4. 确认电机接线正确

#### 问题: 运动方向相反

解决方案:
修改 `Config.h` 中的方向反转设置:
```cpp
#define X_DIR_INVERT true   // X 轴方向反转
#define Y_DIR_INVERT false  // Y 轴方向保持
```

### 固件问题

#### 问题: 固件上传失败

解决方案:
1. 按住 BOOT 按钮再按 EN 进入下载模式
2. 降低上传速度试试
3. 检查 USB 驱动安装
4. 尝试使用不同的 USB 线

#### 问题: 启动循环

解决方案:
1. 检查配置文件语法
2. 减少内存使用
3. 调整分区方案

### 性能优化

#### 提高步进脉冲频率

```cpp
// Config.h
#define MAX_STEP_RATE 100000  // 100kHz
```

#### 启用 DMA 模式

```cpp
#define USE_DMA_STEPS true
```

#### 优化 WiFi 性能

```cpp
#define WIFI_TX_POWER WIFI_POWER_19dBm
#define WIFI_ANTENNA WIFI_ANTenna_JP
```

---

## 安全注意事项

### 电气安全

- 使用符合规格的电源
- 做好接地保护
- 避免电源过载

### 机械安全

- 安装急停按钮
- 设置合理的行程限位
- 定期检查限位开关

### 操作安全

- 熟悉急停操作
- 佩戴防护设备
- 保持工作区域整洁

---

## 技术支持

- GitHub Issues: https://github.com/DamienLee2017/AI_workspace/issues
- 电子邮件: (请在 GitHub 页面查找联系方式)

---

## 更新日志

### v1.0.0 (2024)

- 初始版本发布
- 支持 G 代码解析
- WiFi 远程控制
- Web 控制界面
- Telnet 连接
- OTA 无线更新
