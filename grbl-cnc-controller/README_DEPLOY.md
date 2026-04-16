# 部署说明

## 关于本项目

本项目是 **GRBL CNC 控制器固件**，包含两个版本：
- **Arduino 版本** - 适用于 Arduino Uno/Nano/Mega
- **ESP32-S3 版本** - 支持 WiFi 网络控制

## 使用方法

### Arduino 版本

1. 使用 Arduino IDE 打开 `arduino/grbl-controller/grbl-controller.ino`
2. 选择开发板：Tools > Board > Arduino Uno/Nano/Mega
3. 选择端口：Tools > Port > (您的端口)
4. 点击上传按钮

### ESP32-S3 版本

1. 使用 Arduino IDE 打开 `esp32s3/grbl-controller-wifi/grbl-controller-wifi.ino`
2. 安装 ESP32 开发板支持（如果未安装）：
   - 文件 > 首选项 > 附加开发板管理器网址：添加 `https://dl.espressif.com/dl/package_esp32_index.json`
   - 工具 > 开发板 > 开发板管理器 > 安装 ESP32
3. 选择开发板：Tools > Board > ESP32S3 Dev Module
4. 配置 WiFi（编辑 `Config.h` 中的 `WIFI_SSID` 和 `WIFI_PASSWORD`）
5. 点击上传按钮

## 硬件接线

请参考以下文档：
- Arduino 版本：`arduino/WIRING.md`
- ESP32-S3 版本：`esp32s3/WIRING.md`

## G代码支持

请参考：`docs/gcode-reference.md`

## GitHub 仓库

```bash
git clone https://github.com/DamienLee2017/AI_workspace.git
cd AI_workspace
```

本项目位于仓库根目录 `grbl-cnc-controller/` 下。
