import { useState, useEffect } from 'react';

interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'lg';
}

export const ScoreDisplay = ({ score, size = 'lg' }: ScoreDisplayProps) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    if (score !== displayScore) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setDisplayScore(score);
        setIsFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [score, displayScore]);

  const sizeClasses = size === 'lg' ? 'text-8xl' : 'text-4xl';

  return (
    <div className={`led-display ${sizeClasses} ${isFlipping ? 'animate-flip-up' : ''}`}>
      {String(displayScore).padStart(2, '0')}
    </div>
  );
};