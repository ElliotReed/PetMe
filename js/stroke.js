const pointerCoordinates = {
  start: { x: null, y: null, time: null },
  end: { x: null, y: null, time: null },

  setStart: function (event) {
    const { start } = this;
    const convertedEvent = this._convertEventIfTouch(event);

    start.x = convertedEvent.pageX;
    start.y = convertedEvent.pageY;
    start.time = performance.now();
  },

  setEnd: function (event) {
    const { end } = this;
    const convertedEvent = this._convertEventIfTouch(event);

    end.x = convertedEvent.pageX;
    end.y = convertedEvent.pageY;
    end.time = performance.now();
  },

  getStrokeAttributes: function () {
    const { start, end } = this;

    return {
      x: Math.abs(start.x - end.x),
      y: Math.abs(start.y - end.y),
      isPleasant: this._isPleasant(),
      time: (end.time - start.time) / 1000, // converts to seconds
    };
  },

  _convertEventIfTouch: function (event) {
    if (event.touches) {
      return event.touches[0] || event.changedTouches[0];
    }
    return event;
  },

  _isNotPLeasant() {
    const { start, end } = this;
    const horizontalDistance = Math.abs(start.x - end.x);
    const verticalDistance = Math.abs(start.y - end.y);
    const isTooSideways = horizontalDistance > verticalDistance
    const isAgainstFur = start.y > end.y;
    // The cat doesn't like it when you pet against the grain or sideways
    return (isAgainstFur || isTooSideways) ? true : false;
  },

  _isPleasant: function () {
    const { start, end } = this;
    const isLongEnough = (end.time - start.time) / 1000 > 1;

    if (this._isNotPLeasant()) return false;
    // The cat enjoys being petted for a certain duration
    return isLongEnough ? true : undefined;
  }
};

export { pointerCoordinates }