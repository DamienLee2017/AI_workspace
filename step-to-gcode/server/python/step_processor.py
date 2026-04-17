#!/usr/bin/env python3
"""
STEP 文件解析与处理模块
使用 meshio + trimesh 实现真正的 STEP 解析
"""

import os
import sys
import json
import tempfile
import traceback
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

try:
    import shapely
    HAS_SHAPELY = True
except ImportError:
    HAS_SHAPELY = False

try:
    import meshio
    import trimesh
    from trimesh import transformations
    HAS_LIBS = True
except ImportError as e:
    print(f"Import error: {e}", file=sys.stderr)
    HAS_LIBS = False

try:
    from step_to_stl import StepConverter
    HAS_CONVERTER = True
except ImportError:
    HAS_CONVERTER = False


class StepProcessor:
    """STEP 文件处理器"""
    
    def __init__(self):
        if not HAS_LIBS:
            raise RuntimeError("Required libraries not installed: meshio, trimesh")
    
    def parse_step(self, step_file_path: str) -> Dict[str, Any]:
        """
        解析 STEP 文件，返回网格数据和几何信息
        
        Args:
            step_file_path: STEP 文件路径
            
        Returns:
            Dict containing mesh data and metadata
        """
        try:
            print(f"Parsing STEP file: {step_file_path}", file=sys.stderr)
            
            # 使用 meshio 读取 STEP 文件
            # meshio 支持 STEP AP203/AP214 格式
            mesh_data = meshio.read(step_file_path)
            print(f"Meshio read successful: {len(mesh_data.points)} points", file=sys.stderr)
            
            # 将 meshio 数据转换为 trimesh 对象
            # STEP 文件可能包含多个实体，我们取第一个实体或合并
            if hasattr(mesh_data, 'cells'):
                # 提取三角面片
                triangles = None
                for cell_block in mesh_data.cells:
                    if cell_block.type == 'triangle':
                        triangles = cell_block.data
                        break
                
                if triangles is None:
                    # 如果没有三角面片，尝试从其他类型转换
                    # 这里简化处理，实际可能需要更复杂的转换
                    raise ValueError("STEP file does not contain triangular mesh data")
                
                mesh = trimesh.Trimesh(vertices=mesh_data.points, faces=triangles)
            else:
                # 如果 meshio 无法直接解析为网格，尝试使用 trimesh 加载
                mesh = trimesh.load(step_file_path)
            
            print(f"Trimesh mesh created: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces", file=sys.stderr)
            
            # 计算几何信息
            bounds = mesh.bounds  # [[min_x, min_y, min_z], [max_x, max_y, max_z]]
            extents = mesh.extents  # [size_x, size_y, size_z]
            centroid = mesh.centroid
            volume = mesh.volume if mesh.is_watertight else 0.0
            
            # 计算包围盒
            bbox = {
                'min': {'x': float(bounds[0][0]), 'y': float(bounds[0][1]), 'z': float(bounds[0][2])},
                'max': {'x': float(bounds[1][0]), 'y': float(bounds[1][1]), 'z': float(bounds[1][2])},
                'size': {'x': float(extents[0]), 'y': float(extents[1]), 'z': float(extents[2])}
            }
            
            # 简化网格用于前端显示（减少数据量）
            # 使用约简到 10% 面数，保持形状
            simplified = mesh.simplify_quadric_decimation(len(mesh.faces) // 10) if len(mesh.faces) > 1000 else mesh
            
            # 准备返回数据
            result = {
                'success': True,
                'mesh': {
                    'vertices': simplified.vertices.tolist(),
                    'faces': simplified.faces.tolist(),
                    'vertex_count': len(simplified.vertices),
                    'face_count': len(simplified.faces),
                },
                'geometry': {
                    'bounds': bbox,
                    'centroid': centroid.tolist(),
                    'volume': float(volume),
                    'watertight': bool(mesh.is_watertight),
                    'convex': bool(mesh.is_convex),
                },
                'metadata': {
                    'filename': os.path.basename(step_file_path),
                    'file_size': os.path.getsize(step_file_path),
                    'units': 'mm',  # 假设为毫米
                }
            }
            
            return result
            
        except Exception as e:
            print(f"Error parsing STEP file: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            
            # 尝试使用 STEP 转换器
            if HAS_CONVERTER:
                print("Attempting STEP conversion via cadquery...", file=sys.stderr)
                try:
                    converter = StepConverter()
                    mesh = converter.convert_and_load(step_file_path)
                    print(f"Conversion successful: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces", file=sys.stderr)
                    
                    # 计算几何信息
                    bounds = mesh.bounds
                    extents = mesh.extents
                    centroid = mesh.centroid
                    volume = mesh.volume if mesh.is_watertight else 0.0
                    
                    bbox = {
                        'min': {'x': float(bounds[0][0]), 'y': float(bounds[0][1]), 'z': float(bounds[0][2])},
                        'max': {'x': float(bounds[1][0]), 'y': float(bounds[1][1]), 'z': float(bounds[1][2])},
                        'size': {'x': float(extents[0]), 'y': float(extents[1]), 'z': float(extents[2])}
                    }
                    
                    # 简化网格用于前端显示
                    simplified = mesh.simplify_quadric_decimation(len(mesh.faces) // 10) if len(mesh.faces) > 1000 else mesh
                    
                    result = {
                        'success': True,
                        'mesh': {
                            'vertices': simplified.vertices.tolist(),
                            'faces': simplified.faces.tolist(),
                            'vertex_count': len(simplified.vertices),
                            'face_count': len(simplified.faces),
                        },
                        'geometry': {
                            'bounds': bbox,
                            'centroid': centroid.tolist(),
                            'volume': float(volume),
                            'watertight': bool(mesh.is_watertight),
                            'convex': bool(mesh.is_convex),
                        },
                        'metadata': {
                            'filename': os.path.basename(step_file_path),
                            'file_size': os.path.getsize(step_file_path),
                            'units': 'mm',
                            'note': 'Converted from STEP via cadquery'
                        }
                    }
                    return result
                except Exception as conv_error:
                    print(f"STEP conversion also failed: {conv_error}", file=sys.stderr)
            
            # 如果转换器不可用或转换失败，返回原始错误
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc(),
                'note': 'Try installing cadquery: pip install cadquery'
            }
    
    def slice_for_machining(self, mesh, layer_height: float = 2.0) -> List[Dict]:
        """
        对网格进行 Z 轴切片，用于 2.5D 加工
        
        Args:
            mesh: trimesh 网格对象
            layer_height: 切片层高 (mm)
            
        Returns:
            List of slice contours for each layer
        """
        if not HAS_LIBS:
            return []
        
        try:
            bounds = mesh.bounds
            min_z, max_z = bounds[0][2], bounds[1][2]
            
            slices = []
            current_z = min_z + layer_height / 2
            
            while current_z <= max_z:
                # 使用 trimesh 切片功能
                # section 返回一个 Path3D 对象
                section = mesh.section(plane_origin=[0, 0, current_z], 
                                      plane_normal=[0, 0, 1])
                
                if section is not None:
                    # 转换为 2D 多边形
                    polygon_2d = section.to_planar()[0]
                    
                    if polygon_2d is not None and len(polygon_2d.vertices) > 0:
                        slices.append({
                            'z': float(current_z),
                            'contours': polygon_2d.vertices.tolist(),
                            'is_closed': polygon_2d.is_closed
                        })
                
                current_z += layer_height
            
            return slices
            
        except Exception as e:
            print(f"Error slicing mesh: {e}", file=sys.stderr)
            return []
    
    def generate_gcode_from_slices(self, slices: List[Dict], params: Dict) -> str:
        """
        从切片生成 G 代码
        
        Args:
            slices: 切片轮廓数据
            params: 加工参数
            
        Returns:
            G-code 字符串
        """
        gcode_lines = []
        
        # 文件头
        gcode_lines.append("; ============================================")
        gcode_lines.append("; G-code generated from STEP file")
        gcode_lines.append("; ============================================")
        gcode_lines.append(f"; Tool Diameter: {params.get('tool_diameter', 6.0)} mm")
        gcode_lines.append(f"; Feed Rate: {params.get('feed_rate', 800)} mm/min")
        gcode_lines.append(f"; Spindle Speed: {params.get('spindle_speed', 3000)} RPM")
        gcode_lines.append(f"; Layer Height: {params.get('layer_height', 2.0)} mm")
        gcode_lines.append("")
        
        # 初始化
        gcode_lines.append("G90 ; Absolute positioning")
        gcode_lines.append("G21 ; Metric units (mm)")
        gcode_lines.append("G17 ; XY plane selection")
        gcode_lines.append("G40 ; Cancel tool radius compensation")
        gcode_lines.append("G49 ; Cancel tool length compensation")
        gcode_lines.append("G80 ; Cancel fixed cycles")
        gcode_lines.append("")
        
        # 主轴启动
        gcode_lines.append(f"M3 S{params.get('spindle_speed', 3000)} ; Spindle on")
        gcode_lines.append("G4 P3 ; Wait for spindle")
        gcode_lines.append("")
        
        safe_height = params.get('safe_height', 10.0)
        
        # 移动到安全高度
        gcode_lines.append(f"G0 Z{safe_height:.3f} ; Rapid to safe height")
        
        # 逐层加工
        for i, slice_data in enumerate(slices):
            z = slice_data['z']
            contours = slice_data.get('contours', [])
            
            if not contours:
                continue
            
            gcode_lines.append(f"; === Layer {i+1}, Z = {z:.3f} mm ===")
            
            # 下刀
            gcode_lines.append(f"G1 Z{z:.3f} F{params.get('plunge_feed', 400)} ; Plunge")
            
            # 切削轮廓
            for j, point in enumerate(contours):
                x, y = point[0], point[1]
                gcode_lines.append(f"G1 X{x:.3f} Y{y:.3f} F{params.get('feed_rate', 800)}")
            
            # 抬刀
            gcode_lines.append(f"G0 Z{safe_height:.3f} ; Retract")
            gcode_lines.append("")
        
        # 结束
        gcode_lines.append("G0 Z50 ; Tool change height")
        gcode_lines.append("G0 X0 Y0 ; Return to origin")
        gcode_lines.append("M5 ; Spindle stop")
        gcode_lines.append("M30 ; Program end")
        gcode_lines.append("%")
        
        return "\n".join(gcode_lines)


def main():
    """命令行入口点"""
    if len(sys.argv) < 2:
        print("Usage: python step_processor.py <step_file> [output_json]", file=sys.stderr)
        sys.exit(1)
    
    step_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(step_file):
        print(f"Error: File not found: {step_file}", file=sys.stderr)
        sys.exit(1)
    
    processor = StepProcessor()
    result = processor.parse_step(step_file)
    
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Results saved to: {output_file}", file=sys.stderr)
    else:
        print(json.dumps(result, indent=2))
    
    if not result.get('success', False):
        sys.exit(1)


if __name__ == "__main__":
    main()