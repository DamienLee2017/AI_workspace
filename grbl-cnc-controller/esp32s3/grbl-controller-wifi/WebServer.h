/**
 * WebServer.h
 * ESP32-S3 Web 控制界面服务器
 * 
 * 作者: DamienLee2017
 * 许可证: MIT
 */

#ifndef WEBSERVER_H
#define WEBSERVER_H

#include <WiFi.h>
#include <WebServer.h>
#include <Update.h>
#include <SPIFFS.h>

// WebServer 实例
extern WebServer server;

// ==================== WiFi 配置 ====================

// 默认 AP 模式配置
#ifndef WIFI_SSID_PREFIX
#define WIFI_SSID_PREFIX "CNC_Controller_"
#endif

#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "12345678"
#endif

#ifndef WIFI_CHANNEL
#define WIFI_CHANNEL 1
#endif

// 默认 STA 模式配置
#ifndef STA_WIFI_SSID
#define STA_WIFI_SSID ""
#endif

#ifndef STA_WIFI_PASSWORD
#define STA_WIFI_PASSWORD ""
#endif

// 超时配置
#ifndef WIFI_AP_TIMEOUT
#define WIFI_AP_TIMEOUT 0  // 0 表示不超时
#endif

// ==================== Telnet 配置 ====================

#ifndef TELNET_PORT
#define TELNET_PORT 23
#endif

#ifndef MAX_TELNET_CLIENTS
#define MAX_TELNET_CLIENTS 3
#endif

// ==================== 函数声明 ====================

// WiFi 管理
void initWiFi();
void startAPMode();
void startSTAMode();
void handleWiFiManager();
String getDeviceIP();
String getConnectionMode();

// Telnet 服务器
void initTelnet();
void handleTelnetClients();
void telnetPrint(const String& message);

// Web 服务器
void initWebServer();
void handleRoot();
void handleStatus();
void handleCommand();
void handleJog();
void handleGCodeUpload();
void handleSettings();
void handleFirmwareUpdate();
void handleNotFound();
void handleReset();

// ==================== Web 页面 HTML ====================

