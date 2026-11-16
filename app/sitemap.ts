import type { MetadataRoute } from 'next'
import { guides, tools } from '@/lib/tools'

export const dynamic = 'force-static'

export default function sitemap():MetadataRoute.Sitemap{const base='https://tools.digitalivez.com';const routes=[...new Set(['','/tools','/calculators','/pricing-calculators','/freelancer-tools','/business-documents','/marketing-tools','/pdf-tools','/image-tools','/guides','/about','/contact','/privacy','/terms','/disclaimer',...tools.map(t=>t.route),...guides.map(g=>g.href)])];return routes.map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path===''?'weekly':'monthly',priority:path===''?1:path.startsWith('/calculators/')||path.startsWith('/freelancer-tools/')||path.startsWith('/pdf-tools/')||path.startsWith('/image-tools/')?0.8:0.6}))}
