'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronRight, Download, FileImage, FileJson, FileText, ImagePlus, Mail, MapPin, Palette, Phone, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react'
import { PDFDocument, rgb } from 'pdf-lib'
import JSZip from 'jszip'
import { listBrands, listProjects, removeProject, saveBrand, saveProject, type StudioProject } from './storage'

type LayoutKind = 'topline' | 'band' | 'sidebar' | 'centered' | 'split' | 'monogram' | 'minimal'
type LetterheadDesign = { template: string; company: string; tagline: string; person: string; title: string; email: string; phone: string; website: string; address: string; primary: string; accent: string; ink: string; font: string; page: 'A4' | 'Letter' | 'Legal' | 'A5'; landscape: boolean; layout: LayoutKind; logo: string; mode: 'blank' | 'letter'; date: string; recipient: string; recipientAddress: string; subject: string; greeting: string; body: string; closing: string; signature: string; footer: string; qr: boolean; qrData: string }
type LetterheadTemplate = { id: string; name: string; group: string; layout: LayoutKind; primary: string; accent: string; ink: string; company: string; tagline: string; footer: string }
type BrandKit = { id: string; name: string; company: string; tagline: string; email: string; phone: string; website: string; address: string; primary: string; accent: string; logo: string; updatedAt: string }

