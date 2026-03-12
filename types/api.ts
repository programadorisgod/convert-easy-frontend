/**
 * API Types for Easy Convert Backend
 * @see http://127.0.0.1:8000/docs
 */

// Job status enum matching backend
export type JobStatus =
  | "pending"
  | "uploading"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"

// Create job request
export interface CreateJobRequest {
  input_format: string
  output_formats: string[]
  original_size: number
  total_chunks: number
}

// Create job response
export interface CreateJobResponse {
  job_id: string
  file_id: string
  status: JobStatus
  message: string
}

// Upload chunk response
export interface UploadChunkResponse {
  job_id: string
  chunk_index: number
  chunks_uploaded: number
  total_chunks: number
  is_complete: boolean
  message: string
}

// Merge chunks response
export interface MergeChunksResponse {
  job_id: string
  status: JobStatus
  message: string
}

// Start conversion response
export interface StartConversionResponse {
  job_id: string
  status: JobStatus
  message: string
}

// Job status response
export interface JobStatusResponse {
  job_id: string
  status: JobStatus
  file_id: string
  input_format: string
  output_formats: string[]
  original_size: number
  created_at: string
  updated_at: string
  error_message?: string
}

// Cancel job request
export interface CancelJobRequest {
  reason?: string
}

// Cancel job response
export interface CancelJobResponse {
  job_id: string
  status: JobStatus
  message: string
}

// WebSocket message types
export type WebSocketMessageType =
  | "job:created"
  | "job:uploading"
  | "job:queued"
  | "job:processing"
  | "job:completed"
  | "job:failed"
  | "job:cancelled"

export interface WebSocketMessage {
  type: WebSocketMessageType
  job_id: string
  status: JobStatus
  timestamp: string
  data?: Record<string, unknown>
}

// ============================================================================
// IMAGE PROCESSING TYPES
// ============================================================================

// Remove background request
export interface RemoveBackgroundRequest {
  job_id: string
  output_format: string
  model?: "u2net" | "u2netp" | "u2net_human_seg" | "isnet-general-use" | "isnet-anime"
  alpha_matting?: boolean
  strip_metadata?: boolean
}

// Compress image request
export interface CompressImageRequest {
  job_id: string
  output_format: string
  level: "low" | "balanced" | "strong"
  quality?: number
  strip_metadata?: boolean
}

// Watermark image request
export interface WatermarkImageRequest {
  job_id: string
  output_format: string
  type: "text" | "logo"
  text?: string
  font_size?: number
  color?: string
  logo_path?: string
  size_percent?: number
  position?: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right" | "diagonal"
  opacity?: number
  margin?: number
  strip_metadata?: boolean
}

// Process response (shared by all operations)
export interface ProcessResponse {
  job_id: string
  status: JobStatus
  message: string
  operation: string
}
