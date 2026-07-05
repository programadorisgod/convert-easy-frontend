# Proposal: Audio Conversion Integration

## Intent

Audio files route to wrong backend endpoints (PDF processing instead of `/api/v1/process/audio`). Users have no control over audio quality params. Integrate the dedicated audio processing endpoint end-to-end.

## Scope

### In Scope

- API types for audio request/response
- `processAudio()` and `processAudioFile()` in api-service
- Re-route audio conversion, trim, normalize to `/process/audio`
- Reusable AudioOptions component (bitrate, sample_rate, channels)
- Editor convert dialog audio options
- Conversion page audio param collection
- Constants file for defaults/options

### Out of Scope

- `extract-audio` (video→audio) — needs separate video endpoint, deferred
- Audio visualization/player
- Batch processing

## Capabilities

### New Capabilities

- `audio-processing`: Full audio conversion pipeline — format conversion, trimming, normalization with configurable quality params (bitrate, sample_rate, channels)

### Modified Capabilities

None — no existing spec files exist.

## Approach

1. Add `ProcessAudioRequest`/`ProcessAudioResponse`/`AudioConfig` types to `types/api.ts`
2. Add `processAudio()` POST to `/api/v1/process/audio` and `processAudioFile()` convenience flow (follows `processImageFile` pattern)
3. Create `lib/audio-constants.ts` with `AUDIO_DEFAULTS` and `AUDIO_OPTIONS`
4. Refactor action-executor: route audio conversions to `processAudioFile()`, trim sends trim_start/trim_duration, normalize sends normalize_volume: true
5. Build `AudioOptions` component (selectors for bitrate, sample_rate, channels)
6. Wire AudioOptions into editor convert dialog for audio category
7. Wire audio option collection in conversion-page for audio routes
8. Keep extract-audio as-is (video→audio is a separate concern)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `types/api.ts` | Modified | Add `AudioConfig`, `ProcessAudioRequest`, `ProcessAudioResponse` |
| `lib/api-service.ts` | Modified | Add `processAudio()`, `processAudioFile()`, remove audio ops from `PdfOperationRoute` |
| `lib/audio-constants.ts` | New | Defaults + presets for audio params |
| `components/convert/action-executor.tsx` | Modified | Route audio executors to `processAudioFile()` |
| `components/convert/audio-options.tsx` | New | Reusable AudioOptions component |
| `components/editor/action-sidebar.tsx` | Modified | Audio options in convert dialog, wire params |
| `components/convert/conversion-page.tsx` | Modified | Audio param UI in file-selected state |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `extract-audio` needs backend clarification | Med | Deferred, documented as future work |
| Editor dialog grows further | Low | AudioOptions extracted as standalone component |
| `trim_start` (HH:MM:SS) input parsing | Low | Add validation + regex parsing |
| No tests for routing changes | Med | Manual verify, add tests when infra exists |

## Rollback Plan

Single PR revert. Keep `convertFile()` and `processPdfFile()` as fallbacks — old routing code stays intact but inactive.

## Success Criteria

- [ ] Audio-to-mp3/flac/wav hits `/api/v1/process/audio`
- [ ] trim-audio sends `trim_start` + `trim_duration` to audio endpoint
- [ ] normalize-audio sends `normalize_volume: true`
- [ ] Constants file defines all defaults (sample_rate: 44100, channels: 2)
- [ ] AudioOptions renders in editor convert dialog for audio category
- [ ] Conversion page shows audio quality params for audio routes
