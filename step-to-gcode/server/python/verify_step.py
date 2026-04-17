#!/usr/bin/env python3
"""
验证 STEP 文件生成和读取
"""

import os
import sys

try:
    import cadquery as cq
    print(f"CadQuery version: {cq.__version__}")
except ImportError as e:
    print(f"Error importing cadquery: {e}")
    sys.exit(1)

def test_export():
    """测试导出 STEP 文件"""
    print("Testing STEP export...")
    
    # 创建一个小立方体
    cube = cq.Workplane("XY").box(10, 10, 10)
    
    # 导出到临时文件
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.step', delete=False) as tmp:
        tmp_path = tmp.name
    
    try:
        print(f"Exporting to: {tmp_path}")
        cube.val().exportStep(tmp_path)
        
        # 检查文件大小
        size = os.path.getsize(tmp_path)
        print(f"File size: {size} bytes")
        
        # 尝试重新导入
        imported = cq.importers.importStep(tmp_path)
        print(f"Import successful: {imported}")
        
        # 清理
        os.unlink(tmp_path)
        print("✓ STEP export/import test passed")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return False

def check_test_files():
    """检查测试文件是否存在"""
    print("\nChecking test files...")
    
    # 预期文件位置
    possible_locations = [
        os.path.join(os.path.dirname(__file__), '..', '..', 'test_data'),
        os.path.join(os.path.dirname(__file__), 'test_data'),
        'test_data',
        '/home/gem/workspace/agent/workspace/projects/step-to-gcode/test_data'
    ]
    
    found_files = []
    for location in possible_locations:
        if os.path.exists(location):
            print(f"Checking: {location}")
            for root, dirs, files in os.walk(location):
                for file in files:
                    if file.endswith('.step') or file.endswith('.STEP'):
                        full_path = os.path.join(root, file)
                        found_files.append(full_path)
                        print(f"  Found: {file} ({os.path.getsize(full_path)} bytes)")
    
    if not found_files:
        print("  No STEP files found")
    
    return found_files

def main():
    """主函数"""
    print("=" * 60)
    print("STEP File Verification")
    print("=" * 60)
    
    # 测试导出功能
    if not test_export():
        print("Export test failed, cannot proceed")
        return False
    
    # 检查现有文件
    files = check_test_files()
    
    if files:
        print(f"\nFound {len(files)} STEP file(s)")
        return True
    else:
        print("\nNo STEP files found. Generating new test files...")
        
        # 生成测试文件
        output_dir = "/home/gem/workspace/agent/workspace/projects/step-to-gcode/test_data"
        os.makedirs(output_dir, exist_ok=True)
        
        # 生成立方体
        cube = cq.Workplane("XY").box(50, 50, 50)
        cube_file = os.path.join(output_dir, "test_cube.step")
        cube.val().exportStep(cube_file)
        print(f"Generated: {cube_file}")
        
        # 生成圆柱体
        cylinder = cq.Workplane("XY").circle(20).extrude(60)
        cylinder_file = os.path.join(output_dir, "test_cylinder.step")
        cylinder.val().exportStep(cylinder_file)
        print(f"Generated: {cylinder_file}")
        
        return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)