import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, CheckCheck, FileCode } from "lucide-react";

interface OutputSectionProps {
  gcode: string;
  stats?: {
    lineCount: number;
    estimatedTime: number;
    toolPathLength: number;
  };
}

export function OutputSection({ gcode, stats }: OutputSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (gcode) {
      await navigator.clipboard.writeText(gcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!gcode) return;
    const blob = new Blob([gcode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.nc";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCode className="w-5 h-5 text-primary" />
            生成的 Gcode
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!gcode}
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!gcode}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              下载
            </Button>
          </div>
        </div>

        {stats && (
          <div className="flex gap-4 pt-2 text-sm">
            <span className="text-muted-foreground">
              行数: <span className="font-mono text-foreground">{stats.lineCount}</span>
            </span>
            <span className="text-muted-foreground">
              路径: <span className="font-mono text-foreground">{stats.toolPathLength.toFixed(1)} mm</span>
            </span>
            <span className="text-muted-foreground">
              预估: <span className="font-mono text-foreground">{Math.ceil(stats.estimatedTime / 60)} min</span>
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="relative">
          <pre className="h-[500px] overflow-auto rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed">
            {gcode || (
              <span className="text-muted-foreground italic">
                等待生成 Gcode...
              </span>
            )}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
