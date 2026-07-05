# Design: Video Processing Integration

## Technical Approach

Mirror `processAudioFile` pattern for video. Add `processVideo()` POST to `/api/v1/process/video` and `processVideoFile()` composite flow. Create `VideoOptions` component with CRF slider, resolution input, FPS select, trim fields, audio controls. Wire into editor, conversion-page, and tool-page.

## Architecture Decisions

### Decision: Mirror processAudioFile pattern

| Alternative | Tradeoff |
|---|---|
| Inline fetch calls per executor | Duplicates upload/start logic across three+ executors |
| Shared `convertFile()` with video flag | Would couple video-specific params into generic flow |
| **`processVideoFile()` composite** ✅ | Mirror of `processAudioFile` — consistent, testable, minimal diff |

### Decision: VideoOptions as standalone component

Same reasoning as AudioOptions — the editor sidebar is already large. VideoOptions extracted for reuse across editor dialog, conversion-page, and tool-page.

### Decision: Fix extract-audio to use video endpoint

The current `executeAudioExtract()` calls `processPdfFile()` with PDF operation names (a hack). Now that `/api/v1/process/video` supports `extract_audio`, route it there instead. Remove the PDF hack.

## Data Flow

```
User fills options (VideoOptions)
       │
       ▼
executeAction() / executeConversion() / executeTrim()
       │
       ▼  if category === "video"
processVideoFile(file, inputFormat, outputFormat, params)
       │
       ├── createJob({ input_format, output_formats, ... })
       ├── uploadFile(file, jobId, onProgress)
       └── processVideo({ job_id, output_format, ...params })
              │
              ▼
       pollJobStatus(jobId) → downloadResult(jobId, outputFormat)
```

## File Changes

| File | Action | What |
|---|---|---|
| `lib/video-constants.ts` | Create | `VIDEO_INPUT_FORMATS`, `VIDEO_OUTPUT_FORMATS`, `VIDEO_DEFAULTS`, `CRF_RANGE`, `RESOLUTION_PRESETS`, `FPS_OPTIONS`, `AUDIO_OUTPUT_FORMATS_SLIM`, `AUDIO_BITRATE_OPTIONS` |
| `types/api.ts` | Modify | Add `VideoConfig`, `ProcessVideoRequest`, `ProcessVideoResponse` |
| `lib/api-service.ts` | Modify | Add `processVideo()` POST, `processVideoFile()` composite flow |
| `components/video/video-options.tsx` | Create | CRF slider, resolution input, FPS select, trim fields, extract_audio toggle, remove_audio toggle, conditional audio format/bitrate |
| `components/convert/action-executor.tsx` | Modify | Route video conversions + trim to `processVideoFile()`, fix `executeAudioExtract()` |
| `components/editor/action-sidebar.tsx` | Modify | VideoOptions in convert dialog for video |
| `components/convert/conversion-page.tsx` | Modify | VideoOptions when category === "video" |
| `components/convert/tool-page.tsx` | Modify | Trim fields + VideoOptions for trim-video |
| `lib/file-actions.ts` | Modify | Expand `CONVERSION_OPTIONS.video` with all 8 output formats |

## Interfaces / Contracts

```typescript
// types/api.ts additions
export interface VideoConfig {
  output_format: string
  crf?: number              // 0-51, lower = better
  resolution?: string       // "WIDTH:HEIGHT"
  fps?: number              // 24, 30, 60
  trim_start?: string       // "HH:MM:SS"
  trim_duration?: number    // seconds
  extract_audio?: boolean
  audio_output_format?: string
  audio_bitrate?: string
  remove_audio?: boolean
}

export interface ProcessVideoRequest {
  job_id: string
  output_format: string
  crf?: number
  resolution?: string
  fps?: number
  trim_start?: string
  trim_duration?: number
  extract_audio?: boolean
  audio_output_format?: string
  audio_bitrate?: string
  remove_audio?: boolean
}

export interface ProcessVideoResponse {
  job_id: string
  status: JobStatus
  message: string
  video_config?: VideoConfig
}
```

```typescript
// lib/video-constants.ts
export const VIDEO_INPUT_FORMATS = ["mp4", "mkv", "mov", "avi", "webm", "flv", "wmv", "mpeg", "3gp", "m4v"] as const
export const VIDEO_OUTPUT_FORMATS = ["mp4", "mkv", "mov", "avi", "webm", "flv", "mpeg", "m4v"] as const
export const VIDEO_DEFAULTS = { crf: 23, fps: 30 } as const
export const CRF_RANGE = { min: 0, max: 51, step: 1 } as const
export const RESOLUTION_PRESETS = [
  { value: "1920:1080", label: "1080p (Full HD)" },
  { value: "1280:720", label: "720p (HD)" },
  { value: "854:480", label: "480p (SD)" },
  { value: "640:360", label: "360p" },
  { value: "-1:1080", label: "1080p altura automática" },
  { value: "-1:720", label: "720p altura automática" },
  { value: "-1:480", label: "480p altura automática" },
] as const
export const FPS_OPTIONS = [24, 25, 30, 50, 60] as const
export const AUDIO_OUTPUT_FORMATS_SLIM = ["mp3", "aac", "flac", "ogg", "opus", "m4a"] as const
export const AUDIO_BITRATE_OPTIONS = ["128k", "192k", "256k", "320k"] as const
```

## Validation Rules

| Rule | Where | Behavior |
|---|---|---|
| output_format ≠ input format | action-executor | Show error toast, block execution |
| extract_audio + remove_audio | action-executor | Show error toast, block execution |
| extract_audio + crf/resolution/fps | VideoOptions | Disable CRF/resolution/FPS when extract_audio checked |
| trim_start format (HH:MM:SS) | tool-page (trim) | Regex `/^\d{1,2}:\d{2}:\d{2}$/` |
| Resolution format (WIDTH:HEIGHT) | VideoOptions | Regex `/^-?\d+:-?\d+$/` |

## Implementation Notes

- **`processVideoFile`** mirrors `processAudioFile` signature exactly: `(file, inputFormat, outputFormat, params?, onProgress?) → Promise<string>`
- **`extract-audio`** removal: the action was using `processPdfFile({ operation: "extract-audio" })` — this becomes `processVideoFile(file, input, "mp3", { extract_audio: true, audio_output_format: "mp3" })`
- **Output format auto-default**: for extract-audio, output_format can default to "mp3" since the result is audio

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Manual | processVideoFile() flow | createJob → upload → processVideo round trip |
| Manual | extract_audio/remove_audio validation | Toggle both, verify rejection |
| Manual | VideoOptions rendering | Check all three surfaces (editor, conversion-page, tool-page) |
