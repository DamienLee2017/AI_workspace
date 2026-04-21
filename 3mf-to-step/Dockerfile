# Use Ubuntu as base image
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    libocct-foundation-dev \
    libocct-modeling-dev \
    libocct-ocaf-dev \
    libzip-dev \
    libpugixml-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build
RUN mkdir -p build && cd build && cmake .. && make -j$(nproc)

# Set entrypoint
ENTRYPOINT ["./build/3mf_to_step"]