let discontentTimeoutId;
let discontentInterval = 10 * 1000;
let contentmentLevel = 0;

const pet = document.querySelector("#pet");
const startButton = document.querySelector("#start");
const levelDisplay = document.querySelector(".level");
const message = document.querySelector("#message");

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

const pointerCoordinates = {
  start: { x: null, y: null, time: null },
  end: { x: null, y: null, time: null },
  transposedEvent: null,

  setStart(event) {
    this._convertEvent(event);
    this.start.x = this.transposedEvent.pageX;
    this.start.y = this.transposedEvent.pageY;
    this.start.time = performance.now();
  },

  setEnd(event) {
    this._convertEvent(event);
    this.end.x = this.transposedEvent.pageX;
    this.end.y = this.transposedEvent.pageY;
    this.end.time = performance.now();
  },

  _convertEvent(event) {
    if (event.touches) {
      this.transposedEvent = event.touches[0] || event.changedTouches[0];
    } else {
      this.transposedEvent = event;
    }
  },

  getStrokeAttributes() {
    return {
      x: Math.abs(this.start.x - this.end.x),
      y: Math.abs(this.start.y - this.end.y),
      pleasant: this._isPleasant(),
      time: (this.end.time - this.start.time) / 1000, // converts to seconds
    };
  },

  _isPleasant() {
    const isMinimumTime = (this.end.time - this.start.time) / 1000 > 1;
    const absoluteX = Math.abs(this.start.x - this.end.x);
    const y = Math.abs(this.start.y - this.end.y);
    const isAgainstGrain = this.start.y > this.end.y;
    if (isAgainstGrain || absoluteX > y) {
      return false;
    }
    return isMinimumTime ? true : "meh";
  },
};

setupListeners();

function startPetting(event) {
  pointerCoordinates.setStart(event);
}

function stopPetting(event) {
  if (event.target === startButton) {
    return;
  }
  pointerCoordinates.setEnd(event);
  strokePet();
}

function strokePet() {
  const stroke = pointerCoordinates.getStrokeAttributes();

  clearTimeout(discontentTimeoutId);
  recursivelySetContentmentLevel("down");

  if (!stroke.pleasant) {
    return setContentmentLevel("down") && setMessage("Uggh");
  }

  if (stroke.pleasant && stroke.pleasant != "meh") {
    contentmentLevel <= 0 && setContentmentLevel("reset");
    setContentmentLevel("up") && setMessage("❤️");
    return;
  } else {
    setMessage("...");
  }
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

function setupListeners() {
  pet.addEventListener("mousedown", (event) => startPetting(event));
  pet.addEventListener("mouseup", (event) => stopPetting(event));
  pet.addEventListener("touchend", (event) => stopPetting(event));
  pet.addEventListener("levelchanged", (event) => handleLevelEvent(event));
  startButton.addEventListener("click", () => {
    startButton.textContent = "Pet me!";
    setTimeout(() => {
      startButton.style.display = "none";
    }, 1000);
  });
}
