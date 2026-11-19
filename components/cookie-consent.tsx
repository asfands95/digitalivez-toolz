'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'

type ConsentChoice = 'accepted' | 'rejected' | 'unset' | 'loading'

const consentCookie = 'digitalivez_analytics_consent'
const cookieSettingsEvent = 'digitalivez:open-cookie-settings'

function readConsent(): ConsentChoice {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${consentCookie}=(accepted|rejected)(?:;|$)`))
  const value = match?.[1]
  return value === 'accepted' ? 'accepted' : value === 'rejected' ? 'rejected' : 'unset'
}

function saveConsent(choice: Exclude<ConsentChoice, 'unset' | 'loading'>) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${consentCookie}=${choice}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`
}

export function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>('loading')

  useEffect(() => {
    setChoice(readConsent())
    const reopen = () => setChoice('unset')
    window.addEventListener(cookieSettingsEvent, reopen)
    return () => window.removeEventListener(cookieSettingsEvent, reopen)
  }, [])

  function choose(nextChoice: 'accepted' | 'rejected') {
    saveConsent(nextChoice)
    if (nextChoice === 'rejected' && process.env.NODE_ENV === 'production') {
      window.location.reload()
      return
    }
    setChoice(nextChoice)
  }

  return (
    <>
      {process.env.NODE_ENV === 'production' && choice === 'accepted' && <Analytics />}
      {choice === 'unset' && (
        <aside className="cookie-consent" aria-label="Cookie and analytics preferences" aria-live="polite">
          <div className="cookie-consent-copy">
            <strong>Choose your analytics preference</strong>
            <p>Google Analytics uses cookies to help us understand how the site is used. Choose whether to allow analytics cookies. <Link href="/privacy">Read our privacy policy</Link>.</p>
            <small>Your choice is saved in a cookie for 6 months. You can change it any time in Cookie settings.</small>
          </div>
          <div className="cookie-consent-actions">
            <button type="button" className="cookie-reject" onClick={() => choose('rejected')}>Reject analytics cookies</button>
            <button type="button" className="cookie-accept" onClick={() => choose('accepted')}>Accept analytics</button>
          </div>
        </aside>
      )}
    </>
  )
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(cookieSettingsEvent))
}
