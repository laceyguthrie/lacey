// Chromatic tuner: wires the microphone, the settings and the readout together.

import { detectPitch, bufferSizeFor } from './pitch.js';
import { describePitch } from './notes.js';
import { createReadout } from './readout.js';
import { createSettings } from './settings.js';

const ANALYSIS_INTERVAL_MS = 50;
const SMOOTHING_SAMPLES = 5;
const SMOOTHING_WEIGHT = 0.25;
const NEW_NOTE_CENTS = 50;
const SILENCE_RESET_MS = 1000;

const LABELS = {
  start: 'start listening',
  stop: 'stop listening'
};

const MESSAGES = {
  listening: 'make a sound',
  blocked: 'the microphone is blocked. allow it in your browser settings to use the tuner.',
  unsupported: "this browser can't use the microphone.",
  noMicrophone: 'no microphone found.'
};

const root = document.querySelector('.js-tuner');
if (root) setupTuner(root);

function setupTuner(root) {
  const toggle = root.querySelector('.js-tuner-toggle');
  const readout = createReadout(root.querySelector('.js-tuner-readout'));
  const settings = createSettings(root);
  let session = null;

  toggle.addEventListener('click', () => (session ? stop() : start()));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && session) stop();
  });

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      readout.clear(MESSAGES.unsupported);
      return;
    }

    toggle.disabled = true;
    try {
      session = await openMicrophone();
      toggle.textContent = LABELS.stop;
      readout.clear(MESSAGES.listening);
      listen(session);
    } catch (error) {
      readout.clear(messageFor(error));
    } finally {
      toggle.disabled = false;
    }
  }

  function stop() {
    session.stream.getTracks().forEach(track => track.stop());
    session.context.close();
    clearInterval(session.timer);
    session = null;
    toggle.textContent = LABELS.start;
    readout.clear();
  }

  function listen(active) {
    const buffer = new Float32Array(active.analyser.fftSize);
    const recent = [];
    let smoothed = null;
    let lastHeard = performance.now();

    active.timer = setInterval(() => {
      active.analyser.getFloatTimeDomainData(buffer);
      const frequency = detectPitch(buffer, active.context.sampleRate);

      if (frequency === null) {
        if (recent.length && performance.now() - lastHeard > SILENCE_RESET_MS) {
          recent.length = 0;
          smoothed = null;
          readout.clear(MESSAGES.listening);
        }
        return;
      }

      lastHeard = performance.now();
      recent.push(frequency);
      if (recent.length > SMOOTHING_SAMPLES) recent.shift();
      smoothed = ease(smoothed, median(recent));
      readout.show(describePitch(smoothed, settings), settings.tolerance);
    }, ANALYSIS_INTERVAL_MS);
  }
}

async function openMicrophone() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  });
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = bufferSizeFor(context.sampleRate);
  context.createMediaStreamSource(stream).connect(analyser);
  return { stream, context, analyser, timer: null };
}

function messageFor(error) {
  if (error.name === 'NotAllowedError') return MESSAGES.blocked;
  if (error.name === 'NotFoundError') return MESSAGES.noMicrophone;
  return MESSAGES.unsupported;
}

// Glides toward the new pitch on a log scale, and jumps when the pitch moves to a new note.
function ease(previous, next) {
  if (!previous || Math.abs(1200 * Math.log2(next / previous)) >= NEW_NOTE_CENTS) return next;
  return previous * Math.pow(next / previous, SMOOTHING_WEIGHT);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
