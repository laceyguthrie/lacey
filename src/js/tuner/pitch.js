// YIN pitch detection (de Cheveigné & Kawahara, 2002).
// Returns the fundamental frequency in Hz, or null when there is no clear pitch.

// Lowest note to detect: B0, the low string of a 5-string bass, is about 30.9 Hz.
export const MIN_FREQUENCY = 29;

// Detection needs a buffer at least twice the period of the lowest note.
export function bufferSizeFor(sampleRate) {
  return 2 ** Math.ceil(Math.log2((2 * sampleRate) / MIN_FREQUENCY));
}

export function detectPitch(buffer, sampleRate, {
  minFrequency = MIN_FREQUENCY,
  maxFrequency = 1500,
  threshold = 0.15,
  silence = 0.01
} = {}) {
  if (rms(buffer) < silence) return null;

  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(buffer.length / 2));
  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const windowSize = buffer.length - maxTau;
  const normalized = new Float32Array(maxTau + 1);

  // Lags are computed in order and the loop stops at the bottom of the first dip below the threshold.
  let runningSum = 0;
  let best = -1;
  for (let tau = 1; tau <= maxTau; tau++) {
    const diff = difference(buffer, tau, windowSize);
    runningSum += diff;
    normalized[tau] = runningSum ? (diff * tau) / runningSum : 1;

    if (best === -1) {
      if (tau >= minTau && normalized[tau] < threshold) best = tau;
    } else if (normalized[tau] < normalized[best]) {
      best = tau;
    } else {
      break;
    }
  }

  return best === -1 ? null : sampleRate / refine(normalized, best);
}

function difference(buffer, tau, windowSize) {
  let sum = 0;
  for (let i = 0; i < windowSize; i++) {
    const delta = buffer[i] - buffer[i + tau];
    sum += delta * delta;
  }
  return sum;
}

function rms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

// Parabolic interpolation around the chosen lag, for sub-sample accuracy.
function refine(values, tau) {
  if (tau < 1 || tau + 1 >= values.length) return tau;
  const before = values[tau - 1];
  const at = values[tau];
  const after = values[tau + 1];
  const curve = before + after - 2 * at;
  return curve ? tau + (before - after) / (2 * curve) : tau;
}
