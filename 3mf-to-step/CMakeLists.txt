cmake_minimum_required(VERSION 3.16)
project(3mf_to_step LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find OpenCASCADE
find_package(OpenCASCADE REQUIRED)
include_directories(${OpenCASCADE_INCLUDE_DIR})
link_directories(${OpenCASCADE_LIBRARY_DIR})

# Find libzip
find_package(LibZip REQUIRED)
include_directories(${LibZip_INCLUDE_DIRS})

# pugixml (header-only XML parser)
add_subdirectory(third_party/pugixml)

# Sources
set(SOURCES
    src/main.cpp
    src/reader_3mf.cpp
    src/converter.cpp
    src/writer_step.cpp
)

add_executable(${PROJECT_NAME} ${SOURCES})
target_link_libraries(${PROJECT_NAME}
    PRIVATE
        ${OpenCASCADE_LIBRARIES}
        ${LibZip_LIBRARIES}
        pugixml
)

# Install
install(TARGETS ${PROJECT_NAME} DESTINATION bin)
