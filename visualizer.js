
  const BAR_COUNT = 30;

const spectrumCanvas = document.getElementById('spectrumCanvas');
const spectrumCtx = spectrumCanvas.getContext('2d');

let latestVisualizerData = {
  bass: 0,
  mid: 0,
  high: 0,
  master: 0,
  bars: []
};


function setBackgroundLayer(src) {
  const bgImage = document.getElementById('bgImage');

  if (!bgImage) {
    console.error('bgImage が見つかりません');
    return;
  }

  if (!src) {
    bgImage.style.display = 'none';
    bgImage.removeAttribute('src');
    return;
  }

  bgImage.onload = () => {
    console.log('背景読み込み成功:', src);
    bgImage.style.display = 'block';
  };

  bgImage.onerror = () => {
    console.error('背景読み込み失敗:', src);
    bgImage.style.display = 'none';
    bgImage.removeAttribute('src');
  };

  bgImage.src = src;
}

let effectSettings = {
  spectrum: 1,
  particles: 1,
  aurora: 1,
  glow: 1,
  glsl: 0
};

window.NORAH_VISUAL_STATE = {
  godRayEnabled: false,
  particlePreset: "default",
  spectrumTheme: "default"
};




function resizeSpectrumCanvas() {
  const dpr = window.devicePixelRatio || 1;

  spectrumCanvas.width = Math.floor(window.innerWidth * dpr);
  spectrumCanvas.height = Math.floor(window.innerHeight * dpr);

  spectrumCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeSpectrumCanvas);
resizeSpectrumCanvas();


function createVisualizerBars() {
  const barsContainer = document.getElementById('bars');
  if (!barsContainer) return;

  barsContainer.innerHTML = '';

  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');

    if (i < 6) {
      bar.className = 'bar bass-bar';
    } else if (i < 20) {
      bar.className = 'bar mid-bar';
    } else {
      bar.className = 'bar high-bar';
    }

    bar.style.setProperty('--bar-level', 0);
    bar.style.setProperty('--bar-delay', `${i * 0.012}s`);

    barsContainer.appendChild(bar);
  }
}

createVisualizerBars();


const { ipcRenderer } = require('electron');

function playSongChangeAnimation(callback) {
  const coverFrame = document.getElementById('coverFrame');
  const songInfo = document.getElementById('songInfo');

  coverFrame?.classList.add('is-changing');
  songInfo?.classList.add('is-changing');

  setTimeout(() => {
    callback();

    requestAnimationFrame(() => {
      coverFrame?.classList.remove('is-changing');
      songInfo?.classList.remove('is-changing');
    });
  }, 280);
}

ipcRenderer.on('visualizer-song', (event, song) => {
  console.log('★★★★ SONG ★★★★');
  console.log(song);
  document.getElementById('title').textContent = song.title || '';
  document.getElementById('artist').textContent = song.artist || '';

  const coverImage = document.getElementById('coverImage');
const coverFrame = document.getElementById('coverFrame');

const coverUrl =
  song?.artworkUrl ||
  song?.coverUrl ||
  '';

if (coverImage && coverFrame) {
  // 前の曲の読み込み処理を解除
  coverImage.onload = null;
  coverImage.onerror = null;

  // 前のジャケットを必ず消す
  coverImage.removeAttribute('src');
  coverFrame.style.display = 'none';

  if (coverUrl) {
    console.log('cover set:', coverUrl);

    coverImage.onload = () => {
      console.log('cover loaded:', coverUrl);
      coverFrame.style.display = 'block';
    };

    coverImage.onerror = (error) => {
      console.error(
        'cover load failed:',
        coverUrl,
        error
      );

      coverImage.removeAttribute('src');
      coverFrame.style.display = 'none';
    };

    coverImage.src = coverUrl;
  } else {
    console.log('ジャケットなし');
  }
}

  const bgVideo = document.getElementById('bgVideo');
  const bgImage = document.getElementById('bgImage');

  if (song.mediaType === 'video') {
    bgVideo.pause();
    bgVideo.src = song.fileUrl;
    bgVideo.style.display = 'block';
    bgVideo.muted = false;
    bgVideo.volume = 1;

    bgImage.style.display = 'none';
    bgImage.src = '';

    setupVideoAnalyzer();

    if (videoAudioContext.state === 'suspended') {
      videoAudioContext.resume();
    }

    bgVideo.play().then(() => {
      startVideoVisualizerLevelLoop();
    }).catch(error => {
      console.error('動画を再生できませんでした:', error);
    });

    return;
  }

  bgVideo.pause();
  bgVideo.removeAttribute('src');
  bgVideo.load();
  bgVideo.style.display = 'none';
});

ipcRenderer.on('visualizer-background', (event, background) => {
  const bgVideo = document.getElementById('bgVideo');

  if (bgVideo && bgVideo.style.display === 'block') {
    return;
  }

  if (!background || !background.fileUrl) {
    setBackgroundLayer(null);
    return;
  }

  setBackgroundLayer(background.fileUrl);
});

const bgVideo = document.getElementById('bgVideo');

bgVideo.addEventListener('ended', () => {
  stopVideoVisualizerLevelLoop();
  ipcRenderer.invoke('visualizer-video-ended');
});



ipcRenderer.on('visualizer-overlay-layers', (event, layers) => {
  renderOverlayLayers(layers);
});

ipcRenderer.on('visualizer-overlay-layer-settings', (event, settings) => {
  if (!settings) return;

  const targetBox =
    document.querySelector(`.overlayBox[data-layer-index="${settings.layerIndex}"]`) ||
    selectedOverlayBox ||
    document.querySelector('.overlayBox[data-layer-index="0"]');

  if (!targetBox) return;

  if (settings.opacity !== undefined) {
    targetBox.style.opacity = String(settings.opacity);
    saveOverlayLayerState(targetBox);
  }
});


let isDraggingOverlay = false;



function saveOverlayLayerState(box) {
  if (!box) return;

  const layerId = box.dataset.layerId;
  if (!layerId) return;

  const state = {
    x: parseFloat(box.style.left) || 50,
    y: parseFloat(box.style.top) || 50,
    width: parseFloat(box.style.width) || 180,
    opacity: parseFloat(box.style.opacity) || 1
  };

  localStorage.setItem(
    `paradox_${layerId}_settings`,
    JSON.stringify(state)
  );
}

function loadOverlayLayerState(layerId) {
  const saved = localStorage.getItem(`paradox_${layerId}_settings`);
  if (!saved) return;

  try {
    const state = JSON.parse(saved);
    const box = document.getElementById(layerId);
    if (!box) return;

    box.style.left = `${state.x}%`;
    box.style.top = `${state.y}%`;
    box.style.width = `${state.size}px`;
    box.style.opacity = String(state.opacity ?? 1);
    box.style.right = 'auto';
    box.style.bottom = 'auto';
    box.style.transform = 'translate(-50%, -50%)';
  } catch (error) {
    localStorage.removeItem(`paradox_${layerId}_settings`);
  }
}

let selectedOverlayBox = null;
let isMovingOverlay = false;
let isResizingOverlay = false;

function setupOverlayEditor() {

    const container = document.getElementById("overlayLayers");

    if (!container) return;

    container.onmousedown = (event) => {

        const box = event.target.closest(".overlayBox");

        if (!box) return;

        selectedOverlayBox = box;

        const layerIndex = Number(box.dataset.layerIndex);

if (Number.isFinite(layerIndex)) {
  ipcRenderer.invoke('select-overlay-layer-in-player', layerIndex);
}

        document
            .querySelectorAll(".overlayBox")
            .forEach(item => item.classList.remove("is-selected"));

        box.classList.add("is-selected");

        if (event.target.classList.contains("resizeHandle")) {

            isResizingOverlay = true;

        } else {

            isMovingOverlay = true;

        }

        event.preventDefault();

    };

    window.onmousemove = (event) => {

        if (!selectedOverlayBox) return;

        if (isMovingOverlay) {

            const x = event.clientX / window.innerWidth * 100;
            const y = event.clientY / window.innerHeight * 100;

            selectedOverlayBox.style.left = `${x}%`;
            selectedOverlayBox.style.top = `${y}%`;
            selectedOverlayBox.style.transform = "translate(-50%, -50%)";

        }

        if (isResizingOverlay) {

            const rect = selectedOverlayBox.getBoundingClientRect();

            const width = Math.max(
                40,
                event.clientX - rect.left
            );

            selectedOverlayBox.style.width = `${width}px`;

        }

    };

    window.onmouseup = () => {

        if (
            selectedOverlayBox &&
            (isMovingOverlay || isResizingOverlay)
        ) {

            saveOverlayLayerState(selectedOverlayBox);

        }

        isMovingOverlay = false;
        isResizingOverlay = false;

    };

    window.ondblclick = () => {

        if (!selectedOverlayBox) return;

        selectedOverlayBox.classList.remove("is-selected");

        selectedOverlayBox = null;

    };

}

setupOverlayEditor();


