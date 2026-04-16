import { useCallback, useState } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: "copper" | "mask" | "drill";
  content: string;
  status: "pending" | "loaded" | "error";
  error?: string;
}

interface FileUploadSectionProps {
  files: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
}

const fileTypeLabels = {
  copper: "铜层 (.gtl/.gbl)",
  mask: "阻焊层 (.gts/.gbs)",
  drill: "钻孔 (.drl/.txt)",
};

export function FileUploadSection({ files, onFilesChange }: FileUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const parseGerberContent = (content: string, type: "copper" | "mask" | "drill"): { paths: number; apertures: number } => {
    const apertureMatches = content.match(/%ADD\d+/g) || [];
    const pathMatches = content.match(/X\d+Y\d+/g) || [];
    return {
      paths: pathMatches.length,
      apertures: apertureMatches.length,
    };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  }, []);

  const processFiles = (newFiles: File[]) => {
    const fileArray: FileItem[] = [];

    newFiles.forEach((file) => {
      const ext = file.name.toLowerCase().split(".").pop() || "";

      let type: "copper" | "mask" | "drill" = "copper";
      if (ext === "gts" || ext === "gbs") type = "mask";
      if (ext === "drl" || ext === "txt") type = "drill";

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const stats = parseGerberContent(content, type);

        const newFile: FileItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type,
          content,
          status: "loaded",
        };

        const existingIndex = files.findIndex(
          (f) => f.type === type && f.name !== file.name
        );

        if (existingIndex >= 0) {
          const updatedFiles = [...files];
          updatedFiles[existingIndex] = newFile;
          onFilesChange(updatedFiles);
        } else {
          onFilesChange([...files.filter((f) => f.type !== type), newFile]);
        }
      };

      reader.onerror = () => {
        const errorFile: FileItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type,
          content: "",
          status: "error",
          error: "文件读取失败",
        };
        onFilesChange([...files.filter((f) => f.type !== type), errorFile]);
      };

      reader.readAsText(file);
    });
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: "pending" | "loaded" | "error") => {
    switch (status) {
      case "loaded":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".gbr,.gtl,.gbl,.gts,.gbs,.drl,.txt"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-1">
          拖拽 Gerber 文件到此处
        </p>
        <p className="text-xs text-muted-foreground">
          支持 .gbr, .gtl, .gbl, .gts, .gbs, .drl, .txt 格式
        </p>
      </div>

      <div className="space-y-2">
        {(["copper", "mask", "drill"] as const).map((type) => {
          const file = files.find((f) => f.type === type);
          return (
            <div
              key={type}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                file
                  ? file.status === "loaded"
                    ? "bg-success/5 border-success/20"
                    : file.status === "error"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-muted/50 border-border"
                  : "bg-muted/30 border-border/50"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                {file ? (
                  <File className={cn(
                    "w-5 h-5",
                    file.status === "loaded" ? "text-success" : file.status === "error" ? "text-destructive" : "text-muted-foreground"
                  )} />
                ) : (
                  <File className="w-5 h-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file ? file.name : fileTypeLabels[type]}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {file ? (
                    <>
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === "loaded" && (
                        <>
                          <span>·</span>
                          <span>{parseGerberContent(file.content, file.type).paths} 路径</span>
                          <span>·</span>
                          <span>{parseGerberContent(file.content, file.type).apertures} 孔径</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>未上传</span>
                  )}
                </div>
              </div>
              {getStatusIcon(file?.status || "pending")}
              {file && (
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
