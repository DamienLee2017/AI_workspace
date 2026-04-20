#!/bin/bash
set -e

BUILD_DIR="build"

echo "Building 3MF to STEP converter..."

if [ ! -d "$BUILD_DIR" ]; then
    mkdir "$BUILD_DIR"
fi

cd "$BUILD_DIR"

# Configure with CMake
cmake .. -DCMAKE_BUILD_TYPE=Release

# Build
make -j$(nproc)

echo "Build successful. The executable is at $BUILD_DIR/3mf_to_step"
echo "You can run it with: ./3mf_to_step input.3mf output.step"