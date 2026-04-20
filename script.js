const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const inputMinutes = document.getElementById("input-minutes");
const inputSeconds = document.getElementById("input-seconds");
const timerForm = document.getElementById("timer-form");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const resetButton = document.getElementById("reset-button");
const statusText = document.getElementById("status-text");
const timerCard = document.querySelector(".timer-card");
const alarmSound = document.getElementById("alarm-sound");
const quickButtons = document.querySelectorAll(".chip");

let totalSeconds = 300;
let remainingSeconds = totalSeconds;
let timerId = null;
let endTime = null;

function format(value) {
  return String(value).padStart(2, "0");
}

function render(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  minutesEl.textContent = format(mins);
  secondsEl.textContent = format(secs);
  document.title = `${format(mins)}:${format(secs)} 倒數計時器`;
}

function setStatus(message) {
  statusText.textContent = message;
}

function syncInputs(seconds) {
  inputMinutes.value = Math.floor(seconds / 60);
  inputSeconds.value = seconds % 60;
}

function clearFinishedState() {
  timerCard.classList.remove("is-finished");
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function finishTimer() {
  stopTimer();
  remainingSeconds = 0;
  render(remainingSeconds);
  timerCard.classList.add("is-finished");
  setStatus("時間到。可以重設後再開始一次。");

  if (alarmSound) {
    alarmSound.currentTime = 0;
    alarmSound.play().catch(() => {
      setStatus("時間到。瀏覽器已阻擋自動播放提示音。");
    });
  }
}

function tick() {
  const secondsLeft = Math.round((endTime - Date.now()) / 1000);

  if (secondsLeft <= 0) {
    finishTimer();
    return;
  }

  remainingSeconds = secondsLeft;
  render(remainingSeconds);
}

function applyTime(minutes, seconds) {
  const normalizedMinutes = Math.max(0, Number(minutes) || 0);
  const normalizedSeconds = Math.min(59, Math.max(0, Number(seconds) || 0));
  totalSeconds = normalizedMinutes * 60 + normalizedSeconds;

  if (totalSeconds === 0) {
    totalSeconds = 1;
  }

  remainingSeconds = totalSeconds;
  stopTimer();
  clearFinishedState();
  syncInputs(remainingSeconds);
  render(remainingSeconds);
  setStatus("新時間已設定，可以開始倒數。");
}

timerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyTime(inputMinutes.value, inputSeconds.value);
});

startButton.addEventListener("click", () => {
  if (timerId) {
    return;
  }

  clearFinishedState();
  endTime = Date.now() + remainingSeconds * 1000;
  tick();
  timerId = setInterval(tick, 250);
  setStatus("倒數進行中。");
});

pauseButton.addEventListener("click", () => {
  if (!timerId) {
    return;
  }

  stopTimer();
  setStatus("已暫停，按開始會從目前時間繼續。");
});

resetButton.addEventListener("click", () => {
  stopTimer();
  clearFinishedState();
  remainingSeconds = totalSeconds;
  syncInputs(totalSeconds);
  render(remainingSeconds);
  setStatus("已重設回目前設定的時間。");
});

quickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const seconds = Number(button.dataset.seconds);
    applyTime(Math.floor(seconds / 60), seconds % 60);
  });
});

syncInputs(totalSeconds);
render(remainingSeconds);
