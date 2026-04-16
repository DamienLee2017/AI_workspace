import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileText, Trash2, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GcodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function GcodeEditor({ value, onChange, readOnly = false }: GcodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [fileSize, setFileSize] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const lines = value ? value.split("\n").length : 1;
    setLineCount(lines);
    setFileSize(new Blob([value]).size);
  }, [value]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onChange(content);
          setFileName(file.name);
        };
        reader.readAsText(file);
      }
    },
    [onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onChange(content);
          setFileName(file.name);
        };
        reader.readAsText(file);
      }
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
    setFileName(null);
  }, [onChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
  }, [value]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "output.gcode";
    a.click();
    URL.revokeObjectURL(url);
  }, [value, fileName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue =
            value.substring(0, start) + "  " + value.substring(end);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }, 0);
        }
      }
    },
    [value, onChange]
  );

  const highlightCode = useCallback((code: string) => {
    const lines = code.split("\n");
    return lines.map((line, index) => {
      const highlighted = line
        .replace(
          /^(G\d+|M\d+|T\d+|S\d+|F\d+|X[+-]?[\d.]*|Y[+-]?[\d.]*|Z[+-]?[\d.]*|I[+-]?[\d.]*|J[+-]?[\d.]*|K[+-]?[\d.]*|P[+-]?[\d.]*|R[+-]?[\d.]*|E[+-]?[\d.]*|H\d*|D\d*|N\d*)/g,
          '<span class="text-primary font-semibold">$1</span>'
        )
        .replace(
          /;\s*.*/g,
          '<span class="text-muted-foreground italic">$&</span>'
        )
        .replace(
          /\([\s\S]*?\)/g,
          '<span class="text-muted-foreground italic">$&</span>'
        );
      return (
        <div
          key={index}
          className={cn(
            "px-2 py-0 leading-6 hover:bg-muted/30 transition-colors",
            line.trim() === "" && "bg-muted/20"
          )}
          dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }}
        />
      );
    });
  }, []);

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {fileName || "Gcode 输入"}
          </span>
          {fileName && (
            <Badge variant="secondary" className="text-xs">
              {lineCount} 行 · {fileSize} bytes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!value}
            className="h-8"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!value}
            className="h-8"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!value}
            className="h-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div
        className={cn(
          "flex-1 relative overflow-hidden",
          isDragging && "ring-2 ring-primary ring-inset"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {!value ? (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              accept=".gcode,.nc,.ngc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <span className="text-lg font-medium text-muted-foreground">
              拖放 Gcode 文件或点击上传
            </span>
            <span className="text-sm text-muted-foreground/70 mt-2">
              支持 .gcode, .nc, .ngc, .txt 格式
            </span>
          </label>
        ) : (
          <div className="flex h-full">
            {/* Line numbers */}
            <div
              ref={lineNumbersRef}
              className="w-14 shrink-0 overflow-hidden bg-muted/30 border-r border-border select-none"
            >
              <div className="py-3">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div
                    key={i}
                    className="px-2 text-right text-xs text-muted-foreground/60 leading-6 h-6"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Code display (syntax highlighted) */}
            <div
              className="flex-1 overflow-auto font-mono text-sm absolute inset-0 pl-14"
              onScroll={handleScroll}
            >
              <pre className="p-3 whitespace-pre-wrap break-all pointer-events-none">
                {highlightCode(value)}
              </pre>
            </div>

            {/* Hidden textarea for input */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              readOnly={readOnly}
              className={cn(
                "flex-1 w-full h-full p-3 pl-14",
                "bg-transparent font-mono text-sm",
                "resize-none outline-none",
                "text-transparent caret-foreground",
                "whitespace-pre-wrap break-all"
              )}
              placeholder="在此输入或拖放 Gcode 文件..."
            />
          </div>
        )}

        {/* File upload overlay */}
        {value && (
          <label className="absolute bottom-3 right-3">
            <input
              type="file"
              accept=".gcode,.nc,.ngc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="secondary" size="sm" className="shadow-md">
              <Upload className="w-4 h-4 mr-1" />
              替换文件
            </Button>
          </label>
        )}
      </div>
    </div>
  );
}
