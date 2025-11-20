import { FootSection, GroundingPreset } from '../types/sequencer';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { RotateCw } from 'lucide-react';

interface FootControlsProps {
  rotation: number;
  onRotationChange: (rotation: number) => void;
  onPresetSelect: (sections: FootSection[]) => void;
  isLeft?: boolean;
  activePresets?: string[];
}

const leftPresets: GroundingPreset[] = [
  { name: 'Full', sections: ['L1', 'L2', 'L3', 'T1', 'T2', 'T3', 'T4', 'T5'], shorthand: 'L123T12345', keyLeft: 'Q' },
  { name: 'Front', sections: ['L1', 'L2', 'T1', 'T2', 'T3', 'T4', 'T5'], shorthand: 'L12T12345', keyLeft: 'W' },
  { name: 'Outside', sections: ['L2', 'L3', 'T5'], shorthand: 'L23T5', keyLeft: 'A' },
  { name: 'Inside', sections: ['L1', 'L3', 'T1'], shorthand: 'L13T1', keyLeft: 'S' },
  { name: 'Toes', sections: ['T1', 'T2', 'T3', 'T4', 'T5'], shorthand: 'LT12345', keyLeft: 'Z' },
  { name: 'Empty', sections: [], shorthand: 'EMPTY', keyLeft: 'X' },
  { name: 'Heel', sections: ['L3'], shorthand: 'L3', keyLeft: 'C' },
];

const rightPresets: GroundingPreset[] = [
  { name: 'Full', sections: ['R1', 'R2', 'R3', 'T1', 'T2', 'T3', 'T4', 'T5'], shorthand: 'R123T12345', keyRight: 'O' },
  { name: 'Front', sections: ['R1', 'R2', 'T1', 'T2', 'T3', 'T4', 'T5'], shorthand: 'R12T12345', keyRight: 'P' },
  { name: 'Inside', sections: ['R1', 'R3', 'T1'], shorthand: 'R13T1', keyRight: 'K' },
  { name: 'Outside', sections: ['R2', 'R3', 'T5'], shorthand: 'R23T5', keyRight: 'L' },
  { name: 'Toes', sections: ['T1', 'T2', 'T3', 'T4', 'T5'], shorthand: 'RT12345', keyRight: 'B' },
  { name: 'Empty', sections: [], shorthand: 'EMPTY', keyRight: 'N' },
  { name: 'Heel', sections: ['R3'], shorthand: 'R3', keyRight: 'M' },
];

export const FootControls = ({ rotation, onRotationChange, onPresetSelect, isLeft = false, activePresets = [] }: FootControlsProps) => {
  const presets = isLeft ? leftPresets : rightPresets;
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1">
        {presets.slice(0, 4).map((preset) => {
          const isActive = activePresets.includes(preset.shorthand);
          return (
            <Button
              key={preset.name}
              onClick={() => onPresetSelect(preset.sections)}
              variant="outline"
              className={`text-xs h-8 transition-all ${
                isActive 
                  ? 'bg-green-600 hover:bg-green-500 text-white border-green-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-green-500 border-green-500/30'
              }`}
            >
              {preset.name}
              <span className="text-[9px] opacity-70 ml-1">({isLeft ? preset.keyLeft : preset.keyRight})</span>
            </Button>
          );
        })}
      </div>
      
      <div className="grid grid-cols-3 gap-1">
        {presets.slice(4).map((preset) => {
          const isActive = activePresets.includes(preset.shorthand);
          return (
            <Button
              key={preset.name}
              onClick={() => onPresetSelect(preset.sections)}
              variant="outline"
              className={`text-xs h-8 transition-all ${
                isActive 
                  ? 'bg-green-600 hover:bg-green-500 text-white border-green-400' 
                  : 'bg-gray-800 hover:bg-gray-700 text-green-500 border-green-500/30'
              }`}
            >
              {preset.name}
              <span className="text-[9px] opacity-70 ml-1">({isLeft ? preset.keyLeft : preset.keyRight})</span>
            </Button>
          );
        })}
      </div>
      
      {/* Rotation Slider */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center text-[10px] text-green-500/70 font-mono px-1">
          <span>{isLeft ? 'E' : 'T'}</span>
          <span>{isLeft ? 'R' : 'Y'}</span>
          <span>{isLeft ? 'T' : 'I'}</span>
        </div>
        <Slider
          value={[rotation === -60 ? 0 : rotation === 0 ? 1 : 2]}
          onValueChange={(values) => {
            const position = values[0];
            const newRotation = position === 0 ? -60 : position === 1 ? 0 : 60;
            onRotationChange(newRotation);
          }}
          min={0}
          max={2}
          step={1}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};
