/**
 * API Service for Easy Convert Backend
 * Handles file conversion with support for small files and chunked uploads
 */

import type {
  CreateJobRequest,
  CreateJobResponse,
  UploadChunkResponse,
  MergeChunksResponse,
  StartConversionResponse,
  JobStatusResponse,
  CancelJobRequest,
  CancelJobResponse,
  WebSocketMessage,
  RemoveBackgroundRequest,
  CompressImageRequest,
  WatermarkImageRequest,
  ProcessResponse,
} from "@/types/api"

// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
const API_V1_PREFIX = "/api/v1"
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024 // 10MB

/**
 * Handle API errors with user-friendly messages
 */
async function handleApiError(response: Response, defaultMessage: string): Promise<never> {
  const status = response.status
  
  // Try to get error details from response
  let errorDetail = ""
  try {
    const errorData = await response.json()
    errorDetail = errorData.detail || errorData.message || ""
  } catch {
    // If JSON parsing fails, use status text
    errorDetail = response.statusText
  }

  // Custom messages based on status code
  if (status === 500) {
    throw new Error(
      "Ocurrió un error al procesar tu archivo. Por favor, intenta nuevamente más tarde o contacta soporte si el problema persiste."
    )
  }

  if (status === 413) {
    throw new Error(
      "El archivo es demasiado grande. El tamaño máximo permitido es 100MB."
    )
  }

  if (status === 429) {
    throw new Error(
      "Has alcanzado el límite de conversiones. Por favor, espera unos minutos antes de intentar nuevamente."
    )
  }

  if (status === 422) {
    throw new Error(
      errorDetail || "El formato del archivo no es válido o no está soportado."
    )
  }

  if (status === 404) {
    throw new Error(
      "No se encontró el recurso solicitado. Por favor, intenta crear un nuevo trabajo de conversión."
    )
  }

  // For other errors, use detail if available, otherwise use default message
  throw new Error(errorDetail || `${defaultMessage}: ${response.statusText}`)
}

/**
 * Create a new conversion job
 */
export async function createJob(
  request: CreateJobRequest
): Promise<CreateJobResponse> {
  const response = await fetch(`${API_BASE_URL}${API_V1_PREFIX}/upload/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    await handleApiError(response, "Error al crear el trabajo de conversión")
  }

  return response.json()
}

/**
 * Upload a complete file (for files < 10MB)
 */
export async function uploadCompleteFile(
  jobId: string,
  file: File
): Promise<UploadChunkResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/upload/${jobId}/file`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al subir el archivo")
  }

  return response.json()
}

/**
 * Upload a single chunk (for files > 10MB)
 */
export async function uploadChunk(
  jobId: string,
  chunkIndex: number,
  chunk: Blob
): Promise<UploadChunkResponse> {
  const formData = new FormData()
  formData.append("chunk_index", chunkIndex.toString())
  formData.append("chunk", chunk)

  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/upload/${jobId}/chunk`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al subir el fragmento del archivo")
  }

  return response.json()
}

/**
 * Merge uploaded chunks into a single file
 */
export async function mergeChunks(
  jobId: string
): Promise<MergeChunksResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/upload/${jobId}/merge`,
    {
      method: "POST",
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al unir los fragmentos del archivo")
  }

  return response.json()
}

/**
 * Start the conversion process
 */
export async function startConversion(
  jobId: string
): Promise<StartConversionResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/upload/${jobId}/start`,
    {
      method: "POST",
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al iniciar la conversión")
  }

  return response.json()
}

/**
 * Get job status
 */
export async function getJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/jobs/${jobId}`,
    {
      method: "GET",
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al obtener el estado del trabajo")
  }

  return response.json()
}

/**
 * Cancel a job
 */
export async function cancelJob(
  jobId: string,
  request?: CancelJobRequest
): Promise<CancelJobResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/jobs/${jobId}/cancel`,
    {
      method: "POST",
      headers: request
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
      body: request ? JSON.stringify(request) : undefined,
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al cancelar el trabajo")
  }

  return response.json()
}

/**
 * Download conversion result
 */
export async function downloadResult(
  jobId: string,
  outputFormat: string
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/jobs/${jobId}/download`,
    {
      method: "GET",
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al descargar el resultado")
  }

  return response.blob()
}

/**
 * Create WebSocket connection for real-time job updates
 */
