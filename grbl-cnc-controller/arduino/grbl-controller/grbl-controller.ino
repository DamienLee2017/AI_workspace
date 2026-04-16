/**
 * GRBL CNC Controller - Arduino Version
 * 开源 G 代码 CNC 控制器，支持 Arduino Uno/Nano/Mega
 * 
 * 作者: DamienLee2017
 * 许可证: MIT
 * 
 * 功能特性:
 * - G 代码解析与执行
 * - 三轴步进电机控制 (X/Y/Z)
 * - 串口通信
 * - 限位开关保护
 * - 原点设置与归零
 * - 急停功能
 */

#include "Config.h"

// ==================== 全局变量定义 ====================

// 运动参数
volatile long target_steps[3] = {0, 0, 0};      // 目标位置（步数）
volatile long current_steps[3] = {0, 0, 0};     // 当前位置（步数）
volatile long home_position[3] = {0, 0, 0};    // 原点位置

// 速度控制
float feed_rate = DEFAULT_FEED_RATE;           // 进给率 (mm/min)
float rapid_rate = DEFAULT_RAPID_RATE;         // 快速移动速率
float current_feed = 0;                         // 当前进给率

// 坐标系统
bool absolute_mode = true;                     // 绝对坐标模式
volatile float work_coords[3] = {0, 0, 0};     // 工件坐标系
volatile float machine_coords[3] = {0, 0, 0}; // 机械坐标系

// 状态标志
volatile bool is_running = false;              // 运行状态
volatile bool is_paused = false;               // 暂停状态
volatile bool is_homing = false;               // 归零状态
volatile bool soft_reset = false;              // 软复位标志
volatile bool alarm_mode = false;              // 报警模式

// 主轴控制
volatile bool spindle_on = false;              // 主轴状态
volatile int spindle_speed = 0;                  // 主轴速度
volatile int spindle_pwm = 0;                  // PWM 值

// 限位开关
volatile bool limit_x_min = false, limit_x_max = false;
volatile bool limit_y_min = false, limit_y_max = false;
volatile bool limit_z_min = false, limit_z_max = false;

// G 代码参数
float gcode_x = 0, gcode_y = 0, gcode_z = 0;
float gcode_f = 0, gcode_s = 0;
int gcode_g = 0, gcode_m = 0;

// 命令缓冲
char command_buffer[COMMAND_BUFFER_SIZE];
byte buffer_index = 0;

// 运动队列
typedef struct {
  long steps[3];
  float start_pos[3];
  float end_pos[3];
  float rate;
  bool dir[3];
  bool active;
  float remaining;
} move_t;

move_t current_move;
move_t next_move;

// 定时器变量
volatile unsigned long step_pulse_start = 0;
volatile bool step_pulse_active = false;

// ==================== 引脚定义 ====================

// 步进电机引脚
const int STEP_PINS[3] = {X_STEP_PIN, Y_STEP_PIN, Z_STEP_PIN};
const int DIR_PINS[3] = {X_DIR_PIN, Y_DIR_PIN, Z_DIR_PIN};

// 限位开关引脚
const int LIMIT_PINS[3][2] = {
  {X_LIMIT_MIN_PIN, X_LIMIT_MAX_PIN},
  {Y_LIMIT_MIN_PIN, Y_LIMIT_MAX_PIN},
  {Z_LIMIT_MIN_PIN, Z_LIMIT_MAX_PIN}
};

// 方向掩码
const bool DIR_INVERT[3] = {X_DIR_INVERT, Y_DIR_INVERT, Z_DIR_INVERT};
const bool STEP_INVERT[3] = {X_STEP_INVERT, Y_STEP_INVERT, Z_STEP_INVERT};

// ==================== 初始化函数 ====================

void setup() {
  // 初始化串口
  Serial.begin(SERIAL_BAUD_RATE);
  while (!Serial && millis() < 5000);  // 等待串口连接
  
  // 初始化引脚
  initPins();
  
  // 初始化定时器
  initTimer();
  
  // 初始化运动控制
  initMotion();
  
  // 等待系统稳定
  delay(100);
  
  // 发送启动信息
  printStartupMessage();
  
  // 归位完成
  reportStatus();
}

