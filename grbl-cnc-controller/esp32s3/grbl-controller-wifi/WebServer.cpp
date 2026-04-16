/**
 * ESP32-S3 Web Server Implementation
 * ESP32-S3 版本 Web 服务器实现
 * 提供 Web 控制界面和 REST API
 */

#include "WebServer.h"
#include "Config.h"

// ==================== Web 服务器实例 ====================
WebServer server(80);

// ==================== G代码命令队列 ====================
#include "grbl-controller-wifi.ino"

// ==================== HTML 页面 ====================
const char INDEX_HTML[] PROGMEM = R"=====(
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CNC Controller - Web Interface</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            color: #e0e0e0;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        h1 {
            color: #00d4ff;
            font-size: 1.8rem;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #666;
        }
        
        .status-dot.connected {
            background: #00ff88;
            box-shadow: 0 0 10px #00ff88;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 20px;
        }
        
        @media (max-width: 1024px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .panel {
            background: rgba(255,255,255,0.05);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .panel-title {
            color: #00d4ff;
            font-size: 1.2rem;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        /* 位置显示 */
        .position-display {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .axis-card {
            background: rgba(0,212,255,0.1);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        }
        
        .axis-label {
            font-size: 0.9rem;
            color: #888;
            margin-bottom: 5px;
        }
        
        .axis-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #00d4ff;
            font-family: 'Courier New', monospace;
        }
        
        .axis-unit {
            font-size: 0.8rem;
            color: #666;
        }
        
        /* JOG 控制 */
        .jog-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            max-width: 300px;
            margin: 0 auto;
        }
        
        .jog-btn {
            background: linear-gradient(145deg, #2a2a4a, #1a1a3a);
            border: none;
            border-radius: 10px;
            padding: 20px;
            color: #fff;
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .jog-btn:hover {
            background: linear-gradient(145deg, #3a3a6a, #2a2a5a);
            transform: scale(1.05);
        }
        
        .jog-btn:active {
            transform: scale(0.95);
        }
        
        .jog-btn.home {
            background: linear-gradient(145deg, #00d4ff, #0099cc);
            grid-column: 2;
        }
        
        .jog-center {
            grid-column: 2;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .jog-center .jog-btn {
            background: linear-gradient(145deg, #ff6b6b, #cc5555);
        }
        
        /* 速度控制 */
        .speed-control {
            margin-top: 20px;
        }
        
        .speed-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        input[type="range"] {
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: #333;
            outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #00d4ff;
            cursor: pointer;
        }
        
        /* 控制按钮 */
        .control-buttons {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        
        .ctrl-btn {
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .ctrl-btn.primary {
            background: linear-gradient(145deg, #00ff88, #00cc66);
            color: #000;
        }
        
        .ctrl-btn.secondary {
            background: linear-gradient(145deg, #ffaa00, #cc8800);
            color: #000;
        }
        
        .ctrl-btn.danger {
            background: linear-gradient(145deg, #ff5555, #cc3333);
            color: #fff;
        }
        
        .ctrl-btn.info {
            background: linear-gradient(145deg, #00d4ff, #0099cc);
            color: #000;
        }
        
        .ctrl-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        /* G代码输入 */
        .gcode-input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .gcode-input {
            flex: 1;
            padding: 12px 15px;
            border: 1px solid #333;
            border-radius: 8px;
            background: rgba(0,0,0,0.3);
            color: #fff;
            font-family: 'Courier New', monospace;
        }
        
        .gcode-input:focus {
            outline: none;
            border-color: #00d4ff;
        }
        
        /* 状态信息 */
        .status-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .status-item {
            background: rgba(0,0,0,0.2);
            padding: 12px;
            border-radius: 8px;
        }
        
        .status-item .label {
            font-size: 0.8rem;
            color: #888;
        }
        
        .status-item .value {
            font-size: 1.1rem;
            color: #00ff88;
            font-weight: bold;
        }
        
        /* 文件上传 */
        .upload-zone {
            border: 2px dashed #444;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .upload-zone:hover {
            border-color: #00d4ff;
            background: rgba(0,212,255,0.05);
        }
        
        .upload-zone.dragover {
            border-color: #00ff88;
            background: rgba(0,255,136,0.1);
        }
        
        /* 连接信息 */
        .connection-info {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        
        .connection-info p {
            margin: 5px 0;
            display: flex;
            justify-content: space-between;
        }
        
        .connection-info span {
            color: #00d4ff;
        }
        
        /* 实时数据 */
        #statusLog {
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 15px;
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
        }
        
        .log-entry {
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .log-entry.ok { color: #00ff88; }
        .log-entry.error { color: #ff5555; }
        .log-entry.info { color: #00d4ff; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎯 CNC Controller</h1>
            <div class="status-indicator">
                <div class="status-dot" id="connectionStatus"></div>
                <span id="connectionText">Disconnected</span>
            </div>
        </header>
        
        <div class="main-grid">
            <div class="left-column">
                <!-- 位置显示 -->
                <div class="panel">
                    <h2 class="panel-title">📍 Current Position</h2>
                    <div class="position-display">
                        <div class="axis-card">
                            <div class="axis-label">X Axis</div>
                            <div class="axis-value" id="posX">0.000</div>
                            <div class="axis-unit">mm</div>
                        </div>
                        <div class="axis-card">
                            <div class="axis-label">Y Axis</div>
                            <div class="axis-value" id="posY">0.000</div>
                            <div class="axis-unit">mm</div>
                        </div>
                        <div class="axis-card">
                            <div class="axis-label">Z Axis</div>
                            <div class="axis-value" id="posZ">0.000</div>
                            <div class="axis-unit">mm</div>
                        </div>
                    </div>
                    
                    <!-- JOG 控制 -->
                    <h2 class="panel-title">🎮 JOG Control</h2>
                    <div class="jog-grid">
                        <button class="jog-btn" onclick="jogAxis('Y', -1)" onmouseup="stopJog()" onmouseleave="stopJog()">-Y</button>
                        <button class="jog-btn" onclick="jogAxis('X', 1)" onmouseup="stopJog()" onmouseleave="stopJog()">+X</button>
                        <button class="jog-btn" onclick="jogAxis('Y', 1)" onmouseup="stopJog()" onmouseleave="stopJog()">+Y</button>
                        <button class="jog-btn home" onclick="homeAll()">🏠 HOME</button>
                        <button class="jog-btn" onclick="jogAxis('X', -1)" onmouseup="stopJog()" onmouseleave="stopJog()">-X</button>
                        <button class="jog-btn" onclick="jogAxis('Z', 1)" onmouseup="stopJog()" onmouseleave="stopJog()">+Z</button>
                        <button class="jog-btn" onclick="jogAxis('Z', -1)" onmouseup="stopJog()" onmouseleave="stopJog()">-Z</button>
                    </div>
                    
                    <div class="speed-control">
                        <div class="speed-label">
                            <span>JOG Speed</span>
                            <span id="speedValue">100%</span>
                        </div>
                        <input type="range" id="jogSpeed" min="10" max="100" value="100" onchange="updateSpeed()">
                    </div>
                </div>
                
                <!-- G代码输入 -->
                <div class="panel">
                    <h2 class="panel-title">⌨️ G-Code Command</h2>
                    <div class="gcode-input-group">
                        <input type="text" class="gcode-input" id="gcodeInput" placeholder="Enter G-code (e.g., G0 X10 Y10)">
                        <button class="ctrl-btn primary" onclick="sendGcode()">Send</button>
                    </div>
                    
                    <div class="gcode-input-group">
                        <input type="text" class="gcode-input" id="gcodeFile" placeholder="G-code file name" readonly>
                        <label class="ctrl-btn info">
                            📁 Upload File
                            <input type="file" accept=".nc,.gcode,.txt" style="display:none" onchange="uploadFile(this.files[0])">
                        </label>
                    </div>
                </div>
                
                <!-- 控制按钮 -->
                <div class="panel">
                    <h2 class="panel-title">⚡ Machine Control</h2>
                    <div class="control-buttons">
                        <button class="ctrl-btn primary" onclick="cycleStart()">▶ START</button>
                        <button class="ctrl-btn secondary" onclick="hold()">⏸ HOLD</button>
                        <button class="ctrl-btn danger" onclick="resetAlarm()">🔔 RESET</button>
                        <button class="ctrl-btn info" onclick="softReset()">🔄 REBOOT</button>
                    </div>
                    
                    <div class="control-buttons" style="margin-top: 15px;">
                        <button class="ctrl-btn info" onclick="spindleOn()">主轴 ON</button>
                        <button class="ctrl-btn secondary" onclick="spindleOff()">主轴 OFF</button>
                        <button class="ctrl-btn primary" onclick="setOrigin()">原点设置</button>
                        <button class="ctrl-btn danger" onclick="emergencyStop()">🛑 急停</button>
                    </div>
                </div>
                
                <!-- 日志 -->
                <div class="panel">
                    <h2 class="panel-title">📋 Status Log</h2>
                    <div id="statusLog">
                        <div class="log-entry info">System ready...</div>
                    </div>
                </div>
            </div>
            
            <div class="right-column">
                <!-- 连接信息 -->
                <div class="panel">
                    <h2 class="panel-title">🌐 Connection</h2>
                    <div class="connection-info">
                        <p>IP Address: <span id="ipAddress">---.---.---.---</span></p>
                        <p>MAC Address: <span id="macAddress">--:--:--:--:--:--</span></p>
                        <p>Signal: <span id="wifiSignal">-- dBm</span></p>
                        <p>Uptime: <span id="uptime">0:00:00</span></p>
                    </div>
                </div>
                
                <!-- 状态信息 -->
                <div class="panel">
                    <h2 class="panel-title">📊 Machine Status</h2>
                    <div class="status-grid">
                        <div class="status-item">
                            <div class="label">State</div>
                            <div class="value" id="machineState">IDLE</div>
                        </div>
                        <div class="status-item">
                            <div class="label">Feed Rate</div>
                            <div class="value" id="feedRate">0</div>
                        </div>
                        <div class="status-item">
                            <div class="label">Spindle</div>
                            <div class="value" id="spindleSpeed">0 RPM</div>
                        </div>
                        <div class="status-item">
                            <div class="label">Buffer</div>
                            <div class="value" id="bufferStatus">OK</div>
                        </div>
                    </div>
                </div>
                
                <!-- 原点状态 -->
                <div class="panel">
                    <h2 class="panel-title">🏠 Homing Status</h2>
                    <div class="status-grid">
                        <div class="status-item">
                            <div class="label">X Home</div>
                            <div class="value" id="xHome">✗</div>
                        </div>
                        <div class="status-item">
                            <div class="label">Y Home</div>
                            <div class="value" id="yHome">✗</div>
                        </div>
                        <div class="status-item">
                            <div class="label">Z Home</div>
                            <div class="value" id="zHome">✗</div>
                        </div>
                        <div class="status-item">
                            <div class="label">All Homed</div>
                            <div class="value" id="allHomed">✗</div>
                        </div>
                    </div>
                </div>
                
                <!-- 快捷命令 -->
                <div class="panel">
                    <h2 class="panel-title">⚡ Quick Commands</h2>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <button class="ctrl-btn secondary" onclick="quickCommand('G28')">G28 Home</button>
                        <button class="ctrl-btn secondary" onclick="quickCommand('G28.1')">Set Home</button>
                        <button class="ctrl-btn info" onclick="quickCommand('G90')">Abs Mode</button>
                        <button class="ctrl-btn info" onclick="quickCommand('G91')">Rel Mode</button>
                        <button class="ctrl-btn secondary" onclick="quickCommand('M5')">Spindle Off</button>
                        <button class="ctrl-btn info" onclick="quickCommand('$$')">View Settings</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket 连接
        let ws = null;
        let reconnectTimer = null;
        let updateTimer = null;
        
        // 初始化
        function init() {
            getConnectionInfo();
            connectWebSocket();
            startUpdateTimer();
        }
        
        // 获取连接信息
        function getConnectionInfo() {
            fetch('/api/info')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('ipAddress').textContent = data.ip;
                    document.getElementById('macAddress').textContent = data.mac;
                    document.getElementById('wifiSignal').textContent = data.rssi + ' dBm';
                    updateUptime(data.uptime);
                });
        }
        
        // WebSocket 连接
        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                document.getElementById('connectionStatus').classList.add('connected');
                document.getElementById('connectionText').textContent = 'Connected';
                addLog('WebSocket connected', 'ok');
            };
            
            ws.onclose = () => {
                console.log('WebSocket disconnected');
                document.getElementById('connectionStatus').classList.remove('connected');
                document.getElementById('connectionText').textContent = 'Disconnected';
                addLog('WebSocket disconnected', 'error');
                reconnectTimer = setTimeout(connectWebSocket, 3000);
            };
            
            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleStatusUpdate(data);
            };
        }
        
        // 处理状态更新
        function handleStatusUpdate(data) {
            if (data.type === 'status') {
                document.getElementById('posX').textContent = data.x.toFixed(3);
                document.getElementById('posY').textContent = data.y.toFixed(3);
                document.getElementById('posZ').textContent = data.z.toFixed(3);
                document.getElementById('machineState').textContent = data.state;
                document.getElementById('feedRate').textContent = data.feed;
                document.getElementById('spindleSpeed').textContent = data.spindle + ' RPM';
                
                // 更新原点状态
                document.getElementById('xHome').textContent = data.homed ? '✓' : '✗';
                document.getElementById('yHome').textContent = data.homed ? '✓' : '✗';
                document.getElementById('zHome').textContent = data.homed ? '✓' : '✗';
                document.getElementById('allHomed').textContent = data.allHomed ? '✓' : '✗';
            }
        }
        
        // JOG 控制
        function jogAxis(axis, direction) {
            const speed = document.getElementById('jogSpeed').value;
            fetch(`/api/jog?axis=${axis}&dir=${direction}&speed=${speed}`)
                .then(r => r.json())
                .then(data => {
                    if (data.error) addLog(data.error, 'error');
                });
        }
        
        function stopJog() {
            fetch('/api/jog/stop')
                .then(r => r.json());
        }
        
        function homeAll() {
            fetch('/api/home')
                .then(r => r.json())
                .then(data => addLog(data.message, 'info'));
        }
        
        function updateSpeed() {
            document.getElementById('speedValue').textContent = 
                document.getElementById('jogSpeed').value + '%';
        }
        
        // G代码命令
        function sendGcode() {
            const cmd = document.getElementById('gcodeInput').value.trim();
            if (!cmd) return;
            
            fetch('/api/gcode', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({command: cmd})
            })
            .then(r => r.json())
            .then(data => {
                addLog('> ' + cmd, 'info');
                if (data.ok) addLog(data.response, 'ok');
                else addLog(data.error, 'error');
            });
            
            document.getElementById('gcodeInput').value = '';
        }
        
        function quickCommand(cmd) {
            fetch('/api/gcode', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({command: cmd})
            })
            .then(r => r.json())
            .then(data => addLog('> ' + cmd, 'info'));
        }
        
        // 文件上传
        function uploadFile(file) {
            if (!file) return;
            
            document.getElementById('gcodeFile').value = file.name;
            addLog('Uploading: ' + file.name, 'info');
            
            const formData = new FormData();
            formData.append('file', file);
            
            fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    addLog('File uploaded: ' + file.name, 'ok');
                } else {
                    addLog('Upload failed: ' + data.error, 'error');
                }
            });
        }
        
        // 机器控制
        function cycleStart() {
            fetch('/api/control?cmd=start')
                .then(r => r.json())
                .then(data => addLog(data.message, 'info'));
        }
        
        function hold() {
            fetch('/api/control?cmd=hold')
                .then(r => r.json())
                .then(data => addLog(data.message, 'info'));
        }
        
        function resetAlarm() {
            fetch('/api/control?cmd=reset')
                .then(r => r.json())
                .then(data => addLog(data.message, 'info'));
        }
        
        function softReset() {
            if (confirm('Reboot controller?')) {
                fetch('/api/control?cmd=reboot')
                    .then(() => {
                        addLog('Rebooting...', 'info');
                        setTimeout(() => location.reload(), 3000);
                    });
            }
        }
        
        function spindleOn() {
            quickCommand('M3 S1000');
        }
        
        function spindleOff() {
            quickCommand('M5');
        }
        
        function setOrigin() {
            quickCommand('G28.1');
        }
        
        function emergencyStop() {
            fetch('/api/control?cmd=estop')
                .then(r => r.json())
                .then(data => {
                    addLog('EMERGENCY STOP!', 'error');
                });
        }
        
        // 日志
        function addLog(message, type) {
            const log = document.getElementById('statusLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + type;
            entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
        
        // 定时更新
        function startUpdateTimer() {
            updateTimer = setInterval(() => {
                // 通过轮询获取状态
                fetch('/api/status')
                    .then(r => r.json())
                    .then(data => handleStatusUpdate({type: 'status', ...data}));
            }, 500);
        }
        
        // 运行时间
        let startTime = Date.now();
        function updateUptime(seconds) {
            if (!seconds) return;
            startTime = Date.now() - seconds * 1000;
        }
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = elapsed % 60;
            document.getElementById('uptime').textContent = 
                `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }, 1000);
        
        // 回车发送G代码
        document.getElementById('gcodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendGcode();
        });
        
        // 初始化
        window.addEventListener('load', init);
    </script>
</body>
</html>
)=====";

// ==================== API 处理函数 ====================

// 获取系统信息
void handleApiInfo() {
    StaticJsonDocument<512> doc;
    
    doc["ip"] = WiFi.localIP().toString();
    doc["mac"] = WiFi.macAddress();
    doc["rssi"] = WiFi.RSSI();
    doc["uptime"] = millis() / 1000;
    doc["version"] = FIRMWARE_VERSION;
    doc["board"] = "ESP32-S3";
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

// 获取状态
void handleApiStatus() {
    StaticJsonDocument<512> doc;
    
    doc["x"] = getPositionX();
    doc["y"] = getPositionY();
    doc["z"] = getPositionZ();
    doc["state"] = getMachineState();
    doc["feed"] = getCurrentFeedRate();
    doc["spindle"] = getSpindleSpeed();
    doc["homed"] = isHomed();
    doc["allHomed"] = isAllHomed();
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

// JOG 控制
void handleApiJog() {
    if (!server.hasArg("axis") || !server.hasArg("dir")) {
        server.send(400, "application/json", "{\"error\":\"Missing parameters\"}");
        return;
    }
    
    String axis = server.arg("axis");
    int dir = server.arg("dir").toInt();
    int speed = server.hasArg("speed") ? server.arg("speed").toInt() : 100;
    
    float distance = (speed / 100.0) * JOG_STEP_SIZE;
    
    if (axis == "X") {
        jogRelative('X', dir > 0 ? distance : -distance);
    } else if (axis == "Y") {
        jogRelative('Y', dir > 0 ? distance : -distance);
    } else if (axis == "Z") {
        jogRelative('Z', dir > 0 ? distance : -distance);
    }
    
    server.send(200, "application/json", "{\"ok\":true}");
}

void handleApiJogStop() {
    stopJog();
    server.send(200, "application/json", "{\"ok\":true}");
}

// 归零
void handleApiHome() {
    startHomingCycle();
    server.send(200, "application/json", "{\"message\":\"Homing started\"}");
}

// G代码命令
void handleApiGcode() {
    if (!server.hasArg("plain")) {
        server.send(400, "application/json", "{\"error\":\"No command\"}");
        return;
    }
    
    String command = server.arg("plain");
    command.trim();
    
    if (command.length() == 0) {
        server.send(400, "application/json", "{\"error\":\"Empty command\"}");
        return;
    }
    
    // 添加到命令队列
    String response = queueGcodeCommand(command);
    
    StaticJsonDocument<256> doc;
    doc["ok"] = true;
    doc["response"] = response;
    
    String json;
    serializeJson(doc, json);
    server.send(200, "application/json", json);
}

// 文件上传
void handleApiUpload() {
    HTTPUpload& upload = server.upload();
    
    static File uploadFile;
    
    if (upload.status == UPLOAD_FILE_START) {
        String filename = upload.filename;
        if (!filename.endsWith(".gcode") && !filename.endsWith(".nc") && !filename.endsWith(".txt")) {
            filename += ".gcode";
        }
        
        uploadFile = SPIFFS.open("/uploads/" + filename, FILE_WRITE);
        if (!uploadFile) {
            server.send(500, "application/json", "{\"error\":\"Cannot create file\"}");
            return;
        }
        
        Serial.printf("Upload started: %s\n", filename.c_str());
    } else if (upload.status == UPLOAD_FILE_WRITE) {
        if (uploadFile) {
            uploadFile.write(upload.buf, upload.totalSize);
        }
    } else if (upload.status == UPLOAD_FILE_END) {
        if (uploadFile) {
            uploadFile.close();
        }
        Serial.printf("Upload complete: %s (%d bytes)\n", upload.filename.c_str(), upload.totalSize);
    }
    
    server.send(200, "application/json", "{\"ok\":true}");
}

// 机器控制
void handleApiControl() {
    if (!server.hasArg("cmd")) {
        server.send(400, "application/json", "{\"error\":\"Missing command\"}");
        return;
    }
    
    String cmd = server.arg("cmd");
    String message = "OK";
    
    if (cmd == "start") {
        startCycle();
        message = "Cycle started";
    } else if (cmd == "hold") {
        holdCycle();
        message = "Hold";
    } else if (cmd == "reset") {
        resetAlarm();
        message = "Alarm reset";
    } else if (cmd == "reboot") {
        ESP.restart();
    } else if (cmd == "estop") {
        emergencyStop();
        message = "EMERGENCY STOP";
    }
    
    server.send(200, "application/json", "{\"message\":\"" + message + "\"}");
}

// ==================== WebSocket 处理 ====================
WebSocket *wsClient = nullptr;

void handleWebSocket(void *arg, uint8_t *data, size_t len) {
    AwsFrameInfo *info = (AwsFrameInfo*)arg;
    
    if (info->final && info->index == 0 && info->len == len) {
        data[len] = 0;
        
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, data);
        
        if (!error) {
            const char* type = doc["type"];
            
            if (strcmp(type, "gcode") == 0) {
                const char* cmd = doc["command"];
                queueGcodeCommand(cmd);
            } else if (strcmp(type, "jog") == 0) {
                const char* axis = doc["axis"];
                float dist = doc["distance"];
                jogRelative(axis[0], dist);
            } else if (strcmp(type, "status") == 0) {
                // 发送状态更新
                sendStatusWebSocket();
            }
        }
    }
}

void sendStatusWebSocket() {
    if (wsClient && wsClient->available()) {
        StaticJsonDocument<512> doc;
        
        doc["type"] = "status";
        doc["x"] = getPositionX();
        doc["y"] = getPositionY();
        doc["z"] = getPositionZ();
        doc["state"] = getMachineState();
        doc["feed"] = getCurrentFeedRate();
        doc["spindle"] = getSpindleSpeed();
        doc["homed"] = isHomed();
        
        String json;
        serializeJson(doc, json);
        
        wsClient->text(json);
    }
}

void onWsEvent(uint8_t num, WStype_t type, uint8_t *data, size_t len) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("WebSocket[%u] Disconnected\n", num);
            break;
        case WStype_CONNECTED:
            Serial.printf("WebSocket[%u] Connected\n", num);
            break;
        case WStype_TEXT:
            handleWebSocket(NULL, data, len);
            break;
        case WStype_BIN:
            break;
        default:
            break;
    }
}

// ==================== 初始化 Web 服务器 ====================
void initWebServer() {
    // 创建上传目录
    if (!SPIFFS.exists("/uploads")) {
        SPIFFS.mkdir("/uploads");
    }
    
    // 首页
    server.on("/", HTTP_GET, []() {
        server.send_P(200, "text/html", INDEX_HTML);
    });
    
    // API 路由
    server.on("/api/info", HTTP_GET, handleApiInfo);
    server.on("/api/status", HTTP_GET, handleApiStatus);
    server.on("/api/jog", HTTP_GET, handleApiJog);
    server.on("/api/jog/stop", HTTP_GET, handleApiJogStop);
    server.on("/api/home", HTTP_GET, handleApiHome);
    server.on("/api/gcode", HTTP_POST, handleApiGcode);
    server.on("/api/upload", HTTP_POST, []() {
        handleApiUpload();
    }, handleApiUpload);
    server.on("/api/control", HTTP_GET, handleApiControl);
    
    // 文件列表
    server.on("/api/files", HTTP_GET, []() {
        String json = "[";
        File root = SPIFFS.open("/uploads");
        File file = root.openNextFile();
        bool first = true;
        while (file) {
            if (!first) json += ",";
            json += "{\"name\":\"" + String(file.name()).substring(1) + "\",";
            json += "\"size\":" + String(file.size()) + "}";
            file = root.openNextFile();
            first = false;
        }
        json += "]";
        server.send(200, "application/json", json);
    });
    
    // WebSocket
    wsServer.onEvent(onWsEvent);
    wsServer.begin();
    
    // 启动服务器
    server.begin();
    Serial.println("Web Server started");
}

void updateWebServer() {
    wsServer.loop();
    server.handleClient();
}
