'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'

export function NavigationProgress({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const pendingPath = useRef(pathname)
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isLoading || pathname === pendingPath.current) return

    setIsComplete(true)
    finishTimer.current = setTimeout(() => {
      setIsLoading(false)
      setIsComplete(false)
    }, 180)

    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current)
    }
  }, [isLoading, pathname])

  useEffect(() => () => {
    if (finishTimer.current) clearTimeout(finishTimer.current)
  }, [])

  function startNavigation(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const target = event.target
    if (!(target instanceof Element)) return

    const link = target.closest('a[href]')
    if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return

    const destination = new URL(link.href, window.location.href)
    if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return

    if (finishTimer.current) clearTimeout(finishTimer.current)
    pendingPath.current = window.location.pathname
    setIsComplete(false)
    setIsLoading(true)
  }

  return (
    <div className="navigation-shell" onClickCapture={startNavigation}>
      {isLoading && (
        <div className={`navigation-progress${isComplete ? ' navigation-progress-complete' : ''}`} role="progressbar" aria-label="Loading page" aria-valuetext="Loading page">
          <span />
        </div>
      )}
      {children}
    </div>
  )
}
