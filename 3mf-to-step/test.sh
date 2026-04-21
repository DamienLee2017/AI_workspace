#!/bin/bash
set -e

echo "Building 3MF to STEP converter..."
docker build -t 3mf-to-step .

echo "Running test conversion..."
docker run --rm -v $(pwd)/test:/app/test 3mf-to-step test/test.3mf /app/test/output.step

if [ -f "./test/output.step" ]; then
    echo "Test passed: output.step generated successfully."
    echo "File size: $(wc -c < ./test/output.step) bytes"
else
    echo "Test failed: output.step not found."
    exit 1
fi