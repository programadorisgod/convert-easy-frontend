## Exploration: POST /api/v1/process/audio Integration

### Current State

The frontend currently handles audio files (mp3, wav, flac, aac, ogg, m4a) through **three paths** — all of which route to the WRONG backend endpoint:

1. **Audio format conversion** (e.g., audio-to-mp3, audio-to-flac): Uses `convertFile()` in `action-executor.tsx` line 79 → creates job → uploads → calls `startConversion()` (generic endpoint). This bypasses the audio processing pipeline entirely.

2. **Audio trimming** (`trim-audio` tool): Calls `executeTrim()` in `action-executor.tsx` line 378 → calls `processPdfFile(..., "trim", ...)` — hits `/api/v1/process/pdf/trim` instead of `/api/v1/process/audio`.

3. **Audio normalization** (`normalize-audio` tool): Calls `executeNormalize()` in `action-executor.tsx` line 420 → calls `processPdfFile(..., "normalize", ...)` — hits `/api/v1/process/pdf/normalize` instead of `/api/v1/process/audio`.

4. **Audio extraction from video** (`extract-audio` tool): Calls `executeAudioExtract()` in `action-executor.tsx` line 336 → calls `processPdfFile(..., "extract-audio", ...)` — hits `/api/v1/process/pdf/extract-audio` instead of `/api/v1/process/audio`.

The **editor sidebar** (`action-sidebar.tsx`) uses `handleConvert()` for audio format conversion — calls `convertFile()` generically, offers a plain format list dialog with **no audio-specific options** (bitrate, sample_rate, channels).

The **conversion page** (`conversion-page.tsx`) and **tool page** (`tool-page.tsx`) both delegate to `executeAction()` in `action-executor.tsx`, which inherits all the routing problems above.

The **config layer** (`conversion-config.ts`, `file-actions.ts`) is actually **correct** — audio conversion configs and tool configs are properly defined. The problem is exclusively in the **execution/routing layer**.

### Affected Areas

- `types/api.ts` — Missing `ProcessAudioRequest`, `ProcessAudioResponse`, `AudioConfig` types
- `lib/api-service.ts` — Missing `processAudio()` function and `processAudioFile()` convenience flow. `PdfOperationRoute` incorrectly includes `"extract-audio" | "trim" | "normalize"`
- `components/convert/action-executor.tsx` — `executeConversion()`, `executeAudioExtract()`, `executeTrim()`, `executeNormalize()` all use wrong endpoints
- `components/editor/action-sidebar.tsx` — `handleConvert()` uses `convertFile()` for audio, no audio options dialog
- `components/convert/conversion-page.tsx` — No audio-specific param collection before calling `executeAction()`
- `components/convert/tool-page.tsx` — Audio tools (trim, normalize) route through wrong executors

### Approaches

1. **Minimal patch — route to `/api/v1/process/audio` with hardcoded defaults**
   - Add types, API function, re-route executors. No UI for optional params.
   - Pros: Fastest path, unblocks the integration
   - Cons: Users can't control bitrate/sample_rate/channels
   - Effort: Low

2. **Full integration — types + API + routing + audio options UI**
   - Add all types, `processAudio()`, `processAudioFile()`, re-route executors, add `AudioOptions` component, wire it into editor dialog and conversion page
   - Pros: Complete feature parity with the backend, users control quality
   - Cons: More files changed, higher complexity
   - Effort: Medium

3. **Hybrid — full integration with minimal UI surface**
   - Same as (2) but defaults for bitrate/sample_rate/channels stored in constants; only expose options in the editor dialog (where users expect fine control), keep conversion-page auto-defaulted
   - Pros: Power users get controls in editor, quick conversions stay simple
   - Cons: Slightly inconsistent UX between editor and conversion page if rationale isn't documented
   - Effort: Medium

### Recommendation

