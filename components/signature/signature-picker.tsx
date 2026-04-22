/**
 * Signature picker component.
 * Displays saved signatures and allows creating new ones.
 */

"use client";

import { useCallback, useState } from "react";
import { FileSignature, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StoredSignature, SignatureMode } from "@/types/signature";
import { SignatureCanvas } from "./signature-canvas";
import { TextSignature } from "./text-signature";
import { sileo } from "sileo";

export interface SignaturePickerProps {
  /** Saved signatures */
  signatures: StoredSignature[];
  /** Currently selected signature */
  selectedSignature: StoredSignature | null;
  /** Whether signatures are loading */
  isLoading?: boolean;
  /** Callback when a signature is selected */
  onSelect?: (signature: StoredSignature) => void;
  /** Callback when a signature is deleted */
  onDelete?: (id: string) => void;
  /** Callback when a new signature is saved */
  onSave?: (dataUrl: string, name: string, width: number, height: number) => void;
  /** CSS class for container */
  className?: string;
}

export function SignaturePicker({
  signatures,
  selectedSignature,
  isLoading = false,
  onSelect,
  onDelete,
  onSave,
  className,
}: SignaturePickerProps) {
  const [mode, setMode] = useState<SignatureMode | null>(null);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Handle signature creation from canvas
  const handleCanvasExport = useCallback(
    async (dataUrl: string, width: number, height: number) => {
      const name = newName.trim() || `Signature ${signatures.length + 1}`;
      
      setIsSaving(true);
      try {
        await onSave?.(dataUrl, name, width, height);
        sileo.success({
          title: "Signature saved",
          description: `"${name}" has been saved`,
          roundness: 16,
          duration: 3000,
        });
        setMode(null);
        setNewName("");
      } finally {
        setIsSaving(false);
      }
    },
    [newName, signatures.length, onSave],
  );

  // Handle signature creation from text
  const handleTextRender = useCallback(
    async (dataUrl: string, width: number, height: number) => {
      const name = newName.trim() || `Signature ${signatures.length + 1}`;
      
      setIsSaving(true);
      try {
        await onSave?.(dataUrl, name, width, height);
        sileo.success({
          title: "Signature saved",
          description: `"${name}" has been saved`,
          roundness: 16,
          duration: 3000,
        });
        setMode(null);
        setNewName("");
      } finally {
        setIsSaving(false);
      }
    },
    [newName, signatures.length, onSave],
  );

  // Handle signature selection with visual feedback
  const handleSelect = useCallback(
    (signature: StoredSignature) => {
      onSelect?.(signature);
      sileo.show({
        title: "Signature selected",
        description: signature.name,
        roundness: 16,
        duration: 2000,
      });
    },
    [onSelect],
  );

  // Cancel creation mode
  const handleCancel = () => {
    setMode(null);
    setNewName("");
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show creation mode
  if (mode) {
    return (
      <div className={cn("flex flex-col gap-4 p-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {mode === "draw" ? "Draw Signature" : "Type Signature"}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>

        {/* Name input */}
        <Input
          placeholder="Signature name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />

        {/* Canvas or text input */}
        {mode === "draw" ? (
          <SignatureCanvas onExport={handleCanvasExport} />
        ) : (
          <TextSignature onRender={handleTextRender} />
        )}
      </div>
    );
  }

  // Show signature picker
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Signatures
        </h3>
        {signatures.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {signatures.length} saved
          </span>
        )}
      </div>

      {/* Create new buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setMode("draw")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Draw
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setMode("text")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Type
        </Button>
      </div>

      {/* Saved signatures list */}
      {signatures.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className={cn(
                "relative group border-2 rounded-lg p-2 cursor-pointer transition-all",
                selectedSignature?.id === sig.id
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/50",
              )}
              onClick={() => handleSelect(sig)}
            >
              {/* Selected indicator */}
              {selectedSignature?.id === sig.id && (
                <div className="absolute top-1 right-1">
                  <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                </div>
              )}

              {/* Signature preview */}
              <div className="flex items-center justify-center bg-white rounded min-h-[60px]">
                <div className="bg-white p-1">
                  <img
                    src={sig.dataUrl}
                    alt={sig.name}
                    className="max-w-full max-h-16 object-contain"
                  />
                </div>
              </div>

              {/* Name and delete */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs truncate text-muted-foreground flex-1 mr-1">
                  {sig.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(sig.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No signatures yet</p>
          <p className="text-xs mt-1">Create one to get started</p>
        </div>
      )}
    </div>
  );
}
