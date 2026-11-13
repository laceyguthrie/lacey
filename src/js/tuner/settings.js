// Tuner settings: quarter tones, A4 reference and precision. Remembered per browser.

const A4 = { min: 415, max: 466, default: 440 };
// Tolerance steps in cents, from loose to precise. Closer spacing at the precise end.
const PRECISION_STEPS = [25, 20, 15, 12, 10, 8, 7, 6, 5, 4, 3, 2];
const PRECISION_DEFAULT = 5;

export function createSettings(root) {
  const quarterTones = root.querySelector('.js-tuner-quarter-tones');
  const a4Output = root.querySelector('.js-tuner-a4');
  const a4Down = root.querySelector('.js-tuner-a4-down');
  const a4Up = root.querySelector('.js-tuner-a4-up');
  const precision = root.querySelector('.js-tuner-precision');
  const precisionOutput = root.querySelector('.js-tuner-precision-value');
  const presets = root.querySelectorAll('.js-tuner-preset');

  const settings = {
    quarterTones: load('tuner-quarter-tones') === 'true',
    a4: Number(load('tuner-a4')) || A4.default,
    tolerance: Number(load('tuner-precision')) || PRECISION_DEFAULT
  };

  const lastStep = PRECISION_STEPS.length - 1;
  precision.min = 0;
  precision.max = lastStep;

  presets.forEach(preset => {
    const position = PRECISION_STEPS.indexOf(Number(preset.dataset.cents)) / lastStep;
    preset.style.setProperty('--position', position);
    preset.addEventListener('click', () => setTolerance(Number(preset.dataset.cents)));
  });

  quarterTones.addEventListener('change', () => {
    settings.quarterTones = quarterTones.checked;
    save('tuner-quarter-tones', settings.quarterTones);
  });
  a4Down.addEventListener('click', () => setA4(settings.a4 - 1));
  a4Up.addEventListener('click', () => setA4(settings.a4 + 1));
  precision.addEventListener('input', () => setTolerance(PRECISION_STEPS[Number(precision.value)]));

  quarterTones.checked = settings.quarterTones;
  setA4(settings.a4);
  setTolerance(settings.tolerance);

  function setA4(value) {
    settings.a4 = clamp(value, A4.min, A4.max);
    save('tuner-a4', settings.a4);
    a4Output.textContent = `A4 = ${settings.a4} Hz`;
    a4Down.disabled = settings.a4 <= A4.min;
    a4Up.disabled = settings.a4 >= A4.max;
  }

  function setTolerance(cents) {
    settings.tolerance = nearestStep(cents);
    save('tuner-precision', settings.tolerance);
    const label = `±${settings.tolerance} cents`;
    precision.value = PRECISION_STEPS.indexOf(settings.tolerance);
    precision.setAttribute('aria-valuetext', label);
    precisionOutput.textContent = label;
    presets.forEach(preset => preset.classList.toggle('is-active', Number(preset.dataset.cents) === settings.tolerance));
  }

  return settings;
}

function nearestStep(cents) {
  return PRECISION_STEPS.reduce((best, step) => (Math.abs(step - cents) < Math.abs(best - cents) ? step : best));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function load(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}
