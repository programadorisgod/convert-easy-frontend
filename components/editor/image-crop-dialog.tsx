"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, Image as ImageIcon, UserRound } from "lucide-react";
import AvatarEditor from "react-avatar-editor";
import { Cropper, RectangleStencil } from "react-advanced-cropper";
import type { CropperRef } from "react-advanced-cropper";
import { sileo } from "sileo";

import { createCroppedImageFile } from "@/lib/image-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CropMode = "avatar" | "image";
type AspectRatioPreset = "free" | "square" | "portrait" | "landscape";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File;
  onApply: (file: File, mode: CropMode) => Promise<void> | void;
}

const AVATAR_SIZE = 320;
const AVATAR_BORDER = 28;

const ASPECT_RATIO_PRESETS: Record<
  Exclude<AspectRatioPreset, "free">,
  number
> = {
  square: 1,
  portrait: 4 / 5,
  landscape: 16 / 9,
};

function getStencilProps(aspectRatioPreset: AspectRatioPreset) {
  const baseProps = {
    movable: true,
    resizable: true,
    grid: true,
    lines: true,
    handlers: true,
  };

  if (aspectRatioPreset === "free") {
    return baseProps;
  }

  return {
    ...baseProps,
    aspectRatio: ASPECT_RATIO_PRESETS[aspectRatioPreset],
  };
}

export function ImageCropDialog({
  open,
  onOpenChange,
  file,
  onApply,
}: ImageCropDialogProps) {
  const avatarEditorRef = useRef<AvatarEditor | null>(null);
  const cropperRef = useRef<CropperRef>(null);

  const [mode, setMode] = useState<CropMode>("image");
  const [avatarScale, setAvatarScale] = useState(1.15);
  const [avatarRotate, setAvatarRotate] = useState(0);
  const [aspectRatioPreset, setAspectRatioPreset] =
    useState<AspectRatioPreset>("free");
  const [imageSourceUrl, setImageSourceUrl] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const nextImageSourceUrl = URL.createObjectURL(file);
    setImageSourceUrl(nextImageSourceUrl);

    return () => {
      URL.revokeObjectURL(nextImageSourceUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode("image");
    setAvatarScale(1.15);
    setAvatarRotate(0);
    setAspectRatioPreset("free");
    setIsApplying(false);
  }, [open, file.name]);

  const handleApply = async () => {
    setIsApplying(true);

    try {
      const canvas =
        mode === "avatar"
          ? avatarEditorRef.current?.getImageScaledToCanvas()
          : cropperRef.current?.getCanvas();

      if (!canvas) {
        throw new Error(
          "No se pudo preparar el recorte. Intenta ajustar el area y probar de nuevo.",
        );
      }

      const croppedFile = await createCroppedImageFile(canvas, file, mode);
      await onApply(croppedFile, mode);
      onOpenChange(false);
    } catch (error) {
      sileo.error({
        title: "Error al recortar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo aplicar el recorte.",
        roundness: 16,
        duration: 5000,
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isApplying) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Recortar imagen</DialogTitle>
          <DialogDescription>
            Elige un recorte circular para avatar o un recorte libre para fotos.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as CropMode)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Foto
            </TabsTrigger>
            <TabsTrigger value="avatar" className="gap-2">
              <UserRound className="h-4 w-4" />
              Avatar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
              <div className="overflow-hidden rounded-xl border bg-muted/20 p-3">
                <Cropper
                  ref={cropperRef}
                  src={imageSourceUrl}
                  stencilComponent={RectangleStencil}
                  stencilProps={getStencilProps(aspectRatioPreset)}
                  transitions={false}
                  className="h-105 w-full bg-muted/60"
                />
              </div>

              <div className="space-y-4 rounded-xl border bg-card p-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Ajustes del recorte
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    El recorte se exporta en el formato mas compatible con tu
                    imagen actual.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Proporción</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "free", label: "Libre" },
                      { value: "square", label: "1:1" },
                      { value: "portrait", label: "4:5" },
                      { value: "landscape", label: "16:9" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={
                          aspectRatioPreset === option.value
                            ? "default"
                            : "outline"
                        }
                        className="justify-center"
                        onClick={() =>
                          setAspectRatioPreset(
                            option.value as AspectRatioPreset,
                          )
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  Arrastra la imagen para reposicionarla y usa los bordes del
                  marco para ajustar el area visible.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.8fr)]">
              <div className="flex items-center justify-center rounded-xl border bg-muted/20 p-4">
                <AvatarEditor
                  ref={avatarEditorRef}
                  image={file}
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  border={AVATAR_BORDER}
                  borderRadius={999}
                  scale={avatarScale}
                  rotate={avatarRotate}
                  color={[15, 23, 42, 0.72]}
                  backgroundColor="rgba(0, 0, 0, 0)"
                  disableHiDPIScaling
                />
              </div>

              <div className="space-y-5 rounded-xl border bg-card p-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Ajustes del avatar
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se exporta como PNG circular para conservar bordes limpios y
                    transparencia.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Zoom</Label>
                    <span className="text-xs text-muted-foreground">
                      {avatarScale.toFixed(2)}x
                    </span>
                  </div>
                  <Slider
                    value={[avatarScale]}
                    onValueChange={(values) =>
                      setAvatarScale(values[0] ?? 1.15)
                    }
                    min={1}
                    max={3}
                    step={0.05}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Rotación</Label>
                    <span className="text-xs text-muted-foreground">
                      {avatarRotate}°
                    </span>
                  </div>
                  <Slider
                    value={[avatarRotate]}
                    onValueChange={(values) => setAvatarRotate(values[0] ?? 0)}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>

                <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  Centra el rostro dentro del circulo y ajusta el zoom para
                  evitar recortes agresivos.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="gap-2"
          >
            <Crop className="h-4 w-4" />
            {isApplying ? "Aplicando..." : "Aplicar recorte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