function renderOverlayLayers(layers) {
  const container = document.getElementById('overlayLayers');
  if (!container || !Array.isArray(layers)) return;

  container.innerHTML = '';

  [...layers].reverse().forEach((layer, reverseIndex) => {
  const index = layers.length - 1 - reverseIndex;
    if (!layer.visible) return;
    if (layer.type === 'image' && !layer.data?.fileUrl) return;

    const saved = localStorage.getItem(`paradox_${layer.id}_settings`);
    let savedState = {};

    try {
      savedState = saved ? JSON.parse(saved) : {};
    } catch {
      savedState = {};
    }

    const box = document.createElement('div');
    box.className = 'overlayBox';
    box.dataset.layerIndex = index;
    box.dataset.layerId = layer.id;
    box.style.display = 'block';

    box.style.left = `${savedState.x ?? layer.x ?? 50}%`;
    box.style.top = `${savedState.y ?? layer.y ?? 50}%`;
    box.style.width = `${savedState.width ?? layer.width ?? 180}px`;
    box.style.opacity = String(savedState.opacity ?? layer.opacity ?? 1);
    box.style.transform = 'translate(-50%, -50%)';

    if (layer.type === 'image') {
  const img = document.createElement('img');
  img.className = 'overlayLayer';
  img.src = layer.data?.fileUrl || '';

  box.appendChild(img);
}

if (layer.type === 'lyrics') {
  const text = document.createElement('div');
  text.className = 'lyricsLayer';
  text.textContent = layer.data?.text || '';

  console.log('Lyrics font:', layer.data?.font);

  text.style.setProperty(
  'font-family',
  `"${layer.data?.font || 'Arial'}", sans-serif`,
  'important'
);
  text.style.fontSize = `${layer.data?.size || 72}px`;
  text.style.color = layer.data?.color || '#ffffff';
  text.style.textAlign = layer.data?.align || 'center';
  text.style.whiteSpace = 'pre-wrap';
  text.style.letterSpacing =
  `${Number(layer.data?.letterSpacing || 0)}px`;
  text.style.lineHeight =
  String(Number(layer.data?.lineHeight || 1.2));
  
  const shadowColor = layer.data?.shadowColor || '#000000';
  const shadowBlur = Number(layer.data?.shadowBlur || 0);
  const shadowX = Number(layer.data?.shadowX || 0);
  const shadowY = Number(layer.data?.shadowY || 0);

text.style.textShadow =
  `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`;

  const outlineWidth = Number(layer.data?.outlineWidth || 0);
  const outlineColor = layer.data?.outlineColor || '#000000';

if (outlineWidth > 0) {
  text.style.webkitTextStroke = `${outlineWidth}px ${outlineColor}`;
}

  box.appendChild(text);
}

const handle = document.createElement('div');
handle.className = 'resizeHandle';

box.appendChild(handle);
container.appendChild(box);
  });

  setupOverlayEditor();
}

ipcRenderer.on('visualizer-stop-video', () => {
  stopVideoVisualizerLevelLoop();

  bgVideo.pause();
  bgVideo.currentTime = 0;
  bgVideo.removeAttribute('src');
  bgVideo.load();
  bgVideo.style.display = 'none';
});

function clampLevel(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

ipcRenderer.on('visualizer-level', (event, visualizerData) => {
  
  const stage = document.getElementById('stage');
  const bars = document.querySelectorAll('.bar');

  // 古い level 1個方式にも一応対応
  if (typeof visualizerData === 'number') {
    const level = clampLevel(visualizerData);

    stage.style.setProperty('--bass', level);
    stage.style.setProperty('--mid', level);
    stage.style.setProperty('--high', level);
    stage.style.setProperty('--master', level);

    bars.forEach(bar => {
      bar.style.setProperty('--bar-level', level);
    });

    latestVisualizerData = {
  bass: level,
  mid: level,
  high: level,
  master: level,
  bars: []
};

updateCoverMotion(level, level);

    return;
  }

  const bass = clampLevel(visualizerData?.bass);
  const mid = clampLevel(visualizerData?.mid);
  const high = clampLevel(visualizerData?.high);
  const master = clampLevel(visualizerData?.master);
  const barValues = Array.isArray(visualizerData?.bars) ? visualizerData.bars : [];

  stage.style.setProperty('--bass', bass);
  stage.style.setProperty('--mid', mid);
  stage.style.setProperty('--high', high);
  stage.style.setProperty('--master', master);

  bars.forEach((bar, index) => {
    const value = clampLevel(barValues[index]);

    bar.style.setProperty('--bar-level', value);
  });
latestVisualizerData = {
  bass,
  mid,
  high,
  master,
  bars: barValues
};
updateCoverMotion(bass, master);


});

const particles = [];
const PARTICLE_COUNT = 160;

const godRays = [];
const GOD_RAY_COUNT = 7;

function createParticles() {
  particles.length = 0;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
  angle: Math.random() * Math.PI * 2,
  radius: 80 + Math.random() * 260,
  speed: 0.15 + Math.random() * 0.65,
  size: 1 + Math.random() * 2.8,
  alpha: 0.18 + Math.random() * 0.55,
  depth: Math.random(),
  colorType: Math.floor(Math.random() * 3),
  previousX: null,
  previousY: null
});
  }
}

function createGodRays() {
  godRays.length = 0;

  for (let i = 0; i < GOD_RAY_COUNT; i++) {
    godRays.push({
      x: Math.random(),
      width: 70 + Math.random() * 90,
      alpha: 0.05 + Math.random() * 0.08,
      speed: 0.08 + Math.random() * 0.12,
      angle: -0.18 + Math.random() * 0.16,
      offset: Math.random() * Math.PI * 2
    });
  }
}

createGodRays();
createParticles();


function setupVideoAnalyzer() {
  const bgVideo = document.getElementById('bgVideo');

  if (videoAudioContext && videoAnalyser) return;

  videoAudioContext = new AudioContext();

  videoAnalyser = videoAudioContext.createAnalyser();
  videoAnalyser.fftSize = 256;

  videoAnalyserDataArray = new Uint8Array(videoAnalyser.frequencyBinCount);

  videoSourceNode = videoAudioContext.createMediaElementSource(bgVideo);
  videoSourceNode.connect(videoAnalyser);
  videoAnalyser.connect(videoAudioContext.destination);
}

function averageRange(array, start, end) {
  const safeStart = Math.max(0, start);
  const safeEnd = Math.min(array.length, end);

  if (safeEnd <= safeStart) return 0;

  let sum = 0;

  for (let i = safeStart; i < safeEnd; i++) {
    sum += array[i];
  }

  return sum / (safeEnd - safeStart);
}

function normalizeAudioValue(value, sensitivity = 220, curve = 0.75) {
  const normalized = Math.max(0, Math.min(1, value / sensitivity));

  return Math.pow(normalized, curve);
}

function createVisualizerData(array) {
  const bassRaw = averageRange(array, 1, 8);
  const midRaw = averageRange(array, 8, 42);
  const highRaw = averageRange(array, 42, 115);
  const masterRaw = averageRange(array, 1, 115);

  const bass = normalizeAudioValue(bassRaw, 230, 0.85);
  const mid = normalizeAudioValue(midRaw, 215, 0.82);
  const high = normalizeAudioValue(highRaw, 205, 0.78);
  const master = normalizeAudioValue(masterRaw, 225, 0.86);

  const barCount = 30;
  const bars = [];

  for (let i = 0; i < barCount; i++) {
    let start;
    let end;
    let sensitivity;
    let boost;

    if (i < 6) {
      // 左：低音 6本。動画でも張り付きやすいので抑える
      const localIndex = i;
      start = 1 + localIndex * 2;
      end = start + 3;
      sensitivity = 250;
      boost = 0.82;
    } else if (i < 20) {
      // 中央：中音 14本
      const localIndex = i - 6;
      start = 8 + localIndex * 2;
      end = start + 4;
      sensitivity = 225;
      boost = 0.92;
    } else {
      // 右：高音 10本
      const localIndex = i - 20;
      start = 42 + localIndex * 5;
      end = start + 8;
      sensitivity = 210;
      boost = 1.05;
    }

    const raw = averageRange(array, start, end);
    const variation = 0.72 + (Math.sin(i * 1.7) + 1) * 0.16;

    let value = normalizeAudioValue(raw * boost * variation, sensitivity, 0.9);

    if (i < 6) {
      value = Math.min(value, 0.82);
    } else if (i < 20) {
      value = Math.min(value, 0.88);
    } else {
      value = Math.min(value, 0.94);
    }

    bars.push(value);
  }

  return {
    bass,
    mid,
    high,
    master,
    bars
  };
}

function applyVisualizerData(visualizerData) {
  const stage = document.getElementById('stage');
  const bars = document.querySelectorAll('.bar');

  const bass = clampLevel(visualizerData?.bass);
  const mid = clampLevel(visualizerData?.mid);
  const high = clampLevel(visualizerData?.high);
  const master = clampLevel(visualizerData?.master);
  const barValues = Array.isArray(visualizerData?.bars) ? visualizerData.bars : [];

  stage.style.setProperty('--bass', bass);
  stage.style.setProperty('--mid', mid);
  stage.style.setProperty('--high', high);
  stage.style.setProperty('--master', master);

  bars.forEach((bar, index) => {
    bar.style.setProperty('--bar-level', clampLevel(barValues[index]));
  });
  latestVisualizerData = {
  bass,
  mid,
  high,
  master,
  bars: barValues
};
updateCoverMotion(bass, master);
}

function updateCoverMotion(bass, master) {
  const coverFrame = document.getElementById('coverFrame');
  if (!coverFrame) return;

  const scale = 1 + bass * 0.055 + master * 0.018;
  const brightness = 1 + master * 0.18;

  coverFrame.style.transform = `translate(-50%, -50%) scale(${scale})`;
  coverFrame.style.filter = `brightness(${brightness})`;
}

