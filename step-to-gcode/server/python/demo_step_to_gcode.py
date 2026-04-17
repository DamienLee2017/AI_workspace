#!/usr/bin/env python3
"""
演示 STEP → G‑code 完整流程
使用现有的处理器模块
"""

import os
import sys
import json
import tempfile

# 添加路径
sys.path.append(os.path.dirname(__file__))

def run_demo(step_file: str):
    """运行完整演示"""
    if not os.path.exists(step_file):
        print(f"File not found: {step_file}")
        return False
    
    filename = os.path.basename(step_file)
    print("=" * 70)
    print(f"STEP → G‑code 完整流程演示")
    print(f"文件: {filename}")
    print("=" * 70)
    
    # 步骤 1: 解析 STEP 文件
    print("\n1. 解析 STEP 文件...")
    try:
        from step_processor import StepProcessor
        parser = StepProcessor()
        parse_result = parser.parse_step(step_file)
        
        if not parse_result.get('success', False):
            print(f"   ✗ 解析失败: {parse_result.get('error', 'Unknown error')}")
            return False
        
        print(f"   ✓ 解析成功")
        mesh_data = parse_result.get('mesh', {})
        geometry = parse_result.get('geometry', {})
        print(f"     顶点数: {mesh_data.get('vertex_count', 0)}")
        print(f"     面数: {mesh_data.get('face_count', 0)}")
        print(f"     尺寸: {geometry.get('bounds', {}).get('size', {})}")
    except Exception as e:
        print(f"   ✗ 解析异常: {e}")
        return False
    
    # 步骤 2: 加载网格并切片
    print("\n2. 网格切片...")
    try:
        import trimesh
        import numpy as np
        
        # 从解析结果重建网格
        vertices = np.array(mesh_data.get('vertices', []))
        faces = np.array(mesh_data.get('faces', []))
        
        if len(vertices) == 0 or len(faces) == 0:
            print("   ✗ 无网格数据")
            return False
        
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
        print(f"   ✓ 网格加载: {len(mesh.vertices)} 顶点, {len(mesh.faces)} 面")
        
        # 使用增强处理器切片
        from enhanced_step_processor import EnhancedStepProcessor
        processor = EnhancedStepProcessor()
        
        layer_height = 5.0
        slices = processor.slice_mesh(mesh, layer_height)
        print(f"   ✓ 切片完成: {len(slices)} 层")
        
        if slices:
            print(f"     首层 Z = {slices[0]['z']:.2f} mm")
            print(f"     末层 Z = {slices[-1]['z']:.2f} mm")
    except Exception as e:
        print(f"   ✗ 切片异常: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # 步骤 3: 生成刀具路径
    print("\n3. 刀具路径生成...")
    try:
        tool_diameter = 6.0
        toolpath_slices = processor.generate_toolpaths(slices, tool_diameter)
        print(f"   ✓ 刀具路径生成: {len(toolpath_slices)} 层")
        
        total_toolpaths = sum(len(s.get('toolpaths', [])) for s in toolpath_slices)
        print(f"     总轮廓数: {total_toolpaths}")
    except Exception as e:
        print(f"   ✗ 刀具路径异常: {e}")
        return False
    
    # 步骤 4: 生成 G‑code
    print("\n4. G‑code 生成...")
    try:
        params = {
            'layer_height': layer_height,
            'tool_diameter': tool_diameter,
            'feed_rate': 800,
            'spindle_speed': 3000,
            'safe_height': 10.0,
            'plunge_feed': 400
        }
        
        gcode = processor.generate_gcode(toolpath_slices, params)
        
        # 统计
        lines = gcode.split('\n')
        non_empty_lines = [l for l in lines if l.strip() and not l.strip().startswith(';')]
        
        print(f"   ✓ G‑code 生成完成")
        print(f"     总行数: {len(lines)}")
        print(f"     指令行数: {len(non_empty_lines)}")
        
        # 保存到文件
        output_file = f"demo_output_{os.path.splitext(filename)[0]}.gcode"
        with open(output_file, 'w') as f:
            f.write(gcode)
        print(f"     保存到: {output_file}")
        
    except Exception as e:
        print(f"   ✗ G‑code 生成异常: {e}")
        return False
    
    # 步骤 5: 预览结果
    print("\n5. 结果预览")
    print("-" * 70)
    
    # 显示 G‑code 头部
    print("\nG‑code 头部 (前 20 行):")
    lines = gcode.split('\n')
    for i, line in enumerate(lines[:20]):
        print(f"  {line}")
    
    if len(lines) > 20:
        print(f"  ... 还有 {len(lines) - 20} 行")
    
    # 显示加工参数
    print("\n加工参数:")
    print(f"  层高: {layer_height} mm")
    print(f"  刀具直径: {tool_diameter} mm")
    print(f"  进给率: {params['feed_rate']} mm/min")
    print(f"  主轴转速: {params['spindle_speed']} RPM")
    
    print("\n" + "=" * 70)
    print("演示完成! ✓")
    print("=" * 70)
    
    return True

def main():
    """主函数"""
    # 使用测试文件
    step_file = os.path.join(
        os.path.dirname(__file__), 
        '..', '..', 'test_data', 'test_cube.step'
    )
    
    if not os.path.exists(step_file):
        print(f"测试文件不存在: {step_file}")
        print("请先生成测试 STEP 文件: python generate_test_step.py")
        sys.exit(1)
    
    success = run_demo(step_file)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n演示被中断")
        sys.exit(1)
    except Exception as e:
        print(f"演示异常: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)