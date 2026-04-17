#!/usr/bin/env python3
"""
创建测试 STEP 文件到确定位置
"""

import os
import sys

try:
    import cadquery as cq
except ImportError as e:
    print(f"Error importing cadquery: {e}")
    sys.exit(1)

def main():
    # 确定输出目录
    project_root = os.path.join(os.path.dirname(__file__), '..', '..')
    test_data_dir = os.path.join(project_root, 'test_data')
    os.makedirs(test_data_dir, exist_ok=True)
    
    print(f"Project root: {project_root}")
    print(f"Test data dir: {test_data_dir}")
    
    # 创建简单的立方体
    print("\nCreating cube...")
    cube = cq.Workplane("XY").box(30, 30, 20)  # 30x30x20 立方体
    cube_file = os.path.join(test_data_dir, "test_cube.step")
    cube.val().exportStep(cube_file)
    print(f"  Saved: {cube_file} ({os.path.getsize(cube_file)} bytes)")
    
    # 创建圆柱
    print("\nCreating cylinder...")
    cylinder = cq.Workplane("XY").circle(15).extrude(40)  # 直径30, 高40
    cylinder_file = os.path.join(test_data_dir, "test_cylinder.step")
    cylinder.val().exportStep(cylinder_file)
    print(f"  Saved: {cylinder_file} ({os.path.getsize(cylinder_file)} bytes)")
    
    # 验证文件
    print("\nVerifying files...")
    for file in [cube_file, cylinder_file]:
        if os.path.exists(file):
            print(f"  ✓ {os.path.basename(file)} exists")
            # 尝试导入
            try:
                shape = cq.importers.importStep(file)
                print(f"    Import OK")
            except Exception as e:
                print(f"    Import error: {e}")
        else:
            print(f"  ✗ {os.path.basename(file)} missing")
    
    print("\nDone!")

if __name__ == "__main__":
    main()