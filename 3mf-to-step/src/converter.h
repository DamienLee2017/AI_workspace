#ifndef CONVERTER_H
#define CONVERTER_H

#include "reader_3mf.h"
#include <TopoDS_Shape.hxx>

// Convert mesh data to an OpenCASCADE shape.
// The shape is a shell or solid built from the triangles.
TopoDS_Shape convert_mesh_to_shape(const MeshData& mesh);

#endif // CONVERTER_H