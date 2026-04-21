#include "reader_3mf.h"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <vector>
#include <string>
#include <cstring>
#include <regex>
#include <iostream>
#include "pugixml.hpp"

// Parse vertices from an XML node
static void parse_vertices(const pugi::xml_node& vertices_node, std::vector<Vertex>& vertices) {
    for (pugi::xml_node vertex_node = vertices_node.child("vertex"); vertex_node; vertex_node = vertex_node.next_sibling("vertex")) {
        Vertex v;
        v.x = vertex_node.attribute("x").as_double();
        v.y = vertex_node.attribute("y").as_double();
        v.z = vertex_node.attribute("z").as_double();
        vertices.push_back(v);
    }
}

// Parse triangles from an XML node
static void parse_triangles(const pugi::xml_node& triangles_node, std::vector<Triangle>& triangles) {
    for (pugi::xml_node triangle_node = triangles_node.child("triangle"); triangle_node; triangle_node = triangle_node.next_sibling("triangle")) {
        Triangle t;
        t.v1 = triangle_node.attribute("v1").as_int();
        t.v2 = triangle_node.attribute("v2").as_int();
        t.v3 = triangle_node.attribute("v3").as_int();
        triangles.push_back(t);
    }
}

// Parse the XML content to extract mesh data
static MeshData parse_model_xml(const std::string& xml_content) {
    pugi::xml_document doc;
    pugi::xml_parse_result result = doc.load_string(xml_content.c_str());
    if (!result) {
        throw std::runtime_error("Failed to parse XML");
    }

    MeshData mesh;

    // Navigate to the mesh node
    pugi::xml_node model = doc.child("model");
    if (!model) {
        throw std::runtime_error("Missing root <model> element");
    }

    pugi::xml_node resources = model.child("resources");
    if (!resources) {
        throw std::runtime_error("Missing <resources> element");
    }

    // Assuming single object; iterate over all objects
    for (pugi::xml_node object = resources.child("object"); object; object = object.next_sibling("object")) {
        pugi::xml_node mesh = object.child("mesh");
        if (!mesh) continue;

        pugi::xml_node vertices_node = mesh.child("vertices");
        pugi::xml_node triangles_node = mesh.child("triangles");
        if (!vertices_node || !triangles_node) {
            continue;
        }

        // Remember starting size to append vertices/triangles per object
        size_t v_start = mesh.vertices.size();
        size_t t_start = mesh.triangles.size();

        parse_vertices(vertices_node, mesh.vertices);
        parse_triangles(triangles_node, mesh.triangles);
    }

    if (mesh.vertices.empty() || mesh.triangles.empty()) {
        throw std::runtime_error("No mesh data found in XML");
    }

    return mesh;
}

// Read a 3MF file (XML or ZIP)
MeshData read_3mf(const std::string& filename) {
    // Check if it's a ZIP file
    std::ifstream file(filename, std::ios::binary);
    if (!file.is_open()) {
        throw std::runtime_error("Cannot open file: " + filename);
    }

    char header[4];
    file.read(header, 4);
    file.close();

    if (header[0] == 'P' && header[1] == 'K' && header[2] == 3 && header[3] == 4) {
        // ZIP archive - ideally use libzip, but for now fallback to XML parsing if extracted
        throw std::runtime_error(
            "ZIP archive format not yet supported without libzip. "
            "Please extract the XML from the 3MF file and specify the path to 3D/3dmodel.model"
        );
    }

    // Assume XML file (already extracted or plain)
    std::ifstream xml_file(filename);
    if (!xml_file.is_open()) {
        throw std::runtime_error("Cannot open XML file: " + filename);
    }

    std::stringstream buffer;
    buffer << xml_file.rdbuf();
    return parse_model_xml(buffer.str());
}