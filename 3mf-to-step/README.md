# 3MF to STEP Converter

A high-performance command‑line tool that converts 3MF (3D Manufacturing Format) files to STEP (ISO 10303) CAD format, written in C++ using the OpenCASCADE CAD kernel.

**Current status**: Core conversion pipeline works; can parse extracted 3MF XML files. ZIP archive support requires libzip (see below).

## Why This Tool?

- **3MF** is a modern, XML‑based mesh format widely used in 3D printing.
- **STEP** (AP203/AP214) is the industry‑standard B‑REP (boundary representation) format for CAD/CAM.
- Converting mesh to B‑REP is a non‑trivial geometric problem; this tool provides a robust, efficient solution.

## Technical Approach

- **Core engine**: OpenCASCADE (OCCT) – the industry‑standard open‑source CAD kernel.
- **Mesh reading**: libzip + pugixml to parse the 3MF ZIP/XML structure.
- **Conversion**: Each triangle is turned into a planar face; faces are sewn into a watertight shell, then solidified.
- **Output**: STEP AP214 (tessellated B‑REP), compatible with all major CAD systems.

## Build Requirements

- CMake ≥ 3.16
- C++17 compiler
- OpenCASCADE (OCCT) development libraries
- libzip development libraries
- (Optional) pugixml (header‑only, included in `third_party/`)

### Ubuntu/Debian
```bash
sudo apt install cmake g++ libocct-foundation-dev libocct-modeling-dev libocct-ocaf-dev libzip-dev
```

### macOS (Homebrew)
```bash
brew install cmake opencascade libzip
```

### Windows
- Install OpenCASCADE from https://www.opencascade.com/
- Install libzip from https://libzip.org/
- Use CMake with appropriate generators.

## Build Instructions

```bash
git clone https://github.com/DamienLee2017/AI_workspace.git
cd AI_workspace/3mf-to-step
mkdir build && cd build
cmake ..
make -j$(nproc)
sudo make install   # optional, installs to /usr/local/bin
```

## Usage

```bash
3mf_to_step input.3mf output.step
```

The tool will read the 3MF file, reconstruct its geometry as a STEP solid, and write the result.

## Current Status & Limitations

### ✅ Implemented
- Basic 3MF XML parsing (vertices and triangles)
- Mesh‑to‑B‑REP conversion via OpenCASCADE sewing
- STEP AP214 export
- Command‑line interface

### ⚠️ Known Limitations
1. **ZIP archive support**: The tool can parse extracted 3MF XML files, but reading `.3mf` ZIP archives requires libzip.
   - If you have a `.3mf` file, extract it first:
     ```bash
     unzip input.3mf -d extracted/
     ./3mf_to_step extracted/3D/3dmodel.model output.step
     ```
   - To enable direct `.3mf` reading, install `libzip-dev` and rebuild.

2. **XML parser**: Uses simple regex matching; may fail on complex 3MF files with namespaces, comments, or unusual formatting.
   - Planned upgrade: integrate pugixml for robust parsing.

3. **Geometry features**: Only single‑object meshes are supported (no multi‑material, colors, or assemblies).
   - The converter creates a faceted (tessellated) STEP solid, not a smooth B‑REP with analytic surfaces.
   - This is sufficient for most CAM toolpath generation.

4. **Performance**: Sewing many small triangles can be slow for large meshes.
   - Future work: mesh simplification, planar region detection, and NURBS surface fitting.

### Roadmap
- Integrate libzip for direct `.3mf` file reading
- Replace regex XML parser with pugixml
- Support for multiple objects and component transformations
- Mesh optimization (decimation, normal repair)
- Surface reconstruction (plane/cylinder fitting)
- CI/CD with GitHub Actions and Docker images

Pull requests are welcome!

## License

MIT – see LICENSE file.

## Acknowledgments

- OpenCASCADE community for the excellent CAD kernel.
- libzip and pugixml for lightweight archive/XML handling.
- The CNC toolchain community for inspiration.