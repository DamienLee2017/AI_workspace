# pugixml is header-only; we create an interface target for it.
# You can download the actual header from https://github.com/zeux/pugixml
# and place it in this directory.

add_library(pugixml INTERFACE)
target_include_directories(pugixml INTERFACE ${CMAKE_CURRENT_SOURCE_DIR})