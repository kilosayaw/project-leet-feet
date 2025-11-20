import { BeatState } from '../types/sequencer';
import { getFootImage } from '../utils/footImages';

interface BeatGridProps {
  sequence: BeatState[];
  currentBar: number;
  currentBeat: number;
  onBeatSelect: (bar: number, beat: number) => void;
  isPlaying: boolean;
  isRecording: boolean;
  crossfaderPosition: 'left' | 'center' | 'right';
  clipboard: { type: 'bar' | 'beat' | null; data: BeatState[] | BeatState | null };
  onCopyBar: (bar: number) => void;
  onCopyBeat: (bar: number, beat: number) => void;
  onPasteBar: (bar: number) => void;
  onPasteBeat: (bar: number, beat: number) => void;
}

export const BeatGrid = ({ 
  sequence, 
  currentBar, 
  currentBeat, 
  onBeatSelect,
  isPlaying,
  isRecording,
  crossfaderPosition,
  clipboard,
  onCopyBar,
  onCopyBeat,
  onPasteBar,
  onPasteBeat
}: BeatGridProps) => {
  const beats = Array.from({ length: 8 }, (_, i) => {
    // Compute the two-bar window that contains the current bar
    const windowStartBar = currentBar - ((currentBar - 1) % 2);
    const bar = windowStartBar + Math.floor(i / 4);
    const beat = (i % 4) + 1;
    // Calculate the actual sequence index based on bar and beat
    const sequenceIndex = (bar - 1) * 4 + (beat - 1);
    const beatState = sequence[sequenceIndex];
    // Looping highlight logic: check if this is the current bar/beat
    const isActive = bar === currentBar && beat === currentBeat;

    return { bar, beat, beatIndex: i, beatState, isActive };
  });

  const isBarEmpty = (bar: number) => {
    for (let beat = 1; beat <= 4; beat++) {
      const index = (bar - 1) * 4 + (beat - 1);
      if (sequence[index]) return false;
    }
    return true;
  };

  return (
    <div className="flex gap-2 justify-center mb-2 max-w-7xl mx-auto">
      {beats.map(({ bar, beat, beatIndex, beatState, isActive }) => {
        const isFirstBeatOfBar = beat === 1;
        const isBeatEmpty = !beatState;
        const showPasteBar = isFirstBeatOfBar && isBeatEmpty && clipboard.type === 'bar';
        const showPasteBeat = isBeatEmpty && clipboard.type === 'beat';

        return (
          <div key={beatIndex} className="flex flex-col items-center gap-1">
            <button
              onClick={() => !isPlaying && !isRecording && onBeatSelect(bar, beat)}
              disabled={isPlaying || isRecording}
              className={`
                relative flex flex-col items-center justify-center
                w-36 h-28 rounded border-2 transition-all
                ${isActive 
                  ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/50' 
                  : 'border-green-500/30 bg-gray-900/50 hover:border-green-500/60'
                }
                ${!isPlaying && !isRecording ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
            >
          {/* Beat label */}
          <div className="absolute top-1 left-1 text-[10px] text-green-500/70 font-mono">
            {isActive ? `${currentBar}:${currentBeat}` : `${bar}:${beat}`}
          </div>

          {/* Foot thumbnails */}
          {beatState && (
            <div className="flex flex-col items-center justify-center h-full gap-0.5 pt-4 px-1">
              {/* Feet side by side */}
              <div className="flex items-center gap-1.5">
                {/* Left foot thumbnail */}
                <div className="w-16 h-20 rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={getFootImage(beatState.leftFoot.preset, true)}
                    alt="Left foot preset"
                    className="w-full h-full object-contain"
                    style={{ transform: `rotate(${beatState.leftFoot.rotation}deg)` }}
                  />
                </div>

                {/* Right foot thumbnail */}
                <div className="w-16 h-20 rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={getFootImage(beatState.rightFoot.preset, false)}
                    alt="Right foot preset"
                    className="w-full h-full object-contain"
                    style={{ transform: `rotate(${beatState.rightFoot.rotation}deg)` }}
                  />
                </div>
              </div>

              {/* Head placement indicator below feet - 8px hollow dot */}
              <div className="flex items-center w-full px-1 mt-1 mb-3">
                {beatState.crossfaderPosition === 'left' && (
                  <div className="w-1/2 flex justify-center">
                    <div className="w-2 h-2 rounded-full border-2 border-green-500"></div>
                  </div>
                )}
                {beatState.crossfaderPosition === 'center' && (
                  <div className="w-full flex justify-center">
                    <div className="w-2 h-2 rounded-full border-2 border-green-500"></div>
                  </div>
                )}
                {beatState.crossfaderPosition === 'right' && (
                  <div className="w-1/2 flex justify-center ml-auto">
                    <div className="w-2 h-2 rounded-full border-2 border-green-500"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!beatState && (
            <div className="text-green-500/30 text-xs">EMPTY</div>
          )}
            </button>

            {/* Copy/Paste buttons below pad */}
            <div className="flex flex-col gap-1 min-h-[20px] items-center justify-center">
              {!isPlaying && !isRecording && isActive && (
                <>
                  {/* Top row: Copy buttons */}
                  <div className="flex gap-1">
                    {isFirstBeatOfBar && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyBar(bar);
                        }}
                        className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 border border-green-500/40 rounded hover:bg-green-500/30 transition-colors"
                      >
                        Copy Bar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyBeat(bar, beat);
                      }}
                      className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 border border-green-500/40 rounded hover:bg-green-500/30 transition-colors"
                    >
                      Copy Beat
                    </button>
                  </div>
                  
                  {/* Bottom row: Replace buttons (only show if clipboard has data) */}
                  {clipboard.data && (
                    <div className="flex gap-1">
                      {clipboard.type === 'bar' && isFirstBeatOfBar && !isBarEmpty(bar) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBar(bar);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30 transition-colors"
                        >
                          Replace Bar
                        </button>
                      )}
                      {clipboard.type === 'bar' && isFirstBeatOfBar && isBarEmpty(bar) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBar(bar);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30 transition-colors"
                        >
                          Paste Bar
                        </button>
                      )}
                      {clipboard.type === 'beat' && !isBeatEmpty && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBeat(bar, beat);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30 transition-colors"
                        >
                          Replace Beat
                        </button>
                      )}
                      {clipboard.type === 'beat' && isBeatEmpty && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPasteBeat(bar, beat);
                          }}
                          className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded hover:bg-blue-500/30 transition-colors"
                        >
                          Paste Beat
                        </button>
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
