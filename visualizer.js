
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

  const coverUrl = song.artworkUrl || song.coverUrl || '';

if (coverUrl) {
  console.log('cover set:', coverUrl);

  coverImage.onload = () => {
    console.log('cover loaded');
  };

  coverImage.onerror = (error) => {
    console.error('cover load failed:', error);
  };

  coverImage.src = coverUrl;
  coverFrame.style.display = 'block';
} else {
  console.log('ジャケットなし');

  coverImage.onload = null;
  coverImage.onerror = null;
  coverImage.removeAttribute('src');
  coverImage.src = '';
  coverFrame.style.display = 'none';
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

function setLyrics(lines, animation = { preset: 'fade', duration: 0.5 }, style = {}, position = { x: 0, y: 0, z: 0 }) {
  const lyricsBlock = document.getElementById('lyricsBlock');
  if (!lyricsBlock) return;

  const scale = getVisualizerScale();

  lyricsBlock.innerHTML = '';

  lyricsBlock.style.position = 'absolute';
  lyricsBlock.style.left = '50%';
  lyricsBlock.style.top = '50%';

  lyricsBlock.style.fontFamily = `"${style.font || 'Arial'}", sans-serif`;
  lyricsBlock.style.fontSize = `${(Number(style.size) || 72) * scale}px`;
  lyricsBlock.style.color = style.color || '#ffffff';
  lyricsBlock.style.textAlign = style.align || 'center';
  lyricsBlock.style.letterSpacing = `${(Number(style.letterSpacing) || 0) * scale}px`;
  lyricsBlock.style.lineHeight = String(style.lineHeight || 1.2);

  lyricsBlock.style.webkitTextStroke =
    `${(Number(style.outlineWidth) || 0) * scale}px ${style.outlineColor || '#000000'}`;

  lyricsBlock.style.textShadow =
    `${(Number(style.shadowX) || 0) * scale}px ${(Number(style.shadowY) || 0) * scale}px ${(Number(style.shadowBlur) || 0) * scale}px ${style.shadowColor || '#000000'}`;

  lyricsBlock.style.transform =
    `translate(-50%, -50%) translate(${(Number(position.x) || 0) * scale}px, ${(Number(position.y) || 0) * scale}px)`;

  const safeLines = Array.isArray(lines) ? lines : [String(lines || '')];

  safeLines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'lyricsLine';
    div.textContent = line;
    lyricsBlock.appendChild(div);
  });

  applyLyricsAnimation(animation);
}


function applyLyricsAnimation(animation = {}) {
  const lyricsBlock = document.getElementById('lyricsBlock');
  if (!lyricsBlock) return;

  const preset = animation.preset || 'fade';
  const duration = Number(animation.duration ?? 0.5);

  lyricsBlock.style.setProperty('--lyrics-motion-duration', `${duration}s`);

  lyricsBlock.classList.remove(
    'lyrics-motion-fade',
    'lyrics-motion-slide-up',
    'lyrics-motion-zoom'
  );

  void lyricsBlock.offsetWidth;

  if (preset === 'slideUp') {
    lyricsBlock.classList.add('lyrics-motion-slide-up');
  } else if (preset === 'zoom') {
    lyricsBlock.classList.add('lyrics-motion-zoom');
  } else {
    lyricsBlock.classList.add('lyrics-motion-fade');
  }
}



function clearLyrics() {
  const lyricsBlock = document.getElementById('lyricsBlock');

  if (!lyricsBlock) return;

  lyricsBlock.innerHTML = '';
  lyricsBlock.style.opacity = '0';
}

function showLyrics() {
  const lyricsLayer = document.getElementById('lyricsLayer');
  const lyricsBlock = document.getElementById('lyricsBlock');

  if (lyricsLayer) {
    lyricsLayer.style.display = 'block';
  }

  if (lyricsBlock) {
    lyricsBlock.style.opacity = '1';
  }
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

ipcRenderer.on('visualizer-lyrics', (event, lyrics) => {
  console.log('🔥 FINAL RECEIVED LYRICS:', JSON.stringify(lyrics, null, 2));

  if (!lyrics) {
    clearLyrics();
    return;
  }

  if (Array.isArray(lyrics.lines)) {
    setLyrics(
      lyrics.lines,
      lyrics.animation,
      lyrics.style,
      lyrics.position
    );
    showLyrics();
  }
});


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

let videoAudioContext = null;
let videoAnalyser = null;
let videoSourceNode = null;
let videoAnalyserDataArray = null;
let videoVisualizerAnimationId = null;
