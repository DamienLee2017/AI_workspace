#!/usr/bin/env python3
"""
增强版 STEP 处理器
集成 STEP 解析、切片、刀具路径偏置、G-code 生成
"""

import os
import sys
import json
import traceback
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

# 导入内部模块
sys.path.append(os.path.dirname(__file__))
try:
    from offset_toolpath import ToolpathOffset
    HAS_OFFSET = True
except ImportError:
    HAS_OFFSET = False

try:
    import meshio
    import trimesh
    from trimesh import transformations
    HAS_LIBS = True
except ImportError as e:
    print(f"Import error: {e}", file=sys.stderr)
    HAS_LIBS = False


class EnhancedStepProcessor:
    """增强版 STEP 处理器"""
    
    def __init__(self):
        if not HAS_LIBS:
            raise RuntimeError("Required libraries not installed: meshio, trimesh")
        
        self.toolpath_offset = ToolpathOffset() if HAS_OFFSET else None
    
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
            # 尝试指定格式，因为 .step 扩展名可能无法自动识别
            try:
                mesh_data = meshio.read(step_file_path, file_format='step')
            except Exception:
                # 如果不指定格式
                mesh_data = meshio.read(step_file_path)
            print(f"Meshio read successful: {len(mesh_data.points)} points", file=sys.stderr)
            
            # 将 meshio 数据转换为 trimesh 对象
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
            bounds = mesh.bounds
            extents = mesh.extents
            centroid = mesh.centroid
            volume = mesh.volume if mesh.is_watertight else 0.0
            
            # 计算包围盒
            bbox = {
                'min': {'x': float(bounds[0][0]), 'y': float(bounds[0][1]), 'z': float(bounds[0][2])},
                'max': {'x': float(bounds[1][0]), 'y': float(bounds[1][1]), 'z': float(bounds[1][2])},
                'size': {'x': float(extents[0]), 'y': float(extents[1]), 'z': float(extents[2])}
            }
            
            # 简化网格用于前端显示（减少数据量）
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
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }
    
    def slice_mesh(self, mesh, layer_height: float = 2.0) -> List[Dict]:
        """
        对网格进行 Z 轴切片，用于 2.5D 加工
        
        Args:
            mesh: trimesh 网格对象
            layer_height: 切片层高 (mm)
            
        Returns:
            List of slice contours for each layer
        """
        try:
            bounds = mesh.bounds
            min_z, max_z = bounds[0][2], bounds[1][2]
            
            slices = []
            current_z = min_z + layer_height / 2
            
            while current_z <= max_z:
                # 使用 trimesh 切片功能
                section = mesh.section(plane_origin=[0, 0, current_z], 
                                      plane_normal=[0, 0, 1])
                
                if section is not None:
                    # 转换为 2D 多边形
                    polygon_2d = section.to_planar()[0]
                    
                    if polygon_2d is not None and len(polygon_2d.vertices) > 0:
                        slices.append({
                            'z': float(current_z),
                            'contours': [polygon_2d.vertices.tolist()],
                            'is_closed': polygon_2d.is_closed,
                            'num_points': len(polygon_2d.vertices)
                        })
                
                current_z += layer_height
            
            return slices
            
        except Exception as e:
            print(f"Error slicing mesh: {e}", file=sys.stderr)
            return []
    
    def generate_toolpaths(self, slices: List[Dict], tool_diameter: float = 6.0) -> List[Dict]:
        """
        为切片生成刀具路径（偏置轮廓）
        
        Args:
            slices: 切片数据列表
            tool_diameter: 刀具直径（毫米）
            
        Returns:
            添加了 'toolpaths' 的切片列表
        """
        if not HAS_OFFSET or self.toolpath_offset is None:
            print("Toolpath offset not available, returning original slices", file=sys.stderr)
            return slices
        
        result_slices = []
        
        for slice_data in slices:
            z = slice_data['z']
            contours = slice_data.get('contours', [])
            
            if not contours:
                continue
            
            # 对每个轮廓进行偏置
            toolpaths = []
            for contour in contours:
                # 内偏置一个刀具半径
                offset_contours = self.toolpath_offset.offset_contour(contour, tool_diameter / 2.0)
                for offset_cont in offset_contours:
                    if len(offset_cont) >= 3:
                        toolpaths.append(offset_cont)
            
            new_slice = slice_data.copy()
            new_slice['toolpaths'] = toolpaths
            result_slices.append(new_slice)
        
        return result_slices
    
    def generate_gcode(self, slices: List[Dict], params: Dict) -> str:
        """
        从切片生成 G 代码
        
        Args:
            slices: 切片数据列表
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
            toolpaths = slice_data.get('toolpaths', [])
            
            if not toolpaths:
                # 如果没有刀具路径，使用原始轮廓
                toolpaths = slice_data.get('contours', [])
            
            if not toolpaths:
                continue
            
            gcode_lines.append(f"; === Layer {i+1}, Z = {z:.3f} mm ===")
            
            # 下刀
            gcode_lines.append(f"G1 Z{z:.3f} F{params.get('plunge_feed', 400)} ; Plunge")
            
            # 切削每个轮廓
            for j, toolpath in enumerate(toolpaths):
                if len(toolpath) < 2:
                    continue
                
                # 移动到轮廓起点
                x, y = toolpath[0]
                gcode_lines.append(f"G0 X{x:.3f} Y{y:.3f}")
                
                # 切削轮廓
                for point in toolpath[1:]:
                    x, y = point
                    gcode_lines.append(f"G1 X{x:.3f} Y{y:.3f} F{params.get('feed_rate', 800)}")
                
                # 闭合轮廓
                if len(toolpath) > 1:
                    x, y = toolpath[0]
                    gcode_lines.append(f"G1 X{x:.3f} Y{y:.3f}")
            
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
    
    def process_step_file(self, step_file: str, output_dir: str = None, params: Dict = None) -> Dict[str, Any]:
        """
        完整处理 STEP 文件：解析、切片、生成刀具路径、输出 G-code
        
        Args:
            step_file: STEP 文件路径
            output_dir: 输出目录（可选）
            params: 加工参数（可选）
            
        Returns:
            处理结果字典
        """
        if params is None:
            params = {
                'layer_height': 2.0,
                'tool_diameter': 6.0,
                'feed_rate': 800,
                'spindle_speed': 3000,
                'safe_height': 10.0,
                'plunge_feed': 400
            }
        
        # 1. 解析 STEP 文件
        parse_result = self.parse_step(step_file)
        if not parse_result.get('success', False):
            return parse_result
        
        # 2. 重新加载网格用于切片
        try:
            mesh = trimesh.load(step_file)
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to load mesh for slicing: {e}"
            }
        
        # 3. 切片
        layer_height = params.get('layer_height', 2.0)
        slices = self.slice_mesh(mesh, layer_height)
        
        if not slices:
            return {
                'success': False,
                'error': "No slices generated"
            }
        
        # 4. 生成刀具路径
        tool_diameter = params.get('tool_diameter', 6.0)
        toolpath_slices = self.generate_toolpaths(slices, tool_diameter)
        
        # 5. 生成 G-code
        gcode = self.generate_gcode(toolpath_slices, params)
        
        # 6. 保存结果
        result = {
            'success': True,
            'parse_result': parse_result,
            'slices': slices,
            'toolpath_slices': toolpath_slices,
            'gcode': gcode,
            'statistics': {
                'num_slices': len(slices),
                'num_toolpath_slices': len(toolpath_slices),
                'total_contours': sum(len(s.get('contours', [])) for s in slices),
                'total_toolpaths': sum(len(s.get('toolpaths', [])) for s in toolpath_slices),
                'min_z': min(s['z'] for s in slices) if slices else 0,
                'max_z': max(s['z'] for s in slices) if slices else 0
            }
        }
        
        # 保存到文件
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
            # 保存 G-code
            gcode_file = os.path.join(output_dir, 'output.gcode')
            with open(gcode_file, 'w') as f:
                f.write(gcode)
            result['gcode_file'] = gcode_file
            
            # 保存切片数据
            slices_file = os.path.join(output_dir, 'slices.json')
            with open(slices_file, 'w') as f:
                json.dump({
                    'slices': slices,
                    'toolpath_slices': toolpath_slices,
                    'params': params
                }, f, indent=2)
            result['slices_file'] = slices_file
        
        return result


def main():
    """命令行入口点"""
    if len(sys.argv) < 2:
        print("Usage: python enhanced_step_processor.py <step_file> [output_dir]", file=sys.stderr)
        print("Optional params: --layer-height=2.0 --tool-diameter=6.0 --feed-rate=800", file=sys.stderr)
        sys.exit(1)
    
    step_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(step_file):
        print(f"Error: File not found: {step_file}", file=sys.stderr)
        sys.exit(1)
    
    # 解析命令行参数
    params = {}
    for arg in sys.argv[3:]:
        if arg.startswith('--'):
            if '=' in arg:
                key, value = arg[2:].split('=', 1)
                try:
                    params[key.replace('-', '_')] = float(value)
                except ValueError:
                    params[key.replace('-', '_')] = value
    
    processor = EnhancedStepProcessor()
    result = processor.process_step_file(step_file, output_dir, params)
    
    if output_dir:
        print(f"Results saved to: {output_dir}", file=sys.stderr)
    
    # 输出摘要
    if result.get('success', False):
        stats = result.get('statistics', {})
        print(f"Successfully processed: {step_file}", file=sys.stderr)
        print(f"  Slices: {stats.get('num_slices', 0)}", file=sys.stderr)
        print(f"  Toolpath slices: {stats.get('num_toolpath_slices', 0)}", file=sys.stderr)
        print(f"  Z range: {stats.get('min_z', 0):.2f} to {stats.get('max_z', 0):.2f} mm", file=sys.stderr)
        
        if output_dir:
            print(f"  G-code file: {result.get('gcode_file', '')}", file=sys.stderr)
            print(f"  Slices data: {result.get('slices_file', '')}", file=sys.stderr)
        
        # 输出 G-code 预览
        gcode = result.get('gcode', '')
        lines = gcode.split('\n')
        print("\nG-code preview (first 15 lines):", file=sys.stderr)
        for line in lines[:15]:
            print(f"  {line}", file=sys.stderr)
        
        if len(lines) > 15:
            print(f"  ... and {len(lines) - 15} more lines", file=sys.stderr)
    else:
        print(f"Error: {result.get('error', 'Unknown error')}", file=sys.stderr)
        if 'traceback' in result:
            print(f"Traceback: {result['traceback']}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()