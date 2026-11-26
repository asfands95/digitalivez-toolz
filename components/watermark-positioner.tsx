'use client'

import { useEffect, useRef } from 'react'
import { RotateCw } from 'lucide-react'

type Gesture = {
  pointerId: number
  mode: 'move' | 'rotate'
  startX: number
  startY: number
  startAngle: number
  startRotation: number
  originX: number
  originY: number
}

export function WatermarkPositioner({ x, y, rotation, onMove, onRotate, label, children }: {
  x: number
  y: number
  rotation: number
  onMove: (x: number, y: number) => void
  onRotate: (rotation: number) => void
  label: string
  children: React.ReactNode
}) {
  const gesture = useRef<Gesture | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const latest = useRef({ x, y, rotation, onMove, onRotate })
  latest.current = { x, y, rotation, onMove, onRotate }

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const current = gesture.current
      const bounds = stage.current?.parentElement?.getBoundingClientRect()
      if (!current || !bounds || current.pointerId !== event.pointerId) return
      if (current.mode === 'move') {
        latest.current.onMove(
          Math.max(0, Math.min(100, current.originX + (event.clientX - current.startX) / bounds.width * 100)),
          Math.max(0, Math.min(100, current.originY + (event.clientY - current.startY) / bounds.height * 100)),
        )
      } else {
        const centerX = bounds.left + latest.current.x / 100 * bounds.width
        const centerY = bounds.top + latest.current.y / 100 * bounds.height
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI
        const next = current.startRotation + angle - current.startAngle
        latest.current.onRotate(((next + 180) % 360 + 360) % 360 - 180)
      }
    }
    const end = (event: PointerEvent) => {
      if (gesture.current?.pointerId === event.pointerId) gesture.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [])

  const begin = (event: React.PointerEvent<HTMLElement>, mode: Gesture['mode']) => {
    const bounds = stage.current?.parentElement?.getBoundingClientRect()
    if (!bounds) return
    const centerX = bounds.left + x / 100 * bounds.width
    const centerY = bounds.top + y / 100 * bounds.height
    gesture.current = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      startRotation: rotation,
      originX: x,
      originY: y,
    }
    event.preventDefault()
    event.stopPropagation()
  }

  const nudge = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 5 : 1
    if (event.key === 'ArrowLeft') onMove(Math.max(0, x - amount), y)
    else if (event.key === 'ArrowRight') onMove(Math.min(100, x + amount), y)
    else if (event.key === 'ArrowUp') onMove(x, Math.max(0, y - amount))
    else if (event.key === 'ArrowDown') onMove(x, Math.min(100, y + amount))
    else return
    event.preventDefault()
  }

  return <div ref={stage} className="watermark-positioner" style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }} onPointerDown={event => begin(event, 'move')} onKeyDown={nudge} role="group" aria-label={`${label} placement; use arrow keys to move`} tabIndex={0}>
    {children}
    <span className="watermark-positioner-outline" aria-hidden="true"/>
    <button type="button" className="watermark-positioner-rotate" aria-label={`Drag to rotate ${label}`} title="Drag to rotate" onPointerDown={event => begin(event, 'rotate')} onClick={event => event.stopPropagation()}><RotateCw aria-hidden="true"/></button>
  </div>
}
