#!/usr/bin/env python3
"""
STEP 到 STL 转换工具
使用 cadquery 导入 STEP，导出为 STL 供后续处理
"""

import os
import sys
import tempfile

try:
    import cadquery as cq
    HAS_CADQUERY = True
except ImportError:
    HAS_CADQUERY = False

try:
    import trimesh
    HAS_TRIMESH = True
except ImportError:
    HAS_TRIMESH = False


class StepConverter:
    """STEP 文件转换器"""
    
    def __init__(self):
        if not HAS_CADQUERY:
            raise RuntimeError("cadquery not installed")
    
    def convert_to_stl(self, step_file: str, stl_file: str = None) -> str:
        """
        将 STEP 文件转换为 STL
        
        Args:
            step_file: 输入 STEP 文件路径
            stl_file: 输出 STL 文件路径（可选，不指定则生成临时文件）
            
        Returns:
            输出 STL 文件路径
        """
        if not os.path.exists(step_file):
            raise FileNotFoundError(f"STEP file not found: {step_file}")
        
        # 如果没有指定输出文件，创建临时文件
        if stl_file is None:
            with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp:
                stl_file = tmp.name
        
        print(f"Converting: {os.path.basename(step_file)} → {os.path.basename(stl_file)}", file=sys.stderr)
        
        # 使用 cadquery 导入 STEP
        try:
            shape = cq.importers.importStep(step_file)
            print(f"  STEP import successful", file=sys.stderr)
        except Exception as e:
            raise RuntimeError(f"Failed to import STEP: {e}")
        
        # 导出为 STL
        try:
            # 方法1: 使用 cq.exporters.export
            import cadquery.exporters as exporters
            exporters.export(shape, stl_file, 'STL')
            print(f"  STL export successful: {os.path.getsize(stl_file)} bytes", file=sys.stderr)
            return stl_file
        except Exception as e1:
            # 方法2: 尝试其他导出方式
            try:
                # 如果 shape 是 Workplane，尝试 val() 获取实体
                if hasattr(shape, 'val'):
                    shape.val().exportStl(stl_file)
                else:
                    shape.exportStl(stl_file)
                print(f"  STL export successful (fallback): {os.path.getsize(stl_file)} bytes", file=sys.stderr)
                return stl_file
            except Exception as e2:
                raise RuntimeError(f"Failed to export STL: {e1}; fallback: {e2}")
    
    def convert_and_load(self, step_file: str) -> 'trimesh.Trimesh':
        """
        转换 STEP 并直接加载为 trimesh 网格
        
        Args:
            step_file: 输入 STEP 文件路径
            
        Returns:
            trimesh 网格对象
        """
        if not HAS_TRIMESH:
            raise RuntimeError("trimesh not installed")
        
        # 转换到临时 STL 文件
        with tempfile.NamedTemporaryFile(suffix='.stl', delete=False) as tmp:
            stl_file = tmp.name
        
        try:
            self.convert_to_stl(step_file, stl_file)
            mesh = trimesh.load(stl_file)
            return mesh
        finally:
            # 清理临时文件
            if os.path.exists(stl_file):
                os.unlink(stl_file)
    
    def get_mesh_info(self, step_file: str) -> dict:
        """
        获取 STEP 文件的网格信息（不保存 STL）
        
        Args:
            step_file: STEP 文件路径
            
        Returns:
            包含网格信息的字典
        """
        mesh = self.convert_and_load(step_file)
        
        bounds = mesh.bounds
        extents = mesh.extents
        centroid = mesh.centroid
        
        return {
            'vertices': len(mesh.vertices),
            'faces': len(mesh.faces),
            'bounds': {
                'min': bounds[0].tolist(),
                'max': bounds[1].tolist()
            },
            'extents': extents.tolist(),
            'centroid': centroid.tolist(),
            'volume': float(mesh.volume) if mesh.is_watertight else 0.0,
            'watertight': bool(mesh.is_watertight)
        }


def main():
    """命令行入口点"""
    if len(sys.argv) < 2:
        print("Usage: python step_to_stl.py <step_file> [stl_file]", file=sys.stderr)
        sys.exit(1)
    
    step_file = sys.argv[1]
    stl_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not HAS_CADQUERY:
        print("Error: cadquery not installed", file=sys.stderr)
        sys.exit(1)
    
    try:
        converter = StepConverter()
        output_file = converter.convert_to_stl(step_file, stl_file)
        print(f"Converted to: {output_file}", file=sys.stderr)
        
        # 显示网格信息
        if HAS_TRIMESH:
            info = converter.get_mesh_info(step_file)
            print(f"Mesh info:", file=sys.stderr)
            print(f"  Vertices: {info['vertices']}", file=sys.stderr)
            print(f"  Faces: {info['faces']}", file=sys.stderr)
            print(f"  Bounds: {info['bounds']['min']} to {info['bounds']['max']}", file=sys.stderr)
            print(f"  Extents: {info['extents']}", file=sys.stderr)
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()