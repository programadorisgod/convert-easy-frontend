export const AUDIO_OUTPUT_FORMATS = ["mp3", "wav", "aac", "m4a", "flac", "ogg", "opus"] as const
export const AUDIO_DEFAULTS = { sampleRate: 44100, channels: 2, normalizeVolume: false } as const
export const BITRATE_OPTIONS = ["128k", "192k", "256k", "320k"] as const
export const SAMPLE_RATE_OPTIONS = [22050, 44100, 48000] as const
export interface ChannelOption { value: 1 | 2; label: string }
export const CHANNEL_OPTIONS: ChannelOption[] = [
  { value: 1, label: "Mono" },
  { value: 2, label: "Stereo" },
] as const
