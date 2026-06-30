const { ipcRenderer } = require('electron');

let data = [];
let currentIndex = 0;
let currentSong = null;
let queue = [];
let audioContext = null;
let analyser = null;
let sourceNode = null;
let analyserDataArray = null;
let visualizerAnimationId = null;
let currentFilteredSongs = [];
let currentFilteredSongIndex = -1;
const MAX_QUEUE = 5;
const RECENT_PLAYED_LIMIT = 10;

const audio = document.getElementById('audio');
audio.addEventListener('timeupdate', sendVisualizerTime);
audio.addEventListener('timeupdate', updateLyricsByTime);
audio.addEventListener('loadedmetadata', sendVisualizerTime);
audio.addEventListener('ended', sendVisualizerTime);

const testLyricsBlocks = [
  {
    id: "lyric_001",
    start: 0,
    end: 5,
    lines: ["君の声が", "まだ響いてる"],
    animation: {
      preset: "fade",
      duration: 0.5
    }
  },
  {
    id: "lyric_002",
    start: 5,
    end: 10,
    lines: ["夜空へ", "溶けていく"],
    animation: {
      preset: "slideUp",
      duration: 0.5
    }
  },
  {
    id: "lyric_003",
    start: 10,
    end: 15,
    lines: ["光の海を", "泳いでいく"],
    animation: {
      preset: "fade",
      duration: 0.5
    }
  }
];

let currentLyricsBlockId = null;

function getCurrentLyricsBlock(currentTime) {
  return testLyricsBlocks.find(block => {
    return currentTime >= block.start && currentTime < block.end;
  }) || null;
}

function updateLyricsByTime() {
  const currentBlock = getCurrentLyricsBlock(audio.currentTime);

  if (!currentBlock) {
    if (currentLyricsBlockId !== null) {
      currentLyricsBlockId = null;
      ipcRenderer.invoke('send-lyrics-to-visualizer', null);
    }

    return;
  }

  if (currentLyricsBlockId === currentBlock.id) return;

  currentLyricsBlockId = currentBlock.id;

  ipcRenderer.invoke('send-lyrics-to-visualizer', {
    id: currentBlock.id,
    lines: currentBlock.lines,
    animation: currentBlock.animation
  });
}



function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '00:00';

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function sendVisualizerTime() {
  await ipcRenderer.invoke('send-visualizer-time', {
    current: formatTime(audio.currentTime),
    duration: formatTime(audio.duration)
  });
}

audio.addEventListener('ended', () => {
  if (queue.length === 0) return;

  const nextSong = queue.shift();

  renderQueue();
  renderSongs(currentIndex);

  playSong(nextSong, -1);
});

ipcRenderer.on('visualizer-video-ended', () => {
  if (queue.length === 0) return;

  const nextSong = queue.shift();

  renderQueue();
  renderSongs(currentIndex);

  playSong(nextSong, -1);
});

let isDraggingQueue = false;
let queueOffsetX = 0;
let queueOffsetY = 0;

