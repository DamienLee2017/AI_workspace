/**
 * TelnetServer.h - ESP32-S3 Telnet 服务器
 * 
 * 提供Telnet远程控制接口，兼容GRBL协议
 * 
 * 作者: DamienLee2017
 * 许可证: MIT
 */

#ifndef TELNET_SERVER_H
#define TELNET_SERVER_H

#include <WiFi.h>
#include <HardwareSerial.h>

// Telnet配置常量
#define TELNET_PORT           23
#define TELNET_MAX_CLIENTS    1
#define TELNET_TIMEOUT_MS    5000
#define TELNET_BUFFER_SIZE    256

// Telnet命令代码 (RFC 854)
#define TELNET_IAC            255     // Interpret As Command
#define TELNET_WILL           251     // Will do option
#define TELNET_WONT           252     // Won't do option
#define TELNET_DO             253     // Do option
#define TELNET_DONT           254     // Don't do option
#define TELNET_ECHO           1       // Echo
#define TELNET_SGA            3       // Suppress Go Ahead
#define TELNET_LINEMODE       34      // Line Mode
#define TELNET_TTYPE          24      // Terminal Type
#define TELNET_NAWS           31      // Negotiate About Window Size
#define TELNET_NEW_ENVIRON   39      // New Environment Variables

/**
 * Telnet状态枚举
 */
enum TelnetState {
  TELNET_STATE_IDLE,
  TELNET_STATE_CONNECTED,
  TELNET_STATE_PROCESSING,
  TELNET_STATE_DISCONNECTED
};

/**
 * Telnet客户端结构
 */
struct TelnetClient {
  WiFiClient client;
  uint8_t rx_buffer[TELNET_BUFFER_SIZE];
  uint16_t rx_head;
  uint16_t rx_tail;
  unsigned long last_activity;
  bool authenticated;
  bool echo_enabled;
  bool use_crlf;
  
  TelnetClient() {
    rx_head = 0;
    rx_tail = 0;
    last_activity = 0;
    authenticated = true;  // 默认无需认证
    echo_enabled = true;
    use_crlf = true;
  }
  
  // 检查是否有数据可读
  bool hasData() {
    return rx_head != rx_tail;
  }
  
  // 读取一个字节
  int readByte() {
    if (rx_head == rx_tail) return -1;
    uint8_t data = rx_buffer[rx_head];
    rx_head = (rx_head + 1) % TELNET_BUFFER_SIZE;
    return data;
  }
  
  // 写入数据到缓冲区
  size_t writeByte(uint8_t data) {
    uint16_t next = (rx_tail + 1) % TELNET_BUFFER_SIZE;
    if (next == rx_head) return 0;  // 缓冲区满
    rx_buffer[rx_tail] = data;
    rx_tail = next;
    return 1;
  }
};

/**
 * Telnet服务器类
 */
class TelnetServerClass {
private:
  WiFiServer* _server;
  TelnetClient _clients[TELNET_MAX_CLIENTS];
  TelnetState _state;
  bool _enabled;
  
  // GRBL控制器回调
  void (*_onCommand)(const char* command, size_t len);
  
  /**
   * 处理Telnet协议选项
   */
  size_t handleTelnetOption(uint8_t option, bool& will, bool& do_ack) {
    switch (option) {
      case TELNET_ECHO:
        will = true;
        do_ack = true;
        return 3;
        
      case TELNET_SGA:
        will = true;
        do_ack = true;
        return 3;
        
      case TELNET_NAWS:
        will = false;
        do_ack = true;
        return 3;
        
      default:
        will = false;
        do_ack = false;
        return 0;
    }
  }
  
  /**
   * 发送Telnet命令
   */
  size_t sendTelnetCommand(WiFiClient& client, uint8_t cmd, uint8_t opt) {
    uint8_t packet[3] = {TELNET_IAC, cmd, opt};
    return client.write(packet, 3);
  }
  
