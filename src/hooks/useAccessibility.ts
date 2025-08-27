import { useEffect, useRef, useCallback } from 'react'

export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null)

  const setFocus = useCallback((element?: HTMLElement) => {
    const target = element || focusRef.current
    if (target) {
      target.focus()
    }
  }, [])

  const trapFocus = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [])

  return { focusRef, setFocus, trapFocus }
}

export function useKeyboardNavigation() {
  const handleKeyPress = useCallback((e: KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }, [])

  const handleArrowNavigation = useCallback((
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    setCurrentIndex: (index: number) => void
  ) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (currentIndex + 1) % items.length
      setCurrentIndex(nextIndex)
      items[nextIndex]?.focus()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
      setCurrentIndex(prevIndex)
      items[prevIndex]?.focus()
    }
  }, [])

  return { handleKeyPress, handleArrowNavigation }
}

export function useAnnouncements() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    
    document.body.appendChild(announcement)
    announcement.textContent = message
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return { announce }
}