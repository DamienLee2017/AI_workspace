#include <iostream>
#include <string>
#include "reader_3mf.h"
#include "converter.h"
#include "writer_step.h"

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "Usage: " << argv[0] << " <input.3mf> <output.step>\n";
        return 1;
    }

    std::string input_file = argv[1];
    std::string output_file = argv[2];

    try {
        // Read 3MF file
        MeshData mesh = read_3mf(input_file);
        std::cout << "Read " << mesh.vertices.size() << " vertices, "
                  << mesh.triangles.size() << " triangles\n";

        // Convert to OpenCASCADE shape
        TopoDS_Shape shape = convert_mesh_to_shape(mesh);
        std::cout << "Converted to shape\n";

        // Write STEP file
        bool success = write_step(shape, output_file);
        if (!success) {
            std::cerr << "Failed to write STEP file\n";
            return 1;
        }
        std::cout << "Successfully wrote " << output_file << "\n";
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }

    return 0;
}