  /**
   * 处理客户端数据
   */
  void processClient(TelnetClient& telnetClient) {
    WiFiClient& client = telnetClient.client;
    
    if (!client.connected()) {
      return;
    }
    
    // 检查超时
    if (millis() - telnetClient.last_activity > TELNET_TIMEOUT_MS) {
      client.println("\r\nConnection timeout");
      client.stop();
      return;
    }
    
    // 读取可用数据
    while (client.available() > 0) {
      int c = client.read();
      if (c < 0) break;
      
      telnetClient.last_activity = millis();
      
      // 检查Telnet命令
      if (c == TELNET_IAC) {
        // 读取命令和选项
        int cmd = client.read();
        if (cmd < 0) {
          telnetClient.writeByte((uint8_t)c);
          continue;
        }
        
        int opt = client.read();
        if (opt < 0) {
          telnetClient.writeByte((uint8_t)c);
          telnetClient.writeByte((uint8_t)cmd);
          continue;
        }
        
        // 处理命令
        if (cmd == TELNET_WILL || cmd == TELNET_DO) {
          bool will, do_ack;
          size_t response_len = handleTelnetOption((uint8_t)opt, will, do_ack);
          
          if (response_len > 0) {
            uint8_t reply_cmd = (cmd == TELNET_WILL) ? 
              (will ? TELNET_WILL : TELNET_WONT) : 
              (do_ack ? TELNET_DO : TELNET_DONT);
            sendTelnetCommand(client, reply_cmd, (uint8_t)opt);
          }
        }
        // 对于其他命令，简单跳过
        continue;
      }
      
      // 存储到接收缓冲区
      telnetClient.writeByte((uint8_t)c);
    }
    
    // 处理接收到的命令
    while (telnetClient.hasData()) {
      int c = telnetClient.readByte();
      
      // 行结束处理
      if (c == '\r' || c == '\n') {
        if (telnetClient.use_crlf && c == '\r') {
          // 检查下一个字符是否为\n
          if (telnetClient.hasData()) {
            int peek = telnetClient.readByte();
            if (peek != '\n') {
              // 不是\r\n，将peek放回缓冲区
              telnetClient.rx_head = (telnetClient.rx_head - 1 + TELNET_BUFFER_SIZE) % TELNET_BUFFER_SIZE;
            }
          }
        }
        
        // 处理命令
        processCommand(telnetClient);
      } else {
        // 存储字符
        telnetClient.rx_buffer[TELNET_BUFFER_SIZE - 1] = (uint8_t)c;
      }
    }
  }
  
  /**
   * 处理接收到的命令
   */
  void processCommand(TelnetClient& telnetClient) {
    static char command_buffer[TELNET_BUFFER_SIZE];
    static size_t cmd_len = 0;
    
    // 构建命令字符串
    for (int i = 0; i < TELNET_BUFFER_SIZE - 1; i++) {
      int c = telnetClient.readByte();
      if (c < 0) break;
      if (c == '\r' || c == '\n') continue;
      
      if (cmd_len < TELNET_BUFFER_SIZE - 1) {
        command_buffer[cmd_len++] = (char)c;
      }
    }
    
    if (cmd_len == 0) return;
    
    command_buffer[cmd_len] = '\0';
    cmd_len = 0;
    
    // 回显命令
    if (telnetClient.echo_enabled) {
      telnetClient.client.print(">");
      telnetClient.client.println(command_buffer);
    }
    
    // 调用命令回调
    if (_onCommand) {
      _onCommand(command_buffer, strlen(command_buffer));
    }
  }
  
public:
  /**
   * 构造函数
   */
  TelnetServerClass() {
    _server = nullptr;
    _enabled = false;
    _state = TELNET_STATE_IDLE;
    _onCommand = nullptr;
  }
  
  /**
   * 初始化Telnet服务器
   */
  bool begin(uint16_t port = TELNET_PORT) {
    if (_enabled) {
      end();
    }
    
    _server = new WiFiServer(port);
    _server->begin();
    _server->setNoDelay(true);
    
    _enabled = true;
    _state = TELNET_STATE_IDLE;
    
    Serial.printf("[TELNET] Server started on port %d\r\n", port);
    
    return true;
  }
  
