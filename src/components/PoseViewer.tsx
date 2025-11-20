import { useState, useEffect } from 'react';
import { BeatState } from '../types/sequencer';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface PoseViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sequence: BeatState[];
  initialBar: number;
  initialBeat: number;
  onBeatSelect: (bar: number, beat: number) => void;
}

export const PoseViewer = ({ 
  isOpen, 
  onClose, 
  sequence, 
  initialBar, 
  initialBeat,
  onBeatSelect
}: PoseViewerProps) => {
  const [currentBar, setCurrentBar] = useState(initialBar);
  const [currentBeat, setCurrentBeat] = useState(initialBeat);

  // Update when props change
  useEffect(() => {
    setCurrentBar(initialBar);
    setCurrentBeat(initialBeat);
  }, [initialBar, initialBeat]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const maxBar = Math.max(8, Math.ceil(sequence.length / 4));
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        // Previous beat
        if (currentBeat === 1) {
          if (currentBar > 1) {
            setCurrentBar(currentBar - 1);
            setCurrentBeat(4);
          }
        } else {
          setCurrentBeat(currentBeat - 1);
        }
      } else if (e.key === 'ArrowRight') {
        // Next beat
        if (currentBeat === 4) {
          if (currentBar < maxBar) {
            setCurrentBar(currentBar + 1);
            setCurrentBeat(1);
          }
        } else {
          setCurrentBeat(currentBeat + 1);
        }
      } else if (e.key === 'ArrowUp') {
        // Previous bar
        if (currentBar > 1) {
          setCurrentBar(currentBar - 1);
        }
      } else if (e.key === 'ArrowDown') {
        // Next bar
        if (currentBar < maxBar) {
          setCurrentBar(currentBar + 1);
        }
      } else if (e.key >= '1' && e.key <= '8') {
        // Jump to specific beat in current window and trigger audio
        const windowStartBar = currentBar - ((currentBar - 1) % 2);
        const padNumber = parseInt(e.key);
        const newBar = windowStartBar + Math.floor((padNumber - 1) / 4);
        const newBeat = ((padNumber - 1) % 4) + 1;
        
        if (newBar <= maxBar) {
          setCurrentBar(newBar);
          setCurrentBeat(newBeat);
          onBeatSelect(newBar, newBeat);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentBar, currentBeat, sequence.length, onClose, onBeatSelect]);

  if (!isOpen) return null;

  const sequenceIndex = (currentBar - 1) * 4 + (currentBeat - 1);
  const currentBeatState = sequence[sequenceIndex];
  const maxBar = Math.max(8, Math.ceil(sequence.length / 4));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[90vh] bg-gray-900 rounded-lg border-2 border-green-500/50 shadow-2xl shadow-green-500/20 flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-green-500/30">
          <h2 className="text-xl font-bold text-green-500">Pose Viewer</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-green-500 hover:bg-green-500/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentBeatState?.poseSnapshot ? (
            <img
              src={currentBeatState.poseSnapshot.imageData}
              alt={`Pose ${currentBar}:${currentBeat}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-green-500/50 text-2xl">No pose captured</div>
          )}
        </div>

        {/* Navigation controls at bottom */}
        <div className="p-6 border-t border-green-500/30 bg-gray-800/50">
          <div className="flex items-center justify-center gap-8">
            {/* Bar navigation */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (currentBar > 1) {
                    setCurrentBar(currentBar - 1);
                  }
                }}
                disabled={currentBar === 1}
                variant="outline"
                size="icon"
                className="h-10 w-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center min-w-[100px]">
                <div className="text-xs text-gray-400 uppercase">Bar</div>
                <div className="led-display text-2xl text-green-500">{currentBar}</div>
              </div>
              <Button
                onClick={() => {
                  if (currentBar < maxBar) {
                    setCurrentBar(currentBar + 1);
                  }
                }}
                disabled={currentBar >= maxBar}
                variant="outline"
                size="icon"
                className="h-10 w-10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Beat navigation */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (currentBeat === 1) {
                    if (currentBar > 1) {
                      setCurrentBar(currentBar - 1);
                      setCurrentBeat(4);
                    }
                  } else {
                    setCurrentBeat(currentBeat - 1);
                  }
                }}
                disabled={currentBar === 1 && currentBeat === 1}
                variant="outline"
                size="icon"
                className="h-10 w-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center min-w-[100px]">
                <div className="text-xs text-gray-400 uppercase">Beat</div>
                <div className="led-display text-2xl text-green-500">{currentBeat}</div>
              </div>
              <Button
                onClick={() => {
                  if (currentBeat === 4) {
                    if (currentBar < maxBar) {
                      setCurrentBar(currentBar + 1);
                      setCurrentBeat(1);
                    }
                  } else {
                    setCurrentBeat(currentBeat + 1);
                  }
                }}
                disabled={currentBar >= maxBar && currentBeat === 4}
                variant="outline"
                size="icon"
                className="h-10 w-10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="mt-4 text-center text-xs text-gray-500">
            Use arrow keys: ← → for beats, ↑ ↓ for bars | Number keys 1-8 to jump | ESC to close
          </div>
        </div>
      </div>
    </div>
  );
};