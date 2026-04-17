/**
 * Text-to-signature component.
 * Converts typed text to a cursive-style signature image using Pacifico font.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TextSignatureProps {
  /** Width of the output image */
  width?: number;
  /** Height of the output image */
  height?: number;
  /** Initial text value */
  initialText?: string;
  /** CSS class for container */
  className?: string;
  /** Callback when signature is rendered as data URL */
  onRender?: (dataUrl: string, width: number, height: number) => void;
}

export function TextSignature({
  width = 400,
  height = 120,
  initialText = "",
  className,
  onRender,
}: TextSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(initialText);
  const fontFamily = "Pacifico, cursive";

  // Render text to canvas for export
  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and fill white background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (!text.trim()) return;

    // Calculate font size based on text length and available width
    const baseFontSize = Math.min(width * 0.15, height * 0.8);
    const fontSize = Math.max(24, Math.min(baseFontSize, width / (text.length * 0.5)));
    
    ctx.font = `${fontSize}px "${fontFamily}", cursive`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw centered
    ctx.fillText(text, width / 2, height / 2);
  }, [text, width, height, fontFamily]);

  // Update canvas when text changes
  useEffect(() => {
    renderToCanvas();
  }, [renderToCanvas]);

  // Export signature as PNG data URL
  const handleExport = useCallback(() => {
    if (!text.trim()) return;
    renderToCanvas();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    onRender?.(dataUrl, width, height);
  }, [text, width, height, onRender, renderToCanvas]);

  // Calculate preview font size
  const previewFontSize = Math.min(width * 0.12, height * 0.6, 56);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Hidden canvas for rendering */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="hidden"
      />

      {/* Preview with text centered */}
      <div 
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg bg-white flex items-center justify-center overflow-hidden p-2"
        style={{ width, height }}
      >
        {text.trim() ? (
          <span 
            className="text-black text-center leading-tight break-words max-w-full"
            style={{ 
              fontFamily,
              fontSize: previewFontSize,
              maxWidth: width - 16,
            }}
          >
            {text}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm font-sans">
            Type your name above
          </span>
        )}
      </div>

      {/* Input */}
      <Input
        type="text"
        placeholder="Type your name"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="font-sans"
      />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleExport}
          disabled={!text.trim()}
        >
          Create Signature
        </Button>
      </div>
    </div>
  );
}
