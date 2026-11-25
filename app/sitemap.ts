import type { MetadataRoute } from 'next'
import { guides, tools } from '@/lib/tools'

export const dynamic = 'force-static'

export default function sitemap():MetadataRoute.Sitemap{const base='https://tools.digitalivez.com';const routes=[...new Set(['','/tools','/calculators','/pricing-calculators','/freelancer-tools','/business-documents','/marketing-tools','/video-tools','/website-tools','/pdf-tools','/image-tools','/guides','/about','/contact','/privacy','/terms','/disclaimer',...tools.map(t=>t.route),...guides.map(g=>g.href)])];return routes.map(path=>({url:`${base}${path}`}))}