const templateSeed: Omit<LetterheadTemplate, 'id' | 'name' | 'group' | 'company' | 'tagline' | 'footer'>[] = [
  { layout: 'topline', primary: '#1e293b', accent: '#2563eb', ink: '#263548' }, { layout: 'band', primary: '#15375b', accent: '#d99c36', ink: '#243247' },
  { layout: 'minimal', primary: '#20262d', accent: '#8c9aa8', ink: '#344150' }, { layout: 'split', primary: '#2563eb', accent: '#f59e0b', ink: '#233247' },
  { layout: 'monogram', primary: '#192f50', accent: '#c29a5b', ink: '#2d3542' }, { layout: 'sidebar', primary: '#274661', accent: '#49a398', ink: '#29394a' },
  { layout: 'centered', primary: '#344054', accent: '#c27a5a', ink: '#303a48' }, { layout: 'topline', primary: '#172e4a', accent: '#8eb0c9', ink: '#263b4d' },
  { layout: 'band', primary: '#28443c', accent: '#bc9a5d', ink: '#303a38' }, { layout: 'minimal', primary: '#252c34', accent: '#d4a24c', ink: '#303943' },
  { layout: 'sidebar', primary: '#272c53', accent: '#7974bd', ink: '#34364c' }, { layout: 'split', primary: '#315b4e', accent: '#b9c98a', ink: '#303e39' },
  { layout: 'centered', primary: '#3a2f42', accent: '#b88ca5', ink: '#3c3540' }, { layout: 'topline', primary: '#1b4060', accent: '#47a1aa', ink: '#293947' },
  { layout: 'band', primary: '#202d3c', accent: '#a4b5c7', ink: '#2b3540' }, { layout: 'monogram', primary: '#462d37', accent: '#c79278', ink: '#44383b' },
  { layout: 'minimal', primary: '#51545a', accent: '#9eaa91', ink: '#40464a' }, { layout: 'sidebar', primary: '#183954', accent: '#50a4bf', ink: '#2b3d4b' },
  { layout: 'split', primary: '#4d4b45', accent: '#b99059', ink: '#3b3a37' }, { layout: 'centered', primary: '#324d60', accent: '#d1a773', ink: '#35434e' },
  { layout: 'band', primary: '#4c2935', accent: '#c79673', ink: '#46343a' }, { layout: 'topline', primary: '#2b4345', accent: '#88a59a', ink: '#354342' },
  { layout: 'monogram', primary: '#263149', accent: '#e2b758', ink: '#2f3847' }, { layout: 'minimal', primary: '#263f52', accent: '#5b8d9f', ink: '#303f4b' },
]
const templateNames = [
  ['Corporate', 'Apex executive', 'Northstar Group', 'Strategy · Integrity · Growth', 'NEW YORK · LONDON · SINGAPORE'],
  ['Corporate', 'Navy & gold', 'Sterling Partners', 'Trusted counsel since 1986', 'NEW YORK · BOSTON · CHICAGO'],
  ['Minimal', 'Quiet minimal', 'STUDIO / NORTH', 'Architecture · Interiors', 'PORTLAND  ·  OREGON  ·  97205'],
  ['Corporate', 'Modern geometric', 'FORM & FUNCTION', 'Creative company', 'DESIGN  /  DIGITAL  /  STRATEGY'],
  ['Corporate', 'Monogram corporate', 'MASON & MILLER', 'LEGAL PROFESSIONALS', 'CHICAGO  ·  ILLINOIS'],
  ['Professional', 'Consulting studio', 'CLEARVIEW ADVISORY', 'Better questions. Clear direction.', 'STRATEGY · OPERATIONS · RESEARCH'],
  ['Minimal', 'Centered stationery', 'VERDANT HOUSE', 'Landscape · Garden · Living', 'MADE WITH CARE IN AUSTIN'],
  ['Corporate', 'Classic business', 'HARBOR & FIELD', 'Independent since 1998', 'BOSTON  ·  NEW YORK  ·  MAINE'],
  ['Professional', 'Accounting practice', 'STONEBRIDGE ACCOUNTING', 'Clarity in every detail', 'CPA · TAX · BUSINESS ADVISORY'],
  ['Minimal', 'Thin-line letterhead', 'GOODLAND', 'Brand and communications', 'BROOKLYN · NEW YORK'],
  ['Professional', 'Law firm', 'WATERS & COLE', 'Attorneys at Law', 'COUNSEL · LITIGATION · MEDIATION'],
  ['Professional', 'Medical practice', 'RIVERBEND FAMILY CARE', 'Care for every chapter', 'PRIMARY CARE · WELLNESS'],
  ['Creative', 'Creative agency', 'MOTION / MATTER', 'Ideas made visible', 'CREATIVE STUDIO · LOS ANGELES'],
  ['Creative', 'Technology company', 'PLATFORM NINE', 'Technology for people', 'PRODUCT · ENGINEERING · DESIGN'],
  ['Corporate', 'Architecture firm', 'LINEAR ARCHITECTS', 'Form follows purpose', 'ARCHITECTURE · PLANNING · INTERIORS'],
  ['Creative', 'Luxury atelier', 'MAISON LUNE', 'Objects for everyday rituals', 'PARIS · NEW YORK'],
  ['Minimal', 'Warm neutral', 'COMMON TABLE', 'Food · Community · Culture', 'MADE SLOWLY · SHARED OFTEN'],
  ['Creative', 'Digital product studio', 'WAVELENGTH', 'A better signal for your business', 'PRODUCT DESIGN · DEVELOPMENT'],
  ['Professional', 'Real estate agency', 'KEYSTONE PROPERTY', 'Find a place to belong', 'RESIDENTIAL · COMMERCIAL · ADVISORY'],
  ['Professional', 'Education institute', 'OAK & RIVER ACADEMY', 'Learning with purpose', 'EST. 1974 · AUSTIN, TEXAS'],
  ['Creative', 'Boutique hospitality', 'THE WILLOW HOTEL', 'A thoughtful place to stay', 'SAVANNAH · GEORGIA'],
  ['Corporate', 'Engineering company', 'SUMMIT ENGINEERING', 'Built for what comes next', 'CIVIL · STRUCTURAL · ENVIRONMENTAL'],
  ['Corporate', 'Executive monogram', 'BELL & ROWE', 'Independent wealth counsel', 'PLAN WITH PURPOSE'],
  ['Minimal', 'Left aligned clean', 'FIELDWORK SUPPLY', 'Tools for a more thoughtful life', 'PORTLAND, OR · EST. 2004'],
]
const templates: LetterheadTemplate[] = templateSeed.map((seed, index) => { const [group, name, company, tagline, footer] = templateNames[index]; return { ...seed, id: `letter-${index + 1}`, group, name, company, tagline, footer } })
const initialLetterhead: LetterheadDesign = { template: templates[0].id, company: templates[0].company, tagline: templates[0].tagline, person: '', title: '', email: 'hello@example.com', phone: '+1 (555) 010-2040', website: 'www.example.com', address: '120 Market Street, Portland, OR 97205', primary: templates[0].primary, accent: templates[0].accent, ink: templates[0].ink, font: 'Georgia, serif', page: 'A4', landscape: false, layout: templates[0].layout, logo: '', mode: 'blank', date: new Date().toISOString().slice(0, 10), recipient: '', recipientAddress: '', subject: '', greeting: 'Dear [Name],', body: '', closing: 'Sincerely,', signature: '', footer: templates[0].footer, qr: false, qrData: 'https://example.com' }
const letterFonts = ['Georgia, serif', 'Arial, sans-serif', 'Times New Roman, serif', 'Trebuchet MS, sans-serif', 'Palatino, serif', 'Verdana, sans-serif', 'Courier New, monospace', 'Garamond, serif', 'system-ui, sans-serif', 'Arial Narrow, sans-serif', 'Tahoma, sans-serif', 'Baskerville, serif', 'Cambria, serif', 'Calibri, sans-serif', 'Century Gothic, sans-serif']
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}`
const xml = (value: string) => value.replace(/[<>&'"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!)
function download(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500) }
function dataUrlFromSvg(source: string) { return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source)))}` }
function pagePixelSize(design: LetterheadDesign, dpi: number) { const sizes: Record<LetterheadDesign['page'], [number, number]> = { A4: [210, 297], Letter: [215.9, 279.4], Legal: [215.9, 355.6], A5: [148, 210] }; const [width, height] = sizes[design.page]; const oriented = design.landscape ? [height, width] : [width, height]; return oriented.map(value => Math.round(value / 25.4 * dpi)) as [number, number] }
function pageAspectRatio(design: LetterheadDesign) { const [width, height] = pagePixelSize(design, 1); return width / height }
function makeSvg(design: LetterheadDesign, body = '', qrSvg = '') {
  const landscape = design.landscape
  const dimensions = design.page === 'Letter' ? [612, 792] : design.page === 'Legal' ? [612, 1008] : design.page === 'A5' ? [420, 595] : [595, 842]
  const [pageWidth, pageHeight] = landscape ? [dimensions[1], dimensions[0]] : dimensions
  const isSidebar = design.layout === 'sidebar'
  const isBand = design.layout === 'band'
  const isCentered = design.layout === 'centered'
  const isSplit = design.layout === 'split'
  const x = isSidebar ? 100 : 58
  const anchor = isCentered ? 'middle' : 'start'
  const companyX = isCentered ? pageWidth / 2 : x
  const logoMarkup = design.logo ? `<image href="${design.logo}" x="${isCentered ? pageWidth / 2 - 26 : x}" y="${isCentered ? 44 : 43}" width="52" height="52" preserveAspectRatio="xMidYMid meet"/>` : ''
  const bodyLines = body.split('\n').flatMap(paragraph => {
    if (!paragraph) return ['']
    const words = paragraph.split(/\s+/); const lines: string[] = []; let line = ''
    for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (candidate.length > 68 && line) { lines.push(line); line = word } else line = candidate }
    if (line) lines.push(line)
    return lines
  }).slice(0, 56)
  const bodyMarkup = bodyLines.map((line, index) => `<text x="58" y="${Math.min(480 + index * 20, pageHeight - 90)}" font-family="${xml(design.font.split(',')[0])}" font-size="13" fill="${design.ink}">${xml(line)}</text>`).join('')
  const background = `<rect width="${pageWidth}" height="${pageHeight}" fill="#ffffff"/>`
  const shape = isSidebar ? `<rect x="0" y="0" width="20" height="${pageHeight}" fill="${design.primary}"/><rect x="20" y="0" width="6" height="${pageHeight}" fill="${design.accent}"/>` : isBand ? `<rect width="${pageWidth}" height="156" fill="${design.primary}"/><rect y="151" width="${pageWidth}" height="5" fill="${design.accent}"/>` : isSplit ? `<path d="M0 0h${pageWidth}v110H0z" fill="${design.primary}"/><path d="M0 108h${pageWidth}v5H0z" fill="${design.accent}"/>` : `<rect x="58" y="52" width="${pageWidth - 116}" height="${design.layout === 'topline' ? 3 : 1}" fill="${design.accent}"/>`
  const isDarkHeader = isBand || isSplit
  const titleColor = isDarkHeader ? '#ffffff' : design.primary
  const companyY = isCentered ? 128 : 91
  const contactY = isCentered ? 164 : 119
  const footerY = pageHeight - 59
  const qrMarkup = design.qr && qrSvg ? `<image href="${dataUrlFromSvg(qrSvg)}" x="${pageWidth - 140}" y="${footerY - 144}" width="82" height="82" preserveAspectRatio="xMidYMid meet"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageWidth} ${pageHeight}" width="${pageWidth}" height="${pageHeight}">${background}${shape}${logoMarkup}<text x="${companyX}" y="${companyY}" text-anchor="${anchor}" font-family="${xml(design.font.split(',')[0])}" font-size="${isCentered ? 22 : 21}" font-weight="700" fill="${titleColor}">${xml(design.company || 'Your Company Name')}</text><text x="${companyX}" y="${companyY + 24}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="10" letter-spacing="1.5" fill="${isDarkHeader ? '#e8eef4' : design.ink}">${xml(design.tagline)}</text><text x="${pageWidth - 58}" y="${contactY}" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="${isDarkHeader ? '#ffffff' : design.ink}">${xml([design.email, design.phone, design.website].filter(Boolean).join('  ·  '))}</text><text x="58" y="${contactY + 18}" font-family="Arial, sans-serif" font-size="9" fill="${isDarkHeader ? '#ffffff' : design.ink}">${xml(design.address)}</text>${design.mode === 'letter' ? `<text x="58" y="238" font-family="Arial, sans-serif" font-size="12" fill="${design.ink}">${xml(design.date)}</text><text x="58" y="277" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="${design.ink}">${xml(design.recipient)}</text>${design.recipientAddress.split('\n').map((line, index) => `<text x="58" y="${297 + index * 18}" font-family="Arial, sans-serif" font-size="12" fill="${design.ink}">${xml(line)}</text>`).join('')}<text x="58" y="${350 + design.recipientAddress.split('\n').length * 18}" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="${design.ink}">${xml(design.subject ? `Subject: ${design.subject}` : '')}</text><text x="58" y="${390 + design.recipientAddress.split('\n').length * 18}" font-family="Arial, sans-serif" font-size="13" fill="${design.ink}">${xml(design.greeting)}</text>${bodyMarkup}<text x="58" y="${Math.min(480 + bodyLines.length * 20, pageHeight - 116)}" font-family="Arial, sans-serif" font-size="13" fill="${design.ink}">${xml(design.closing)}</text><text x="58" y="${Math.min(515 + bodyLines.length * 20, pageHeight - 94)}" font-family="${xml(design.font.split(',')[0])}" font-size="16" font-style="italic" fill="${design.primary}">${xml(design.signature)}</text>` : `<path d="M58 245H${pageWidth - 58}" stroke="#e4e9ee" stroke-width="1"/><text x="58" y="274" font-family="Arial, sans-serif" font-size="10" letter-spacing="1.4" fill="${design.accent}">LETTER CONTENT</text><text x="58" y="305" font-family="Arial, sans-serif" font-size="12" fill="#89929c">Write a letter or place your content here.</text>`}<rect x="58" y="${footerY}" width="${pageWidth - 116}" height="1" fill="${design.accent}"/><text x="58" y="${footerY + 20}" font-family="Arial, sans-serif" font-size="8.5" fill="${design.ink}">${xml(design.footer || [design.address, design.website].filter(Boolean).join('  ·  '))}</text>${qrMarkup}</svg>`
}

