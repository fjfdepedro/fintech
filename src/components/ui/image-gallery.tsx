'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const images = [
  {
    src: '/laptop_1.webp',
    alt: 'Modern laptop with cryptocurrency trading dashboard and market analysis charts',
  },
  {
    src: '/laptop_2.webp',
    alt: 'Professional trading setup with multiple crypto price indicators and technical analysis',
  },
  {
    src: '/laptop_3.webp',
    alt: 'Cryptocurrency portfolio management interface on a sleek laptop display',
  },
  {
    src: '/laptop_4.webp',
    alt: 'Real-time crypto market monitoring with live trading data and performance metrics',
  },
]

export function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
        {/* Main Image */}
        <div className="relative aspect-[4/3] rounded-lg md:rounded-xl overflow-hidden shadow-lg">
          <Image
            src={images[selectedImage].src}
            alt={images[selectedImage].alt}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            priority
            sizes="(max-width: 768px) 90vw, 45vw"
          />
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {images.map((image, index) => (
            <button
              key={image.src}
              onClick={() => setSelectedImage(index)}
              className={cn(
                'relative aspect-[4/3] rounded-md md:rounded-lg overflow-hidden transition-all duration-300',
                selectedImage === index
                  ? 'ring-1 md:ring-2 ring-primary ring-offset-1 md:ring-offset-2'
                  : 'hover:opacity-90'
              )}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 45vw, 22vw"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 