let discontentTimeoutId;
let discontentInterval = 10 * 1000;
let contentmentLevel = 0; // -1 to 1 to  match volume parameters (absolute value)
const pet = document.querySelector("#pet");
const fur = document.querySelector("#fur");
const sfx = {
  mewl: new Howl({
    src: ["sounds/mewling.mp3"],
    loop: true,
    volume: 0,
    onfade: (event) => handleSoundFadeEvent(event, { sound: "mewl" }),
  }),

  purr: new Howl({
    src: ["sounds/purr.mp3"],
    loop: true,
    volume: 0,
    onfade: (event) => handleSoundFadeEvent(event, { sound: "purr" }),
  }),
};

const pointerCoordinates = {
  start: { x: null, y: null, pressure: null, time: null },
  end: { x: null, y: null, pressure: null, time: null },
  transposedEvent: null,

  setStart(event) {
    this._convertEvent(event);
    this.start.x = this.transposedEvent.pageX;
    this.start.y = this.transposedEvent.pageY;
    this.start.pressure = this.transposedEvent.pressure;
    this.start.time = performance.now();
  },

  setEnd(event) {
    this._convertEvent(event);
    this.end.x = this.transposedEvent.pageX;
    this.end.y = this.transposedEvent.pageY;
    this.end.pressure = this.transposedEvent.pressure;
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
      pleasant: this.start.y < this.end.y,
      time: (this.end.time - this.start.time) / 1000, // converts to seconds
    };
  },
};

setupListeners();

function startPetting(event) {
  pointerCoordinates.setStart(event);
}

function stopPetting(event) {
  pointerCoordinates.setEnd(event);
  strokePet();
}

function strokePet() {
  const stroke = pointerCoordinates.getStrokeAttributes();
  const petWidth = pet.clientWidth;
  const petHeight = pet.clientHeight;
  const isMinimumTime = stroke.time > 1;

  clearTimeout(discontentTimeoutId);
  recursivelySetContentmentLevel("down");

  if (stroke.x > petWidth / 3) {
    isMinimumTime && console.warn("too wide");
  }

  if (stroke.y > (petHeight * 2) / 4) {
    isMinimumTime && setContenmentLevel("up");
    !isMinimumTime && console.log("not time: ", stroke.time);
  } else if (stroke.y > petHeight / 4) {
    isMinimumTime && setContenmentLevel("up");
    !isMinimumTime && console.log("not time: ", stroke.time);
  } else {
    console.warn("not really a stroke: ", stroke);
  }
}

function handleLevelEvent(event) {
  console.log("event.detail: ", event.detail);
  const direction = event.detail.direction;

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
}

function handleSoundFadeEvent(event, options = {}) {
  let soundSource = sfx[options.sound];

  if (soundSource.volume() === 0) {
    soundSource.pause();
  }
}

function isLevelWithinBounds() {
  const upperBound = 1;
  const lowerBound = -1;
  return contentmentLevel > lowerBound && contentmentLevel < upperBound;
}

function getNewLevel(operator) {
  let rawLevel;

  if (operator === "+") {
    rawLevel = contentmentLevel + 0.1;
  }

  if (operator === "-") {
    rawLevel = contentmentLevel - 0.1;
  }

  return Math.round(rawLevel * 10) / 10;
}

function setContenmentLevel(direction) {
  if (isLevelWithinBounds()) {
    if (direction === "up") {
      contentmentLevel = getNewLevel("+");
    }
    if (direction === "down") {
      contentmentLevel = getNewLevel("-");
    }

    const contentmentLevelChange = new CustomEvent("levelchanged", {
      detail: { direction: direction },
    });
    pet.dispatchEvent(contentmentLevelChange);
    return true;
  }
  return false;
}

function recursivelySetContentmentLevel(direction) {
  discontentTimeoutId = setTimeout(() => {
    if (!setContenmentLevel(direction)) {
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
  sound.fade(sound.volume(), Math.abs(contentmentLevel), 1000);
}

function setupListeners() {
  pet.addEventListener("pointerdown", (event) => startPetting(event));
  pet.addEventListener("mouseup", (event) => stopPetting(event));
  pet.addEventListener("touchend", (event) => stopPetting(event));
  pet.addEventListener("levelchanged", (event) => handleLevelEvent(event));
}
