/**
 * Canvas component for drawing signatures with touch/mouse input.
 * Supports bezier smoothing for natural-looking strokes.
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SignatureCanvasProps {
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Line width for drawing */
  lineWidth?: number;
  /** CSS class for container */
  className?: string;
  /** Callback when signature is exported as data URL */
  onExport?: (dataUrl: string, width: number, height: number) => void;
}

export function SignatureCanvas({
  width = 400,
  height = 200,
  lineWidth = 3,
  className,
  onExport,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  
  // Track current stroke points for bezier smoothing
  const points = useRef<{ x: number; y: number }[]>([]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Get canvas context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  // Clear the canvas
  const clear = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    points.current = [];
    lastPoint.current = null;
    setHasContent(false);
  }, [getContext, width, height]);

  // Apply bezier smoothing to stroke
  const drawSmoothLine = useCallback(
    (ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) => {
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        // Use quadratic bezier curves for smoothing
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        // Draw line to last point
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
    },
    [],
  );

  // Get position from mouse/touch event
  const getPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      } else {
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }
    },
    [],
  );

  // Start drawing
  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getPosition(e);
      if (!pos) return;

      const ctx = getContext();
      if (!ctx) return;

      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";

      setIsDrawing(true);
      setHasContent(true);
      points.current = [pos];
      lastPoint.current = pos;
    },
    [getContext, getPosition, lineWidth],
  );

  // Draw
  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const pos = getPosition(e);
      if (!pos || !lastPoint.current) return;

      const ctx = getContext();
      if (!ctx) return;

      // Add point to path
      points.current.push(pos);

      // Clear and redraw with smoothing
      ctx.clearRect(0, 0, width, height);
      drawSmoothLine(ctx, points.current);

      lastPoint.current = pos;
    },
    [isDrawing, getContext, getPosition, width, height, drawSmoothLine],
  );

  // End drawing
  const handleEnd = useCallback(() => {
    setIsDrawing(false);
    points.current = [];
    lastPoint.current = null;
  }, []);

  // Export signature as PNG data URL
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;

    // Create a clean export canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Fill white background (PDF doesn't support transparency well)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw the signature
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL("image/png");
    onExport?.(dataUrl, width, height);
  }, [hasContent, width, height, onExport]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block touch-none cursor-crosshair bg-white"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={!hasContent}
        >
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleExport}
          disabled={!hasContent}
        >
          Save Signature
        </Button>
      </div>
    </div>
  );
}
