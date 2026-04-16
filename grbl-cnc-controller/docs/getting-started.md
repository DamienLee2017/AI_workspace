# GRBL CNC 控制器快速开始指南

本指南将帮助您快速上手 GRBL CNC 控制器项目。

---

## 硬件准备

### Arduino 版本
- Arduino Uno/Nano (ATmega328P)
- CNC 步进电机驱动板 (A4988/DRV8825)
- 3 轴步进电机 (NEMA 17)
- 12V 电源适配器
- USB 数据线

### ESP32-S3 版本
- ESP32-S3-DevKitC-1
- CNC 步进电机驱动板 (A4988/DRV8825)
- 3 轴步进电机 (NEMA 17)
- 12V 电源适配器
- USB 数据线

---

## 软件安装

### 1. 安装 Arduino IDE
下载并安装 Arduino IDE (版本 1.8+ 或 2.x)

### 2. 安装 ESP32 开发板支持
在 Arduino IDE 中添加 ESP32 开发板：
- 打开 文件 > 首选项
- 在"附加开发板管理器网址"中添加：
  ```
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
  ```
- 打开 工具 > 开发板 > 开发板管理器
- 搜索并安装 "ESP32"

---

## Arduino 版本快速开始

### 接线图
```
Arduino        A4988/DRV8825
--------       -------------
A0 (X STEP)  → STEP
A1 (Y STEP)  → (如果使用双轴)
A2 (Z STEP)  → (如果使用三轴)
D2 (X DIR)   → DIR
D3 (Y DIR)   →
D4 (Z DIR)   →
D5 (X ENABLE)→ EN
GND          → GND
```

### 上传固件
1. 打开 `arduino/grbl_cnc_controller/grbl_cnc_controller.ino`
2. 选择 工具 > 开发板 > Arduino Uno
3. 选择对应的端口
4. 点击上传按钮

### 测试连接
```bash
# 使用串口监视器或以下命令测试
stty -F /dev/ttyUSB0 115200
cat /dev/ttyUSB0
```
发送 `$I` 查看固件信息，发送 `$$` 查看设置参数。

---

## ESP32-S3 版本快速开始

### 接线图
```
ESP32-S3      A4988/DRV8825
--------      -------------
GPIO4  (X STEP) → STEP
GPIO5  (X DIR)  → DIR
GPIO6  (X ENABLE)→ EN
GPIO7  (Y STEP) → STEP
GPIO8  (Y DIR)  → DIR
GPIO9  (Y ENABLE)→ EN
GPIO10 (Z STEP) → STEP
GPIO11 (Z DIR)  → DIR
GPIO12 (Z ENABLE)→ EN
GND            → GND
```

### 上传固件
1. 打开 `esp32s3/wifi_cnc_controller/wifi_cnc_controller.ino`
2. 选择 工具 > 开发板 > ESP32S3 Dev Module
3. 配置分区方案: Huge APP (3MB APP)
4. 选择对应的端口
5. 点击上传按钮

### WiFi 连接
默认配置：
- SSID: `CNC_Controller`
- 密码: `12345678`
- 默认 IP: `192.168.4.1`

首次使用后，可在代码中修改 WiFi 配置：
```cpp
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";
```

---

## 使用 Web 控制界面

### 连接方式
- **串口版**: 通过 Arduino IDE 串口监视器连接，波特率 115200
- **WiFi版**: 连接到控制器热点，或配置连接现有 WiFi 网络后访问 IP 地址

### 基本 G 代码命令

| 命令 | 功能 |
|------|------|
| `G0 X10 Y10` | 快速移动到坐标 (10, 10) |
| `G1 X50 Y50 F500` | 以 500mm/min 进给速度移动 |
| `G28` | 返回原点 |
| `M3 S1000` | 主轴启动 (速度 1000) |
| `M5` | 主轴停止 |
| `$H` | 执行归零 |
| `$$` | 查看所有设置 |
| `$X` | 解锁报警 |

### 常用设置
```bash
$0=10    # 脉冲宽度 (微秒)
$1=25    # 空闲关闭延迟
$2=0     # 步进脉冲反转掩码
$3=0     # 方向端口反转掩码
$4=0     # 步进使能反转
$10=1    # 状态报告掩码
$30=1000 # 最大主轴速度 RPM
$31=0    # 最小主轴速度 RPM
$32=0    # 激光模式
$100=800 # X 轴脉冲每毫米
$101=800 # Y 轴脉冲每毫米
$102=800 # Z 轴脉冲每毫米
$110=1000 # X 轴最大进给速度
$111=1000 # Y 轴最大进给速度
$112=500  # Z 轴最大进给速度
```

---

## 常见问题排查

### 步进电机不转
1. 检查电源电压是否 12V
2. 检查驱动板电流设置
3. 确认接线牢固
4. 检查 ENABLE 引脚电平

### 串口无响应
1. 确认波特率设置 115200
2. 检查 USB 线是否支持数据传输
3. 尝试重新插拔

### WiFi 无法连接
1. 确认密码正确
2. 检查 ESP32 是否在配网模式
3. 确认设备未超出 WiFi 范围

---

## 下一步

- 查看完整文档: `docs/`
- 查看接线详解: `docs/wiring-diagrams.md`
- 查看 API 参考: `docs/api-reference.md`
- 查看硬件规格: `docs/hardware-specs.md`

---

## 获取帮助

如遇问题，请提交 Issue 到 GitHub 仓库。