void initPins() {
  // 设置步进电机引脚为输出
  for (int i = 0; i < 3; i++) {
    pinMode(STEP_PINS[i], OUTPUT);
    pinMode(DIR_PINS[i], OUTPUT);
    digitalWrite(STEP_PINS[i], STEP_INVERT[i] ? HIGH : LOW);
    digitalWrite(DIR_PINS[i], DIR_INVERT[i] ? HIGH : LOW);
  }
  
  // 设置使能引脚
  pinMode(ENABLE_PIN, OUTPUT);
  digitalWrite(ENABLE_PIN, ENABLE_INVERT ? LOW : HIGH);  // 初始禁用
  
  // 设置限位开关引脚为输入（带上拉电阻）
  for (int i = 0; i < 3; i++) {
    pinMode(LIMIT_PINS[i][0], INPUT_PULLUP);
    pinMode(LIMIT_PINS[i][1], INPUT_PULLUP);
  }
  
  // 设置主轴 PWM 引脚
  pinMode(SPINDLE_PWM_PIN, OUTPUT);
  analogWrite(SPINDLE_PWM_PIN, 0);
  
  // 设置急停引脚
  pinMode(ESTOP_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(ESTOP_PIN), emergencyStop, FALLING);
  
  // 设置限位开关中断
  attachInterrupt(digitalPinToInterrupt(X_LIMIT_MIN_PIN), limitCheckX, CHANGE);
  attachInterrupt(digitalPinToInterrupt(Y_LIMIT_MIN_PIN), limitCheckY, CHANGE);
  attachInterrupt(digitalPinToInterrupt(Z_LIMIT_MIN_PIN), limitCheckZ, CHANGE);
}

void initTimer() {
  // 配置定时器2用于步进脉冲生成
  TCCR2A = 0;
  TCCR2B = 0;
  TCNT2 = 0;
  
  // 设置比较匹配寄存器
  OCR2A = 200;  // 约 40kHz
  
  // 启用定时器比较中断
  TIMSK2 |= (1 << OCIE2A);
  
  // 启动定时器，预分频 1
  TCCR2B |= (1 << WGM12) | (1 << CS10);
}

void initMotion() {
  // 禁用所有轴
  disableMotors();
  
  // 初始化运动状态
  memset(&current_move, 0, sizeof(move_t));
  memset(&next_move, 0, sizeof(next_move));
  
  // 设置默认进给率
  current_feed = feed_rate;
}

// ==================== 主循环 ====================

void loop() {
  // 检查急停
  if (soft_reset) {
    handleSoftReset();
    return;
  }
  
  // 检查限位开关
  checkLimits();
  
  // 处理串口命令
  processSerial();
  
  // 执行运动
  executeMotion();
  
  // 更新状态
  updateStatus();
}

// ==================== 串口通信 ====================

void processSerial() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    
    if (c == '\r' || c == '\n') {
      if (buffer_index > 0) {
        command_buffer[buffer_index] = '\0';
        processCommand(command_buffer);
        buffer_index = 0;
      }
    } else if (buffer_index < COMMAND_BUFFER_SIZE - 1) {
      command_buffer[buffer_index++] = c;
    }
  }
}

void processCommand(char* cmd) {
  // 跳过空白字符
  while (*cmd == ' ' || *cmd == '\t') cmd++;
  
  // 空命令
  if (*cmd == '\0') return;
  
  // 解析并执行命令
  if (cmd[0] == 'G') {
    parseGCmd(cmd);
  } else if (cmd[0] == 'M') {
    parseMCmd(cmd);
  } else if (cmd[0] == '$') {
    parseSystemCmd(cmd);
  } else if (cmd[0] == 'X') {
    parseJogCmd(cmd);
  } else if (strcmp(cmd, "?") == 0) {
    reportStatus();
  } else if (strcmp(cmd, "~") == 0) {
    resumeJob();
  } else if (strcmp(cmd, "!") == 0) {
    pauseJob();
  } else if (strcmp(cmd, "RST") == 0) {
    softReset();
  } else if (strcmp(cmd, "H") == 0 || strcmp(cmd, "$H") == 0) {
    startHoming();
  } else if (strcmp(cmd, "HOME") == 0) {
    startHoming();
  } else if (strncmp(cmd, "G28", 3) == 0) {
    goToHome();
  } else {
    // 未知命令
    Serial.println("error:Unsupported command");
  }
}

