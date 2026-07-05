## Exploration: Video Processing Endpoint (POST /api/v1/process/video)

### Current State

The frontend has **no dedicated video processing pipeline**. Video operations fall through to either:

1. **Generic `convertFile()`** (action-executor.tsx:121-133) — uses the old createJob/startConversion flow, same as documents/images
2. **PDF route hijacking** (action-executor.tsx:373-406, 456-478) — `executeAudioExtract` and `executeTrim` for video call `processPdfFile()` with PDF operations like `"extract-audio"` and `"trim"`, sending video files through the PDF pipeline with a `ponytail:` comment acknowledging it's temporary
3. **Default toast** (action-sidebar.tsx:675-685) — video actions like `trim`, `extract-audio` hit the fallback "available soon" toast

Video conversion slugs exist in `conversion-config.ts` (`video-to-mp4`, `video-to-mkv`, `video-to-webm`) but they're wired to the generic `convertFile()` path, not a dedicated endpoint.

### Affected Areas

| File | What Changes |
|------|-------------|
| `types/api.ts` | Add `ProcessVideoRequest` / `ProcessVideoResponse` / `VideoConfig` types |
| `lib/api-service.ts` | Add `processVideo()` and `processVideoFile()` mirroring audio pattern |
| `lib/conversion-config.ts` | Add `video-to-mov`, `video-to-avi`, `video-to-webm` (complete slug coverage), update `extract-audio`/`trim-video` ToolConfig `outputFormat` defaults |
| `lib/file-actions.ts` | Extend `CONVERSION_OPTIONS.video` with flv, mpeg, m4v (currently only mp4/mkv/webm/avi/mov) |
| `lib/video-constants.ts` | **NEW** — CRF range (0-51), resolution presets, FPS options, audio bitrate options for extract |
| `components/video/video-options.tsx` | **NEW** — Options component (CRF slider, resolution input, trim fields, extract-audio toggle) |
| `components/convert/action-executor.tsx` | Route `video` category conversion to `processVideoFile()`, route `trim`/`extract-audio` for video to new endpoint |
| `components/convert/conversion-page.tsx` | Show `VideoOptions` when category is `video` (line ~394 area) |
| `components/convert/tool-page.tsx` | Show trim params AND `VideoOptions` when video trim/extract (lines ~377-401 area) |
| `components/editor/action-sidebar.tsx` | Wire `handleActionClick` for `trim` (video), `extract-audio` (line ~674 fallback) |
| `components/convert/pages-router.tsx` | **CHECK** — how tool/conversion pages are resolved from slugs |

### New Files

1. **`lib/video-constants.ts`** — constants mirroring `lib/audio-constants.ts`:
   - `VIDEO_OUTPUT_FORMATS` — the 8 output formats from spec
   - `VIDEO_INPUT_FORMATS` — the 10 input formats from spec
   - `CRF_MIN`, `CRF_MAX`, `CRF_DEFAULT`
   - `RESOLUTION_PRESETS` — e.g. `"640:480"`, `"1280:720"`, `"1920:1080"`, or custom
   - `FPS_OPTIONS` — e.g. `24`, `25`, `30`, `60`
   - `AUDIO_OUTPUT_FORMATS` for extract_audio
   - `AUDIO_BITRATE_OPTIONS` for audio_bitrate

2. **`components/video/video-options.tsx`** — options component mirroring `AudioOptions`:
   - CRF slider/input (0-51)
   - Resolution text input (WIDTH:HEIGHT)
   - FPS select
   - Trim start/duration inputs
   - Extract audio checkbox + audio format + bitrate
   - Remove audio checkbox
   - Conditional mutual-exclusion logic (extract_audio vs crf/res/fps, extract_audio vs remove_audio)

### Key Patterns to Mirror (from audio/image)

1. **`processAudio()` / `processAudioFile()` in api-service.ts** (lines 671-724):
   - `processVideo(request)`: raw fetch to `/api/v1/process/video` → returns `ProcessVideoResponse`
   - `processVideoFile(file, inputFormat, outputFormat, params?, onProgress?)`: createJob → uploadFile → processVideo → return job_id
   - This is EXACTLY the audio pattern, just different URL and request type

2. **ProcessAudioRequest/Response in types/api.ts** (lines 184-199):
   - Same shape: `job_id` + `output_format` + optional params
   - Video needs more fields (crf, resolution, fps, trim_start, trim_duration, extract_audio, etc.)

3. **AudioOptions component pattern** (audio-options.tsx):
   - Controlled component with `value`/`onChange` pattern
   - Uses shadcn Select components
   - Reads constants from `lib/audio-constants.ts`

