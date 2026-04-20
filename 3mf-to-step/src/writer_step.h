#ifndef WRITER_STEP_H
#define WRITER_STEP_H

#include <TopoDS_Shape.hxx>
#include <string>

bool write_step(const TopoDS_Shape& shape, const std::string& filename);

#endif // WRITER_STEP_H