void parseGCmd(char* cmd) {
  cmd++;  // 跳过 'G'
  int g_code = atoi(cmd);
  
  // 提取参数
  char* ptr = cmd;
  gcode_x = NAN; gcode_y = NAN; gcode_z = NAN;
  gcode_f = NAN; gcode_s = NAN;
  
  while (*ptr) {
    if (*ptr == 'X' || *ptr == 'x') {
      gcode_x = atof(ptr + 1);
    } else if (*ptr == 'Y' || *ptr == 'y') {
      gcode_y = atof(ptr + 1);
    } else if (*ptr == 'Z' || *ptr == 'z') {
      gcode_z = atof(ptr + 1);
    } else if (*ptr == 'F' || *ptr == 'f') {
      gcode_f = atof(ptr + 1);
    } else if (*ptr == 'S' || *ptr == 's') {
      gcode_s = atof(ptr + 1);
    }
    ptr++;
  }
  
  switch (g_code) {
    case 0:  // G0 - 快速移动
      executeRapidMove();
      break;
    case 1:  // G1 - 线性进给
      executeLinearMove();
      break;
    case 4:  // G4 - 延时
      executeDwell();
      break;
    case 28:  // G28 - 归零
      goToHome();
      break;
    case 90:  // G90 - 绝对坐标
      absolute_mode = true;
      Serial.println("ok");
      break;
    case 91:  // G91 - 相对坐标
      absolute_mode = false;
      Serial.println("ok");
      break;
    default:
      Serial.println("error:Unsupported G code");
  }
}

void parseMCmd(char* cmd) {
  cmd++;  // 跳过 'M'
  int m_code = atoi(cmd);
  
  switch (m_code) {
    case 0:  // M0 - 程序停止
    case 1:  // M1 - 程序暂停
      pauseJob();
      Serial.println("ok");
      break;
    case 3:  // M3 - 主轴正转
      spindle_on = true;
      if (!isnan(gcode_s)) {
        spindle_speed = constrain((int)gcode_s, 0, 10000);
        spindle_pwm = map(spindle_speed, 0, 10000, 0, 255);
      }
      analogWrite(SPINDLE_PWM_PIN, spindle_pwm);
      Serial.println("ok");
      break;
    case 5:  // M5 - 主轴停止
      spindle_on = false;
      spindle_speed = 0;
      analogWrite(SPINDLE_PWM_PIN, 0);
      Serial.println("ok");
      break;
    case 30:  // M30 - 程序结束
      spindle_on = false;
      analogWrite(SPINDLE_PWM_PIN, 0);
      disableMotors();
      Serial.println("ok");
      break;
    default:
      Serial.println("error:Unsupported M code");
  }
}

void parseSystemCmd(char* cmd) {
  if (strcmp(cmd, "$") == 0 || strcmp(cmd, "$$") == 0) {
    // 显示所有设置
    printSettings();
  } else if (cmd[1] == 'H') {
    startHoming();
  } else if (cmd[1] == 'X' && cmd[2] == '=') {
    // 设置 X 轴参数
    parseSetting(cmd);
  } else if (strcmp(cmd, "$SL") == 0) {
    // 状态查询
    reportStatus();
  } else if (strcmp(cmd, "$I") == 0) {
    // 版本信息
    Serial.println("Grbl 1.1f ['$' for help]");
  } else {
    Serial.println("error:Unknown system command");
  }
}

void parseJogCmd(char* cmd) {
  // JOG 命令格式: X10 Y20 F100
  char* ptr = cmd;
  gcode_x = NAN; gcode_y = NAN; gcode_z = NAN;
  gcode_f = NAN;
  
  while (*ptr) {
    if (*ptr == 'X' || *ptr == 'x') {
      gcode_x = atof(ptr + 1);
    } else if (*ptr == 'Y' || *ptr == 'y') {
      gcode_y = atof(ptr + 1);
    } else if (*ptr == 'Z' || *ptr == 'z') {
      gcode_z = atof(ptr + 1);
    } else if (*ptr == 'F' || *ptr == 'f') {
      gcode_f = atof(ptr + 1);
    }
    ptr++;
  }
  
  executeJogMove();
}

// ==================== 运动控制 ====================

void executeRapidMove() {
  enableMotors();
  
  // 使用快速移动速率
  float rate = rapid_rate;
  if (!isnan(gcode_f)) rate = gcode_f;
  
  // 执行移动
  executeMove(rate, true);
}

