import { Slider } from './ui/slider';
import { ArrowLeft, ArrowUp, ArrowRight } from 'lucide-react';

interface CrossfaderProps {
  position: 'left' | 'center' | 'right';
  onPositionChange: (position: 'left' | 'center' | 'right') => void;
}

export const Crossfader = ({ position, onPositionChange }: CrossfaderProps) => {
  const positionToValue = { left: 0, center: 50, right: 100 };
  const valueToPosition = (value: number): 'left' | 'center' | 'right' => {
    if (value < 33) return 'left';
    if (value < 67) return 'center';
    return 'right';
  };

  const handleSliderChange = (value: number) => {
    const newPosition = valueToPosition(value);
    // Only trigger change if position actually changed
    if (newPosition !== position) {
      onPositionChange(newPosition);
    }
  };

  const handleArrowClick = (targetPosition: 'left' | 'center' | 'right') => {
    if (targetPosition !== position) {
      onPositionChange(targetPosition);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg border border-green-500/30">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-sm text-green-500 mb-1">Head Placement Indicator</h3>
          <div className="led-display text-xl text-green-500">
            {position === 'left' && 'HEAD OVER LEFT FOOT'}
            {position === 'center' && 'HEAD OVER CENTER'}
            {position === 'right' && 'HEAD OVER RIGHT FOOT'}
          </div>
        </div>
        
        <div className="space-y-2">
          <Slider
            value={[positionToValue[position]]}
            onValueChange={([value]) => handleSliderChange(value)}
            min={0}
            max={100}
            step={50}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <button
              onClick={() => handleArrowClick('left')}
              className={`flex items-center gap-1 transition-colors hover:text-green-400 cursor-pointer ${
                position === 'left' ? 'text-green-500 font-bold' : ''
              }`}
            >
              <ArrowLeft size={14} /> Left Foot
            </button>
            <button
              onClick={() => handleArrowClick('center')}
              className={`flex items-center gap-1 transition-colors hover:text-green-400 cursor-pointer ${
                position === 'center' ? 'text-green-500 font-bold' : ''
              }`}
            >
              <ArrowUp size={14} /> Center
            </button>
            <button
              onClick={() => handleArrowClick('right')}
              className={`flex items-center gap-1 transition-colors hover:text-green-400 cursor-pointer ${
                position === 'right' ? 'text-green-500 font-bold' : ''
              }`}
            >
              Right Foot <ArrowRight size={14} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className={`h-2 rounded ${position === 'left' ? 'bg-green-500' : 'bg-gray-700'}`} />
          <div className={`h-2 rounded ${position === 'center' ? 'bg-green-500' : 'bg-gray-700'}`} />
          <div className={`h-2 rounded ${position === 'right' ? 'bg-green-500' : 'bg-gray-700'}`} />
        </div>
      </div>
    </div>
  );
};