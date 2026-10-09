'use client'

import { useState } from 'react'

export function Gallery({ images }: { images: { src: string; thumb: string; alt: string }[] }) {
  const [i, setI] = useState(0)
  const cur = images[i]
  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={cur.src} alt={cur.alt} width={1200} height={1200} />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((im, n) => (
            <button key={im.src} type="button" onClick={() => setI(n)} aria-label={`Ver imagen ${n + 1}`} aria-current={n === i}>
              <img src={im.thumb} alt="" width={120} height={120} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
