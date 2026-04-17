#!/usr/bin/env python3
"""
快速测试 STEP 处理
"""

import os
import sys
sys.path.append(os.path.dirname(__file__))

from enhanced_step_processor import EnhancedStepProcessor

def main():
    # 测试文件
    step_file = os.path.join(os.path.dirname(__file__), '..', '..', 'test_data', 'test_cube.step')
    if not os.path.exists(step_file):
        print(f"File not found: {step_file}")
        return
    
    print(f"Testing: {os.path.basename(step_file)}")
    
    processor = EnhancedStepProcessor()
    params = {
        'layer_height': 5.0,
        'tool_diameter': 6.0,
        'feed_rate': 800,
        'spindle_speed': 3000,
        'safe_height': 10.0,
        'plunge_feed': 400
    }
    
    result = processor.process_step_file(step_file, None, params)
    
    if result.get('success', False):
        print("✓ Processing successful")
        stats = result.get('statistics', {})
        print(f"  Slices: {stats.get('num_slices', 0)}")
        print(f"  Z range: {stats.get('min_z', 0):.2f} to {stats.get('max_z', 0):.2f} mm")
        
        # 显示前几行 G-code
        gcode = result.get('gcode', '')
        lines = gcode.split('\n')
        print("\nG-code preview (first 25 lines):")
        for i, line in enumerate(lines[:25]):
            print(f"  {line}")
        
        # 显示切片信息
        slices = result.get('slices', [])
        if slices:
            print(f"\nSlice details (first 3):")
            for i, slice_data in enumerate(slices[:3]):
                z = slice_data['z']
                contours = slice_data.get('contours', [])
                toolpaths = slice_data.get('toolpaths', [])
                print(f"  Layer {i+1}: Z={z:.2f}, {len(contours)} contours, {len(toolpaths)} toolpaths")
    else:
        print(f"✗ Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()