/**
 * ESP32-S3 GRBL CNC Controller Configuration
 * 
 * 配置文件 - 包含所有可调节参数
 */

#ifndef CONFIG_H
#define CONFIG_H

// ==================== WiFi 配置 ====================
#define WIFI_SSID_PREFIX "CNC_Controller_"
#define WIFI_PASSWORD "12345678"
#define WIFI_CHANNEL 1
#define WIFI_MAX_CONNECTIONS 4

// AP模式 IP配置
#define AP_IP_ADDRESS "192.168.4.1"
#define AP_GATEWAY "192.168.4.1"
#define AP_SUBNET "255.255.255.0"

// ==================== 服务器配置 ====================
#define WEB_SERVER_PORT 80
#define TELNET_PORT 23
#define WS_PORT 81

// ==================== 串口配置 ====================
#define SERIAL_BAUD_RATE 115200
#define SERIAL_TIMEOUT 1000

// ==================== 步进电机引脚定义 ====================
// X轴
#define X_STEP_PIN 1
#define X_DIR_PIN 2
#define X_ENABLE_PIN 7
#define X_LIMIT_PIN 8

// Y轴
#define Y_STEP_PIN 3
#define Y_DIR_PIN 4
#define Y_ENABLE_PIN 7
#define Y_LIMIT_PIN 9

// Z轴
#define Z_STEP_PIN 5
#define Z_DIR_PIN 6
#define Z_ENABLE_PIN 7
#define Z_LIMIT_PIN 10

// ==================== 主轴与传感器引脚 ====================
#define SPINDLE_PWM_PIN 11
#define SPINDLE_ENABLE_PIN -1  // 未使用
#define PROBE_PIN 12

// ==================== 运动参数 ====================
// 默认脉冲频率 (Hz)
#define DEFAULT_STEP_FREQ 10000  // 10kHz

// 加速度设置 (mm/s²)
#define DEFAULT_ACCELERATION 500.0

// 最大速度和进给率 (mm/min)
#define DEFAULT_FEED_RATE 1000.0
#define DEFAULT_RAPID_RATE 3000.0

// ==================== 轴行程限制 ====================
#define X_MAX_TRAVEL 300.0  // mm
#define Y_MAX_TRAVEL 300.0  // mm
#define Z_MAX_TRAVEL 100.0  // mm

#define X_HOMING_CYCLE 1
#define Y_HOMING_CYCLE 1
#define Z_HOMING_CYCLE 1

// ==================== 微步设置 ====================
// 步进电机微步倍数
#define MICROSTEPS 16  // 16细分

// 丝杠导程 (mm/rev)
#define X_LEAD_SCREW_PITCH 8.0
#define Y_LEAD_SCREW_PITCH 8.0
#define Z_LEAD_SCREW_PITCH 4.0

// 电机每转步数 (200步/转 * 微分)
#define STEPS_PER_REVOLUTION 200

// ==================== 限位开关设置 ====================
#define LIMIT_PINS_ACTIVE HIGH  // 高电平触发
#define HOMING_DIR_INVERT_MASK 0x00  // 归零方向掩码
#define HOMING_FEED_RATE 200.0  // 归零进给率

// ==================== 主轴设置 ====================
#define SPINDLE_PWM_FREQ 1000  // PWM频率 (Hz)
#define SPINDLE_MIN_RPM 0
#define SPINDLE_MAX_RPM 12000
#define DEFAULT_SPINDLE_RPM 3000

// ==================== 冷却液设置 ====================
#define COOLANT_FLOOD_PIN -1  // 未定义
#define COOLANT_MIST_PIN -1   // 未定义

// ==================== 缓冲区设置 ====================
#define RX_BUFFER_SIZE 256
#define TX_BUFFER_SIZE 256
#define BLOCK_BUFFER_SIZE 16

// ==================== 状态报告设置 ====================
#define STATUS_REPORT_MASK 0xFF  // 完整状态报告
#define CYCLE_START_REPORT true
#define OVERRIDE_RATE_REPORT true

// ==================== FreeRTOS 任务配置 ====================
#define MOTION_TASK_PRIORITY 2
#define MOTION_TASK_STACK_SIZE 4096
#define NETWORK_TASK_PRIORITY 1
#define NETWORK_TASK_STACK_SIZE 4096
#define STATUS_TASK_PRIORITY 1
#define STATUS_TASK_STACK_SIZE 2048

// ==================== 调试设置 ====================
#define DEBUG_MODE false
#define DEBUG_PORT Serial

// ==================== 版本信息 ====================
#define VERSION "1.0.0"
#define BUILD_DATE __DATE__

#endif // CONFIG_H