4. **Conversion page routing** (conversion-page.tsx line 394):
   - `{file?.category === "audio" && <AudioOptions .../>}`
   - Video would add: `{file?.category === "video" && <VideoOptions .../>}`

5. **Tool page param gathering** (tool-page.tsx lines 377-401):
   - For trim: reads `trimStart` + `trimDuration` from inputs + `AudioOptions`
   - Video trim would read same plus `VideoOptions`

### Differences from Audio (more complexity)

| Aspect | Audio | Video |
|--------|-------|-------|
| Params count | 5 optional | ~10 optional |
| Validation rules | None client-side | `output_format != input_format`, `extract_audio` XOR `remove_audio`, `extract_audio` incompatible with crf/res/fps |
| Options component | Simple selects | Slider (CRF), text input (res), conditional sections |
| Mutual exclusion | N/A | `extract_audio` + `remove_audio` can't both be true |
| Param co-dependency | N/A | `extract_audio=true` → also send `audio_output_format`, `audio_bitrate` |
| Trim params | `trim_start` (HH:MM:SS) + `trim_duration` (seconds) | Same but applies to video stream |
| Format constraints | No constraint | Output must differ from input |
| Input formats | 6 | 10 (adds wmv, flv, 3gp, m4v beyond audio range) |
| Output formats | 6 | 8 |

### How `action-executor.tsx` Routing Must Change

Current routing for video:

```
executeConversion() → category === "audio" → processAudioFile()
                  → else → convertFile()  ← video hits THIS
```

Needed:

```
executeConversion() → category === "video" → processVideoFile()
                  → category === "audio" → processAudioFile()
                  → else → convertFile()

executeTool() → case "trim" → config.category === "video" → processVideoFile() with trim params
             → case "extract" → config.category === "video" → processVideoFile() with extract_audio=true
```

The `executeTrim()` and `executeAudioExtract()` functions currently check `config.category === "audio"` for the audio path, then fall to `processPdfFile()` for video. Both need a video branch that calls `processVideoFile()`.

### Conversion Config Updates Needed

The `CONVERSION_CONFIGS` currently has 3 video slugs. Need to add slugs for remaining output formats:

- `video-to-mov` (source: mp4/mkv/avi/webm)
- `video-to-avi` (source: mp4/mkv/mov/webm/flv)

The existing slugs (`video-to-mp4`, `video-to-mkv`, `video-to-webm`) need their `sourceExtensions` updated to include all spec input formats (wmv, flv, 3gp, m4v).

### CONVERSION_OPTIONS.video Updates

Current (file-actions.ts:316-342): mp4, mkv, webm, avi, mov — 5 formats
Need: +flv, +mpeg, +m4v — 8 formats total

### Risks and Unknowns

- **Backend contract unknown**: We're assuming the backend will expose POST `/api/v1/process/video` with the exact signature. If the backend signature differs (e.g., snake_case vs camelCase for some fields), both types and service calls need adjustment.
- **Error responses**: Unknown error detail format for this new endpoint. `handleApiError` handles HTTP-level errors generically, but validation errors (e.g., `extract_audio` + `remove_audio` both true) might return a 422 with a specific detail structure we need to surface.
- **Resolution validation**: The spec says `WIDTH:HEIGHT` format for resolution. Should the frontend validate this pattern client-side, or let the backend reject it? Recommendation: basic regex validation (`^\d+:\d+$`) client-side, backend as authoritative.
- **File size for video**: Videos can be large. The existing `uploadFile()` currently uses `uploadCompleteFile()` (line 362) which sends the whole file in one request. For video files >100MB, this may need chunked upload. The infrastructure exists (`uploadChunk`, `mergeChunks`) but the current `uploadFile()` shortcut bypasses it. This is a pre-existing issue, not specific to video, but video will hit it faster.
- **Pages router impact**: Need to check how slugs map to pages in the pages router to ensure new video conversion slugs resolve correctly. This is referenced as CHECK above.

### Recommendation

Mirror the audio pattern exactly:
1. `types/api.ts`: `ProcessVideoRequest` + `ProcessVideoResponse`
2. `lib/api-service.ts`: `processVideo()` + `processVideoFile()`
3. `lib/video-constants.ts`: constants file
4. `components/video/video-options.tsx`: options component
5. `action-executor.tsx`: route video conversions/tools to new endpoint
6. `conversion-page.tsx` / `tool-page.tsx`: render VideoOptions for video category
7. `action-sidebar.tsx`: wire video tool actions
8. `lib/conversion-config.ts`: add missing video slugs, update extensions
9. `lib/file-actions.ts`: expand CONVERSION_OPTIONS.video

### Ready for Proposal

Yes — pending backend contract confirmation. The frontend-side changes are well-understood and follow established patterns. The unknowns around the backend API surface and page slug routing need to be verified during spec phase.
