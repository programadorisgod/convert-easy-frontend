# Design: Audio Conversion Integration

## Technical Approach

Reroute all audio operations (convert, trim, normalize) from generic/PDF endpoints to `POST /api/v1/process/audio`. Follow the existing `processImageFile()` composite pattern: createJob → uploadFile → processAudio → pollJobStatus. Add `AudioOptions` component for bitrate/sample_rate/channels controls, wired into editor, conversion-page, and tool-page.

## Architecture Decisions

### Decision: Follow `processImageFile` pattern for `processAudioFile`

| Alternative | Tradeoff |
|---|---|
| Inline fetch calls per executor | Duplicates upload/start logic across three executors |
| Shared `convertFile()` with audio flag | Would couple audio params into generic flow |
| **`processAudioFile()` composite** ✅ | Mirror of `processImageFile()` — consistent, testable, minimal diff |

### Decision: AudioOptions as standalone component

The editor sidebar is already 2194 lines. Embedding audio param UI inline would make it worse. `AudioOptions` as an extracted component is reusable across editor dialog, conversion-page, and tool-page.

### Decision: extract-audio stays on PDF endpoint

`extract-audio` takes video files (mp4/mov/etc.) — not audio-to-audio. The backend doesn't support video sourcing on `/api/v1/process/audio`. Kept as-is with a `// ponytail:` comment noting deferred migration.

## Data Flow

```
User fills options (AudioOptions)
       │
       ▼
executeAction() / executeConversion() / executeTrim() / executeNormalize()
       │
       ▼  if category === "audio"
processAudioFile(file, inputFormat, outputFormat, params)
       │
       ├── createJob({ input_format, output_formats, ... })
       ├── uploadFile(file, jobId, onProgress)
       └── processAudio({ job_id, output_format, ...params })
              │
              ▼
       pollJobStatus(jobId) → downloadResult(jobId, outputFormat)
```

## File Changes

| File | Action | What |
|---|---|---|
| `lib/audio-constants.ts` | Create | `AUDIO_OUTPUT_FORMATS`, `AUDIO_DEFAULTS`, `BITRATE_PRESETS`, `SAMPLE_RATE_OPTIONS`, `CHANNEL_OPTIONS` |
| `types/api.ts` | Modify | Add `AudioConfig`, `ProcessAudioRequest`, `ProcessAudioResponse` |
| `lib/api-service.ts` | Modify | Add `processAudio()` POST, `processAudioFile()` composite flow |
| `components/convert/action-executor.tsx` | Modify | Route audio→`processAudioFile()` in executeConversion, executeTrim, executeNormalize |
| `components/convert/audio-options.tsx` | Create | Reusable bitrate/sample_rate/channels form |
| `components/editor/action-sidebar.tsx` | Modify | AudioOptions in convert dialog for audio category |
| `components/convert/conversion-page.tsx` | Modify | AudioOptions block when `category === "audio"` |
| `components/convert/tool-page.tsx` | Modify | Trim_start/trim_duration + AudioOptions for trim-audio; AudioOptions for normalize-audio |

## Interfaces / Contracts

```typescript
// types/api.ts additions
export interface AudioConfig {
  output_format: string
  bitrate?: string       // "128k" | "192k" | "256k" | "320k"
  sample_rate?: number   // 22050 | 44100 | 48000
  channels?: number      // 1 | 2
  trim_start?: string    // "HH:MM:SS"
  trim_duration?: number // seconds
  normalize_volume?: boolean
}

export interface ProcessAudioRequest {
  job_id: string
  output_format: string
  bitrate?: string
  sample_rate?: number
  channels?: number
  trim_start?: string
  trim_duration?: number
  normalize_volume?: boolean
}

export interface ProcessAudioResponse {
  job_id: string
  status: JobStatus
  message: string
  audio_config?: AudioConfig
}

// lib/audio-constants.ts
export const AUDIO_OUTPUT_FORMATS = ["mp3", "wav", "aac", "m4a", "flac", "ogg", "opus"] as const
export const AUDIO_DEFAULTS = { sampleRate: 44100, channels: 2, normalizeVolume: false }
export const BITRATE_PRESETS = ["128k", "192k", "256k", "320k"] as const
export const SAMPLE_RATE_OPTIONS = [22050, 44100, 48000] as const
export const CHANNEL_OPTIONS = [{ value: 1, label: "Mono" }, { value: 2, label: "Stereo" }] as const
```

## Implementation Notes

- **`trim_start` validation**: accept HH:MM:SS string, validate with `/^\d{1,2}:\d{2}:\d{2}$/`
- **`processAudioFile` signature**: `(file, inputFormat, outputFormat, params?: AudioParams, onProgress?) → Promise<string>` — mirrors `processImageFile`
- **`AudioParams` interface** in action-executor.tsx: `{ bitrate?, sample_rate?, channels?, trim_start?, trim_duration?, normalize_volume? }`
- **Backward compat**: `convertFile()` and `processPdfFile()` unchanged — audio simply bypasses them via category check
- **Defaults applied server-side** per backend spec; frontend sends only what the user explicitly picked

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit | `parseTrimStart()` validation | Pure function regex test (manual, no runner) |
| Integration | `processAudioFile()` flow | Manual — createJob → upload → processAudio round trip |
| E2E | Audio conversion→download | Manual via browser until Playwright is set up |

## Migration / Rollout

No migration required. Old routing code stays intact but inactive for audio — revert by removing `category === "audio"` checks in executors.

## Open Questions

- [ ] Backend `AUDIO_OUTPUT_FORMATS` — verify `opus` and `m4a` are supported on `/api/v1/process/audio`
- [ ] `extract-audio` future endpoint — confirmed out of scope, but document as follow-up