void executeLinearMove() {
  enableMotors();
  
  // 更新进给率
  if (!isnan(gcode_f)) {
    feed_rate = constrain(gcode_f, MIN_FEED_RATE, MAX_FEED_RATE);
  }
  
  // 执行移动
  executeMove(feed_rate, false);
}

void executeJogMove() {
  enableMotors();
  
  float rate = feed_rate;
  if (!isnan(gcode_f)) rate = gcode_f;
  
  executeMove(rate, false);
}

void executeMove(float rate, bool rapid) {
  // 计算目标位置（转换为步数）
  float target_x = isnan(gcode_x) ? (absolute_mode ? work_coords[X_AXIS] : 0) : gcode_x;
  float target_y = isnan(gcode_y) ? (absolute_mode ? work_coords[Y_AXIS] : 0) : gcode_y;
  float target_z = isnan(gcode_z) ? (absolute_mode ? work_coords[Z_AXIS] : 0) : gcode_z;
  
  if (!absolute_mode) {
    target_x += work_coords[X_AXIS];
    target_y += work_coords[Y_AXIS];
    target_z += work_coords[Z_AXIS];
  }
  
  // 计算步数差
  long dx = (target_x - work_coords[X_AXIS]) * STEPS_PER_MM_X;
  long dy = (target_y - work_coords[Y_AXIS]) * STEPS_PER_MM_Y;
  long dz = (target_z - work_coords[Z_AXIS]) * STEPS_PER_MM_Z;
  
  // 设置运动参数
  current_move.steps[X_AXIS] = dx;
  current_move.steps[Y_AXIS] = dy;
  current_move.steps[Z_AXIS] = dz;
  current_move.start_pos[X_AXIS] = work_coords[X_AXIS];
  current_move.start_pos[Y_AXIS] = work_coords[Y_AXIS];
  current_move.start_pos[Z_AXIS] = work_coords[Z_AXIS];
  current_move.end_pos[X_AXIS] = target_x;
  current_move.end_pos[Y_AXIS] = target_y;
  current_move.end_pos[Z_AXIS] = target_z;
  current_move.rate = rate;
  current_move.active = true;
  
  // 设置方向
  current_move.dir[X_AXIS] = (dx >= 0) ^ DIR_INVERT[X_AXIS];
  current_move.dir[Y_AXIS] = (dy >= 0) ^ DIR_INVERT[Y_AXIS];
  current_move.dir[Z_AXIS] = (dz >= 0) ^ DIR_INVERT[Z_AXIS];
  
  // 计算最大步数
  long max_steps = max(abs(dx), max(abs(dy), abs(dz)));
  current_move.remaining = max_steps;
  
  // 启动定时器中断
  is_running = true;
  
  // 计算步间隔
  unsigned long step_interval = calculateStepInterval(rate, dx, dy, dz);
  OCR2A = constrain(step_interval, MIN_STEP_INTERVAL, MAX_STEP_INTERVAL);
}

unsigned long calculateStepInterval(float rate, long dx, long dy, long dz) {
  // 计算总距离 (mm)
  float distance = sqrt(
    sq((float)dx / STEPS_PER_MM_X) + 
    sq((float)dy / STEPS_PER_MM_Y) + 
    sq((float)dz / STEPS_PER_MM_Z)
  );
  
  if (distance == 0) return MAX_STEP_INTERVAL;
  
  // 计算时间 (ms)
  float time_ms = (distance / rate) * 60000.0;
  
  // 计算步数
  long steps = max(abs(dx), max(abs(dy), abs(dz)));
  
  if (steps == 0) return MAX_STEP_INTERVAL;
  
  // 计算每次脉冲间隔
  return max(1UL, (unsigned long)(time_ms / steps));
}

void executeMotion() {
  // 运动由定时器中断处理
}

void goToHome() {
  enableMotors();
  is_homing = true;
  
  // 简化的归零序列：移动到限位开关
  float home_rate = rapid_rate * 0.5;
  
  // Z 轴先归零
  gcode_z = 0;
  executeMove(home_rate, true);
  waitForMoveComplete();
  
  // X 轴归零
  gcode_x = 0;
  gcode_y = 0;
  executeMove(home_rate, true);
  waitForMoveComplete();
  
  // 设置原点
  work_coords[X_AXIS] = 0;
  work_coords[Y_AXIS] = 0;
  work_coords[Z_AXIS] = 0;
  
  is_homing = false;
  Serial.println("ok");
}

