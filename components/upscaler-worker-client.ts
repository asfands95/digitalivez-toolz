'use client'

type WorkerProgress =
  | { type: 'status'; message: string }
  | { type: 'model-progress'; loaded: number; total: number | null }
  | { type: 'progress'; completed: number; total: number }

type WorkerResponse =
  | ({ type: 'result'; image: ImageBitmap; width: number; height: number; backend: 'webgpu' | 'wasm' } & { id: string })
  | ({ type: 'error'; message: string; cancelled?: boolean } & { id: string })
  | (WorkerProgress & { id: string })

export type UpscaleResult = { image: ImageBitmap; width: number; height: number; backend: 'webgpu' | 'wasm' }

export function createUpscalerWorker() {
  return new Worker('/upscaler-worker.js', { type: 'module', name: 'digitalivez-local-upscaler' })
}

export function runUpscale(
  worker: Worker,
  id: string,
  image: ImageBitmap,
  factor: 2 | 4,
  onProgress: (progress: WorkerProgress) => void,
) {
  return new Promise<UpscaleResult>((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
    }
    const handleMessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.id !== id) return
      if (message.type === 'status' || message.type === 'model-progress' || message.type === 'progress') {
        onProgress(message)
        return
      }
      cleanup()
      if (message.type === 'result') resolve({ image: message.image, width: message.width, height: message.height, backend: message.backend })
      else reject(new Error(message.cancelled ? 'Processing cancelled.' : message.message))
    }
    const handleError = (event: ErrorEvent) => {
      cleanup()
      reject(new Error(event.message || 'The local AI worker stopped unexpectedly.'))
    }
    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError, { once: true })
    worker.postMessage({ type: 'upscale', id, image, factor }, [image])
  })
}

export function cancelUpscale(worker: Worker | null, id: string | null) {
  if (worker && id) worker.postMessage({ type: 'cancel', id })
}
