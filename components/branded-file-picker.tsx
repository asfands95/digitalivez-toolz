'use client'

import { useRef, useState } from 'react'
import { FilePlus2, GripVertical, Trash2, Upload } from 'lucide-react'

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let index = 0
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1 }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[index]}`
}

export function BrandedFilePicker({ files, onAdd, onRemove, onMove, multiple, accept, label, helper, error, maxBytes = 100 * 1024 * 1024 }: {
  files: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  onMove?: (from: number, to: number) => void
  multiple?: boolean
  accept: string
  label: string
  helper: string
  error?: string
  maxBytes?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [validation, setValidation] = useState('')

  function acceptFiles(incoming: File[]) {
    const accepted: File[] = []
    const allowed = accept.split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
    for (const file of incoming) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`
      const valid = allowed.some(type => type.startsWith('.') ? extension === type : type.endsWith('/*') ? file.type.startsWith(type.slice(0, -1)) : file.type === type)
      if (!valid) { setValidation(`${file.name}: choose a supported file format.`); continue }
      if (file.size > maxBytes) { setValidation(`${file.name}: files must be no larger than ${formatFileSize(maxBytes)}.`); continue }
      accepted.push(file)
    }
    if (accepted.length) {
      setValidation('')
      onAdd(multiple ? accepted : accepted.slice(0, 1))
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return <section className="browser-upload" aria-label={`${label} upload`}>
    <input ref={inputRef} className="sr-only" type="file" accept={accept} multiple={multiple} tabIndex={-1} aria-label={label} onChange={event => acceptFiles(Array.from(event.currentTarget.files || []))}/>
    <div className={`upload-dropzone${dragging ? ' upload-dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); acceptFiles(Array.from(event.dataTransfer.files)) }}>
      <span className="upload-icon"><Upload size={22}/></span>
      <div className="upload-copy"><strong>{files.length ? 'Add or replace files' : 'Drop files here'}</strong><span>{helper}</span></div>
      <button type="button" className="primary-button upload-button" onClick={() => inputRef.current?.click()}><FilePlus2 size={16}/>{label}</button>
    </div>
    {files.length > 0 && <ul className="selected-file-list" aria-label="Selected files">{files.map((file, index) => <li className="selected-file" key={`${file.name}-${file.lastModified}-${index}`}><span className="file-grip" aria-hidden="true"><GripVertical size={16}/></span><span className="selected-file-name" title={file.name}>{file.name}</span><span className="selected-file-size">{formatFileSize(file.size)}</span>{onMove && <div className="file-reorder"><button type="button" aria-label={`Move ${file.name} earlier`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>↑</button><button type="button" aria-label={`Move ${file.name} later`} disabled={index === files.length - 1} onClick={() => onMove(index, index + 1)}>↓</button></div>}<button type="button" className="remove-file" aria-label={`Remove ${file.name}`} onClick={() => onRemove(index)}><Trash2 size={15}/></button></li>)}</ul>}
    {(validation || error) && <p className="file-error" role="alert">{error || validation}</p>}
  </section>
}
