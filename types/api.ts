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
