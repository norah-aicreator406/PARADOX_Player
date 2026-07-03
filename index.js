const { pathToFileURL } = require('url');


const {
  loadLibrary,
  addSongFromFile,
  ensureLibraryFolders,
  deleteSong
} = require('./libraryStore');
const { ipcRenderer, webUtils } = require('electron');

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
let pendingRegisterFilePath = null;
let pendingPlaylistSongId = null;
let activeLibraryFilter = {
  type: 'all',
  value: null
};
const MAX_QUEUE = 5;
const RECENT_PLAYED_LIMIT = 10;

let libraryTabs = [];

const LIBRARY_TABS_KEY = 'norahStudioLibraryTabs';

const audio = document.getElementById('audioPlayer');
const bottomSeekBar = document.getElementById('bottomSeekBar');
const bottomCurrentTime = document.getElementById('bottomCurrentTime');
const bottomDuration = document.getElementById('bottomDuration');
const bottomPlayPauseButton = document.getElementById('bottomPlayPauseButton');

audio.addEventListener('loadedmetadata', () => {
  if (bottomDuration) {
    bottomDuration.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('timeupdate', () => {
  if (bottomCurrentTime) {
    bottomCurrentTime.textContent = formatTime(audio.currentTime);
  }

  if (bottomSeekBar && Number.isFinite(audio.duration) && audio.duration > 0) {
    bottomSeekBar.value = (audio.currentTime / audio.duration) * 100;
  }
});

audio.addEventListener('play', () => {
  if (bottomPlayPauseButton) {
    bottomPlayPauseButton.textContent = 'Ⅱ';
  }
});

audio.addEventListener('pause', () => {
  if (bottomPlayPauseButton) {
    bottomPlayPauseButton.textContent = '▶';
  }
});

if (bottomSeekBar) {
  bottomSeekBar.addEventListener('input', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

    audio.currentTime = (Number(bottomSeekBar.value) / 100) * audio.duration;
  });
}

if (bottomPlayPauseButton) {
  bottomPlayPauseButton.addEventListener('click', () => {
    if (!audio.src) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });
}
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
  renderLibrarySongs();

  playSong(nextSong, -1);
});

ipcRenderer.on('visualizer-video-ended', () => {
  if (queue.length === 0) return;

  const nextSong = queue.shift();

  renderQueue();
  renderLibrarySongs();

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
  const openVisualEditorButton =
    document.getElementById('openVisualEditorButton');

  if (openVisualEditorButton) {
  openVisualEditorButton.addEventListener('click', () => {
    ipcRenderer.invoke('open-lyrics-editor-window');

  });
}
document.querySelectorAll('input[name="tabCreateType"]').forEach(input => {
  input.addEventListener('change', updateTabCreateFields);
});

  document.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';

  console.log('dragover detected');
});

document.addEventListener('drop', (event) => {
  event.preventDefault();

  console.log('drop detected');

  const droppedFiles = [...event.dataTransfer.files];

  droppedFiles.forEach(file => {
    const filePath = webUtils.getPathForFile(file);

    if (!filePath) return;

    const isAudio =
      filePath.toLowerCase().endsWith('.mp3') ||
      filePath.toLowerCase().endsWith('.wav') ||
      filePath.toLowerCase().endsWith('.flac') ||
      filePath.toLowerCase().endsWith('.m4a');

    if (!isAudio) {
      console.warn('音源ファイルではありません:', filePath);
      return;
    }

    openSongRegisterWizard(filePath);
  });
});

ensureLibraryFolders();
loadLibraryTabs();
renderLibraryTabs();
renderLibrarySongs();
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


function loadLibraryTabs() {
  const saved = localStorage.getItem(LIBRARY_TABS_KEY);

  if (!saved) {
    libraryTabs = [
      {
        id: 'tab_all',
        type: 'filter',
        name: 'すべて',
        filter: { field: 'all', value: null }
      }
    ];
    saveLibraryTabs();
    return;
  }

  try {
    libraryTabs = JSON.parse(saved);
  } catch (error) {
    console.warn('タブ読み込み失敗:', error);
    libraryTabs = [];
  }
}

function saveLibraryTabs() {
  localStorage.setItem(
    LIBRARY_TABS_KEY,
    JSON.stringify(libraryTabs)
  );
}



