"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface DeviceModeContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

const DeviceModeContext = createContext<DeviceModeContextType | undefined>(undefined)

export function DeviceModeProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [isTablet, setIsTablet] = useState<boolean>(false)
  const [isDesktop, setIsDesktop] = useState<boolean>(true)

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth

      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setIsDesktop(width >= 1024)
    }

    // Initial check
    checkDeviceType()

    // Add event listener for window resize
    window.addEventListener("resize", checkDeviceType)

    // Cleanup
    return () => window.removeEventListener("resize", checkDeviceType)
  }, [])

  return (
    <DeviceModeContext.Provider
      value={{
        isMobile,
        isTablet,
        isDesktop,
      }}
    >
      {children}
    </DeviceModeContext.Provider>
  )
}

export function useDevice() {
  const context = useContext(DeviceModeContext)
  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceModeProvider")
  }
  return context
}
