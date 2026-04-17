#!/usr/bin/env python3
"""
测试切片与偏置算法
使用 sphere.stl 作为测试模型
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

import trimesh
import numpy as np
from offset_toolpath import ToolpathOffset

def test_sphere_slicing():
    """测试球体切片"""
    print("Loading sphere.stl...")
    mesh = trimesh.load('test_data/sphere.stl')
    print(f"Mesh: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces")
    
    # 获取包围盒
    bounds = mesh.bounds
    min_z, max_z = bounds[0][2], bounds[1][2]
    print(f"Z range: {min_z:.2f} to {max_z:.2f}")
    
    # 切片参数
    layer_height = 2.0
    slices = []
    current_z = min_z + layer_height / 2
    
    while current_z <= max_z:
        section = mesh.section(plane_origin=[0, 0, current_z], 
                              plane_normal=[0, 0, 1])
        
        if section is not None:
            polygon_2d = section.to_planar()[0]
            
            if polygon_2d is not None and len(polygon_2d.vertices) > 0:
                contour = polygon_2d.vertices.tolist()
                slices.append({
                    'z': float(current_z),
                    'contours': [contour],
                    'is_closed': polygon_2d.is_closed
                })
        
        current_z += layer_height
    
    print(f"Generated {len(slices)} slices")
    
    # 刀具路径偏置
    tool_diameter = 6.0
    offsetter = ToolpathOffset(tool_diameter=tool_diameter)
    
    toolpath_slices = offsetter.generate_toolpaths(slices, tool_diameter)
    print(f"Toolpath slices: {len(toolpath_slices)}")
    
    # 显示每层信息
    for i, slice_data in enumerate(toolpath_slices):
        z = slice_data['z']
        contours = slice_data.get('contours', [])
        toolpaths = slice_data.get('toolpaths', [])
        print(f"  Layer {i+1}: Z={z:.2f}, {len(contours)} contours, {len(toolpaths)} toolpaths")
        if toolpaths:
            total_points = sum(len(tp) for tp in toolpaths)
            print(f"    Toolpath points: {total_points}")
    
    # 生成简化的 G-code
    gcode_lines = []
    gcode_lines.append("; Test G-code from sphere")
    gcode_lines.append("G90 G21 G17")
    gcode_lines.append("G0 Z10")
    
    for i, slice_data in enumerate(toolpath_slices):
        z = slice_data['z']
        toolpaths = slice_data.get('toolpaths', [])
        
        if not toolpaths:
            continue
        
        gcode_lines.append(f"; Layer {i+1}, Z={z:.2f}")
        gcode_lines.append(f"G1 Z{z:.2f} F400")
        
        for toolpath in toolpaths:
            if len(toolpath) < 2:
                continue
            
            # 移动到起点
            x, y = toolpath[0]
            gcode_lines.append(f"G0 X{x:.2f} Y{y:.2f}")
            
            # 切削轮廓
            for point in toolpath[1:]:
                x, y = point
                gcode_lines.append(f"G1 X{x:.2f} Y{y:.2f} F800")
            
            # 闭合轮廓
            x, y = toolpath[0]
            gcode_lines.append(f"G1 X{x:.2f} Y{y:.2f}")
        
        gcode_lines.append("G0 Z10")
    
    gcode_lines.append("G0 Z50")
    gcode_lines.append("M30")
    
    gcode = "\n".join(gcode_lines)
    print("\nGenerated G-code preview (first 20 lines):")
    print("\n".join(gcode_lines[:20]))
    
    # 保存到文件
    output_path = "test_output.gcode"
    with open(output_path, 'w') as f:
        f.write(gcode)
    print(f"\nFull G-code saved to: {output_path}")
    
    return True

if __name__ == "__main__":
    try:
        test_sphere_slicing()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()