function renderLibraryTabs() {
  console.log('renderLibraryTabs called', libraryTabs);

  const tabs = document.getElementById('libraryFilterTabs');
  if (!tabs) return;

  tabs.innerHTML = '';

  libraryTabs.forEach(tab => {
    const button = document.createElement('button');
    button.className = 'libraryFilterTab';
    button.textContent = tab.name;
    button.dataset.tabId = tab.id;

    const isActive =
      tab.type === 'playlist'
        ? activeLibraryFilter.type === 'playlist' &&
          activeLibraryFilter.value === tab.id
        : activeLibraryFilter.type === tab.filter?.field &&
          activeLibraryFilter.value === tab.filter?.value;

    if (isActive) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      if (tab.type === 'playlist') {
        activeLibraryFilter = {
          type: 'playlist',
          value: tab.id
        };
      } else {
        activeLibraryFilter = {
          type: tab.filter.field,
          value: tab.filter.value
        };
      }

      renderLibraryTabs();
      renderLibrarySongs();
    });

    button.addEventListener('contextmenu', (event) => {
  event.preventDefault();

  const ok = confirm(`「${tab.name}」を削除しますか？`);

  if (!ok) return;

  libraryTabs = libraryTabs.filter(t => t.id !== tab.id);

  saveLibraryTabs();

  activeLibraryFilter = {
    type: 'all',
    value: null
  };

  renderLibraryTabs();
  renderLibrarySongs();
});

    tabs.appendChild(button);
  });

  const addButton = document.createElement('button');
  addButton.className = 'libraryFilterTab addTabButton';
  addButton.textContent = '+';

  addButton.addEventListener('click', () => {
    console.log('＋ clicked');
    createFilterTab();
  });

  tabs.appendChild(addButton);
}


function renderLibrarySongs() {
  const library = loadLibrary();
  const songsContainer = document.getElementById('songs');

  console.log('Library:', library);

  if (!songsContainer) return;

  songsContainer.innerHTML = '';

  if (!library.length) {
    songsContainer.innerHTML = `
      <div class="emptyLibrary">
        まだ曲が登録されていません。<br>
        音源ファイルをドラッグ＆ドロップして追加してください。
      </div>
    `;
    return;
  }


  let filteredLibrary = [...library];

if (activeLibraryFilter.type === 'favorite') {
  filteredLibrary = filteredLibrary.filter(song => song.favorite);
}

if (activeLibraryFilter.type === 'recent') {
  filteredLibrary = filteredLibrary
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

if (activeLibraryFilter.type === 'artist') {
  filteredLibrary = filteredLibrary.filter(song =>
    song.artist === activeLibraryFilter.value
  );
}

if (activeLibraryFilter.type === 'genre') {
  filteredLibrary = filteredLibrary.filter(song =>
    song.genre === activeLibraryFilter.value
  );
}

if (activeLibraryFilter.type === 'tag') {
  filteredLibrary = filteredLibrary.filter(song =>
    song.tags?.includes(activeLibraryFilter.value)
  );
}


if (activeLibraryFilter.type === 'playlist') {
  const playlist = libraryTabs.find(tab =>
    tab.type === 'playlist' &&
    tab.id === activeLibraryFilter.value
  );

  const songIds = playlist?.songIds || [];

  filteredLibrary = filteredLibrary.filter(song =>
    songIds.includes(song.id)
  );
}


  filteredLibrary.forEach(song => {
    const songElement = document.createElement('div');
    songElement.className = 'librarySongRow';

    songElement.innerHTML = `
  <div
    class="librarySongArtwork"
    style="${song.artworkPath ? `background-image: url('${pathToFileURL(song.artworkPath).href}')` : ''}"
  ></div>

  <div class="librarySongMain">
    <div class="librarySongTitle">${song.title || 'Untitled'}</div>
    <div class="librarySongArtist">${song.artist || '-'}</div>
  </div>


  <div class="librarySongGenre">${song.genre || '-'}</div>

  <button class="libraryPlaylistAddButton" title="プレイリストに追加">
    ＋
  </button>

  <button class="libraryReserveButton">
    予約
  </button>

  <button class="libraryFavoriteButton">
    ${song.favorite ? '♥' : '♡'}
  </button>

  <button class="libraryDeleteButton" title="削除">
    ×
  </button>
`;

const reserveButton = songElement.querySelector('.libraryReserveButton');

if (reserveButton) {
  reserveButton.addEventListener('click', (event) => {
    event.stopPropagation();
    addLibrarySongToQueue(song);
  });
}

const playlistAddButton =
  songElement.querySelector('.libraryPlaylistAddButton');

if (playlistAddButton) {
  playlistAddButton.addEventListener('click', (event) => {
    event.stopPropagation();

    console.log('playlist + clicked:', song.id);

    openPlaylistSelectOverlay(song.id);
  });
}


    songElement.addEventListener('dblclick', () => {
  playLibrarySong(song);
});

const deleteButton = songElement.querySelector('.libraryDeleteButton');

if (deleteButton) {
  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();

    const ok = confirm(`「${song.title}」をライブラリから削除しますか？`);

    if (!ok) return;

    deleteSong(song.id);
    renderLibrarySongs();
  });
}


    songsContainer.appendChild(songElement);
  });
}


