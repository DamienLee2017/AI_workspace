import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  isProcessing: boolean;
  error?: string | null;
  uploadProgress?: number;
}

export function FileUpload({
  onFileSelect,
  file,
  isProcessing,
  error,
  uploadProgress = 0,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    const validExtensions = [".step", ".stp", ".STEP", ".STP"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      setValidationError("仅支持 STEP/STP 格式文件");
      return false;
    }
    
    // STEP files are typically text-based, limit size to 100MB
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationError("文件大小不能超过 100MB");
      return false;
    }
    
    setValidationError(null);
    return true;
  }, []);

  const handleFile = useCallback((selectedFile: File) => {
    if (validateFile(selectedFile)) {
      onFileSelect(selectedFile);
    }
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null as any);
    setValidationError(null);
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              validationError && "border-destructive"
            )}
          >
            <input
              type="file"
              accept=".step,.stp,.STEP,.STP"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <motion.div
                animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  isDragging ? "bg-primary/10" : "bg-muted"
                )}
              >
                <Upload className={cn(
                  "w-8 h-8",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
              </motion.div>
              
              <div className="space-y-1">
                <p className="text-base font-medium">
                  {isDragging ? "释放文件以上传" : "拖拽 STEP 文件到此处"}
                </p>
                <p className="text-sm text-muted-foreground">
                  或点击选择文件 · 支持 .step / .stp 格式
                </p>
              </div>
              
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  {validationError}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border rounded-xl p-4 bg-card"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                isProcessing ? "bg-primary/10" : "bg-success/10"
              )}>
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <File className="w-6 h-6 text-success" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                  {isProcessing && uploadProgress > 0 && (
                    <span className="ml-2">· {uploadProgress}%</span>
                  )}
                </p>
              </div>
              
              {!isProcessing && (
                <button
                  onClick={clearFile}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="移除文件"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {isProcessing && uploadProgress > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10"
              >
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
