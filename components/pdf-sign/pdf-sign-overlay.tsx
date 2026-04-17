/**
 * PDF Sign Overlay component.
 * Draggable and resizable overlay for positioning signatures on PDFs.
 */

"use client";

import { useCallback } from "react";
import type {
  StoredSignature,
  SignaturePosition,
  SignatureSize,
  ResizeHandle,
} from "@/types/signature";
import { useDragResize } from "@/hooks/use-drag-resize";

export interface PdfSignOverlayProps {
  /** The signature to display */
  signature: StoredSignature;
  /** Current position */
  position: SignaturePosition;
  /** Current size */
  size: SignatureSize;
  /** Container element ref for boundary constraints */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Current zoom level (for display purposes) */
  zoom?: number;
  /** Callback when position changes */
  onPositionChange?: (pos: SignaturePosition) => void;
  /** Callback when size changes */
  onSizeChange?: (size: SignatureSize) => void;
  /** Whether the overlay is visible */
  visible?: boolean;
  /** CSS class */
  className?: string;
}

const HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se"];

const handleStyle: Record<ResizeHandle, React.CSSProperties> = {
  nw: { top: "-6px", left: "-6px", cursor: "nwse-resize" },
  ne: { top: "-6px", right: "-6px", cursor: "nesw-resize" },
  sw: { bottom: "-6px", left: "-6px", cursor: "nesw-resize" },
  se: { bottom: "-6px", right: "-6px", cursor: "nwse-resize" },
};

export function PdfSignOverlay({
  signature,
  position,
  size,
  containerRef,
  zoom = 1,
  onPositionChange,
  onSizeChange,
  visible = true,
  className,
}: PdfSignOverlayProps) {
  const handlePositionChange = useCallback(
    (pos: SignaturePosition) => {
      onPositionChange?.(pos);
    },
    [onPositionChange],
  );

  const handleSizeChange = useCallback(
    (sz: SignatureSize) => {
      onSizeChange?.(sz);
    },
    [onSizeChange],
  );

  const { handleProps, getResizeHandleProps, overlayStyle } = useDragResize({
    initialPosition: position,
    initialSize: size,
    containerRef,
    onPositionChange: handlePositionChange,
    onSizeChange: handleSizeChange,
  });

  if (!visible) return null;

  return (
    <div
      className={className}
      style={{
        ...overlayStyle,
        zIndex: 10,
        border: "2px dashed #3b82f6",
        borderRadius: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      }}
      {...handleProps}
    >
      {/* Signature image */}
      <img
        src={signature.dataUrl}
        alt={signature.name}
        className="pointer-events-none w-full h-full object-contain select-none"
        draggable={false}
      />

      {/* Resize handles - 4 corners */}
      {HANDLES.map((handle) => (
        <div
          key={handle}
          className="absolute bg-white border-2 border-blue-500 rounded-sm"
          style={{
            width: "12px",
            height: "12px",
            ...handleStyle[handle],
          }}
          {...getResizeHandleProps(handle)}
        />
      ))}
    </div>
  );
}
