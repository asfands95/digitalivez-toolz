'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Download, ImagePlus, LoaderCircle, Minus, Plus, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react'
import { cancelUpscale, createUpscalerWorker, runUpscale } from '@/components/upscaler-worker-client'

type ImageInfo = { width: number; height: number }
type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_INPUT_PIXELS = 6_000_000
const MAX_OUTPUT_PIXELS = 24_000_000
const OUTPUT_FORMATS: { value: OutputFormat; label: string; extension: string }[] = [
  { value: 'image/png', label: 'PNG', extension: 'png' },
  { value: 'image/jpeg', label: 'JPG', extension: 'jpg' },
  { value: 'image/webp', label: 'WebP', extension: 'webp' },
]

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function readableFormat(file: File) {
  return file.type.replace('image/', '').toUpperCase() || file.name.split('.').pop()?.toUpperCase() || 'Image'
}

function isSupportedImage(file: File) {
  return /\.(jpe?g|png|webp|avif)$/i.test(file.name) || ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)
}

export function ImageUpscalerWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const sourceUrlRef = useRef('')
  const resultUrlRef = useRef('')
  const jobIdRef = useRef<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [info, setInfo] = useState<ImageInfo | null>(null)
  const [factor, setFactor] = useState<2 | 4>(2)
  const [format, setFormat] = useState<OutputFormat>('image/png')
  const [quality, setQuality] = useState(0.92)
  const [resultUrl, setResultUrl] = useState('')
  const [resultBytes, setResultBytes] = useState(0)
  const [resultInfo, setResultInfo] = useState<ImageInfo | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [backend, setBackend] = useState<'webgpu' | 'wasm' | null>(null)
  const [compare, setCompare] = useState(50)
  const [zoom, setZoom] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('Choose an image to begin. Your file stays on this device.')
  const [modelProgress, setModelProgress] = useState<{ loaded: number; total: number | null } | null>(null)
  const [tileProgress, setTileProgress] = useState<{ completed: number; total: number } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => () => {
    workerRef.current?.terminate()
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
  }, [])

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    resultUrlRef.current = ''
    setResultUrl('')
    setResultBytes(0)
    setResultInfo(null)
    setBackend(null)
    setElapsed(0)
  }

  const loadImage = async (nextFile: File) => {
    setError('')
    clearResult()
    if (!isSupportedImage(nextFile)) {
      setError('Choose a JPG, PNG, WebP, or AVIF image supported by this browser.')
      return
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError('This file is larger than the 25 MB upload limit. Choose a smaller image.')
      return
    }

    try {
      const decoded = await createImageBitmap(nextFile)
      const dimensions = { width: decoded.width, height: decoded.height }
      decoded.close()
      if (dimensions.width * dimensions.height > MAX_INPUT_PIXELS) {
        setError('This image has more than 6 megapixels. Reduce its dimensions before using the browser-based model.')
        return
      }
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
      const nextUrl = URL.createObjectURL(nextFile)
      sourceUrlRef.current = nextUrl
      setSourceUrl(nextUrl)
      setFile(nextFile)
      setInfo(dimensions)
      setFactor(2)
      setCompare(50)
      setZoom(1)
      setStatus('Image ready. Select an enlargement factor and start AI processing.')
    } catch {
      setError('This image could not be decoded. It may be damaged or use a format this browser does not support.')
    }
  }

  const clearImage = () => {
    if (jobIdRef.current) cancelUpscale(workerRef.current, jobIdRef.current)
    jobIdRef.current = null
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    sourceUrlRef.current = ''
    setSourceUrl('')
    setFile(null)
    setInfo(null)
    setProcessing(false)
    setModelProgress(null)
    setTileProgress(null)
    setError('')
    setStatus('Choose an image to begin. Your file stays on this device.')
    clearResult()
  }

  const supportedFactor = (value: 2 | 4) => Boolean(info && info.width * info.height * value * value <= MAX_OUTPUT_PIXELS)

  const startUpscaling = async () => {
    if (!file || !info || processing) return
    if (!supportedFactor(factor)) {
      setError(`The ${factor}× output would exceed the 24-megapixel safety limit. Choose 2× or a smaller source image.`)
      return
    }

    setError('')
    clearResult()
    setProcessing(true)
    setStatus('Preparing the image for local AI processing…')
    setModelProgress(null)
    setTileProgress(null)
    const started = performance.now()
    const id = crypto.randomUUID()
    jobIdRef.current = id
    let bitmap: ImageBitmap | null = null

    try {
      bitmap = await createImageBitmap(file)
      workerRef.current ??= createUpscalerWorker()
      const enhanced = await runUpscale(workerRef.current, id, bitmap, factor, progress => {
        if (progress.type === 'status') setStatus(progress.message)
        if (progress.type === 'model-progress') {
          setModelProgress({ loaded: progress.loaded, total: progress.total })
          setStatus('Downloading the AI model. It is cached by your browser for later visits.')
        }
        if (progress.type === 'progress') {
          setTileProgress({ completed: progress.completed, total: progress.total })
          setStatus(`Enhancing image tiles ${progress.completed} of ${progress.total}…`)
        }
      })
      bitmap = null
      setStatus('Preparing your selected download format…')
      const canvas = document.createElement('canvas')
      canvas.width = enhanced.width
      canvas.height = enhanced.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('The browser could not prepare the enhanced image for download.')
      context.drawImage(enhanced.image, 0, 0)
      enhanced.image.close()
      const selectedFormat = OUTPUT_FORMATS.find(item => item.value === format)!
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error('The browser could not encode the selected output format.')), format, format === 'image/png' ? undefined : quality)
      })
      if (blob.type !== format) throw new Error(`${selectedFormat.label} export is not supported by this browser. Select PNG or another available format.`)
      const nextUrl = URL.createObjectURL(blob)
      resultUrlRef.current = nextUrl
      setResultUrl(nextUrl)
      setResultBytes(blob.size)
      setResultInfo({ width: enhanced.width, height: enhanced.height })
      setBackend(enhanced.backend)
      setElapsed((performance.now() - started) / 1000)
      setStatus(`AI enhancement complete. The ${factor}× image is ready to download.`)
      setCompare(50)
    } catch (cause) {
      bitmap?.close()
      const message = cause instanceof Error ? cause.message : 'The image could not be enhanced on this device.'
      if (message.includes('cancelled')) setStatus('Processing cancelled. Your original image is unchanged.')
      else {
        setError(message)
        setStatus('AI image enhancement could not be completed.')
      }
    } finally {
      jobIdRef.current = null
      setProcessing(false)
    }
  }

  const cancelProcessing = () => {
    cancelUpscale(workerRef.current, jobIdRef.current)
    setStatus('Stopping local image processing…')
  }

  const downloadResult = () => {
    if (!resultUrl || !file) return
    const extension = OUTPUT_FORMATS.find(item => item.value === format)?.extension ?? 'png'
    const anchor = document.createElement('a')
    anchor.href = resultUrl
    anchor.download = `digitalivez-upscaled-image-${factor}x.${extension}`
    anchor.click()
  }

  const resultPercent = modelProgress?.total ? Math.min(100, (modelProgress.loaded / modelProgress.total) * 100) : null
  const factorCanRun = supportedFactor(factor)

  return (
    <section className="upscale-workspace" aria-label="AI image upscaler workspace">
      <header className="upscale-workspace-head">
        <div className="upscale-workspace-title">
          <span className="upscale-icon"><Sparkles size={19} aria-hidden="true" /></span>
          <div><span className="eyebrow">LOCAL AI IMAGE ENHANCEMENT</span><h2>Upscale your image</h2><p>Real-ESRGAN x4v3 runs in this browser. Your image is never uploaded.</p></div>
        </div>
        <span className="upscale-privacy"><ShieldCheck size={15} aria-hidden="true" /> On-device processing</span>
      </header>

      {error && <p className="upscale-error" role="alert">{error}</p>}

      {!file ? (
        <div className="upscale-dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const dropped = event.dataTransfer.files[0]; if (dropped) void loadImage(dropped) }}>
          <input ref={inputRef} className="upscale-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif" onChange={event => { const selected = event.target.files?.[0]; if (selected) void loadImage(selected); event.currentTarget.value = '' }} aria-label="Choose an image to upscale" />
          <span className="upscale-upload-icon"><ImagePlus size={28} aria-hidden="true" /></span>
          <h3>Drop an image here</h3>
          <p>JPG, PNG, WebP, or AVIF · up to 25 MB</p>
          <button type="button" className="upscale-primary-button" onClick={() => inputRef.current?.click()}>Browse images</button>
          <small>Images are decoded and enhanced locally. Model download: about 5 MB, loaded only when you process an image.</small>
        </div>
      ) : (
        <div className="upscale-editor">
          <div className="upscale-source-summary">
            <div className="upscale-file-details"><img src={sourceUrl} alt={`Original image: ${file.name}`} /><div><strong>{file.name}</strong><span>{info?.width.toLocaleString()} × {info?.height.toLocaleString()} px · {readableFormat(file)} · {formatBytes(file.size)}</span></div></div>
            <button type="button" className="upscale-icon-button" onClick={clearImage} disabled={processing} aria-label="Remove image"><X size={17} /></button>
          </div>

          {!resultUrl && <div className="upscale-settings">
            <fieldset className="upscale-factor-field"><legend>Upscaling factor</legend><div className="upscale-choice-row">
              {([2, 4] as const).map(value => <button key={value} type="button" className={`upscale-choice${factor === value ? ' is-selected' : ''}`} aria-pressed={factor === value} disabled={!supportedFactor(value) || processing} onClick={() => setFactor(value)}><strong>{value}×</strong><span>{value === 4 ? 'Native model output' : 'Model output, downsampled'}</span></button>)}
            </div><small>Output safety limit: 24 megapixels. Large originals may only support 2×.</small></fieldset>
            <div className="upscale-format-field"><label htmlFor="image-output-format">Download format</label><select id="image-output-format" value={format} onChange={event => setFormat(event.target.value as OutputFormat)} disabled={processing}>{OUTPUT_FORMATS.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
              {format !== 'image/png' && <label className="upscale-quality" htmlFor="image-output-quality">Output compression quality <span>{Math.round(quality * 100)}%</span><input id="image-output-quality" type="range" min="60" max="100" value={Math.round(quality * 100)} onChange={event => setQuality(Number(event.target.value) / 100)} disabled={processing} /></label>}
              <small>The model has one fixed enhancement configuration; this is not a cosmetic quality selector. PNG keeps transparency.</small>
            </div>
            <div className="upscale-action-row"><button type="button" className="upscale-primary-button" onClick={() => void startUpscaling()} disabled={processing || !factorCanRun}><Sparkles size={16} aria-hidden="true" /> Enhance {factor}×</button><span>Expected size: {info ? (info.width * factor).toLocaleString() : '—'} × {info ? (info.height * factor).toLocaleString() : '—'} px</span></div>
          </div>}

          {processing && <div className="upscale-progress" role="status" aria-live="polite"><div className="upscale-progress-heading"><LoaderCircle size={17} className="upscale-spinner" aria-hidden="true" /><span>{status}</span></div>
            {modelProgress && <div className="upscale-progress-track"><progress max="100" value={resultPercent ?? undefined} aria-label="AI model download progress" /><small>{modelProgress.total ? `${formatBytes(modelProgress.loaded)} / ${formatBytes(modelProgress.total)}` : `${formatBytes(modelProgress.loaded)} downloaded`}</small></div>}
            {tileProgress && <div className="upscale-progress-track"><progress max={tileProgress.total} value={tileProgress.completed} aria-label="Image enhancement progress" /><small>{tileProgress.completed} of {tileProgress.total} tiles</small></div>}
            <button type="button" className="upscale-secondary-button" onClick={cancelProcessing}>Cancel</button>
          </div>}

          {resultUrl && resultInfo && <div className="upscale-result">
            <div className="upscale-result-header"><div><span className="eyebrow">ENHANCED IMAGE</span><h3>Compare your result</h3></div><button type="button" className="upscale-icon-button" onClick={() => { setCompare(50); setZoom(1) }} aria-label="Reset comparison and zoom"><RotateCcw size={16} /></button></div>
            <div className="upscale-compare-window" style={{ '--split': `${compare}%`, '--zoom': zoom } as React.CSSProperties}>
              <img className="upscale-compare-after" src={resultUrl} alt={`AI-enhanced ${factor}× image`} />
              <div className="upscale-compare-before" aria-hidden="true"><img src={sourceUrl} alt="" /></div>
              <span className="upscale-compare-label is-before">Original</span><span className="upscale-compare-label is-after">Enhanced</span>
              <div className="upscale-compare-divider" aria-hidden="true"><span /></div>
              <input className="upscale-compare-slider" type="range" min="0" max="100" value={compare} onChange={event => setCompare(Number(event.target.value))} aria-label="Compare original and enhanced image" />
            </div>
            <div className="upscale-preview-controls"><span>Drag the slider or use left and right arrow keys</span><div><button type="button" onClick={() => setZoom(value => Math.max(1, value - 0.25))} disabled={zoom <= 1} aria-label="Zoom out"><Minus size={15} /></button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(2, value + 0.25))} disabled={zoom >= 2} aria-label="Zoom in"><Plus size={15} /></button></div></div>
            <dl className="upscale-stats"><div><dt>Original</dt><dd>{info?.width.toLocaleString()} × {info?.height.toLocaleString()} px</dd><dd>{formatBytes(file.size)}</dd></div><div><dt>Enhanced</dt><dd>{resultInfo.width.toLocaleString()} × {resultInfo.height.toLocaleString()} px · {factor}×</dd><dd>{formatBytes(resultBytes)}</dd></div><div><dt>Processing</dt><dd>{elapsed.toFixed(1)} sec</dd><dd>{backend === 'webgpu' ? 'WebGPU accelerated' : 'WebAssembly CPU'}</dd></div></dl>
            <div className="upscale-result-actions"><button type="button" className="upscale-primary-button" onClick={downloadResult}><Download size={16} aria-hidden="true" /> Download enhanced image</button><button type="button" className="upscale-secondary-button" onClick={clearImage}><Check size={16} aria-hidden="true" /> Process another image</button></div>
          </div>}
        </div>
      )}
      <p className="upscale-status" aria-live="polite">{status}</p>
    </section>
  )
}