const char INDEX_HTML[] PROGMEM = R"=====(
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CNC Controller</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            color: #fff;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .header h1 { font-size: 2.5rem; color: #00d4ff; margin-bottom: 10px; }
        .status-bar {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            margin: 20px 0;
        }
        .status-item {
            background: rgba(255,255,255,0.1);
            padding: 15px 25px;
            border-radius: 10px;
            text-align: center;
            min-width: 120px;
        }
        .status-item .label { font-size: 0.9rem; color: #888; }
        .status-item .value { font-size: 1.5rem; font-weight: bold; color: #00d4ff; }
        .status-item.alert .value { color: #ff4757; }
        .status-item.ready .value { color: #2ed573; }
        .status-item.warning .value { color: #ffa502; }
        .panel {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
        }
        .panel h2 {
            font-size: 1.3rem;
            margin-bottom: 20px;
            color: #00d4ff;
            border-bottom: 2px solid #00d4ff;
            padding-bottom: 10px;
        }
        .coord-display {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .coord-item {
            background: rgba(0,212,255,0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .coord-item .axis { font-size: 1.8rem; font-weight: bold; color: #00d4ff; }
        .coord-item .pos { font-size: 1.2rem; margin-top: 5px; font-family: monospace; }
        .btn-group { display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0; }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
        }
        .btn-primary { background: #00d4ff; color: #1a1a2e; }
        .btn-primary:hover { background: #00b8e6; transform: translateY(-2px); }
        .btn-danger { background: #ff4757; color: white; }
        .btn-danger:hover { background: #ff3344; }
        .btn-warning { background: #ffa502; color: #1a1a2e; }
        .btn-warning:hover { background: #ff9100; }
        .btn-success { background: #2ed573; color: #1a1a2e; }
        .btn-success:hover { background: #26b863; }
        .btn-secondary { background: #57606f; color: white; }
        .btn-secondary:hover { background: #485461; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .jog-controls {
            display: grid;
            grid-template-columns: repeat(3, 80px);
            grid-template-rows: repeat(3, 80px);
            gap: 10px;
            max-width: 270px;
            margin: 20px auto;
        }
        .jog-btn {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            font-size: 1.5rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(145deg, #2a2a4a, #1a1a3a);
            color: #00d4ff;
            border: 2px solid #00d4ff;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
        }
        .jog-btn:hover { background: #00d4ff; color: #1a1a2e; }
        .jog-btn:active { transform: scale(0.95); }
        .jog-btn.y-plus { grid-column: 2; grid-row: 1; }
        .jog-btn.x-minus { grid-column: 1; grid-row: 2; }
        .jog-btn.home { grid-column: 2; grid-row: 2; background: #00d4ff; color: #1a1a2e; }
        .jog-btn.x-plus { grid-column: 3; grid-row: 2; }
        .jog-btn.y-minus { grid-column: 2; grid-row: 3; }
        .jog-btn.z-plus, .jog-btn.z-minus {
            width: 60px;
            height: 60px;
            font-size: 1.2rem;
            margin: 0 auto;
            grid-column: 1;
        }
        .jog-btn.z-plus { grid-row: 1; }
        .jog-btn.z-minus { grid-row: 3; }
        .input-group { margin: 15px 0; }
        .input-group label { display: block; margin-bottom: 5px; color: #888; }
        .input-group input, .input-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #333;
            border-radius: 8px;
            background: #2a2a4a;
            color: #fff;
            font-size: 1rem;
        }
        .input-group input:focus, .input-group select:focus {
            outline: none;
            border-color: #00d4ff;
        }
        .command-input {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .command-input input {
            flex: 1;
            padding: 15px;
            border: 2px solid #00d4ff;
            border-radius: 10px;
            background: #1a1a3a;
            color: #fff;
            font-family: monospace;
            font-size: 1.1rem;
        }
        .command-input button { padding: 15px 30px; }
        .console {
            background: #0a0a1a;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 15px;
            height: 250px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            margin: 15px 0;
        }
        .console div { margin: 5px 0; }
        .console .cmd { color: #00d4ff; }
        .console .response { color: #2ed573; }
        .console .error { color: #ff4757; }
        .console .info { color: #ffa502; }
        .file-list { margin: 15px 0; }
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            margin: 5px 0;
        }
        .file-item span { font-family: monospace; }
        .progress-bar {
            width: 100%;
            height: 25px;
            background: #2a2a4a;
            border-radius: 12px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-bar .fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff, #2ed573);
            transition: width 0.3s;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 1.8rem; }
            .jog-controls { transform: scale(0.8); }
            .status-bar { gap: 10px; }
            .status-item { min-width: 100px; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚙️ CNC Controller</h1>
            <p id="status">Connecting...</p>
        </div>

        <div class="status-bar">
            <div class="status-item" id="state-item">
                <div class="label">状态</div>
                <div class="value" id="machine-state">--</div>
            </div>
            <div class="status-item">
                <div class="label">进给率</div>
                <div class="value" id="feed-rate">0</div>
            </div>
            <div class="status-item">
                <div class="label">主轴</div>
                <div class="value" id="spindle-speed">0</div>
            </div>
            <div class="status-item" id="limits-item">
                <div class="label">限位</div>
                <div class="value" id="limits">OK</div>
            </div>
        </div>

        <div class="panel">
            <h2>📍 当前位置</h2>
            <div class="coord-display">
                <div class="coord-item">
                    <div class="axis">X</div>
                    <div class="pos" id="pos-x">0.000</div>
                </div>
                <div class="coord-item">
                    <div class="axis">Y</div>
                    <div class="pos" id="pos-y">0.000</div>
                </div>
                <div class="coord-item">
                    <div class="axis">Z</div>
                    <div class="pos" id="pos-z">0.000</div>
                </div>
                <div class="coord-item">
                    <div class="axis">W</div>
                    <div class="pos" id="work-x">0.000</div>
                </div>
                <div class="coord-item">
                    <div class="axis">W</div>
                    <div class="pos" id="work-y">0.000</div>
                </div>
                <div class="coord-item">
                    <div class="axis">W</div>
                    <div class="pos" id="work-z">0.000</div>
                </div>
            </div>
        </div>

        <div class="panel">
            <h2>🎮 JOG 手轮控制</h2>
            <div class="input-group">
                <label>步进距离 (mm)</label>
                <select id="jog-step">
                    <option value="0.1">0.1 mm</option>
                    <option value="1" selected>1 mm</option>
                    <option value="5">5 mm</option>
                    <option value="10">10 mm</option>
                    <option value="50">50 mm</option>
                </select>
            </div>
            <div class="jog-controls">
                <button class="jog-btn z-plus" data-axis="Z" data-dir="+">↑</button>
                <button class="jog-btn y-plus" data-axis="Y" data-dir="+">Y+</button>
                <button class="jog-btn x-minus" data-axis="X" data-dir="-">X-</button>
                <button class="jog-btn home" id="home-all">🏠</button>
                <button class="jog-btn x-plus" data-axis="X" data-dir="+">X+</button>
                <button class="jog-btn y-minus" data-axis="Y" data-dir="-">Y-</button>
                <button class="jog-btn z-minus" data-axis="Z" data-dir="-">↓</button>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" id="start-homing">🔍 归零</button>
                <button class="btn btn-warning" id="reset-alarm">🔓 解除报警</button>
                <button class="btn btn-danger" id="emergency-stop">🛑 急停</button>
            </div>
        </div>

        <div class="panel">
            <h2>📝 G 代码命令</h2>
            <div class="command-input">
                <input type="text" id="gcode-command" placeholder="输入 G 代码命令，如 G1 X10 Y20 F100" onkeypress="handleKeyPress(event)">
                <button class="btn btn-primary" onclick="sendCommand()">发送</button>
            </div>
            <div class="console" id="console"></div>
            <div class="btn-group">
                <button class="btn btn-success" id="spindle-on" onclick="spindleControl(true)">主轴启动</button>
                <button class="btn btn-secondary" id="spindle-off" onclick="spindleControl(false)">主轴停止</button>
                <button class="btn btn-secondary" onclick="clearConsole()">清除日志</button>
            </div>
        </div>

        <div class="panel">
            <h2>📁 G 代码文件</h2>
            <div class="file-list" id="file-list">
                <p style="color: #666;">加载中...</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="refreshFiles()">🔄 刷新</button>
            </div>
        </div>

        <div class="panel">
            <h2>⚡ 快速命令</h2>
            <div class="btn-group">
                <button class="btn btn-secondary" onclick="quickCommand('G28')">归零 G28</button>
                <button class="btn btn-secondary" onclick="quickCommand('G90')">绝对坐标</button>
                <button class="btn btn-secondary" onclick="quickCommand('G91')">相对坐标</button>
                <button class="btn btn-secondary" onclick="quickCommand('$X')">解锁 $X</button>
                <button class="btn btn-secondary" onclick="quickCommand('$$')">查看设置 $$</button>
            </div>
        </div>

        <div class="footer">
            <p>GRBL CNC Controller Web Interface | ESP32-S3</p>
        </div>
    </div>

    <script>
        const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = location.host;
        let ws = null;
        let reconnectTimer = null;
        
        function initWebSocket() {
            ws = new WebSocket(`${wsProtocol}//${wsHost}/ws`);
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                addConsole('Connected to CNC Controller', 'info');
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleStatusUpdate(data);
            };
            
            ws.onclose = () => {
                console.log('WebSocket disconnected');
                addConsole('Connection lost, reconnecting...', 'error');
                reconnectTimer = setTimeout(initWebSocket, 2000);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
        
        function handleStatusUpdate(data) {
            // 更新位置显示
            if (data.mpos) {
                document.getElementById('pos-x').textContent = data.mpos.x.toFixed(3);
                document.getElementById('pos-y').textContent = data.mpos.y.toFixed(3);
                document.getElementById('pos-z').textContent = data.mpos.z.toFixed(3);
            }
            if (data.wco) {
                document.getElementById('work-x').textContent = data.wco.x.toFixed(3);
                document.getElementById('work-y').textContent = data.wco.y.toFixed(3);
                document.getElementById('work-z').textContent = data.wco.z.toFixed(3);
            }
            // 更新状态
            if (data.state) {
                document.getElementById('machine-state').textContent = data.state;
                const stateItem = document.getElementById('state-item');
                if (data.state === 'Idle' || data.state === 'Check') {
                    stateItem.className = 'status-item ready';
                } else if (data.state === 'Alarm') {
                    stateItem.className = 'status-item alert';
                } else {
                    stateItem.className = 'status-item warning';
                }
            }
            if (data.feed) {
                document.getElementById('feed-rate').textContent = data.feed;
            }
            if (data.spindle) {
                document.getElementById('spindle-speed').textContent = data.spindle;
            }
            if (data.limits !== undefined) {
                document.getElementById('limits').textContent = data.limits ? 'TRIGGERED' : 'OK';
                document.getElementById('limits-item').className = data.limits ? 'status-item alert' : 'status-item';
            }
        }
        
        function sendCommand(cmd) {
            if (cmd && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'gcode', cmd: cmd }));
                addConsole('> ' + cmd, 'cmd');
            }
        }
        
        function sendJog(axis, dir) {
            const step = parseFloat(document.getElementById('jog-step').value);
            const distance = dir === '+' ? step : -step;
            sendCommand('$' + axis + '=' + distance);
        }
        
        function homeAll() {
            sendCommand('$H');
        }
        
        function spindleControl(on) {
            sendCommand(on ? 'M3' : 'M5');
        }
        
        function quickCommand(cmd) {
            sendCommand(cmd);
        }
        
        function emergencyStop() {
            if (confirm('确认执行急停？')) {
                sendCommand('!');
                sendCommand('M5');
            }
        }
        
        function resetAlarm() {
            sendCommand('$X');
        }
        
        function handleKeyPress(e) {
            if (e.key === 'Enter') {
                sendCommand();
            }
        }
        
        function addConsole(msg, type) {
            const console = document.getElementById('console');
            const div = document.createElement('div');
            div.className = type;
            div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
            console.appendChild(div);
            console.scrollTop = console.scrollHeight;
        }
        
        function clearConsole() {
            document.getElementById('console').innerHTML = '';
        }
        
        function refreshFiles() {
            fetch('/api/files')
                .then(r => r.json())
                .then(data => {
                    const list = document.getElementById('file-list');
                    if (data.files && data.files.length > 0) {
                        list.innerHTML = data.files.map(f => 
                            `<div class="file-item">
                                <span>${f.name}</span>
                                <span>${f.size}</span>
                                <button class="btn btn-secondary" onclick="sendFile('${f.name}')">发送</button>
                            </div>`
                        ).join('');
                    } else {
                        list.innerHTML = '<p style="color: #666;">没有找到 G 代码文件</p>';
                    }
                });
        }
        
        function sendFile(filename) {
            if (confirm('发送文件 ' + filename + '？')) {
                sendCommand('%file ' + filename);
            }
        }
        
        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            initWebSocket();
            refreshFiles();
            
            // JOG 按钮事件
            document.querySelectorAll('.jog-btn[data-axis]').forEach(btn => {
                btn.addEventListener('click', () => {
                    sendJog(btn.dataset.axis, btn.dataset.dir);
                });
                btn.addEventListener('mousedown', () => btn.classList.add('active'));
                btn.addEventListener('mouseup', () => btn.classList.remove('active'));
                btn.addEventListener('mouseleave', () => btn.classList.remove('active'));
            });
            
            document.getElementById('home-all').addEventListener('click', homeAll);
            document.getElementById('emergency-stop').addEventListener('click', emergencyStop);
            document.getElementById('reset-alarm').addEventListener('click', resetAlarm);
            
            // 状态更新
            setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'status' }));
                }
            }, 500);
        });
    </script>
</body>
</html>
)=====";

// ==================== WiFi 管理类 ====================

class WiFiManager {
private:
    bool apMode;
    unsigned long apStartTime;
    
public:
    WiFiManager() : apMode(false), apStartTime(0) {}
    
    void begin() {
        // 首先尝试 STA 模式
        if (strlen(STA_WIFI_SSID) > 0) {
            startSTAMode();
        } else {
            startAPMode();
        }
    }
    
    void startAPMode() {
        // 生成设备特定 SSID
        String ssid = WIFI_SSID_PREFIX + String((uint32_t)ESP.getEfuseMac(), HEX);
        
        WiFi.mode(WIFI_AP);
        delay(100);
        
        bool success = WiFi.softAP(ssid.c_str(), WIFI_PASSWORD, WIFI_CHANNEL);
        
        if (success) {
            Serial.println("AP Mode Started");
            Serial.print("SSID: ");
            Serial.println(ssid);
            Serial.print("Password: ");
            Serial.println(WIFI_PASSWORD);
            Serial.print("IP Address: ");
            Serial.println(WiFi.softAPIP());
            apMode = true;
            apStartTime = millis();
        } else {
            Serial.println("Failed to start AP Mode");
        }
    }
    
    void startSTAMode() {
        WiFi.mode(WIFI_STA);
        WiFi.setAutoConnect(false);
        
        Serial.print("Connecting to ");
        Serial.println(STA_WIFI_SSID);
        
        WiFi.begin(STA_WIFI_SSID, STA_WIFI_PASSWORD);
        
        // 等待连接
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 50) {
            delay(500);
            Serial.print(".");
            attempts++;
        }
        
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\nSTA Mode Connected!");
            Serial.print("IP Address: ");
            Serial.println(WiFi.localIP());
            Serial.print("RSSI: ");
            Serial.print(WiFi.RSSI());
            Serial.println(" dBm");
            apMode = false;
        } else {
            Serial.println("\nSTA Connection Failed, starting AP Mode");
            startAPMode();
        }
    }
    
    void handle() {
        if (apMode && WIFI_AP_TIMEOUT > 0) {
            // 检查 AP 超时
            if (millis() - apStartTime > (WIFI_AP_TIMEOUT * 1000UL)) {
                // 尝试切换到 STA 模式
                if (strlen(STA_WIFI_SSID) > 0) {
                    WiFi.softAPdisconnect(true);
                    delay(100);
                    startSTAMode();
                }
            }
        }
    }
    
    String getMode() {
        return apMode ? "AP" : "STA";
    }
    
    String getIP() {
        if (apMode) {
            return WiFi.softAPIP().toString();
        } else {
            return WiFi.localIP().toString();
        }
    }
    
    String getSSID() {
        if (apMode) {
            return WiFi.softAPgetSSID();
        } else {
            return WiFi.SSID();
        }
    }
    
    bool isConnected() {
        return apMode || WiFi.status() == WL_CONNECTED;
    }
};

#endif // WEBSERVER_H
