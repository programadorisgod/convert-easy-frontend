# Tasks: Audio Conversion Integration

## Task 1: Create audio constants file

| Field | Value |
|---|---|
| **ID** | `task-01-audio-constants` |
| **Dependencies** | None |
| **Files** | `lib/audio-constants.ts` (new) |

### Description

Create `lib/audio-constants.ts` with all audio parameter defaults and option presets. This eliminates magic strings/numbers from the UI components.

### Content

```typescript
export const AUDIO_OUTPUT_FORMATS = [
  "mp3", "wav", "aac", "m4a", "flac", "ogg", "opus",
] as const

export const AUDIO_DEFAULTS = {
  sampleRate: 44100,
  channels: 2,
  normalizeVolume: false,
} as const

export const BITRATE_PRESETS = [
  "128k", "192k", "256k", "320k",
] as const

export const SAMPLE_RATE_PRESETS = [
  22050, 44100, 48000,
] as const

export interface ChannelOption {
  value: 1 | 2
  label: string
}

export const CHANNEL_OPTIONS: ChannelOption[] = [
  { value: 1, label: "Mono" },
  { value: 2, label: "Stereo" },
] as const
```

### Acceptance Criteria

- [ ] All exports exist with correct values
- [ ] No magic strings/numbers in audio UI code
- [ ] TypeScript compiles without errors

---

## Task 2: Add audio API types

| Field | Value |
|---|---|
| **ID** | `task-02-audio-types` |
| **Dependencies** | None |
| **Files** | `types/api.ts` (modify) |

### Description

Add `AudioConfig`, `ProcessAudioRequest`, and `ProcessAudioResponse` interfaces to `types/api.ts`.

### Acceptance Criteria

- [ ] `AudioConfig` includes all optional and required audio params
- [ ] `ProcessAudioRequest` matches the backend contract (job_id + output_format required, rest optional)
- [ ] `ProcessAudioResponse` includes job_id, status, message, audio_config
- [ ] TypeScript compiles without errors

---

## Task 3: Add processAudio API functions

| Field | Value |
|---|---|
| **ID** | `task-03-process-audio-service` |
| **Dependencies** | task-02-audio-types |
| **Files** | `lib/api-service.ts` (modify) |

### Description

Add two functions to `lib/api-service.ts` following the existing pattern of `processImageFile()` / `processPdfFile()`:

1. `processAudio(request: ProcessAudioRequest): Promise<ProcessAudioResponse>` — POST to `/api/v1/process/audio`
2. `processAudioFile(file: File, inputFormat: string, outputFormat: string, params?: AudioParams, onProgress?: (stage, progress) => void): Promise<string>` — composite flow: createJob → uploadFile → processAudio → returns job_id

### Acceptance Criteria

- [ ] `processAudio()` POSTs to correct endpoint with correct headers
- [ ] `processAudio()` returns typed response on success
- [ ] `processAudioFile()` mirrors `processImageFile()` pattern
- [ ] Progress callback fires for "uploading" and "processing" stages
- [ ] TypeScript compiles without errors

---

## Task 4: Create AudioOptions component

| Field | Value |
|---|---|
| **ID** | `task-04-audio-options-component` |
| **Dependencies** | task-01-audio-constants |
| **Files** | `components/audio/audio-options.tsx` (new) |

### Description

Create a reusable `AudioOptions` component with:
- Bitrate select (128k / 192k / 256k / 320k)
- Sample rate select (22050 / 44100 / 48000)
- Channels toggle (Mono / Stereo)
- Props: `value: AudioParams`, `onChange: (params: AudioParams) => void`

Style matches the existing shadcn/ui patterns (Label, Select, RadioGroup).

### Acceptance Criteria

- [ ] All three audio param groups render
- [ ] Each selector pre-selects the default value
- [ ] onChange fires with updated params
- [ ] Matches existing shadcn/ui styling
- [ ] TypeScript compiles without errors

---

## Task 5: Route audio operations in action-executor

| Field | Value |
|---|---|
| **ID** | `task-05-audio-executor-routing` |
| **Dependencies** | task-03-process-audio-service, task-04-audio-options-component |
| **Files** | `components/convert/action-executor.tsx` (modify) |

### Description

Refactor `executeConversion()`, `executeTrim()`, and `executeNormalize()` in `components/convert/action-executor.tsx`:

