'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Download, FileImage, FileJson, FileText, ImagePlus, Layers3, Minus, Plus, Redo2, RotateCcw, Save, Search, Shield, Undo2, Upload, X } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { listBrands, listProjects, removeProject, saveBrand, saveProject, type StudioProject } from './storage'

type StampShape = 'circle' | 'oval' | 'rectangle' | 'rounded' | 'hexagon' | 'octagon' | 'square'
type StampDesign = { template: string; shape: StampShape; top: string; center: string; bottom: string; extra: string; ink: string; background: string; transparent: boolean; border: number; innerRing: boolean; font: string; fontSize: number; width: number; height: number; distressed: boolean; mirrored: boolean; logo: string }
type Template = Pick<StampDesign, 'shape' | 'top' | 'center' | 'bottom' | 'extra'> & { id: string; name: string; group: string }
type BrandKit = { id: string; name: string; company: string; tagline: string; email: string; phone: string; website: string; address: string; primary: string; accent: string; logo: string; updatedAt: string }

const templates: Template[] = [
  { id: 'company-seal', name: 'Classic company seal', group: 'Business', shape: 'circle', top: 'NORTHSTAR COMPANY', center: 'EST. 2012', bottom: 'AUSTIN · TEXAS', extra: 'AUTHENTIC' },
  { id: 'double-ring', name: 'Double-ring seal', group: 'Business', shape: 'circle', top: 'HERITAGE & CO.', center: 'H', bottom: 'TRUSTED SINCE 1988', extra: 'REGISTERED' },
  { id: 'minimal-corporate', name: 'Minimal corporate', group: 'Business', shape: 'rectangle', top: '', center: 'NORTHSTAR', bottom: 'DESIGN · STRATEGY · STUDIO', extra: 'AUSTIN, TX' },
  { id: 'company-address', name: 'Company and address', group: 'Business', shape: 'rounded', top: '', center: 'FIELDWORK SUPPLY', bottom: '18 MARKET STREET · PORTLAND', extra: 'OR 97205' },
  { id: 'logo-centered', name: 'Centered mark', group: 'Business', shape: 'circle', top: 'FIELDWORK SUPPLY', center: '✦', bottom: 'MADE WITH PURPOSE', extra: 'SINCE 2004' },
  { id: 'monogram', name: 'Monogram seal', group: 'Business', shape: 'circle', top: 'MASON & MILLER', center: 'M M', bottom: 'ESTABLISHED 1996', extra: 'CHICAGO' },
  { id: 'registration', name: 'Registered company', group: 'Business', shape: 'octagon', top: 'VERIFIED BUSINESS', center: 'REGISTERED', bottom: 'NO. 8841-203', extra: 'UNITED STATES' },
  { id: 'executive', name: 'Executive office', group: 'Business', shape: 'oval', top: 'EXECUTIVE OFFICE', center: 'APPROVED', bottom: 'OPERATIONS DIVISION', extra: 'REVIEWED' },
  { id: 'agency', name: 'Creative agency', group: 'Business', shape: 'rounded', top: '', center: 'FORM & FUNCTION', bottom: 'CREATIVE PARTNERS', extra: 'NEW YORK · LONDON' },
  { id: 'engineering', name: 'Engineering firm', group: 'Business', shape: 'hexagon', top: 'SUMMIT ENGINEERING', center: 'SE', bottom: 'STRUCTURAL · CIVIL · DESIGN', extra: 'LICENSED PROFESSIONALS' },
  { id: 'approved', name: 'Approved', group: 'Office', shape: 'rectangle', top: '', center: 'APPROVED', bottom: '', extra: 'DATE: __________' },
  { id: 'received', name: 'Received', group: 'Office', shape: 'rounded', top: '', center: 'RECEIVED', bottom: '', extra: 'DATE: __________' },
  { id: 'paid', name: 'Paid in full', group: 'Office', shape: 'circle', top: 'PAYMENT STATUS', center: 'PAID', bottom: 'THANK YOU', extra: 'DATE: __________' },
  { id: 'copy', name: 'Copy', group: 'Office', shape: 'rectangle', top: 'DOCUMENT CONTROL', center: 'COPY', bottom: 'FOR INTERNAL USE', extra: '' },
  { id: 'original', name: 'Original', group: 'Office', shape: 'rectangle', top: 'DOCUMENT CONTROL', center: 'ORIGINAL', bottom: 'MASTER RECORD', extra: '' },
  { id: 'confidential', name: 'Confidential', group: 'Office', shape: 'hexagon', top: 'HANDLE WITH CARE', center: 'CONFIDENTIAL', bottom: 'AUTHORIZED PERSONNEL ONLY', extra: '' },
  { id: 'draft', name: 'Draft review', group: 'Office', shape: 'rounded', top: 'WORKING DOCUMENT', center: 'DRAFT', bottom: 'NOT FOR DISTRIBUTION', extra: 'REVISION: ______' },
  { id: 'urgent', name: 'Urgent', group: 'Office', shape: 'octagon', top: 'ACTION REQUIRED', center: 'URGENT', bottom: 'PLEASE RESPOND', extra: 'PRIORITY 01' },
  { id: 'reviewed', name: 'Reviewed', group: 'Office', shape: 'oval', top: 'QUALITY ASSURANCE', center: 'REVIEWED', bottom: 'READY FOR NEXT STEP', extra: 'INITIALS: ____' },
  { id: 'checked', name: 'Checked', group: 'Office', shape: 'circle', top: 'INSPECTION RECORD', center: '✓', bottom: 'CHECKED & VERIFIED', extra: 'DATE: __________' },
  { id: 'inspected', name: 'Inspected', group: 'Office', shape: 'hexagon', top: 'QUALITY CONTROL', center: 'INSPECTED', bottom: 'MEETS SPECIFICATION', extra: 'QC · PASS' },
  { id: 'shipped', name: 'Shipped', group: 'Office', shape: 'rounded', top: 'FULFILLMENT', center: 'SHIPPED', bottom: 'THANK YOU FOR YOUR ORDER', extra: 'TRACKING: __________' },
  { id: 'delivered', name: 'Delivered', group: 'Office', shape: 'rectangle', top: 'DELIVERY CONFIRMATION', center: 'DELIVERED', bottom: 'RECEIVED IN GOOD ORDER', extra: 'DATE: __________' },
  { id: 'school', name: 'Education seal', group: 'Professional', shape: 'circle', top: 'OAK & RIVER ACADEMY', center: 'LEARN · GROW · LEAD', bottom: 'KNOWLEDGE FOR EVERYONE', extra: 'EST. 1974' },
  { id: 'medical', name: 'Medical practice', group: 'Professional', shape: 'circle', top: 'RIVERBEND FAMILY CARE', center: '+', bottom: 'PATIENT SERVICES', extra: 'CARE WITH COMPASSION' },
  { id: 'accounting', name: 'Accounting firm', group: 'Professional', shape: 'oval', top: 'CLEARVIEW ACCOUNTING', center: 'VERIFIED', bottom: 'BOOKKEEPING · TAX · ADVISORY', extra: 'CLIENT COPY' },
  { id: 'real-estate', name: 'Real estate', group: 'Professional', shape: 'rectangle', top: '', center: 'KEYSTONE PROPERTY GROUP', bottom: 'REAL ESTATE · EST. 2008', extra: 'DENVER, COLORADO' },
  { id: 'consulting', name: 'Consultancy', group: 'Professional', shape: 'hexagon', top: 'NORTHLINE ADVISORS', center: 'INSIGHT → IMPACT', bottom: 'STRATEGY & OPERATIONS', extra: 'INDEPENDENT CONSULTANTS' },
  { id: 'quality', name: 'Quality control', group: 'Professional', shape: 'octagon', top: 'QUALITY SYSTEMS', center: 'PASSED', bottom: 'INSPECTED & APPROVED', extra: 'BATCH: __________' },
  { id: 'personal', name: 'Personal address', group: 'Personal', shape: 'rounded', top: 'THE MORGAN FAMILY', center: '42 WILLOW LANE', bottom: 'SAVANNAH, GA 31401', extra: 'EST. 2010' },
  { id: 'handmade', name: 'Handmade with care', group: 'Personal', shape: 'circle', top: 'MADE BY HAND', center: 'WITH CARE', bottom: 'THANK YOU FOR SHOPPING SMALL', extra: '✦  ✦  ✦' },
  { id: 'thank-you', name: 'Thank you', group: 'Personal', shape: 'oval', top: 'A LITTLE NOTE TO SAY', center: 'THANK YOU', bottom: 'FOR BEING HERE', extra: 'MADE WITH LOVE' },
]

