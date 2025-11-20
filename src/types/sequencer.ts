export type FootSection = 'L1' | 'L2' | 'L3' | 'R1' | 'R2' | 'R3' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface FootState {
  groundedSections: FootSection[];
  rotation: number; // -90 (9 o'clock), 0 (12 o'clock), 90 (3 o'clock)
  hasHeadPlacement: boolean;
  preset: string; // Preset shorthand like 'L123T12345', 'R3', 'EMPTY', etc.
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseSnapshot {
  imageData: string; // base64 image
  timestamp: number;
  landmarks?: PoseLandmark[]; // MediaPipe pose landmarks
}

export interface BeatState {
  leftFoot: FootState;
  rightFoot: FootState;
  crossfaderPosition: 'left' | 'center' | 'right';
  poseSnapshot?: PoseSnapshot; // NEW: Optional pose data
}

export interface Sequence {
  id?: string;
  name: string;
  bpm: number;
  beats: BeatState[];
  userId?: string;
  createdAt?: string;
}

export interface SequencerState {
  currentBar: number;
  currentBeat: number;
  bpm: number;
  isPlaying: boolean;
  isRecording: boolean;
  metronomeEnabled: boolean;
  metronomeMuted: boolean;
  leadInEnabled: boolean;
  leadInCount: number;
  crossfaderPosition: 'left' | 'center' | 'right';
  leftFoot: FootState;
  rightFoot: FootState;
  sequence: BeatState[];
  currentSequence: Sequence | null;
  captureMode: 'feet' | 'poses'; // NEW: Toggle between modes
  isCameraActive: boolean; // NEW: Camera on/off
  mirrorVideo: boolean; // NEW: Mirror toggle
  activePresets: {
    left: string[];
    right: string[];
  };
}

export interface GroundingPreset {
  name: string;
  sections: FootSection[];
  shorthand: string;
  keyLeft?: string;
  keyRight?: string;
}