void startHoming() {
  goToHome();
}

void waitForMoveComplete() {
  while (is_running && !soft_reset) {
    delay(1);
  }
}

// ==================== 定时器中断处理 ====================

ISR(TIMER2_COMPA_vect) {
  if (!current_move.active || !is_running) return;
  
  // 检查是否完成
  if (current_move.remaining <= 0) {
    current_move.active = false;
    is_running = false;
    finishMove();
    return;
  }
  
  // 生成步进脉冲
  static uint8_t active_axes = 0;
  
  for (int i = 0; i < 3; i++) {
    if (current_move.steps[i] != 0) {
      // 判断该轴是否需要步进
      long steps_remaining = current_move.steps[i];
      long max_remaining = current_move.remaining;
      
      if (abs(steps_remaining) >= max_remaining) {
        // 该轴需要步进
        digitalWrite(DIR_PINS[i], current_move.dir[i] ? HIGH : LOW);
        digitalWrite(STEP_PINS[i], HIGH);
        current_move.steps[i] -= (current_move.dir[i] ? 1 : -1);
        current_move.remaining--;
        break;  // 每次中断只步进一个轴
      }
    }
  }
}

void finishMove() {
  // 更新工作坐标
  work_coords[X_AXIS] = current_move.end_pos[X_AXIS];
  work_coords[Y_AXIS] = current_move.end_pos[Y_AXIS];
  work_coords[Z_AXIS] = current_move.end_pos[Z_AXIS];
  
  // 更新机械坐标
  machine_coords[X_AXIS] = work_coords[X_AXIS];
  machine_coords[Y_AXIS] = work_coords[Y_AXIS];
  machine_coords[Z_AXIS] = work_coords[Z_AXIS];
  
  // 发送完成信号
  Serial.println("ok");
  
  // 检查是否需要禁用电机
  if (!is_running && !spindle_on) {
    // 延迟后禁用电机以节省电力
    delay(MOTOR_DISABLE_DELAY);
    disableMotors();
  }
}

// ==================== 限位开关处理 ====================

void checkLimits() {
  // 检查所有限位开关
  for (int i = 0; i < 3; i++) {
    bool min_hit = (digitalRead(LIMIT_PINS[i][0]) == LOW);
    bool max_hit = (digitalRead(LIMIT_PINS[i][1]) == LOW);
    
    if (min_hit || max_hit) {
      if (!is_homing) {
        triggerAlarm(i, min_hit ? "Min" : "Max");
      } else {
        // 归零时触发限位，停止运动
        current_move.active = false;
        is_running = false;
        Serial.println("ALARM:Homing limit hit");
      }
    }
  }
}

void limitCheckX() {
  if (digitalRead(X_LIMIT_MIN_PIN) == LOW) {
    limit_x_min = true;
    if (!is_homing) triggerAlarm(X_AXIS, "Min");
  } else {
    limit_x_min = false;
  }
}

void limitCheckY() {
  if (digitalRead(Y_LIMIT_MIN_PIN) == LOW) {
    limit_y_min = true;
    if (!is_homing) triggerAlarm(Y_AXIS, "Min");
  } else {
    limit_y_min = false;
  }
}

void limitCheckZ() {
  if (digitalRead(Z_LIMIT_MIN_PIN) == LOW) {
    limit_z_min = true;
    if (!is_homing) triggerAlarm(Z_AXIS, "Min");
  } else {
    limit_z_min = false;
  }
}

void triggerAlarm(int axis, const char* limit) {
  is_running = false;
  current_move.active = false;
  alarm_mode = true;
  disableMotors();
  
  Serial.print("ALARM:");
  Serial.print(axis == X_AXIS ? "X" : (axis == Y_AXIS ? "Y" : "Z"));
  Serial.print(limit);
  Serial.println(" limit triggered");
}

// ==================== 急停与复位 ====================

void emergencyStop() {
  // 立即停止所有运动
  is_running = false;
  is_paused = false;
  current_move.active = false;
  soft_reset = true;
  
  // 关闭主轴
  spindle_on = false;
  analogWrite(SPINDLE_PWM_PIN, 0);
  
  // 禁用电机
  disableMotors();
  
  Serial.println("ERROR:Emergency stop triggered");
}

