#include "converter.h"
#include <BRepBuilderAPI_MakeFace.hxx>
#include <BRepBuilderAPI_MakePolygon.hxx>
#include <BRepBuilderAPI_Sewing.hxx>
#include <TopoDS_Face.hxx>
#include <TopoDS_Shell.hxx>
#include <TopoDS_Solid.hxx>
#include <BRepBuilderAPI_MakeSolid.hxx>
#include <gp_Pnt.hxx>

TopoDS_Shape convert_mesh_to_shape(const MeshData& mesh) {
    // We will create a face for each triangle and sew them into a shell
    BRepBuilderAPI_Sewing sewer;
    sewer.SetTolerance(1e-6);

    for (const Triangle& tri : mesh.triangles) {
        if (tri.v1 >= mesh.vertices.size() ||
            tri.v2 >= mesh.vertices.size() ||
            tri.v3 >= mesh.vertices.size()) {
            continue; // skip invalid triangle
        }

        const Vertex& v1 = mesh.vertices[tri.v1];
        const Vertex& v2 = mesh.vertices[tri.v2];
        const Vertex& v3 = mesh.vertices[tri.v3];

        gp_Pnt p1(v1.x, v1.y, v1.z);
        gp_Pnt p2(v2.x, v2.y, v2.z);
        gp_Pnt p3(v3.x, v3.y, v3.z);

        // Create a polygon for the triangle
        BRepBuilderAPI_MakePolygon poly;
        poly.Add(p1);
        poly.Add(p2);
        poly.Add(p3);
        poly.Close(); // close the polygon (p3 -> p1)
        if (!poly.IsDone()) {
            continue;
        }

        // Make a face from the polygon
        BRepBuilderAPI_MakeFace face(poly.Wire());
        if (!face.IsDone()) {
            continue;
        }

        sewer.Add(face.Face());
    }

    sewer.Perform();
    if (!sewer.IsDone()) {
        throw std::runtime_error("Failed to sew faces into shell");
    }

    TopoDS_Shape sewed = sewer.SewedShape();
    if (sewed.IsNull()) {
        throw std::runtime_error("Sewed shape is null");
    }

    // Try to make a solid from the shell
    TopoDS_Shell shell = TopoDS::Shell(sewed);
    BRepBuilderAPI_MakeSolid solidMaker(shell);
    if (solidMaker.IsDone()) {
        return solidMaker.Solid();
    } else {
        // Return the shell if solid creation fails
        return shell;
    }
}