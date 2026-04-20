#include "../src/reader_3mf.h"
#include <iostream>

int main() {
    try {
        std::cout << "Testing 3MF parser...\n";
        MeshData mesh = read_3mf("simple.3mf.xml");
        
        std::cout << "Successfully parsed:\n";
        std::cout << "  Vertices: " << mesh.vertices.size() << "\n";
        std::cout << "  Triangles: " << mesh.triangles.size() << "\n";
        
        // Print first few vertices
        std::cout << "\nFirst 3 vertices:\n";
        for (int i = 0; i < 3 && i < mesh.vertices.size(); ++i) {
            std::cout << "  " << i << ": (" 
                      << mesh.vertices[i].x << ", " 
                      << mesh.vertices[i].y << ", " 
                      << mesh.vertices[i].z << ")\n";
        }
        
        // Print first few triangles
        std::cout << "\nFirst 3 triangles:\n";
        for (int i = 0; i < 3 && i < mesh.triangles.size(); ++i) {
            std::cout << "  " << i << ": [" 
                      << mesh.triangles[i].v1 << ", " 
                      << mesh.triangles[i].v2 << ", " 
                      << mesh.triangles[i].v3 << "]\n";
        }
        
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }
}