import { useState, useEffect } from 'react';

interface ShotClockProps {
  isMainClockRunning: boolean;
  onExpire: () => void;
}

export const ShotClock = ({ isMainClockRunning, onExpire }: ShotClockProps) => {
  const [time, setTime] = useState(24);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isMainClockRunning && time > 0) {
      const id = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerId(id);
      return () => clearInterval(id);
    } else if (timerId) {
      clearInterval(timerId);
    }
  }, [isMainClockRunning, time, onExpire]);

  const resetClock = () => {
    setTime(24);
  };

  return (
    <div className="retro-panel p-4 rounded-xl text-center">
      <div className="led-display text-5xl mb-2 text-retro-orange animate-glow">
        {String(time).padStart(2, '0')}
      </div>
      <button 
        onClick={resetClock} 
        className="retro-button text-sm py-2 px-4"
      >
        Reset Shot
      </button>
    </div>
  );
};