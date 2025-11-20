import { useState, useEffect } from 'react';
import { ShotClock } from './ShotClock';
import { useToast } from '@/hooks/use-toast';

export const Timer = () => {
  const [time, setTime] = useState(600); // 10 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isRunning && time > 0) {
      const id = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 0) {
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      setTimerId(id);
      return () => clearInterval(id);
    } else if (timerId) {
      clearInterval(timerId);
    }
  }, [isRunning, time]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(600); // Reset to 10 minutes
    if (timerId) {
      clearInterval(timerId);
    }
  };

  const handleShotClockExpire = () => {
    toast({
      title: "Shot Clock Expired!",
      description: "24 Second Violation",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-4">
      <div className="retro-panel p-6 rounded-xl text-center bg-retro-dark border-2 border-retro-orange shadow-[0_0_15px_theme('colors.retro.glow')]">
        <div className="led-display text-6xl mb-4 text-retro-orange animate-glow">
          {formatTime(time)}
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={handleStartStop} className="retro-button">
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button onClick={handleReset} className="retro-button">Reset</button>
        </div>
      </div>
      <ShotClock 
        isMainClockRunning={isRunning}
        onExpire={handleShotClockExpire}
      />
    </div>
  );
};