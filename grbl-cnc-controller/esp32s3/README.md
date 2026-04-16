# ESP32-S3 WiFi CNC 控制器

基于 ESP32-S3 的高级 CNC 控制器，支持 WiFi 网络控制和 Web 界面。

---

## 特性

- **WiFi 网络控制** - 支持 AP 和 Station 双模式
- **Web 控制界面** - 浏览器实时控制
- **Telnet 支持** - 命令行远程控制
- **OTA 无线更新** - 无需连接 USB 即可更新固件
- **高性能** - 最高 100kHz 步进频率
- **实时状态** - WebSocket 推送位置和状态

---

## 硬件要求

| 配件 | 说明 |
|------|------|
| ESP32-S3 DevKitC-1 | 主控芯片 |
| CNC 屏蔽板 | GRBL 兼容 |
| 步进电机驱动 | A4988 / DRV8825 / TMC2208 |
| 限位开关 | 机械式或光学式 x6 |
| 电源 | 12V/24V |

---

## 引脚定义

```
ESP32-S3 Pinout:
├── GPIO1  → X Step
├── GPIO2  → X Dir
├── GPIO3  → Y Step
├── GPIO4  → Y Dir
├── GPIO5  → Z Step
├── GPIO6  → Z Dir
├── GPIO7  → Enable (低电平使能)
├── GPIO8  → X Limit Min
├── GPIO9  → X Limit Max
├── GPIO10 → Y Limit Min
├── GPIO11 → Y Limit Max
├── GPIO12 → Z Limit Min
├── GPIO13 → Z Limit Max
├── GPIO14 → Spindle PWM
├── GPIO15 → Probe
├── GPIO16 → Spindle Enable
└── GND    → GND
```

详细接线图请参考 [WIRING.md](WIRING.md)

---

## 配置 WiFi

编辑 `Config.h` 修改以下参数：

```cpp
// WiFi 模式选择
#define WIFI_MODE_AP  // AP 模式（默认）
// #define WIFI_MODE_STA  // Station 模式

// AP 模式配置
#define AP_SSID "CNC_Controller_XXXX"
#define AP_PASSWORD "12345678"

// Station 模式配置
#define STA_SSID "YourWiFiSSID"
#define STA_PASSWORD "YourWiFiPassword"
```

---

## 上传固件

### 方式一：Arduino IDE

1. 安装 ESP32-S3 开发板支持
   - 打开 Arduino IDE → 文件 → 首选项
   - 在"附加开发板管理器网址"添加：
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - 工具 → 开发板 → 开发板管理器 → 安装 ESP32

2. 选择开发板
   - 工具 → 开发板 → ESP32 Arduino → ESP32S3 Dev Module

3. 配置参数
   ```
   Upload Speed: 921600
   CPU Frequency: 240MHz
   Flash Size: 4GB (或你的实际大小)
   Partition Scheme: Default 4MB with spiffs
   ```

4. 上传代码
   - 编辑 Config.h 中的 WiFi 设置
   - 点击上传按钮

### 方式二：PlatformIO

```bash
cd esp32s3/grbl-controller-wifi
pio run --target upload
```

---

## 连接控制

### AP 模式（默认）

ESP32-S3 会创建 WiFi 热点：

```
SSID: CNC_Controller_XXXX
Password: 12345678
IP Address: 192.168.4.1
```

### Station 模式

连接到您的路由器：

```
IP Address: 从路由器 DHCP 获取（可在串口监视器查看）
```

---

## 控制方式

### Web 控制界面

在浏览器中访问：`http://<ESP32_IP>`

功能：
- 实时位置显示
- JOG 手轮控制（精细/粗略）
- 速度调节
- 状态监控
- 紧急停止

### Telnet 控制

```bash
telnet <ESP32_IP> 23
```

常用命令：
```
G0 X10 Y10    # 快速移动
G1 X50 Y30 F100  # 线性进给
M3 S1000      # 主轴启动
M5            # 主轴停止
$h            # 归零
$?            # 状态报告
```

### 串口控制

通过 USB 连接串口，使用与 Arduino 版本相同的 G 代码命令。

---

## Web 界面功能

| 功能 | 说明 |
|------|------|
| 位置显示 | 实时显示 X/Y/Z 坐标 |
| 手轮控制 | 点击或拖动移动轴 |
| 速度控制 | 滑块调节进给率 |
| 状态指示 | 运行/暂停/报警状态 |
| 限位显示 | 显示限位开关状态 |
| 急停按钮 | 立即停止所有运动 |

---

## 性能参数

| 参数 | 值 |
|------|------|
| 主频 | 240 MHz |
| 最大步率 | 100 kHz |
| WiFi 标准 | 802.11 b/g/n |
| 工作温度 | -40°C ~ 85°C |

---

## OTA 更新

通过 Web 界面更新固件：

1. 访问 `http://<ESP32_IP>/update`
2. 选择 `.bin` 文件
3. 点击上传

或使用 Arduino OTA：

```cpp
// 在 Config.h 中启用
#define ENABLE_OTA true
#define OTA_PASSWORD "your_ota_password"
```

---

## 故障排除

### WiFi 无法连接

- 确认密码正确
- 检查路由器是否支持 2.4GHz（ESP32-S3 不支持 5GHz）
- 检查信号强度

### Web 界面无法访问

- 确认设备已连接同一网络
- 检查防火墙设置
- 尝试直接访问 IP 地址

### 步进电机不工作

- 检查驱动板连接
- 确认使能信号电平
- 检查步进脉冲频率

### 串口无输出

- 检查 USB 线连接
- 确认正确的 COM 端口
- 尝试不同的波特率

---

## 高级配置

编辑 `Config.h`：

```cpp
// 步进电机设置
#define DEFAULT_STEP_WIDTH 5        // 步进脉冲宽度 (us)
#define DEFAULT_STEP_INTERVAL 50    // 步进间隔 (us)
#define DEFAULT_ACCELERATION 100    // 加速度 (mm/s²)

// 限位开关设置
#define LIMIT_SOFT_DISABLE true     // 软限位使能
#define SOFT_LIMITS {100, 100, 80}   // 软件限位范围

// 主轴设置
#define SPINDLE_MIN_RPM 0
#define SPINDLE_MAX_RPM 12000

// 串口设置
#define SERIAL_BAUD_RATE 115200
```

---

## 技术支持

- 提交 Issue: https://github.com/DamienLee2017/AI_workspace/issues
- 文档更新: https://github.com/DamienLee2017/AI_workspace/tree/main/grbl-cnc-controller/esp32s3

---

## 许可

MIT License - 详见项目根目录 LICENSE 文件
