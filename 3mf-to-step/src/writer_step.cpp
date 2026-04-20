#include "writer_step.h"
#include <STEPControl_Writer.hxx>
#include <Interface_Static.hxx>

bool write_step(const TopoDS_Shape& shape, const std::string& filename) {
    // Set STEP parameters (optional)
    Interface_Static::SetCVal("write.step.schema", "AP214");

    STEPControl_Writer writer;
    STEPControl_StepModelType mode = STEPControl_AsIs;
    IFSelect_ReturnStatus status = writer.Transfer(shape, mode);
    if (status != IFSelect_RetDone) {
        return false;
    }

    status = writer.Write(filename.c_str());
    return status == IFSelect_RetDone;
}