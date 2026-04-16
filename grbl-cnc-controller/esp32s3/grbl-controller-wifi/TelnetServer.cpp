/**
 * TelnetServer.cpp - ESP32-S3 Telnet 服务器实现
 * 
 * 功能：
 * - 多客户端 Telnet 连接管理
 * - G 代码命令转发
 * - 实时状态推送
 * - 连接状态监控
 */

#include "TelnetServer.h"
#include "Config.h"

// ==================== 全局变量 ====================

WiFiServer telnetServer(23);
WiFiClient telnetClients[MAX_TELNET_CLIENTS];
bool clientConnected[MAX_TELNET_CLIENTS] = {false};

// 状态同步
portMUX_TYPE telnetMux = portMUX_INITIALIZER_UNLOCKED;
bool telnetInitialized = false;

// 环形缓冲区用于状态更新
#define STATUS_BUFFER_SIZE 256
char statusBuffer[STATUS_BUFFER_SIZE];
volatile uint16_t statusBufferIndex = 0;

// ==================== 初始化 ====================

void initTelnetServer() {
    // 初始化客户端连接状态
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        clientConnected[i] = false;
        telnetClients[i] = WiFiClient();
    }
    
    // 启动 Telnet 服务器
    telnetServer.begin();
    telnetServer.setNoDelay(true);
    
    telnetInitialized = true;
    
    #ifdef DEBUG_TELNET
    Serial.println("[TELNET] Telnet server started on port 23");
    #endif
}

// ==================== 连接管理 ====================

void handleTelnetClients() {
    if (!telnetInitialized) {
        initTelnetServer();
        return;
    }
    
    // 检查新连接
    if (telnetServer.hasClient()) {
        WiFiClient newClient = telnetServer.available();
        if (newClient) {
            handleNewConnection(newClient);
        }
    }
    
    // 处理现有客户端
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        if (clientConnected[i] && telnetClients[i].connected()) {
            handleClientData(i);
        } else if (clientConnected[i]) {
            // 客户端断开
            disconnectClient(i);
        }
    }
}

void handleNewConnection(WiFiClient& client) {
    // 查找空闲槽位
    int slot = -1;
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        if (!clientConnected[i]) {
            slot = i;
            break;
        }
    }
    
    if (slot == -1) {
        // 达到最大连接数，拒绝连接
        client.println("Error: Maximum clients connected. Try again later.");
        client.stop();
        #ifdef DEBUG_TELNET
        Serial.println("[TELNET] Connection rejected - max clients reached");
        #endif
        return;
    }
    
    // 配置客户端
    telnetClients[slot] = client;
    clientConnected[slot] = true;
    
    // 设置超时
    telnetClients[slot].setTimeout(TELNET_TIMEOUT_MS);
    
    // 发送欢迎信息
    sendWelcomeMessage(slot);
    
    #ifdef DEBUG_TELNET
    Serial.printf("[TELNET] Client %d connected from %s\n", 
                  slot, client.remoteIP().toString().c_str());
    #endif
    
    // 触发连接回调
    if (onTelnetConnectCallback) {
        onTelnetConnectCallback(slot);
    }
}

void disconnectClient(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    if (telnetClients[slot]) {
        telnetClients[slot].stop();
    }
    
    clientConnected[slot] = false;
    
    #ifdef DEBUG_TELNET
    Serial.printf("[TELNET] Client %d disconnected\n", slot);
    #endif
    
    // 触发断开回调
    if (onTelnetDisconnectCallback) {
        onTelnetDisconnectCallback(slot);
    }
}

// ==================== 数据处理 ====================

void handleClientData(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    WiFiClient& client = telnetClients[slot];
    
    // 读取可用数据
    while (client.available() > 0) {
        char c = client.read();
        
        // Telnet 命令处理
        if (c == 0xFF) {
            // IAC (Interpret As Command)
            if (client.available() >= 2) {
                handleTelnetCommand(slot);
            }
            continue;
        }
        
        // 换行处理
        if (c == '\r' || c == '\n') {
            if (bufferIndex > 0) {
                // 处理命令
                processTelnetCommand(slot);
                bufferIndex = 0;
                memset(commandBuffer, 0, TELNET_BUFFER_SIZE);
            }
            continue;
        }
        
        // 普通字符
        if (bufferIndex < TELNET_BUFFER_SIZE - 1) {
            commandBuffer[bufferIndex++] = c;
        }
    }
}

void handleTelnetCommand(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    WiFiClient& client = telnetClients[slot];
    
    uint8_t cmd = client.read();
    uint8_t option = client.read();
    
    switch (cmd) {
        case 0xFB: // WILL
            if (option == 0x01 || option == 0x03) { // Echo or SGA
                client.write(0xFF);
                client.write(0xFC);
                client.write(option);
            }
            break;
            
        case 0xFC: // WON'T
            client.write(0xFF);
            client.write(0xFE);
            client.write(option);
            break;
            
        case 0xFD: // DO
            client.write(0xFF);
            client.write(0xFE);
            client.write(option);
            break;
            
        case 0xFE: // DON'T
            client.write(0xFF);
            client.write(0xFC);
            client.write(option);
            break;
    }
}

