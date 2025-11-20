import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FootSection, SequencerState, BeatState, PoseLandmark } from '../types/sequencer';
import { FootDisplay } from '../components/FootDisplay';
import { FootControls } from '../components/FootControls';
import { TransportControls } from '../components/TransportControls';
import { Crossfader } from '../components/Crossfader';
import { HelpCircle, Video, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BeatGrid } from '../components/BeatGrid';
import { SequenceManager } from '../components/SequenceManager';
import { useMetronome } from '../hooks/useMetronome';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { Button } from '../components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { PoseCapture } from '../components/PoseCapture';
import { PoseGrid } from '../components/PoseGrid';
import { PoseViewer } from '../components/PoseViewer';


const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [sequenceName, setSequenceName] = useState<string>('Untitled Sequence');
  const [originalBpm, setOriginalBpm] = useState<number>(120);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [state, setState] = useState<SequencerState>({
    currentBar: 1,
    currentBeat: 1,
    bpm: 120,
    isPlaying: false,
    isRecording: false,
    metronomeEnabled: true,
    metronomeMuted: false,
    leadInEnabled: false,
    leadInCount: 0,
    crossfaderPosition: 'center',
    leftFoot: {
      groundedSections: [],
      rotation: 0,
      hasHeadPlacement: false,
      preset: 'default',
    },
    rightFoot: {
      groundedSections: [],
      rotation: 0,
      hasHeadPlacement: false,
      preset: 'default',
    },
    sequence: [],
    currentSequence: null,
    activePresets: {
      left: [],
      right: [],
    },
    captureMode: 'feet', // NEW
    isCameraActive: false, // NEW
    mirrorVideo: true, // NEW
  });

  const [clipboard, setClipboard] = useState<{
    type: 'bar' | 'beat' | null;
    data: BeatState[] | BeatState | null;
  }>({ type: null, data: null });

  const [poseViewerOpen, setPoseViewerOpen] = useState(false);
  const [viewerBar, setViewerBar] = useState(1);
  const [viewerBeat, setViewerBeat] = useState(1);

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlaybackRef = useRef<number | null>(null);
  const [shouldCapture, setShouldCapture] = useState(false);

// Capture snapshot handler
const handlePoseSnapshot = useCallback((imageData: string, landmarks: PoseLandmark[]) => {
  setState(prev => {
    const sequenceIndex = (prev.currentBar - 1) * 4 + (prev.currentBeat - 1);
    const newSequence = [...prev.sequence];
    
    // Get existing beat state or create new one
    const existingBeat = newSequence[sequenceIndex];
    
    newSequence[sequenceIndex] = {
      leftFoot: existingBeat?.leftFoot || {
        groundedSections: [],
        rotation: 0,
        hasHeadPlacement: false,
        preset: 'default',
      },
      rightFoot: existingBeat?.rightFoot || {
        groundedSections: [],
        rotation: 0,
        hasHeadPlacement: false,
        preset: 'default',
      },
      crossfaderPosition: existingBeat?.crossfaderPosition || 'center',
      poseSnapshot: {
        imageData,
        timestamp: Date.now(),
        landmarks
      }
    };

    return { ...prev, sequence: newSequence };
  });
  
  setShouldCapture(false);
}, []);

const handleBeatView = useCallback((bar: number, beat: number) => {
  setViewerBar(bar);
  setViewerBeat(beat);
  setPoseViewerOpen(true);
}, []);

