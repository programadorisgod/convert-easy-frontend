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
