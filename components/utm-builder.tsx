'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, RotateCcw, Trash2 } from 'lucide-react'

type FormValues = {
  url: string
  source: string
  medium: string
  campaign: string
  term: string
  content: string
  id: string
  sourcePlatform: string
  creativeFormat: string
  marketingTactic: string
}

type CampaignLink = {
  id: string
  name: string
  source: string
  medium: string
  destination: string
  generated: string
}

const blankValues: FormValues = {
  url: '',
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
  id: '',
  sourcePlatform: '',
  creativeFormat: '',
  marketingTactic: '',
}

const presets = [
  ['Google Ads', 'google', 'cpc'],
  ['Facebook Ads', 'facebook', 'paid_social'],
  ['Instagram Ads', 'instagram', 'paid_social'],
  ['LinkedIn Ads', 'linkedin', 'paid_social'],
  ['TikTok Ads', 'tiktok', 'paid_social'],
  ['YouTube Ads', 'youtube', 'paid_video'],
  ['X Ads', 'x', 'paid_social'],
  ['Organic Facebook', 'facebook', 'social'],
  ['Organic Instagram', 'instagram', 'social'],
  ['Organic LinkedIn', 'linkedin', 'social'],
  ['Organic TikTok', 'tiktok', 'social'],
  ['Organic YouTube', 'youtube', 'video'],
  ['Pinterest', 'pinterest', 'social'],
  ['Email Marketing', 'email', 'email'],
  ['Newsletter', 'newsletter', 'email'],
  ['QR Code', 'qr_code', 'qr'],
  ['Affiliate Marketing', 'partner', 'affiliate'],
] as const

const standardFields: { key: keyof FormValues; label: string; placeholder: string; help: string; required?: boolean }[] = [
  { key: 'url', label: 'Website URL', placeholder: 'https://example.com/landing-page', help: 'The full page address visitors should land on.', required: true },
  { key: 'source', label: 'Campaign Source', placeholder: 'instagram', help: 'Where the traffic comes from, such as a platform or publisher.', required: true },
  { key: 'medium', label: 'Campaign Medium', placeholder: 'paid_social', help: 'The channel type, such as email, social, or paid search.', required: true },
  { key: 'campaign', label: 'Campaign Name', placeholder: 'black-friday-2026', help: 'A concise name for this promotion or initiative.', required: true },
  { key: 'term', label: 'Campaign Term (optional)', placeholder: 'running shoes', help: 'Often used to identify paid-search keywords.' },
  { key: 'content', label: 'Campaign Content (optional)', placeholder: 'header-link', help: 'Distinguishes similar links or creative variations.' },
]

const advancedFields: { key: keyof FormValues; label: string; parameter: string; placeholder: string; help: string }[] = [
  { key: 'id', label: 'Campaign ID', parameter: 'utm_id', placeholder: 'cmp-2026-04', help: 'An identifier for this campaign in your own reporting.' },
  { key: 'sourcePlatform', label: 'Source Platform', parameter: 'utm_source_platform', placeholder: 'meta', help: 'The platform responsible for sending campaign traffic.' },
  { key: 'creativeFormat', label: 'Creative Format', parameter: 'utm_creative_format', placeholder: 'video', help: 'The format of the campaign creative, when useful.' },
  { key: 'marketingTactic', label: 'Marketing Tactic', parameter: 'utm_marketing_tactic', placeholder: 'retargeting', help: 'The tactic used for the campaign, when useful.' },
]

const historyStorageKey = 'digitalivez-utm-recent-links-v1'
const utmParameters = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic']

function formatUtmValue(value: string, lowercase: boolean, hyphens: boolean) {
  let formatted = value.trim()
  if (lowercase) formatted = formatted.toLowerCase()
  if (hyphens) formatted = formatted.replace(/\s+/g, '-')
  return formatted
}

function isCampaignLink(value: unknown): value is CampaignLink {
  if (!value || typeof value !== 'object') return false
  const link = value as Partial<CampaignLink>
  return ['id', 'name', 'source', 'medium', 'destination', 'generated'].every(key => typeof link[key as keyof CampaignLink] === 'string')
}

