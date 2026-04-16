# G-code Toolpath Simulator - GitHub 推送指南

## 快速推送命令

如果您有 GitHub 访问权限，请在本地执行以下命令：

```bash
# 方法1: 使用已提交的仓库
cd gcode-toolpath-simulator
git remote set-url origin https://github.com/DamienLee2017/AI_workspace.git
git push -u origin master

# 方法2: 解压压缩包并推送
unzip gcode-toolpath-simulator.zip
cd gcode-toolpath-simulator
git remote set-url origin https://github.com/DamienLee2017/AI_workspace.git
git push -u origin master
```

## 推送到 gcode-toolpath-simulator 子目录

如果您希望将代码推送到仓库的 `gcode-toolpath-simulator/` 子目录：

```bash
# 在 AI_workspace 仓库根目录执行
git subtree add --prefix=gcode-toolpath-simulator origin master
```

或者手动合并：
```bash
# 克隆主仓库
git clone https://github.com/DamienLee2017/AI_workspace.git
cd AI_workspace
# 解压并移动文件
unzip /path/to/gcode-toolpath-simulator.zip
mv gcode-toolpath-simulator/* ./
rm -rf gcode-toolpath-simulator
# 提交并推送
git add -A
git commit -m "feat: Add G-code toolpath simulator"
git push origin master
```

## 项目功能

- 上传 G-code 文件 (.gcode, .nc, .ngc, .tap)
- 3D 可视化刀路轨迹 (Three.js)
- 支持旋转、缩放、平移查看
- 多种视图模式 (3D, XY, XZ, YZ 平面)
- 详细的刀路信息统计
- 现代深色主题 UI

## 在线预览

https://xcnmv6snfgei.aiforce.cloud/app/app_4jy0svuaxrhh6
