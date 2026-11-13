// Renders a described pitch into the tuner readout.

const SVG_NS = 'http://www.w3.org/2000/svg';

const ACCIDENTALS = {
  natural: { strokes: 0, spoken: '' },
  'half-sharp': { strokes: 1, spoken: 'half sharp' },
  sharp: { strokes: 2, spoken: 'sharp' },
  sesquisharp: { strokes: 3, spoken: 'sesquisharp' }
};

// "In tune" starts within the tolerance and holds until the pitch drifts RELEASE_CENTS past it.
const RELEASE_CENTS = 3;

export function createReadout(root) {
  const letter = root.querySelector('.js-tuner-letter');
  const accidental = root.querySelector('.js-tuner-accidental');
  const octave = root.querySelector('.js-tuner-octave');
  const cents = root.querySelector('.js-tuner-cents');
  const status = root.querySelector('.js-tuner-status');
  const spokenNote = root.querySelector('.js-tuner-spoken');
  let inTune = false;
  let shownNote = '';
  let shownState = '';

  function show(pitch, tolerance) {
    const note = `${pitch.letter} ${pitch.accidental} ${pitch.octave}`;
    if (note !== shownNote) {
      const { strokes, spoken } = ACCIDENTALS[pitch.accidental];
      letter.textContent = pitch.letter;
      accidental.replaceChildren(...(strokes ? [drawAccidental(strokes)] : []));
      octave.textContent = pitch.octave;
      spokenNote.textContent = [pitch.letter, spoken, pitch.octave].filter(part => part !== '').join(' ');
      shownNote = note;
    }

    cents.textContent = `${formatSigned(pitch.cents)} cents`;
    inTune = Math.abs(pitch.cents) <= (inTune ? tolerance + RELEASE_CENTS : tolerance);
    const state = inTune ? 'in tune' : pitch.cents < 0 ? 'flat' : 'sharp';
    if (state !== shownState) {
      status.textContent = state;
      root.dataset.state = state.replace(' ', '-');
      shownState = state;
    }

    // Offset runs from -1 (half a step flat) to 1 (half a step sharp). Zone is the tolerance on the same scale.
    root.style.setProperty('--tuner-offset', pitch.cents / pitch.maxCents);
    root.style.setProperty('--tuner-zone', Math.min(1, tolerance / pitch.maxCents));
  }

  function clear(message = '') {
    inTune = false;
    shownNote = '';
    shownState = '';
    root.style.removeProperty('--tuner-offset');
    root.style.removeProperty('--tuner-zone');
    letter.textContent = '';
    accidental.replaceChildren();
    octave.textContent = '';
    cents.textContent = '';
    status.textContent = message;
    spokenNote.textContent = '';
    delete root.dataset.state;
  }

  return { show, clear };
}

function formatSigned(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return '0';
}

// Sharp-family accidentals: one, two or three vertical strokes crossed by two slanted bars.
function drawAccidental(strokes) {
  const gap = 4;
  const width = gap * (strokes - 1) + 8;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} 24`);
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('lg-tuner__accidental');

  for (let i = 0; i < strokes; i++) {
    const x = 4 + i * gap;
    svg.append(line(x, 2, x, 22, 1.5));
  }
  svg.append(line(1, 10, width - 1, 7, 2.5));
  svg.append(line(1, 17, width - 1, 14, 2.5));
  return svg;
}

function line(x1, y1, x2, y2, strokeWidth) {
  const el = document.createElementNS(SVG_NS, 'line');
  Object.entries({ x1, y1, x2, y2, 'stroke-width': strokeWidth }).forEach(([key, value]) => el.setAttribute(key, value));
  el.setAttribute('stroke', 'currentColor');
  return el;
}
