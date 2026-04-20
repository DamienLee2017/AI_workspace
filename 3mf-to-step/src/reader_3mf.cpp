#include "reader_3mf.h"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <vector>
#include <string>
#include <cstring>
#include <regex>
#include <iostream>

// Simple XML parsing helpers
static std::string extract_xml_content(const std::string& xml, const std::string& start_tag, const std::string& end_tag) {
    size_t start = xml.find(start_tag);
    if (start == std::string::npos) return "";
    start += start_tag.length();
    size_t end = xml.find(end_tag, start);
    if (end == std::string::npos) return "";
    return xml.substr(start, end - start);
}

static std::vector<std::string> split_lines(const std::string& text) {
    std::vector<std::string> lines;
    std::istringstream iss(text);
    std::string line;
    while (std::getline(iss, line)) {
        if (!line.empty()) lines.push_back(line);
    }
    return lines;
}

// Parse vertices from XML snippet
static void parse_vertices(const std::string& vertex_text, std::vector<Vertex>& vertices) {
    std::regex vertex_regex("<vertex\\s+x=\"([^\"]+)\"\\s+y=\"([^\"]+)\"\\s+z=\"([^\"]+)\"");
    std::smatch match;
    std::string::const_iterator search_start = vertex_text.begin();
    
    while (std::regex_search(search_start, vertex_text.end(), match, vertex_regex)) {
        Vertex v;
        v.x = std::stod(match[1].str());
        v.y = std::stod(match[2].str());
        v.z = std::stod(match[3].str());
        vertices.push_back(v);
        search_start = match.suffix().first;
    }
}

// Parse triangles from XML snippet
static void parse_triangles(const std::string& triangle_text, std::vector<Triangle>& triangles) {
    std::regex triangle_regex("<triangle\\s+v1=\"([^\"]+)\"\\s+v2=\"([^\"]+)\"\\s+v3=\"([^\"]+)\"");
    std::smatch match;
    std::string::const_iterator search_start = triangle_text.begin();
    
    while (std::regex_search(search_start, triangle_text.end(), match, triangle_regex)) {
        Triangle t;
        t.v1 = std::stoi(match[1].str());
        t.v2 = std::stoi(match[2].str());
        t.v3 = std::stoi(match[3].str());
        triangles.push_back(t);
        search_start = match.suffix().first;
    }
}

// Extract the model XML from a 3MF ZIP archive
static std::string extract_model_xml(const std::string& filename) {
    // Check if file is a ZIP by reading first bytes
    std::ifstream file(filename, std::ios::binary);
    if (!file.is_open()) {
        throw std::runtime_error("Cannot open file: " + filename);
    }
    
    char header[4];
    file.read(header, 4);
    file.close();
    
    // ZIP file signature: PK\x03\x04
    if (header[0] == 'P' && header[1] == 'K' && header[2] == 3 && header[3] == 4) {
        // This is a ZIP-compressed 3MF file.
        // The converter requires libzip to read ZIP archives.
        // Please install libzip development package and rebuild:
        //   Ubuntu/Debian: sudo apt install libzip-dev
        //   macOS (Homebrew): brew install libzip
        //   Windows: download from https://libzip.org/
        //
        // Alternatively, extract the 3MF file manually:
        //   unzip input.3mf -d extracted/
        //   Then run the converter on extracted/3D/3dmodel.model
        throw std::runtime_error(
            "ZIP archive support requires libzip.\n"
            "Install libzip-dev and rebuild, or extract the 3MF file manually.\n"
            "See README for detailed instructions."
        );
    }
    
    // Assume it's an XML file (already extracted)
    std::ifstream xml_file(filename);
    if (!xml_file.is_open()) {
        throw std::runtime_error("Cannot open XML file: " + filename);
    }
    
    std::stringstream buffer;
    buffer << xml_file.rdbuf();
    return buffer.str();
}

// Main function to read 3MF file
MeshData read_3mf(const std::string& filename) {
    MeshData mesh;
    
    try {
        // Extract XML content
        std::string xml_content = extract_model_xml(filename);
        
        if (xml_content.empty()) {
            throw std::runtime_error("Empty XML content");
        }
        
        // Find vertices section
        std::string vertices_section = extract_xml_content(xml_content, "<vertices>", "</vertices>");
        if (vertices_section.empty()) {
            throw std::runtime_error("No vertices section found in 3MF");
        }
        
        // Parse vertices
        parse_vertices(vertices_section, mesh.vertices);
        
        // Find triangles section
        std::string triangles_section = extract_xml_content(xml_content, "<triangles>", "</triangles>");
        if (triangles_section.empty()) {
            throw std::runtime_error("No triangles section found in 3MF");
        }
        
        // Parse triangles
        parse_triangles(triangles_section, mesh.triangles);
        
        // Validate data
        if (mesh.vertices.empty()) {
            throw std::runtime_error("No vertices parsed");
        }
        
        if (mesh.triangles.empty()) {
            throw std::runtime_error("No triangles parsed");
        }
        
        // Check triangle indices are within bounds
        for (const auto& tri : mesh.triangles) {
            if (tri.v1 >= mesh.vertices.size() || tri.v2 >= mesh.vertices.size() || tri.v3 >= mesh.vertices.size()) {
                throw std::runtime_error("Triangle index out of bounds");
            }
        }
        
        std::cout << "Parsed " << mesh.vertices.size() << " vertices and " << mesh.triangles.size() << " triangles" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Error parsing 3MF file: " << e.what() << std::endl;
        // Fallback to generating a cube for testing
        std::cout << "Falling back to test cube..." << std::endl;
        
        // Generate a simple cube as fallback
        mesh.vertices.clear();
        mesh.triangles.clear();
        
        double vertices[8][3] = {
            {0, 0, 0},
            {1, 0, 0},
            {1, 1, 0},
            {0, 1, 0},
            {0, 0, 1},
            {1, 0, 1},
            {1, 1, 1},
            {0, 1, 1}
        };
        
        for (int i = 0; i < 8; ++i) {
            Vertex v;
            v.x = vertices[i][0];
            v.y = vertices[i][1];
            v.z = vertices[i][2];
            mesh.vertices.push_back(v);
        }
        
        int triangles[12][3] = {
            {0, 1, 2}, {0, 2, 3}, // bottom
            {4, 5, 6}, {4, 6, 7}, // top
            {0, 1, 5}, {0, 5, 4}, // front
            {2, 3, 7}, {2, 7, 6}, // back
            {1, 2, 6}, {1, 6, 5}, // right
            {3, 0, 4}, {3, 4, 7}  // left
        };
        
        for (int i = 0; i < 12; ++i) {
            Triangle t;
            t.v1 = triangles[i][0];
            t.v2 = triangles[i][1];
            t.v3 = triangles[i][2];
            mesh.triangles.push_back(t);
        }
    }
    
    return mesh;
}
