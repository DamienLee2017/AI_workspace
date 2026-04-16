import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Calculator, Code2, CircuitBoard, Menu, X, ChevronRight } from "lucide-react";

const navItems = [
  {
    title: "CNC参数计算器",
    path: "/calculator",
    icon: Calculator,
    description: "丝杠导程、步进电机、速度加速度、脉冲频率、切削参数",
  },
  {
    title: "Gcode编辑器",
    path: "/gcode",
    icon: Code2,
    description: "去除注释、压缩代码、批量修改、进给速度调整、回零指令",
  },
  {
    title: "Gerber转Gcode",
    path: "/gerber",
    icon: CircuitBoard,
    description: "PCB雕刻Gerber文件转换为Gcode指令",
  },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 lg:w-64 bg-card border-r border-border
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <CircuitBoard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm tracking-tight">CNC工具集</h1>
            <p className="text-xs text-muted-foreground">cnc-utils</p>
          </div>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            工具列表
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-start gap-3 px-3 py-3 rounded-lg
                      transition-all duration-150
                      group
                      ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className={`text-xs mt-0.5 leading-relaxed ${isActive ? "text-primary/70" : "text-muted-foreground"}`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-4 py-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            v1.0.0 · 在线使用无需安装
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 border-b border-border bg-card shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm text-foreground">
            {navItems.find((item) => location.pathname === item.path)?.title || "CNC工具集"}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
