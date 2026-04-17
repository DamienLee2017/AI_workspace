#!/usr/bin/env python3
"""
测试 STEP 文件处理完整流程
使用生成的 STEP 文件进行测试
"""

import os
import sys
import json

# 添加路径
sys.path.append(os.path.dirname(__file__))

try:
    from enhanced_step_processor import EnhancedStepProcessor
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

def test_step_file(step_file: str, output_dir: str = None, params: dict = None):
    """测试单个 STEP 文件"""
    if not os.path.exists(step_file):
        print(f"  File not found: {step_file}")
        return False
    
    filename = os.path.basename(step_file)
    print(f"\nProcessing: {filename}")
    
    # 创建处理器
    processor = EnhancedStepProcessor()
    
    # 默认参数
    if params is None:
        params = {
            'layer_height': 5.0,  # 层高 5mm
            'tool_diameter': 6.0,
            'feed_rate': 800,
            'spindle_speed': 3000,
            'safe_height': 10.0,
            'plunge_feed': 400
        }
    
    # 处理文件
    result = processor.process_step_file(step_file, output_dir, params)
    
    if result.get('success', False):
        stats = result.get('statistics', {})
        print(f"  ✓ Success!")
        print(f"    Slices: {stats.get('num_slices', 0)}")
        print(f"    Toolpath slices: {stats.get('num_toolpath_slices', 0)}")
        print(f"    Z range: {stats.get('min_z', 0):.2f} to {stats.get('max_z', 0):.2f} mm")
        
        # 显示一些细节
        slices = result.get('slices', [])
        if slices:
            print(f"    First slice: Z={slices[0]['z']:.2f}, {len(slices[0].get('contours', []))} contours")
            print(f"    Last slice: Z={slices[-1]['z']:.2f}, {len(slices[-1].get('contours', []))} contours")
        
        # 保存 G-code
        if output_dir:
            gcode = result.get('gcode', '')
            gcode_file = os.path.join(output_dir, f"{os.path.splitext(filename)[0]}.gcode")
            with open(gcode_file, 'w') as f:
                f.write(gcode)
            print(f"    G-code saved: {gcode_file}")
        
        return True
    else:
        error = result.get('error', 'Unknown error')
        print(f"  ✗ Error: {error}")
        if 'traceback' in result:
            # 只显示错误摘要
            tb = result['traceback'].split('\n')[-3:]
            print(f"    Traceback: {' '.join(tb)}")
        return False

def main():
    """主测试函数"""
    print("=" * 70)
    print("STEP File Processing Test")
    print("=" * 70)
    
    # 测试文件列表
    test_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'test_data')
    step_files = [
        os.path.join(test_dir, "cube.step"),
        os.path.join(test_dir, "cylinder.step"),
        os.path.join(test_dir, "bracket.step"),
    ]
    
    # 输出目录
    output_base = "step_test_output"
    os.makedirs(output_base, exist_ok=True)
    
    # 测试参数
    params = {
        'layer_height': 5.0,  # 层高 5mm
        'tool_diameter': 6.0,
        'feed_rate': 800,
        'spindle_speed': 3000,
        'safe_height': 15.0,
        'plunge_feed': 400
    }
    
    results = []
    for step_file in step_files:
        filename = os.path.basename(step_file)
        output_dir = os.path.join(output_base, os.path.splitext(filename)[0])
        os.makedirs(output_dir, exist_ok=True)
        
        success = test_step_file(step_file, output_dir, params)
        results.append((filename, success))
    
    # 汇总结果
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    
    passed = 0
    failed = 0
    for filename, success in results:
        if success:
            print(f"✓ {filename}: PASSED")
            passed += 1
        else:
            print(f"✗ {filename}: FAILED")
            failed += 1
    
    print(f"\nTotal: {len(results)} files, {passed} passed, {failed} failed")
    
    # 显示输出目录内容
    print(f"\nOutput directory: {output_base}")
    try:
        for root, dirs, files in os.walk(output_base):
            level = root.replace(output_base, '').count(os.sep)
            indent = ' ' * 2 * level
            print(f"{indent}{os.path.basename(root)}/")
            subindent = ' ' * 2 * (level + 1)
            for file in files:
                if file.endswith('.gcode') or file.endswith('.json'):
                    filepath = os.path.join(root, file)
                    size = os.path.getsize(filepath)
                    print(f"{subindent}{file} ({size} bytes)")
    except Exception as e:
        print(f"Error listing output: {e}")
    
    print("\n" + "=" * 70)
    if failed == 0:
        print("All tests passed! ✓")
        return True
    else:
        print(f"{failed} test(s) failed ✗")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nTest interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)