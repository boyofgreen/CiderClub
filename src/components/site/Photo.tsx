import Image from 'next/image'

type PhotoProps = {
  src: string
  alt: string
  /** Fixed height, or leave unset to fill the grid cell (pair with minHeight). */
  height?: number | string
  minHeight?: number
  objectPosition?: string
  sizes?: string
  priority?: boolean
  /** `hc-img--md` or `hc-img--fill` to collapse the height on phones. */
  className?: string
}

export function Photo({
  src,
  alt,
  height = '100%',
  minHeight,
  objectPosition,
  sizes = '100vw',
  priority,
  className,
}: PhotoProps) {
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height, minHeight }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: 'cover', objectPosition }}
      />
    </div>
  )
}