function getFileNameWithoutExt(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() || '';
  return fileName.replace(/\.[^/.]+$/, '');
}

function openSongRegisterWizard(filePath) {
  pendingRegisterFilePath = filePath;

  console.log('pendingRegisterFilePath:', pendingRegisterFilePath);

  const overlay = document.getElementById('songRegisterOverlay');
  const titleInput = document.getElementById('registerSongTitle');

  if (!overlay || !titleInput) return;

  titleInput.value = getFileNameWithoutExt(filePath);
  overlay.classList.remove('hidden');
}

const backToLibraryButton =
  document.getElementById('backToLibraryButton');

const openEditorAfterRegisterButton =
  document.getElementById('openEditorAfterRegisterButton');

if (backToLibraryButton) {
  backToLibraryButton.addEventListener('click', () => {
    document.getElementById('songRegisterCompleteOverlay')?.classList.add('hidden');
  });
}

if (openEditorAfterRegisterButton) {
  openEditorAfterRegisterButton.addEventListener('click', () => {
    document.getElementById('songRegisterCompleteOverlay')?.classList.add('hidden');

    ipcRenderer.invoke('open-lyrics-editor-window');
  });
}



const confirmSongRegisterButton =
  document.getElementById('confirmSongRegisterButton');

const cancelSongRegisterButton =
  document.getElementById('cancelSongRegisterButton');

if (confirmSongRegisterButton) {
  confirmSongRegisterButton.addEventListener('click', () => {
    console.log('register pending path:', pendingRegisterFilePath);

    if (!pendingRegisterFilePath) return;

    if (!pendingRegisterFilePath) return;

    const titleInput = document.getElementById('registerSongTitle');
    const artistInput = document.getElementById('registerArtistName');
    const albumInput = document.getElementById('registerAlbumName');
    const genreInput = document.getElementById('registerGenre');
    const tagsInput = document.getElementById('registerTags');
    const favoriteInput = document.getElementById('registerFavorite');
    const lyricsInput = document.getElementById('registerLyricsText');
    const artworkInput = document.getElementById('registerArtworkFile');

let artworkPath = '';

if (artworkInput?.files?.length) {
  artworkPath = webUtils.getPathForFile(artworkInput.files[0]);
}
    const errorMessage = document.getElementById('registerErrorMessage');

    const title = titleInput?.value.trim() || '';
    const artist = artistInput?.value.trim() || '';

    if (!title || !artist) {
      if (errorMessage) {
        errorMessage.textContent = '曲名とアーティスト名は必須です。';
      }
      return;
    }

    const song = addSongFromFile(pendingRegisterFilePath, {
      title,
      artist,
      album: albumInput?.value.trim() || '',
      genre: genreInput?.value.trim() || '',
      tags: tagsInput?.value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean) || [],
      favorite: favoriteInput?.checked || false,
      artworkPath,
      lyricsText: lyricsInput?.value || '',
      blockMode:
        document.querySelector('input[name="registerBlockMode"]:checked')?.value || 'blankLine'
    });

    console.log('Registered song:', song);

pendingRegisterFilePath = null;


if (errorMessage) {
  errorMessage.textContent = '';
}

document.getElementById('songRegisterOverlay')?.classList.add('hidden');

const completeOverlay =
  document.getElementById('songRegisterCompleteOverlay');

if (completeOverlay) {
  completeOverlay.classList.remove('hidden');
} else {
  console.warn('songRegisterCompleteOverlay が見つかりません');
}

renderLibrarySongs();
  });
}

