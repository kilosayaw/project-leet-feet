import { useEffect, useRef } from 'react';

export const useMetronome = (bpm: number, enabled: boolean, muted: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
      return;
    }

    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    
    // Resume audio context if suspended (required for user interaction)
    const resumeContext = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    };
    
    resumeContext();
    document.addEventListener('click', resumeContext, { once: true });
    
    const beatInterval = 60 / bpm; // seconds per beat
    
    nextBeatTimeRef.current = audioContext.currentTime + 0.05;

    const playClick = (time: number) => {
      if (!muted && audioContext.state === 'running') {
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 1000;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
          
          // Envelope for cleaner sound
          gainNode.gain.setValueAtTime(0.3, time);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
          
          oscillator.start(time);
          oscillator.stop(time + 0.05);
        } catch (e) {
          console.error('Metronome playback error:', e);
        }
      }
    };

    const scheduler = () => {
      const currentTime = audioContext.currentTime;
      
      // Schedule beats that should play in the next 100ms
      while (nextBeatTimeRef.current < currentTime + 0.1) {
        playClick(nextBeatTimeRef.current);
        nextBeatTimeRef.current += beatInterval;
      }
      
      timerIdRef.current = setTimeout(scheduler, 25);
    };

    scheduler();

    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, [bpm, enabled, muted]);

  return audioContextRef.current;
};
