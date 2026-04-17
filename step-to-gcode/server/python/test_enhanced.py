#!/usr/bin/env python3
"""
测试增强版处理器
使用 sphere.stl 作为测试模型
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

def test_with_stl():
    """使用 STL 文件测试"""
    stl_file = os.path.join(os.path.dirname(__file__), '..', '..', 'test_data', 'sphere.stl')
    if not os.path.exists(stl_file):
        print(f"Test file not found: {stl_file}")
        return False
    
    print(f"Testing with: {stl_file}")
    
    # 创建处理器
    processor = EnhancedStepProcessor()
    
    # 加工参数
    params = {
        'layer_height': 2.0,
        'tool_diameter': 6.0,
        'feed_rate': 800,
        'spindle_speed': 3000,
        'safe_height': 10.0,
        'plunge_feed': 400
    }
    
    # 处理文件
    print("Processing file...")
    result = processor.process_step_file(stl_file, None, params)
    
    if result.get('success', False):
        print("✓ Success!")
        
        stats = result.get('statistics', {})
        print(f"  Slices: {stats.get('num_slices', 0)}")
        print(f"  Toolpath slices: {stats.get('num_toolpath_slices', 0)}")
        print(f"  Z range: {stats.get('min_z', 0):.2f} to {stats.get('max_z', 0):.2f} mm")
        
        # 显示一些切片信息
        slices = result.get('slices', [])
        if slices:
            print("\nSlice details:")
            for i, slice_data in enumerate(slices[:3]):  # 显示前3层
                z = slice_data['z']
                contours = slice_data.get('contours', [])
                toolpaths = slice_data.get('toolpaths', [])
                print(f"  Layer {i+1}: Z={z:.2f}, {len(contours)} contours, {len(toolpaths)} toolpaths")
            if len(slices) > 3:
                print(f"  ... and {len(slices) - 3} more layers")
        
        # 保存结果到文件
        output_dir = "test_output"
        os.makedirs(output_dir, exist_ok=True)
        
        # 保存 G-code
        gcode = result.get('gcode', '')
        gcode_file = os.path.join(output_dir, "sphere.gcode")
        with open(gcode_file, 'w') as f:
            f.write(gcode)
        print(f"\n✓ G-code saved to: {gcode_file}")
        
        # 保存切片数据
        slices_data = {
            'slices': result.get('slices', []),
            'toolpath_slices': result.get('toolpath_slices', []),
            'params': params
        }
        slices_file = os.path.join(output_dir, "slices.json")
        with open(slices_file, 'w') as f:
            json.dump(slices_data, f, indent=2)
        print(f"✓ Slices data saved to: {slices_file}")
        
        # 预览 G-code
        print(f"\nG-code preview (first 20 lines):")
        lines = gcode.split('\n')
        for i, line in enumerate(lines[:20]):
            print(f"  {line}")
        
        if len(lines) > 20:
            print(f"  ... and {len(lines) - 20} more lines")
        
        return True
    else:
        print(f"✗ Error: {result.get('error', 'Unknown error')}")
        if 'traceback' in result:
            print(f"Traceback: {result['traceback']}")
        return False

def test_offset_function():
    """测试偏置功能"""
    print("\nTesting offset function...")
    
    try:
        from offset_toolpath import ToolpathOffset
        offsetter = ToolpathOffset(tool_diameter=6.0)
        
        # 创建一个正方形轮廓
        square = [(0, 0), (100, 0), (100, 100), (0, 100), (0, 0)]
        
        # 内偏置 3mm
        offsetted = offsetter.offset_contour(square, 3.0)
        print(f"  Original contour: {len(square)} points")
        print(f"  Offset contours: {len(offsetted)}")
        for i, contour in enumerate(offsetted):
            print(f"    Contour {i}: {len(contour)} points")
        
        # 测试简化
        simplified = offsetter.simplify_contour(square, 1.0)
        print(f"  Simplified contour: {len(simplified)} points")
        
        return True
    except Exception as e:
        print(f"  ✗ Offset test failed: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 60)
    print("Enhanced STEP Processor Test")
    print("=" * 60)
    
    # 测试偏置功能
    if not test_offset_function():
        print("Warning: Offset function test failed")
    
    print("\n" + "-" * 60)
    
    # 测试完整流程
    success = test_with_stl()
    
    print("\n" + "=" * 60)
    if success:
        print("All tests passed! ✓")
    else:
        print("Some tests failed ✗")
    
    return success

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