if (cancelSongRegisterButton) {
  cancelSongRegisterButton.addEventListener('click', () => {
    pendingRegisterFilePath = null;

    const errorMessage =
      document.getElementById('registerErrorMessage');

    if (errorMessage) {
      errorMessage.textContent = '';
    }

    document.getElementById('songRegisterOverlay')?.classList.add('hidden');
  });
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
  renderLibrarySongs();
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

function updateBottomPlayer(song) {
  document.getElementById('bottomTitle').textContent =
    song.title || 'Untitled';

  document.getElementById('bottomArtist').textContent =
    song.artist || '-';

  const bottomArtwork = document.getElementById('bottomArtwork');

  if (bottomArtwork) {
    bottomArtwork.style.backgroundImage = song.artworkPath
      ? `url("${pathToFileURL(song.artworkPath).href}")`
      : '';
  }
}

function playLibrarySong(song) {
  if (!song.audioPath) {
    alert('音源ファイルが見つかりません。');
    return;
    updateBottomPlayer(song);
  }

  currentSong = createPlayableLibrarySong(song);

  audio.src = pathToFileURL(song.audioPath).href;
  audio.load();

  audio.play().catch(error => {
    alert('再生できませんでした: ' + error.message);
  });

  document.getElementById('bottomTitle').textContent =
    song.title || 'Untitled';

  document.getElementById('bottomArtist').textContent =
    song.artist || '-';
  
  const bottomArtwork = document.getElementById('bottomArtwork');

if (bottomArtwork) {
  bottomArtwork.style.backgroundImage = song.artworkPath
    ? `url("file://${song.artworkPath.replace(/\\/g, '/')}")`
    : '';
}

  renderLibrarySongs();
}


function createPlayableLibrarySong(song) {
  return {
    ...song,
    fileUrl: pathToFileURL(song.audioPath).href,
    mediaType: 'audio'
  };
}

function addLibrarySongToQueue(song) {
  if (!song.audioPath) {
    alert('音源ファイルが見つかりません。');
    return;
  }

  addToQueue(createPlayableLibrarySong(song));
}

async function playSong(song, songIndex) {
  const text = `♫${song.title} - ${song.artist}`;

  if (!song.fileUrl) {
    alert('ファイルのURLが取得できませんでした。');
    return;
  }

  currentSong = song;
  updateBottomPlayer(song);
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

  renderLibrarySongs();
  return;
}

  await ipcRenderer.invoke('stop-visualizer-video');


  if (!song.fileUrl && song.audioPath) {
  song.fileUrl = pathToFileURL(song.audioPath).href;
}
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

  renderLibrarySongs();
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
if (bottomSeekBar) bottomSeekBar.value = 0;
if (bottomCurrentTime) bottomCurrentTime.textContent = '0:00';
if (bottomPlayPauseButton) bottomPlayPauseButton.textContent = '▶';
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

document.querySelectorAll('.inspectorTab').forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.dataset.inspectorTab;

    document.querySelectorAll('.inspectorTab').forEach(item => {
      item.classList.remove('active');
    });

    document.querySelectorAll('.inspectorPage').forEach(page => {
      page.classList.remove('active');
    });

    button.classList.add('active');

    const targetPage = document.querySelector(
      `.inspectorPage[data-inspector-page="${tabName}"]`
    );

    if (targetPage) {
      targetPage.classList.add('active');
    }
  });
});



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
  renderLibrarySongs();
  openQueueModal();
}

function removeFromQueue(index) {
  queue.splice(index, 1);
  renderQueue();
  renderLibrarySongs();
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
  renderLibrarySongs();
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




document.querySelectorAll('.sideNavItem[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.sideNavItem').forEach(item => {
      item.classList.remove('active');
    });

    document.querySelectorAll('.libraryFilterTab').forEach(tab => {
      tab.classList.remove('active');
    });

    button.classList.add('active');

    activeLibraryFilter = {
      type: button.dataset.filter,
      value: null
    };

    renderLibrarySongs();
  });
});


function createFilterTab() {
  const overlay = document.getElementById('tabCreateOverlay');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  updateTabCreateFields();
}

function updateTabCreateFields() {
  const type =
    document.querySelector('input[name="tabCreateType"]:checked')?.value || 'filter';

  const filterOptions = document.getElementById('filterTabOptions');
  const playlistNote = document.getElementById('playlistTabNote');

  if (filterOptions) {
    filterOptions.style.display = type === 'filter' ? 'block' : 'none';
  }

  if (playlistNote) {
    playlistNote.classList.toggle('hidden', type !== 'playlist');
  }
}

const cancelTabCreateButton =
  document.getElementById('cancelTabCreateButton');

if (cancelTabCreateButton) {
  cancelTabCreateButton.addEventListener('click', () => {
    document.getElementById('tabCreateOverlay')?.classList.add('hidden');
  });
}

