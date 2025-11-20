import { useEffect } from 'react';
import { FootSection } from '../types/sequencer';

interface KeyboardControlsHandlers {
  onLeftPreset: (sections: FootSection[]) => void;
  onRightPreset: (sections: FootSection[]) => void;
  onLeftRotation: (rotation: number) => void;
  onRightRotation: (rotation: number) => void;
  onHeadLeft: () => void;
  onHeadRight: () => void;
  onHeadCenter: () => void;
  onPadTrigger?: (padNumber: number) => void;
}

const leftPresetMap: Record<string, FootSection[]> = {
  'q': ['L1', 'L2', 'L3', 'T1', 'T2', 'T3', 'T4', 'T5'], // Full
  'w': ['L1', 'L2', 'T1', 'T2', 'T3', 'T4', 'T5'], // Front
  'a': ['L2', 'L3', 'T5'], // Outside
  's': ['L1', 'L3', 'T1'], // Inside
  'z': ['T1', 'T2', 'T3', 'T4', 'T5'], // Toes
  'x': [], // Empty
  'c': ['L3'], // Heel
};

const rightPresetMap: Record<string, FootSection[]> = {
  'o': ['R1', 'R2', 'R3', 'T1', 'T2', 'T3', 'T4', 'T5'], // Full
  'p': ['R1', 'R2', 'T1', 'T2', 'T3', 'T4', 'T5'], // Front
  'k': ['R1', 'R3', 'T1'], // Inside
  'l': ['R2', 'R3', 'T5'], // Outside
  'b': ['T1', 'T2', 'T3', 'T4', 'T5'], // Toes
  'n': [], // Empty
  'm': ['R3'], // Heel
};

export const useKeyboardControls = (handlers: KeyboardControlsHandlers, isEnabled: boolean) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Check for ctrl keys for head placement
      if (e.ctrlKey || e.key === 'Control') {
        if (e.location === 1) { // Left ctrl
          handlers.onHeadLeft();
          e.preventDefault();
          return;
        } else if (e.location === 2) { // Right ctrl
          handlers.onHeadRight();
          e.preventDefault();
          return;
        }
      }

      // Left foot presets
      if (leftPresetMap[key]) {
        handlers.onLeftPreset(leftPresetMap[key]);
        e.preventDefault();
        return;
      }

      // Right foot presets
      if (rightPresetMap[key]) {
        handlers.onRightPreset(rightPresetMap[key]);
        e.preventDefault();
        return;
      }

      // Left foot rotation controls
      if (key === 'e') {
        handlers.onLeftRotation(-60); // 10 o'clock
        e.preventDefault();
      } else if (key === 'r') {
        handlers.onLeftRotation(0); // 12 o'clock
        e.preventDefault();
      } else if (key === 't') {
        handlers.onLeftRotation(60); // 2 o'clock
        e.preventDefault();
      }
      
      // Right foot rotation controls
      if (key === 'y') {
        handlers.onRightRotation(-60); // 10 o'clock
        e.preventDefault();
      } else if (key === 'u') {
        handlers.onRightRotation(0); // 12 o'clock
        e.preventDefault();
      } else if (key === 'i') {
        handlers.onRightRotation(60); // 2 o'clock
        e.preventDefault();
      }

      // Arrow keys for crossfader/head placement
      if (key === 'arrowleft') {
        handlers.onHeadLeft();
        e.preventDefault();
      } else if (key === 'arrowup') {
        handlers.onHeadCenter();
        e.preventDefault();
      } else if (key === 'arrowright') {
        handlers.onHeadRight();
        e.preventDefault();
      }

      // Number keys 1-8 for pad triggering
      if (handlers.onPadTrigger && /^[1-8]$/.test(key)) {
        const padNumber = parseInt(key);
        handlers.onPadTrigger(padNumber);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, isEnabled]);
};
