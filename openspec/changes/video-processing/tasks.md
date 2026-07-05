# Tasks: Video Processing Integration

## Task 1: Create video constants file

| Field | Value |
|---|---|
| **ID** | `task-01-video-constants` |
| **Dependencies** | None |
| **Files** | `lib/video-constants.ts` (new) |

### Description

Create `lib/video-constants.ts` with all video parameter defaults and option presets.

### Content

```typescript
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

### Acceptance Criteria

- [ ] All exports exist with correct values
- [ ] TypeScript compiles without errors

---

## Task 2: Add video API types

| Field | Value |
|---|---|
| **ID** | `task-02-video-types` |
| **Dependencies** | None |
| **Files** | `types/api.ts` (modify) |

### Description

Add `VideoConfig`, `ProcessVideoRequest`, and `ProcessVideoResponse` interfaces.

### Acceptance Criteria

- [ ] `VideoConfig` includes all optional and required video params
- [ ] `ProcessVideoRequest` matches the backend contract
- [ ] `ProcessVideoResponse` includes job_id, status, message, video_config
- [ ] TypeScript compiles without errors

---

## Task 3: Add processVideo API functions

| Field | Value |
|---|---|
| **ID** | `task-03-process-video-service` |
| **Dependencies** | task-02-video-types |
| **Files** | `lib/api-service.ts` (modify) |

### Description

Add `processVideo()` POST to `/api/v1/process/video` and `processVideoFile()` composite flow mirroring `processAudioFile`.

### Acceptance Criteria

- [ ] `processVideo()` POSTs to correct endpoint
- [ ] `processVideoFile()` mirrors `processAudioFile()` pattern: createJob → uploadFile → processVideo
- [ ] Progress callback fires for "uploading" and "processing" stages
- [ ] TypeScript compiles without errors

---

## Task 4: Create VideoOptions component

| Field | Value |
|---|---|
| **ID** | `task-04-video-options-component` |
| **Dependencies** | task-01-video-constants |
| **Files** | `components/video/video-options.tsx` (new) |

### Description

Create `VideoOptions` with:
- CRF slider (0-51, default 23)
- Resolution presets select + custom text input
- FPS select (24/25/30/50/60)
- Extract audio toggle → conditional audio format + bitrate selects
- Remove audio toggle
- CRF/resolution/fps disabled when extract_audio checked
- Resolution regex validation `/^-?\d+:-?\d+$/`

### Acceptance Criteria

- [ ] All control groups render
- [ ] extract_audio disables CRF/resolution/FPS
- [ ] audio_output_format/bitrate appear when extract_audio checked
- [ ] Resolution validates WIDTH:HEIGHT format
- [ ] TypeScript compiles without errors

---

## Task 5: Route video operations in action-executor

| Field | Value |
|---|---|
| **ID** | `task-05-video-executor-routing` |
| **Dependencies** | task-03-process-video-service, task-04-video-options-component |
| **Files** | `components/convert/action-executor.tsx` (modify) |

### Description

- `executeConversion()`: when `config.category === "video"`, call `processVideoFile()` with video params
- `executeTrim()`: when video, call `processVideoFile()` with `trim_start` + `trim_duration` + video params
- `executeAudioExtract()`: REPLACE current `processPdfFile()` hack with `processVideoFile()` + `extract_audio: true`
- Validate: output_format ≠ input format, extract_audio + remove_audio not both true
- Define `VideoParams` interface

### Acceptance Criteria

- [ ] Video conversion hits `processVideoFile()`, not `convertFile()`
- [ ] Trim uses `processVideoFile()` for video
- [ ] extract-audio uses video endpoint, not PDF hack
- [ ] Validation rejects same format input/output
- [ ] Validation rejects extract_audio + remove_audio combo
- [ ] TypeScript compiles without errors

---

## Task 6: Wire VideoOptions into editor action-sidebar

| Field | Value |
|---|---|
| **ID** | `task-06-editor-video-options` |
| **Dependencies** | task-04-video-options-component, task-05-video-executor-routing |
| **Files** | `components/editor/action-sidebar.tsx` (modify) |

### Description

In the convert dialog section, when category === "video", render `<VideoOptions>` below the format selector. Wire params through.

### Acceptance Criteria

- [ ] VideoOptions renders in convert dialog for video
- [ ] Params passed to conversion flow
- [ ] TypeScript compiles without errors

---

## Task 7: Wire VideoOptions into conversion-page

| Field | Value |
|---|---|
| **ID** | `task-07-conversion-page-video-options` |
| **Dependencies** | task-04-video-options-component, task-05-video-executor-routing |
| **Files** | `components/convert/conversion-page.tsx` (modify) |

### Description

When `config.category === "video"`, show `<VideoOptions>` in file-selected state.

### Acceptance Criteria

- [ ] VideoOptions renders for video routes
- [ ] Params passed to executeAction
- [ ] TypeScript compiles without errors

---

## Task 8: Wire VideoOptions into tool-page

| Field | Value |
|---|---|
| **ID** | `task-08-tool-page-video-options` |
| **Dependencies** | task-04-video-options-component, task-05-video-executor-routing |
| **Files** | `components/convert/tool-page.tsx` (modify) |

### Description

For trim-video (config.type === "trim" && video): show trim_start + trim_duration + VideoOptions in file-selected state.

### Acceptance Criteria

- [ ] Trim fields + VideoOptions render for trim-video
- [ ] Params passed to executeAction
- [ ] TypeScript compiles without errors

---

## Dependencies Graph

```
task-01 ──────────────────────────────────────────┐
                                                    ├── task-04 ──┬── task-06
task-02 ── task-03 ── task-05 ──────────────────────┘             ├── task-07
                                                                   └── task-08
```

## Review Workload Forecast

| Task | Est. Lines | Risk |
|---|---|---|
| task-01 (constants) | ~30 new | Low |
| task-02 (types) | ~35 new | Low |
| task-03 (api-service) | ~65 new | Low |
| task-04 (VideoOptions) | ~200 new | Medium — complex conditional UI |
| task-05 (executor routing) | ~100 modified | Medium — validation logic |
| task-06 (editor sidebar) | ~50 modified | Low |
| task-07 (conversion-page) | ~30 modified | Low |
| task-08 (tool-page) | ~40 modified | Low |
| **Total** | **~550 lines** | **Under 800 budget** ✅ |

Decision: Single PR.
