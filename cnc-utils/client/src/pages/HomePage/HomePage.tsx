import { Calculator, FileCode, CircuitBoard, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  {
    id: "calculator",
    title: "CNC参数计算器",
    description: "丝杠导程、步进电机细分、速度加速度、脉冲频率、切削参数等精密计算",
    icon: Calculator,
    path: "/calculator",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "gcode",
    title: "Gcode编辑器",
    description: "去除注释、代码压缩、进给速度调整、批量修改、回零指令添加等后处理",
    icon: FileCode,
    path: "/gcode",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "gerber",
    title: "Gerber转Gcode",
    description: "PCB雕刻文件转换，支持 Gerber 格式导入并生成适配雕刻机的 Gcode",
    icon: CircuitBoard,
    path: "/gerber",
    color: "from-violet-500 to-purple-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 顶部装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* 头部区域 */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-slate-300">在线工具 · 无需安装</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            CNC 工具集
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            专业级 CNC 加工参数计算、Gcode 编辑优化、Gerber 转 Gcode 的一站式解决方案
          </p>
        </header>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* 渐变背景 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              
              {/* 图标 */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="w-7 h-7 text-white" />
              </div>

              {/* 内容 */}
              <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
                {tool.title}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {tool.description}
              </p>

              {/* 箭头指示 */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* 底部信息 */}
        <footer className="text-center text-sm text-slate-500">
          <p>支持所有主流 CNC 控制系统 · 实时计算 · 数据本地处理</p>
        </footer>
      </div>
    </div>
  );
}
