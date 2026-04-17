#!/usr/bin/env python3
"""
使用 OpenCASCADE (pythonocc-core) 实现精确的 STEP 切片算法
用于 CNC 加工的 2.5D 切片
"""

import os
import sys
import json
import traceback
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

try:
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Core.TopoDS import TopoDS_Shape
    from OCC.Core.BRep import BRep_Tool
    from OCC.Core.BRepAdaptor import BRepAdaptor_Surface
    from OCC.Core.GeomAbs import GeomAbs_Plane
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Section
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_MakeFace
    from OCC.Core.gp import gp_Pln, gp_Pnt, gp_Dir, gp_Ax3
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_WIRE, TopAbs_EDGE, TopAbs_VERTEX
    from OCC.Core.TopoDS import topods_Face, topods_Wire, topods_Edge, topods_Vertex
    from OCC.Core.GCPnts import GCPnts_UniformAbscissa
    from OCC.Core.BRepLProp import BRepLProp_CLProps
    from OCC.Core.BRepGProp import brepgprop
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.ShapeAnalysis import ShapeAnalysis_FreeBounds
    from OCC.Core.BRepTools import breptools
    from OCC.Core.BRepOffsetAPI import BRepOffsetAPI_MakeOffset
    from OCC.Core.Geom2d import Geom2d_Line
    from OCC.Core.Geom2dAPI import Geom2dAPI_InterCurveCurve
    from OCC.Core.Geom2dAdaptor import Geom2dAdaptor_Curve
    from OCC.Core.GeomAdaptor import GeomAdaptor_Curve
    from OCC.Core.GCPnts import GCPnts_UniformAbscissa
    HAS_OCC = True
except ImportError as e:
    print(f"OCC import error: {e}", file=sys.stderr)
    HAS_OCC = False


class OccSlicer:
    """基于 OCC 的 STEP 切片器"""
    
    def __init__(self):
        if not HAS_OCC:
            raise RuntimeError("pythonocc-core not installed")
    
    def load_step(self, step_file: str) -> TopoDS_Shape:
        """
        加载 STEP 文件，返回拓扑形状
        """
        reader = STEPControl_Reader()
        status = reader.ReadFile(step_file)
        if status != 1:
            raise ValueError(f"Failed to read STEP file: {step_file}")
        
        reader.TransferRoots()
        shape = reader.OneShape()
        return shape
    
    def get_shape_bounds(self, shape: TopoDS_Shape) -> Tuple[float, float, float, float, float, float]:
        """
        获取形状的包围盒 (xmin, ymin, zmin, xmax, ymax, zmax)
        """
        props = GProp_GProps()
        brepgprop.VolumeProperties(shape, props)
        bbox = props.BoundingBox()
        return bbox.CornerMin().X(), bbox.CornerMin().Y(), bbox.CornerMin().Z(), \
               bbox.CornerMax().X(), bbox.CornerMax().Y(), bbox.CornerMax().Z()
    
    def slice_shape(self, shape: TopoDS_Shape, layer_height: float = 2.0) -> List[Dict]:
        """
        对形状进行 Z 轴切片
        返回每层的轮廓线（多边形）
        """
        xmin, ymin, zmin, xmax, ymax, zmax = self.get_shape_bounds(shape)
        
        slices = []
        z = zmin + layer_height / 2.0
        
        while z <= zmax:
            # 创建切割平面
            plane = gp_Pln(gp_Pnt(0, 0, z), gp_Dir(0, 0, 1))
            
            # 求交截面
            section = BRepAlgoAPI_Section(shape, plane, False)
            section.Build()
            section_shape = section.Shape()
            
            # 提取截面中的边
            wires = self._extract_wires(section_shape)
            
            contours = []
            for wire in wires:
                points = self._discretize_wire(wire)
                if len(points) > 2:
                    contours.append(points)
            
            if contours:
                slices.append({
                    'z': z,
                    'contours': contours,
                    'num_contours': len(contours)
                })
            
            z += layer_height
        
        return slices
    
    def _extract_wires(self, shape: TopoDS_Shape) -> List[TopoDS_Wire]:
        """
        从截面形状中提取所有线框
        """
        wires = []
        exp = TopExp_Explorer(shape, TopAbs_WIRE)
        while exp.More():
            wire = topods_Wire(exp.Current())
            wires.append(wire)
            exp.Next()
        return wires
    
    def _discretize_wire(self, wire: TopoDS_Wire, num_points: int = 100) -> List[Tuple[float, float]]:
        """
        将线框离散化为点序列（二维投影到 XY 平面）
        """
        points = []
        
        # 使用均匀参数采样
        adaptor = BRepAdaptor_Curve()
        adaptor.Load(wire)
        
        # 计算长度
        length = adaptor.Length()
        if length < 1e-6:
            return points
        
        # 采样点
        for i in range(num_points):
            param = i * length / (num_points - 1) if num_points > 1 else 0
            pnt = adaptor.Value(param)
            points.append((pnt.X(), pnt.Y()))
        
        return points
    
    def offset_contours(self, contours: List[List[Tuple[float, float]]], offset_distance: float) -> List[List[Tuple[float, float]]]:
        """
        对轮廓进行偏置（刀具半径补偿）
        简单实现：使用 OCC 的 BRepOffsetAPI_MakeOffset
        注意：这里简化处理，实际需要更复杂的偏置算法
        """
        # TODO: 实现精确的偏置
        # 暂时返回原始轮廓
        return contours
    
    def generate_gcode(self, slices: List[Dict], params: Dict) -> str:
        """
        从切片生成 G 代码
        """
        gcode_lines = []
        
        # 文件头
        gcode_lines.append("; ============================================")
        gcode_lines.append("; G-code generated by OCC Slicer")
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
            
            # 切削每个轮廓
            for j, contour in enumerate(contours):
                if not contour:
                    continue
                
                # 移动到轮廓起点
                x, y = contour[0]
                gcode_lines.append(f"G0 X{x:.3f} Y{y:.3f}")
                
                # 切削轮廓
                for point in contour[1:]:
                    x, y = point
                    gcode_lines.append(f"G1 X{x:.3f} Y{y:.3f} F{params.get('feed_rate', 800)}")
                
                # 闭合轮廓
                if len(contour) > 1:
                    x, y = contour[0]
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


def test():
    """测试函数"""
    if not HAS_OCC:
        print("OCC not available")
        return
    
    slicer = OccSlicer()
    # 需要 STEP 文件进行测试
    print("OCC Slicer initialized")


if __name__ == "__main__":
    test()