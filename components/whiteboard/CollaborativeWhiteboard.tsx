"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Eraser,
  Download,
  Trash2,
  Undo,
  Redo,
  Circle,
  Square as SquareIcon,
  Minus,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Point {
  x: number;
  y: number;
}

interface DrawAction {
  type: "draw" | "erase";
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "eraser" | "line" | "circle" | "square" | "text";
}

interface CollaborativeWhiteboardProps {
  roomId: string;
  className?: string;
}

export default function CollaborativeWhiteboard({
  roomId,
  className,
}: CollaborativeWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<"pen" | "eraser" | "line" | "circle" | "square" | "text">("pen");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const colors = [
    "#000000", // Black
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFFFFF", // White
  ];

  const brushSizes = [1, 2, 4, 6, 8, 12];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        // Redraw canvas
        redrawCanvas();
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all actions from history
    history.slice(0, historyIndex + 1).forEach((action) => {
      drawAction(ctx, action);
    });
  };

  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (action.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.beginPath();
    action.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const point = getPoint(e, rect);

    const newAction: DrawAction = {
      type: currentTool === "eraser" ? "erase" : "draw",
      points: [point],
      color: currentColor,
      width: currentTool === "eraser" ? brushSize * 3 : brushSize,
      tool: currentTool,
    };

    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newAction]);
    setHistoryIndex((prev) => prev + 1);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const point = getPoint(e, rect);

    setHistory((prev) => {
      const newHistory = [...prev];
      const currentAction = newHistory[newHistory.length - 1];
      if (currentAction) {
        currentAction.points.push(point);
      }
      return newHistory;
    });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentAction = history[history.length - 1];
    if (currentAction) {
      const lastPoint = currentAction.points[currentAction.points.length - 2];
      if (lastPoint) {
        ctx.strokeStyle = currentAction.color;
        ctx.lineWidth = currentAction.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (currentAction.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.globalCompositeOperation = "source-over";
        }

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    rect: DOMRect
  ): Point => {
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      redrawCanvas();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      redrawCanvas();
    }
  };

  const handleClear = () => {
    setHistory([]);
    setHistoryIndex(-1);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className={cn("flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30 flex-wrap">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 border-r border-border pr-2">
          <Button
            variant={currentTool === "pen" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentTool("pen")}
            className="h-8 w-8 p-0"
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === "eraser" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentTool("eraser")}
            className="h-8 w-8 p-0"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Colors - Mobile Responsive */}
        <div className="flex items-center gap-1 border-r border-border pr-2 overflow-x-auto">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0",
                currentColor === color
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Brush Sizes - Mobile Responsive */}
        <div className="flex items-center gap-1 border-r border-border pr-2 overflow-x-auto">
          {brushSizes.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={cn(
                "h-8 w-8 rounded flex items-center justify-center transition-colors flex-shrink-0",
                brushSize === size
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: size * 2, height: size * 2 }}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 touch-none"
          style={{ cursor: currentTool === "eraser" ? "crosshair" : "default" }}
        />
      </div>
    </div>
  );
}
