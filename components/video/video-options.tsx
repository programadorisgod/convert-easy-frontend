"use client";

import { useState, useCallback } from "react";
import { VIDEO_DEFAULTS, CRF_RANGE, RESOLUTION_PRESETS, FPS_OPTIONS, AUDIO_OUTPUT_FORMATS_SLIM, AUDIO_BITRATE_OPTIONS } from "@/lib/video-constants";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VideoParams {
  crf?: number
  resolution?: string
  fps?: number
  extract_audio?: boolean
  audio_output_format?: string
  audio_bitrate?: string
  remove_audio?: boolean
}

interface VideoOptionsProps {
  value: VideoParams
  onChange: (params: VideoParams) => void
}

const RESOLUTION_RE = /^-?\d+:-?\d+$/;

export function validateResolution(value: string): boolean {
  return RESOLUTION_RE.test(value);
}

export function VideoOptions({ value, onChange }: VideoOptionsProps) {
  const update = useCallback(
    (partial: Partial<VideoParams>) => onChange({ ...value, ...partial }),
    [value, onChange],
  );

  const isExtractAudio = value.extract_audio ?? false;
  const resolutionInPresets = RESOLUTION_PRESETS.some(
    (p) => p.value === value.resolution,
  );
  const [resolutionMode, setResolutionMode] = useState<"preset" | "custom">(
    value.resolution && !resolutionInPresets ? "custom" : "preset",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="crf-slider">CRF ({value.crf ?? VIDEO_DEFAULTS.crf})</Label>
        </div>
        <Slider
          id="crf-slider"
          min={CRF_RANGE.min}
          max={CRF_RANGE.max}
          step={CRF_RANGE.step}
          value={[value.crf ?? VIDEO_DEFAULTS.crf]}
          onValueChange={([v]) => update({ crf: v })}
          disabled={isExtractAudio}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 (lossless)</span>
          <span>51 (worst)</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Resolución</Label>
        <div className="flex gap-2">
          <Select
            value={resolutionMode === "preset" && value.resolution ? value.resolution : "custom"}
            onValueChange={(v) => {
              if (v === "custom") {
                setResolutionMode("custom");
                update({ resolution: "" });
              } else {
                setResolutionMode("preset");
                update({ resolution: v });
              }
            }}
            disabled={isExtractAudio}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Personalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {resolutionMode === "custom" && (
          <Input
            placeholder="WIDTH:HEIGHT (ej: 1920:1080)"
            value={value.resolution ?? ""}
            onChange={(e) => update({ resolution: e.target.value })}
            disabled={isExtractAudio}
          />
        )}
        {value.resolution && !validateResolution(value.resolution) && (
          <p className="text-xs text-destructive">
            Formato inválido. Usá WIDTH:HEIGHT (ej: 1920:1080)
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fps-select">FPS</Label>
        <Select
          value={value.fps?.toString() ?? ""}
          onValueChange={(v) => update({ fps: v ? Number(v) : undefined })}
          disabled={isExtractAudio}
        >
          <SelectTrigger id="fps-select" className="w-full">
            <SelectValue
              placeholder={
                value.fps
                  ? `${value.fps} FPS`
                  : `${VIDEO_DEFAULTS.fps} FPS`
              }
            />
          </SelectTrigger>
          <SelectContent>
            {FPS_OPTIONS.map((f) => (
              <SelectItem key={f} value={f.toString()}>
                {f} FPS
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="extract-audio"
          checked={isExtractAudio}
          onCheckedChange={(checked) =>
            update({
              extract_audio: checked,
              ...(checked
                ? { audio_output_format: "mp3", audio_bitrate: "192k" }
                : { audio_output_format: undefined, audio_bitrate: undefined }),
            })
          }
        />
        <Label htmlFor="extract-audio">Extraer audio</Label>
      </div>

      {isExtractAudio && (
        <div className="ml-6 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="audio-format">Formato de audio</Label>
            <Select
              value={value.audio_output_format ?? "mp3"}
              onValueChange={(v) => update({ audio_output_format: v })}
            >
              <SelectTrigger id="audio-format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIO_OUTPUT_FORMATS_SLIM.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="audio-bitrate">Bitrate de audio</Label>
            <Select
              value={value.audio_bitrate ?? "192k"}
              onValueChange={(v) => update({ audio_bitrate: v })}
            >
              <SelectTrigger id="audio-bitrate" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIO_BITRATE_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Switch
          id="remove-audio"
          checked={value.remove_audio ?? false}
          onCheckedChange={(checked) => update({ remove_audio: checked })}
        />
        <Label htmlFor="remove-audio">Eliminar audio</Label>
      </div>
    </div>
  );
}