void softReset() {
  soft_reset = true;
}

void handleSoftReset() {
  // 停止所有运动
  is_running = false;
  is_paused = false;
  current_move.active = false;
  
  // 关闭主轴
  spindle_on = false;
  analogWrite(SPINDLE_PWM_PIN, 0);
  
  // 清除缓冲
  buffer_index = 0;
  memset(command_buffer, 0, COMMAND_BUFFER_SIZE);
  
  // 重新初始化
  initMotion();
  
  // 清除软复位标志
  soft_reset = false;
  
  Serial.println("Grbl 1.1f ['$' for help]");
  reportStatus();
}

void pauseJob() {
  if (is_running) {
    is_paused = true;
    is_running = false;
  }
}

void resumeJob() {
  if (is_paused) {
    is_paused = false;
    is_running = true;
  }
}

// ==================== 延时指令 ====================

void executeDwell() {
  unsigned long dwell_time = 1000;  // 默认 1 秒
  
  if (!isnan(gcode_s)) {
    dwell_time = (unsigned long)(gcode_s * 1000);  // 秒转换为毫秒
  }
  
  unsigned long start = millis();
  while ((millis() - start) < dwell_time && !soft_reset) {
    // 允许在延时期间处理其他中断
  }
  
  Serial.println("ok");
}

// ==================== 电机控制 ====================

void enableMotors() {
  digitalWrite(ENABLE_PIN, ENABLE_INVERT ? HIGH : LOW);
}

void disableMotors() {
  digitalWrite(ENABLE_PIN, ENABLE_INVERT ? LOW : HIGH);
}

// ==================== 状态报告 ====================

void reportStatus() {
  // 状态报告格式: <状态|位置|进给率|主轴速度>
  Serial.print("<");
  
  if (alarm_mode) {
    Serial.print("ALARM|");
  } else if (is_running) {
    Serial.print("RUN|");
  } else if (is_paused) {
    Serial.print("HOLD|");
  } else {
    Serial.print("IDLE|");
  }
  
  // 位置 (mm)
  Serial.print("X:");
  Serial.print(work_coords[X_AXIS], 3);
  Serial.print(" Y:");
  Serial.print(work_coords[Y_AXIS], 3);
  Serial.print(" Z:");
  Serial.print(work_coords[Z_AXIS], 3);
  
  // 进给率
  Serial.print(" F:");
  Serial.print((int)current_feed);
  
  // 主轴速度
  Serial.print(" S:");
  Serial.println(spindle_speed);
}

void updateStatus() {
  // 定期更新状态（如果需要）
  // 可以在此处添加额外的状态监控逻辑
}

void printStartupMessage() {
  Serial.println("");
  Serial.println("Grbl 1.1f ['$' for help]");
  Serial.println("Grbl CNC Controller - Arduino Version");
  Serial.println("Author: DamienLee2017");
  Serial.println("");
}

void printSettings() {
  Serial.println("$$ - View settings");
  Serial.println("$0 X step/mm = " + String(STEPS_PER_MM_X));
  Serial.println("$1 Y step/mm = " + String(STEPS_PER_MM_Y));
  Serial.println("$2 Z step/mm = " + String(STEPS_PER_MM_Z));
  Serial.println("$3 Feed rate = " + String(DEFAULT_FEED_RATE));
  Serial.println("$4 Rapid rate = " + String(DEFAULT_RAPID_RATE));
  Serial.println("$5 Step pulse = " + String(DEFAULT_STEP_PULSE_US) + " us");
}

void parseSetting(char* cmd) {
  // 解析设置命令: $X=Value
  Serial.println("Settings are read-only in this version");
  Serial.println("ok");
}

// ==================== 辅助函数 ====================

float mmToSteps(float mm, int axis) {
  switch (axis) {
    case X_AXIS: return mm * STEPS_PER_MM_X;
    case Y_AXIS: return mm * STEPS_PER_MM_Y;
    case Z_AXIS: return mm * STEPS_PER_MM_Z;
    default: return 0;
  }
}

float stepsToMm(long steps, int axis) {
  switch (axis) {
    case X_AXIS: return (float)steps / STEPS_PER_MM_X;
    case Y_AXIS: return (float)steps / STEPS_PER_MM_Y;
    case Z_AXIS: return (float)steps / STEPS_PER_MM_Z;
    default: return 0;
  }
}