void processTelnetCommand(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    // 跳过空白命令
    if (bufferIndex == 0) return;
    
    // 去除尾随空白
    while (bufferIndex > 0 && (commandBuffer[bufferIndex - 1] == ' ' || 
                                commandBuffer[bufferIndex - 1] == '\t')) {
        bufferIndex--;
    }
    
    if (bufferIndex == 0) return;
    
    // 记录命令
    #ifdef DEBUG_TELNET
    Serial.printf("[TELNET] Client %d sent: %s\n", slot, commandBuffer);
    #endif
    
    // 检查特殊命令
    if (handleSpecialCommand(slot)) {
        return;
    }
    
    // 转发到命令处理器
    if (onTelnetCommandCallback) {
        onTelnetCommandCallback(slot, commandBuffer);
    } else {
        // 默认处理：转发到串口
        Serial.println(commandBuffer);
    }
}

bool handleSpecialCommand(int slot) {
    // 帮助命令
    if (strncmp(commandBuffer, "?", 1) == 0 || 
        strcasecmp(commandBuffer, "HELP") == 0) {
        sendHelp(slot);
        return true;
    }
    
    // 状态查询
    if (strcasecmp(commandBuffer, "STATUS") == 0 ||
        strcasecmp(commandBuffer, "STAT") == 0) {
        sendStatus(slot);
        return true;
    }
    
    // 连接列表
    if (strcasecmp(commandBuffer, "CLIENTS") == 0 ||
        strcasecmp(commandBuffer, "CONNECTIONS") == 0) {
        sendConnectionList(slot);
        return true;
    }
    
    // 版本信息
    if (strcasecmp(commandBuffer, "VERSION") == 0 ||
        strcasecmp(commandBuffer, "VER") == 0) {
        sendVersion(slot);
        return true;
    }
    
    // 复位
    if (strcasecmp(commandBuffer, "RESET") == 0) {
        telnetClients[slot].println("[TELNET] Reset command received");
        telnetClients[slot].println("ok");
        return true;
    }
    
    // 暂停所有连接
    if (strcasecmp(commandBuffer, "DISCONNECT ALL") == 0 ||
        strcasecmp(commandBuffer, "CLOSE ALL") == 0) {
        disconnectAllClients();
        telnetClients[slot].println("All clients disconnected");
        return true;
    }
    
    // 心跳
    if (strcasecmp(commandBuffer, "PING") == 0) {
        telnetClients[slot].println("PONG");
        return true;
    }
    
    return false;
}

// ==================== 消息发送 ====================

void sendWelcomeMessage(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    WiFiClient& client = telnetClients[slot];
    
    client.println("========================================");
    client.println("  ESP32-S3 CNC Controller - Telnet");
    client.println("========================================");
    client.println("");
    client.println("Connected to GRBL CNC Controller");
    client.printf("Build: %s %s\n", __DATE__, __TIME__);
    client.println("");
    client.println("Type '?' or 'help' for available commands");
    client.println("========================================");
    client.println("");
}

void sendHelp(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    WiFiClient& client = telnetClients[slot];
    
    client.println("");
    client.println("========== Available Commands ==========");
    client.println("Standard GRBL Commands:");
    client.println("  G0, G1, G2, G3    - Motion commands");
    client.println("  G28, G28.1        - Homing");
    client.println("  G10 L2, G10 L20   - Coordinate system");
    client.println("  M3, M4, M5        - Spindle control");
    client.println("  M8, M9            - Coolant control");
    client.println("");
    client.println("Telnet Commands:");
    client.println("  ? or help         - Show this help");
    client.println("  status or stat    - Show controller status");
    client.println("  clients           - Show active connections");
    client.println("  version or ver    - Show firmware version");
    client.println("  ping              - Test connection");
    client.println("  disconnect all    - Close all connections");
    client.println("  reset             - Reset connection");
    client.println("");
    client.println("Status Reports:");
    client.println("  $G                - Parser state");
    client.println("  $I                - Build info");
    client.println("  $N                - Startup lines");
    client.println("  $$                - Settings");
    client.println("  $#                - Parameters");
    client.println("========================================");
    client.println("");
}