const initialDesign: StampDesign = { template: 'company-seal', shape: 'circle', top: 'NORTHSTAR COMPANY', center: 'EST. 2012', bottom: 'AUSTIN · TEXAS', extra: 'AUTHENTIC', ink: '#1e3a5f', background: '#ffffff', transparent: true, border: 5, innerRing: true, font: 'Georgia, serif', fontSize: 26, width: 40, height: 40, distressed: false, mirrored: false, logo: '' }
const fonts = ['Georgia, serif', 'Arial, sans-serif', 'Impact, sans-serif', 'Courier New, monospace', 'Trebuchet MS, sans-serif', 'Palatino, serif', 'Verdana, sans-serif', 'Times New Roman, serif', 'Arial Narrow, sans-serif', 'Garamond, serif', 'system-ui, sans-serif', 'serif']
const categories = ['All', 'Business', 'Office', 'Professional', 'Personal']
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}`

function escapeXml(value: string) { return value.replace(/[<>&'"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!) }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500) }
function safeSvgData(svgText: string): string {
  const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') throw new Error('Choose a valid SVG image.')
  parsed.querySelectorAll('script,foreignObject,iframe,object,embed,style,link').forEach(element => element.remove())
  parsed.querySelectorAll('*').forEach(element => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (name.startsWith('on') || name === 'style' || (['href', 'xlink:href'].includes(name) && !value.startsWith('#') && !/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(value))) element.removeAttribute(attribute.name)
    }
  })
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(parsed.documentElement))))}`
}
function safeLogoData(value: unknown) {
  if (typeof value !== 'string' || !value) return ''
  if (value.length > 7 * 1024 * 1024) throw new Error('Project logo is too large.')
  const svgMatch = value.match(/^data:image\/svg\+xml;base64,([a-z\d+/=]+)$/i)
  if (svgMatch) return safeSvgData(new TextDecoder().decode(Uint8Array.from(atob(svgMatch[1]), character => character.charCodeAt(0))))
  if (/^data:image\/(?:png|jpeg|webp);base64,[a-z\d+/=]+$/i.test(value)) return value
  throw new Error('Project contains an unsupported logo image.')
}

