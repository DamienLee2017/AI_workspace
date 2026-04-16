# ESP32-S3 WiFi 控制功能说明

本文档详细说明 ESP32-S3 版本 GRBL CNC 控制器的 WiFi 网络控制功能。

## 功能概述

ESP32-S3 版本支持通过 WiFi 网络进行远程控制，支持以下通信方式：

- **WebSocket** - 实时双向通信，适合控制界面
- **HTTP REST API** - 标准化 API 接口
- **Telnet** - 兼容传统串口协议

## WiFi 连接配置

### 方式一：使用配置文件

编辑 `esp32_s3/wifi_config.h`：

```cpp
// WiFi 配置
#define WIFI_SSID "你的WiFi名称"
#define WIFI_PASSWORD "你的WiFi密码"

// 静态 IP 配置（可选）
#define USE_STATIC_IP true
#define STATIC_IP 192, 168, 1, 100
#define GATEWAY 192, 168, 1, 1
#define SUBNET 255, 255, 255, 0
#define DNS 8, 8, 8, 8
```

### 方式二：通过 Web 配网

首次运行时，ESP32-S3 会创建热点：

1. 搜索 WiFi 网络 `GRBL-CNC-XXXX`
2. 连接后打开浏览器访问 `192.168.4.1`
3. 在配置页面输入 WiFi 凭据
4. 设备将自动重启并连接

### 方式三：AP 模式（热点模式）

```cpp
// 在 wifi_config.h 中启用 AP 模式
#define USE_AP_MODE true
#define AP_SSID "GRBL-CNC-Controller"
#define AP_PASSWORD "12345678"
```

设备将创建独立热点，可直接连接控制。

## 通信协议

### WebSocket

默认端口：**81**

连接地址：`ws://<ESP32_IP>:81`

#### 发送命令格式

```json
{
  "type": "command",
  "cmd": "G0 X10 Y10",
  "id": 1
}
```

#### 接收数据格式

```json
{
  "type": "response",
  "data": "ok",
  "id": 1
}
```

#### 状态更新

```json
{
  "type": "status",
  "data": {
    "state": "Idle",
    "pos": {"x": 0, "y": 0, "z": 0},
    "wco": {"x": 0, "y": 0, "z": 0},
    "buf": 15,
    "rx": 0
  }
}
```

### HTTP REST API

默认端口：**80**

#### 端点列表

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/status` | 获取控制器状态 |
| GET | `/api/position` | 获取当前位置 |
| POST | `/api/command` | 发送 G-code 命令 |
| GET | `/api/settings` | 获取 GRBL 设置 |
| POST | `/api/settings` | 修改设置 |
| GET | `/api/version` | 获取固件版本 |

#### 示例请求

**发送 G-code 命令：**

```bash
curl -X POST http://192.168.1.100/api/command \
  -H "Content-Type: application/json" \
  -d '{"cmd": "G0 X50 Y50"}'
```

**响应：**
```json
{
  "status": "ok",
  "response": "ok"
}
```

**获取状态：**

```bash
curl http://192.168.1.100/api/status
```

**响应：**
```json
{
  "state": "Run",
  "position": {"x": 25.5, "y": 10.0, "z": 0.0},
  "buffer": 12,
  "feed": 1000,
  "spindle": 0
}
```

### Telnet 协议

默认端口：**23**

使用兼容传统串口终端连接：

```bash
telnet 192.168.1.100 23
```

## Web 控制界面

设备内置 Web 服务器，可通过浏览器访问：

1. 打开浏览器
2. 输入 ESP32-S3 的 IP 地址
3. 进入 Web 控制界面

### 界面功能

- **实时状态显示** - 坐标、状态、进度
- **G-code 发送** - 命令输入和文件上传
- **手轮控制** - 手动移动轴
- **参数配置** - GRBL 参数设置
- **文件管理** - 上传/删除 G-code 文件

## 使用示例

### Python 控制示例

```python
import websocket
import json
import time

def on_message(ws, message):
    data = json.loads(message)
    print(f"收到: {data}")

def on_open(ws):
    # 发送命令
    ws.send(json.dumps({"type": "command", "cmd": "?", "id": 1}))
    time.sleep(0.5)
    ws.send(json.dumps({"type": "command", "cmd": "G0 X0 Y0", "id": 2}))
    time.sleep(0.5)
    ws.send(json.dumps({"type": "command", "cmd": "G1 Z-5 F100", "id": 3}))

# WebSocket 连接
ws = websocket.WebSocketApp(
    "ws://192.168.1.100:81",
    on_message=on_message,
    on_open=on_open
)
ws.run_forever()
```

### Node-RED 集成

在 Node-RED 中使用 HTTP 请求节点：

1. 添加 HTTP Request 节点
2. 配置 URL：`http://192.168.1.100/api/command`
3. Method：POST
4. Body：`{"cmd": "G0 X10"}`

## 故障排除

### 无法连接 WiFi

1. 检查 SSID 和密码是否正确
2. 确认 WiFi 信号强度
3. 检查路由器是否启用 2.4GHz（ESP32 不支持 5GHz）

### WebSocket 连接失败

1. 确认防火墙允许 WebSocket 端口
2. 检查 ESP32 IP 地址是否正确
3. 尝试刷新页面重新连接

### 延迟过高

1. 检查网络质量
2. 减少同时连接的客户端数量
3. 考虑使用有线网络连接

## 安全建议

### 网络隔离

- 建议将 CNC 控制器放在独立 VLAN
- 避免直接暴露在公网

### 访问控制

```cpp
// 启用连接密码验证
#define USE_PASSWORD true
#define ACCESS_PASSWORD "your_secure_password"
```

### HTTPS 配置

```cpp
// 启用 HTTPS（需要上传证书）
#define USE_HTTPS true
```

## 技术参数

| 参数 | 值 |
|------|-----|
| 默认端口 (WebSocket) | 81 |
| 默认端口 (HTTP) | 80 |
| 默认端口 (Telnet) | 23 |
| 最大连接数 | 4 |
| 心跳间隔 | 30 秒 |
| 命令队列深度 | 16 |

## 扩展功能

### OTA 无线更新

```cpp
// 启用 OTA 更新
#define ENABLE_OTA true
```

更新地址：`http://<ESP32_IP>/update`

### MQTT 支持

```cpp
// 启用 MQTT
#define ENABLE_MQTT true
#define MQTT_SERVER "mqtt://broker.example.com"
#define MQTT_TOPIC "cnc/controller"
```

## 相关信息

- [硬件接线说明](./hardware-wiring.md)
- [快速开始指南](./quick-start.md)
- [完整使用文档](./user-manual.md)
