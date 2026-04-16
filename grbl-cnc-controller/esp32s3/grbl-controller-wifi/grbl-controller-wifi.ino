/**
 * GRBL CNC Controller - ESP32-S3 Version
 * 基于ESP32-S3的G代码CNC控制器，支持WiFi网络控制
 * 
 * 功能特性：
 * - G代码解析与执行
 * - 三轴步进电机控制 (X/Y/Z)
 * - WiFi网络控制 (AP模式 + Telnet)
 * - Web控制界面
 * - 串口通信兼容
 * 
 * 作者: DamienLee2017
 * 许可证: MIT
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

// ============================================
// 配置头文件
// ============================================
#include "Config.h"

// ============================================
// 全局对象定义
// ============================================

// 步进电机引脚定义
struct StepperPins {
    static const uint8_t X_STEP = 1;
    static const uint8_t X_DIR = 2;
    static const uint8_t Y_STEP = 3;
    static const uint8_t Y_DIR = 4;
    static const uint8_t Z_STEP = 5;
    static const uint8_t Z_DIR = 6;
    static const uint8_t ENABLE = 7;
    
    // 限位开关引脚
    static const uint8_t X_LIMIT = 8;
    static const uint8_t Y_LIMIT = 9;
    static const uint8_t Z_LIMIT = 10;
    
    // 主轴和探针
    static const uint8_t SPINDLE_PWM = 11;
    static const uint8_t PROBE = 12;
};

// 运动状态枚举
enum class MachineState {
    IDLE,
    RUN,
    HOLD,
    ALARM,
    DOOR,
    CHECK,
    HOME,
    JOG
};

// 坐标系统
enum class CoordinateSystem {
    ABSOLUTE,
    RELATIVE
};

// G代码模式
struct GCodeMode {
    uint8_t G0_G1 = 0;      // G0=0, G1=1
    uint8_t G90_G91 = 90;   // G90=绝对, G91=相对
    uint8_t G21_G20 = 21;   // G21=毫米, G20=英寸
    float feedRate = 100.0; // 进给率 mm/min
    float spindleSpeed = 0; // 主轴转速 RPM
    bool spindleOn = false;
};

// 位置数据
struct Position {
    float x;
    float y;
    float z;
    float homeX;
    float homeY;
    float homeZ;
};

// 全局变量
MachineState currentState = MachineState::IDLE;
CoordinateSystem coordSystem = CoordinateSystem::ABSOLUTE;
GCodeMode gcodeMode;
Position machinePosition = {0, 0, 0, 0, 0, 0};
Position workPosition = {0, 0, 0, 0, 0, 0};

// 运动缓冲区
struct MotionBlock {
    float targetX, targetY, targetZ;
    float feedRate;
    bool rapid;  // G0快速移动
    bool valid;
};

MotionBlock motionBuffer[16];
uint8_t bufferHead = 0;
uint8_t bufferTail = 0;

// WiFi配置
const char* apSSID = "CNC_Controller_XXXX";
const char* apPassword = "12345678";

// ESP32芯片ID后四位
char chipID[5];

// Web服务器
WebServer webServer(80);

// Preferences for storing settings
Preferences preferences;

// ============================================
// 函数声明
// ============================================

// 初始化函数
void initHardware();
void initWiFi();
void initStepperDrivers();
void initInterrupts();

// G代码解析
void parseGCode(String line);
void executeG0(float x, float y, float z);
void executeG1(float x, float y, float z, float f);
void executeG28();
void executeG90();
void executeG91();
void executeG21();
void executeG20();
void executeM3(float s);
void executeM5();
void executeM30();

// 运动控制
void planMotion(float targetX, float targetY, float targetZ, float feed, bool rapid);
void startMotion();
void stepperPulse(uint8_t axis);
void updatePosition();

// 限位开关处理
void checkLimits();
void triggerAlarm(const char* reason);

// 串口通信
void sendStatus();
void send_ok();
void send_error(const char* msg);

// Web服务器
void handleRoot();
void handleStatus();
void handleGCode();
void handleJog();
void handleNotFound();

// HTML页面
String getHTMLPage();

// WiFi事件处理
void WiFiEvent(WiFiEvent_t event);

// Telnet客户端处理
void handleTelnet();

// 主循环
void processSerial();
void processWiFiClients();
void processMotion();

// ============================================
// 初始化函数
// ============================================

void setup() {
    Serial.begin(115200);
    delay(100);
    
    // 获取芯片ID用于AP名称
    uint32_t id = ESP.getEfuseMac();
    sprintf(chipID, "%04X", (uint16_t)(id & 0xFFFF));
    
    // 初始化硬件
    initHardware();
    
    // 初始化WiFi
    initWiFi();
    
    // 初始化Web服务器
    webServer.on("/", handleRoot);
    webServer.on("/status", handleStatus);
    webServer.on("/gcode", HTTP_POST, handleGCode);
    webServer.on("/jog", HTTP_POST, handleJog);
    webServer.begin();
    
    // 从Flash加载设置
    preferences.begin("cnc-config", false);
    machinePosition.homeX = preferences.getFloat("homeX", 0);
    machinePosition.homeY = preferences.getFloat("homeY", 0);
    machinePosition.homeZ = preferences.getFloat("homeZ", 0);
    gcodeMode.feedRate = preferences.getFloat("feedRate", 100);
    preferences.end();
    
    Serial.println("GRBL CNC Controller (ESP32-S3) 已启动");
    Serial.println("Type $ for help");
}

void initHardware() {
    // 设置步进电机引脚
    pinMode(StepperPins::X_STEP, OUTPUT);
    pinMode(StepperPins::X_DIR, OUTPUT);
    pinMode(StepperPins::Y_STEP, OUTPUT);
    pinMode(StepperPins::Y_DIR, OUTPUT);
    pinMode(StepperPins::Z_STEP, OUTPUT);
    pinMode(StepperPins::Z_DIR, OUTPUT);
    pinMode(StepperPins::ENABLE, OUTPUT);
    
    // 设置限位开关引脚（上拉）
    pinMode(StepperPins::X_LIMIT, INPUT_PULLUP);
    pinMode(StepperPins::Y_LIMIT, INPUT_PULLUP);
    pinMode(StepperPins::Z_LIMIT, INPUT_PULLUP);
    
    // 设置主轴PWM
    pinMode(StepperPins::SPINDLE_PWM, OUTPUT);
    ledcSetup(0, 10000, 8);  // 通道0, 10kHz, 8位分辨率
    ledcAttachPin(StepperPins::SPINDLE_PWM, 0);
    
    // 设置探针引脚
    pinMode(StepperPins::PROBE, INPUT_PULLUP);
    
    // 初始化引脚状态
    digitalWrite(StepperPins::ENABLE, LOW);  // 使能步进驱动（低电平使能）
    digitalWrite(StepperPins::X_DIR, LOW);
    digitalWrite(StepperPins::Y_DIR, LOW);
    digitalWrite(StepperPins::Z_DIR, LOW);
}

void initWiFi() {
    // 创建AP热点
    char ssid[32];
    sprintf(ssid, "CNC_Controller_%s", chipID);
    
    WiFi.softAP(ssid, apPassword);
    
    Serial.print("WiFi AP已创建: ");
    Serial.println(ssid);
    Serial.print("IP 地址: ");
    Serial.println(WiFi.softAPIP());
    
    // 设置WiFi事件处理
    WiFi.onEvent(WiFiEvent);
}

void initStepperDrivers() {
    // 初始化步进驱动
    digitalWrite(StepperPins::ENABLE, LOW);  // 使能
}

void initInterrupts() {
    // 可以添加限位开关中断
    attachInterrupt(digitalPinToInterrupt(StepperPins::X_LIMIT), [](){
        if(digitalRead(StepperPins::X_LIMIT) == LOW) {
            triggerAlarm("X轴限位触发");
        }
    }, FALLING);
    
    attachInterrupt(digitalPinToInterrupt(StepperPins::Y_LIMIT), [](){
        if(digitalRead(StepperPins::Y_LIMIT) == LOW) {
            triggerAlarm("Y轴限位触发");
        }
    }, FALLING);
    
    attachInterrupt(digitalPinToInterrupt(StepperPins::Z_LIMIT), [](){
        if(digitalRead(StepperPins::Z_LIMIT) == LOW) {
            triggerAlarm("Z轴限位触发");
        }
    }, FALLING);
}

// ============================================
// 主循环
// ============================================

void loop() {
    // 处理Web服务器请求
    webServer.handleClient();
    
    // 处理串口命令
    processSerial();
    
    // 处理运动
    processMotion();
    
    // 检查限位开关
    checkLimits();
}

// ============================================
// 串口处理
// ============================================

void processSerial() {
    static String inputBuffer = "";
    
    while (Serial.available() > 0) {
        char c = Serial.read();
        
        if (c == '\n' || c == '\r') {
            if (inputBuffer.length() > 0) {
                // 处理命令
                String cmd = inputBuffer;
                cmd.trim();
                
                if (cmd.length() > 0) {
                    if (cmd.startsWith("$")) {
                        // 处理GRBL命令
                        handleGrblCommand(cmd);
                    } else {
                        // 处理G代码
                        parseGCode(cmd);
                    }
                }
                
                inputBuffer = "";
            }
        } else {
            inputBuffer += c;
        }
    }
}

void handleGrblCommand(String cmd) {
    if (cmd == "$G") {
        // 显示G代码模式状态
        Serial.print("[G");
        Serial.print(gcodeMode.G90_G91);
        Serial.print(" G");
        Serial.print(gcodeMode.G21_G20);
        Serial.print(" F");
        Serial.println((int)gcodeMode.feedRate);
    }
    else if (cmd == "$H") {
        // 执行归位
        executeG28();
    }
    else if (cmd == "$X") {
        // 清除报警
        if (currentState == MachineState::ALARM) {
            currentState = MachineState::IDLE;
            Serial.println("ALARM已清除");
        }
    }
    else if (cmd == "?") {
        // 发送状态报告
        sendStatus();
    }
    else if (cmd == "$I") {
        // 显示版本信息
        Serial.println("[ESP32-S3 GRBL v1.1h]");
    }
    else if (cmd.startsWith("$J=")) {
        // JOG命令
        String jogCmd = cmd.substring(3);
        parseGCode("G91");  // 切换到相对坐标
        parseGCode("G0 " + jogCmd);
        parseGCode("G90");  // 恢复到绝对坐标
    }
    else if (cmd == "$C") {
        // 检查模式切换
        if (currentState == MachineState::CHECK) {
            currentState = MachineState::IDLE;
            Serial.println("CHECK模式已关闭");
        } else {
            currentState = MachineState::CHECK;
            Serial.println("CHECK模式已开启");
        }
    }
    else {
        Serial.println("未知命令");
    }
}

// ============================================
// G代码解析
// ============================================

void parseGCode(String line) {
    line.trim();
    if (line.length() == 0) return;
    
    // 跳过注释
    int commentIdx = line.indexOf(';');
    if (commentIdx >= 0) {
        line = line.substring(0, commentIdx);
    }
    if (line.length() == 0) return;
    
    // 解析G代码
    if (line.startsWith("G0") || line.startsWith("G0 ") || line.startsWith("G00")) {
        parseG0G1(line, false);
    }
    else if (line.startsWith("G1") || line.startsWith("G1 ") || line.startsWith("G01")) {
        parseG0G1(line, false);
    }
    else if (line.startsWith("G28")) {
        executeG28();
        send_ok();
    }
    else if (line.startsWith("G90")) {
        executeG90();
        send_ok();
    }
    else if (line.startsWith("G91")) {
        executeG91();
        send_ok();
    }
    else if (line.startsWith("G21")) {
        executeG21();
        send_ok();
    }
    else if (line.startsWith("G20")) {
        executeG20();
        send_ok();
    }
    else if (line.startsWith("M3") || line.startsWith("M03")) {
        float s = extractParameter(line, 'S', gcodeMode.spindleSpeed);
        executeM3(s);
        send_ok();
    }
    else if (line.startsWith("M5") || line.startsWith("M05")) {
        executeM5();
        send_ok();
    }
    else if (line.startsWith("M30")) {
        executeM30();
        send_ok();
    }
    else if (line.startsWith("F")) {
        gcodeMode.feedRate = line.substring(1).toFloat();
        send_ok();
    }
    else if (line.startsWith("S")) {
        gcodeMode.spindleSpeed = line.substring(1).toFloat();
        send_ok();
    }
    else {
        // 未知命令
        send_ok();  // 仍返回ok以保持兼容性
    }
}

void parseG0G1(String line, bool rapid) {
    float x = extractParameter(line, 'X', workPosition.x);
    float y = extractParameter(line, 'Y', workPosition.y);
    float z = extractParameter(line, 'Z', workPosition.z);
    float f = extractParameter(line, 'F', gcodeMode.feedRate);
    
    // 处理相对坐标
    if (coordSystem == CoordinateSystem::RELATIVE) {
        workPosition.x += x;
        workPosition.y += y;
        workPosition.z += z;
    } else {
        workPosition.x = x;
        workPosition.y = y;
        workPosition.z = z;
    }
    
    // 添加到运动缓冲区
    planMotion(workPosition.x, workPosition.y, workPosition.z, f, rapid);
}

float extractParameter(String line, char param, float defaultValue) {
    String paramStr = String(param);
    int idx = line.indexOf(paramStr);
    if (idx >= 0) {
        String valueStr = line.substring(idx + 1);
        // 找到下一个字母前的数字
        for (int i = 0; i < valueStr.length(); i++) {
            if (isAlpha(valueStr.charAt(i))) {
                valueStr = valueStr.substring(0, i);
                break;
            }
        }
        return valueStr.toFloat();
    }
    return defaultValue;
}

void executeG0(float x, float y, float z) {
    planMotion(x, y, z, gcodeMode.feedRate, true);
}

void executeG1(float x, float y, float z, float f) {
    planMotion(x, y, z, f, false);
}

void executeG28() {
    Serial.println("开始归位...");
    
    // 快速移动到限位开关
    // 先Z轴上升
    executeG0(workPosition.x, workPosition.y, 50);
    delay(500);
    
    // X和Y轴归位
    executeG0(0, 0, 50);
    delay(500);
    
    // Z轴归位
    executeG0(0, 0, 0);
    delay(500);
    
    // 重置工作位置
    workPosition.x = 0;
    workPosition.y = 0;
    workPosition.z = 0;
    
    Serial.println("归位完成");
}

void executeG90() {
    coordSystem = CoordinateSystem::ABSOLUTE;
    gcodeMode.G90_G91 = 90;
}

void executeG91() {
    coordSystem = CoordinateSystem::RELATIVE;
    gcodeMode.G90_G91 = 91;
}

void executeG21() {
    gcodeMode.G21_G20 = 21;  // 毫米模式
}

void executeG20() {
    gcodeMode.G21_G20 = 20;  // 英寸模式
}

void executeM3(float s) {
    gcodeMode.spindleSpeed = s;
    gcodeMode.spindleOn = true;
    // 设置PWM
    uint8_t pwmValue = map((int)s, 0, 12000, 0, 255);
    ledcWrite(0, pwmValue);
}

void executeM5() {
    gcodeMode.spindleOn = false;
    gcodeMode.spindleSpeed = 0;
    ledcWrite(0, 0);
}

void executeM30() {
    // 程序结束
    executeM5();
    workPosition.x = 0;
    workPosition.y = 0;
    workPosition.z = 0;
}

// ============================================
// 运动控制
// ============================================

void planMotion(float targetX, float targetY, float targetZ, float feed, bool rapid) {
    // 简化的运动规划
    uint8_t nextHead = (bufferHead + 1) % 16;
    
    if (nextHead != bufferTail) {
        motionBuffer[bufferHead].targetX = targetX;
        motionBuffer[bufferHead].targetY = targetY;
        motionBuffer[bufferHead].targetZ = targetZ;
        motionBuffer[bufferHead].feedRate = rapid ? 1000 : feed;
        motionBuffer[bufferHead].rapid = rapid;
        motionBuffer[bufferHead].valid = true;
        bufferHead = nextHead;
        
        // 开始运动
        startMotion();
    }
}

void startMotion() {
    if (currentState == MachineState::IDLE || currentState == MachineState::RUN) {
        currentState = MachineState::RUN;
    }
}

void processMotion() {
    if (currentState != MachineState::RUN) return;
    if (bufferTail == bufferHead) {
        currentState = MachineState::IDLE;
        return;
    }
    
    MotionBlock* block = &motionBuffer[bufferTail];
    if (!block->valid) {
        bufferTail = (bufferTail + 1) % 16;
        return;
    }
    
    // 计算运动距离
    float dx = block->targetX - workPosition.x;
    float dy = block->targetY - workPosition.y;
    float dz = block->targetZ - workPosition.z;
    
    // 计算总距离
    float totalDist = sqrt(dx*dx + dy*dy + dz*dz);
    
    if (totalDist < 0.001) {
        // 移动完成
        block->valid = false;
        bufferTail = (bufferTail + 1) % 16;
        return;
    }
    
    // 步进参数
    float stepsPerMM = 80.0;  // 根据机械配置
    float stepDist = 1.0 / stepsPerMM;
    
    // 计算每步延时（微秒）
    float feedRate = block->rapid ? 1000 : block->feedRate;
    float stepDelay = (stepDist / feedRate) * 60000000.0;  // 转换为微秒
    
    // 限制最小延时
    if (stepDelay < 50) stepDelay = 50;
    
    // 执行单步
    bool xDone = fabs(dx) < stepDist/2;
    bool yDone = fabs(dy) < stepDist/2;
    bool zDone = fabs(dz) < stepDist/2;
    
    if (!xDone || !yDone || !zDone) {
        // X轴步进
        if (!xDone) {
            digitalWrite(StepperPins::X_DIR, dx > 0 ? HIGH : LOW);
            digitalWrite(StepperPins::X_STEP, HIGH);
            delayMicroseconds(5);
            digitalWrite(StepperPins::X_STEP, LOW);
            workPosition.x += (dx > 0 ? stepDist : -stepDist);
        }
        
        // Y轴步进
        if (!yDone) {
            digitalWrite(StepperPins::Y_DIR, dy > 0 ? HIGH : LOW);
            digitalWrite(StepperPins::Y_STEP, HIGH);
            delayMicroseconds(5);
            digitalWrite(StepperPins::Y_STEP, LOW);
            workPosition.y += (dy > 0 ? stepDist : -stepDist);
        }
        
        // Z轴步进
        if (!zDone) {
            digitalWrite(StepperPins::Z_DIR, dz > 0 ? HIGH : LOW);
            digitalWrite(StepperPins::Z_STEP, HIGH);
            delayMicroseconds(5);
            digitalWrite(StepperPins::Z_STEP, LOW);
            workPosition.z += (dz > 0 ? stepDist : -stepDist);
        }
        
        delayMicroseconds((int)stepDelay);
    } else {
        // 移动完成
        block->valid = false;
        bufferTail = (bufferTail + 1) % 16;
    }
}

// ============================================
// 限位和报警
// ============================================

void checkLimits() {
    // 检查限位开关（低电平触发）
    if (digitalRead(StepperPins::X_LIMIT) == LOW ||
        digitalRead(StepperPins::Y_LIMIT) == LOW ||
        digitalRead(StepperPins::Z_LIMIT) == LOW) {
        // 停止运动
        currentState = MachineState::ALARM;
        digitalWrite(StepperPins::ENABLE, HIGH);  // 禁用步进驱动
    }
}

void triggerAlarm(const char* reason) {
    currentState = MachineState::ALARM;
    digitalWrite(StepperPins::ENABLE, HIGH);
    
    Serial.print("ALARM: ");
    Serial.println(reason);
}

// ============================================
// 状态报告
// ============================================

void sendStatus() {
    // GRBL风格状态报告
    Serial.print("<");
    
    // 状态
    switch (currentState) {
        case MachineState::IDLE: Serial.print("Idle"); break;
        case MachineState::RUN: Serial.print("Run"); break;
        case MachineState::HOLD: Serial.print("Hold"); break;
        case MachineState::ALARM: Serial.print("Alarm"); break;
        case MachineState::CHECK: Serial.print("Check"); break;
        case MachineState::HOME: Serial.print("Home"); break;
        case MachineState::JOG: Serial.print("Jog"); break;
        default: Serial.print("Unknown"); break;
    }
    
    // 工作位置
    Serial.print("|MPos:");
    Serial.print(workPosition.x, 3);
    Serial.print(",");
    Serial.print(workPosition.y, 3);
    Serial.print(",");
    Serial.print(workPosition.z, 3);
    
    // 进给率
    Serial.print("|FS:");
    Serial.print((int)gcodeMode.feedRate);
    Serial.print(",");
    Serial.print((int)gcodeMode.spindleSpeed);
    
    Serial.println(">");
}

void send_ok() {
    Serial.println("ok");
}

void send_error(const char* msg) {
    Serial.print("error: ");
    Serial.println(msg);
}

// ============================================
// WiFi事件处理
// ============================================

void WiFiEvent(WiFiEvent_t event) {
    switch (event) {
        case ARDUINO_EVENT_WIFI_AP_START:
            Serial.println("AP模式已启动");
            break;
        case ARDUINO_EVENT_WIFI_AP_STACONNECTED:
            Serial.println("客户端已连接");
            break;
        case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED:
            Serial.println("客户端已断开");
            break;
        default:
            break;
    }
}

// ============================================
// Web服务器处理
// ============================================

void handleRoot() {
    webServer.send(200, "text/html", getHTMLPage());
}

void handleStatus() {
    String status = "{";
    status += "\"state\":\"" + String((int)currentState) + "\",";
    status += "\"x\":" + String(workPosition.x, 3) + ",";
    status += "\"y\":" + String(workPosition.y, 3) + ",";
    status += "\"z\":" + String(workPosition.z, 3) + ",";
    status += "\"feed\":" + String((int)gcodeMode.feedRate) + ",";
    status += "\"spindle\":" + String((int)gcodeMode.spindleSpeed);
    status += "}";
    webServer.send(200, "application/json", status);
}

void handleGCode() {
    if (webServer.hasArg("plain")) {
        String gcode = webServer.arg("plain");
        parseGCode(gcode);
        send_ok();
    }
    webServer.send(200, "text/plain", "ok");
}

void handleJog() {
    if (webServer.hasArg("x") && webServer.hasArg("y") && webServer.hasArg("z")) {
        float x = webServer.arg("x").toFloat();
        float y = webServer.arg("y").toFloat();
        float z = webServer.arg("z").toFloat();
        
        workPosition.x += x;
        workPosition.y += y;
        workPosition.z += z;
        
        planMotion(workPosition.x, workPosition.y, workPosition.z, 500, false);
    }
    webServer.send(200, "text/plain", "ok");
}

void handleNotFound() {
    webServer.send(404, "text/plain", "Not Found");
}

// ============================================
// HTML页面
// ============================================

String getHTMLPage() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta charset='utf-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    html += "<title>CNC控制器</title>";
    html += "<style>";
    html += "*{margin:0;padding:0;box-sizing:border-box}";
    html += "body{font-family:'Segoe UI',Arial,sans-serif;background:#1a1a2e;color:#eee;min-height:100vh}";
    html += ".container{max-width:900px;margin:0 auto;padding:20px}";
    html += "h1{text-align:center;color:#00d4ff;margin-bottom:30px;font-size:2em}";
    html += ".card{background:#16213e;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3)}";
    html += ".status{display:flex;justify-content:space-around;flex-wrap:wrap;gap:10px}";
    html += ".pos-box{text-align:center;padding:15px;background:#0f3460;border-radius:8px;min-width:120px}";
    html += ".pos-label{font-size:0.9em;color:#888;margin-bottom:5px}";
    html += ".pos-value{font-size:1.8em;font-weight:bold;color:#00d4ff}";
    html += ".controls{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:20px}";
    html += ".btn{padding:15px;border:none;border-radius:8px;cursor:pointer;font-size:1em;transition:all 0.3s}";
    html += ".btn-x{background:#e94560;color:#fff}.btn-y{background:#0f3460;color:#fff}.btn-z{background:#533483;color:#fff}";
    html += ".btn:hover{transform:scale(1.05);box-shadow:0 4px 15px rgba(0,0,0,0.3)}";
    html += ".btn:active{transform:scale(0.95)}";
    html += ".jog-area{display:flex;justify-content:center;gap:10px;margin-top:20px}";
    html += ".input-group{margin-top:15px}";
    html += "label{display:inline-block;width:80px;color:#888}";
    html += "input{background:#0f3460;border:1px solid #00d4ff;border-radius:4px;padding:8px 12px;color:#fff;width:150px}";
    html += "input:focus{outline:none;box-shadow:0 0 10px rgba(0,212,255,0.3)}";
    html += ".gcode-input{margin-top:20px;text-align:center}";
    html += "textarea{width:100%;height:100px;background:#0f3460;border:1px solid #00d4ff;border-radius:8px;padding:10px;color:#fff;resize:none}";
    html += ".send-btn{background:linear-gradient(135deg,#00d4ff,#0099cc);padding:12px 40px;border:none;border-radius:8px;color:#fff;font-size:1.1em;cursor:pointer;margin-top:10px}";
    html += ".send-btn:hover{transform:scale(1.02)}";
    html += ".info{text-align:center;color:#666;font-size:0.85em;margin-top:20px}";
    html += ".state{display:inline-block;padding:5px 15px;border-radius:20px;background:#0f3460}";
    html += "</style></head><body>";
    html += "<div class='container'>";
    html += "<h1>⚙️ CNC控制器</h1>";
    
    html += "<div class='card'>";
    html += "<h2>当前位置</h2>";
    html += "<div class='status'>";
    html += "<div class='pos-box'><div class='pos-label'>X轴</div><div class='pos-value' id='posX'>0.000</div></div>";
    html += "<div class='pos-box'><div class='pos-label'>Y轴</div><div class='pos-value' id='posY'>0.000</div></div>";
    html += "<div class='pos-box'><div class='pos-label'>Z轴</div><div class='pos-value' id='posZ'>0.000</div></div>";
    html += "</div></div>";
    
    html += "<div class='card'>";
    html += "<h2>状态: <span class='state' id='state'>IDLE</span></h2>";
    html += "<div class='controls'>";
    html += "<button class='btn btn-x' onclick=\"jog('X',-10)\">X-</button>";
    html += "<button class='btn btn-x' onclick=\"jog('X',10)\">X+</button>";
    html += "<button class='btn btn-x' onclick=\"sendGcode('G28')\">归零</button>";
    html += "<button class='btn btn-y' onclick=\"jog('Y',-10)\">Y-</button>";
    html += "<button class='btn btn-y' onclick=\"jog('Y',10)\">Y+</button>";
    html += "<button class='btn btn-y' onclick=\"sendGcode('M5')\">停主轴</button>";
    html += "<button class='btn btn-z' onclick=\"jog('Z',-1)\">Z-</button>";
    html += "<button class='btn btn-z' onclick=\"jog('Z',1)\">Z+</button>";
    html += "<button class='btn btn-z' onclick=\"sendGcode('M3 S5000')\">开主轴</button>";
    html += "</div>";
    
    html += "<div class='input-group'>";
    html += "<label>步进(mm):</label>";
    html += "<input type='number' id='stepSize' value='10' min='0.1' max='100' step='0.1'>";
    html += "</div></div>";
    
    html += "<div class='card'>";
    html += "<h2>G代码输入</h2>";
    html += "<textarea id='gcodeInput' placeholder='输入G代码，如: G0 X50 Y30 F200'></textarea>";
    html += "<div style='text-align:center'>";
    html += "<button class='send-btn' onclick='sendGcodeInput()'>发送</button>";
    html += "</div></div>";
    
    html += "<div class='info'>WiFi已连接 | 版本: 1.1h</div>";
    html += "</div>";
    
    html += "<script>";
    html += "function updateStatus(){fetch('/status').then(r=>r.json()).then(d=>{";
    html += "document.getElementById('posX').textContent=d.x.toFixed(3);";
    html += "document.getElementById('posY').textContent=d.y.toFixed(3);";
    html += "document.getElementById('posZ').textContent=d.z.toFixed(3);";
    html += "const states=['IDLE','RUN','HOLD','ALARM','','HOME','JOG'];";
    html += "document.getElementById('state').textContent=states[d.state]||'UNKNOWN';})}";
    html += "function jog(axis,value){const step=parseFloat(document.getElementById('stepSize').value);";
    html += "const data={x:axis==='X'?value*step:0,y:axis==='Y'?value*step:0,z:axis==='Z'?value*step:0};";
    html += "fetch('/jog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});}";
    html += "function sendGcode(cmd){fetch('/gcode',{method:'POST',headers:{'Content-Type':'text/plain'},body:cmd});}";
    html += "function sendGcodeInput(){const cmd=document.getElementById('gcodeInput').value.trim();";
    html += "if(cmd){sendGcode(cmd);document.getElementById('gcodeInput').value='';}}";
    html += "setInterval(updateStatus,200);updateStatus();";
    html += "</script></body></html>";
    return html;
}