function shapePath(shape: StampShape) {
  if (shape === 'hexagon') return 'M140 78 L260 78 L330 240 L260 402 L140 402 L70 240 Z'
  if (shape === 'octagon') return 'M145 62 L255 62 L338 145 L338 335 L255 418 L145 418 L62 335 L62 145 Z'
  if (shape === 'oval') return 'M58 240 C58 135 142 75 200 75 C258 75 342 135 342 240 C342 345 258 405 200 405 C142 405 58 345 58 240 Z'
  if (shape === 'rectangle') return 'M52 95 H348 V385 H52 Z'
  if (shape === 'rounded') return 'M72 80 H328 Q350 80 350 102 V378 Q350 400 328 400 H72 Q50 400 50 378 V102 Q50 80 72 80 Z'
  if (shape === 'square') return 'M70 110 H330 V370 H70 Z'
  return 'M200 50 A190 190 0 1 1 199.9 50 Z'
}

function StampArtwork({ design, svgRef }: { design: StampDesign; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const frame = shapePath(design.shape)
  return <svg ref={svgRef} className="stamp-artwork" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460" width={`${design.width}mm`} height={`${design.height}mm`} role="img" aria-label={`${design.center || design.top || 'Custom'} stamp design`}>
    <defs>
      <path id="stamp-top-arc" d="M 78 230 A 122 122 0 0 1 322 230" />
      <path id="stamp-bottom-arc" d="M 78 230 A 122 122 0 0 0 322 230" />
      {design.distressed && <filter id="stamp-distress"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="8"/><feComposite operator="in" in2="SourceGraphic"/><feBlend in="SourceGraphic" mode="multiply"/></filter>}
    </defs>
    {design.transparent ? null : <rect width="400" height="460" fill={design.background} />}
    <g transform={design.mirrored ? 'translate(400 0) scale(-1 1)' : undefined} fill="none" stroke={design.ink} strokeWidth={design.border} strokeLinejoin="round" filter={design.distressed ? 'url(#stamp-distress)' : undefined}>
      <path d={frame} />
      {design.innerRing && <path d={design.shape === 'circle' ? 'M200 78 A162 162 0 1 1 199.9 78 Z' : design.shape === 'oval' ? 'M84 240 C84 151 152 101 200 101 C248 101 316 151 316 240 C316 329 248 379 200 379 C152 379 84 329 84 240 Z' : 'M92 132 H308 V348 H92 Z'} strokeWidth={Math.max(1, design.border * 0.52)} />}
      {design.logo ? <image href={design.logo} x="168" y="172" width="64" height="54" preserveAspectRatio="xMidYMid meet" /> : null}
      <path d="M 84 230 A 116 116 0 0 1 316 230" id="stamp-top-text-path" stroke="none" />
      <path d="M 84 230 A 116 116 0 0 0 316 230" id="stamp-bottom-text-path" stroke="none" />
    </g>
    <g fill={design.ink} textAnchor="middle" fontFamily={design.font} fontWeight="700" filter={design.distressed ? 'url(#stamp-distress)' : undefined}>
      {design.top && <text fontSize={design.fontSize * 0.55} letterSpacing="2.6"><textPath href="#stamp-top-arc" startOffset="50%">{escapeXml(design.top)}</textPath></text>}
      {design.bottom && <text fontSize={design.fontSize * 0.42} letterSpacing="2.2"><textPath href="#stamp-bottom-arc" startOffset="50%">{escapeXml(design.bottom)}</textPath></text>}
      <text x="200" y={design.logo ? 275 : 250} fontSize={design.fontSize} letterSpacing="1.4">{escapeXml(design.center)}</text>
      {design.extra && <text x="200" y="305" fontSize={Math.max(12, design.fontSize * 0.34)} letterSpacing="1.6">{escapeXml(design.extra)}</text>}
    </g>
  </svg>
}

export function StampGenerator() {
  const [design, setDesign] = useState(initialDesign)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'templates' | 'preview' | 'design'>('preview')
  const [status, setStatus] = useState('All design work stays on this device.')
  const [history, setHistory] = useState<StampDesign[]>([])
  const [future, setFuture] = useState<StampDesign[]>([])
  const [projects, setProjects] = useState<StudioProject[]>([])
  const [brands, setBrands] = useState<BrandKit[]>([])
  const [brandName, setBrandName] = useState('My brand')
  const [projectName, setProjectName] = useState('My company stamp')
  const [zoom, setZoom] = useState(100)
  const [hydrated, setHydrated] = useState(false)
  const [savedState, setSavedState] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const filteredTemplates = useMemo(() => templates.filter(item => (activeCategory === 'All' || item.group === activeCategory) && `${item.name} ${item.group} ${item.top} ${item.center}`.toLowerCase().includes(search.toLowerCase())), [activeCategory, search])

  useEffect(() => {
    setHydrated(true)
    void Promise.all([listProjects('stamp'), listBrands<BrandKit>()]).then(([items, savedBrands]) => { setProjects(items); setBrands(savedBrands); const draft = items.find(item => item.id === 'stamp-autosave'); if (draft) setDesign(draft.payload as StampDesign) }).catch(() => setStatus('Browser storage is unavailable; download a project file to keep a copy.'))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const timer = window.setTimeout(() => {
      void saveProject({ id: 'stamp-autosave', name: 'Stamp auto-save', tool: 'stamp', updatedAt: new Date().toISOString(), payload: design }).then(() => setSavedState('Saved on this device')).catch(() => setSavedState('Auto-save unavailable'))
    }, 450)
    return () => window.clearTimeout(timer)
  }, [design, hydrated])

  function updateDesign(patch: Partial<StampDesign>) {
    setHistory(current => [...current.slice(-39), design])
    setFuture([])
    setDesign(current => ({ ...current, ...patch }))
  }

  function applyTemplate(template: Template) {
    updateDesign({ template: template.id, shape: template.shape, top: template.top, center: template.center, bottom: template.bottom, extra: template.extra })
    setStatus(`${template.name} loaded. Customize any field.`)
    setTab('preview')
  }

  async function loadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setStatus('Choose a PNG, JPG, WebP, or SVG image under 5 MB.')
      input.value = ''
      return
    }
    try {
      const data = file.type === 'image/svg+xml' ? safeSvgData(await file.text()) : await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file) })
      updateDesign({ logo: data })
      setStatus(`${file.name} added to your stamp.`)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'The image could not be read.') }
    input.value = ''
  }

  async function exportSvg() {
    if (!svgRef.current) return
    const svg = new XMLSerializer().serializeToString(svgRef.current)
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'custom-stamp.svg')
    setStatus('Vector SVG downloaded.')
  }

  async function exportPng() {
    if (!svgRef.current) return
    const source = new XMLSerializer().serializeToString(svgRef.current)
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(design.width / 25.4 * 300)
      canvas.height = Math.round(design.height / 25.4 * 300)
      const context = canvas.getContext('2d')
      if (!context) { setStatus('PNG export is unavailable in this browser.'); return }
      if (!design.transparent) { context.fillStyle = design.background; context.fillRect(0, 0, canvas.width, canvas.height) }
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
      const width = image.width * scale
      const height = image.height * scale
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
      canvas.toBlob(blob => { if (blob) { downloadBlob(blob, 'custom-stamp.png'); setStatus(`PNG downloaded at 300 DPI (${canvas.width} × ${canvas.height} px).`) } else setStatus('The PNG could not be created.') }, 'image/png')
      URL.revokeObjectURL(image.src)
    }
    image.onerror = () => { URL.revokeObjectURL(image.src); setStatus('Could not render the SVG for PNG export.') }
    image.src = URL.createObjectURL(svgBlob)
  }

  async function exportPdf() {
    if (!svgRef.current) return
    try {
      const source = new XMLSerializer().serializeToString(svgRef.current)
      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.src = URL.createObjectURL(svgBlob)
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 1600; canvas.height = 1840
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas export is unavailable.')
      if (!design.transparent) { context.fillStyle = design.background; context.fillRect(0, 0, canvas.width, canvas.height) }
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
      const width = image.width * scale
      const height = image.height * scale
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
      URL.revokeObjectURL(image.src)
      const png = await new Promise<Uint8Array>((resolve, reject) => canvas.toBlob(blob => blob ? blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer))) : reject(new Error('Could not render stamp.')), 'image/png'))
      const pdf = await PDFDocument.create()
      const page = pdf.addPage([design.width / 25.4 * 72, design.height / 25.4 * 72])
      const embedded = await pdf.embedPng(png)
      page.drawImage(embedded, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
      downloadBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), 'custom-stamp.pdf')
      setStatus(`Print-size PDF downloaded (${design.width} × ${design.height} mm).`)
    } catch { setStatus('PDF export could not be created. Try downloading SVG or PNG instead.') }
  }

  function exportProject() { downloadBlob(new Blob([JSON.stringify({ schemaVersion: 1, tool: 'stamp', design }, null, 2)], { type: 'application/json' }), 'stamp-project.json'); setStatus('Editable project file downloaded.') }
  async function importProject(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget; const file = input.files?.[0]; if (!file) return
    try { const parsed = JSON.parse(await file.text()); if (parsed.tool !== 'stamp' || !parsed.design || typeof parsed.design !== 'object') throw new Error('Choose a Stamp Generator project JSON file.'); const imported = { ...initialDesign, ...parsed.design } as StampDesign; if (!['circle','oval','rectangle','rounded','hexagon','octagon','square'].includes(imported.shape) || !fonts.includes(imported.font) || !/^#[\da-f]{6}$/i.test(imported.ink) || !/^#[\da-f]{6}$/i.test(imported.background) || ![imported.top, imported.center, imported.bottom, imported.extra].every(value => typeof value === 'string' && value.length <= 160)) throw new Error('This stamp project contains invalid design settings.'); updateDesign({ ...imported, width: Math.min(100, Math.max(10, Number(imported.width) || 40)), height: Math.min(100, Math.max(10, Number(imported.height) || 40)), border: Math.min(12, Math.max(1, Number(imported.border) || 5)), fontSize: Math.min(42, Math.max(18, Number(imported.fontSize) || 26)), logo: safeLogoData(imported.logo) }); setStatus('Stamp project opened.') } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not open this project file.') }
    input.value = ''
  }

  async function saveNamedProject() {
    try {
      const project = { id: makeId(), name: projectName.trim() || 'Untitled stamp', tool: 'stamp' as const, updatedAt: new Date().toISOString(), payload: design }
      await saveProject(project); setProjects(await listProjects('stamp')); setStatus(`“${project.name}” saved in this browser.`)
    } catch { setStatus('Could not save to browser storage. Download the project JSON instead.') }
  }

  async function reopenProject(project: StudioProject) { setDesign(project.payload as StampDesign); setProjectName(project.name); setStatus(`Opened “${project.name}”.`) }
  async function deleteProject(project: StudioProject) { try { await removeProject(project.id); setProjects(await listProjects('stamp')); setStatus(`“${project.name}” deleted.`) } catch { setStatus('Could not delete this saved project.') } }
  async function saveBrandProfile() { try { const brand = { id: makeId(), name: brandName.trim() || design.center || 'My brand', company: design.center, tagline: design.top, email: '', phone: '', website: '', address: design.bottom, primary: design.ink, accent: design.ink, logo: design.logo, updatedAt: new Date().toISOString() }; await saveBrand(brand); setBrands(await listBrands<BrandKit>()); setStatus(`Brand profile “${brand.name}” saved for both design tools.`) } catch { setStatus('Could not save a shared brand profile in browser storage.') } }
  function applyBrandProfile(brand: BrandKit) { updateDesign({ center: brand.company, top: brand.tagline, bottom: brand.address, ink: brand.primary, logo: brand.logo }); setStatus(`Brand profile “${brand.name}” applied.`) }
  const control = (label: string, value: string, onChange: (value: string) => void, type = 'text') => <label className="studio-field"><span>{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} /></label>

  return <section className="design-studio stamp-studio" aria-label="Stamp Generator workspace">
    <div className="studio-topbar"><div className="studio-project-name"><span className="studio-app-mark"><Shield size={17}/></span><div><strong>Stamp studio</strong><span>{savedState || status}</span></div></div><div className="studio-top-actions"><button type="button" className="studio-icon-button" aria-label="Undo" disabled={!history.length} onClick={() => { const previous = history.at(-1); if (!previous) return; setFuture(items => [design, ...items]); setDesign(previous); setHistory(items => items.slice(0, -1)) }}><Undo2/></button><button type="button" className="studio-icon-button" aria-label="Redo" disabled={!future.length} onClick={() => { const next = future[0]; if (!next) return; setHistory(items => [...items, design]); setDesign(next); setFuture(items => items.slice(1)) }}><Redo2/></button><label className="studio-name-input"><span className="sr-only">Project name</span><input value={projectName} onChange={event => setProjectName(event.target.value)} aria-label="Project name" /></label><button type="button" className="studio-secondary" onClick={() => void saveNamedProject()}><Save size={15}/> Save</button><button type="button" className="studio-primary" onClick={() => void exportPng()}><Download size={15}/> Export</button></div></div>
    <div className="studio-mobile-tabs" role="tablist" aria-label="Stamp controls"><button type="button" role="tab" aria-selected={tab === 'templates'} onClick={() => setTab('templates')}>Templates</button><button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button><button type="button" role="tab" aria-selected={tab === 'design'} onClick={() => setTab('design')}>Design</button></div>
    <div className="studio-shell">
      <aside className={`studio-panel studio-template-panel ${tab === 'templates' ? 'is-mobile-active' : ''}`} aria-label="Stamp templates"><div className="studio-panel-heading"><div><span className="studio-kicker">START WITH A STYLE</span><h2>Templates <small>{templates.length}</small></h2></div><button className="studio-mobile-close" type="button" aria-label="Close templates" onClick={() => setTab('preview')}><X/></button></div><label className="studio-search"><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a stamp" aria-label="Search stamp templates" /></label><div className="studio-filter-row" aria-label="Template category">{categories.map(category => <button type="button" key={category} className={activeCategory === category ? 'is-active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><div className="stamp-template-list">{filteredTemplates.map((template, index) => <button type="button" className={`stamp-template-card ${design.template === template.id ? 'is-selected' : ''}`} key={template.id} onClick={() => applyTemplate(template)}><span className={`stamp-mini-preview mini-${template.shape}`} style={{ color: design.ink }}><span>{template.center || template.top || 'CUSTOM'}</span></span><span><strong>{template.name}</strong><small>{template.group} · {index + 1} of {filteredTemplates.length}</small></span><ChevronDown className="template-chevron" size={15}/></button>)}</div><div className="studio-panel-foot"><button type="button" className="studio-text-button" onClick={() => updateDesign({ ...initialDesign, template: 'blank', top: '', center: '', bottom: '', extra: '' })}><Plus size={14}/> Start with blank stamp</button></div></aside>
      <main className="studio-canvas-column"><div className="studio-canvas-toolbar"><div className="studio-canvas-label"><span className="studio-live-dot"/> Live preview <span className="studio-separator">/</span> {design.width} × {design.height} mm</div><div className="studio-zoom-controls"><button type="button" aria-label="Zoom out" onClick={() => setZoom(value => Math.max(65, value - 10))}><Minus/></button><span>{zoom}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom(value => Math.min(130, value + 10))}><Plus/></button></div></div><div className="stamp-canvas-wrap"><div className={`stamp-canvas ${design.transparent ? 'is-transparent' : ''}`} style={{ transform: `scale(${zoom / 100})`, backgroundColor: design.transparent ? undefined : design.background }}><StampArtwork design={design} svgRef={svgRef}/></div></div><div className="studio-canvas-footer"><span>{design.shape.charAt(0).toUpperCase() + design.shape.slice(1)} stamp <span>·</span> {design.mirrored ? 'Mirrored production artwork' : 'Readable artwork'}</span><button type="button" className="studio-text-button" onClick={() => updateDesign({ transparent: !design.transparent })}>{design.transparent ? 'Preview on paper' : 'Show transparency'}</button></div><div className="studio-status" role="status">{status}</div></main>
      <aside className={`studio-panel studio-controls-panel ${tab === 'design' ? 'is-mobile-active' : ''}`} aria-label="Stamp design controls"><div className="studio-panel-heading"><div><span className="studio-kicker">MAKE IT YOURS</span><h2>Design settings</h2></div><button className="studio-mobile-close" type="button" aria-label="Close design settings" onClick={() => setTab('preview')}><X/></button></div><section className="studio-control-group"><div className="studio-control-title"><span>Stamp details</span><Layers3 size={15}/></div>{control('Top arc text', design.top, value => updateDesign({ top: value }))}{control('Center text', design.center, value => updateDesign({ center: value }))}{control('Bottom arc text', design.bottom, value => updateDesign({ bottom: value }))}{control('Small text line', design.extra, value => updateDesign({ extra: value }))}</section><section className="studio-control-group"><div className="studio-control-title"><span>Shape &amp; border</span></div><label className="studio-field"><span>Shape</span><select value={design.shape} onChange={event => updateDesign({ shape: event.target.value as StampShape })}>{['circle','oval','square','rectangle','rounded','hexagon','octagon'].map(shape => <option key={shape} value={shape}>{shape[0].toUpperCase()+shape.slice(1)}</option>)}</select></label><div className="studio-two-fields">{control('Width (mm)', String(design.width), value => updateDesign({ width: Math.min(100, Math.max(10, Number(value) || 10)) }), 'number')}{control('Height (mm)', String(design.height), value => updateDesign({ height: Math.min(100, Math.max(10, Number(value) || 10)) }), 'number')}</div><label className="studio-field"><span>Border weight <b>{design.border}px</b></span><input type="range" min="1" max="12" value={design.border} onChange={event => updateDesign({ border: Number(event.target.value) })}/></label><label className="studio-check"><input type="checkbox" checked={design.innerRing} onChange={event => updateDesign({ innerRing: event.target.checked })}/> Add inner border</label></section><section className="studio-control-group"><div className="studio-control-title"><span>Ink &amp; type</span></div><div className="studio-color-row"><label><span>Ink color</span><input type="color" value={design.ink} onChange={event => updateDesign({ ink: event.target.value })}/></label><label><span>Paper color</span><input type="color" value={design.background} onChange={event => updateDesign({ background: event.target.value })}/></label></div><label className="studio-field"><span>Typeface</span><select value={design.font} onChange={event => updateDesign({ font: event.target.value })}>{fonts.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}</select></label><label className="studio-field"><span>Letter size <b>{design.fontSize}px</b></span><input type="range" min="18" max="42" value={design.fontSize} onChange={event => updateDesign({ fontSize: Number(event.target.value) })}/></label><label className="studio-check"><input type="checkbox" checked={design.distressed} onChange={event => updateDesign({ distressed: event.target.checked })}/> Light worn-ink texture</label></section><section className="studio-control-group"><div className="studio-control-title"><span>Logo or mark</span></div><input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={event => void loadLogo(event)}/><div className="studio-upload-row"><button className="studio-secondary studio-upload-button" type="button" onClick={() => logoRef.current?.click()}><ImagePlus size={15}/>{design.logo ? 'Replace logo' : 'Add a logo'}</button>{design.logo && <button className="studio-icon-button" type="button" aria-label="Remove logo" onClick={() => updateDesign({ logo: '' })}><X/></button>}<span>PNG, JPG, WebP or SVG</span></div></section><section className="studio-control-group"><div className="studio-control-title"><span>Production &amp; files</span></div><label className="studio-check"><input type="checkbox" checked={design.mirrored} onChange={event => updateDesign({ mirrored: event.target.checked })}/> Mirror for rubber die</label><p className="studio-help">Mirrored artwork is for making a stamp die. The downloaded artwork will read in reverse.</p><div className="studio-export-grid"><button type="button" onClick={() => void exportPng()}><FileImage/>PNG <small>300 DPI</small></button><button type="button" onClick={() => void exportSvg()}><FileText/>SVG <small>Vector</small></button><button type="button" onClick={() => void exportPdf()}><FileText/>PDF <small>Print size</small></button><button type="button" onClick={exportProject}><FileJson/>Project <small>Editable JSON</small></button></div><input ref={importRef} type="file" accept="application/json,.json" className="sr-only" onChange={event => void importProject(event)}/><button type="button" className="studio-text-button studio-import-button" onClick={() => importRef.current?.click()}><Upload size={14}/> Open project file</button></section><section className="studio-control-group"><div className="studio-control-title"><span>Shared brand kit</span><small>Available in both tools</small></div><label className="studio-field"><span>Profile name</span><input value={brandName} onChange={event => setBrandName(event.target.value)}/></label><button type="button" className="studio-secondary studio-wide-button" onClick={() => void saveBrandProfile()}><Save size={14}/> Save brand profile</button><div className="studio-brand-list">{brands.map(brand => <button type="button" key={brand.id} onClick={() => applyBrandProfile(brand)}><span className="brand-swatch" style={{ background: brand.primary }}/><span>{brand.name}</span><ChevronDown size={14}/></button>)}{brands.length === 0 && <p className="studio-help">Save a profile to reuse its colors and details in the Letterhead Maker.</p>}</div></section><section className="studio-control-group studio-saved-projects"><div className="studio-control-title"><span>Saved projects</span><small>On this device</small></div><div className="studio-saved-project-list">{projects.filter(project => project.id !== 'stamp-autosave').map(project => <div className="studio-saved-project" key={project.id}><button type="button" onClick={() => void reopenProject(project)}>{project.name}</button><button type="button" aria-label={`Delete ${project.name}`} onClick={() => void deleteProject(project)}><X size={14}/></button></div>)}{projects.filter(project => project.id !== 'stamp-autosave').length === 0 && <p className="studio-help">Save a named version to reopen it here later.</p>}</div></section><button type="button" className="studio-reset-button" onClick={() => { if (window.confirm('Reset this stamp design?')) { updateDesign(initialDesign); setStatus('Stamp design reset.') } }}><RotateCcw size={14}/> Reset design</button></aside>
    </div>
    <div className="studio-privacy-note"><Check size={15}/> Your design and uploaded images stay in this browser. No account or upload required.</div>
  </section>
}
