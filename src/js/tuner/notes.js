// Turns a frequency into a note name, octave and cents offset.
// Supports 12 steps per octave (semitones) and 24 (quarter tones).

const PITCH_CLASSES = [
  ['C', 'natural'], ['C', 'sharp'],
  ['D', 'natural'], ['D', 'sharp'],
  ['E', 'natural'],
  ['F', 'natural'], ['F', 'sharp'],
  ['G', 'natural'], ['G', 'sharp'],
  ['A', 'natural'], ['A', 'sharp'],
  ['B', 'natural']
];

const RAISED_BY_QUARTER = {
  natural: 'half-sharp',
  sharp: 'sesquisharp'
};

const A4_ABOVE_C0 = 57;

export function describePitch(frequency, { a4 = 440, quarterTones = false } = {}) {
  const step = quarterTones ? 0.5 : 1;
  const fromA4 = 12 * Math.log2(frequency / a4);
  const nearest = Math.round(fromA4 / step) * step;
  const cents = Math.round((fromA4 - nearest) * 100);

  const fromC0 = nearest + A4_ABOVE_C0;
  const semitone = Math.floor(fromC0);
  const octave = Math.floor(semitone / 12);
  const [letter, baseAccidental] = PITCH_CLASSES[((semitone % 12) + 12) % 12];
  const accidental = fromC0 > semitone ? RAISED_BY_QUARTER[baseAccidental] : baseAccidental;

  return { letter, accidental, octave, cents, maxCents: step * 50 };
}
