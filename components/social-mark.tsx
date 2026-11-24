type SocialMarkProps = {
  id: string
  name: string
  size?: number
}

export function SocialMark({ id, name, size = 20 }: SocialMarkProps) {
  const symbols: Record<string, string> = { facebook: 'f', threads: '@', x: 'X', youtube: '▶' }
  return (
    <span className="social-mark" style={{ width: size, height: size }} aria-hidden="true">
      <span className="social-mark-text" data-platform={id}>{symbols[id] ?? name.slice(0, 1)}</span>
    </span>
  )
}
