import { FootState } from '../types/sequencer';
import { useRef, useState, useEffect } from 'react';
import { getFootImage } from '../utils/footImages';
import emptyWheel from '../assets/empty-wheel.png';

interface FootDisplayProps {
  footState: FootState;
  isLeft?: boolean;
  isHighlighted?: boolean;
  onRotationChange?: (rotation: number) => void;
}

// Preset images are provided via a shared util to keep BeatGrid and FootDisplay in sync

export const FootDisplay = ({ footState, isLeft = false, isHighlighted = false, onRotationChange }: FootDisplayProps) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
// Get the appropriate preset image
  const footImage = getFootImage(footState.preset, isLeft);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onRotationChange) return;
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const r = Math.sqrt(dx * dx + dy * dy);
    const outerThreshold = Math.min(rect.width, rect.height) * 0.35; // near outer ring only
    if (r < outerThreshold) return; // start drag only on ring
    setIsDragging(true);
    updateRotation(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onRotationChange) return;
    updateRotation(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateRotation = (clientX: number, clientY: number) => {
    if (!wheelRef.current || !onRotationChange) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    const raw = (angle + 90 + 360) % 360; // 0 is up (12 o'clock)

    const candidates = [0, 60, 300]; // 12 o'clock, 2 o'clock, 10 o'clock
    let snappedDeg = 0;
    let minDist = 999;
    for (const c of candidates) {
      const diff = Math.abs(c - raw);
      const dist = Math.min(diff, 360 - diff);
      if (dist < minDist) {
        minDist = dist;
        snappedDeg = c;
      }
    }

    const snappedRotation = snappedDeg === 300 ? -60 : snappedDeg;
    if (snappedRotation !== footState.rotation) {
      onRotationChange(snappedRotation);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);
  
  return (
    <div className="relative w-64 h-64 flex items-center justify-center rounded-lg transition-all bg-black">
      {/* Turntable wheel background */}
      <div 
        ref={wheelRef}
        className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <img 
          src={emptyWheel} 
          alt="Turntable wheel"
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
      
      {/* Foot image centered and rotated */}
      <div 
        className="relative w-32 h-40 flex items-center justify-center pointer-events-none" 
        style={{ transform: `rotate(${footState.rotation}deg)` }}
      >
        <img 
          src={footImage} 
          alt={isLeft ? "Left foot" : "Right foot"}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
