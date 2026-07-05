# Audio Processing Specification

## Purpose

Defines the frontend behavior for audio operations — format conversion, trimming, and normalization — routed through `POST /api/v1/process/audio` instead of incorrect PDF/generic endpoints.

## Requirements

### Requirement: Audio API Contract

The system MUST define typed interfaces for `ProcessAudioRequest`, `ProcessAudioResponse`, and `AudioConfig`.

#### Scenario: Request includes all backend-supported params

- GIVEN the frontend prepares an audio processing request
- WHEN building the payload for `POST /api/v1/process/audio`
- THEN `ProcessAudioRequest` SHALL contain `job_id` (string) and `output_format` (mp3|wav|aac|m4a|flac|ogg|opus)
- AND MAY contain `bitrate`, `sample_rate`, `channels`, `trim_start`, `trim_duration`, `normalize_volume`

#### Scenario: Defaults for optional params

- GIVEN no optional audio params are provided
- WHEN the request is built
- THEN `sample_rate` SHALL default to 44100
- AND `channels` SHALL default to 2

### Requirement: Audio Format Conversion

Audio conversion routes (audio-to-mp3, audio-to-flac, audio-to-wav) MUST use `POST /api/v1/process/audio`.

#### Scenario: Convert to MP3 via audio endpoint

- GIVEN the user selects "Convert to MP3" for an audio file
- WHEN `executeAction()` runs for the audio conversion config
- THEN the request routes to `processAudioFile()` with `output_format: "mp3"`
- AND `processAudio()` POSTs to `/api/v1/process/audio`

#### Scenario: Convert with quality settings

- GIVEN the user sets bitrate to 320k, sample_rate to 48000, channels to 2
- WHEN the audio conversion executes
- THEN the request SHALL include `bitrate: "320k"`, `sample_rate: 48000`, `channels: 2`

### Requirement: Trim Audio

The trim-audio tool MUST use `POST /api/v1/process/audio` with `trim_start` and `trim_duration`.

#### Scenario: Send trim params to correct endpoint

- GIVEN the user uploads an audio file and uses trim
- WHEN `executeTrim()` runs
- THEN the request SHALL include `trim_start` (HH:MM:SS) and `trim_duration` (seconds)
- AND POST to `/api/v1/process/audio`

#### Scenario: Reject invalid trim_start format

- GIVEN the user enters a malformed timestamp like "abc"
- WHEN validating the input
- THEN the system SHALL reject it with an error message

### Requirement: Normalize Audio

The normalize-audio tool MUST use `POST /api/v1/process/audio` with `normalize_volume: true`.

#### Scenario: Send normalize flag to audio endpoint

- GIVEN the user uploads an audio file and selects normalize
- WHEN `executeNormalize()` runs
- THEN the request SHALL include `normalize_volume: true`
- AND `output_format` SHALL default to "mp3"

### Requirement: AudioOptions Component

The system SHALL provide a reusable `AudioOptions` component with bitrate, sample_rate, and channels selectors.

#### Scenario: Render all three audio param groups

- GIVEN the user triggers audio conversion in the editor
- WHEN the convert dialog opens
- THEN AudioOptions SHALL display bitrate, sample_rate, and channels selectors
- AND each selector SHALL pre-select the default value

#### Scenario: Bitrate options match backend

- GIVEN the bitrate selector is rendered
- WHEN inspecting available options
- THEN they SHALL be exactly: 128k, 192k, 256k, 320k

#### Scenario: Sample rate options match backend

- GIVEN the sample_rate selector is rendered
- WHEN inspecting available options
- THEN they SHALL be exactly: 22050, 44100, 48000

### Requirement: Audio Constants File

The system SHALL define `AUDIO_DEFAULTS` and `AUDIO_OPTIONS` in `lib/audio-constants.ts` — no magic strings or numbers.

#### Scenario: All presets are exported

- GIVEN the constants file exists
- WHEN importing from it
- THEN it SHALL export `BITRATE_OPTIONS`, `SAMPLE_RATE_OPTIONS`, `CHANNEL_OPTIONS`
- AND `AUDIO_DEFAULTS` SHALL contain `sample_rate: 44100`, `channels: 2`

### Requirement: Editor Convert Dialog

The editor convert dialog MUST include AudioOptions when the file category is audio.

#### Scenario: Audio options visible in editor convert dialog

- GIVEN the editor sidebar is open with an audio file selected
- WHEN the user clicks "Convert" and the format dialog appears
- THEN AudioOptions SHALL render below the format selector
- AND selected params SHALL be passed to the conversion flow

### Requirement: extract-audio Deferred

The extract-audio tool (video→audio) MUST remain unchanged. It is explicitly out of scope.

#### Scenario: extract-audio routing unchanged

- GIVEN the user extracts audio from a video file
- WHEN `executeAudioExtract()` runs
- THEN it continues using its current behavior
- AND a code comment SHALL note this as future work for a video endpoint