function safeSvgData(svgText: string) {
  const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') throw new Error('Choose a valid SVG image.')
  parsed.querySelectorAll('script,foreignObject,iframe,object,embed,style,link').forEach(element => element.remove())
  parsed.querySelectorAll('*').forEach(element => { for (const attribute of [...element.attributes]) { const name = attribute.name.toLowerCase(); const value = attribute.value.trim(); if (name.startsWith('on') || name === 'style' || (['href', 'xlink:href'].includes(name) && !value.startsWith('#') && !/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(value))) element.removeAttribute(attribute.name) } })
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

async function createDocx(design: LetterheadDesign) {
  const zip = new JSZip()
  const pageWidth = design.page === 'A5' ? 8391 : 12240
  const pageHeight = design.page === 'Legal' ? 20160 : design.page === 'Letter' ? 15840 : design.page === 'A5' ? 11906 : 16838
  const paragraph = (text: string, style = '') => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`
  const header = `<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="left"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="8" w:color="${design.accent.replace('#', '')}"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${design.primary.replace('#', '')}"/><w:sz w:val="30"/></w:rPr><w:t>${xml(design.company || 'Your Company Name')}</w:t></w:r></w:p>${paragraph(design.tagline)}${paragraph([design.email, design.phone, design.website].filter(Boolean).join(' · '))}`
  const footer = `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${paragraph([design.address, design.footer].filter(Boolean).join(' · '))}</w:ftr>`
  const letterBody = design.mode === 'letter' ? [paragraph(design.date), paragraph(''), paragraph(design.recipient), ...design.recipientAddress.split('\n').map(line => paragraph(line)), paragraph(''), paragraph(design.subject ? `Subject: ${design.subject}` : ''), paragraph(''), paragraph(design.greeting), ...design.body.split(/\n\s*\n/).map(line => paragraph(line)), paragraph(''), paragraph(design.closing), paragraph(design.signature)].join('') : paragraph('')
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${letterBody}<w:sectPr><w:headerReference w:type="default" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><w:footerReference w:type="default" r:id="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><w:pgSz w:w="${design.landscape ? pageHeight : pageWidth}" w:h="${design.landscape ? pageWidth : pageHeight}"/><w:pgMar w:top="2100" w:right="1000" w:bottom="1200" w:left="1000"/></w:sectPr></w:body></w:document>`
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  zip.file('word/document.xml', document)
  zip.file('word/header1.xml', header)
  zip.file('word/footer1.xml', footer)
  zip.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:style></w:styles>')
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>')
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

export function LetterheadMaker() {
  const [design, setDesign] = useState(initialLetterhead)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [section, setSection] = useState<'templates' | 'preview' | 'brand' | 'letter' | 'files'>('preview')
  const [status, setStatus] = useState('Your document is saved locally in this browser.')
  const [saved, setSaved] = useState('')
  const [projects, setProjects] = useState<StudioProject[]>([])
  const [brands, setBrands] = useState<BrandKit[]>([])
  const [projectName, setProjectName] = useState('My company letterhead')
  const [brandName, setBrandName] = useState('My brand')
  const [zoom, setZoom] = useState(100)
  const [hydrated, setHydrated] = useState(false)
  const [qrPreview, setQrPreview] = useState('')
  const [qrHolder, setQrHolder] = useState<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const svg = useMemo(() => makeSvg(design, design.mode === 'letter' ? design.body : '', qrPreview), [design, qrPreview])
  const filteredTemplates = useMemo(() => templates.filter(item => (category === 'All' || item.group === category) && `${item.name} ${item.group} ${item.company}`.toLowerCase().includes(search.toLowerCase())), [category, search])

  useEffect(() => {
    setHydrated(true)
    void Promise.all([listProjects('letterhead'), listBrands<BrandKit>()]).then(([savedProjects, savedBrands]) => {
      setProjects(savedProjects); setBrands(savedBrands)
      const draft = savedProjects.find(item => item.id === 'letterhead-autosave')
      if (draft) setDesign(draft.payload as LetterheadDesign)
    }).catch(() => setStatus('Browser storage is unavailable; download a project file to keep a copy.'))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const timer = window.setTimeout(() => { void saveProject({ id: 'letterhead-autosave', name: 'Letterhead auto-save', tool: 'letterhead', updatedAt: new Date().toISOString(), payload: design }).then(() => setSaved('Saved on this device')).catch(() => setSaved('Auto-save unavailable')) }, 500)
    return () => window.clearTimeout(timer)
  }, [design, hydrated])

  useEffect(() => {
    let cancelled = false
    if (!design.qr || !qrHolder) { setQrPreview(''); return }
    void import('qr-code-styling').then(async ({ default: QRCode }) => {
      const qr = new QRCode({ width: 130, height: 130, type: 'svg', data: design.qrData || design.website || 'https://example.com', margin: 4, qrOptions: { errorCorrectionLevel: 'M' }, dotsOptions: { color: design.primary, type: 'square' }, backgroundOptions: { color: '#ffffff' } })
      qr.append(qrHolder)
      const blob = await qr.getRawData('svg')
      if (!cancelled && blob) setQrPreview(blob instanceof Blob ? await blob.text() : new TextDecoder().decode(blob))
    }).catch(() => setStatus('QR preview could not be loaded; the letterhead editor is still available.'))
    return () => { cancelled = true; qrHolder.replaceChildren() }
  }, [design.qr, design.qrData, design.primary, qrHolder])

  function update(patch: Partial<LetterheadDesign>) { setDesign(current => ({ ...current, ...patch })) }
  function selectTemplate(template: LetterheadTemplate) { update({ template: template.id, primary: template.primary, accent: template.accent, ink: template.ink, layout: template.layout, company: template.company, tagline: template.tagline, footer: template.footer }); setSection('preview'); setStatus(`${template.name} selected. Customize your brand details.`) }

  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget; const file = input.files?.[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) { setStatus('Choose a PNG, JPG, WebP, or SVG image under 5 MB.'); input.value = ''; return }
    try {
      const logo = file.type === 'image/svg+xml' ? safeSvgData(await file.text()) : await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file) })
      update({ logo }); setStatus(`${file.name} added to your letterhead.`)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'The image could not be read.') }
    input.value = ''
  }

  function downloadSvg() { download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'company-letterhead.svg'); setStatus('Editable vector letterhead downloaded.') }
  async function downloadPng() {
    try {
      const image = new Image(); image.crossOrigin = 'anonymous'; image.src = dataUrlFromSvg(svg); await image.decode()
      const canvas = document.createElement('canvas'); [canvas.width, canvas.height] = pagePixelSize(design, 300)
      const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas export is unavailable.')
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not create a PNG file.')), 'image/png'))
      download(blob, 'company-letterhead.png'); setStatus(`High-resolution PNG downloaded (${canvas.width} × ${canvas.height} px).`)
    } catch { setStatus('PNG export could not be created. Try SVG or PDF instead.') }
  }
  async function downloadPdf() {
    try {
      const image = new Image(); image.crossOrigin = 'anonymous'; image.src = dataUrlFromSvg(svg); await image.decode()
      const canvas = document.createElement('canvas'); [canvas.width, canvas.height] = pagePixelSize(design, 160)
      const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas export is unavailable.')
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const png = await new Promise<Uint8Array>((resolve, reject) => canvas.toBlob(blob => blob ? blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer))) : reject(new Error('Could not render the page.')), 'image/png'))
      const pdf = await PDFDocument.create(); const points = design.page === 'Letter' ? [612, 792] : design.page === 'Legal' ? [612, 1008] : design.page === 'A5' ? [420, 595] : [595, 842]
      const [width, height] = design.landscape ? [points[1], points[0]] : points; const page = pdf.addPage([width, height]); const embedded = await pdf.embedPng(png); page.drawImage(embedded, { x: 0, y: 0, width, height })
      download(new Blob([await pdf.save()], { type: 'application/pdf' }), 'company-letterhead.pdf'); setStatus('Print-size PDF downloaded. This PDF uses a high-resolution page image.')
    } catch { setStatus('PDF export could not be created. Try SVG or PNG instead.') }
  }
  async function downloadDocx() { try { download(await createDocx(design), 'company-letterhead.docx'); setStatus('Editable Word document downloaded with editable company and letter text.') } catch { setStatus('Word document could not be created.') } }
  function downloadProject() { download(new Blob([JSON.stringify({ schemaVersion: 1, tool: 'letterhead', design }, null, 2)], { type: 'application/json' }), 'letterhead-project.json'); setStatus('Editable project JSON downloaded.') }
  async function importProject(event: React.ChangeEvent<HTMLInputElement>) { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; try { const project = JSON.parse(await file.text()); if (project.tool !== 'letterhead' || !project.design || typeof project.design !== 'object') throw new Error('Choose a Letterhead Maker project JSON file.'); const imported = { ...initialLetterhead, ...project.design } as LetterheadDesign; const textValues = [imported.company, imported.tagline, imported.person, imported.title, imported.email, imported.phone, imported.website, imported.address, imported.footer, imported.date, imported.recipient, imported.recipientAddress, imported.subject, imported.greeting, imported.body, imported.closing, imported.signature, imported.qrData]; if (!textValues.every(value => typeof value === 'string' && value.length <= 12000) || !letterFonts.includes(imported.font) || !['topline','band','sidebar','centered','split','monogram','minimal'].includes(imported.layout) || !['A4','Letter','Legal','A5'].includes(imported.page) || !['blank','letter'].includes(imported.mode) || !['primary','accent','ink'].every(key => /^#[\da-f]{6}$/i.test(imported[key as 'primary' | 'accent' | 'ink']))) throw new Error('This letterhead project contains invalid design settings.'); setDesign({ ...imported, logo: safeLogoData(imported.logo) }); setStatus('Letterhead project opened.') } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not open this project.') }; input.value = '' }
  async function saveNamedProject() { try { await saveProject({ id: makeId(), name: projectName.trim() || 'Untitled letterhead', tool: 'letterhead', updatedAt: new Date().toISOString(), payload: design }); setProjects(await listProjects('letterhead')); setStatus(`“${projectName}” saved in this browser.`) } catch { setStatus('Could not save to browser storage. Download the project JSON instead.') } }
  async function saveBrandKit() { try { const brand = { id: makeId(), name: brandName.trim() || design.company || 'My brand', company: design.company, tagline: design.tagline, email: design.email, phone: design.phone, website: design.website, address: design.address, primary: design.primary, accent: design.accent, logo: design.logo, updatedAt: new Date().toISOString() }; await saveBrand(brand); setBrands(await listBrands<BrandKit>()); setStatus(`Brand profile “${brand.name}” saved for both design tools.`) } catch { setStatus('Could not save this brand profile in browser storage.') } }
  function applyBrand(brand: BrandKit) { update({ company: brand.company, tagline: brand.tagline, email: brand.email, phone: brand.phone, website: brand.website, address: brand.address, primary: brand.primary, accent: brand.accent, logo: brand.logo }); setStatus(`Brand profile “${brand.name}” applied.`) }
  async function deleteSaved(project: StudioProject) { try { await removeProject(project.id); setProjects(await listProjects('letterhead')); setStatus(`“${project.name}” deleted.`) } catch { setStatus('Could not delete this saved project.') } }
  const field = (label: string, key: keyof LetterheadDesign, type = 'text') => <label className="studio-field"><span>{label}</span><input type={type} value={String(design[key] ?? '')} onChange={event => update({ [key]: event.target.value } as Partial<LetterheadDesign>)} /></label>
  const bodyText = design.mode === 'letter' ? [design.greeting, design.body].filter(Boolean).join('\n') : ''

  return <section className="design-studio letterhead-studio" aria-label="Letterhead Maker workspace">
    <div className="studio-topbar"><div className="studio-project-name"><span className="studio-app-mark letterhead-mark"><FileText size={17}/></span><div><strong>Letterhead studio</strong><span>{saved || status}</span></div></div><div className="studio-top-actions"><label className="studio-name-input"><span className="sr-only">Project name</span><input value={projectName} onChange={event => setProjectName(event.target.value)} aria-label="Project name" /></label><button type="button" className="studio-secondary" onClick={() => void saveNamedProject()}><Save size={15}/> Save</button><button type="button" className="studio-primary" onClick={() => void downloadPdf()}><Download size={15}/> Export</button></div></div>
    <div className="studio-mobile-tabs" role="tablist" aria-label="Letterhead settings">{(['templates','preview','brand','letter','files'] as const).map(name => <button type="button" role="tab" aria-selected={section === name} key={name} onClick={() => setSection(name)}>{name === 'brand' ? 'Brand' : name[0].toUpperCase() + name.slice(1)}</button>)}</div>
    <div className="studio-shell letterhead-shell">
      <aside className={`studio-panel studio-template-panel letterhead-template-panel ${section === 'templates' ? 'is-mobile-active' : ''}`} aria-label="Letterhead templates"><div className="studio-panel-heading"><div><span className="studio-kicker">DESIGN LIBRARY</span><h2>Templates <small>{templates.length}</small></h2></div><button className="studio-mobile-close" type="button" aria-label="Close templates" onClick={() => setSection('preview')}><X/></button></div><label className="studio-search"><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search templates" aria-label="Search letterhead templates" /></label><div className="studio-filter-row">{['All','Corporate','Minimal','Professional','Creative'].map(group => <button type="button" key={group} className={category === group ? 'is-active' : ''} onClick={() => setCategory(group)}>{group}</button>)}</div><div className="letter-template-list">{filteredTemplates.map(template => <button key={template.id} type="button" className={`letter-template-card ${design.template === template.id ? 'is-selected' : ''}`} onClick={() => selectTemplate(template)}><span className={`letter-template-thumb layout-${template.layout}`} style={{ '--template-primary': template.primary, '--template-accent': template.accent } as React.CSSProperties}><i/><b/><small/></span><span className="letter-template-copy"><strong>{template.name}</strong><small>{template.group}</small></span></button>)}</div><button type="button" className="studio-text-button studio-blank-template" onClick={() => update({ template: 'blank', layout: 'minimal', company: '', tagline: '', footer: '' })}><Plus size={14}/> Blank page</button></aside>
      <main className="studio-canvas-column letter-canvas-column"><div className="studio-canvas-toolbar"><div className="studio-canvas-label"><span className="studio-live-dot"/> {design.mode === 'letter' ? 'Letter preview' : 'Stationery preview'} <span className="studio-separator">/</span> {design.page}{design.landscape ? ' · Landscape' : ' · Portrait'}</div><div className="studio-zoom-controls"><button type="button" aria-label="Zoom out" onClick={() => setZoom(value => Math.max(65, value - 10))}><ArrowDown/></button><span>{zoom}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom(value => Math.min(125, value + 10))}><ArrowUp/></button></div></div><div className="letter-page-stage"><div className="letter-page" style={{ transform: `scale(${zoom / 100})`, aspectRatio: String(pageAspectRatio(design)) }}><img src={dataUrlFromSvg(svg)} alt={`${design.company || 'Company'} letterhead preview`} /></div></div><div className="letter-preview-caption"><span><Check size={14}/> Safe area preview</span><span>Margins guide: 0.6 in</span></div><div className="studio-status" role="status">{status}</div></main>
      <aside className={`studio-panel studio-controls-panel letterhead-controls-panel ${['brand','letter','files'].includes(section) ? 'is-mobile-active' : ''}`} aria-label="Letterhead editor panels"><div className="studio-panel-heading"><div><span className="studio-kicker">YOUR WORKSPACE</span><h2>{section === 'templates' ? 'Templates' : section === 'letter' ? 'Write a letter' : section === 'files' ? 'Save & export' : 'Brand identity'}</h2></div><button className="studio-mobile-close" type="button" aria-label="Close editing panel" onClick={() => setSection('preview')}><X/></button></div>
        <div className={`letterhead-controls-section ${section === 'templates' || section === 'brand' ? '' : 'is-hidden-mobile'}`}>
          <section className="studio-control-group"><div className="studio-control-title"><span>Brand identity</span><Palette size={15}/></div>{field('Company name','company')}{field('Tagline','tagline')}{field('Contact person','person')}{field('Role or department','title')}<div className="studio-two-fields">{field('Email','email','email')}{field('Phone','phone','tel')}</div>{field('Website','website','url')}<label className="studio-field"><span>Business address</span><textarea rows={2} value={design.address} onChange={event => update({ address: event.target.value })}/></label></section>
          <section className="studio-control-group"><div className="studio-control-title"><span>Logo and brand colors</span></div><input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={event => void uploadLogo(event)}/><div className="studio-upload-row"><button type="button" className="studio-secondary studio-upload-button" onClick={() => logoRef.current?.click()}><ImagePlus size={15}/>{design.logo ? 'Replace logo' : 'Upload logo'}</button>{design.logo && <button type="button" className="studio-icon-button" aria-label="Remove logo" onClick={() => update({ logo: '' })}><X/></button>}<span>PNG, JPG, WebP, SVG</span></div><div className="studio-color-row"><label><span>Primary</span><input type="color" value={design.primary} onChange={event => update({ primary: event.target.value })}/></label><label><span>Accent</span><input type="color" value={design.accent} onChange={event => update({ accent: event.target.value })}/></label><label><span>Text</span><input type="color" value={design.ink} onChange={event => update({ ink: event.target.value })}/></label></div><label className="studio-field"><span>Typography</span><select value={design.font} onChange={event => update({ font: event.target.value })}>{letterFonts.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}</select></label></section>
        </div>
        <div className={`letterhead-controls-section ${section === 'letter' ? '' : 'is-hidden-mobile'}`}><section className="studio-control-group"><div className="studio-control-title"><span>Document mode</span></div><div className="studio-segmented"><button type="button" className={design.mode === 'blank' ? 'is-active' : ''} onClick={() => update({ mode: 'blank' })}>Blank letterhead</button><button type="button" className={design.mode === 'letter' ? 'is-active' : ''} onClick={() => update({ mode: 'letter' })}>Write a letter</button></div>{design.mode === 'letter' && <div className="studio-letter-fields">{field('Date','date','date')}{field('Recipient name','recipient')}<label className="studio-field"><span>Recipient address</span><textarea rows={3} value={design.recipientAddress} onChange={event => update({ recipientAddress: event.target.value })} placeholder="Street\nCity, State ZIP"/></label>{field('Subject','subject')}{field('Greeting','greeting')}<label className="studio-field"><span>Letter body</span><textarea rows={8} value={design.body} onChange={event => update({ body: event.target.value })} placeholder="Write your letter here. Separate paragraphs with a blank line."/></label>{field('Closing','closing')}{field('Typed signature','signature')}<p className="studio-help">Letter content stays separate from the reusable page design. Your Word export keeps this text editable.</p></div>}</section></div>
        <div className={`letterhead-controls-section ${section === 'files' ? '' : 'is-hidden-mobile'}`}><section className="studio-control-group"><div className="studio-control-title"><span>Page setup</span></div><label className="studio-field"><span>Page size</span><select value={design.page} onChange={event => update({ page: event.target.value as LetterheadDesign['page'] })}>{['A4','Letter','Legal','A5'].map(size => <option key={size}>{size}</option>)}</select></label><label className="studio-check"><input type="checkbox" checked={design.landscape} onChange={event => update({ landscape: event.target.checked })}/> Landscape orientation</label><label className="studio-field"><span>Footer details</span><input value={design.footer} onChange={event => update({ footer: event.target.value })}/></label><label className="studio-check"><input type="checkbox" checked={design.qr} onChange={event => update({ qr: event.target.checked })}/> Add QR code to preview</label>{design.qr && field('QR destination URL','qrData','url')}</section><section className="studio-control-group"><div className="studio-control-title"><span>Export formats</span></div><div className="studio-export-grid"><button type="button" onClick={downloadSvg}><FileText/>SVG <small>Vector art</small></button><button type="button" onClick={() => void downloadPng()}><FileImage/>PNG <small>High resolution</small></button><button type="button" onClick={() => void downloadPdf()}><FileText/>PDF <small>Print-size</small></button><button type="button" onClick={() => void downloadDocx()}><FileText/>Word <small>Editable DOCX</small></button></div><button type="button" className="studio-text-button studio-import-button" onClick={downloadProject}><FileJson size={14}/> Download editable project</button><input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={event => void importProject(event)}/><button type="button" className="studio-text-button studio-import-button" onClick={() => fileRef.current?.click()}><Upload size={14}/> Open project file</button></section><section className="studio-control-group"><div className="studio-control-title"><span>Shared brand kit</span><small>Available in both tools</small></div><label className="studio-field"><span>Profile name</span><input value={brandName} onChange={event => setBrandName(event.target.value)}/></label><button type="button" className="studio-secondary studio-wide-button" onClick={() => void saveBrandKit()}><Save size={14}/> Save brand profile</button><div className="studio-brand-list">{brands.map(brand => <button type="button" key={brand.id} onClick={() => applyBrand(brand)}><span className="brand-swatch" style={{ background: brand.primary }}/><span>{brand.name}</span><ChevronRight size={14}/></button>)}{brands.length === 0 && <p className="studio-help">Save a profile once to reuse its colors and details in either studio.</p>}</div></section><section className="studio-control-group"><div className="studio-control-title"><span>Saved projects</span><small>On this device</small></div><div className="studio-saved-project-list">{projects.filter(project => project.id !== 'letterhead-autosave').map(project => <div className="studio-saved-project" key={project.id}><button type="button" onClick={() => { setDesign(project.payload as LetterheadDesign); setProjectName(project.name); setStatus(`Opened “${project.name}”.`) }}>{project.name}</button><button type="button" aria-label={`Delete ${project.name}`} onClick={() => void deleteSaved(project)}><Trash2 size={14}/></button></div>)}</div></section></div>
        <div className="letterhead-layout-switch"><label className="studio-field"><span>Page composition</span><select value={design.layout} onChange={event => update({ layout: event.target.value as LayoutKind })}>{['topline','band','sidebar','centered','split','monogram','minimal'].map(layout => <option key={layout} value={layout}>{layout[0].toUpperCase()+layout.slice(1)}</option>)}</select></label></div>
      </aside>
    </div>
    <div className="studio-privacy-note"><Check size={15}/> Letter details and uploaded logos remain in this browser. No account or upload required.</div><div ref={setQrHolder} className="studio-qr-renderer" aria-hidden="true"/>
  </section>
}