const confirmTabCreateButton =
  document.getElementById('confirmTabCreateButton');

if (confirmTabCreateButton) {
  confirmTabCreateButton.addEventListener('click', () => {
    const type =
      document.querySelector('input[name="tabCreateType"]:checked')?.value || 'filter';

    const nameInput = document.getElementById('tabCreateName');
    const fieldInput = document.getElementById('tabCreateFilterField');
    const valueInput = document.getElementById('tabCreateFilterValue');
    const errorMessage = document.getElementById('tabCreateErrorMessage');

    const name = nameInput?.value.trim() || '';
    const field = fieldInput?.value || 'artist';
    const value = valueInput?.value.trim() || '';

    if (!name) {
      if (errorMessage) errorMessage.textContent = 'タブ名を入力してください。';
      return;
    }

    if (type === 'filter' && field !== 'favorite' && !value) {
  if (errorMessage) errorMessage.textContent = '条件を入力してください。';
  return;
}
    const newTab =
  type === 'playlist'
    ? {
        id: `tab_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        type: 'playlist',
        name,
        songIds: []
      }
    : {
        id: `tab_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        type: 'filter',
        name,
        filter: {
          field,
          value: field === 'favorite' ? null : value
        }
      };

    libraryTabs.push(newTab);
    saveLibraryTabs();

    activeLibraryFilter =
  newTab.type === 'playlist'
    ? {
        type: 'playlist',
        value: newTab.id
      }
    : {
        type: newTab.filter.field,
        value: newTab.filter.value
      };

    if (errorMessage) errorMessage.textContent = '';
    if (nameInput) nameInput.value = '';
    if (valueInput) valueInput.value = '';

    document.getElementById('tabCreateOverlay')?.classList.add('hidden');

    renderLibraryTabs();
    renderLibrarySongs();
  });
}



function openPlaylistSelectOverlay(songId) {
  pendingPlaylistSongId = songId;

  const overlay = document.getElementById('playlistSelectOverlay');
  const list = document.getElementById('playlistSelectList');

  console.log('playlist overlay:', overlay);
  console.log('playlist list:', list);

  if (!overlay || !list) {
    alert('playlistSelectOverlay または playlistSelectList が見つかりません');
    return;
  }

  const playlists = libraryTabs.filter(tab => tab.type === 'playlist');

  list.innerHTML = '';

  if (!playlists.length) {
    list.innerHTML = `
      <div class="emptyLibrary">
        プレイリストタブがありません。<br>
        先に＋からプレイリストタブを作成してください。
      </div>
    `;
  } else {
    playlists.forEach(playlist => {
      const button = document.createElement('button');
      button.className = 'playlistSelectItem';
      button.textContent = playlist.name;

      button.addEventListener('click', () => {
        addSongToPlaylistById(pendingPlaylistSongId, playlist.id);
        overlay.classList.add('hidden');
        pendingPlaylistSongId = null;
      });

      list.appendChild(button);
    });
  }

  overlay.classList.remove('hidden');
}

function addSongToPlaylistById(songId, playlistId) {
  const playlist = libraryTabs.find(tab =>
    tab.type === 'playlist' && tab.id === playlistId
  );

  if (!playlist) return;

  if (!playlist.songIds) playlist.songIds = [];

  if (playlist.songIds.includes(songId)) {
    alert('この曲はすでに追加されています。');
    return;
  }

  playlist.songIds.push(songId);
  saveLibraryTabs();

  alert(`「${playlist.name}」に追加しました。`);

  renderLibraryTabs();
  renderLibrarySongs();
}

const cancelPlaylistSelectButton =
  document.getElementById('cancelPlaylistSelectButton');

if (cancelPlaylistSelectButton) {
  cancelPlaylistSelectButton.addEventListener('click', () => {
    pendingPlaylistSongId = null;
    document.getElementById('playlistSelectOverlay')?.classList.add('hidden');
  });
}


function addSongToPlaylist(song, playlistId) {
  const playlist = libraryTabs.find(tab =>
    tab.type === 'playlist' && tab.id === playlistId
  );

  if (!playlist) return;

  if (!playlist.songIds) {
    playlist.songIds = [];
  }

  if (playlist.songIds.includes(song.id)) {
    alert('この曲はすでに追加されています。');
    return;
  }

  playlist.songIds.push(song.id);

  saveLibraryTabs();
  alert(`「${playlist.name}」に追加しました。`);
}