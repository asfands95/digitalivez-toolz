import { socialPlatforms } from '@/lib/social-platforms'

const siteUrl = 'https://tools.digitalivez.com'

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Digitalivez Tools',
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      image: `${siteUrl}/og-image.png`,
      sameAs: socialPlatforms.map(platform => platform.profileUrl),
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Digitalivez Tools',
      url: siteUrl,
      description: 'Free business calculators, PDF utilities, and image tools for freelancers and small businesses.',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en',
    },
  ],
}

export function SiteSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
    />
  )
}
