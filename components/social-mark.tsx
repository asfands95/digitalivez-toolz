type SocialMarkProps = {
  id: string
  name: string
  size?: number
}

export function SocialMark({ id, name, size = 20 }: SocialMarkProps) {
  return (
    <span className="social-mark" style={{ width: size, height: size }} aria-hidden="true">
      <span className="social-mark-fallback">{id === 'threads' ? '@' : name.slice(0, 1)}</span>
      <img
        src={`https://thesvg.org/icons/${id}/default.svg`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={event => { event.currentTarget.hidden = true }}
      />
    </span>
  )
}
