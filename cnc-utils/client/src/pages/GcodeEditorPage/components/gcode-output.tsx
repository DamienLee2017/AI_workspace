import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, Check, FileCode } from "lucide-react";

interface GcodeOutputProps {
  code: string;
  originalLines: number;
  processedLines: number;
}

export function GcodeOutput({ code, originalLines, processedLines }: GcodeOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (code) {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.gcode";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const stats = {
    removed: originalLines - processedLines,
    reduction: originalLines > 0 ? ((originalLines - processedLines) / originalLines * 100).toFixed(1) : "0",
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCode className="w-5 h-5 text-primary" />
            处理结果
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!code}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              {copied ? "已复制" : "复制"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!code}
            >
              <Download className="w-4 h-4 mr-1" />
              下载
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {code ? (
          <>
            <div className="flex gap-4 px-6 pb-4 flex-shrink-0">
              <Badge variant="outline" className="bg-muted/50">
                原始: {originalLines} 行
              </Badge>
              <Badge variant="outline" className="bg-muted/50">
                处理后: {processedLines} 行
              </Badge>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                减少: {stats.removed} 行 ({stats.reduction}%)
              </Badge>
            </div>

            <ScrollArea className="flex-1 border-t">
              <pre className="p-6 text-xs font-mono leading-relaxed overflow-x-auto">
                <code className="text-muted-foreground">
                  {code.split("\n").map((line, i) => (
                    <div key={i} className="hover:bg-muted/30 px-2 py-0.5 -mx-2 rounded">
                      <span className="text-muted-foreground/50 select-none w-10 inline-block">
                        {String(i + 1).padStart(4, " ")}
                      </span>
                      <span className={
                        line.trim().startsWith(";") ? "text-muted-foreground/60" :
                        line.trim() === "" ? "text-muted-foreground/30" :
                        "text-foreground"
                      }>
                        {line || " "}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileCode className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">在左侧输入 Gcode 并选择操作</p>
              <p className="text-xs mt-1">处理后的代码将显示在这里</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
