import React, { createContext, useContext, useEffect, useState } from 'react'

interface AccessibilityContextType {
  highContrast: boolean
  reduceMotion: boolean
  largeText: boolean
  toggleHighContrast: () => void
  toggleReduceMotion: () => void
  toggleLargeText: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider')
  }
  return context
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [largeText, setLargeText] = useState(false)

  // Check system preferences on mount
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    
    setReduceMotion(prefersReducedMotion)
    setHighContrast(prefersHighContrast)
  }, [])

  // Apply accessibility classes to document
  useEffect(() => {
    const classList = document.documentElement.classList
    
    classList.toggle('high-contrast', highContrast)
    classList.toggle('reduce-motion', reduceMotion)
    classList.toggle('large-text', largeText)
  }, [highContrast, reduceMotion, largeText])

  const toggleHighContrast = () => setHighContrast(prev => !prev)
  const toggleReduceMotion = () => setReduceMotion(prev => !prev)
  const toggleLargeText = () => setLargeText(prev => !prev)

  return (
    <AccessibilityContext.Provider value={{
      highContrast,
      reduceMotion,
      largeText,
      toggleHighContrast,
      toggleReduceMotion,
      toggleLargeText,
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}