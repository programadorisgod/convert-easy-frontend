# Proposal: Video Processing Integration

## Intent

Video files route to wrong or broken endpoints (PDF processing, generic convert, or "available soon" toasts). Users have no video quality controls. Integrate the dedicated video processing endpoint `POST /api/v1/process/video`.

## Scope

### In Scope

- API types for video request/response
- `processVideo()` and `processVideoFile()` in api-service (mirror `processAudioFile` pattern)
- Video routing in action-executor: `executeConversion()` + `executeTrim()` for video category call `processVideoFile()`
- `extract-audio` from video → `processVideoFile()` with `extract_audio: true` (replaces current PDF route hack)
- VideoOptions component: CRF slider, resolution text input, FPS select, trim fields, extract-audio toggle, remove-audio toggle
- Wire VideoOptions into editor sidebar, conversion-page, and tool-page
- Video constants file (formats, CRF defaults, resolution presets)
- Update `CONVERSION_OPTIONS.video` in file-actions.ts (add missing formats)

### Out of Scope

- Chunked upload for large videos
- Video player/preview in browser
- Batch processing

## Capabilities

### New Capabilities

- `video-processing`: Full video conversion pipeline — format conversion with CRF, resolution scaling, FPS adjustment, trimming, audio extraction, audio removal

## Approach

1. Add `ProcessVideoRequest`/`ProcessVideoResponse`/`VideoConfig` types to `types/api.ts`
2. Add `processVideo()` POST to `/api/v1/process/video` and `processVideoFile()` composite flow (mirrors `processAudioFile`)
3. Create `lib/video-constants.ts` with defaults and options
4. Refactor action-executor: route video conversions + trim to `processVideoFile()`, fix `executeAudioExtract()` to use `processVideoFile` with `extract_audio: true`
5. Build `VideoOptions` component (CRF slider, resolution input, FPS select, trim fields, extract_audio toggle, remove_audio toggle, audio output format/bitrate conditional)
6. Wire VideoOptions into editor convert dialog for video category
7. Wire video option collection in conversion-page for video routes
8. Wire VideoOptions + trim fields in tool-page for trim-video

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `types/api.ts` | Modified | Add `VideoConfig`, `ProcessVideoRequest`, `ProcessVideoResponse` |
| `lib/api-service.ts` | Modified | Add `processVideo()`, `processVideoFile()` |
| `lib/video-constants.ts` | New | Defaults + presets for video params |
| `components/convert/action-executor.tsx` | Modified | Route video conversions to `processVideoFile()`, fix `executeAudioExtract()` |
| `components/video/video-options.tsx` | New | Reusable VideoOptions component |
| `components/editor/action-sidebar.tsx` | Modified | VideoOptions in convert dialog |
| `components/convert/conversion-page.tsx` | Modified | VideoOptions in file-selected state |
| `components/convert/tool-page.tsx` | Modified | Video trim + VideoOptions for trim-video |
| `lib/file-actions.ts` | Modified | Expand video conversion formats |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| extract_audio/remove_audio mutual exclusion | Low | Validation in VideoOptions + action-executor |
| Video files >10MB hit non-chunked upload | Med | Deferred, document as follow-up |
| Resolution regex parsing | Low | Basic `WIDTH:HEIGHT` validation |

## Rollback Plan

Single PR revert. Old routing stays intact but inactive for video — revert by removing `category === "video"` checks.

## Success Criteria

- [ ] Video-to-mp4/mkv/webm hits `/api/v1/process/video`
- [ ] trim-video sends trim_start + trim_duration to video endpoint
- [ ] extract-audio sends `extract_audio: true` to video endpoint (not PDF)
- [ ] CRF/resolution/FPS params reach the backend
- [ ] VideoOptions renders in editor + conversion-page + tool-page
- [ ] extract_audio and remove_audio cannot both be true (validation)
