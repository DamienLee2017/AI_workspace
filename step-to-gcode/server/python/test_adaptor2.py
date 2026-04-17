#!/usr/bin/env python3
import sys
import cadquery as cq
from OCP.BRepAdaptor import BRepAdaptor_Curve

# 创建一条边
box = cq.Workplane('XY').box(10, 10, 10)
section = box.section(height=0)
edge = section.edges().first().val()
occ_edge = edge.wrapped

print("occ_edge type:", type(occ_edge))

# 尝试用边构造适配器
try:
    adaptor = BRepAdaptor_Curve(occ_edge)
    print("Adaptor constructed:", adaptor)
    
    # 尝试获取参数
    first = adaptor.FirstParameter()
    last = adaptor.LastParameter()
    print(f"Parameter range: {first} to {last}")
    
    # 采样点
    for i in range(5):
        u = first + i * (last - first) / 4 if last != first else first
        pnt = adaptor.Value(u)
        print(f"  u={u}: ({pnt.X()}, {pnt.Y()}, {pnt.Z()})")
except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()