**Approach 2 (Full integration)** — the plan already discussed with the user is solid and balanced. The optional params are meaningful (bitrate for MP3 quality, sample rate for compatibility, channels for mono/stereo), so exposing them in the UI adds real value. Follow the existing pattern from image processing (`processImageFile`, `CompressImageDialog`, etc.) to keep the codebase consistent.

### Specific File Changes Required

1. **`types/api.ts`** — Add:
   - `AudioConfig` interface (output_format, bitrate?, sample_rate?, channels?, trim_start?, trim_duration?, normalize_volume?)
   - `ProcessAudioRequest` interface (job_id, output_format, bitrate?, sample_rate?, channels?, trim_start?, trim_duration?, normalize_volume?)
   - `ProcessAudioResponse` interface (job_id, status, message, audio_config?: AudioConfig)

2. **`lib/api-service.ts`** — Add:
   - `processAudio(request: ProcessAudioRequest): Promise<ProcessAudioResponse>` — POST to `/api/v1/process/audio`
   - `processAudioFile(file, inputFormat, outputFormat, params?, onProgress?): Promise<string>` — createJob → uploadFile → processAudio → return job_id

3. **`lib/audio-constants.ts`** (new file) — Add:
   - Export `AUDIO_DEFAULTS` and `AUDIO_OPTIONS` for bitrate presets, sample rates, channel options
   - Default: sample_rate=44100, channels=2

4. **`components/convert/action-executor.tsx`** — Refactor:
   - `executeConversion()`: route audio category to `processAudioFile()` instead of `convertFile()`
   - `executeAudioExtract()`: route to `processAudioFile()` instead of `processPdfFile()`
   - `executeTrim()`: route to `processAudioFile()` with `trim_start`/`trim_duration` params
   - `executeNormalize()`: route to `processAudioFile()` with `normalize_volume: true`

5. **`components/convert/audio-options.tsx`** (new component) — Create:
   - Reusable `AudioOptions` component with bitrate, sample_rate, channels selectors
   - Follow pattern from image compress/watermark dialogs (RadioGroup, Slider)

6. **`components/editor/action-sidebar.tsx`** — Update:
   - Integrate `AudioOptions` into the convert dialog for audio category
   - Wire audio options state into `handleConvert()` for audio files
   - `handleActionClick()`: add audio-specific handlers for trim/normalize/extract-audio

7. **`components/convert/conversion-page.tsx`** — Update:
   - Add audio options section when `config.category === "audio"` (only for multi-param conversions)
   - Pass params through `executeAction()`

### Risks

- The backend's 202 Accepted response means we must poll for completion — the frontend already has `pollJobStatus()`, so this is a handled pattern
- Audio files can be large — the existing chunked upload path covers this (triggered at >10MB)
- The `extract-audio` tool currently routes video files through `processPdfFile("extract-audio")` — need to verify whether that should stay as PDF extraction or move to the new audio endpoint. Given the backend has `POST /process/audio`, extraction from video likely belongs to a different endpoint. **This needs clarification** — the backend may not support video→audio extraction via the audio endpoint.
- `trim_start` format (HH:MM:SS) needs input parsing/validation in the UI
- `trim_duration` needs to be validated as positive number

### Clarification Needed for extract-audio

The `extract-audio` tool takes video files (mp4, avi, mov, mkv, webm) and extracts the audio track — it's NOT an audio-to-audio operation. This likely stays on a different backend endpoint. The proposal phase should decide whether to:
- (a) Keep it on the PDF endpoint (current, wrong for video)
- (b) Move it to a hypothetical `/api/v1/process/video/extract-audio` endpoint
- (c) Repurpose `/api/v1/process/audio` to accept video source files

### Ready for Proposal
Yes — the exploration is complete and the orchestrator has enough context to proceed. The clarification on extract-audio should be addressed during proposal.

### Risks
- extract-audio use case needs backend clarification
- Editor dialog already large (2194 lines) — adding audio options will grow it further; consider extracting audio dialog into its own component
- No tests exist to validate the routing changes
