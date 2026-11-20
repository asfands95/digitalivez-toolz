export const socialPlatforms = [
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'digitalivez',
    profileUrl: 'https://www.facebook.com/digitalivez/',
    shareUrl: (pageUrl: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@digitalivez',
    profileUrl: 'https://www.instagram.com/digitalivez/',
    shareUrl: undefined,
  },
  {
    id: 'threads',
    name: 'Threads',
    handle: '@digitalivez',
    profileUrl: 'https://www.threads.com/@digitalivez',
    shareUrl: (pageUrl: string) => `https://www.threads.com/intent/post?text=${encodeURIComponent(pageUrl)}`,
  },
  {
    id: 'x',
    name: 'X',
    handle: '@digitalivez',
    profileUrl: 'https://x.com/digitalivez',
    shareUrl: (pageUrl: string) => `https://x.com/intent/post?url=${encodeURIComponent(pageUrl)}`,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@digitalivez',
    profileUrl: 'https://www.youtube.com/@digitalivez',
    shareUrl: undefined,
  },
] as const
