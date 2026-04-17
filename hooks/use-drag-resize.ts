/**
 * Vanilla drag and resize logic for signature overlay.
 * Uses mouse/touch events with pointer capture.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SignaturePosition,
  SignatureSize,
  ResizeHandle,
} from "@/types/signature";

export interface UseDragResizeOptions {
  /** Initial position */
  initialPosition: SignaturePosition;
  /** Initial size */
  initialSize: SignatureSize;
  /** Minimum size constraint */
  minSize?: number;
  /** Maximum size constraint */
  maxSize?: number;
  /** Container element ref for boundary constraints */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Callback when position changes */
  onPositionChange: (pos: SignaturePosition) => void;
  /** Callback when size changes */
  onSizeChange: (size: SignatureSize) => void;
}

export interface UseDragResizeResult {
  /** Current position */
  position: SignaturePosition;
  /** Current size */
  size: SignatureSize;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Whether currently resizing */
  isResizing: boolean;
  /** Props to spread on draggable element */
  handleProps: React.HTMLAttributes<HTMLDivElement>;
  /** Props to spread on resize handles */
  getResizeHandleProps: (handle: ResizeHandle) => React.HTMLAttributes<HTMLDivElement>;
  /** Styles for the overlay */
  overlayStyle: React.CSSProperties;
}

export function useDragResize(
  options: UseDragResizeOptions,
): UseDragResizeResult {
  const {
    initialPosition,
    initialSize,
    minSize = 50,
    maxSize = Infinity,
    containerRef,
    onPositionChange,
    onSizeChange,
  } = options;

  const [position, setPosition] = useState<SignaturePosition>(initialPosition);
  const [size, setSize] = useState<SignatureSize>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Track drag start position
  const dragStart = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const resizeStart = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  
  // Track if listeners are attached
  const listenersAttached = useRef(false);

  const clamp = useCallback(
    (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    [],
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      dragStart.current = {
        x: clientX,
        y: clientY,
        startX: position.x,
        startY: position.y,
      };
      setIsDragging(true);
    },
    [position.x, position.y],
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (handle: ResizeHandle) =>
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        resizeStart.current = {
          handle,
          startX: clientX,
          startY: clientY,
          startWidth: size.width,
          startHeight: size.height,
          startPosX: position.x,
          startPosY: position.y,
        };
        setIsResizing(true);
      },
    [size.width, size.height, position.x, position.y],
  );

  // Global mouse/touch move handler
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isDragging && dragStart.current && containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const dx = clientX - dragStart.current.x;
        const dy = clientY - dragStart.current.y;

        let newX = dragStart.current.startX + dx;
        let newY = dragStart.current.startY + dy;

        // Constrain to container bounds
        newX = clamp(newX, 0, container.width - size.width);
        newY = clamp(newY, 0, container.height - size.height);

        setPosition({ x: newX, y: newY });
        onPositionChange({ x: newX, y: newY });
      }

      if (isResizing && resizeStart.current && containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const { handle, startX, startY, startWidth, startHeight, startPosX, startPosY } =
          resizeStart.current;

        const dx = clientX - startX;
        const dy = clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startPosX;
        let newY = startPosY;

        // Calculate new size and position based on handle
        switch (handle) {
          case "se": // Bottom-right
            newWidth = clamp(startWidth + dx, minSize, maxSize);
            newHeight = clamp(startHeight + dy, minSize, maxSize);
            break;
          case "sw": // Bottom-left
            newWidth = clamp(startWidth - dx, minSize, maxSize);
            newHeight = clamp(startHeight + dy, minSize, maxSize);
            newX = startPosX + (startWidth - newWidth);
            break;
          case "ne": // Top-right
            newWidth = clamp(startWidth + dx, minSize, maxSize);
            newHeight = clamp(startHeight - dy, minSize, maxSize);
            newY = startPosY + (startHeight - newHeight);
            break;
          case "nw": // Top-left
            newWidth = clamp(startWidth - dx, minSize, maxSize);
            newHeight = clamp(startHeight - dy, minSize, maxSize);
            newX = startPosX + (startWidth - newWidth);
            newY = startPosY + (startHeight - newHeight);
            break;
        }

        // Final constraint to container
        newX = clamp(newX, 0, container.width - newWidth);
        newY = clamp(newY, 0, container.height - newHeight);

        setPosition({ x: newX, y: newY });
        setSize({ width: newWidth, height: newHeight });
        onPositionChange({ x: newX, y: newY });
        onSizeChange({ width: newWidth, height: newHeight });
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      resizeStart,
      containerRef,
      size.width,
      size.height,
      minSize,
      maxSize,
      clamp,
      onPositionChange,
      onSizeChange,
    ],
  );

  // Global mouse/touch up handler
  const handleEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStart.current = null;
    }
    if (isResizing) {
      setIsResizing(false);
      resizeStart.current = null;
    }
  }, [isDragging, isResizing]);

  // Attach/detach global event listeners when dragging/resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      if (!listenersAttached.current) {
        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onMouseUp = () => handleEnd();
        const onTouchMove = (e: TouchEvent) => {
          if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        };
        const onTouchEnd = () => handleEnd();

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("touchend", onTouchEnd);

        // Store cleanup function
        listenersAttached.current = true;
        
        return () => {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
          window.removeEventListener("touchmove", onTouchMove);
          window.removeEventListener("touchend", onTouchEnd);
          listenersAttached.current = false;
        };
      }
    } else if (listenersAttached.current) {
      // Cleanup if somehow we ended up without dragging/resizing but listeners attached
      window.removeEventListener("mousemove", handleMove as any);
      window.removeEventListener("mouseup", handleEnd);
      listenersAttached.current = false;
    }
    return undefined;
  }, [isDragging, isResizing, handleMove, handleEnd]);

  const getCursor = () => {
    if (isDragging) return "grabbing";
    if (isResizing) return "nwse-resize";
    return "grab";
  };

  return {
    position,
    size,
    isDragging,
    isResizing,
    handleProps: {
      onMouseDown: handleDragStart,
      onTouchStart: handleDragStart,
      style: { cursor: getCursor() },
    },
    getResizeHandleProps: (handle: ResizeHandle) => ({
      onMouseDown: handleResizeStart(handle),
      onTouchStart: handleResizeStart(handle),
      style: {
        cursor: `${handle}-resize`,
        position: "absolute",
        width: "12px",
        height: "12px",
        backgroundColor: "white",
        border: "2px solid #3b82f6",
        borderRadius: "2px",
      },
    }),
    overlayStyle: {
      position: "absolute",
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
      cursor: getCursor(),
    },
  };
}
