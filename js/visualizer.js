const visualizer = document.getElementById("visualizer");
const analyzerNode = new AnalyserNode(Howler.ctx, { fftSize: 128 });
Howler.masterGain.connect(analyzerNode);

resize();
drawVisualizer();

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  const bufferLength = analyzerNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyzerNode.getByteFrequencyData(dataArray);
  const height = visualizer.height;
  const width = visualizer.width;

  const canvasContext = visualizer.getContext("2d");
  canvasContext.clearRect(0, 0, width, height);

  dataArray.forEach((item, index) => {
    const scaledFrequency = item / 255;
    const opacity = scaledFrequency / 1.5;
    const radiusX = (scaledFrequency * width) / 1.76;
    const radiusY = scaledFrequency * height;
    const baseColorValue = 29;
    const peakColorValue = 47;
    const red = scaledFrequency * index * 7.6;
    const limitedRed = Math.min(Math.max(red, baseColorValue), peakColorValue);

    canvasContext.fillStyle = `rgba(${limitedRed}, ${baseColorValue}, ${baseColorValue}, ${opacity})`;
    canvasContext.beginPath();
    canvasContext.ellipse(
      width / 2,
      height / 2,
      radiusX,
      radiusY,
      0,
      0,
      2 * Math.PI,
      false
    );
    canvasContext.fill();
  });
}

function resize() {
  visualizer.width = visualizer.clientWidth * window.devicePixelRatio;
  visualizer.height = visualizer.clientHeight * window.devicePixelRatio;
}
