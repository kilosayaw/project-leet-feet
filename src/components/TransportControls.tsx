import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Circle, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import metronomeIcon from '@/assets/metronome-icon.png';

interface TransportControlsProps {
  currentBar: number;
  currentBeat: number;
  bpm: number;
  isPlaying: boolean;
  isRecording: boolean;
  metronomeEnabled: boolean;
  metronomeMuted: boolean;
  leadInEnabled: boolean;
  leadInCount: number;
  onBarChange: (bar: number) => void;
  onBeatChange: (beat: number) => void;
  onBeatStep: (delta: number) => void;
  onBpmChange: (bpm: number) => void;
  onPlayToggle: () => void;
  onRecordToggle: () => void;
  onMetronomeToggle: () => void;
  onMuteToggle: () => void;
  onLeadInToggle: () => void;
}

export const TransportControls = ({
  currentBar,
  currentBeat,
  bpm,
  isPlaying,
  isRecording,
  metronomeEnabled,
  metronomeMuted,
  leadInEnabled,
  leadInCount,
  onBarChange,
  onBeatChange,
  onBeatStep,
  onBpmChange,
  onPlayToggle,
  onRecordToggle,
  onMetronomeToggle,
  onMuteToggle,
  onLeadInToggle,
}: TransportControlsProps) => {
  const [editingBar, setEditingBar] = useState(false);
  const [editingBeat, setEditingBeat] = useState(false);
  const [barInput, setBarInput] = useState(currentBar.toString());
  const [beatInput, setBeatInput] = useState(currentBeat.toString());

  const handleBarSubmit = () => {
    const newBar = parseInt(barInput);
    if (!isNaN(newBar) && newBar >= 1) {
      onBarChange(newBar);
    } else {
      setBarInput(currentBar.toString());
    }
    setEditingBar(false);
  };

  const handleBeatSubmit = () => {
    const newBeat = parseInt(beatInput);
    if (!isNaN(newBeat) && newBeat >= 1 && newBeat <= 4) {
      onBeatChange(newBeat);
    } else {
      setBeatInput(currentBeat.toString());
    }
    setEditingBeat(false);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900/50 rounded-lg border border-green-500/30">
      {/* Bar and Beat Display */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Bar</label>
          {editingBar ? (
            <Input
              type="number"
              value={barInput}
              onChange={(e) => setBarInput(e.target.value)}
              onBlur={handleBarSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBarSubmit();
                if (e.key === 'Escape') {
                  setBarInput(currentBar.toString());
                  setEditingBar(false);
                }
              }}
              className="led-display text-2xl text-center bg-black border-green-500/50"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBarChange(Math.max(1, currentBar - 1))}
                aria-label="Previous bar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div
                onClick={() => {
                  setEditingBar(true);
                  setBarInput(currentBar.toString());
                }}
                className="led-display text-2xl text-center p-2 bg-black border border-green-500/50 rounded cursor-pointer hover:border-green-500 flex-1"
              >
                {leadInCount > 0 ? '---' : currentBar}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBarChange(currentBar + 1)}
                aria-label="Next bar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Beat</label>
          {editingBeat ? (
            <Input
              type="number"
              value={beatInput}
              onChange={(e) => setBeatInput(e.target.value)}
              onBlur={handleBeatSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBeatSubmit();
                if (e.key === 'Escape') {
                  setBeatInput(currentBeat.toString());
                  setEditingBeat(false);
                }
              }}
              className="led-display text-2xl text-center bg-black border-green-500/50"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBeatStep(-1)}
                aria-label="Previous beat"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div
                onClick={() => {
                  setEditingBeat(true);
                  setBeatInput(currentBeat.toString());
                }}
                className="led-display text-2xl text-center p-2 bg-black border border-green-500/50 rounded cursor-pointer hover:border-green-500 flex-1"
              >
                {leadInCount > 0 ? leadInCount : currentBeat}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onBeatStep(1)}
                aria-label="Next beat"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* BPM Control */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">
          BPM: <span className="led-display text-green-500">{bpm}</span>
        </label>
        <Slider
          value={[bpm]}
          onValueChange={([value]) => onBpmChange(value)}
          min={40}
          max={200}
          step={1}
          className="w-full"
        />
      </div>

      {/* Transport Buttons */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={isPlaying ? 'default' : 'outline'}
          size="lg"
          onClick={onPlayToggle}
          className="w-20"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button
          variant={isRecording ? 'destructive' : 'outline'}
          size="lg"
          onClick={onRecordToggle}
          className="w-20"
        >
          <Circle className={`h-5 w-5 ${isRecording ? 'fill-current' : ''}`} />
        </Button>
        <Button
          variant={leadInEnabled ? 'default' : 'outline'}
          size="lg"
          onClick={onLeadInToggle}
          className="w-20"
          title="4 Count Lead-In"
        >
          <Timer className="h-5 w-5" />
        </Button>
        <Button
          variant={metronomeMuted ? 'outline' : 'default'}
          size="lg"
          onClick={onMuteToggle}
          className="w-20 relative"
          title="Metronome"
        >
          <img 
            src={metronomeIcon} 
            alt="Metronome" 
            className={`h-5 w-5 ${metronomeMuted ? 'opacity-50' : ''}`}
          />
          {metronomeMuted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-current rotate-45" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};
