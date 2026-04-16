import { useState, useCallback } from "react";
import { GcodeToolbar, GcodeOptions, BatchReplace } from "./components/gcode-toolbar";
import { GcodeEditor } from "./components/gcode-editor";
import { GcodeOutput } from "./components/gcode-output";

const defaultOptions: GcodeOptions = {
  removeComments: false,
  compressCode: false,
  adjustFeedRate: false,
  feedRateMultiplier: 1.0,
  addHomeCommand: false,
  addSafetyHeight: false,
  safetyHeight: 3,
  removeDuplicates: false,
  batchReplaces: [],
};

function processGcode(code: string, options: GcodeOptions): string {
  let result = code;
  const lines: string[] = result.split("\n");
  const processed: string[] = [];

  // Add home command at start
  if (options.addHomeCommand) {
    processed.push("G28"); // Home all axes
    processed.push("G21"); // mm mode
  }

  // Add safety height if enabled
  if (options.addSafetyHeight) {
    processed.push(`G00 Z${options.safetyHeight}`);
  }

  // Process each line
  let prevLine = "";
  for (const line of lines) {
    let processedLine = line.trim();
    
    // Skip empty lines if compress is enabled
    if (options.compressCode && processedLine === "") continue;
    
    // Remove comments
    if (options.removeComments) {
      // Remove (;) comments
      processedLine = processedLine.replace(/;.*$/, "");
      // Remove () comments
      processedLine = processedLine.replace(/\([^)]*\)/g, "");
      processedLine = processedLine.trim();
    }
    
    if (!processedLine) continue;
    
    // Adjust feed rate
    if (options.adjustFeedRate && options.feedRateMultiplier !== 1.0) {
      processedLine = processedLine.replace(
        /F([\d.]+)/gi,
        (_, f) => `F${(parseFloat(f) * options.feedRateMultiplier).toFixed(3)}`
      );
    }
    
    // Remove duplicates
    if (options.removeDuplicates && processedLine === prevLine) {
      continue;
    }
    
    // Apply batch replaces
    for (const rule of options.batchReplaces) {
      if (!rule.enabled || !rule.search) continue;
      try {
        if (rule.search.includes("/")) {
          // Simple text replace
          processedLine = processedLine.split(rule.search).join(rule.replace);
        } else {
          // Treat as regex-like pattern
          const flags = "gi";
          const pattern = rule.search;
          processedLine = processedLine.replace(new RegExp(pattern, flags), rule.replace);
        }
      } catch {
        // Invalid pattern, skip
      }
    }
    
    if (processedLine) {
      processed.push(processedLine);
      prevLine = processedLine;
    }
  }

  // Compress: merge consecutive G00 moves
  if (options.compressCode) {
    const compressed: string[] = [];
    for (let i = 0; i < processed.length; i++) {
      const line = processed[i];
      if (
        line.startsWith("G00") &&
        i + 1 < processed.length &&
        processed[i + 1].startsWith("G00")
      ) {
        // Merge coordinates
        const coords1 = line.match(/[XYZ][\d.]+/gi) || [];
        const coords2 = processed[i + 1].match(/[XYZ][\d.]+/gi) || [];
        const allCoords = [...coords1, ...coords2].reduce((acc, coord) => {
          const axis = coord[0];
          if (!acc[axis]) {
            acc[axis] = coord;
          }
          return acc;
        }, {} as Record<string, string>);
        compressed.push("G00 " + Object.values(allCoords).join(" "));
        i++; // Skip next line
      } else {
        compressed.push(line);
      }
    }
    processed.length = 0;
    processed.push(...compressed);
  }

  // Add home command at end
  if (options.addHomeCommand) {
    processed.push("G28");
  }

  return processed.join("\n");
}

export default function GcodeEditorPage() {
  const [originalCode, setOriginalCode] = useState("");
  const [processedCode, setProcessedCode] = useState("");
  const [options, setOptions] = useState<GcodeOptions>(defaultOptions);
  const [isProcessing, setIsProcessing] = useState(false);

  const originalLines = originalCode ? originalCode.split("\n").length : 0;
  const processedLines = processedCode ? processedCode.split("\n").length : 0;

  const handleProcess = useCallback(() => {
    if (!originalCode.trim()) return;
    setIsProcessing(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const result = processGcode(originalCode, options);
      setProcessedCode(result);
      setIsProcessing(false);
    }, 300);
  }, [originalCode, options]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".gcode,.nc,.ngc,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setOriginalCode(content);
          setProcessedCode("");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const handleExport = useCallback(() => {
    const code = processedCode || originalCode;
    if (!code) return;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "processed.gcode";
    a.click();
    URL.revokeObjectURL(url);
  }, [processedCode, originalCode]);

  const handleClear = useCallback(() => {
    setOriginalCode("");
    setProcessedCode("");
    setOptions(defaultOptions);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <GcodeToolbar
          options={options}
          onOptionsChange={setOptions}
          onProcess={handleProcess}
          onImport={handleImport}
          onExport={handleExport}
          onClear={handleClear}
          originalLines={originalLines}
          processedLines={processedLines}
          isProcessing={isProcessing}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">原始代码</h3>
            <GcodeEditor
              value={originalCode}
              onChange={(code) => {
                setOriginalCode(code);
                setProcessedCode("");
              }}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">处理后代码</h3>
            <GcodeEditor
              value={processedCode}
              onChange={setProcessedCode}
              readOnly={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
