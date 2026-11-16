import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { Footer, Header } from '@/components/site-shell'

export default function NotFound() {
  return <><Header/><main className="inner-main"><section className="collection-head" aria-labelledby="not-found-title"><span className="eyebrow">PAGE NOT FOUND</span><h1 id="not-found-title">We couldn&apos;t find that page.</h1><p>The link may be out of date, or the page may have moved. Try a search or browse all of the free tools.</p><div className="hero-actions" style={{justifyContent:'center',marginTop:22}}><Link className="primary-button" href="/tools"><Search size={16}/> Browse all tools</Link><Link className="text-button" href="/"><ArrowLeft size={15}/> Back home</Link></div></section></main><Footer/></>
}
