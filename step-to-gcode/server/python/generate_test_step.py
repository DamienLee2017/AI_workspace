#!/usr/bin/env python3
"""
使用 cadquery 生成测试 STEP 文件
生成一个简单的立方体和圆柱
"""

import os
import sys

try:
    import cadquery as cq
    print(f"CadQuery version: {cq.__version__}")
except ImportError as e:
    print(f"Error importing cadquery: {e}")
    sys.exit(1)

def generate_cube_step(output_path: str):
    """生成一个立方体 STEP 文件"""
    print(f"Generating cube STEP file: {output_path}")
    
    # 创建一个 50x50x50 立方体
    cube = cq.Workplane("XY").box(50, 50, 50)
    
    # 导出为 STEP 文件
    cube.val().exportStep(output_path)
    print(f"  Cube exported: {os.path.getsize(output_path)} bytes")
    
    return True

def generate_cylinder_step(output_path: str):
    """生成一个圆柱体 STEP 文件"""
    print(f"Generating cylinder STEP file: {output_path}")
    
    # 创建一个直径 40，高度 60 的圆柱
    cylinder = cq.Workplane("XY").circle(20).extrude(60)
    
    # 导出为 STEP 文件
    cylinder.val().exportStep(output_path)
    print(f"  Cylinder exported: {os.path.getsize(output_path)} bytes")
    
    return True

def generate_bracket_step(output_path: str):
    """生成一个简单的支架（L形）STEP 文件"""
    print(f"Generating bracket STEP file: {output_path}")
    
    # 创建一个 L 形支架
    bracket = (
        cq.Workplane("XY")
        .box(80, 20, 10)  # 底座
        .faces(">Z")
        .workplane()
        .transformed(offset=(0, -20, 0))
        .box(20, 40, 30)  # 立柱
    )
    
    # 导出为 STEP 文件
    bracket.val().exportStep(output_path)
    print(f"  Bracket exported: {os.path.getsize(output_path)} bytes")
    
    return True

def main():
    """主函数"""
    output_dir = "test_data"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Generating test STEP files...")
    
    # 生成立方体
    cube_file = os.path.join(output_dir, "cube.step")
    if not generate_cube_step(cube_file):
        print("Failed to generate cube")
    
    # 生成圆柱体
    cylinder_file = os.path.join(output_dir, "cylinder.step")
    if not generate_cylinder_step(cylinder_file):
        print("Failed to generate cylinder")
    
    # 生成支架
    bracket_file = os.path.join(output_dir, "bracket.step")
    if not generate_bracket_step(bracket_file):
        print("Failed to generate bracket")
    
    print("\nGenerated files:")
    for file in [cube_file, cylinder_file, bracket_file]:
        if os.path.exists(file):
            print(f"  {file} ({os.path.getsize(file)} bytes)")
        else:
            print(f"  {file} (missing)")
    
    # 验证文件可读
    print("\nVerifying files with cadquery...")
    for file in [cube_file, cylinder_file, bracket_file]:
        if os.path.exists(file):
            try:
                shape = cq.importers.importStep(file)
                print(f"  {os.path.basename(file)}: OK")
            except Exception as e:
                print(f"  {os.path.basename(file)}: Error - {e}")
    
    print("\nDone!")

if __name__ == "__main__":
    main()