#!/usr/bin/env python3
"""
刀具路径偏置算法
用于 CNC 加工的轮廓偏置（刀具半径补偿）
使用 shapely 实现 2D 偏置
"""

import numpy as np
from typing import List, Tuple, Optional, Dict
import math

try:
    from shapely import Polygon, LinearRing, LineString, Point
    from shapely.ops import unary_union, transform
    from shapely.geometry import MultiPolygon
    HAS_SHAPELY = True
except ImportError:
    HAS_SHAPELY = False


class ToolpathOffset:
    """刀具路径偏置处理器"""
    
    def __init__(self, tool_diameter: float = 6.0):
        self.tool_diameter = tool_diameter
        self.tool_radius = tool_diameter / 2.0
    
    def offset_contour(self, contour: List[Tuple[float, float]], offset_distance: float) -> List[List[Tuple[float, float]]]:
        """
        对单个轮廓进行偏置
        返回偏置后的轮廓列表（可能有多条轮廓）
        """
        if not HAS_SHAPELY or len(contour) < 3:
            return [contour]
        
        try:
            # 创建多边形
            poly = Polygon(contour)
            if not poly.is_valid:
                # 尝试修复无效多边形
                poly = poly.buffer(0)
            
            # 执行偏置（负值为内偏置，正值为外偏置）
            # 对于切削，我们通常需要内偏置（offset_distance 为负）
            offset_poly = poly.buffer(-offset_distance)
            
            if offset_poly.is_empty:
                return []
            
            # 提取偏置后的轮廓
            result = []
            if isinstance(offset_poly, Polygon):
                exterior = list(offset_poly.exterior.coords)
                if len(exterior) >= 3:
                    result.append(exterior)
                for interior in offset_poly.interiors:
                    interior_coords = list(interior.coords)
                    if len(interior_coords) >= 3:
                        result.append(interior_coords)
            elif isinstance(offset_poly, MultiPolygon):
                for subpoly in offset_poly.geoms:
                    exterior = list(subpoly.exterior.coords)
                    if len(exterior) >= 3:
                        result.append(exterior)
                    for interior in subpoly.interiors:
                        interior_coords = list(interior.coords)
                        if len(interior_coords) >= 3:
                            result.append(interior_coords)
            
            return result
            
        except Exception as e:
            print(f"Offset contour error: {e}")
            return [contour]
    
    def offset_contours(self, contours: List[List[Tuple[float, float]]], offset_distance: float) -> List[List[Tuple[float, float]]]:
        """
        批量偏置多个轮廓
        """
        if not HAS_SHAPELY:
            return contours
        
        result = []
        for contour in contours:
            offsetted = self.offset_contour(contour, offset_distance)
            result.extend(offsetted)
        
        return result
    
    def generate_toolpaths(self, slices: List[Dict], tool_diameter: float = None) -> List[Dict]:
        """
        为切片生成刀具路径（偏置轮廓）
        
        Args:
            slices: 切片数据列表，每个切片包含 'z' 和 'contours'
            tool_diameter: 刀具直径（毫米）
            
        Returns:
            添加了 'toolpaths' 的切片列表
        """
        if tool_diameter is not None:
            self.tool_diameter = tool_diameter
            self.tool_radius = tool_diameter / 2.0
        
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
                offset_contours = self.offset_contour(contour, self.tool_radius)
                for offset_cont in offset_contours:
                    if len(offset_cont) >= 3:
                        toolpaths.append(offset_cont)
            
            # 也可以添加多道偏置（粗加工、精加工）
            # 这里只做一道偏置
            
            new_slice = slice_data.copy()
            new_slice['toolpaths'] = toolpaths
            result_slices.append(new_slice)
        
        return result_slices
    
    def simplify_contour(self, contour: List[Tuple[float, float]], tolerance: float = 0.01) -> List[Tuple[float, float]]:
        """
        简化轮廓（减少点数）
        使用 Douglas-Peucker 算法
        """
        if not HAS_SHAPELY or len(contour) < 10:
            return contour
        
        try:
            line = LineString(contour)
            simplified = line.simplify(tolerance, preserve_topology=True)
            if simplified.is_empty:
                return contour
            return list(simplified.coords)
        except Exception:
            return contour


def test_offset():
    """测试偏置功能"""
    if not HAS_SHAPELY:
        print("Shapely not installed")
        return
    
    offsetter = ToolpathOffset(tool_diameter=6.0)
    
    # 创建一个正方形轮廓
    square = [(0, 0), (100, 0), (100, 100), (0, 100), (0, 0)]
    
    # 内偏置 3mm
    offsetted = offsetter.offset_contour(square, 3.0)
    print(f"Original contour: {len(square)} points")
    print(f"Offset contours: {len(offsetted)}")
    for i, contour in enumerate(offsetted):
        print(f"  Contour {i}: {len(contour)} points")
    
    # 测试简化
    simplified = offsetter.simplify_contour(square, 1.0)
    print(f"Simplified: {len(simplified)} points")


if __name__ == "__main__":
    test_offset()