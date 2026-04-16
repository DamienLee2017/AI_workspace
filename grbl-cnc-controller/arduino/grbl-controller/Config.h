/**
 * GRBL CNC Controller Configuration
 * Arduino 版本配置文件
 * 
 * 本配置文件定义了所有硬件参数、运动参数和系统设置
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================================================
// 硬件平台选择
// ============================================================
#define HARDWARE_PLATFORM "Arduino"
#define FIRMWARE_VERSION "1.0.0"

// ============================================================
// 串口通信设置
// ============================================================
#define SERIAL_BAUD_RATE 115200          // 串口通信波特率
#define SERIAL_TIMEOUT 1000              // 串口超时时间(ms)
#define COMMAND_BUFFER_SIZE 256          // 命令缓冲区大小
#define STATUS_REPORT_INTERVAL 100       // 状态报告间隔(ms)

// ============================================================
// 步进电机引脚定义
// ============================================================

// X轴步进电机
#define X_STEP_PIN 2                     // X轴步进脉冲引脚
#define X_DIR_PIN 3                      // X轴方向引脚
#define X_ENABLE_PIN 8                   // X轴使能引脚
#define X_LIMIT_PIN 9                    // X轴限位开关引脚

// Y轴步进电机
#define Y_STEP_PIN 4                     // Y轴步进脉冲引脚
#define Y_DIR_PIN 5                      // Y轴方向引脚
#define Y_ENABLE_PIN 8                   // Y轴使能引脚(共享)
#define Y_LIMIT_PIN 10                   // Y轴限位开关引脚

// Z轴步进电机
#define Z_STEP_PIN 6                     // Z轴步进脉冲引脚
#define Z_DIR_PIN 7                      // Z轴方向引脚
#define Z_ENABLE_PIN 8                   // Z轴使能引脚(共享)
#define Z_LIMIT_PIN 11                   // Z轴限位开关引脚

// ============================================================
// 主轴控制引脚
// ============================================================
#define SPINDLE_PWM_PIN 3                // 主轴PWM控制引脚
#define SPINDLE_ENABLE_PIN 12            // 主轴使能引脚
#define SPINDLE_MIN_RPM 0                // 主轴最小转速
#define SPINDLE_MAX_RPM 12000            // 主轴最大转速

// ============================================================
// 限位开关设置
// ============================================================
#define LIMIT_SWITCH_DEBOUNCE 50          // 限位开关消抖时间(ms)
#define LIMIT_PULLUP_ENABLED true        // 启用内部上拉电阻

// 限位开关极性 (true = 常开, false = 常闭)
#define X_LIMIT_INVERT false
#define Y_LIMIT_INVERT false
#define Z_LIMIT_INVERT false

// ============================================================
// 运动参数设置
// ============================================================

// 默认进给率和转速
#define DEFAULT_FEED_RATE 1000.0         // 默认进给率 (mm/min)
#define DEFAULT_RAPID_RATE 3000.0       // 默认快速移动速率 (mm/min)
#define DEFAULT_SPINDLE_SPEED 3000       // 默认主轴转速 (RPM)

// 轴行程限制 (mm)
#define X_MAX_TRAVEL 300.0               // X轴最大行程
#define Y_MAX_TRAVEL 300.0               // Y轴最大行程
#define Z_MAX_TRAVEL 100.0               // Z轴最大行程

// 轴软限位 (设置为最大行程的百分比)
#define SOFT_LIMIT_PERCENTAGE 0.98

// 步进电机参数 (根据实际硬件配置)
#define STEPS_PER_MM_X 80.0              // X轴每毫米步数 (根据丝杆导程计算)
#define STEPS_PER_MM_Y 80.0              // Y轴每毫米步数
#define STEPS_PER_MM_Z 400.0             // Z轴每毫米步数 (通常Z轴使用更小导程)

// 微步设置 (1, 2, 4, 8, 16)
#define MICROSTEPS 16                    // 驱动器微步设置

// 加速度和速度参数
#define DEFAULT_ACCELERATION 500.0       // 默认加速度 (mm/s^2)
#define MAX_FEED_RATE_X 3000.0           // X轴最大进给率 (mm/min)
#define MAX_FEED_RATE_Y 3000.0           // Y轴最大进给率 (mm/min)
#define MAX_FEED_RATE_Z 500.0            // Z轴最大进给率 (mm/min)

// 归零参数
#define HOMING_FEED_RATE 200.0           // 归零进给率 (mm/min)
#define HOMING_CYCLE_DELAY 200           // 归零循环延迟 (ms)
#define HOMING_LATCH_DISTANCE 5.0        // 归零碰撞距离 (mm)

// ============================================================
// 脉冲参数
// ============================================================
#define STEP_PULSE_WIDTH 10              // 步进脉冲宽度 (微秒)
#define STEP_MIN_DELAY 5                 // 步进最小间隔 (微秒)

// ============================================================
// 原点/工作坐标系
// ============================================================
#define MACHINE_HOME_X 0.0              // 机械原点 X
#define MACHINE_HOME_Y 0.0              // 机械原点 Y
#define MACHINE_HOME_Z 0.0              // 机械原点 Z

// ============================================================
// 探针设置 (可选)
// ============================================================
#define PROBE_PIN A0                     // 探针输入引脚
#define PROBE_DEBOUNCE 50                // 探针消抖时间 (ms)
#define PROBE_FEED_RATE 50.0            // 探针进给率 (mm/min)

// ============================================================
// 冷却液控制 (可选)
// ============================================================
#define COOLANT_FLOOD_PIN 4              // 乳化液冷却引脚
#define COOLANT_MIST_PIN 5              // 雾化冷却引脚

// ============================================================
// 状态指示LED
// ============================================================
#define STATUS_LED_PIN 13               // 状态指示LED引脚
#define ERROR_LED_PIN LED_BUILTIN        // 错误指示LED

// LED闪烁模式
#define LED_BLINK_RATE 500               // LED闪烁间隔 (ms)

// ============================================================
// 急停设置
// ============================================================
#define ESTOP_PIN 7                      // 急停按钮引脚
#define ESTOP_DEBOUNCE 20                // 急停消抖时间 (ms)

// 急停行为
#define ESTOP_FEEDHOLD true              // 急停是否触发进给保持
#define ESTOP spindle_terminate true     // 急停是否停止主轴

// ============================================================
// 性能优化
// ============================================================
#define BLOCK_BUFFER_SIZE 16             // 运动块缓冲区大小
#define LINE_BUFFER_SIZE 256             // 行解析缓冲区大小
#define ASCII_RESPONSE true              // 启用ASCII响应 (可节省内存)

// ============================================================
// 调试设置
// ============================================================
#define DEBUG_MODE false                 // 调试模式
#define DEBUG_SERIAL if(DEBUG_MODE) Serial
#define STATUS_VERBOSITY 1               // 状态报告详细程度 (0-2)

// ============================================================
// 兼容性设置
// ============================================================
#define GRBL_COMPATIBLE true             // GRBL兼容模式
#define ECHO_COMMAND false               // 回显接收到的命令

// ============================================================
// 校准和补偿
// ============================================================
#define BACKLASH_COMPENSATION_X 0.0      // X轴背隙补偿 (mm)
#define BACKLASH_COMPENSATION_Y 0.0      // Y轴背隙补偿 (mm)
#define BACKLASH_COMPENSATION_Z 0.0      // Z轴背隙补偿 (mm)

// ============================================================
// 系统限制
// ============================================================
#define MAX_TRAVEL_X (X_MAX_TRAVEL * SOFT_LIMIT_PERCENTAGE)
#define MAX_TRAVEL_Y (Y_MAX_TRAVEL * SOFT_LIMIT_PERCENTAGE)
#define MAX_TRAVEL_Z (Z_MAX_TRAVEL * SOFT_LIMIT_PERCENTAGE)

// ============================================================
// 辅助功能宏
// ============================================================

// 引脚操作宏
#define ENABLE_STEPPERS() digitalWrite(X_ENABLE_PIN, LOW)
#define DISABLE_STEPPERS() digitalWrite(X_ENABLE_PIN, HIGH)

// 限位检查宏
#define CHECK_LIMITS() (digitalRead(X_LIMIT_PIN) == HIGH || \
                        digitalRead(Y_LIMIT_PIN) == HIGH || \
                        digitalRead(Z_LIMIT_PIN) == HIGH)

// 急停检查宏
#define CHECK_ESTOP() (digitalRead(ESTOP_PIN) == LOW)

// 计算脉冲数
#define MM_TO_STEPS_X(mm) ((mm) * STEPS_PER_MM_X)
#define MM_TO_STEPS_Y(mm) ((mm) * STEPS_PER_MM_Y)
#define MM_TO_STEPS_Z(mm) ((mm) * STEPS_PER_MM_Z)
#define STEPS_TO_MM_X(steps) ((steps) / STEPS_PER_MM_X)
#define STEPS_TO_MM_Y(steps) ((steps) / STEPS_PER_MM_Y)
#define STEPS_TO_MM_Z(steps) ((steps) / STEPS_PER_MM_Z)

#endif // CONFIG_H
