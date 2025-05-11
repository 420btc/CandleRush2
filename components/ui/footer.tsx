"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function Footer() {
  const [showFooter, setShowFooter] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrolled = window.scrollY
      
      // Mostrar footer cuando se llegue al 80% de la página
      if (scrolled + windowHeight >= documentHeight * 0.8) {
        setShowFooter(true)
      } else {
        setShowFooter(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!showFooter) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black p-4 flex justify-center gap-4">
      <Link href="/menu" className="flex items-center gap-2 p-2 rounded-md bg-yellow-400 text-black hover:bg-yellow-300 transition-colors">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-black">
          <path d="M19 12h-14M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Volver al Menú</span>
      </Link>
      <Link href="/game" className="flex items-center gap-2 p-2 rounded-md bg-yellow-400 text-black hover:bg-yellow-300 transition-colors">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-black">
          <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 10l4 5l4-5M12 10l-4 5l-4-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Jugar a CandleRush</span>
      </Link>
    </div>
  )
}