function drawAurora(width, height) {
  const auroraPower = effectSettings.aurora; if (auroraPower <= 0) return;
  const bass = latestVisualizerData.bass || 0;
  const mid = latestVisualizerData.mid || 0;
  const high = latestVisualizerData.high || 0;
  const master = latestVisualizerData.master || 0;

  const time = Date.now() * 0.001;
  const centerY = height * 0.34;
  const layerCount = 4;

  spectrumCtx.save();
  spectrumCtx.globalCompositeOperation = 'screen';

  for (let layer = 0; layer < layerCount; layer++) {
    const yOffset = layer * 36;
    const amplitude = 22 + layer * 10 + bass * 42;
    const speed = 0.55 + layer * 0.18;
    const alpha = (0.055 + master * 0.08 + layer * 0.012) * auroraPower;

    let color;

    if (layer === 0) {
      color = `rgba(124, 251, 255, ${alpha})`;
    } else if (layer === 1) {
      color = `rgba(47, 123, 255, ${alpha})`;
    } else if (layer === 2) {
      color = `rgba(255, 79, 216, ${alpha})`;
    } else {
      color = `rgba(180, 255, 255, ${alpha * 0.8})`;
    }

    const gradient = spectrumCtx.createLinearGradient(0, centerY - 90, 0, centerY + 190);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.42, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    spectrumCtx.beginPath();
    spectrumCtx.moveTo(0, centerY + yOffset);

    for (let x = 0; x <= width; x += 16) {
      const wave1 = Math.sin(x * 0.010 + time * speed + layer * 1.8);
      const wave2 = Math.sin(x * 0.023 - time * (speed * 0.7) + layer * 2.6);
      const wave3 = Math.sin(x * 0.004 + time * 0.35 + high * 3);

      const y =
        centerY +
        yOffset +
        wave1 * amplitude +
        wave2 * (amplitude * 0.45) +
        wave3 * (12 + mid * 24);

      spectrumCtx.lineTo(x, y);
    }

    spectrumCtx.lineTo(width, centerY + yOffset + 190);
    spectrumCtx.lineTo(0, centerY + yOffset + 190);
    spectrumCtx.closePath();

    spectrumCtx.fillStyle = gradient;
    spectrumCtx.shadowBlur = 28 + master * 42;
    spectrumCtx.shadowColor = color;
    spectrumCtx.fill();
  }

  spectrumCtx.restore();
}




