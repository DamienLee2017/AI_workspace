#!/usr/bin/env python3
"""
使用 OCP 将边离散化为点
"""

import sys

try:
    import cadquery as cq
    from OCP.BRepAdaptor import BRepAdaptor_Curve
    from OCP.GCPnts import GCPnts_UniformAbscissa
    from OCP.TopAbs import TopAbs_EDGE
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopoDS import TopoDS_Edge
    HAS_OCP = True
except ImportError as e:
    print(f"Import error: {e}")
    HAS_OCP = False


def discretize_edge(edge, num_points: int = 50):
    """
    将一条边离散化为点列表
    edge: cadquery.occ_impl.shapes.Edge 对象
    returns: list of (x, y, z) tuples
    """
    if not HAS_OCP:
        return []
    
    # 获取 OCP 边
    occ_edge = edge.wrapped
    
    # 创建适配器曲线
    adaptor = BRepAdaptor_Curve(occ_edge)
    
    # 计算长度
    length = adaptor.Length()
    if length < 1e-6:
        return []
    
    # 均匀采样点
    abscissa = GCPnts_UniformAbscissa()
    success = abscissa.Initialize(adaptor, num_points, length)
    if not success:
        # 回退到简单参数采样
        points = []
        for i in range(num_points):
            param = i * length / (num_points - 1) if num_points > 1 else 0
            pnt = adaptor.Value(param)
            points.append((pnt.X(), pnt.Y(), pnt.Z()))
        return points
    
    points = []
    for i in range(1, abscissa.NbPoints() + 1):
        param = abscissa.Parameter(i)
        pnt = adaptor.Value(param)
        points.append((pnt.X(), pnt.Y(), pnt.Z()))
    
    return points


def test():
    """测试函数"""
    if not HAS_OCP:
        print("OCP not available")
        return
    
    # 创建一个简单的立方体
    box = cq.Workplane('XY').box(10, 10, 10)
    
    # 在 Z=0 处截面
    section = box.section(height=0)
    edges = section.edges()
    
    print(f"Section has {edges.size()} edges")
    
    total_points = 0
    for edge_obj in edges.all():
        edge = edge_obj.val()
        points = discretize_edge(edge, num_points=10)
        print(f"  Edge discretized to {len(points)} points")
        if points:
            print(f"    First point: {points[0]}")
            print(f"    Last point: {points[-1]}")
        total_points += len(points)
    
    print(f"Total points: {total_points}")
    
    # 测试 STEP 文件
    print("\nTesting STEP file...")
    step_file = 'test_data/test_cube.step'
    try:
        wp = cq.importers.importStep(step_file)
        section = wp.section(height=0)
        edges = section.edges()
        print(f"STEP section edges: {edges.size()}")
        
        for edge_obj in edges.all():
            edge = edge_obj.val()
            points = discretize_edge(edge, num_points=5)
            print(f"  Edge points: {len(points)}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test()