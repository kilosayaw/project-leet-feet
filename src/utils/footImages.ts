// Centralized foot preset image mapping
// This ensures BeatGrid and FootDisplay always use the exact same assets

import L123T12345 from '../assets/L123T12345.png';
import L12T12345 from '../assets/L12T12345.png';
import L13T1 from '../assets/L13T1.png';
import L23T5 from '../assets/L23T5.png';
import LT12345 from '../assets/LT12345.png';
import L3 from '../assets/L3.png';
import leftFoot from '../assets/left-foot.png';
import leftEmpty from '../assets/left-empty.png';

import R123T12345 from '../assets/R123T12345.png';
import R12T12345 from '../assets/R12T12345.png';
import R13T1 from '../assets/R13T1.png';
import R23T5 from '../assets/R23T5.png';
import RT12345 from '../assets/RT12345.png';
import R3 from '../assets/R3.png';
import rightFoot from '../assets/right-foot.png';
import rightEmpty from '../assets/right-empty.png';

const leftPresetImages: Record<string, string> = {
  'L123T12345': L123T12345,
  'L12T12345': L12T12345,
  'L13T1': L13T1,
  'L23T5': L23T5,
  'LT12345': LT12345,
  'L3': L3,
  // When empty, show the base foot silhouette (as in previous behavior)
  'EMPTY': leftFoot,
  'default': leftFoot,
};

const rightPresetImages: Record<string, string> = {
  'R123T12345': R123T12345,
  'R12T12345': R12T12345,
  'R13T1': R13T1,
  'R23T5': R23T5,
  'RT12345': RT12345,
  'R3': R3,
  'EMPTY': rightFoot,
  'default': rightFoot,
};

export const getFootImage = (preset: string, isLeft: boolean) => {
  const map = isLeft ? leftPresetImages : rightPresetImages;
  return map[preset] || map['default'];
};

export { leftPresetImages, rightPresetImages };
