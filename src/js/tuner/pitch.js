// YIN pitch detection (de Cheveigné & Kawahara, 2002).
// Returns the fundamental frequency in Hz, or null when there is no clear pitch.

export function detectPitch(buffer, sampleRate, {
  minFrequency = 29,
  maxFrequency = 1500,
  threshold = 0.15,
  silence = 0.01
} = {}) {
  if (rms(buffer) < silence) return null;

  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), Math.floor(buffer.length / 2));
  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const windowSize = buffer.length - maxTau;

  const diff = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < windowSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  const normalized = new Float32Array(maxTau + 1);
  normalized[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += diff[tau];
    normalized[tau] = runningSum ? (diff[tau] * tau) / runningSum : 1;
  }

  let tau = minTau;
  while (tau <= maxTau && normalized[tau] >= threshold) tau++;
  if (tau > maxTau) return null;
  while (tau + 1 <= maxTau && normalized[tau + 1] < normalized[tau]) tau++;

  return sampleRate / refine(normalized, tau);
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