window.addEventListener('DOMContentLoaded', () => {
  const queueWindow = document.getElementById('queueFloatingWindow');
  const queueHeader = document.getElementById('queueFloatingHeader');

  if (queueWindow && queueHeader) {
    queueHeader.addEventListener('mousedown', (event) => {
      isDraggingQueue = true;
      queueOffsetX = event.clientX - queueWindow.offsetLeft;
      queueOffsetY = event.clientY - queueWindow.offsetTop;
    });

    document.addEventListener('mousemove', (event) => {
      if (!isDraggingQueue) return;

      queueWindow.style.left = `${event.clientX - queueOffsetX}px`;
      queueWindow.style.top = `${event.clientY - queueOffsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDraggingQueue = false;
    });
  }

  loadSongs();
});


function updateStudioHeaderStats() {
  const artistCountLabel = document.getElementById('artistCountLabel');
  const songCountLabel = document.getElementById('songCountLabel');
  const queueCountLabel = document.getElementById('queueCountLabel');

  if (artistCountLabel) {
    artistCountLabel.textContent = data.length;
  }

  if (songCountLabel) {
    songCountLabel.textContent =
      data.reduce((total, artist) => total + artist.songs.length, 0);
  }

  if (queueCountLabel) {
    queueCountLabel.textContent = `${queue.length} / ${MAX_QUEUE}`;
  }
}


async function loadSongs() {
  try {
    document.getElementById('nowPlaying').textContent = 'musicフォルダ読込中...';

   data = await ipcRenderer.invoke('get-songs');

document.getElementById("songCountLabel").textContent =
  data.reduce((total, artist) => total + artist.songs.length, 0);

  updateStudioHeaderStats();

applySavedArtistOrder();

currentIndex = 0;
    currentSong = null;
    currentFilteredSongIndex = -1;
    currentFilteredSongs = [];

    renderTabs();
    renderSongs(0);
    renderQueue();
    renderRandomPanel();
    await loadBackgrounds();
    loadOverlayLayers();
    await loadOverlays();
    renderLayerPanel();
    updateSelectedLayerControls();
    loadVisualizerEnabledSetting();
    loadVisualizerBrandNameSetting();
    loadVisualizerTemplateSetting();
    loadEffectSettings();

    document.getElementById('nowPlaying').textContent = '再生待機中';
  } catch (error) {
    alert('musicフォルダを読み込めませんでした: ' + error.message);
    document.getElementById('nowPlaying').textContent = '読込失敗';
  }
}

function renderTabs() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';

  data.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'tab' + (index === currentIndex ? ' active' : '');
    button.textContent = `${item.artist} (${item.songs.length})`;

    button.draggable = true;
    button.dataset.index = index;

    button.onclick = () => {
      currentIndex = index;
      renderTabs();
      renderSongs(index);
    };

    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', index);
      button.classList.add('dragging');
    });

    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
    });

    button.addEventListener('dragover', (event) => {
  event.preventDefault();
  button.classList.add('drag-over');
});

button.addEventListener('dragleave', () => {
  button.classList.remove('drag-over');
});

    button.addEventListener('drop', (event) => {
      event.preventDefault();
      button.classList.remove('drag-over');

      const fromIndex = Number(event.dataTransfer.getData('text/plain'));
      const toIndex = index;

      if (fromIndex === toIndex) return;

      moveArtistTab(fromIndex, toIndex);
    });

    tabs.appendChild(button);
  });
}
function moveArtistTab(fromIndex, toIndex) {
  const movedItem = data.splice(fromIndex, 1)[0];
  data.splice(toIndex, 0, movedItem);

  if (currentIndex === fromIndex) {
    currentIndex = toIndex;
  } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
    currentIndex--;
  } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
    currentIndex++;
  }

  saveArtistOrder();

  renderTabs();
  renderSongs(currentIndex);
}

function saveArtistOrder() {
  const artistOrder = data.map(item => item.artist);
  localStorage.setItem('paradoxArtistOrder', JSON.stringify(artistOrder));
}

function applySavedArtistOrder() {
  const saved = localStorage.getItem('paradoxArtistOrder');

  if (!saved) return;

  try {
    const artistOrder = JSON.parse(saved);

    data.sort((a, b) => {
      const indexA = artistOrder.indexOf(a.artist);
      const indexB = artistOrder.indexOf(b.artist);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return a.artist.localeCompare(b.artist, 'ja');
    });
  } catch (error) {
    console.warn('タブ順の読み込みに失敗しました:', error);
  }
}

function renderSongs(index) {
  const container = document.getElementById('songs');
  container.innerHTML = '';

  if (!data[index]) {
    container.innerHTML = '<p>musicフォルダ内に曲がありません。</p>';
    currentFilteredSongs = [];
    return;
  }

  const keyword = document
    .getElementById('searchInput')
    .value
    .trim()
    .toLowerCase();

  if (keyword) {
    currentFilteredSongs = [];

    data.forEach(artistData => {
      artistData.songs.forEach(song => {
        const text = `${song.title} ${song.artist}`.toLowerCase();

        if (text.includes(keyword)) {
          currentFilteredSongs.push(song);
        }
      });
    });
  } else {
    currentFilteredSongs = data[index].songs;
  }

  if (currentFilteredSongs.length === 0) {
    container.innerHTML = '<p>該当する曲がありません。</p>';
    return;
  }

  currentFilteredSongs.forEach((song, songIndex) => {
    const text = `♫${song.title} - ${song.artist}`;

    const card = document.createElement('div');
    card.className = 'song';

    if (
      currentSong &&
      currentSong.title === song.title &&
      currentSong.artist === song.artist
    ) {
      card.classList.add('playing');
      currentFilteredSongIndex = songIndex;
    }

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = `${song.mediaType === 'video' ? '🎬 ' : ''}${text}`;

    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const playBtn = document.createElement('button');
    playBtn.className = 'play';
    playBtn.textContent = '▶ 再生';

    playBtn.onclick = () => {
      playSong(song, songIndex);
    };

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy';
    copyBtn.textContent = '📋 コピー';

    copyBtn.onclick = async () => {
      await ipcRenderer.invoke('copy-text', text);
      copyBtn.textContent = 'コピーしました';
      setTimeout(() => copyBtn.textContent = '📋 コピー', 1000);
    };

    const reserveBtn = document.createElement('button');
    reserveBtn.className = 'nav';
    reserveBtn.textContent = '➕ 予約';

    reserveBtn.onclick = () => {
      addToQueue(song);
    };

    buttons.appendChild(playBtn);
    buttons.appendChild(copyBtn);
    buttons.appendChild(reserveBtn);

    card.appendChild(title);
    card.appendChild(buttons);
    container.appendChild(card);
  });
}

async function playSong(song, songIndex) {
  const text = `♫${song.title} - ${song.artist}`;

  if (!song.fileUrl) {
    alert('ファイルのURLが取得できませんでした。');
    return;
  }

  currentSong = song;
  currentFilteredSongIndex = songIndex;

  addRecentPlayedSong(song);

  document.getElementById('nowPlaying').textContent = text;

  if (song.mediaType === 'video') {
  stopVisualizerLevelLoop();

  audio.pause();
  audio.removeAttribute('src');
  audio.load();

  await ipcRenderer.invoke('send-song-to-visualizer', song);
  await ipcRenderer.invoke('copy-text', text);

  renderSongs(currentIndex);
  return;
}

  await ipcRenderer.invoke('stop-visualizer-video');

  audio.src = song.fileUrl;

setupAudioAnalyzer();

if (audioContext.state === 'suspended') {
  await audioContext.resume();
}

audio.play().catch(error => {
  alert('再生できませんでした: ' + error.message);
});

startVisualizerLevelLoop();


  await ipcRenderer.invoke('send-song-to-visualizer', song);
  await ipcRenderer.invoke('send-background-to-visualizer', currentBackground);
  await ipcRenderer.invoke('copy-text', text);

  renderSongs(currentIndex);
}

function setupAudioAnalyzer() {
  if (audioContext && analyser) return;

  audioContext = new AudioContext();

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  analyserDataArray = new Uint8Array(analyser.frequencyBinCount);

  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
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
  // 左：低音 6本。強くなりすぎるのでかなり抑える
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
  // 右：高音 10本。少し跳ねやすくする
  const localIndex = i - 20;
  start = 42 + localIndex * 5;
  end = start + 8;
  sensitivity = 210;
  boost = 1.05;
}

    const raw = averageRange(array, start, end);
const variation = 0.72 + (Math.sin(i * 1.7) + 1) * 0.16;

// 値を少し圧縮して、サビで全部マックスにならないようにする
let value = normalizeAudioValue(raw * boost * variation, sensitivity, 0.9);

// 帯域ごとの最大値をあえて少し制限する
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

function startVisualizerLevelLoop() {

  
  if (!analyser || !analyserDataArray) return;

  if (visualizerAnimationId) {
    cancelAnimationFrame(visualizerAnimationId);
  }

  const update = () => {
    analyser.getByteFrequencyData(analyserDataArray);

   const visualizerData = createVisualizerData(analyserDataArray);
ipcRenderer.invoke('send-visualizer-level', visualizerData);

    visualizerAnimationId = requestAnimationFrame(update);
  };

  update();
}

function stopVisualizerLevelLoop() {
  if (visualizerAnimationId) {
    cancelAnimationFrame(visualizerAnimationId);
    visualizerAnimationId = null;
  }

  ipcRenderer.invoke('send-visualizer-level', 0);
}

async function stopAudio() {
  audio.pause();
  audio.currentTime = 0;

  stopVisualizerLevelLoop();

  await ipcRenderer.invoke('stop-visualizer-video');
}

function playPrevious() {
  if (currentFilteredSongs.length === 0) return;

  const prevIndex =
    currentFilteredSongIndex > 0
      ? currentFilteredSongIndex - 1
      : currentFilteredSongs.length - 1;

  playSong(currentFilteredSongs[prevIndex], prevIndex);
}

function playNext() {
  if (currentFilteredSongs.length === 0) return;

  const nextIndex =
    currentFilteredSongIndex < currentFilteredSongs.length - 1
      ? currentFilteredSongIndex + 1
      : 0;

  playSong(currentFilteredSongs[nextIndex], nextIndex);
}

async function copyCurrent() {
  if (!currentSong) {
    alert('まだ曲が再生されていません。');
    return;
  }

  const text = `♫${currentSong.title} - ${currentSong.artist}`;
  await ipcRenderer.invoke('copy-text', text);
}

async function openVisualizer() {
  await ipcRenderer.invoke('open-visualizer-window');

  await ipcRenderer.invoke('send-visualizer-enabled', visualizerEnabled);
  await ipcRenderer.invoke('send-visualizer-brand-name', visualizerBrandName);
  await ipcRenderer.invoke('send-visualizer-template', visualizerTemplate);

  if (currentSong) {
    await ipcRenderer.invoke('send-song-to-visualizer', currentSong);
  }

  if (currentBackground) {
    await ipcRenderer.invoke('send-background-to-visualizer', currentBackground);
  }

  await sendOverlayLayersToVisualizer();
}

function toggleSettingsPanel() {
  const panel = document.getElementById('settingsPanel');
  if (!panel) return;

  panel.classList.toggle('show');
}

let currentBackground = null;
let visualizerEnabled = true;
let visualizerBrandName = 'PARADOX VISUALIZER';
let visualizerTemplate = 'standard';
let overlayLayers = [
  {
    id: 'layer-1',
    name: 'Layer 1',
    fileUrl: '',
    fileName: '',
    x: 80,
    y: 80,
    width: 180,
    opacity: 1,
    visible: true
  },
  {
    id: 'layer-2',
    name: 'Layer 2',
    fileUrl: '',
    fileName: '',
    x: 25,
    y: 75,
    width: 180,
    opacity: 1,
    visible: true
  }
];

let selectedOverlayLayerIndex = 0;
























async function loadBackgrounds() {
  const select = document.getElementById('backgroundSelect');
  if (!select) return;

  const backgrounds = await ipcRenderer.invoke('get-backgrounds');

  select.innerHTML = '<option value="">背景なし</option>';

  backgrounds.forEach(background => {
    const option = document.createElement('option');
    option.value = background.fileUrl;
    option.textContent = background.name;

    select.appendChild(option);
  });

  applySavedBackground(backgrounds);
}

async function loadOverlays() {
  const select1 = document.getElementById('overlaySelect');
  const select2 = document.getElementById('overlaySelect2');

  const overlays = await ipcRenderer.invoke('get-overlays');

  if (select1) {
    select1.innerHTML = '<option value="">なし</option>';

    overlays.forEach(overlay => {
      const option = document.createElement('option');
      option.value = overlay.fileUrl;
      option.textContent = overlay.name;
      select1.appendChild(option);
    });
  }

  if (select2) {
    select2.innerHTML = '<option value="">なし</option>';

    overlays.forEach(overlay => {
      const option = document.createElement('option');
      option.value = overlay.fileUrl;
      option.textContent = overlay.name;
      select2.appendChild(option);
    });
  }
updateSelectedLayerControls();
renderLayerPanel();
await sendOverlayLayersToVisualizer();

}



function applySavedBackground(backgrounds) {
  const saved = localStorage.getItem('paradoxVisualizerBackground');
  if (!saved) return;

  try {
    const savedBackground = JSON.parse(saved);

    const matchedBackground = backgrounds.find(background => {
      return background.fileUrl === savedBackground.fileUrl;
    });

    if (!matchedBackground) {
      localStorage.removeItem('paradoxVisualizerBackground');
      currentBackground = null;
      return;
    }

    const select = document.getElementById('backgroundSelect');
    select.value = matchedBackground.fileUrl;

    currentBackground = {
      fileUrl: matchedBackground.fileUrl,
      name: matchedBackground.name
    };
  } catch (error) {
    localStorage.removeItem('paradoxVisualizerBackground');
    currentBackground = null;
  }
}

async function changeVisualizerBackground() {
  const select = document.getElementById('backgroundSelect');
  if (!select) return;

  const fileUrl = select.value;
  const name = select.options[select.selectedIndex]?.textContent || '';

  currentBackground = fileUrl
    ? { fileUrl, name }
    : null;

  if (currentBackground) {
    localStorage.setItem('paradoxVisualizerBackground', JSON.stringify(currentBackground));
  } else {
    localStorage.removeItem('paradoxVisualizerBackground');
  }

  await ipcRenderer.invoke('send-background-to-visualizer', currentBackground);
}















function loadVisualizerEnabledSetting() {
  const saved = localStorage.getItem('paradoxVisualizerEnabled');

  if (saved === null) {
    visualizerEnabled = true;
  } else {
    visualizerEnabled = saved === 'true';
  }

  const toggle = document.getElementById('visualizerToggle');
  const label = document.getElementById('visualizerToggleLabel');

  if (toggle) toggle.checked = visualizerEnabled;
  if (label) label.textContent = visualizerEnabled ? 'ON' : 'OFF';
}

async function toggleVisualizerEnabled() {
  const toggle = document.getElementById('visualizerToggle');
  const label = document.getElementById('visualizerToggleLabel');

  visualizerEnabled = toggle ? toggle.checked : true;

  localStorage.setItem('paradoxVisualizerEnabled', String(visualizerEnabled));

  if (label) {
    label.textContent = visualizerEnabled ? 'ON' : 'OFF';
  }

  await ipcRenderer.invoke('send-visualizer-enabled', visualizerEnabled);

  if (!visualizerEnabled) {
    await ipcRenderer.invoke('send-visualizer-level', {
      bass: 0,
      mid: 0,
      high: 0,
      master: 0,
      bars: []
    });
  }
}

function loadVisualizerBrandNameSetting() {
  const saved = localStorage.getItem('paradoxVisualizerBrandName');

  visualizerBrandName = saved || 'PARADOX VISUALIZER';

  const input = document.getElementById('brandNameInput');

  if (input) {
    input.value = saved || '';
    input.placeholder = 'PARADOX VISUALIZER';
  }
}

async function changeVisualizerBrandName() {
  const input = document.getElementById('brandNameInput');

  const value = input ? input.value.trim() : '';
  visualizerBrandName = value || 'PARADOX VISUALIZER';

  if (value) {
    localStorage.setItem('paradoxVisualizerBrandName', value);
  } else {
    localStorage.removeItem('paradoxVisualizerBrandName');
  }

  await ipcRenderer.invoke('send-visualizer-brand-name', visualizerBrandName);
}

function loadVisualizerTemplateSetting() {
  const saved = localStorage.getItem('paradoxVisualizerTemplate');

  visualizerTemplate = saved || 'standard';

  const select = document.getElementById('templateSelect');

  if (select) {
    select.value = visualizerTemplate;
  }
}

async function changeVisualizerTemplate() {
  const select = document.getElementById('templateSelect');

  visualizerTemplate = select ? select.value : 'standard';

  localStorage.setItem('paradoxVisualizerTemplate', visualizerTemplate);

  await ipcRenderer.invoke('send-visualizer-template', visualizerTemplate);
}

function addToQueue(song) {
  if (queue.length >= MAX_QUEUE) {
  alert(`予約キューは最大${MAX_QUEUE}曲までです。`);
  return;
}

  const exists = queue.some(
    item => item.artist === song.artist && item.title === song.title
  );

  if (exists) {
    alert('この曲はすでに予約されています。');
    return;
  }

  queue.push(song);
  renderQueue();
  renderSongs(currentIndex);
  openQueueModal();
}

function removeFromQueue(index) {
  queue.splice(index, 1);
  renderQueue();
  renderSongs(currentIndex);
}

function renderQueue() {
  const queueList = document.getElementById('queueList');
  queueList.innerHTML = '';

  for (let i = 0; i < MAX_QUEUE; i++) {
    const item = queue[i];

    const row = document.createElement('div');
    row.className = 'queueItem';

    const label = document.createElement('div');

    if (item) {
      label.textContent = `${i + 1}. ♫${item.title} - ${item.artist}`;
      label.className = 'queueItemText';

      label.onclick = () => {
        const selectedSong = queue.splice(i, 1)[0];
        renderQueue();
        playSong(selectedSong, -1);
      };
    } else {
      label.textContent = `${i + 1}. 空き`;
      label.style.color = '#666';
    }

    row.appendChild(label);

    if (item) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'queueRemove';
      removeBtn.textContent = '解除';
      removeBtn.onclick = () => removeFromQueue(i);

      row.appendChild(removeBtn);
    }

    queueList.appendChild(row);
  }
updateStudioHeaderStats();

}

function toggleRandomPanel() {
  const panel = document.getElementById('randomPanel');
  panel.classList.toggle('show');
  renderRandomPanel();
}

function renderRandomPanel() {
  const list = document.getElementById('randomArtistList');
  if (!list) return;

  list.innerHTML = '';

  const excludedArtists = getExcludedArtists();

  data.forEach(artistData => {
    const label = document.createElement('label');
    label.className = 'randomArtistItem';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = excludedArtists.includes(artistData.artist);

    checkbox.onchange = () => {
      const currentExcluded = getExcludedArtists();

      let nextExcluded;

      if (checkbox.checked) {
        nextExcluded = [...new Set([...currentExcluded, artistData.artist])];
      } else {
        nextExcluded = currentExcluded.filter(artist => artist !== artistData.artist);
      }

      localStorage.setItem('paradoxRandomExcludedArtists', JSON.stringify(nextExcluded));
    };

    const name = document.createElement('span');
    name.textContent = `${artistData.artist} (${artistData.songs.length})`;

    label.appendChild(checkbox);
    label.appendChild(name);

    list.appendChild(label);
  });
}

function getExcludedArtists() {
  const saved = localStorage.getItem('paradoxRandomExcludedArtists');

  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
}

function clearRandomExclusions() {
  localStorage.removeItem('paradoxRandomExcludedArtists');
  renderRandomPanel();
}

function randomReserve() {
  const remainingSlots = MAX_QUEUE - queue.length;

  if (remainingSlots <= 0) {
    alert(`予約キューはすでに最大${MAX_QUEUE}曲です。`);
    return;
  }

  const excludedArtists = getExcludedArtists();
  const alreadyQueuedArtists = queue.map(song => song.artist);
  const recentPlayedSongs = getRecentPlayedSongs();

  const candidateArtists = data
    .filter(artistData => {
      if (excludedArtists.includes(artistData.artist)) return false;
      if (alreadyQueuedArtists.includes(artistData.artist)) return false;
      if (!artistData.songs || artistData.songs.length === 0) return false;

      return true;
    })
    .map(artistData => {
      const availableSongs = artistData.songs.filter(song => {
        return !recentPlayedSongs.includes(getSongKey(song));
      });

      return {
        artist: artistData.artist,
        songs: availableSongs
      };
    })
    .filter(artistData => artistData.songs.length > 0);

  if (candidateArtists.length === 0) {
    alert(`ランダム予約できる曲がありません。直近${RECENT_PLAYED_LIMIT}曲に含まれる曲は除外されています。`);
    return;
  }

  const shuffledArtists = shuffleArray(candidateArtists);
  const selectedArtists = shuffledArtists.slice(0, remainingSlots);

  selectedArtists.forEach(artistData => {
    const randomSong = getRandomSong(artistData.songs);
    queue.push(randomSong);
  });

  renderQueue();
  renderSongs(currentIndex);
  openQueueModal();

  alert(`${selectedArtists.length}曲をランダム予約しました。`);
}

function getSongKey(song) {
  return `${song.artist}|||${song.title}`;
}

function getRecentPlayedSongs() {
  const saved = localStorage.getItem('paradoxRecentPlayedSongs');

  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
}

function addRecentPlayedSong(song) {
  const key = getSongKey(song);

  let recent = getRecentPlayedSongs();

  recent = recent.filter(item => item !== key);
  recent.unshift(key);

  recent = recent.slice(0, RECENT_PLAYED_LIMIT);

  localStorage.setItem('paradoxRecentPlayedSongs', JSON.stringify(recent));
}

function getRandomSong(songs) {
  const index = Math.floor(Math.random() * songs.length);
  return songs[index];
}

function shuffleArray(array) {
  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temporary = copied[i];

    copied[i] = copied[randomIndex];
    copied[randomIndex] = temporary;
  }

  return copied;
}

function openQueueModal() {
  const win = document.getElementById('queueFloatingWindow');

  if (!win) {
    alert('queueFloatingWindow が見つかりません');
    return;
  }

  win.classList.add('show');
  renderQueue();
}

function closeQueueWindow() {
  document.getElementById('queueFloatingWindow').classList.remove('show');
}

async function changeVisualizerAspectRatio(ratio) {
  await ipcRenderer.invoke('open-visualizer-window');
  await ipcRenderer.invoke('set-visualizer-aspect-ratio', ratio);
}

async function changeEffectSettings() {
  const inputs = document.querySelectorAll('#effectControl input[type="range"]');

  const settings = {
  spectrum: document.getElementById('spectrumEnabled')?.checked
    ? Number(inputs[0].value) / 100
    : 0,

  particles: document.getElementById('particlesEnabled')?.checked
    ? Number(inputs[1].value) / 100
    : 0,

  aurora: document.getElementById('auroraEnabled')?.checked
    ? Number(inputs[2].value) / 100
    : 0,

  glow: document.getElementById('glowEnabled')?.checked
    ? Number(inputs[3].value) / 100
    : 0
};

  await ipcRenderer.invoke('send-visualizer-effect-settings', settings);
  localStorage.setItem('paradoxEffectSettings', JSON.stringify(settings));
}

function loadEffectSettings() {
  const saved = localStorage.getItem('paradoxEffectSettings');
  if (!saved) return;

  try {
    const settings = JSON.parse(saved);
    const inputs = document.querySelectorAll('#effectControl input[type="range"]');

    document.getElementById('spectrumEnabled').checked = settings.spectrum > 0;
    document.getElementById('particlesEnabled').checked = settings.particles > 0;
    document.getElementById('auroraEnabled').checked = settings.aurora > 0;
    document.getElementById('glowEnabled').checked = settings.glow > 0;
  

    inputs[0].value = Math.round((settings.spectrum ?? 1) * 100);
    inputs[1].value = Math.round((settings.particles ?? 1) * 100);
    inputs[2].value = Math.round((settings.aurora ?? 1) * 100);
    inputs[3].value = Math.round((settings.glow ?? 1) * 100);
    

    changeEffectSettings();
  } catch (error) {
    localStorage.removeItem('paradoxEffectSettings');
  }
}



function closeSettingsPanel() {
  const panel = document.getElementById('settingsPanel');
  if (!panel) return;
  panel.classList.remove('show');
}

function switchSettingsTab(tabName) {
  document.querySelectorAll('.settingsTab').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });

  document.querySelectorAll('.settingsPage').forEach(page => {
    page.classList.toggle('active', page.dataset.page === tabName);
  });
}

ipcRenderer.on('update-selected-lyrics-layer', async (event, data) => {
  const layer = overlayLayers[selectedOverlayLayerIndex];

  if (!layer || layer.type !== 'lyrics') return;

  await updateOverlayLayer(selectedOverlayLayerIndex, {
  data: {
    text: data.text,
    size: data.size,
    color: data.color,
    font: data.font,
    outlineColor: data.outlineColor,
    outlineWidth: data.outlineWidth,
    align: data.align,
    shadowColor: data.shadowColor,
    shadowBlur: data.shadowBlur,
    shadowX: data.shadowX,
    shadowY: data.shadowY,
    letterSpacing: data.letterSpacing,
    lineHeight: data.lineHeight
  }
});

  updateSelectedLayerControls();
});

ipcRenderer.on('player-overlay-layer-selected', (event, layerIndex) => {
  if (!overlayLayers[layerIndex]) return;

  selectedOverlayLayerIndex = layerIndex;
  renderLayerPanel();
  updateSelectedLayerControls();
});




let currentVisualTheme = 'none';


function selectVisualTheme(themeName) {
  currentVisualTheme = themeName;

  document
    .querySelectorAll('.themeCard')
    .forEach(card => {
      card.classList.toggle(
        'active',
        card.dataset.theme === themeName
      );
    });

  const theme = window.ThemeManager.get(currentVisualTheme);



console.log(theme);


  sendVisualTheme(theme);
}

async function sendVisualTheme(theme) {
  console.log('[Player] sendVisualTheme:', theme);

  const result = await ipcRenderer.invoke('send-visual-theme', theme);

  console.log('[Player] send-visual-theme result:', result);
}
