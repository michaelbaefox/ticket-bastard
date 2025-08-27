import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Global accessibility context for managing app-wide accessibility features
 */

interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderActive: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  keyboardNavigation: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
  setReducedMotion: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [state, setState] = useState<AccessibilityState>({
    reducedMotion: false,
    highContrast: false,
    screenReaderActive: false,
    fontSize: 'normal',
    keyboardNavigation: false
  });

  // Detect user preferences from system/browser
  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setState(prev => ({ ...prev, reducedMotion: reducedMotionQuery.matches }));

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setState(prev => ({ ...prev, highContrast: highContrastQuery.matches }));

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, highContrast: e.matches }));
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Detect screen reader usage
    const detectScreenReader = () => {
      // Various ways to detect screen reader activity
      const hasScreenReader = 
        !!navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|Dragon/i) ||
        window.speechSynthesis?.speaking ||
        document.querySelector('[aria-live]') !== null;
      
      setState(prev => ({ ...prev, screenReaderActive: hasScreenReader }));
    };

    detectScreenReader();

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, keyboardNavigation: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, keyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Load saved preferences
    const savedPrefs = localStorage.getItem('accessibility-preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse accessibility preferences:', error);
      }
    }

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const prefsToSave = {
      fontSize: state.fontSize,
      // Don't save system-detected preferences
    };
    localStorage.setItem('accessibility-preferences', JSON.stringify(prefsToSave));
  }, [state.fontSize]);

  // Apply CSS classes based on state
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    // Reduced motion
    if (state.reducedMotion) {
      htmlElement.classList.add('reduced-motion');
    } else {
      htmlElement.classList.remove('reduced-motion');
    }

    // High contrast
    if (state.highContrast) {
      htmlElement.classList.add('high-contrast');
    } else {
      htmlElement.classList.remove('high-contrast');
    }

    // Font size
    htmlElement.classList.remove('font-large', 'font-extra-large');
    if (state.fontSize === 'large') {
      htmlElement.classList.add('font-large');
    } else if (state.fontSize === 'extra-large') {
      htmlElement.classList.add('font-extra-large');
    }

    // Keyboard navigation
    if (state.keyboardNavigation) {
      htmlElement.classList.add('keyboard-navigation');
    } else {
      htmlElement.classList.remove('keyboard-navigation');
    }
  }, [state]);

  // Screen reader announcement function
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 1000);
  };

  const contextValue: AccessibilityContextType = {
    ...state,
    setReducedMotion: (value: boolean) => setState(prev => ({ ...prev, reducedMotion: value })),
    setHighContrast: (value: boolean) => setState(prev => ({ ...prev, highContrast: value })),
    setFontSize: (size: 'normal' | 'large' | 'extra-large') => setState(prev => ({ ...prev, fontSize: size })),
    announceToScreenReader
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};