import { pointerCoordinates } from './stroke.js';

let discontentTimeoutId;
let discontentInterval = 10 * 1000;
let contentmentLevel = 0;

const levelDisplay = document.querySelector(".level");
const message = document.querySelector("#message");
const pet = document.querySelector("#pet");
const startButton = document.querySelector("#start");

const messageText = {
  isPleasant: "😻",
  isNotPleasant: "🙀",
  isNeutral: "🐱"
}

const sfx = {
  mewl: new Howl({
    src: ["sounds/mewling.mp3"],
    loop: true,
    volume: 0,
    onfade: (event) => handleSoundFadeEvent(event, { sound: "mewl" }),
  }),

  purr: new Howl({
    src: ["sounds/purring.mp3"],
    loop: true,
    volume: 0,
    onfade: (event) => handleSoundFadeEvent(event, { sound: "purr" }),
  }),
};

function startPetting(event) {
  pointerCoordinates.setStart(event);
}

function stopPetting(event) {
  pointerCoordinates.setEnd(event);
  strokePet();
}

function strokePet() {
  const { isPleasant } = pointerCoordinates.getStrokeAttributes();

  clearTimeout(discontentTimeoutId);
  recursivelySetContentmentLevel("down");

  if (isPleasant === undefined) {
    return setMessage(messageText.isNeutral);
  }

  if (!isPleasant) {
    setPetDiscontentment();
  } else {
    setPetContentment();
  }
}

function setPetDiscontentment() {
  setContentmentLevel("down");
  setMessage(messageText.isNotPleasant);
}

function setPetContentment() {
  if (contentmentLevel <= 0) {
    setContentmentLevel("reset");
  }
  setContentmentLevel("up");
  setMessage(messageText.isPleasant);
}

function setMessage(text) {
  message.textContent = text;
  message.style.left = `${pointerCoordinates.end.x}px`;
  message.style.top = `${pointerCoordinates.end.y}px`;
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 1000);
}

function handleLevelEvent(event) {
  const direction = event.detail.direction;
  let soundSource;

  if (direction === "reset") {
    contentmentLevel = 0;
    soundSource = sfx.mewl;
  }

  if (contentmentLevel === 0) {
    if (direction === "down") {
      soundSource = sfx.purr;
    }
    if (direction === "up") {
      soundSource = sfx.mewl;
    }
  }

  if (contentmentLevel > 0) {
    soundSource = sfx.purr;
  }

  if (contentmentLevel < 0) {
    soundSource = sfx.mewl;
  }

  fadeToContentmentLevel(soundSource);
  levelDisplay.textContent = contentmentLevel;
}

function handleSoundFadeEvent(event, options = {}) {
  let soundSource = sfx[options.sound];

  if (soundSource.volume() === 0) {
    soundSource.pause();
  }
}

function setContentmentLevel(direction) {
  if (direction === "up") {
    contentmentLevel++;
  }

  if (direction === "down") {
    contentmentLevel--;
  }

  const contentmentLevelChange = new CustomEvent("levelchanged", {
    detail: { direction: direction },
  });

  pet.dispatchEvent(contentmentLevelChange);
  return true;
}

function recursivelySetContentmentLevel(direction) {
  discontentTimeoutId = setTimeout(() => {
    if (!setContentmentLevel(direction)) {
      clearTimeout(discontentTimeoutId);
      return;
    }
    recursivelySetContentmentLevel(direction);
  }, discontentInterval);
}

function fadeToContentmentLevel(sound) {
  if (!sound.playing()) {
    sound.play();
  }
  sound.fade(sound.volume(), Math.abs(contentmentLevel / 10), 1000);
}

function handleStartButtonPostClick() {
  const fadeOutDelay = 1000; // milliseconds
  const fadeOutDuration = 500; // milliseconds
  const startButtonText = "Pet me!";

  startButton.style.pointerEvents = "none";
  startButton.textContent = startButtonText;

  setTimeout(() => {
    startButton.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration: fadeOutDuration,
      fill: "forwards"
    });
  }, fadeOutDelay);
}

function setupListeners() {
  ["mousedown", "touchstart"].forEach(event => pet.addEventListener(event, startPetting, false));
  ["mouseup", "touchend"].forEach(event => pet.addEventListener(event, stopPetting, false));
  pet.addEventListener("levelchanged", event => handleLevelEvent(event), false);
}

function main() {
  startButton.addEventListener("click", () => {
    setupListeners();
    handleStartButtonPostClick();
  })
}

main();
