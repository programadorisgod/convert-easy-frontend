"use client";

import {
  AUDIO_DEFAULTS,
  BITRATE_OPTIONS,
  SAMPLE_RATE_OPTIONS,
  CHANNEL_OPTIONS,
} from "@/lib/audio-constants";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AudioParams {
  bitrate?: string
  sample_rate?: number
  channels?: number
  trim_start?: string
  trim_duration?: number
  normalize_volume?: boolean
}

interface AudioOptionsProps {
  value: AudioParams
  onChange: (params: AudioParams) => void
}

export function AudioOptions({ value, onChange }: AudioOptionsProps) {
  const update = (partial: Partial<AudioParams>) =>
    onChange({ ...value, ...partial })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Bitrate</Label>
        <Select
          value={value.bitrate ?? ""}
          onValueChange={(v) => update({ bitrate: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={value.bitrate || "Default"} />
          </SelectTrigger>
          <SelectContent>
            {BITRATE_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Sample Rate</Label>
        <Select
          value={value.sample_rate?.toString() ?? ""}
          onValueChange={(v) =>
            update({ sample_rate: v ? Number(v) : undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                value.sample_rate
                  ? `${value.sample_rate} Hz`
                  : `${AUDIO_DEFAULTS.sampleRate} Hz`
              }
            />
          </SelectTrigger>
          <SelectContent>
            {SAMPLE_RATE_OPTIONS.map((sr) => (
              <SelectItem key={sr} value={sr.toString()}>
                {sr} Hz
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Channels</Label>
        <Select
          value={value.channels?.toString() ?? ""}
          onValueChange={(v) =>
            update({ channels: v ? (Number(v) as 1 | 2) : undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                value.channels
                  ? CHANNEL_OPTIONS.find((c) => c.value === value.channels)
                      ?.label
                  : "Default"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value.toString()}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
