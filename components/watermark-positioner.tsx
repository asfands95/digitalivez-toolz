'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCw } from 'lucide-react'

type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
type Gesture = {
  pointerId: number
  mode: 'move' | 'rotate' | 'resize'
  direction?: ResizeDirection
  startX: number
  startY: number
  startAngle: number
  startRotation: number
  originX: number
  originY: number
  startScaleX: number
  startScaleY: number
  width: number
  height: number
}

const resizeDirections: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']

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
  const [scale, setScale] = useState({ x: 1, y: 1 })
  const latest = useRef({ x, y, rotation, onMove, onRotate, scale })
  latest.current = { x, y, rotation, onMove, onRotate, scale }

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
      } else if (current.mode === 'rotate') {
        const centerX = bounds.left + latest.current.x / 100 * bounds.width
        const centerY = bounds.top + latest.current.y / 100 * bounds.height
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI
        const next = current.startRotation + angle - current.startAngle
        latest.current.onRotate(((next + 180) % 360 + 360) % 360 - 180)
      } else {
        const angle = latest.current.rotation * Math.PI / 180
        const deltaX = (event.clientX - current.startX) * Math.cos(angle) + (event.clientY - current.startY) * Math.sin(angle)
        const deltaY = -(event.clientX - current.startX) * Math.sin(angle) + (event.clientY - current.startY) * Math.cos(angle)
        const direction = current.direction || 'se'
        setScale({
          x: direction.includes('e') || direction.includes('w') ? Math.max(0.25, Math.min(4, current.startScaleX + deltaX * (direction.includes('w') ? -1 : 1) / Math.max(1, current.width))) : current.startScaleX,
          y: direction.includes('n') || direction.includes('s') ? Math.max(0.25, Math.min(4, current.startScaleY + deltaY * (direction.includes('n') ? -1 : 1) / Math.max(1, current.height))) : current.startScaleY,
        })
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

  const begin = (event: React.PointerEvent<HTMLElement>, mode: Gesture['mode'], direction?: ResizeDirection) => {
    const bounds = stage.current?.parentElement?.getBoundingClientRect()
    const elementBounds = stage.current?.getBoundingClientRect()
    if (!bounds || !elementBounds) return
    const centerX = bounds.left + x / 100 * bounds.width
    const centerY = bounds.top + y / 100 * bounds.height
    gesture.current = {
      pointerId: event.pointerId,
      mode,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      startRotation: rotation,
      originX: x,
      originY: y,
      startScaleX: scale.x,
      startScaleY: scale.y,
      width: elementBounds.width,
      height: elementBounds.height,
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

  return <div ref={stage} className="watermark-positioner" style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale.x}, ${scale.y})` }} onPointerDown={event => begin(event, 'move')} onKeyDown={nudge} role="group" aria-label={`${label} placement; use arrow keys to move`} tabIndex={0}>
    {children}
    <span className="watermark-positioner-outline" aria-hidden="true"/>
    {resizeDirections.map(direction => <button key={direction} type="button" className={`watermark-positioner-resize watermark-positioner-resize-${direction}`} aria-label={`Drag to resize ${label} ${direction}`} title={`Drag to resize ${label}`} onPointerDown={event => begin(event, 'resize', direction)} onClick={event => event.stopPropagation()}/>) }
    <button type="button" className="watermark-positioner-rotate" aria-label={`Drag to rotate ${label}`} title="Drag to rotate" onPointerDown={event => begin(event, 'rotate')} onClick={event => event.stopPropagation()}><RotateCw aria-hidden="true"/></button>
  </div>
}
