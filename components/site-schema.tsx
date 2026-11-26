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
      logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.svg` },
      image: `${siteUrl}/og-image.png`,
      email: 'contact@digitalivez.com',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'contact@digitalivez.com',
        url: `${siteUrl}/contact`,
      },
      sameAs: socialPlatforms.map(platform => platform.profileUrl),
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Digitalivez Tools',
      url: siteUrl,
      description: 'Free business calculators, PDF utilities, document builders, image tools, video tools, and website tools for freelancers and small businesses.',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en',
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#application`,
      name: 'Digitalivez Tools',
      url: siteUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Browser-based business calculators and document builders',
        'Local PDF and image processing',
        'Website and SEO utilities',
      ],
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${siteUrl}/#webpage`,
      url: siteUrl,
      name: 'Digitalivez Tools — Free Business and Browser Utilities',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#application` },
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