// Trigger capture on each beat during recording (but NOT during lead-in)
useEffect(() => {
  if (state.isRecording && state.isPlaying && state.captureMode === 'poses' && state.leadInCount === 0) {
    setShouldCapture(true);
  }
}, [state.currentBeat, state.currentBar, state.isRecording, state.isPlaying, state.captureMode, state.leadInCount]);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load shared sequence if passed via navigation state
  useEffect(() => {
      interface LocationState {
    loadSequence?: {
      name: string;
      bpm: number;
      beats: BeatState[];
      audioUrl?: string;
      audioFilename?: string;
    };
  }

  const state = location.state as LocationState;
    if (state?.loadSequence) {
      const { name, bpm, beats, audioUrl, audioFilename } = state.loadSequence;
      handleLoadSequence(bpm, beats, name, audioUrl, audioFilename);
      
      toast({
        title: "Sequence Loaded",
        description: `"${name}" is ready to play`,
      });

      // Clear the state so it doesn't reload on every render
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate, toast]);

  const handleSignOut = async () => {
    try {
      // Always clear local state, even if backend signOut fails
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error (non-critical):', error);
    } finally {
      // Always navigate to auth page regardless of errors
      navigate('/auth');
    }
  };

  const handleLoadSequence = (bpm: number, beats: BeatState[], name: string, audioUrl?: string, audioFilename?: string) => {
    setState(prev => ({
      ...prev,
      bpm,
      sequence: beats,
    }));
    setSequenceName(name);
    
    // Load audio if available
    if (audioUrl) {
      setAudioUrl(audioUrl);
      setOriginalBpm(bpm);
      if (audioFilename) {
        setAudioFileName(audioFilename);
      }
    }
  };

  const handleBpmDetected = (bpm: number, duration: number, audioUrl: string, fileName?: string) => {
    setState(prev => ({
      ...prev,
      bpm,
    }));
    
    setOriginalBpm(bpm);
    setAudioUrl(audioUrl);
    if (fileName) {
      setAudioFileName(fileName);
    }
    
    toast({
      title: "BPM Applied",
      description: `Set BPM to ${bpm} from audio file. Audio ready for playback.`,
    });
  };

  const handleNewSequence = () => {
    setState(prev => ({
      ...prev,
      sequence: [],
      currentBar: 1,
      currentBeat: 1,
    }));
    setSequenceName('Untitled Sequence');
    toast({
      title: "New Sequence",
      description: "Created a new empty sequence",
    });
  };

  const updateLeftFoot = (updates: Partial<typeof state.leftFoot>) => {
    setState(prev => ({
      ...prev,
      leftFoot: { ...prev.leftFoot, ...updates }
    }));
  };

  const updateRightFoot = (updates: Partial<typeof state.rightFoot>) => {
    setState(prev => ({
      ...prev,
      rightFoot: { ...prev.rightFoot, ...updates }
    }));
  };

  const handleBarChange = (delta: number) => {
    setState(prev => {
      const newBar = Math.max(1, prev.currentBar + delta);
      
      // Seek audio to the new position
      if (audioRef.current && audioUrl) {
        const totalBeats = (newBar - 1) * 4 + (prev.currentBeat - 1);
        const beatDurationOriginal = 60 / originalBpm;
        const audioPosition = totalBeats * beatDurationOriginal;
        audioRef.current.currentTime = audioPosition;
      }
      
      return {
        ...prev,
        currentBar: newBar
      };
    });
  };

  const handleBeatChange = (delta: number) => {
    setState(prev => {
      let newBeat = prev.currentBeat + delta;
      let newBar = prev.currentBar;
      
      if (newBeat > 4) {
        newBeat = 1;
        newBar++;
      } else if (newBeat < 1) {
        newBeat = 4;
        newBar--;
        // Don't go below bar 1
        if (newBar < 1) {
          const maxBars = Math.max(Math.ceil(prev.sequence.length / 4), 8);
          newBar = maxBars;
        }
      }
      
      // Seek audio to the new position
      if (audioRef.current && audioUrl) {
        const totalBeats = (newBar - 1) * 4 + (newBeat - 1);
        const beatDurationOriginal = 60 / originalBpm;
        const audioPosition = totalBeats * beatDurationOriginal;
        audioRef.current.currentTime = audioPosition;
      }
      
      return { ...prev, currentBeat: newBeat, currentBar: newBar };
    });
  };

  // Update head placement based on crossfader position
  const handleCrossfaderChange = (position: 'left' | 'center' | 'right') => {
  setState(prev => ({
    ...prev,
    crossfaderPosition: position,
    leftFoot: {
      ...prev.leftFoot,
      hasHeadPlacement: position === 'left'
    },
    rightFoot: {
      ...prev.rightFoot,
      hasHeadPlacement: position === 'right'
    }
  }));
  
  // CRITICAL: Capture the beat state so it saves to the sequence
  // Use setTimeout to ensure state is updated first
  setTimeout(() => {
    captureBeatState();
  }, 0);
};

// Helper to determine preset shorthand from sections
const getPresetShorthand = (sections: FootSection[], isLeft: boolean): string => {
  if (sections.length === 0) return 'EMPTY';
  
  const presets = isLeft ? [
    { sections: ['L1', 'L2', 'L3', 'T1', 'T2', 'T3', 'T4', 'T5'] as FootSection[], shorthand: 'L123T12345' },
    { sections: ['L1', 'L2', 'T1', 'T2', 'T3', 'T4', 'T5'] as FootSection[], shorthand: 'L12T12345' },
    { sections: ['L1', 'L3', 'T1'] as FootSection[], shorthand: 'L13T1' },
    { sections: ['L2', 'L3', 'T5'] as FootSection[], shorthand: 'L23T5' },
    { sections: ['T1', 'T2', 'T3', 'T4', 'T5'] as FootSection[], shorthand: 'LT12345' },
    { sections: ['L3'] as FootSection[], shorthand: 'L3' },
  ] : [
    { sections: ['R1', 'R2', 'R3', 'T1', 'T2', 'T3', 'T4', 'T5'] as FootSection[], shorthand: 'R123T12345' },
    { sections: ['R1', 'R2', 'T1', 'T2', 'T3', 'T4', 'T5'] as FootSection[], shorthand: 'R12T12345' },
    { sections: ['R1', 'R3', 'T1'] as FootSection[], shorthand: 'R13T1' },
    { sections: ['R2', 'R3', 'T5'] as FootSection[], shorthand: 'R23T5' },
    { sections: ['T1', 'T2', 'T3', 'T4', 'T5'] as FootSection[], shorthand: 'RT12345' },
    { sections: ['R3'] as FootSection[], shorthand: 'R3' },
  ];
  
  const match = presets.find(p => 
    p.sections.length === sections.length && 
    p.sections.every(s => sections.includes(s))
  );
  
  return match?.shorthand || 'EMPTY';
};

  // Trigger capture on each beat during recording
  useEffect(() => {
    if (state.isRecording && state.isPlaying && state.captureMode === 'poses') {
      setShouldCapture(true);
    }
  }, [state.currentBeat, state.currentBar, state.isRecording, state.isPlaying, state.captureMode]);

  // Capture current state for recording - uses setState callback to avoid stale state
  const captureBeatState = useCallback(() => {
    setState(prev => {
      const beatState: BeatState = {
        leftFoot: { ...prev.leftFoot },
        rightFoot: { ...prev.rightFoot },
        crossfaderPosition: prev.crossfaderPosition,
      };

      const newSequence = [...prev.sequence];
      const beatIndex = (prev.currentBar - 1) * 4 + (prev.currentBeat - 1);
      newSequence[beatIndex] = beatState;
      return { ...prev, sequence: newSequence };
    });
  }, []);

  // Advance to next beat
  const advanceBeat = useCallback(() => {
    setState(prev => {
      let newBeat = prev.currentBeat + 1;
      let newBar = prev.currentBar;
      
      if (newBeat > 4) {
        newBeat = 1;
        newBar++;
      }
      
      return { ...prev, currentBeat: newBeat, currentBar: newBar };
    });
  }, []);

  // Playback sequenced beats
  const playbackBeat = useCallback(() => {
    setState(prev => {
      const sequenceIndex = (prev.currentBar - 1) * 4 + (prev.currentBeat - 1);
      const beatState = prev.sequence[sequenceIndex];

      if (beatState) {
        return {
          ...prev,
          leftFoot: beatState.leftFoot,
          rightFoot: beatState.rightFoot,
          crossfaderPosition: beatState.crossfaderPosition,
          activePresets: {
            left: [beatState.leftFoot.preset],
            right: [beatState.rightFoot.preset],
          },
        };
      } else {
        // Show empty state when nothing programmed
        return {
          ...prev,
          leftFoot: {
            groundedSections: [],
            rotation: 0,
            hasHeadPlacement: false,
            preset: 'default',
          },
          rightFoot: {
            groundedSections: [],
            rotation: 0,
            hasHeadPlacement: false,
            preset: 'default',
          },
          crossfaderPosition: 'center',
          activePresets: {
            left: [],
            right: [],
          },
        };
      }
    });
  }, []);

  // Handle play toggle with lead-in
  const handlePlayToggle = () => {
    setState(prev => {
      const newIsPlaying = !prev.isPlaying;
      
      if (newIsPlaying && prev.isRecording && prev.leadInEnabled) {
        return { ...prev, leadInCount: 4, isPlaying: false };
      }
      
      return { ...prev, isPlaying: newIsPlaying };
    });
  };

  // Metronome hook - play when enabled and (playing OR during lead-in)
  // Mute button controls metronome
  useMetronome(
    state.bpm, 
    state.metronomeEnabled && (state.isPlaying || state.leadInCount > 0), 
    state.metronomeMuted
  );

  // Audio playback sync - continuous play through entire song
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    // Adjust playback rate based on BPM change
    const playbackRate = state.bpm / originalBpm;
    audioRef.current.playbackRate = playbackRate;

    if (state.isPlaying && !state.leadInCount) {
      audioRef.current.play().catch(err => {
        console.error('Audio playback error:', err);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Click to enable audio.",
          variant: "destructive",
        });
      });
    } else {
      audioRef.current.pause();
    }
  }, [state.isPlaying, state.leadInCount, audioUrl, state.bpm, originalBpm, toast]);

  // Jump to audio position when pad is clicked
  const handlePadClick = useCallback((bar: number, beat: number) => {
    // Clear any pending audio playback
    if (audioPlaybackRef.current) {
      clearTimeout(audioPlaybackRef.current);
      audioPlaybackRef.current = null;
    }
    
    if (audioRef.current && audioUrl) {
      const totalBeats = (bar - 1) * 4 + (beat - 1);
      const beatDurationOriginal = 60 / originalBpm;
      const audioPosition = totalBeats * beatDurationOriginal;
      audioRef.current.currentTime = audioPosition;
      
      // Play preview if not already playing
      if (!state.isPlaying) {
        audioRef.current.play().then(() => {
          audioPlaybackRef.current = window.setTimeout(() => {
            if (!state.isPlaying && audioRef.current) {
              audioRef.current.pause();
            }
          }, beatDurationOriginal * 1000);
        }).catch(err => console.error('Preview playback error:', err));
      }
    }
    setState(prev => ({ ...prev, currentBar: bar, currentBeat: beat }));
  }, [audioUrl, originalBpm, state.isPlaying]);

  // Copy/Paste functions
  const handleCopyBar = useCallback((bar: number) => {
    const barBeats: BeatState[] = [];
    for (let beat = 1; beat <= 4; beat++) {
      const index = (bar - 1) * 4 + (beat - 1);
      barBeats.push(state.sequence[index]);
    }
    setClipboard({ type: 'bar', data: barBeats });
  }, [state.sequence]);

  const handleCopyBeat = useCallback((bar: number, beat: number) => {
    const index = (bar - 1) * 4 + (beat - 1);
    setClipboard({ type: 'beat', data: state.sequence[index] });
  }, [state.sequence]);

  const handlePasteBar = useCallback((targetBar: number) => {
    if (clipboard.type !== 'bar' || !Array.isArray(clipboard.data)) return;
    
    setState(prev => {
      const newSequence = [...prev.sequence];
      for (let beat = 1; beat <= 4; beat++) {
        const targetIndex = (targetBar - 1) * 4 + (beat - 1);
        newSequence[targetIndex] = clipboard.data[beat - 1];
      }
      return { ...prev, sequence: newSequence };
    });
  }, [clipboard]);

  const handlePasteBeat = useCallback((bar: number, beat: number) => {
    if (clipboard.type !== 'beat' || Array.isArray(clipboard.data) || !clipboard.data) return;
    
    setState(prev => {
      const index = (bar - 1) * 4 + (beat - 1);
      const newSequence = [...prev.sequence];
      newSequence[index] = clipboard.data as BeatState;
      return { ...prev, sequence: newSequence };
    });
  }, [clipboard]);

  // Keyboard controls - disabled when dialogs are open
  useKeyboardControls(
    {
      onLeftPreset: (sections) => {
        const preset = getPresetShorthand(sections, true);
        updateLeftFoot({ groundedSections: sections, preset });
        setState(prev => ({
          ...prev,
          activePresets: {
            ...prev.activePresets,
            left: [preset]
          }
        }));
        captureBeatState();
      },
      onRightPreset: (sections) => {
        const preset = getPresetShorthand(sections, false);
        updateRightFoot({ groundedSections: sections, preset });
        setState(prev => ({
          ...prev,
          activePresets: {
            ...prev.activePresets,
            right: [preset]
          }
        }));
        captureBeatState();
      },
      onLeftRotation: (rotation) => {
        updateLeftFoot({ rotation });
        captureBeatState();
      },
      onRightRotation: (rotation) => {
        updateRightFoot({ rotation });
        captureBeatState();
      },
      onHeadLeft: () => {
        handleCrossfaderChange('left');
        captureBeatState();
      },
      onHeadCenter: () => {
        handleCrossfaderChange('center');
        captureBeatState();
      },
      onHeadRight: () => {
        handleCrossfaderChange('right');
        captureBeatState();
      },
      onPadTrigger: (padNumber) => {
        // Calculate bar and beat from pad number (1-8)
        const windowStartBar = state.currentBar - ((state.currentBar - 1) % 2);
        const bar = windowStartBar + Math.floor((padNumber - 1) / 4);
        const beat = ((padNumber - 1) % 4) + 1;
        handlePadClick(bar, beat);
      },
    },
    !isDialogOpen
  );

  // Playback interval - recall stored beats during playback (only when NOT recording)
  useEffect(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }

    if (state.isPlaying) {
      const beatInterval = (60 / state.bpm) * 1000;
      
      playbackIntervalRef.current = setInterval(() => {
        advanceBeat(); // Move to next beat first
        if (!state.isRecording) {
          playbackBeat(); // Then recall stored beat so displays match the highlighted pad
        }
      }, beatInterval);
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [state.isPlaying, state.bpm, state.isRecording, advanceBeat, playbackBeat]);

  // Lead-in countdown
  useEffect(() => {
    if (state.leadInCount > 0) {
      const beatInterval = (60 / state.bpm) * 1000;
      const timer = setTimeout(() => {
        setState(prev => {
          const newCount = prev.leadInCount - 1;
          if (newCount === 0) {
            return { ...prev, leadInCount: 0, isPlaying: true };
          }
          return { ...prev, leadInCount: newCount };
        });
      }, beatInterval);
      
      return () => clearTimeout(timer);
    }
  }, [state.leadInCount, state.bpm]);

  // Playback on beat change (when not playing) - sync foot displays with current position
  useEffect(() => {
    if (!state.isPlaying && !state.isRecording) {
      playbackBeat();
    }
  }, [state.currentBeat, state.currentBar, state.isPlaying, state.isRecording, playbackBeat]);
  
  // Sync foot display highlights with crossfader position
  useEffect(() => {
    const sequenceIndex = (state.currentBar - 1) * 4 + (state.currentBeat - 1);
    const beatState = state.sequence[sequenceIndex];
    
    if (beatState && !state.isPlaying && !state.isRecording) {
      // Update foot highlighting to match stored crossfader position
      setState(prev => ({
        ...prev,
        leftFoot: {
          ...prev.leftFoot,
          hasHeadPlacement: beatState.crossfaderPosition === 'left'
        },
        rightFoot: {
          ...prev.rightFoot,
          hasHeadPlacement: beatState.crossfaderPosition === 'right'
        }
      }));
    }
  }, [state.currentBeat, state.currentBar, state.sequence, state.isPlaying, state.isRecording]);

  return (
    <div className="min-h-screen bg-black text-green-500 p-8">
      {/* Hidden audio element for MP3 playback */}
      {audioUrl && (
      <audio ref={audioRef} src={audioUrl} preload="auto" />
    )}
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="led-display text-4xl text-green-500 mb-2">FOOTSTEP SEQUENCER</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Footwork Notation & Development System
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              <SequenceManager
                currentBpm={state.bpm}
                currentSequence={state.sequence}
                currentAudioUrl={audioUrl}
                currentAudioFileName={audioFileName}
                onLoad={handleLoadSequence}
                onBpmDetected={handleBpmDetected}
                onDialogOpenChange={setIsDialogOpen}
                onNew={handleNewSequence}
              />
              
              {/* Mode Toggle Button */}
              <Button
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  captureMode: prev.captureMode === 'feet' ? 'poses' : 'feet',
                  isCameraActive: prev.captureMode === 'feet',
                  leadInEnabled: prev.captureMode === 'feet' ? true : prev.leadInEnabled
                }))}
                variant="outline"
                size="sm"
                className={`h-8 px-3 text-xs ${
                  state.captureMode === 'poses' 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
              >
                <Video className="w-3 h-3 mr-1" />
                {state.captureMode === 'feet' ? 'Foot Mode' : 'Pose Mode'}
              </Button>
              
              {/* ADD THIS: Preview Button (only show in Pose Mode) */}
              {state.captureMode === 'poses' && state.sequence.some(beat => beat?.poseSnapshot) && (
                <Button
                  onClick={() => {
                    setViewerBar(state.currentBar);
                    setViewerBeat(state.currentBeat);
                    setPoseViewerOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </Button>
              )}
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-8 px-2 text-xs"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Sign Out
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-8 px-2 text-xs"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Command Cheat Sheet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">Playback Controls</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">Space</kbd> - Play/Pause</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">R</kbd> - Toggle Recording Mode</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">1-8</kbd> - Trigger Pads 1-8</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Left Foot Presets</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">Q</kbd> - L123T12345</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">W</kbd> - L12T12345</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">A</kbd> - L13T1</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">S</kbd> - L23T5</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">Z</kbd> - L3</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">X</kbd> - LT12345</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">C</kbd> - Empty</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Right Foot Presets</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">O</kbd> - R123T12345</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">P</kbd> - R12T12345</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">K</kbd> - R13T1</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">L</kbd> - R23T5</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">B</kbd> - R3</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">N</kbd> - RT12345</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">M</kbd> - Empty</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Left Foot Rotation</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">E</kbd> - 0° (12 o'clock)</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">R</kbd> - 60° (2 o'clock)</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">T</kbd> - -60° (10 o'clock)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Right Foot Rotation</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">Y</kbd> - 0° (12 o'clock)</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">U</kbd> - 60° (2 o'clock)</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">I</kbd> - -60° (10 o'clock)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Head Placement</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + ←</kbd> or <kbd className="px-2 py-1 bg-gray-800 rounded">←</kbd> - Head Over Left (HOL)</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + →</kbd> or <kbd className="px-2 py-1 bg-gray-800 rounded">→</kbd> - Head Over Right (HOR)</li>
                      <li><kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + ↑</kbd> or <kbd className="px-2 py-1 bg-gray-800 rounded">↑</kbd> - Head Over Center (HOC)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Notation Format</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li>HOL = Head Over Left</li>
                      <li>HOR = Head Over Right</li>
                      <li>HOC = Head Over Center</li>
                      <li>Format: HO[L/R/C] [LeftPreset] @ [LeftRotation]° | [RightPreset] @ [RightRotation]°</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
            {/* Sequence and Audio File Display */}
            <div className="text-right text-xs space-y-1">
              <div className="text-gray-400">
                <span className="text-gray-500">Sequence:</span> <span className="text-white">{sequenceName}</span>
              </div>
              {audioFileName && (
                <div className="text-gray-400">
                  <span className="text-gray-500">Audio:</span> <span className="text-white">{audioFileName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Beat Grid */}
        {state.captureMode === 'feet' ? (
          <BeatGrid
            sequence={state.sequence}
            currentBar={state.currentBar}
            currentBeat={state.currentBeat}
            onBeatSelect={handlePadClick}
            isPlaying={state.isPlaying}
            isRecording={state.isRecording}
            crossfaderPosition={state.crossfaderPosition}
            clipboard={clipboard}
            onCopyBar={handleCopyBar}
            onCopyBeat={handleCopyBeat}
            onPasteBar={handlePasteBar}
            onPasteBeat={handlePasteBeat}
          />
        ) : (
          <PoseGrid
          sequence={state.sequence}
          currentBar={state.currentBar}
          currentBeat={state.currentBeat}
          onBeatSelect={handlePadClick}
          onBeatView={handleBeatView}
          totalBars={Math.max(8, Math.ceil(state.sequence.length / 4))}
          isPlaying={state.isPlaying}
          isRecording={state.isRecording}
          clipboard={clipboard}
          onCopyBar={handleCopyBar}
          onCopyBeat={handleCopyBeat}
          onPasteBar={handlePasteBar}
          onPasteBeat={handlePasteBeat}
        />
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Foot Module */}
          <div className="space-y-4 p-6 bg-gray-900/50 rounded-lg border border-green-500/30">
            <div className="flex justify-center">
              <FootDisplay 
                footState={state.leftFoot} 
                isLeft={true}
                isHighlighted={state.crossfaderPosition === 'left'}
                onRotationChange={(rotation) => {
                  updateLeftFoot({ rotation });
                  captureBeatState();
                }}
              />
            </div>
            <FootControls
              rotation={state.leftFoot.rotation}
              onRotationChange={(rotation) => {
                updateLeftFoot({ rotation });
                captureBeatState();
              }}
              onPresetSelect={(sections) => {
                const preset = getPresetShorthand(sections, true);
                updateLeftFoot({ groundedSections: sections as FootSection[], preset });
                setState(prev => ({
                  ...prev,
                  activePresets: {
                    ...prev.activePresets,
                    left: [preset]
                  }
                }));
                captureBeatState();
              }}
              isLeft={true}
              activePresets={state.activePresets.left}
            />
          </div>

          {/* Transport Module (Center) */}
          <div className="space-y-2">
            <TransportControls
              currentBar={state.currentBar}
              currentBeat={state.currentBeat}
              bpm={state.bpm}
              isPlaying={state.isPlaying}
              isRecording={state.isRecording}
              metronomeEnabled={state.metronomeEnabled}
              metronomeMuted={state.metronomeMuted}
              leadInEnabled={state.leadInEnabled}
              leadInCount={state.leadInCount}
              onBarChange={(bar) => {
                setState(prev => ({ ...prev, currentBar: bar }));
                if (audioRef.current && audioUrl) {
                  const totalBeats = (bar - 1) * 4 + (state.currentBeat - 1);
                  const beatDurationOriginal = 60 / originalBpm;
                  audioRef.current.currentTime = totalBeats * beatDurationOriginal;
                }
              }}
              onBeatChange={(beat) => {
                setState(prev => ({ ...prev, currentBeat: beat }));
                if (audioRef.current && audioUrl) {
                  const totalBeats = (state.currentBar - 1) * 4 + (beat - 1);
                  const beatDurationOriginal = 60 / originalBpm;
                  audioRef.current.currentTime = totalBeats * beatDurationOriginal;
                }
              }}
              onBeatStep={handleBeatChange}
              onBpmChange={(bpm) => setState(prev => ({ ...prev, bpm }))}
              onPlayToggle={handlePlayToggle}
              onRecordToggle={() => setState(prev => ({ ...prev, isRecording: !prev.isRecording }))}
              onMetronomeToggle={() => setState(prev => ({ ...prev, metronomeEnabled: !prev.metronomeEnabled }))}
              onMuteToggle={() => setState(prev => ({ ...prev, metronomeMuted: !prev.metronomeMuted }))}
              onLeadInToggle={() => setState(prev => ({ ...prev, leadInEnabled: !prev.leadInEnabled }))}
            />
            
            <div className="mt-2 space-y-4">
              {state.captureMode === 'feet' ? (
              <Crossfader
                position={state.crossfaderPosition}
                onPositionChange={handleCrossfaderChange}
              />
            ) : (
              <PoseCapture
                isActive={state.isCameraActive}
                mirrorVideo={state.mirrorVideo}
                onToggleMirror={() => setState(prev => ({ ...prev, mirrorVideo: !prev.mirrorVideo }))}
                onSnapshot={handlePoseSnapshot}
                captureNow={shouldCapture}
              />
            )}
              
              {/* Notation Summary */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <div className="text-center mb-2 text-xs font-semibold text-gray-400">Notation Summary</div>
                <div className="flex justify-center text-xs font-mono text-green-400">
                  <span>
                    HO{state.crossfaderPosition === 'left' ? 'L' : state.crossfaderPosition === 'right' ? 'R' : 'C'}{' '}
                    {state.leftFoot.preset} @ {state.leftFoot.rotation}° | {state.rightFoot.preset} @ {state.rightFoot.rotation}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Foot Module */}
          <div className="space-y-4 p-6 bg-gray-900/50 rounded-lg border border-green-500/30">
            <div className="flex justify-center">
              <FootDisplay 
                footState={state.rightFoot}
                isHighlighted={state.crossfaderPosition === 'right'}
                onRotationChange={(rotation) => {
                  updateRightFoot({ rotation });
                  captureBeatState();
                }}
              />
            </div>
            <FootControls
              rotation={state.rightFoot.rotation}
              onRotationChange={(rotation) => {
                updateRightFoot({ rotation });
                captureBeatState();
              }}
              onPresetSelect={(sections) => {
                const preset = getPresetShorthand(sections, false);
                updateRightFoot({ groundedSections: sections as FootSection[], preset });
                setState(prev => ({
                  ...prev,
                  activePresets: {
                    ...prev.activePresets,
                    right: [preset]
                  }
                }));
                captureBeatState();
              }}
              isLeft={false}
              activePresets={state.activePresets.right}
            />
          </div>
        </div>

      </div>
      <PoseViewer
        isOpen={poseViewerOpen}
        onClose={() => setPoseViewerOpen(false)}
        sequence={state.sequence}
        initialBar={viewerBar}
        initialBeat={viewerBeat}
        onBeatSelect={handlePadClick}
      />
    </div>
  );
};

export default Index;
