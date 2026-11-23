'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Conversion, Input, Output } from 'mediabunny'
import { Check, Download, FileVideo2, Film, Pause, Play, RotateCcw, ShieldCheck, SlidersHorizontal, X } from 'lucide-react'

type OutputFormat = 'mp4' | 'webm'
type VideoMetadata = {
  duration: number
  width: number
  height: number
  hasAudio: boolean
  mimeType: string
  codec: string
  frameRate: number | null
}
type ExportFileHandle = {
  createWritable(): Promise<FileSystemWritableFileStream>
  getFile(): Promise<File>
}
type SaveFileWindow = Window & {
  showSaveFilePicker?: (options?: { suggestedName?: string; types?: { description: string; accept: Record<string, string[]> }[] }) => Promise<ExportFileHandle>
}

const MEMORY_EXPORT_LIMIT = 350 * 1024 * 1024

function timestamp(seconds: number) {
  const safe = Math.max(0, seconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const wholeSeconds = Math.floor(safe % 60)
  const milliseconds = Math.floor((safe % 1) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}

function parseTimestamp(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (!match) return null
  const [, hours, minutes, seconds, milliseconds = '0'] = match
  const mins = Number(minutes)
  const secs = Number(seconds)
  if (mins > 59 || secs > 59) return null
  return Number(hours) * 3600 + mins * 60 + secs + Number(milliseconds.padEnd(3, '0')) / 1000
}

function prettyDuration(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const remainder = whole % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`
}

function prettyBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function safeBaseName(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'video'
}

export function VideoTrimmer() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [startText, setStartText] = useState('00:00:00.000')
  const [endText, setEndText] = useState('00:00:00.000')
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [format, setFormat] = useState<OutputFormat>('mp4')
  const [availableFormats, setAvailableFormats] = useState<OutputFormat[]>([])
  const [status, setStatus] = useState('Choose a video to begin. Your file stays on this device.')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState('')
  const [resultName, setResultName] = useState('')
  const [resultSize, setResultSize] = useState(0)
  const [directSaved, setDirectSaved] = useState(false)
  const [previewingSelection, setPreviewingSelection] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<Input | null>(null)
  const conversionRef = useRef<Conversion | null>(null)
  const cancelRequestedRef = useRef(false)
  const outputRef = useRef<Output | null>(null)
  const previewUrlRef = useRef('')
  const resultUrlRef = useRef('')

  useEffect(() => () => {
    void conversionRef.current?.cancel()
    inputRef.current?.dispose()
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
  }, [])

  const parsedStart = parseTimestamp(startText)
  const parsedEnd = parseTimestamp(endText)
  const selectionValid = Boolean(metadata && parsedStart !== null && parsedEnd !== null && parsedStart >= 0 && parsedEnd <= metadata.duration && parsedStart < parsedEnd)
  const selectedDuration = selectionValid ? (parsedEnd as number) - (parsedStart as number) : 0
  const estimatedOutputBytes = file && metadata ? file.size * Math.min(1, selectedDuration / metadata.duration) * 1.35 : 0
  const useFrameStep = metadata?.frameRate ? 1 / metadata.frameRate : 0.1
  const selectionStyle = useMemo(() => {
    if (!metadata?.duration) return undefined
    return { '--start-percent': `${(start / metadata.duration) * 100}%`, '--end-percent': `${(end / metadata.duration) * 100}%` } as CSSProperties
  }, [metadata?.duration, start, end])

  const revokeResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    resultUrlRef.current = ''
    setResultUrl('')
    setResultName('')
    setResultSize(0)
    setDirectSaved(false)
  }

  const updateSelection = (nextStart: number, nextEnd: number) => {
    setStart(nextStart)
    setEnd(nextEnd)
    setStartText(timestamp(nextStart))
    setEndText(timestamp(nextEnd))
    setPreviewingSelection(false)
    revokeResult()
  }

  const loadVideo = async (nextFile: File) => {
    inputRef.current?.dispose()
    inputRef.current = null
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    revokeResult()
    setFile(nextFile)
    setMetadata(null)
    setAvailableFormats([])
    setError('')
    setLoading(true)
    setStatus('Reading video tracks and checking browser support…')
    const objectUrl = URL.createObjectURL(nextFile)
    previewUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)

    try {
      const { ALL_FORMATS, BlobSource, Input, canEncodeAudio, canEncodeVideo } = await import('mediabunny')
      const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(nextFile) })
      inputRef.current = input
      if (!(await input.canRead())) throw new Error('This file container is not supported by the browser video tools.')
      const videoTrack = await input.getPrimaryVideoTrack()
      if (!videoTrack) throw new Error('No video track was found in this file.')
      const durationFromMetadata = await input.getDurationFromMetadata([videoTrack])
      const duration = durationFromMetadata && Number.isFinite(durationFromMetadata) && durationFromMetadata > 0
        ? durationFromMetadata
        : await input.computeDuration([videoTrack])
      if (!Number.isFinite(duration) || duration <= 0) throw new Error('A valid video duration could not be read.')
      const audioTrack = await input.getPrimaryAudioTrack()
      const [mimeType, codec, width, height, canDecode] = await Promise.all([
        input.getMimeType(),
        videoTrack.getCodecParameterString(),
        videoTrack.getDisplayWidth(),
        videoTrack.getDisplayHeight(),
        videoTrack.canDecode(),
      ])
      if (!canDecode) throw new Error('This video codec cannot be decoded by this browser, so it cannot be trimmed here.')
      let frameRate: number | null = null
      try {
        const metrics = await videoTrack.computeFrameRateMetrics({ targetPacketCount: 24 })
        if (metrics.bestGuessFrameRate > 0 && Number.isFinite(metrics.bestGuessFrameRate)) frameRate = metrics.bestGuessFrameRate
      } catch {
        frameRate = null
      }
      const audioIsPresent = Boolean(audioTrack)
      const [mp4Video, mp4Audio, webmVideo, webmAudio] = await Promise.all([
        canEncodeVideo('avc'),
        audioIsPresent ? canEncodeAudio('aac') : Promise.resolve(true),
        canEncodeVideo('vp8'),
        audioIsPresent ? canEncodeAudio('opus') : Promise.resolve(true),
      ])
      const formats: OutputFormat[] = []
      if (mp4Video && mp4Audio) formats.push('mp4')
      if (webmVideo && webmAudio) formats.push('webm')
      if (formats.length === 0) throw new Error(audioIsPresent ? 'This browser cannot encode the video and audio codecs needed for MP4 or WebM export.' : 'This browser cannot encode this video as MP4 or WebM.')
      const detected: VideoMetadata = { duration, width, height, hasAudio: audioIsPresent, mimeType, codec: codec || 'Unknown', frameRate }
      setMetadata(detected)
      setAvailableFormats(formats)
      setFormat(formats.includes('mp4') ? 'mp4' : 'webm')
      setStart(0)
      setEnd(duration)
      setStartText(timestamp(0))
      setEndText(timestamp(duration))
      setStatus('Video ready. Adjust the range, preview your clip, and export when you are satisfied.')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'This video could not be read. Try another file or a different browser.'
      setError(message)
      setStatus('The file could not be prepared for trimming.')
      inputRef.current?.dispose()
      inputRef.current = null
    } finally {
      setLoading(false)
    }
  }

  const clearVideo = async () => {
    if (conversionRef.current) await conversionRef.current.cancel().catch(() => undefined)
    conversionRef.current = null
    outputRef.current = null
    inputRef.current?.dispose()
    inputRef.current = null
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setPreviewUrl('')
    setFile(null)
    setMetadata(null)
    setAvailableFormats([])
    setStart(0)
    setEnd(0)
    setStartText(timestamp(0))
    setEndText(timestamp(0))
    setError('')
    setLoading(false)
    setExporting(false)
    setProgress(0)
    setPreviewingSelection(false)
    setStatus('Video cleared. Choose another file whenever you are ready.')
    revokeResult()
  }

  const previewSelection = async () => {
    if (!selectionValid || !videoRef.current) return
    const player = videoRef.current
    player.currentTime = parsedStart as number
    setPreviewingSelection(true)
    try {
      await player.play()
    } catch {
      setPreviewingSelection(false)
      setError('Playback could not start. Use the video controls or choose another file.')
    }
  }

  const onTimeUpdate = () => {
    const player = videoRef.current
    if (previewingSelection && player && player.currentTime >= (parsedEnd ?? Infinity)) {
      player.pause()
      player.currentTime = parsedStart ?? 0
      setPreviewingSelection(false)
    }
  }

  const exportVideo = async () => {
    if (!file || !metadata || !selectionValid || exporting) return
    const saveWindow = window as SaveFileWindow
    const saveDirectly = estimatedOutputBytes > MEMORY_EXPORT_LIMIT && typeof saveWindow.showSaveFilePicker === 'function'
    if (estimatedOutputBytes > MEMORY_EXPORT_LIMIT && !saveDirectly) {
      setError('This export may use too much browser memory. Shorten the selected clip or try a desktop browser with direct-to-disk saving.')
      return
    }

    setError('')
    revokeResult()
    setProgress(0)
    cancelRequestedRef.current = false
    setExporting(true)
    setStatus('Preparing the video encoder…')
    let writable: FileSystemWritableFileStream | null = null
    let directFileHandle: ExportFileHandle | null = null
    try {
      const extension = format === 'mp4' ? 'mp4' : 'webm'
      const outputName = `${safeBaseName(file.name)}-trimmed.${extension}`
      let target
      if (saveDirectly && saveWindow.showSaveFilePicker) {
        const handle = await saveWindow.showSaveFilePicker({
          suggestedName: outputName,
          types: [{ description: `${format.toUpperCase()} video`, accept: { [format === 'mp4' ? 'video/mp4' : 'video/webm']: [`.${extension}`] } }],
        })
        directFileHandle = handle
        writable = await handle.createWritable()
        const { StreamTarget } = await import('mediabunny')
        target = new StreamTarget(writable as unknown as WritableStream<import('mediabunny').StreamTargetChunk>)
      } else {
        const { BufferTarget } = await import('mediabunny')
        target = new BufferTarget()
      }
      const { Conversion, Mp4OutputFormat, Output, Quality, WebMOutputFormat } = await import('mediabunny')
      const output = new Output({ format: format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat(), target })
      outputRef.current = output
      const conversion = await Conversion.init({
        input: inputRef.current!,
        output,
        tracks: 'primary',
        trim: { start: parsedStart as number, end: parsedEnd as number },
        copy: false,
        tags: {},
        video: { codec: format === 'mp4' ? 'avc' : 'vp8', quality: new Quality('high') },
        ...(metadata.hasAudio ? { audio: { codec: format === 'mp4' ? 'aac' as const : 'opus' as const, quality: new Quality('high') } } : {}),
      })
      conversionRef.current = conversion
      if (!conversion.isValid) throw new Error('This video has tracks that cannot be encoded by the selected output format. Choose another supported format or video.')
      const primaryVideo = await inputRef.current!.getPrimaryVideoTrack()
      const expectedAudio = metadata.hasAudio ? await inputRef.current!.getPrimaryAudioTrack() : null
      const requiredTrackWasDiscarded = conversion.discardedTracks.some(({ track }) => track === primaryVideo || track === expectedAudio)
      if (!conversion.utilizedTracks.includes(primaryVideo!) || (expectedAudio && !conversion.utilizedTracks.includes(expectedAudio)) || requiredTrackWasDiscarded) {
        const codecFailure = conversion.discardedTracks.some(({ reason }) => reason === 'no_encodable_target_codec')
        throw new Error(codecFailure
          ? 'A compatible encoder for the required video or audio track is unavailable in this browser.'
          : 'The browser could not prepare all expected video and audio tracks for export.')
      }
      if (cancelRequestedRef.current) {
        await conversion.cancel()
        throw new DOMException('Export cancelled.', 'AbortError')
      }
      conversion.onProgress = value => {
        setProgress(Math.min(99, Math.floor(value * 100)))
        setStatus(`Encoding your selected clip… ${Math.min(99, Math.floor(value * 100))}%`)
      }
      setStatus('Encoding your selected clip…')
      await conversion.execute()
      setProgress(100)
      if (saveDirectly && directFileHandle) {
        setDirectSaved(true)
        setResultName(outputName)
        setResultSize((await directFileHandle.getFile()).size)
        setStatus('Your trimmed video has been saved to the selected location.')
      } else {
        const buffer = (target as import('mediabunny').BufferTarget).buffer
        if (!buffer) throw new Error('The export finished but no video file was produced. Please try again.')
        const url = URL.createObjectURL(new Blob([buffer], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' }))
        resultUrlRef.current = url
        setResultUrl(url)
        setResultName(outputName)
        setResultSize(buffer.byteLength)
        setStatus('Your trimmed video is ready to download.')
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        setStatus('Save cancelled. Your original video is unchanged.')
      } else if (cause instanceof Error && cause.name === 'ConversionCanceledError') {
        setStatus('Export cancelled. Your original video is unchanged.')
      } else {
        const message = cause instanceof Error ? cause.message : 'The video could not be exported. Check browser support and try again.'
        setError(message)
        setStatus('Export could not be completed.')
        await writable?.abort().catch(() => undefined)
      }
    } finally {
      conversionRef.current = null
      outputRef.current = null
      setExporting(false)
    }
  }

  const cancelExport = async () => {
    cancelRequestedRef.current = true
    setStatus('Stopping the video conversion…')
    await conversionRef.current?.cancel().catch(() => undefined)
  }

  const downloadResult = () => {
    if (!resultUrl) return
    const anchor = document.createElement('a')
    anchor.href = resultUrl
    anchor.download = resultName
    anchor.click()
  }

  return (
    <section className="video-trimmer" aria-label="Browser-based video trimmer">
      <header className="video-trimmer-head">
        <div className="video-trimmer-title">
          <span className="video-trimmer-icon"><Film size={20} aria-hidden="true" /></span>
          <div><span className="eyebrow">LOCAL VIDEO EDITOR</span><h2>Trim your video</h2><p>Choose the section to keep. Your original file never leaves your device.</p></div>
        </div>
        <div className="video-privacy-badges" aria-label="Privacy and access features">
          <span><ShieldCheck size={14} /> Browser-based</span><span><Check size={14} /> No upload</span><span>No registration</span>
        </div>
      </header>

      {!file ? (
        <label className="video-upload-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const droppedFile = event.dataTransfer.files[0]; if (droppedFile) void loadVideo(droppedFile) }}>
          <input type="file" accept="video/*,.mp4,.mov,.webm,.m4v,.mkv" onChange={event => { const selected = event.target.files?.[0]; if (selected) void loadVideo(selected); event.currentTarget.value = '' }} />
          <span className="video-upload-icon"><FileVideo2 size={26} aria-hidden="true" /></span>
          <strong>{loading ? 'Reading your video…' : 'Upload Your Video'}</strong>
          <span>Drag and drop your video here, or browse files from your device.</span>
          <span className="video-upload-button">Browse video</span>
          <small>MP4, MOV, WebM, M4V and MKV containers when supported by your browser and codecs.</small>
        </label>
      ) : (
        <div className="video-workspace">
          <div className="video-preview-panel">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onTimeUpdate={onTimeUpdate}
              onEnded={() => setPreviewingSelection(false)}
              onError={() => setError('This browser cannot preview this video container or codec. The file may still be readable for trimming if its codec is supported.')}
              aria-label="Video preview"
            />
            <div className="video-file-summary">
              <div><strong>{file.name}</strong><span>{prettyBytes(file.size)}{metadata ? ` · ${metadata.width} × ${metadata.height} · ${prettyDuration(metadata.duration)}` : ''}</span></div>
              <button type="button" className="video-quiet-button" onClick={() => void clearVideo()} disabled={exporting}><RotateCcw size={15} /> Clear video</button>
            </div>
          </div>

          {metadata && (
            <div className="video-edit-panel">
              <div className="video-timeline-heading"><div><h3>Choose the clip to keep</h3><p>Use the handles or enter exact start and end times.</p></div><span className="video-format-chip">{metadata.mimeType || 'Video'} · {metadata.codec}</span></div>
              <div className="video-time-fields">
                <label className="field"><span>Start time</span><input className="text-input" type="text" inputMode="decimal" aria-label="Start time, hours minutes seconds and milliseconds" value={startText} onChange={event => { const value = event.target.value; setStartText(value); const seconds = parseTimestamp(value); if (seconds !== null && seconds >= 0 && seconds < end) { setStart(seconds); setPreviewingSelection(false); revokeResult() } }} onBlur={() => { const seconds = parseTimestamp(startText); if (seconds !== null && seconds <= end) setStartText(timestamp(seconds)) }} /></label>
                <label className="field"><span>End time</span><input className="text-input" type="text" inputMode="decimal" aria-label="End time, hours minutes seconds and milliseconds" value={endText} onChange={event => { const value = event.target.value; setEndText(value); const seconds = parseTimestamp(value); if (seconds !== null && seconds > start && seconds <= metadata.duration) { setEnd(seconds); setPreviewingSelection(false); revokeResult() } }} onBlur={() => { const seconds = parseTimestamp(endText); if (seconds !== null && seconds >= start) setEndText(timestamp(seconds)) }} /></label>
                <div className="video-selected-duration"><span>Selected clip</span><strong>{selectionValid ? prettyDuration(selectedDuration) : 'Check times'}</strong></div>
              </div>
              <div className="video-timeline" style={selectionStyle}>
                <div className="video-timeline-track" aria-hidden="true"><span className="video-timeline-selected" /></div>
                <input aria-label="Set clip start time" type="range" min="0" max={metadata.duration} step={useFrameStep} value={start} onChange={event => { const value = Math.min(Number(event.target.value), end - useFrameStep); if (value >= 0) updateSelection(value, end) }} />
                <input aria-label="Set clip end time" type="range" min="0" max={metadata.duration} step={useFrameStep} value={end} onChange={event => { const value = Math.max(Number(event.target.value), start + useFrameStep); if (value <= metadata.duration) updateSelection(start, value) }} />
              </div>
              <div className="video-timeline-scale"><span>0:00</span><span>{prettyDuration(metadata.duration)}</span></div>
              <div className="video-selection-summary"><span>Original <strong>{prettyDuration(metadata.duration)}</strong></span><span>Selected <strong>{timestamp(parsedStart ?? 0)} – {timestamp(parsedEnd ?? 0)}</strong></span><span>Clip length <strong>{prettyDuration(selectedDuration)}</strong></span></div>
              {!selectionValid && <p className="video-inline-error" role="alert">Enter a start at or after 00:00:00.000 and an end after the start, no later than {timestamp(metadata.duration)}.</p>}
              <div className="video-export-row">
                <button type="button" className="secondary-button video-preview-selection" disabled={!selectionValid || exporting} onClick={() => void previewSelection()}>{previewingSelection ? <Pause size={16} /> : <Play size={16} />}{previewingSelection ? 'Previewing clip' : 'Preview selected clip'}</button>
                <label className="video-format-select"><SlidersHorizontal size={16} /><span>Export as</span><select aria-label="Export format" value={format} onChange={event => { setFormat(event.target.value as OutputFormat); revokeResult() }}>{availableFormats.map(value => <option value={value} key={value}>{value === 'mp4' ? 'MP4 · H.264' : 'WebM · VP8'}</option>)}</select></label>
                <button type="button" className="primary-button" disabled={!selectionValid || exporting || availableFormats.length === 0} onClick={() => void exportVideo()}>{exporting ? 'Processing…' : 'Trim Video'}</button>
              </div>
              {file.size > MEMORY_EXPORT_LIMIT && typeof (window as SaveFileWindow).showSaveFilePicker !== 'function' && <p className="video-memory-warning">This large source may require substantial memory. Shorten the selected section before exporting, or use a browser with direct-to-disk saving.</p>}
            </div>
          )}
        </div>
      )}

      <p className="video-status" role="status" aria-live="polite">{status}</p>
      {loading && <div className="video-progress-track" role="progressbar" aria-label="Reading video metadata" aria-valuemin={0} aria-valuemax={100}><span className="video-progress-indeterminate" /></div>}
      {exporting && <div className="video-processing"><div className="video-progress-heading"><strong>Processing Your Video</strong><span>{progress}%</span></div><div className="video-progress-track" role="progressbar" aria-label="Video export progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><p>Creating a {prettyDuration(selectedDuration)} clip with the selected boundaries. The file is processed on this device.</p><button type="button" className="video-quiet-button" onClick={() => void cancelExport()}><X size={15} /> Cancel export</button></div>}
      {error && <p className="video-error" role="alert">{error}</p>}
      {(resultUrl || directSaved) && <div className="video-success" role="status"><span className="video-success-icon"><Check size={19} /></span><div><strong>Your Video Is Ready!</strong><p>{resultName} · {prettyDuration(selectedDuration)}{resultSize ? ` · ${prettyBytes(resultSize)}` : ''}</p></div>{resultUrl ? <button type="button" className="primary-button" onClick={downloadResult}><Download size={16} /> Download video</button> : <span className="video-saved-label">Saved to your selected location</span>}</div>}
      {resultUrl && <div className="video-export-preview"><strong>Preview exported clip</strong><video src={resultUrl} controls playsInline preload="metadata" aria-label="Preview of exported video" /></div>}
      <div className="video-capability-note"><ShieldCheck size={16} /><p>Precise trimming uses browser video encoders and may re-encode the selected section. Codec support varies by device; your source video is never uploaded.</p></div>
    </section>
  )
}