- `executeConversion()`: when `config.category === "audio"`, call `processAudioFile()` with audio params instead of `convertFile()`
- `executeTrim()`: when `config.category === "audio"`, call `processAudioFile()` with `trim_start` + `trim_duration` + audio params
- `executeNormalize()`: when `config.category === "audio"`, call `processAudioFile()` with `normalize_volume: true` + audio params
- Define `AudioParams` interface for the params shape
- `extract-audio` (video→audio) remains unchanged with a `// ponytail:` comment

### Acceptance Criteria

- [ ] Audio conversion hits `processAudioFile()`, not `convertFile()`
- [ ] Trim sends trim_start + trim_duration to audio endpoint
- [ ] Normalize sends normalize_volume: true
- [ ] extract-audio unchanged with deferral comment
- [ ] TypeScript compiles without errors

---

## Task 6: Wire audio options into editor action-sidebar

| Field | Value |
|---|---|
| **ID** | `task-06-editor-audio-options` |
| **Dependencies** | task-04-audio-options-component, task-05-audio-executor-routing |
| **Files** | `components/editor/action-sidebar.tsx` (modify) |

### Description

Extend the convert dialog in the editor sidebar for audio files:
- When `category === "audio"`, render `<AudioOptions>` below the format selector
- Pass selected params through to the conversion flow
- For trim action on audio: show trim_start (time input) + trim_duration (number input) + AudioOptions
- For normalize action on audio: use AudioOptions (bitrate/sample_rate/channels still apply)

### Acceptance Criteria

- [ ] AudioOptions renders in convert dialog for audio files
- [ ] Selected params are passed to conversion
- [ ] Trim action shows time inputs + AudioOptions
- [ ] Normalize action shows AudioOptions
- [ ] TypeScript compiles without errors

---

## Task 7: Wire audio options into conversion-page

| Field | Value |
|---|---|
| **ID** | `task-07-conversion-page-audio-options` |
| **Dependencies** | task-04-audio-options-component, task-05-audio-executor-routing |
| **Files** | `components/convert/conversion-page.tsx` (modify) |

### Description

When `config.category === "audio"`, show `<AudioOptions>` in the file-selected state (after file is picked, before conversion). Pass the collected params to `executeAction()`.

### Acceptance Criteria

- [ ] AudioOptions renders after file selection for audio routes
- [ ] Params are passed through to executeAction → processAudioFile
- [ ] TypeScript compiles without errors

---

## Task 8: Wire audio options into tool-page

| Field | Value |
|---|---|
| **ID** | `task-08-tool-page-audio-options` |
| **Dependencies** | task-04-audio-options-component, task-05-audio-executor-routing |
| **Files** | `components/convert/tool-page.tsx` (modify) |

### Description

For `trim-audio` tool: show trim_start (HH:MM:SS input) + trim_duration (seconds number input) + AudioOptions in the file-selected state.
For `normalize-audio` tool: show AudioOptions (bitrate/sample_rate/channels) in the file-selected state.

### Acceptance Criteria

- [ ] trim-audio shows time inputs + AudioOptions
- [ ] normalize-audio shows AudioOptions
- [ ] Params passed through to executeAction
- [ ] TypeScript compiles without errors

---

## Dependencies Graph

```
task-01 ──────────────────────────────────────────┐
                                                    ├── task-04 ──┬── task-06
task-02 ── task-03 ── task-05 ──────────────────────┘             ├── task-07
                                                                   └── task-08
```

Ordered execution: 1 → 2 → 3 → 4 → 5 → 6,7,8 (6,7,8 can run in parallel after 5)

## Review Workload Forecast

| Task | Est. Lines Changed | Risk |
|---|---|---|
| task-01 (constants) | ~25 new | Low |
| task-02 (types) | ~25 new | Low |
| task-03 (api-service) | ~60 new | Low |
| task-04 (AudioOptions) | ~80 new | Low |
| task-05 (executor routing) | ~80 modified | Medium — routing logic |
| task-06 (editor sidebar) | ~50 modified | Medium — long file |
| task-07 (conversion-page) | ~30 modified | Low |
| task-08 (tool-page) | ~40 modified | Low |
| **Total** | **~390 lines** | **Under 800 budget** ✅ |

Decision: Single PR is fine. No chaining needed.