function drawGlowFlash(width, height) {
  const glowPower = effectSettings.glow;
if (glowPower <= 0) return;
  const bass = latestVisualizerData.bass || 0;
  const master = latestVisualizerData.master || 0;

  const power = Math.max(0, bass * 0.85 + master * 0.35 - 0.18) * glowPower;
  if (power <= 0.01) return;

  const centerX = width / 2;
  const centerY = height * 0.39;

  spectrumCtx.save();
  spectrumCtx.globalCompositeOperation = 'screen';

  const radius = Math.max(width, height) * (0.38 + power * 0.22);

  const gradient = spectrumCtx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius
  );

  gradient.addColorStop(0, `rgba(124, 251, 255, ${power * 0.28})`);
  gradient.addColorStop(0.35, `rgba(47, 123, 255, ${power * 0.16})`);
  gradient.addColorStop(0.68, `rgba(255, 79, 216, ${power * 0.10})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  spectrumCtx.fillStyle = gradient;
  spectrumCtx.fillRect(0, 0, width, height);

  spectrumCtx.restore();
}


function drawCoverNeonRing(width, height) {
  const bass = latestVisualizerData.bass || 0;
  const mid = latestVisualizerData.mid || 0;
  const high = latestVisualizerData.high || 0;
  const master = latestVisualizerData.master || 0;

  const centerX = width / 2;
  const centerY = height * 0.39;

  const isWide = width > height;
  const radius = isWide ? 112 : 104;

  const time = Date.now() * 0.001;
  const rotation = time * 0.35;

  spectrumCtx.save();
  spectrumCtx.globalCompositeOperation = 'screen';

  // Aurora Glow Halo
const haloGradient = spectrumCtx.createRadialGradient(
  centerX,
  centerY,
  radius * 0.72,
  centerX,
  centerY,
  radius * 1.75
);

haloGradient.addColorStop(0.00, 'rgba(124, 251, 255, 0.00)');
haloGradient.addColorStop(0.42, 'rgba(124, 251, 255, 0.13)');
haloGradient.addColorStop(0.68, 'rgba(255, 79, 216, 0.09)');
haloGradient.addColorStop(1.00, 'rgba(0, 0, 0, 0)');

spectrumCtx.fillStyle = haloGradient;
spectrumCtx.fillRect(0, 0, width, height);

  for (let i = 0; i < 4; i++) {
    const ringRadius = radius + i * 5 + bass * 5;
const lineWidth = 2.8 - i * 0.28 + master * 2.6;
const alpha = 0.42 - i * 0.07 + master * 0.30;

    const gradient = spectrumCtx.createConicGradient(rotation + i * 0.9, centerX, centerY);

    gradient.addColorStop(0.00, `rgba(124,251,255,${alpha})`);
    gradient.addColorStop(0.28, `rgba(47,123,255,${alpha * 0.72})`);
    gradient.addColorStop(0.55, `rgba(255,79,216,${alpha * 0.85})`);
    gradient.addColorStop(0.82, `rgba(124,251,255,${alpha * 0.95})`);
    gradient.addColorStop(1.00, `rgba(124,251,255,${alpha})`);

    spectrumCtx.beginPath();
    spectrumCtx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    spectrumCtx.lineWidth = lineWidth;
    spectrumCtx.strokeStyle = gradient;
    spectrumCtx.shadowBlur = 16 + master * 28 + high * 10;
    spectrumCtx.shadowColor = 'rgba(124,251,255,0.9)';
    spectrumCtx.stroke();
  }

  spectrumCtx.restore();
}


function drawGodRays(width, height) {
  if (!visualizerEnabled) return;
  if (!window.NORAH_VISUAL_STATE.godRayEnabled)
  return;

  const time = Date.now() * 0.001;
  const master = latestVisualizerData.master || 0;

  spectrumCtx.save();
  spectrumCtx.globalCompositeOperation = 'screen';

  godRays.forEach((ray) => {
    const drift =
      Math.sin(time * ray.speed + ray.offset) * width * 0.08;

    const centerX =
      ray.x * width + drift;

    const rayWidth =
      ray.width * (1 + master * 0.35);

    spectrumCtx.save();

    spectrumCtx.translate(centerX, height * 0.42);
    spectrumCtx.rotate(ray.angle);

    const gradient =
      spectrumCtx.createLinearGradient(
        0,
        -height * 0.75,
        0,
        height * 0.65
      );

    gradient.addColorStop(
      0,
      `rgba(120, 245, 255, ${ray.alpha * 1.35})`
    );

    gradient.addColorStop(
      0.32,
      `rgba(80, 180, 255, ${ray.alpha})`
    );

    gradient.addColorStop(
      1,
      'rgba(0, 0, 0, 0)'
    );

    spectrumCtx.fillStyle = gradient;

    spectrumCtx.filter = `blur(${18 + master * 18}px)`;

    spectrumCtx.beginPath();
    spectrumCtx.moveTo(-rayWidth * 0.5, -height * 0.75);
    spectrumCtx.lineTo(rayWidth * 0.5, -height * 0.75);
    spectrumCtx.lineTo(rayWidth * 1.35, height * 0.65);
    spectrumCtx.lineTo(-rayWidth * 1.35, height * 0.65);
    spectrumCtx.closePath();
    spectrumCtx.fill();

    spectrumCtx.restore();
  });

  spectrumCtx.restore();
  spectrumCtx.filter = 'none';
}


function drawNeonParticles(width, height) {
  const particlePreset =
  window.NORAH_PARTICLE_ENGINE?.getPreset() || "default";
  
  if (particlePreset === "auroraDust") {
  return;
}
  const particlePower = effectSettings.particles;
if (particlePower <= 0) return;
  const bass = latestVisualizerData.bass || 0;
  const mid = latestVisualizerData.mid || 0;
  const high = latestVisualizerData.high || 0;
  const master = latestVisualizerData.master || 0;

  const centerX = width / 2;
  const centerY = height * 0.39;
  const isWide = width > height;

  const maxRadius = isWide ? 460 : 330;
  const audioPush = 1 + bass * 0.8 + master * 0.35;

  particles.forEach((particle) => {
    particle.angle += 0.002 * particle.speed + high * 0.006;
    particle.radius +=
    particle.speed *
    (0.08 + particle.depth * 0.9 + mid * 0.6);

    if (particle.radius > maxRadius) {
  particle.radius = 80 + Math.random() * 40;
  particle.angle = Math.random() * Math.PI * 2;
  particle.alpha = 0.18 + Math.random() * 0.55;
  particle.size = 1 + Math.random() * 2.8;
  particle.previousX = null;
  particle.previousY = null;
}

    const wave = Math.sin(Date.now() * 0.0015 + particle.angle * 3) * 8;
    const drawRadius = particle.radius * audioPush + wave;

    const x = centerX + Math.cos(particle.angle) * drawRadius;
    const y = centerY + Math.sin(particle.angle) * drawRadius;
    const size =
    particle.size *
    (0.45 + particle.depth * 1.7);
    let color;

    if (particlePreset === "bubble") {
  color = `rgba(120, 245, 255, ${particle.alpha + master * 0.25})`;
} else if (particlePreset === "starDust") {
  if (particle.colorType === 0) {
    color = `rgba(180, 210, 255, ${particle.alpha + high * 0.30})`;
  } else if (particle.colorType === 1) {
    color = `rgba(190, 120, 255, ${particle.alpha + mid * 0.24})`;
  } else {
    color = `rgba(255, 180, 235, ${particle.alpha + master * 0.22})`;
  }
} else {
  if (particle.colorType === 0) {
    color = `rgba(124, 251, 255, ${particle.alpha + master * 0.35})`;
  } else if (particle.colorType === 1) {
    color = `rgba(47, 123, 255, ${particle.alpha + mid * 0.30})`;
  } else {
    color = `rgba(255, 79, 216, ${particle.alpha + high * 0.30})`;
  }
}

    if (particle.previousX !== null && particle.previousY !== null) {
  spectrumCtx.beginPath();
  spectrumCtx.moveTo(particle.previousX, particle.previousY);
  spectrumCtx.lineTo(x, y);
  spectrumCtx.lineWidth = 0.8 + size * particlePower;
  spectrumCtx.lineCap = 'round';
  spectrumCtx.strokeStyle = color;
  spectrumCtx.shadowBlur = 12 + master * 22;
  spectrumCtx.shadowColor = color;
  spectrumCtx.stroke();
}

if (particlePreset === "bubble") {
  spectrumCtx.save();

  spectrumCtx.globalAlpha =
    Math.min(1, particle.alpha + master * 0.25);

  spectrumCtx.strokeStyle =
    `rgba(140, 250, 255, ${0.35 + master * 0.25})`;

  spectrumCtx.lineWidth =
    Math.max(1, size * 0.16);

  spectrumCtx.beginPath();
  spectrumCtx.arc(x, y, size * 1.45, 0, Math.PI * 2);
  spectrumCtx.stroke();

  spectrumCtx.fillStyle =
    `rgba(180, 255, 255, ${0.16 + master * 0.10})`;

  spectrumCtx.beginPath();
  spectrumCtx.arc(
    x - size * 0.45,
    y - size * 0.45,
    size * 0.28,
    0,
    Math.PI * 2
  );
  spectrumCtx.fill();

  spectrumCtx.restore();
} else {
  spectrumCtx.save();

  spectrumCtx.globalAlpha = 1;
  spectrumCtx.fillStyle = color;
  spectrumCtx.shadowColor = color;
  spectrumCtx.shadowBlur = 8 + master * 12;

  spectrumCtx.beginPath();
  spectrumCtx.arc(x, y, size, 0, Math.PI * 2);
  spectrumCtx.fill();

  spectrumCtx.restore();
}

particle.previousX = x;
particle.previousY = y;
  });

  spectrumCtx.shadowBlur = 0;
}

function getSmoothBarLevel(bars, index, totalCount, master) {
  if (!bars || bars.length === 0) return master;

  const position = (index / totalCount) * (bars.length - 1);
  const leftIndex = Math.floor(position);
  const rightIndex = Math.min(bars.length - 1, leftIndex + 1);
  const mix = position - leftIndex;

  const left = bars[leftIndex] ?? master;
  const right = bars[rightIndex] ?? master;

  const interpolated = left * (1 - mix) + right * mix;

  const bandVariation =
  0.58 +
  Math.sin(index * 1.91) * 0.18 +
  Math.sin(index * 4.73) * 0.14 +
  Math.sin(index * 0.77) * 0.10;

const spike =
  Math.sin(index * 8.31) > 0.58
    ? 0.18
    : 0;

const dip =
  Math.sin(index * 5.17) < -0.62
    ? 0.26
    : 0;

const varied = interpolated * bandVariation + spike - dip;

return Math.max(0.03, Math.min(1, varied));
}

function getVisualizerScale() {
  const BASE_WIDTH = 1080;
  const BASE_HEIGHT = 1920;

  return Math.min(
    window.innerWidth / BASE_WIDTH,
    window.innerHeight / BASE_HEIGHT
  );
}

function setLyrics(
  lines,
  animation = { preset: 'fade', duration: 0.5 },
  style = {},
  position = { x: 0, y: 0, z: 0 },
  layout = { width: 900, rotation: 0 }
) {
  const lyricsBlocksLayer =
    document.getElementById('lyricsBlocksLayer');

  if (!lyricsBlocksLayer) {
    console.error('lyricsBlocksLayer が見つかりません');
    return;
  }

  lyricsBlocksLayer.innerHTML = '';

  const lyricsBlock = document.createElement('div');
  lyricsBlock.className = 'visualizerLyricsBlock';

  lyricsBlocksLayer.appendChild(lyricsBlock);

  const payload = {
    lines,
    style,
    position,
    layout,
    animation
  };

  window.LyricsRenderer.render(lyricsBlock, payload);
  applyLyricsAnimation(lyricsBlock, animation);
}


function setLyricsBlocks(blocks) {
  const lyricsBlocksLayer =
    document.getElementById('lyricsBlocksLayer');

  if (!lyricsBlocksLayer) {
    console.error('lyricsBlocksLayer が見つかりません');
    return;
  }

  const safeBlocks = Array.isArray(blocks)
    ? blocks.filter(Boolean)
    : [];

  const activeIds = new Set(
    safeBlocks.map(block => String(block.id || ''))
  );

  // 終了した歌詞だけ削除
  lyricsBlocksLayer
    .querySelectorAll('.visualizerLyricsBlock')
    .forEach(element => {
      const blockId = element.dataset.blockId || '';

      if (!activeIds.has(blockId)) {
        element.remove();
      }
    });

  safeBlocks
    .slice()
    .sort((a, b) => {
      const zA = Number(a?.position?.z) || 0;
      const zB = Number(b?.position?.z) || 0;

      return zA - zB;
    })
    .forEach(block => {
      const blockId = String(block.id || '');

      let lyricsBlock =
        lyricsBlocksLayer.querySelector(
          `.visualizerLyricsBlock[data-block-id="${CSS.escape(blockId)}"]`
        );

      const isNewBlock =
  !lyricsBlock;

if (!lyricsBlock) {
  lyricsBlock =
    document.createElement(
      'div'
    );

  lyricsBlock.className =
    'visualizerLyricsBlock';

  lyricsBlock.dataset.blockId =
    blockId;

  lyricsBlocksLayer.appendChild(
    lyricsBlock
  );
}

lyricsBlock.style.zIndex =
  String(
    Number(
      block?.position?.z
    ) || 0
  );


/*
 * 歌詞内容や見た目が変更されたかを判定する。
 */
const renderSignature =
  JSON.stringify({
    text:
      block.text ||
      block.lines,

    style:
      block.style,

    position:
      block.position,

    layout:
      block.layout,

    animation:
      block.animation
  });


const previousSignature =
  lyricsBlock.dataset
    .renderSignature || '';


const needsRender =
  isNewBlock ||
  previousSignature !==
    renderSignature;


/*
 * 新規追加、または内容変更時だけ
 * LyricsRendererでDOMを作り直す。
 */
if (needsRender) {
  window.LyricsRenderer.render(
    lyricsBlock,
    block
  );

  lyricsBlock.dataset
    .renderSignature =
      renderSignature;
}


/*
 * INは新しく表示された瞬間だけ実行。
 */
if (isNewBlock) {
  applyLyricsAnimation(
    lyricsBlock,
    block.animation || {}
  );
}


/*
 * HOLDはCSSアニメーションなので、
 * 毎回リセットせず、新規表示・設定変更時だけ適用。
 */
if (isNewBlock || needsRender) {
  window.LyricsAnimationEngine.applyHold(
    lyricsBlock,
    block.animation || {},
    Number(block.elapsedSeconds) || 0
  );
}


/*
 * OUTだけは残り時間が変化するため、
 * Payload受信ごとに更新する。
 */
window.LyricsAnimationEngine.applyOut(
  lyricsBlock,
  block.animation || {},
  Number.isFinite(
    Number(block.remainingSeconds)
  )
    ? Number(block.remainingSeconds)
    : Infinity
);

    });
}


function applyLyricsAnimation(
  targetElement,
  animation = {}
) {
  window.LyricsAnimationEngine
    ?.applyIn(
      targetElement,
      animation
    );
}

function applyLyricsHoldAnimation(
  targetElement,
  animation = {},
  elapsedSeconds = 0
) {
  window.LyricsAnimationEngine
    ?.applyHold(
      targetElement,
      animation,
      elapsedSeconds
    );
}


function applyLyricsOutAnimation(
  targetElement,
  animation = {},
  remainingSeconds = Infinity
) {
  window.LyricsAnimationEngine
    ?.applyOut(
      targetElement,
      animation,
      remainingSeconds
    );
}



function clearLyrics() {
  const layer = document.getElementById('lyricsBlocksLayer');

  if (!layer) return;

  layer.innerHTML = '';
}

function showLyrics() {
  const visualizerCanvas =
    document.getElementById('visualizerCanvas');

  const lyricsLayer =
    document.getElementById('lyricsLayer');

  const lyricsCanvas =
    document.getElementById('lyricsCanvas');

  if (visualizerCanvas) {
    visualizerCanvas.style.display = 'block';
  }

  if (lyricsLayer) {
    lyricsLayer.style.display = 'block';
  }

  if (lyricsCanvas) {
    lyricsCanvas.style.display = 'block';
  }

  resizeVisualizerCanvas();
}

function hideLyrics() {
  const lyricsLayer = document.getElementById('lyricsLayer');
  if (lyricsLayer) lyricsLayer.style.display = 'none';
}




function drawCircleSpectrum() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  spectrumCtx.clearRect(0, 0, width, height);

  if (!visualizerEnabled) {
    requestAnimationFrame(drawCircleSpectrum);
    return;
  }

  drawAurora(width, height);
  drawGodRays(width, height);

  if (window.NORAH_PARTICLE_ENGINE) {
    window.NORAH_PARTICLE_ENGINE.drawBubbles(
      spectrumCtx,
      width,
      height,
      latestVisualizerData
    );

    window.NORAH_PARTICLE_ENGINE.drawStarDust(
      spectrumCtx,
      width,
      height,
      latestVisualizerData
    );

    window.NORAH_PARTICLE_ENGINE.drawShootingStars(
      spectrumCtx,
      width,
      height,
      latestVisualizerData
    );

    window.NORAH_PARTICLE_ENGINE.drawAuroraDust(
      spectrumCtx,
      width,
      height,
      latestVisualizerData
    );
  }

  drawGlowFlash(width, height);
  drawCoverNeonRing(width, height);
  drawNeonParticles(width, height);

  const spectrumPower = effectSettings.spectrum;

  if (spectrumPower <= 0) {
    requestAnimationFrame(drawCircleSpectrum);
    return;
  }

  const bars = latestVisualizerData.bars || [];
  const bass = latestVisualizerData.bass || 0;
  const high = latestVisualizerData.high || 0;
  const master = latestVisualizerData.master || 0;

  const centerX = width / 2;
  const centerY = height * 0.39;

  const isWide = width > height;
  const baseRadius = isWide ? 150 : 125;
  const maxBarLength = isWide ? 72 : 42;
  const bassBoost = isWide ? 18 : 10;
  const barCount = 64;
  const rotation = Date.now() * 0.00008;

  for (let i = 0; i < barCount; i++) {
    const angle = (Math.PI * 2 * i) / barCount - Math.PI / 2 + rotation;
    const level = getSmoothBarLevel(bars, i, barCount, master);
    const pulse = Math.sin(Date.now() * 0.002 + i * 0.35) * 0.18;

    const drawLevel = Math.max(
      0,
      Math.min(
        1,
        Math.pow(level, 0.82) + pulse * high * 0.45
      )
    );

    const innerRadius = baseRadius + 10;
    const outerRadius =
      innerRadius +
      18 +
      drawLevel * maxBarLength * spectrumPower +
      bass * bassBoost;

    const x1 = centerX + Math.cos(angle) * innerRadius;
    const y1 = centerY + Math.sin(angle) * innerRadius;
    const x2 = centerX + Math.cos(angle) * outerRadius;
    const y2 = centerY + Math.sin(angle) * outerRadius;

    const hueShift = i / barCount;
    const alpha = 0.22 + drawLevel * 0.72;

    const spectrumTheme =
      window.NORAH_VISUAL_STATE?.spectrumTheme || "default";

    let color;

    if (spectrumTheme === "ocean") {
      color =
        hueShift < 0.5
          ? `rgba(80, 220, 255, ${alpha})`
          : `rgba(0, 130, 255, ${alpha})`;
    } else if (spectrumTheme === "galaxy") {
      if (hueShift < 0.34) {
        color = `rgba(130, 120, 255, ${alpha})`;
      } else if (hueShift < 0.68) {
        color = `rgba(190, 80, 255, ${alpha})`;
      } else {
        color = `rgba(255, 120, 220, ${alpha})`;
      }
    } else {
      if (hueShift < 0.34) {
        color = `rgba(124, 251, 255, ${alpha})`;
      } else if (hueShift < 0.68) {
        color = `rgba(47, 123, 255, ${alpha})`;
      } else {
        color = `rgba(255, 79, 216, ${alpha})`;
      }
    }

    spectrumCtx.beginPath();
    spectrumCtx.moveTo(x1, y1);
    spectrumCtx.lineTo(x2, y2);
    spectrumCtx.lineWidth = 5 + drawLevel * 6;
    spectrumCtx.lineCap = 'round';
    spectrumCtx.strokeStyle = color;
    spectrumCtx.shadowBlur = 18 + master * 24;
    spectrumCtx.shadowColor = color;
    spectrumCtx.stroke();
  }

  spectrumCtx.shadowBlur = 0;

  requestAnimationFrame(drawCircleSpectrum);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '00:00';

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateVideoTimeDisplay() {
  const bgVideo = document.getElementById('bgVideo');

  if (!bgVideo || bgVideo.style.display !== 'block') return;

  document.getElementById('currentTime').textContent = formatTime(bgVideo.currentTime);
  document.getElementById('durationTime').textContent = formatTime(bgVideo.duration);
}

function startVideoVisualizerLevelLoop() {
  if (!videoAnalyser || !videoAnalyserDataArray) return;

  if (videoVisualizerAnimationId) {
    cancelAnimationFrame(videoVisualizerAnimationId);
  }

  const update = () => {
  videoAnalyser.getByteFrequencyData(videoAnalyserDataArray);

  if (visualizerEnabled) {
    const visualizerData = createVisualizerData(videoAnalyserDataArray);
    applyVisualizerData(visualizerData);
  }

  updateVideoTimeDisplay();

  videoVisualizerAnimationId = requestAnimationFrame(update);
};

  update();
}

function stopVideoVisualizerLevelLoop() {
  if (videoVisualizerAnimationId) {
    cancelAnimationFrame(videoVisualizerAnimationId);
    videoVisualizerAnimationId = null;
  }

  const stage = document.getElementById('stage');
  const bars = document.querySelectorAll('.bar');

  stage.style.setProperty('--bass', 0);
  stage.style.setProperty('--mid', 0);
  stage.style.setProperty('--high', 0);
  stage.style.setProperty('--master', 0);

  bars.forEach(bar => {
    bar.style.setProperty('--bar-level', 0);
  });
}


let visualizerEnabled = true;
let glslEnabled = true;

function setGlslEnabled(enabled) {
  glslEnabled = Boolean(enabled);

  if (window.NORAH_GLSL_ENGINE) {
    window.NORAH_GLSL_ENGINE.setEnabled(glslEnabled);
  }
}

drawCircleSpectrum();

function setVisualizerEnabled(enabled) {
  visualizerEnabled = Boolean(enabled);

  const stage = document.getElementById('stage');

  if (visualizerEnabled) {
    stage.classList.remove('visualizer-off');
  } else {
    stage.classList.add('visualizer-off');

    stage.style.setProperty('--bass', 0);
    stage.style.setProperty('--mid', 0);
    stage.style.setProperty('--high', 0);
    stage.style.setProperty('--master', 0);

    document.querySelectorAll('.bar').forEach(bar => {
      bar.style.setProperty('--bar-level', 0);
    });
  }
}



ipcRenderer.on(
  'visualizer-lyrics-visible',
  (
    event,
    visible
  ) => {
    const lyricsLayer =
      document.getElementById(
        'lyricsLayer'
      );

    if (!lyricsLayer) {
      return;
    }

    lyricsLayer.style.display =
      visible
        ? ''
        : 'none';
  }
);

ipcRenderer.on('visualizer-enabled', (event, enabled) => {
  setVisualizerEnabled(enabled);
});

ipcRenderer.on('visualizer-brand-name', (event, brandName) => {
  const brand = document.getElementById('brand');

  const safeBrandName = String(brandName || '').trim() || 'PARADOX VISUALIZER';

  brand.textContent = safeBrandName;
});


const TEMPLATE_CLASS_NAMES = [
  'template-standard',
  'template-neon-circle',
  'template-minimal',
  'template-lyric-focus',
  'template-dark-club'
];

function setVisualizerTemplate(templateName) {
  const stage = document.getElementById('stage');

  TEMPLATE_CLASS_NAMES.forEach(className => {
    stage.classList.remove(className);
  });

  const safeTemplateName = String(templateName || 'standard').trim();

  if (safeTemplateName === 'neon-circle') {
    stage.classList.add('template-neon-circle');
  } else if (safeTemplateName === 'minimal') {
    stage.classList.add('template-minimal');
  } else if (safeTemplateName === 'lyric-focus') {
    stage.classList.add('template-lyric-focus');
  } else if (safeTemplateName === 'dark-club') {
    stage.classList.add('template-dark-club');
  } else {
    stage.classList.add('template-standard');
  }
}

ipcRenderer.on('visualizer-template', (event, templateName) => {
  setVisualizerTemplate(templateName);
});

ipcRenderer.on('visualizer-effect-settings', (event, settings) => {
  console.log('[Visualizer] effect settings received:', settings);

  if (!settings || typeof settings !== 'object') return;

  effectSettings = {
    spectrum: Number(settings.spectrum ?? 1),
    particles: Number(settings.particles ?? 1),
    aurora: Number(settings.aurora ?? 1),
    glow: Number(settings.glow ?? 1)
  };

  console.log('[Visualizer] effectSettings applied:', effectSettings);
});


let lyricsEditorControlsVisualizer = false;

ipcRenderer.on(
  'visualizer-lyrics',
  (event, lyricsPayload) => {
    const hasBlocks =
      Array.isArray(
        lyricsPayload?.blocks
      );

    const source =
      lyricsPayload?.source ||
      'unknown';

    console.log(
      'VISUALIZER RECEIVED:',
      source,
      hasBlocks
        ? lyricsPayload.blocks.length
        : 1,
      lyricsPayload
    );


    /*
     * Editorから新形式で届いた場合
     */
    if (
      source === 'lyrics-editor' &&
      hasBlocks
    ) {
      lyricsEditorControlsVisualizer =
        true;

      setLyricsBlocks(
        lyricsPayload.blocks
      );

      showLyrics();
      return;
    }


    /*
     * Playerから新形式で届いた場合
     */
    if (
      source === 'player' &&
      hasBlocks
    ) {
      lyricsEditorControlsVisualizer =
        false;

      setLyricsBlocks(
        lyricsPayload.blocks
      );

      showLyrics();
      return;
    }


    /*
     * Editor操作中は、
     * Playerの旧形式で上書きしない。
     */
    if (
      lyricsEditorControlsVisualizer
    ) {
      return;
    }


    /*
     * 歌詞なし
     */
    if (!lyricsPayload) {
      clearLyrics();
      return;
    }


    /*
     * 配列が直接届く旧形式
     */
    if (
      Array.isArray(
        lyricsPayload
      )
    ) {
      setLyricsBlocks(
        lyricsPayload
      );

      showLyrics();
      return;
    }


    /*
     * sourceなしでも
     * blocks形式なら表示する。
     */
    if (
      Array.isArray(
        lyricsPayload.blocks
      )
    ) {
      setLyricsBlocks(
        lyricsPayload.blocks
      );

      showLyrics();
      return;
    }


    /*
     * 後方互換用の単体形式。
     * これは現状INのみ。
     */
    if (
      Array.isArray(
        lyricsPayload.lines
      ) ||
      typeof lyricsPayload.text ===
        'string'
    ) {
      setLyrics(
        lyricsPayload.lines ||
          String(
            lyricsPayload.text || ''
          ).split('\n'),

        lyricsPayload.animation,
        lyricsPayload.style,
        lyricsPayload.position,
        lyricsPayload.layout
      );

      showLyrics();
      return;
    }


    clearLyrics();
  }
);


let currentVisualTheme = 'none';

function applyVisualTheme(theme) {

  if (!theme) return;

  console.log("Theme Apply:", theme);

  currentVisualTheme = theme;

  //--------------------------------------------------
  // GLSL
  //--------------------------------------------------

  if (window.NORAH_GLSL_ENGINE) {
  window.NORAH_GLSL_ENGINE.setShader(
    theme.glsl.shader
  );

  window.NORAH_GLSL_ENGINE.setEnabled(
    theme.glsl.enabled
  );
}

  //--------------------------------------------------
  // Particle
  //--------------------------------------------------

  if (window.NORAH_PARTICLE_ENGINE) {
  window.NORAH_PARTICLE_ENGINE.setPreset(
    theme.particles.enabled
      ? theme.particles.preset
      : "none"
  );
}

  //--------------------------------------------------
  // God Ray
  //--------------------------------------------------

  window.NORAH_VISUAL_STATE.godRayEnabled =
    theme.godRay.enabled;

  //--------------------------------------------------
  // Spectrum
  //--------------------------------------------------

    window.NORAH_VISUAL_STATE.spectrumTheme =
  theme.spectrum.color;

//--------------------------------------------------
// Background
//--------------------------------------------------

if (theme.background?.type === 'image') {
  setBackgroundLayer(theme.background.src);
} else {
  setBackgroundLayer(null);
}

//--------------------------------------------------
// Aurora Motion
//--------------------------------------------------

const bgImage = document.getElementById("bgImage");

if (bgImage) {

    bgImage.classList.remove("theme-aurora");

    if (theme.id === "aurora") {
        bgImage.classList.add("theme-aurora");
    }

}

}


ipcRenderer.on('visual-theme', (event, theme) => {
  console.log('[Visualizer] visual-theme received:', theme);
  applyVisualTheme(theme);
});

ipcRenderer.on('visualizer-time', (event, data) => {

    document.getElementById("currentTime").textContent =
        data.current;

    document.getElementById("durationTime").textContent =
        data.duration;

});

function resizeVisualizerCanvas() {
  const canvas = document.getElementById('visualizerCanvas');
  if (!canvas) return;

  const scale = Math.min(
    window.innerWidth / 1080,
    window.innerHeight / 1920
  );

  canvas.style.setProperty('--visualizer-canvas-scale', String(scale));
}


let videoAudioContext = null;
let videoAnalyser = null;
let videoSourceNode = null;
let videoAnalyserDataArray = null;
let videoVisualizerAnimationId = null;


/* ========================================
   Output Routing Visibility
======================================== */

function setVisualizerSongInfoVisible(
  visible
) {
  const songInfo =
    document.getElementById(
      'songInfo'
    );

  if (!songInfo) {
    console.warn(
      '[Visualizer Routing] #songInfoが見つかりません'
    );

    return;
  }

  songInfo.classList.toggle(
    'output-routing-hidden',
    !Boolean(visible)
  );

  console.log(
    '[Visualizer Routing] Song Info:',
    visible
      ? 'SHOW'
      : 'HIDE'
  );
}


function setVisualizerLyricsVisible(
  visible
) {
  const lyricsLayer =
    document.getElementById(
      'lyricsLayer'
    );

  if (!lyricsLayer) {
    console.warn(
      '[Visualizer Routing] #lyricsLayerが見つかりません'
    );

    return;
  }

  lyricsLayer.classList.toggle(
    'output-routing-hidden',
    !Boolean(visible)
  );

  console.log(
    '[Visualizer Routing] Lyrics:',
    visible
      ? 'SHOW'
      : 'HIDE'
  );
}


ipcRenderer.on(
  'visualizer-song-info-visible',
  (
    event,
    visible
  ) => {
    const songInfo =
      document.getElementById(
        'songInfo'
      );

    if (!songInfo) {
      console.warn(
        '[Visualizer Routing] #songInfoが見つかりません'
      );

      return;
    }

    songInfo.classList.toggle(
      'output-routing-hidden',
      !Boolean(visible)
    );

    console.log(
      '[Visualizer Routing] Song Info:',
      visible ? 'SHOW' : 'HIDE'
    );
  }
);


ipcRenderer.on(
  'visualizer-lyrics-visible',
  (
    event,
    visible
  ) => {
    setVisualizerLyricsVisible(
      visible
    );
  }
);


(function initializePerformanceFlash() {
  if (window.__performanceFlashInitialized) {
    return;
  }

  window.__performanceFlashInitialized = true;

  const { ipcRenderer: performanceIpcRenderer } =
    require('electron');

  const flashLayer =
    document.createElement('div');

  flashLayer.id =
    'performanceFlashLayer';

  Object.assign(flashLayer.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '999999',
    pointerEvents: 'none',
    background: '#ffffff',
    opacity: '0',
    visibility: 'hidden',
    mixBlendMode: 'screen',
    willChange: 'opacity'
  });

  document.body.appendChild(flashLayer);


  /* ========================================
   Performance Mode：White Out Layer
======================================== */

const whiteOutLayer =
  document.createElement('div');

whiteOutLayer.id =
  'performanceWhiteOutLayer';

Object.assign(whiteOutLayer.style, {
  position: 'fixed',
  inset: '0',
  zIndex: '999998',
  pointerEvents: 'none',
  background: '#ffffff',
  opacity: '0',
  visibility: 'hidden',
  mixBlendMode: 'screen',
  willChange: 'opacity'
});

document.body.appendChild(
  whiteOutLayer
);



  const flashAnimationStyle =
  document.createElement('style');

flashAnimationStyle.textContent = `
  @keyframes performanceFlashStrobe {
    0%,
    49.999% {
      opacity: var(--flash-intensity, 1);
    }

    50%,
    100% {
      opacity: 0;
    }
  }
`;

document.head.appendChild(
  flashAnimationStyle
);


/* ========================================
   Performance Mode：shake
======================================== */

const performanceShakeRoot =
  document.getElementById(
    'performanceShakeRoot'
  );


const performanceZoomRoot =
  document.getElementById(
    'performanceZoomRoot'
  );


const performanceSmokeCanvas =
  document.getElementById(
    'performanceSmokeCanvas'
  );

const performanceSmokeContext =
  performanceSmokeCanvas.getContext(
    '2d'
  );



  const flashState = {
    active: false,
    intensity: 1,
    speed: 1,
  };


  const whiteOutState = {
  active: false,
  intensity: 1,
  speed: 1
};


const shakeState = {
  active: false,
  intensity: 10,
  speed: 5,

  currentAnimation: null,
  repeatTimer: null
};


const zoomState = {
  active: false,

  intensity: 8,
  speed: 4,
  duration: 210,

  currentAnimation: null,
  repeatTimer: null
};


const smokeState = {
  active: false,

  density: 5,
  opacity: 0.22,
  speed: 1,
  size: 1,

  particles: [],

  animationId: null,
  lastTimestamp: 0,
  spawnAccumulator: 0,

  canvasWidth: 0,
  canvasHeight: 0
};



function triggerShakeImpact() {
  if (!shakeState.active) {
    return;
  }

  const intensity = shakeState.intensity;

  /*
   * 毎回わずかに方向を変える。
   * 横方向だけの「扉のガタガタ」に見えないよう、
   * 縦・横・回転を組み合わせる。
   */
  const direction =
    Math.random() < 0.5 ? -1 : 1;

  const x1 = intensity * 0.75 * direction;
  const x2 = intensity * -0.55 * direction;
  const x3 = intensity * 0.32 * direction;
  const x4 = intensity * -0.14 * direction;

  const y1 = intensity * -0.65;
  const y2 = intensity * 0.48;
  const y3 = intensity * -0.25;
  const y4 = intensity * 0.1;

  const r1 = intensity * 0.035 * direction;
  const r2 = intensity * -0.025 * direction;
  const r3 = intensity * 0.012 * direction;

  if (shakeState.currentAnimation) {
    shakeState.currentAnimation.cancel();
  }

  shakeState.currentAnimation =
    performanceShakeRoot.animate(
      [
        {
          transform:
            'translate3d(0, 0, 0) rotate(0deg) scale(1.02)',
          offset: 0
        },
        {
          transform:
            `translate3d(${x1}px, ${y1}px, 0)
             rotate(${r1}deg)
             scale(1.025)`,
          offset: 0.16
        },
        {
          transform:
            `translate3d(${x2}px, ${y2}px, 0)
             rotate(${r2}deg)
             scale(1.022)`,
          offset: 0.34
        },
        {
          transform:
            `translate3d(${x3}px, ${y3}px, 0)
             rotate(${r3}deg)
             scale(1.018)`,
          offset: 0.53
        },
        {
          transform:
            `translate3d(${x4}px, ${y4}px, 0)
             rotate(0deg)
             scale(1.01)`,
          offset: 0.74
        },
        {
          transform:
            'translate3d(0, 0, 0) rotate(0deg) scale(1)',
          offset: 1
        }
      ],
      {
        duration: 190,
        easing: 'ease-out',
        fill: 'forwards'
      }
    );

  shakeState.currentAnimation.onfinish = () => {
    shakeState.currentAnimation = null;

    performanceShakeRoot.style.transform =
      'translate3d(0, 0, 0) rotate(0deg) scale(1)';
  };
}


function scheduleNextShakeImpact() {
  if (!shakeState.active) {
    return;
  }

  /*
   * speedが高いほど次の衝撃が早く来る。
   * 衝撃アニメーション終了後に少し静止時間を入れる。
   */
  const interval =
    Math.max(
      260,
      780 - shakeState.speed * 65
    );

  shakeState.repeatTimer =
    setTimeout(() => {
      if (!shakeState.active) {
        return;
      }

      triggerShakeImpact();
      scheduleNextShakeImpact();
    }, interval);
}


function clampShakeValue(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max
  );
}



function activateShake(params = {}) {
  shakeState.intensity = clamp(
    params.intensity ??
      shakeState.intensity ??
      10,
    1,
    24
  );

  shakeState.speed = clamp(
    params.speed ??
      shakeState.speed ??
      5,
    1,
    10
  );

  if (shakeState.active) {
    return;
  }

  shakeState.active = true;

  performanceShakeRoot.style.transition =
    'none';

  performanceShakeRoot.style.transformOrigin =
    'center center';

  /*
   * キーを押した瞬間に1発目を再生
   */
  triggerShakeImpact();

  /*
   * 押し続けている場合のみ次の衝撃を予約
   */
  scheduleNextShakeImpact();

  console.log(
    '[Performance Shake] Activated',
    {
      intensity: shakeState.intensity,
      speed: shakeState.speed
    }
  );
}

function deactivateShake() {
  if (!shakeState.active) {
    return;
  }

  shakeState.active = false;

  if (shakeState.repeatTimer) {
    clearTimeout(
      shakeState.repeatTimer
    );

    shakeState.repeatTimer = null;
  }

  if (shakeState.currentAnimation) {
    shakeState.currentAnimation.cancel();
    shakeState.currentAnimation = null;
  }

  performanceShakeRoot.style.transition =
    'transform 80ms ease-out';

  performanceShakeRoot.style.transform =
    'translate3d(0, 0, 0) rotate(0deg) scale(1)';

  console.log(
    '[Performance Shake] Deactivated'
  );
}

function updateShakeParameters(
  params = {}
) {
  if (
    params.intensity !== undefined
  ) {
    shakeState.intensity =
      clampShakeValue(
        Number(params.intensity),
        0,
        50
      );
  }

  if (params.speed !== undefined) {
    shakeState.speed =
      clampShakeValue(
        Number(params.speed),
        1,
        60
      );
  }
}






  function clamp(value, min, max) {
    return Math.min(
      Math.max(Number(value) || 0, min),
      max
    );
  }

  

  function activateFlash(params = {}) {
  flashState.intensity = clamp(
    params.intensity ?? 1,
    0,
    1
  );

  flashState.speed = clamp(
    params.speed ?? 6,
    0.1,
    20
  );

  flashLayer.style.setProperty(
    '--flash-intensity',
    String(flashState.intensity)
  );

  flashLayer.style.visibility = 'visible';
  flashLayer.style.transition = 'none';

  /*
   * 発動中なら開始位置をリセットせず、
   * 速度と強さだけ更新する。
   */
  if (flashState.active) {
    flashLayer.style.animationDuration =
      `${1 / flashState.speed}s`;

    return;
  }

  flashState.active = true;

  /*
   * 例：
   * speed 8 → 1周期 0.125秒
   */
  flashLayer.style.animation =
    `performanceFlashStrobe ${
      1 / flashState.speed
    }s steps(1, end) infinite`;

  console.log(
    '[Performance Flash] Activated',
    {
      speed: flashState.speed,
      intensity: flashState.intensity
    }
  );
}

  function deactivateFlash() {

    console.log(
    '[Performance Flash] deactivateFlash CALLED'
  );
  
  flashState.active = false;

  /*
   * 現在のアニメーションを停止
   */
  flashLayer.style.animation = 'none';

  /*
   * キーを離した後に軽くフェードアウト
   */
  flashLayer.style.transition =
    'opacity 160ms ease-out';

  flashLayer.style.opacity = '0';

  window.setTimeout(() => {
    if (!flashState.active) {
      flashLayer.style.visibility =
        'hidden';
    }
  }, 180);
}

  function updateFlashParameters(
  params = {}
) {
  if (
    params.intensity !== undefined
  ) {
    flashState.intensity = clamp(
      params.intensity,
      0,
      1
    );

    flashLayer.style.setProperty(
      '--flash-intensity',
      String(flashState.intensity)
    );
  }

  if (params.speed !== undefined) {
    flashState.speed = clamp(
      params.speed,
      0.1,
      20
    );

    if (flashState.active) {
      flashLayer.style.animationDuration =
        `${1 / flashState.speed}s`;
    }
  }
}


function activateWhiteOut(params = {}) {
  whiteOutState.intensity = clamp(
    params.intensity ?? 1,
    0,
    1
  );

  whiteOutState.speed = clamp(
    params.speed ?? 1,
    0.1,
    10
  );

  /*
   * speedが大きいほど、
   * 白くなる時間を短くする
   */
  const fadeInDuration =
    240 / whiteOutState.speed;

  whiteOutState.active = true;

  whiteOutLayer.style.visibility =
    'visible';

  whiteOutLayer.style.transition =
    `opacity ${fadeInDuration}ms ease-out`;

  whiteOutLayer.style.opacity =
    String(whiteOutState.intensity);

  console.log(
    '[Performance White Out] Activated',
    {
      intensity:
        whiteOutState.intensity,
      speed:
        whiteOutState.speed
    }
  );
}


function deactivateWhiteOut() {
  if (!whiteOutState.active) {
    return;
  }

  whiteOutState.active = false;

  const fadeOutDuration =
    320 / whiteOutState.speed;

  whiteOutLayer.style.transition =
    `opacity ${fadeOutDuration}ms ease-in`;

  whiteOutLayer.style.opacity = '0';

  window.setTimeout(() => {
    if (!whiteOutState.active) {
      whiteOutLayer.style.visibility =
        'hidden';
    }
  }, fadeOutDuration + 30);

  console.log(
    '[Performance White Out] Deactivated'
  );
}



function updateWhiteOutParameters(
  params = {}
) {
  if (
    params.intensity !== undefined
  ) {
    whiteOutState.intensity = clamp(
      params.intensity,
      0,
      1
    );

    if (whiteOutState.active) {
      whiteOutLayer.style.opacity =
        String(
          whiteOutState.intensity
        );
    }
  }

  if (params.speed !== undefined) {
    whiteOutState.speed = clamp(
      params.speed,
      0.1,
      10
    );
  }
}



function triggerPunchZoom() {
  if (!zoomState.active) {
    return;
  }

  const intensity =
    zoomState.intensity;

  /*
   * intensity 8の場合：
   * 1.12倍まで一気に拡大
   */
  const peakScale =
    1 + intensity * 0.015;

  /*
   * 少しだけ行き過ぎを戻した位置
   */
  const reboundScale =
    1 + intensity * 0.004;

  if (zoomState.currentAnimation) {
    zoomState.currentAnimation.cancel();
  }

  zoomState.currentAnimation =
    performanceZoomRoot.animate(
      [
        {
          transform: 'scale3d(1, 1, 1)',
          offset: 0
        },
        {
          /*
           * 押した瞬間に一気に前へ飛び出す
           */
          transform:
            `scale3d(
              ${peakScale},
              ${peakScale},
              1
            )`,
          offset: 0.22
        },
        {
          /*
           * 少し強めに戻す
           */
          transform:
            `scale3d(
              ${reboundScale},
              ${reboundScale},
              1
            )`,
          offset: 0.62
        },
        {
          transform: 'scale3d(1, 1, 1)',
          offset: 1
        }
      ],
      {
        duration: zoomState.duration,
        easing:
          'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      }
    );

  zoomState.currentAnimation.onfinish =
    () => {
      zoomState.currentAnimation = null;

      performanceZoomRoot.style.transform =
        'scale3d(1, 1, 1)';
    };
}


function scheduleNextPunchZoom() {
  if (!zoomState.active) {
    return;
  }

  /*
   * speedが高いほど、
   * 次のPunchまでの間隔が短くなる。
   */
  const interval =
    Math.max(
      300,
      900 - zoomState.speed * 80
    );

  zoomState.repeatTimer =
    setTimeout(() => {
      if (!zoomState.active) {
        return;
      }

      triggerPunchZoom();
      scheduleNextPunchZoom();
    }, interval);
}


function activatePunchZoom(
  params = {}
) {
  zoomState.intensity = clamp(
    params.intensity ??
      zoomState.intensity ??
      8,
    1,
    20
  );

  zoomState.speed = clamp(
    params.speed ??
      zoomState.speed ??
      4,
    1,
    10
  );

  zoomState.duration = clamp(
    params.duration ??
      zoomState.duration ??
      210,
    100,
    500
  );

  if (zoomState.active) {
    return;
  }

  zoomState.active = true;

  performanceZoomRoot.style.transition =
    'none';

  performanceZoomRoot.style.transformOrigin =
    'center center';

  /*
   * 押した瞬間に1発目を発動
   */
  triggerPunchZoom();

  /*
   * 押し続けている場合は繰り返す
   */
  scheduleNextPunchZoom();

  console.log(
    '[Performance Punch Zoom] Activated',
    {
      intensity:
        zoomState.intensity,
      speed:
        zoomState.speed,
      duration:
        zoomState.duration
    }
  );
}


function deactivatePunchZoom() {
  if (!zoomState.active) {
    return;
  }

  zoomState.active = false;

  if (zoomState.repeatTimer) {
    clearTimeout(
      zoomState.repeatTimer
    );

    zoomState.repeatTimer = null;
  }

  if (zoomState.currentAnimation) {
    zoomState.currentAnimation.cancel();
    zoomState.currentAnimation = null;
  }

  performanceZoomRoot.style.transition =
    'transform 100ms ease-out';

  performanceZoomRoot.style.transform =
    'scale(1)';

  console.log(
    '[Performance Punch Zoom] Deactivated'
  );
}


function resizePerformanceSmokeCanvas() {
  if (
    !performanceSmokeCanvas ||
    !performanceSmokeContext
  ) {
    return;
  }

  const rect =
    performanceSmokeCanvas
      .getBoundingClientRect();

  const pixelRatio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  smokeState.canvasWidth =
    Math.max(1, rect.width);

  smokeState.canvasHeight =
    Math.max(1, rect.height);

  performanceSmokeCanvas.width =
    Math.round(
      smokeState.canvasWidth *
      pixelRatio
    );

  performanceSmokeCanvas.height =
    Math.round(
      smokeState.canvasHeight *
      pixelRatio
    );

  performanceSmokeContext.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );
}
resizePerformanceSmokeCanvas();
window.addEventListener(
  'resize',
  resizePerformanceSmokeCanvas
);

function createSmokeParticle() {
  const width =
    smokeState.canvasWidth;

  const height =
    smokeState.canvasHeight;

  /*
   * 下側全体から発生させる。
   * 中央付近を少し多めにする。
   */
  const centerBias =
    (
      Math.random() +
      Math.random()
    ) / 2;

  const x =
    width *
    (
      0.08 +
      centerBias * 0.84
    );

  const y =
  height *
  (
    0.82 +
    Math.random() * 0.22
  );

  const baseSize =
    Math.min(width, height) *
    (
      0.09 +
      Math.random() * 0.12
    ) *
    smokeState.size;

  return {
    x,
    y,

    radius:
      baseSize,

    velocityX:
      (
        Math.random() - 0.5
      ) *
      0.18 *
      smokeState.speed,

    velocityY:
      -(
        0.12 +
        Math.random() * 0.2
      ) *
      smokeState.speed,

    growth:
      (
        0.05 +
        Math.random() * 0.08
      ) *
      smokeState.size,

    alpha:
      smokeState.opacity *
      (
        0.55 +
        Math.random() * 0.45
      ),

    life: 0,

    maxLife:
      4200 +
      Math.random() * 2600,

    driftPhase:
      Math.random() *
      Math.PI *
      2,

    driftSpeed:
      0.00035 +
      Math.random() * 0.00045
  };
}


function drawSmokeParticle(
  particle,
  timestamp
) {
  const context =
    performanceSmokeContext;

  const lifeProgress =
    particle.life /
    particle.maxLife;

  /*
   * 発生直後は徐々に見え、
   * 後半で自然に消える。
   */
  const fadeIn =
    Math.min(
      1,
      lifeProgress / 0.18
    );

  const fadeOut =
    Math.max(
      0,
      1 -
      Math.max(
        0,
        lifeProgress - 0.45
      ) / 0.55
    );

  const alpha =
    particle.alpha *
    fadeIn *
    fadeOut;

  if (alpha <= 0) {
    return;
  }

  const drift =
    Math.sin(
      timestamp *
      particle.driftSpeed +
      particle.driftPhase
    ) *
    particle.radius *
    0.12;

  const drawX =
    particle.x +
    drift;

  const gradient =
    context.createRadialGradient(
      drawX,
      particle.y,
      particle.radius * 0.05,

      drawX,
      particle.y,
      particle.radius
    );

  gradient.addColorStop(
    0,
    `rgba(235, 240, 245, ${
      alpha * 0.5
    })`
  );

  gradient.addColorStop(
    0.32,
    `rgba(220, 228, 235, ${
      alpha * 0.32
    })`
  );

  gradient.addColorStop(
    0.68,
    `rgba(205, 215, 225, ${
      alpha * 0.12
    })`
  );

  gradient.addColorStop(
    1,
    'rgba(200, 210, 220, 0)'
  );

  context.fillStyle =
    gradient;

  context.beginPath();

  context.arc(
    drawX,
    particle.y,
    particle.radius,
    0,
    Math.PI * 2
  );

  context.fill();
}


function renderPerformanceSmoke(
  timestamp = 0
) {
  if (!smokeState.lastTimestamp) {
    smokeState.lastTimestamp =
      timestamp;
  }

  const deltaTime =
    Math.min(
      40,
      timestamp -
      smokeState.lastTimestamp
    );

  smokeState.lastTimestamp =
    timestamp;

  const context =
    performanceSmokeContext;

  const width =
    smokeState.canvasWidth;

  const height =
    smokeState.canvasHeight;

  context.clearRect(
    0,
    0,
    width,
    height
  );

  /*
   * active中だけ新しい煙を追加。
   */
  if (smokeState.active) {
    const spawnRate =
      smokeState.density * 0.006;

    smokeState.spawnAccumulator +=
      deltaTime * spawnRate;

    while (
      smokeState.spawnAccumulator >= 1
    ) {
      smokeState.particles.push(
        createSmokeParticle()
      );

      smokeState.spawnAccumulator -= 1;
    }
  }

  smokeState.particles =
    smokeState.particles.filter(
      particle => {
        particle.life +=
          deltaTime;

        particle.x +=
          particle.velocityX *
          deltaTime;

        particle.y +=
          particle.velocityY *
          deltaTime;

        particle.radius +=
          particle.growth *
          deltaTime;

        drawSmokeParticle(
          particle,
          timestamp
        );

        return (
          particle.life <
          particle.maxLife
        );
      }
    );

  /*
   * active中または煙が残っている間は継続。
   */
  if (
    smokeState.active ||
    smokeState.particles.length > 0
  ) {
    smokeState.animationId =
      requestAnimationFrame(
        renderPerformanceSmoke
      );
  } else {
    smokeState.animationId =
      null;

    smokeState.lastTimestamp =
      0;

    context.clearRect(
      0,
      0,
      width,
      height
    );
  }
}


function updateSmokeParameters(
  params = {}
) {
  smokeState.density = clamp(
    params.density ??
      smokeState.density,
    1,
    10
  );

  smokeState.opacity = clamp(
    params.opacity ??
      smokeState.opacity,
    0.05,
    0.6
  );

  smokeState.speed = clamp(
    params.speed ??
      smokeState.speed,
    0.2,
    3
  );

  smokeState.size = clamp(
    params.size ??
      smokeState.size,
    0.5,
    2
  );
}

function activateStageSmoke(
  params = {}
) {
  updateSmokeParameters(
    params
  );

  if (smokeState.active) {
    return;
  }

  smokeState.active = true;

  resizePerformanceSmokeCanvas();

  if (!smokeState.animationId) {
    smokeState.lastTimestamp =
      0;

    smokeState.animationId =
      requestAnimationFrame(
        renderPerformanceSmoke
      );
  }

  console.log(
    '[Performance Stage Smoke] Activated',
    {
      density:
        smokeState.density,
      opacity:
        smokeState.opacity,
      speed:
        smokeState.speed,
      size:
        smokeState.size
    }
  );
}

function deactivateStageSmoke() {
  if (!smokeState.active) {
    return;
  }

  smokeState.active = false;

  smokeState.spawnAccumulator =
    0;

  console.log(
    '[Performance Stage Smoke] Deactivated'
  );
}


  performanceIpcRenderer.on(
  'performance-effect',
  (event, payload) => {
    if (!payload) {
      return;
    }

    if (payload.effect === 'flash') {
      updateFlashParameters(
        payload.params || {}
      );

      if (payload.active) {
        activateFlash(
          payload.params || {}
        );
      } else {
        deactivateFlash();
      }
    }

    if (payload.effect === 'whiteOut') {
      updateWhiteOutParameters(
        payload.params || {}
      );

      if (payload.active) {
        activateWhiteOut(
          payload.params || {}
        );
      } else {
        deactivateWhiteOut();
      }
    }

    if (payload.effect === 'shake') {
      updateShakeParameters(
        payload.params || {}
      );

      if (payload.active) {
        activateShake(
          payload.params || {}
        );
      } else {
        deactivateShake();
      }
    }


    if (
  payload.effect ===
  'punchZoom'
) {
  if (payload.active) {
    activatePunchZoom(
      payload.params ?? {}
    );
  } else {
    deactivatePunchZoom();
  }
}

if (
  payload.effect ===
  'stageSmoke'
) {
  updateSmokeParameters(
    payload.params ?? {}
  );

  if (payload.active) {
    activateStageSmoke(
      payload.params ?? {}
    );
  } else {
    deactivateStageSmoke();
  }
}

    console.log(
  '[Performance Visualizer]',
  'effect:',
  payload.effect,
  'active:',
  payload.active,
  'params:',
  payload.params
);
  }
);

window.PerformanceFlash = {
  activate: activateFlash,
  deactivate: deactivateFlash,
  setParameters: updateFlashParameters
};

window.PerformanceWhiteOut = {
  activate: activateWhiteOut,
  deactivate: deactivateWhiteOut,
  setParameters: updateWhiteOutParameters
};

window.PerformanceShake = {
  activate: activateShake,
  deactivate: deactivateShake,
  setParameters: updateShakeParameters
};

console.log(
  '[Performance Visualizer] Flash, White Out and Shake initialized'
);
})();

