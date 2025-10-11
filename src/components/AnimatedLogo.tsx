import React from 'react'
import tbDown from '../assets/tb-down.svg'
import tbInsign from '../assets/tb-insign.svg'
import tbTitle from '../assets/tb-title.svg'

type AnimatedLogoProps = {
  className?: string
  onGlitchStateChange?: (isActive: boolean) => void
}

const parseCssTime = (node: HTMLElement, variableName: string) => {
  const rawValue = getComputedStyle(node).getPropertyValue(variableName)

  if (!rawValue) {
    return 0
  }

  const trimmed = rawValue.trim()

  if (trimmed.endsWith('ms')) {
    return Number.parseFloat(trimmed)
  }

  if (trimmed.endsWith('s')) {
    return Number.parseFloat(trimmed) * 1000
  }

  const parsed = Number.parseFloat(trimmed)

  return Number.isNaN(parsed) ? 0 : parsed
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, onGlitchStateChange }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const swapTimeoutRef = React.useRef<number | null>(null)
  const titleActivateRef = React.useRef<number | null>(null)
  const glitchActiveRef = React.useRef(false)

  const emitGlitchState = React.useCallback(
    (isActive: boolean) => {
      if (glitchActiveRef.current === isActive) {
        return
      }

      glitchActiveRef.current = isActive

      if (!onGlitchStateChange) {
        return
      }

      onGlitchStateChange(isActive)
    },
    [onGlitchStateChange],
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const element = containerRef.current
    const stageElement = stageRef.current

    if (!element || !stageElement) {
      return
    }

    element.style.setProperty('--parallax-offset', '0px')

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let revealFrameId = 0
    let revealNestedFrameId = 0

    const clearSwapTimeout = () => {
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current)
        swapTimeoutRef.current = null
      }
    }

    const clearTitleActivation = () => {
      if (titleActivateRef.current !== null) {
        window.clearTimeout(titleActivateRef.current)
        titleActivateRef.current = null
      }
    }

    const applyMotionPreference = () => {
      const currentElement = containerRef.current
      const currentStage = stageRef.current

      if (!currentElement || !currentStage) {
        return
      }

      window.cancelAnimationFrame(revealFrameId)
      window.cancelAnimationFrame(revealNestedFrameId)
      clearSwapTimeout()
      clearTitleActivation()
      emitGlitchState(false)

      if (mediaQuery.matches) {
        currentElement.classList.add('logo-reveal--instant')
        currentElement.classList.remove('logo-reveal--revealed')
        currentStage.classList.add('hand-stage--instant', 'hand-stage--swap', 'svg-stage--instant', 'svg-stage--active')
        currentStage.classList.remove('hand-stage--start')
        currentElement.style.setProperty('--parallax-offset', '0px')
        emitGlitchState(false)
        return
      }

      currentElement.classList.remove('logo-reveal--instant')
      currentStage.classList.remove('hand-stage--instant', 'hand-stage--swap', 'svg-stage--instant', 'svg-stage--active')
      currentStage.classList.add('hand-stage--start')
      revealFrameId = window.requestAnimationFrame(() => {
        revealNestedFrameId = window.requestAnimationFrame(() => {
          containerRef.current?.classList.add('logo-reveal--revealed')
        })
      })

      const reachDuration = parseCssTime(element, '--reach-duration')
      const overlapDuration = parseCssTime(element, '--swap-overlap')
      const swapDelay = Math.max(0, reachDuration - overlapDuration)
      swapTimeoutRef.current = window.setTimeout(() => {
        stageRef.current?.classList.remove('hand-stage--start')
        stageRef.current?.classList.add('hand-stage--swap')
        swapTimeoutRef.current = null
      }, swapDelay)

      const titleDelay = parseCssTime(element, '--title-delay')
      titleActivateRef.current = window.setTimeout(() => {
        stageRef.current?.classList.add('svg-stage--active')
        emitGlitchState(true)
        titleActivateRef.current = null
      }, titleDelay)
    }

    const handleScroll = () => {
      const currentElement = containerRef.current

      if (!currentElement || mediaQuery.matches) {
        return
      }

      const offset = Math.max(-84, Math.min(0, window.scrollY * -0.15))
      currentElement.style.setProperty('--parallax-offset', `${offset}px`)
    }

    applyMotionPreference()
    handleScroll()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', applyMotionPreference)
    } else {
      mediaQuery.addListener(applyMotionPreference)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', applyMotionPreference)
      } else {
        mediaQuery.removeListener(applyMotionPreference)
      }

      window.removeEventListener('scroll', handleScroll)
      window.cancelAnimationFrame(revealFrameId)
      window.cancelAnimationFrame(revealNestedFrameId)
      clearSwapTimeout()
      clearTitleActivation()
      emitGlitchState(false)
    }
  }, [emitGlitchState])

  return (
    <div
      ref={containerRef}
      className={`logo-reveal relative z-10 inline-flex w-full select-none items-center justify-center ${className ?? ''}`.trim()}
      aria-label="TicketBastard logo animation"
      role="img"
    >
      <div ref={stageRef} className="logo-reveal__stage" aria-hidden="true">
        <div className="logo-reveal__hand logo-reveal__hand--up">
          <img src={tbDown} alt="Illustrated hand with middle finger extended upright" loading="eager" draggable={false} />
        </div>
        <div className="logo-reveal__hand logo-reveal__hand--down">
          <img src={tbInsign} alt="Illustrated hand rotated downward" loading="eager" draggable={false} />
        </div>
        <div className="logo-reveal__title" role="presentation">
          <img src={tbTitle} alt="" loading="eager" draggable={false} />
        </div>
      </div>
    </div>
  )
}

export default AnimatedLogo