export function UtmBuilder() {
  const [values, setValues] = useState<FormValues>(blankValues)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [lowercase, setLowercase] = useState(true)
  const [replaceSpaces, setReplaceSpaces] = useState(true)
  const [copied, setCopied] = useState(false)
  const [historyEnabled, setHistoryEnabled] = useState(false)
  const [history, setHistory] = useState<CampaignLink[]>([])
  const [notice, setNotice] = useState('')
  const [historyNotice, setHistoryNotice] = useState('')

  useEffect(() => {
    if (!historyEnabled) return
    try {
      const stored = window.localStorage.getItem(historyStorageKey)
      const parsed: unknown = stored ? JSON.parse(stored) : []
      setHistory(Array.isArray(parsed) ? parsed.filter(isCampaignLink).slice(0, 10) : [])
      setHistoryNotice('')
    } catch {
      setHistoryNotice('This browser does not allow local storage, so recent links cannot be saved here.')
    }
  }, [historyEnabled])

  const destination = useMemo(() => {
    if (!values.url.trim()) return { url: null, error: '' }
    try {
      const url = new URL(values.url.trim())
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error('invalid')
      return { url, error: '' }
    } catch {
      return { url: null, error: 'Enter a valid website URL starting with https:// or http://.' }
    }
  }, [values.url])

  const requiredValuesReady = Boolean(values.source.trim() && values.medium.trim() && values.campaign.trim())
  const generated = useMemo(() => {
    if (!destination.url || !requiredValuesReady) return ''
    const url = new URL(destination.url.toString())
    utmParameters.forEach(parameter => url.searchParams.delete(parameter))

    const entries: [string, string][] = [
      ['utm_source', values.source],
      ['utm_medium', values.medium],
      ['utm_campaign', values.campaign],
      ['utm_term', values.term],
      ['utm_content', values.content],
      ...advancedFields.map(field => [field.parameter, values[field.key]] as [string, string]),
    ]

    entries.forEach(([parameter, value]) => {
      const formatted = formatUtmValue(value, lowercase, replaceSpaces)
      if (formatted) url.searchParams.set(parameter, formatted)
    })

    return url.toString()
  }, [destination.url, requiredValuesReady, values, lowercase, replaceSpaces])

  const updateField = (key: keyof FormValues, value: string) => {
    setValues(current => ({ ...current, [key]: value }))
    setCopied(false)
    setNotice('')
  }

  const applyPreset = (name: string, source: string, medium: string) => {
    setSelectedPreset(name)
    setValues(current => ({ ...current, source, medium }))
    setNotice('')
  }

  const copyText = async (text: string, onSuccess?: () => void) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      onSuccess?.()
      setNotice('Campaign URL copied to your clipboard.')
    } catch {
      setNotice('Could not copy automatically. Select and copy the URL manually.')
    }
  }

  const saveLink = () => {
    if (!historyEnabled || !generated || !destination.url) return
    const item: CampaignLink = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: formatUtmValue(values.campaign, lowercase, replaceSpaces),
      source: formatUtmValue(values.source, lowercase, replaceSpaces),
      medium: formatUtmValue(values.medium, lowercase, replaceSpaces),
      destination: destination.url.toString(),
      generated,
    }
    const updated = [item, ...history.filter(link => link.generated !== generated)].slice(0, 10)
    try {
      window.localStorage.setItem(historyStorageKey, JSON.stringify(updated))
      setHistory(updated)
      setHistoryNotice('')
      setNotice('Campaign URL saved on this device.')
    } catch {
      setHistoryNotice('This browser does not allow local storage, so recent links cannot be saved here.')
    }
  }

  const loadLink = (link: CampaignLink) => {
    setValues({ ...blankValues, url: link.destination, source: link.source, medium: link.medium, campaign: link.name })
    setSelectedPreset('')
    setNotice('Campaign reloaded into the builder.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearHistory = () => {
    try {
      window.localStorage.removeItem(historyStorageKey)
      setHistory([])
      setHistoryNotice('Recent campaign links cleared from this device.')
    } catch {
      setHistoryNotice('This browser does not allow access to saved history.')
    }
  }

  const resetBuilder = () => {
    setValues(blankValues)
    setSelectedPreset('')
    setCopied(false)
    setNotice('Builder cleared.')
  }

  const testUrl = () => {
    if (!generated || !destination.url) return
    window.open(generated, '_blank', 'noopener,noreferrer')
  }

  const ready = Boolean(generated)

  return (
    <div className="utm-builder-wrap">
      <section className="calculator-box utm-builder" aria-labelledby="utm-builder-title">
        <div className="calc-head">
          <div>
            <span className="eyebrow">CAMPAIGN BUILDER</span>
            <h2 id="utm-builder-title">Build your tracked URL</h2>
            <p>Add standard and optional campaign parameters to a valid web address.</p>
          </div>
        </div>
        <div className="calc-body">
          <section className="utm-quick-select" aria-labelledby="utm-presets-title">
            <div className="utm-section-heading">
              <div>
                <h3 id="utm-presets-title">Quick Select: Choose Your Campaign Platform</h3>
                <p>Choose an editable starting point for source and medium.</p>
              </div>
              {selectedPreset && <button type="button" className="utm-clear-selection" onClick={() => setSelectedPreset('')}>Clear selection</button>}
            </div>
            <select
              className="text-input utm-preset-select"
              aria-label="Campaign platform presets"
              value={selectedPreset}
              onChange={event => {
                const preset = presets.find(([name]) => name === event.target.value)
                if (preset) applyPreset(...preset)
                else setSelectedPreset('')
              }}
            >
              <option value="">Choose a campaign platform</option>
              {presets.map(([name]) => <option key={name} value={name}>{name}</option>)}
            </select>
          </section>

          <fieldset className="utm-format-settings">
            <legend>Smart UTM Formatting</legend>
            <label><input type="checkbox" checked={lowercase} onChange={event => setLowercase(event.target.checked)} /> Convert UTM values to lowercase</label>
            <label><input type="checkbox" checked={replaceSpaces} onChange={event => setReplaceSpaces(event.target.checked)} /> Replace spaces with hyphens</label>
            <p>Formatting applies to UTM values only. Your original inputs and destination URL stay unchanged.</p>
          </fieldset>

          <div className="input-grid utm-input-grid">
            {standardFields.map(field => {
              const isUrl = field.key === 'url'
              const fieldError = isUrl && destination.error
              return (
                <label className="field" key={field.key}>
                  <span>{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</span>
                  <input
                    className="text-input"
                    type={isUrl ? 'url' : 'text'}
                    inputMode={isUrl ? 'url' : undefined}
                    autoComplete="off"
                    required={field.required}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={`${field.key}-help${fieldError ? ` ${field.key}-error` : ''}`}
                    placeholder={field.placeholder}
                    value={values[field.key]}
                    onChange={event => updateField(field.key, event.target.value)}
                  />
                  <small className="field-help" id={`${field.key}-help`}>{field.help}</small>
                  {fieldError && <small className="utm-field-error" id={`${field.key}-error`} role="alert">{fieldError}</small>}
                </label>
              )
            })}
          </div>

          <details className="utm-advanced">
            <summary>Advanced UTM Parameters</summary>
            <p className="utm-advanced-note">Optional fields for additional campaign context. Reporting support varies by analytics platform and configuration.</p>
            <div className="input-grid utm-input-grid">
              {advancedFields.map(field => (
                <label className="field" key={field.key}>
                  <span>{field.label} <code>{field.parameter}</code></span>
                  <input className="text-input" type="text" autoComplete="off" placeholder={field.placeholder} value={values[field.key]} onChange={event => updateField(field.key, event.target.value)} />
                  <small className="field-help">{field.help}</small>
                </label>
              ))}
            </div>
          </details>

          <section className={`utm-preview${ready ? ' is-ready' : ''}`} aria-labelledby="utm-preview-title">
            <div className="utm-preview-heading">
              <div>
                <span className="result-label">YOUR CAMPAIGN URL</span>
                <h3 id="utm-preview-title">Generated tracking link</h3>
              </div>
              {ready && <span className="utm-ready-badge"><Check size={14} /> Ready</span>}
            </div>
            {ready ? (
              <output className="utm-result" aria-live="polite">{generated}</output>
            ) : (
              <p className="utm-empty-state" aria-live="polite">
                {destination.error || 'Add a valid website URL, campaign source, medium, and name to preview your tracking link.'}
              </p>
            )}
            <div className="utm-actions">
              <button type="button" className="primary-button" disabled={!ready} onClick={() => void copyText(generated, () => setCopied(true))}>
                {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy URL'}
              </button>
              <button type="button" className="secondary-button" disabled={!ready} onClick={testUrl}>
                <ExternalLink size={16} /> Test URL
              </button>
              {historyEnabled && <button type="button" className="secondary-button" disabled={!ready} onClick={saveLink}>Save link</button>}
              <button type="button" className="text-button" onClick={resetBuilder}><RotateCcw size={15} /> Clear</button>
            </div>
            <p className="utm-status" role="status" aria-live="polite">{notice}</p>
            <p className="privacy-note">Your campaign URL is generated locally in your browser. Existing non-UTM URL parameters are preserved.</p>
          </section>
        </div>
      </section>

      <section className="utm-history" aria-labelledby="utm-history-title">
        <div className="utm-history-heading">
          <div>
            <span className="eyebrow">ON THIS DEVICE</span>
            <h2 id="utm-history-title">Recent Campaign Links</h2>
            <p>Saved history stays in your browser and can be deleted at any time.</p>
          </div>
          <label className="utm-history-toggle"><input type="checkbox" checked={historyEnabled} onChange={event => { setHistoryEnabled(event.target.checked); setHistoryNotice('') }} /> Save generated links on this device</label>
        </div>
        {historyNotice && <p className="utm-history-notice" role="status">{historyNotice}</p>}
        {history.length > 0 ? (
          <>
            <div className="utm-history-list">
              {history.map(link => (
                <article className="utm-history-item" key={link.id}>
                  <div>
                    <h3>{link.name || 'Campaign link'}</h3>
                    <p>{link.source} · {link.medium}</p>
                    <code>{link.generated}</code>
                  </div>
                  <div className="utm-history-actions">
                    <button type="button" className="secondary-button" onClick={() => void copyText(link.generated)}>Copy</button>
                    <button type="button" className="secondary-button" onClick={() => loadLink(link)}>Reload</button>
                  </div>
                </article>
              ))}
            </div>
            <button type="button" className="utm-clear-history" onClick={clearHistory}><Trash2 size={15} /> Clear history</button>
          </>
        ) : (
          <p className="utm-history-empty">{historyEnabled ? 'No recent links yet. Generate a URL and choose Save link to keep it here.' : 'History is off. Turn it on to save up to 10 campaign links in this browser.'}</p>
        )}
      </section>
    </div>
  )
}
