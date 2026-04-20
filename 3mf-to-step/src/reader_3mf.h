#ifndef READER_3MF_H
#define READER_3MF_H

#include <vector>
#include <string>

struct Vertex {
    double x, y, z;
};

struct Triangle {
    int v1, v2, v3; // zero‑based indices
};

struct MeshData {
    std::vector<Vertex> vertices;
    std::vector<Triangle> triangles;
};

// Read a 3MF file and return the mesh data.
// Throws std::runtime_error on failure.
MeshData read_3mf(const std::string& filename);

#endif // READER_3MF_H