import { SocialMark } from '@/components/social-mark'
import { socialPlatforms } from '@/lib/social-platforms'

export function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <nav className={`social-links ${className}`} aria-label="Digitalivez social profiles">
      {socialPlatforms.filter(platform => ['facebook', 'threads', 'x', 'youtube'].includes(platform.id)).map(platform => (
        <a
          key={platform.id}
          className="social-link"
          href={platform.profileUrl}
          target="_blank"
          rel="me noopener noreferrer"
          aria-label={`${platform.name} — ${platform.handle}`}
          title={`${platform.name} — ${platform.handle}`}
        >
          <SocialMark id={platform.id} name={platform.name} />
          <span>Digitalivez on {platform.name}</span>
        </a>
      ))}
    </nav>
  )
}