export function createJobWebSocket(
  jobId: string,
  onMessage: (message: WebSocketMessage) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket {
  const ws = new WebSocket(
    `ws://127.0.0.1:8000${API_V1_PREFIX}/ws/jobs/${jobId}`
  )

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage
      onMessage(message)
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error)
    }
  }

  if (onError) {
    ws.onerror = onError
  }

  if (onClose) {
    ws.onclose = onClose
  }

  return ws
}

/**
 * Upload file with automatic chunking for large files
 * @param file File to upload
 * @param jobId Job ID
 * @param onProgress Progress callback (percentage 0-100)
 * @returns Upload response
 */
export async function uploadFile(
  file: File,
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<UploadChunkResponse> {
  // Always upload complete file using /file endpoint
  // This is simpler and works for most images/documents
  onProgress?.(0)
  const result = await uploadCompleteFile(jobId, file)
  onProgress?.(100)
  return result
}

/**
 * Complete conversion flow (upload + start conversion)
 */
export async function convertFile(
  file: File,
  inputFormat: string,
  outputFormats: string[],
  onProgress?: (stage: "uploading" | "converting", progress: number) => void
): Promise<string> {
  // Always use total_chunks: 1 to use the /file endpoint for complete uploads
  // The actual chunking (if needed) is handled by uploadFile() internally
  const totalChunks = 1

  // Create job
  const jobResponse = await createJob({
    input_format: inputFormat,
    output_formats: outputFormats,
    original_size: file.size,
    total_chunks: totalChunks,
  })

  // Upload file (with progress)
  await uploadFile(file, jobResponse.job_id, (progress) => {
    onProgress?.("uploading", progress)
  })

  // Start conversion
  await startConversion(jobResponse.job_id)
  onProgress?.("converting", 0)

  return jobResponse.job_id
}

/**
 * Poll job status until completion or failure
 */
export async function pollJobStatus(
  jobId: string,
  onStatusChange: (status: JobStatusResponse) => void,
  pollInterval: number = 1000,
  maxAttempts: number = 300 // 5 minutes
): Promise<JobStatusResponse> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const status = await getJobStatus(jobId)
    onStatusChange(status)

    if (
      status.status === "completed" ||
      status.status === "failed" ||
      status.status === "cancelled"
    ) {
      return status
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
    attempts++
  }

  throw new Error("Job status polling timeout")
}

// ============================================================================
// IMAGE PROCESSING OPERATIONS
// ============================================================================

/**
 * Remove background from image using AI
 */
export async function removeBackground(
  request: RemoveBackgroundRequest
): Promise<ProcessResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/process/remove-background`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al remover el fondo de la imagen")
  }

  return response.json()
}

/**
 * Compress image to reduce file size
 */
export async function compressImage(
  request: CompressImageRequest
): Promise<ProcessResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/process/compress`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al comprimir la imagen")
  }

  return response.json()
}

/**
 * Add watermark (text or logo) to image
 */
export async function addWatermark(
  request: WatermarkImageRequest
): Promise<ProcessResponse> {
  const response = await fetch(
    `${API_BASE_URL}${API_V1_PREFIX}/process/watermark`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    await handleApiError(response, "Error al agregar marca de agua")
  }

  return response.json()
}

/**
 * Process image operation (compress, remove-bg, or watermark)
 * and poll for completion
 */
export async function processImageFile(
  file: File,
  inputFormat: string,
  operation: "compress" | "remove-background" | "watermark",
  operationParams: Partial<CompressImageRequest | RemoveBackgroundRequest | WatermarkImageRequest>,
  onProgress?: (stage: "uploading" | "processing", progress: number) => void
): Promise<string> {
  // Create job for processing (use same output format as input initially)
  const jobResponse = await createJob({
    input_format: inputFormat,
    output_formats: [operationParams.output_format || inputFormat],
    original_size: file.size,
    total_chunks: 1,
  })

  // Upload file
  await uploadFile(file, jobResponse.job_id, (progress) => {
    onProgress?.("uploading", progress)
  })

  // Build request with job_id
  const request = {
    ...operationParams,
    job_id: jobResponse.job_id,
  }

  // Start the processing operation
  let response: ProcessResponse
  
  switch (operation) {
    case "compress":
      response = await compressImage(request as CompressImageRequest)
      break
    case "remove-background":
      response = await removeBackground(request as RemoveBackgroundRequest)
      break
    case "watermark":
      response = await addWatermark(request as WatermarkImageRequest)
      break
  }

  onProgress?.("processing", 0)

  return response.job_id
}
