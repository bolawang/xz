const timeDisplay = document.getElementById("timeDisplay");
const statusText = document.getElementById("statusText");
const hoursInput = document.getElementById("hoursInput");
const minutesInput = document.getElementById("minutesInput");
const secondsInput = document.getElementById("secondsInput");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const presetButtons = [...document.querySelectorAll(".preset")];
const themeButtons = [...document.querySelectorAll(".theme-chip")];
const progressRing = document.querySelector(".ring-progress");

const ringLength = 578;
let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let intervalId = null;
let targetEndTime = null;
const TEXT = {
  ready: "\u6E96\u5099\u958B\u59CB",
  running: "\u5012\u6578\u4E2D",
  paused: "\u5DF2\u66AB\u505C",
  reset: "\u5DF2\u91CD\u8A2D",
  finished: "\u6642\u9593\u5230",
  title: "\u5012\u6578\u8A08\u6642\u5668",
  invalid: "\u8ACB\u5148\u8F38\u5165\u5927\u65BC 0 \u7684\u6642\u9593"
};
const THEME_KEY = "countdown-theme";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(total) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const offset = ringLength * (1 - progress);
  progressRing.style.strokeDashoffset = String(offset);
}

function syncInputsFromSeconds(total) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  hoursInput.value = String(hours);
  minutesInput.value = String(minutes);
  secondsInput.value = String(seconds);
}

function readInputs() {
  const hours = clamp(Number(hoursInput.value) || 0, 0, 23);
  const minutes = clamp(Number(minutesInput.value) || 0, 0, 59);
  const seconds = clamp(Number(secondsInput.value) || 0, 0, 59);
  return hours * 3600 + minutes * 60 + seconds;
}

function stopTimer() {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function beep() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.08;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();

  window.setTimeout(() => {
    oscillator.stop();
    audioContext.close();
  }, 280);
}

function finishTimer() {
  stopTimer();
  remainingSeconds = 0;
  updateDisplay();
  statusText.textContent = TEXT.finished;
  document.title = TEXT.finished;
  beep();
}

function tick() {
  const secondsLeft = Math.max(0, Math.round((targetEndTime - Date.now()) / 1000));
  remainingSeconds = secondsLeft;
  updateDisplay();

  if (secondsLeft <= 0) {
    finishTimer();
  }
}

function setPresetActive(total) {
  presetButtons.forEach((button) => {
    const minutes = Number(button.dataset.minutes);
    button.classList.toggle("active", total === minutes * 60);
  });
}

function applyNewDuration(total) {
  totalSeconds = Math.max(1, total);
  remainingSeconds = totalSeconds;
  syncInputsFromSeconds(totalSeconds);
  updateDisplay();
  setPresetActive(totalSeconds);
  stopTimer();
  statusText.textContent = TEXT.ready;
  document.title = TEXT.title;
}

function startTimer() {
  const inputSeconds = readInputs();
  if (inputSeconds <= 0) {
    statusText.textContent = TEXT.invalid;
    return;
  }

  if (!intervalId) {
    if (remainingSeconds !== inputSeconds || totalSeconds !== inputSeconds) {
      totalSeconds = inputSeconds;
      remainingSeconds = inputSeconds;
    }

    targetEndTime = Date.now() + remainingSeconds * 1000;
    statusText.textContent = TEXT.running;
    document.title = `${formatTime(remainingSeconds)} ${TEXT.running}`;
    updateDisplay();
    intervalId = window.setInterval(() => {
      tick();
      document.title = remainingSeconds > 0 ? `${formatTime(remainingSeconds)} ${TEXT.running}` : TEXT.finished;
    }, 250);
  }
}

function pauseTimer() {
  if (!intervalId) {
    return;
  }

  tick();
  stopTimer();
  statusText.textContent = TEXT.paused;
  document.title = `${formatTime(remainingSeconds)} ${TEXT.paused}`;
}

function resetTimer() {
  const inputSeconds = readInputs();
  stopTimer();
  totalSeconds = Math.max(1, inputSeconds);
  remainingSeconds = totalSeconds;
  updateDisplay();
  statusText.textContent = TEXT.reset;
  document.title = TEXT.title;
  setPresetActive(totalSeconds);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });
  window.localStorage.setItem(THEME_KEY, theme);
}

startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseTimer);
resetButton.addEventListener("click", resetTimer);

hoursInput.addEventListener("input", () => setPresetActive(-1));
minutesInput.addEventListener("input", () => setPresetActive(-1));
secondsInput.addEventListener("input", () => setPresetActive(-1));

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const presetMinutes = Number(button.dataset.minutes);
    applyNewDuration(presetMinutes * 60);
  });
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.theme);
  });
});

applyTheme(window.localStorage.getItem(THEME_KEY) || "cute");
syncInputsFromSeconds(totalSeconds);
updateDisplay();