void sendStatus(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    WiFiClient& client = telnetClients[slot];
    
    client.println("");
    client.println("========== Controller Status ==========");
    
    // 系统状态
    client.printf("Mode: %s\n", alarm_mode ? "ALARM" : (is_running ? "RUN" : "IDLE"));
    client.printf("Position (Work): X:%.3f Y:%.3f Z:%.3f\n", 
                  work_coords[0], work_coords[1], work_coords[2]);
    client.printf("Position (Machine): X:%.3f Y:%.3f Z:%.3f\n",
                  machine_coords[0], machine_coords[1], machine_coords[2]);
    
    // 速度状态
    client.printf("Feed Rate: %.1f mm/min\n", current_feed);
    client.printf("Rapid Rate: %.1f mm/min\n", rapid_rate);
    
    // 主轴状态
    client.printf("Spindle: %s @ %d RPM\n", spindle_on ? "ON" : "OFF", spindle_speed);
    
    // 连接状态
    int activeConnections = 0;
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        if (clientConnected[i]) activeConnections++;
    }
    client.printf("Active Telnet Clients: %d/%d\n", activeConnections, MAX_TELNET_CLIENTS);
    
    // WiFi 状态
    client.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
    client.printf("Signal: %d dBm\n", WiFi.RSSI());
    
    client.println("========================================");
    client.println("");
}

void sendConnectionList(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    WiFiClient& client = telnetClients[slot];
    
    client.println("");
    client.println("========== Active Connections =========");
    
    bool hasConnections = false;
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        if (clientConnected[i] && telnetClients[i].connected()) {
            hasConnections = true;
            client.printf("Slot %d: %s", i, telnetClients[i].remoteIP().toString().c_str());
            if (i == slot) {
                client.print(" (this session)");
            }
            client.println("");
        }
    }
    
    if (!hasConnections) {
        client.println("No active connections");
    }
    
    client.println("========================================");
    client.println("");
}

void sendVersion(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    WiFiClient& client = telnetClients[slot];
    
    client.println("");
    client.println("========== Firmware Version ==========");
    client.println("ESP32-S3 GRBL Controller v1.1f");
    client.printf("Build Date: %s %s\n", __DATE__, __TIME__);
    client.println("Platform: ESP32-S3");
    client.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
    client.printf("WiFi Mode: %s\n", WiFiMode() == WIFI_AP ? "AP" : "Station");
    client.println("======================================");
    client.println("");
}

// ==================== 广播功能 ====================

void broadcastToClients(const char* message) {
    portENTER_CRITICAL(&telnetMux);
    
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        if (clientConnected[i] && telnetClients[i].connected()) {
            telnetClients[i].println(message);
        }
    }
    
    portEXIT_CRITICAL(&telnetMux);
}

void broadcastStatus() {
    char status[200];
    snprintf(status, sizeof(status), 
             "<Idle,MPos:%.3f,%.3f,%.3f,WPos:%.3f,%.3f,%.3f,F:%.0f,S:0>",
             machine_coords[0], machine_coords[1], machine_coords[2],
             work_coords[0], work_coords[1], work_coords[2],
             current_feed);
    
    broadcastToClients(status);
}

void sendToClient(int slot, const char* message) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return;
    
    portENTER_CRITICAL(&telnetMux);
    
    if (clientConnected[slot] && telnetClients[slot].connected()) {
        telnetClients[slot].println(message);
    }
    
    portEXIT_CRITICAL(&telnetMux);
}

// ==================== 连接管理 ====================

void disconnectAllClients() {
    portENTER_CRITICAL(&telnetMux);
    
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        if (clientConnected[i]) {
            if (telnetClients[i]) {
                telnetClients[i].stop();
            }
            clientConnected[i] = false;
        }
    }
    
    portEXIT_CRITICAL(&telnetMux);
    
    #ifdef DEBUG_TELNET
    Serial.println("[TELNET] All clients disconnected");
    #endif
}

int getActiveClientCount() {
    int count = 0;
    
    portENTER_CRITICAL(&telnetMux);
    for (int i = 0; i < MAX_TELNET_CLIENTS; i++) {
        if (clientConnected[i] && telnetClients[i].connected()) {
            count++;
        }
    }
    portEXIT_CRITICAL(&telnetMux);
    
    return count;
}

bool isTelnetClientConnected(int slot) {
    if (slot < 0 || slot >= MAX_TELNET_CLIENTS) return false;
    
    bool connected = false;
    
    portENTER_CRITICAL(&telnetMux);
    connected = clientConnected[slot] && telnetClients[slot].connected();
    portEXIT_CRITICAL(&telnetMux);
    
    return connected;
}

// ==================== 回调管理 ====================

TelnetCommandCallback onTelnetCommandCallback = NULL;
TelnetConnectCallback onTelnetConnectCallback = NULL;
TelnetDisconnectCallback onTelnetDisconnectCallback = NULL;

void setTelnetCommandCallback(TelnetCommandCallback callback) {
    onTelnetCommandCallback = callback;
}

void setTelnetConnectCallback(TelnetConnectCallback callback) {
    onTelnetConnectCallback = callback;
}

void setTelnetDisconnectCallback(TelnetDisconnectCallback callback) {
    onTelnetDisconnectCallback = callback;
}

// ==================== 清理 ====================

void cleanupTelnetServer() {
    disconnectAllClients();
    
    if (telnetServer) {
        telnetServer.stop();
    }
    
    telnetInitialized = false;
    
    #ifdef DEBUG_TELNET
    Serial.println("[TELNET] Telnet server stopped");
    #endif
}
