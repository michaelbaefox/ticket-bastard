import React from 'react';

interface ScanlineOverlayProps {
  opacity?: number;
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({ opacity = 0.03 }) => {
  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 -z-10"
    >
      <div 
        className="absolute inset-0 mix-blend-screen bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.08)_0px,rgba(255,255,255,.08)_1px,transparent_1px,transparent_3px)]" 
        style={{ opacity }}
      />
    </div>
  );
};