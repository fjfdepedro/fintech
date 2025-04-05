'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const images = [
  {
    src: '/laptop_1.webp',
    alt: 'Modern laptop with crypto trading dashboard and market analysis charts',
  },
  {
    src: '/laptop_2.webp',
    alt: 'Professional trading setup with multiple crypto price indicators and technical analysis',
  },
  {
    src: '/laptop_3.webp',
    alt: 'Crypto portfolio management interface on a sleek laptop display',
  },
  {
    src: '/laptop_4.webp',
    alt: 'Real-time crypto market monitoring with live trading data and performance metrics',
  },
]

export function ImageGallery() {
  const [imageOrder, setImageOrder] = useState([0, 1, 2, 3])

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly select two positions to swap
      const pos1 = Math.floor(Math.random() * 4)
      let pos2 = Math.floor(Math.random() * 4)
      while (pos2 === pos1) {
        pos2 = Math.floor(Math.random() * 4)
      }

      setImageOrder(prev => {
        const newOrder = [...prev]
        const temp = newOrder[pos1]
        newOrder[pos1] = newOrder[pos2]
        newOrder[pos2] = temp
        return newOrder
      })
    }, 5000) // Swap every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full hidden md:block">
      <div className="grid grid-cols-4 gap-4">
        {imageOrder.map((index) => (
          <div
            key={images[index].src}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg transition-all duration-500 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Image
              src={images[index].src}
              alt={images[index].alt}
              fill
              className="object-cover transition-all duration-500"
              sizes="(min-width: 768px) 25vw"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-sm font-medium line-clamp-2">{images[index].alt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 