  /**
   * 停止Telnet服务器
   */
  void end() {
    // 断开所有客户端
    for (int i = 0; i < TELNET_MAX_CLIENTS; i++) {
      if (_clients[i].client.connected()) {
        _clients[i].client.stop();
      }
    }
    
    // 停止服务器
    if (_server) {
      _server->stop();
      delete _server;
      _server = nullptr;
    }
    
    _enabled = false;
    _state = TELNET_STATE_IDLE;
    
    Serial.println("[TELNET] Server stopped");
  }
  
  /**
   * 设置命令回调函数
   */
  void onCommand(void (*callback)(const char* command, size_t len)) {
    _onCommand = callback;
  }
  
  /**
   * 向所有客户端广播消息
   */
  size_t broadcast(const char* message) {
    size_t sent = 0;
    for (int i = 0; i < TELNET_MAX_CLIENTS; i++) {
      if (_clients[i].client.connected()) {
        sent += _clients[i].client.println(message);
      }
    }
    return sent;
  }
  
  /**
   * 向所有客户端发送原始数据
   */
  size_t broadcastRaw(const uint8_t* data, size_t len) {
    size_t sent = 0;
    for (int i = 0; i < TELNET_MAX_CLIENTS; i++) {
      if (_clients[i].client.connected()) {
        sent += _clients[i].client.write(data, len);
      }
    }
    return sent;
  }
  
  /**
   * 获取连接的客户端数量
   */
  int connectedClients() {
    int count = 0;
    for (int i = 0; i < TELNET_MAX_CLIENTS; i++) {
      if (_clients[i].client.connected()) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * 检查是否有客户端连接
   */
  bool hasClient() {
    return connectedClients() > 0;
  }
  
  /**
   * 获取服务器状态
   */
  TelnetState getState() {
    return _state;
  }
  
  /**
   * 检查服务器是否启用
   */
  bool isEnabled() {
    return _enabled;
  }
  
  /**
   * 主循环调用
   */
  void handle() {
    if (!_enabled || !_server) return;
    
    // 检查新连接
    WiFiClient newClient = _server->available();
    if (newClient) {
      // 查找空闲的客户端槽位
      bool connected = false;
      for (int i = 0; i < TELNET_MAX_CLIENTS; i++) {
        if (!_clients[i].client.connected()) {
          _clients[i].client = newClient;
          _clients[i].rx_head = 0;
          _clients[i].rx_tail = 0;
          _clients[i].last_activity = millis();
          _clients[i].echo_enabled = true;
          _clients[i].use_crlf = true;
          
          // 发送欢迎消息
          newClient.println("GRBL CNC Controller (Telnet)");
          newClient.println("Type '?' for help");
          newClient.println(">");
          
          connected = true;
          Serial.printf("[TELNET] Client connected from %s\r\n", 
                        newClient.remoteIP().toString().c_str());
          break;
        }
      }
      
      if (!connected) {
        newClient.println("Too many connections");
        newClient.stop();
      }
    }
    
    // 处理所有客户端
    int active_clients = 0;
    for (int i = 0; i < TELNET_MAX_CLIENTS; i++) {
      if (_clients[i].client.connected()) {
        processClient(_clients[i]);
        active_clients++;
      }
    }
    
    // 更新状态
    _state = (active_clients > 0) ? TELNET_STATE_CONNECTED : TELNET_STATE_IDLE;
  }
  
  /**
   * 打印服务器状态信息
   */
  void printStatus() {
    Serial.println("\r\n=== Telnet Server Status ===");
    Serial.printf("Enabled: %s\r\n", _enabled ? "Yes" : "No");
    Serial.printf("State: %d\r\n", _state);
    Serial.printf("Port: %d\r\n", TELNET_PORT);
    Serial.printf("Max Clients: %d\r\n", TELNET_MAX_CLIENTS);
    Serial.printf("Connected: %d\r\n", connectedClients());
    
    for (int i = 0; i < TELNET_MAX_CLIENTS; i++) {
      if (_clients[i].client.connected()) {
        Serial.printf("Client %d: %s\r\n", 
                      i + 1, 
                      _clients[i].client.remoteIP().toString().c_str());
      }
    }
    Serial.println("============================\r\n");
  }
};

// 全局实例
extern TelnetServerClass TelnetServer;

#endif // TELNET_SERVER_H
