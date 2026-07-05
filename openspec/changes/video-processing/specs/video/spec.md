# Video Processing Specification

## Purpose

Defines the frontend behavior for video operations — format conversion with quality params (CRF, resolution, FPS), trimming, and audio control — routed through `POST /api/v1/process/video`.

## Requirements

### Requirement: Video API Contract

The system MUST define typed interfaces for `ProcessVideoRequest`, `ProcessVideoResponse`, and `VideoConfig`.

#### Scenario: Request includes all backend-supported params

- GIVEN the frontend prepares a video processing request
- WHEN building the payload for `POST /api/v1/process/video`
- THEN `ProcessVideoRequest` SHALL contain `job_id` (string) and `output_format` (mp4|mkv|mov|avi|webm|flv|mpeg|m4v)
- AND MAY contain `crf`, `resolution`, `fps`, `trim_start`, `trim_duration`, `extract_audio`, `audio_output_format`, `audio_bitrate`, `remove_audio`

#### Scenario: Default CRF

- GIVEN no `crf` is provided
- THEN the request SHALL omit `crf` (server defaults to 23)

### Requirement: Video Format Conversion

Video conversion slugs (video-to-mp4, video-to-mkv, video-to-webm) MUST use `POST /api/v1/process/video`.

#### Scenario: Convert to MP4 via video endpoint

- GIVEN the user selects "Convert to MP4" for a video file
- WHEN `executeAction()` runs for the video conversion config
- THEN the request routes to `processVideoFile()` with `output_format: "mp4"`
- AND `processVideo()` POSTs to `/api/v1/process/video`

#### Scenario: Convert with quality settings

- GIVEN the user sets CRF to 18, resolution to "1920:1080", FPS to 30
- WHEN the video conversion executes
- THEN the request SHALL include `crf: 18`, `resolution: "1920:1080"`, `fps: 30`

#### Scenario: Output format must differ from input

- GIVEN the user selects the same format as the input
- WHEN validation runs
- THEN the system SHALL reject with an error message

### Requirement: Trim Video

The trim-video tool MUST use `POST /api/v1/process/video` with `trim_start` and `trim_duration`.

#### Scenario: Send trim params to correct endpoint

- GIVEN the user uploads a video file and uses trim
- WHEN `executeTrim()` runs for a video file
- THEN the request SHALL include `trim_start` (HH:MM:SS) and `trim_duration` (seconds)
- AND POST to `/api/v1/process/video`

### Requirement: Extract Audio from Video

The extract-audio action MUST use `processVideoFile()` with `extract_audio: true` instead of the current PDF endpoint.

#### Scenario: Extract audio via video endpoint

- GIVEN the user selects "Extract Audio" for a video file
- WHEN `executeAudioExtract()` runs
- THEN the request SHALL include `extract_audio: true` and `audio_output_format`
- AND POST to `/api/v1/process/video`

#### Scenario: audio_output_format required when extract_audio

- GIVEN `extract_audio` is true
- WHEN building the request
- THEN `audio_output_format` SHALL be required

### Requirement: Remove Audio from Video

The system SHALL support removing the audio track from a video.

#### Scenario: remove_audio flag

- GIVEN the user opts to remove audio
- WHEN the request is built
- THEN `remove_audio: true` SHALL be included

#### Scenario: extract_audio and remove_audio mutual exclusion

- GIVEN both `extract_audio` and `remove_audio` are true
- WHEN validation runs
- THEN the system SHALL reject with an error message

### Requirement: VideoOptions Component

The system SHALL provide a reusable `VideoOptions` component with video quality controls.

#### Scenario: Render all control groups

- GIVEN the user triggers video conversion
- WHEN the options panel renders
- THEN VideoOptions SHALL display CRF slider, resolution input, FPS select, remove_audio toggle
- AND controls SHALL pre-select default values

### Requirement: Video Constants File

The system SHALL define video defaults in `lib/video-constants.ts`.

#### Scenario: All presets are exported

- GIVEN the constants file exists
- WHEN importing from it
- THEN it SHALL export `VIDEO_INPUT_FORMATS`, `VIDEO_OUTPUT_FORMATS`, `VIDEO_DEFAULTS`, `CRF_RANGE`, `RESOLUTION_PRESETS`, `FPS_OPTIONS`, `AUDIO_OUTPUT_FORMATS`, `AUDIO_BITRATE_OPTIONS`

### Requirement: Editor Convert Dialog

The editor convert dialog MUST include VideoOptions when the file category is video.

#### Scenario: Video options visible in editor

- GIVEN the editor sidebar is open with a video file selected
- WHEN the user clicks "Convert"
- THEN VideoOptions SHALL render below the format selector
- AND selected params SHALL be passed to the conversion flow
