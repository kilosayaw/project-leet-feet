import { BeatState } from '../types/sequencer';
import { Button } from './ui/button';

interface PoseGridProps {
  sequence: BeatState[];
  currentBar: number;
  currentBeat: number;
  onBeatSelect: (bar: number, beat: number) => void;
  onBeatView: (bar: number, beat: number) => void;
  totalBars: number;
  isPlaying: boolean;
  isRecording: boolean;
  clipboard: { type: 'bar' | 'beat' | null; data: BeatState[] | BeatState | null };
  onCopyBar: (bar: number) => void;
  onCopyBeat: (bar: number, beat: number) => void;
  onPasteBar: (bar: number) => void;
  onPasteBeat: (bar: number, beat: number) => void;
}

export const PoseGrid = ({ 
  sequence, 
  currentBar, 
  currentBeat, 
  onBeatSelect,
  onBeatView,
  totalBars,
  isPlaying,
  isRecording,
  clipboard,
  onCopyBar,
  onCopyBeat,
  onPasteBar,
  onPasteBeat
}: PoseGridProps) => {
  // Show 8 beats (2 bars) at a time - creates a moving window
  const windowStartBar = currentBar - ((currentBar - 1) % 2);
  const beats = Array.from({ length: 8 }, (_, i) => {
    const bar = windowStartBar + Math.floor(i / 4);
    const beat = (i % 4) + 1;
    const sequenceIndex = (bar - 1) * 4 + (beat - 1);
    const beatState = sequence[sequenceIndex];
    const isActive = bar === currentBar && beat === currentBeat;

    return { bar, beat, beatIndex: i, beatState, isActive };
  });

  return (
    <div className="flex gap-2 justify-center mb-2 max-w-7xl mx-auto">
      {beats.map(({ bar, beat, beatIndex, beatState, isActive }) => {
        const isFirstBeatOfBar = beat === 1;
        const isBeatEmpty = !beatState?.poseSnapshot;
        const showPasteBar = isFirstBeatOfBar && isBeatEmpty && clipboard.type === 'bar';
        const showPasteBeat = isBeatEmpty && clipboard.type === 'beat';

        return (
          <div key={beatIndex} className="flex flex-col items-center gap-1">
            <button
              onClick={() => !isPlaying && !isRecording && onBeatSelect(bar, beat)}
              onDoubleClick={() => !isPlaying && !isRecording && beatState?.poseSnapshot && onBeatView(bar, beat)}
              disabled={isPlaying || isRecording}
              className={`
                relative flex items-center justify-center
                w-36 h-28 rounded border-2 transition-all overflow-hidden
                ${isActive 
                  ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/50' 
                  : 'border-green-500/30 bg-gray-900/50 hover:border-green-500/60'
                }
                ${!isPlaying && !isRecording ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
            >
              {/* Beat label */}
              <div className="absolute top-1 left-1 text-[10px] text-green-500/70 font-mono z-10">
                {bar}:{beat}
              </div>

              {/* Pose snapshot or empty state */}
              {beatState?.poseSnapshot ? (
                <img
                  src={beatState.poseSnapshot.imageData}
                  alt={`Pose ${bar}:${beat}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-green-500/30 text-xs">
                  {bar > totalBars ? '—' : 'EMPTY'}
                </div>
              )}

              {/* Double-click hint */}
              {beatState?.poseSnapshot && !isPlaying && !isRecording && (
                <div className="absolute bottom-1 right-1 text-[8px] text-green-500/50 bg-black/50 px-1 rounded">
                  2x click
                </div>
              )}
            </button>

            {/* Copy/Paste buttons below pad */}
            <div className="flex flex-col gap-1 min-h-[20px] items-center justify-center">
              {!isPlaying && !isRecording && isActive && (
                <>
                  {/* Top row: Copy buttons */}
                  <div className="flex gap-1">
                    {isFirstBeatOfBar && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyBar(bar);
                        }}
                        size="sm"
                        className="h-6 px-2 text-[10px] bg-green-500/20 text-green-400 border border-green-500/40 rounded hover:bg-green-500/30"
                      >
                        Copy Bar
                      </Button>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyBeat(bar, beat);
                      }}
                      size="sm"
                      className="h-6 px-2 text-[10px] bg-green-500/20 text-green-400 border border-green-500/40 rounded hover:bg-green-500/30"
                    >
                      Copy Beat
                    </Button>
                  </div>
                  
                  {/* Bottom row: Replace buttons (only show if clipboard has data) */}
                  {clipboard.data && (
                    <div className="flex gap-1">
                      {clipboard.type === 'bar' && isFirstBeatOfBar && !isBeatEmpty && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBar(bar);
                          }}
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30"
                        >
                          Replace Bar
                        </Button>
                      )}
                      {clipboard.type === 'bar' && isFirstBeatOfBar && isBeatEmpty && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBar(bar);
                          }}
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30"
                        >
                          Paste Bar
                        </Button>
                      )}
                      {clipboard.type === 'beat' && !isBeatEmpty && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBeat(bar, beat);
                          }}
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30"
                        >
                          Replace Beat
                        </Button>
                      )}
                      {clipboard.type === 'beat' && isBeatEmpty && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBeat(bar, beat);
                          }}
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30"
                        >
                          Paste Beat
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};