const { pathToFileURL } = require('url');
const fs = require('fs');

const {
  loadLibrary,
  addSongFromFile,
  ensureLibraryFolders,
  deleteSong,
  updateSong,
  updateSongArtwork
} = require('./libraryStore');
const { ipcRenderer, webUtils } = require('electron');

const LIBRARY_SIDEBAR_COLLAPSED_KEY =
  'norahStudioLibrarySidebarCollapsed';

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
let currentPlaybackList = [];
let currentPlaybackIndex = -1;
let selectedLibrarySong = null;
let selectedSongElement = null;
let activeLibraryFilter = {

  type: 'all',
  value: null
};
const MAX_QUEUE = 5;
const RECENT_PLAYED_LIMIT = 10;


/* ========================================
   Output routing
======================================== */

const OUTPUT_ROUTING_STORAGE_KEY =
  'norahStudioOutputRouting';

const VALID_OUTPUT_DESTINATIONS =
  new Set([
    'visualizer',
    'lyrics',
    'off'
  ]);

let outputRouting = {
  lyrics: 'visualizer',
  songInfo: 'visualizer'
};



let libraryTabs = [];

const LIBRARY_TABS_KEY = 'norahStudioLibraryTabs';

const audio = document.getElementById('audioPlayer');
const bottomSeekBar = document.getElementById('bottomSeekBar');
const bottomCurrentTime = document.getElementById('bottomCurrentTime');
const bottomDuration = document.getElementById('bottomDuration');
const bottomPlayPauseButton = document.getElementById('bottomPlayPauseButton');
const bottomFavoriteButton = document.getElementById('bottomFavoriteButton');



if (bottomFavoriteButton) {
  bottomFavoriteButton.addEventListener('click', () => {
    const targetSong =
      currentSong || selectedLibrarySong;

    if (!targetSong?.id) return;

    toggleSongFavorite(targetSong.id);
  });
}

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

  updateLyricsByTime();
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
audio.addEventListener('loadedmetadata', sendVisualizerTime);
audio.addEventListener('ended', sendVisualizerTime);

let currentLyricsBlocks = [];
let currentLyricsBlockSignature = '';

function parseTimeToSeconds(timeText) {
  if (!timeText) return 0;

  const [minutesPart, secondsPart] = String(timeText).split(':');
  const minutes = Number(minutesPart) || 0;
  const seconds = Number(secondsPart) || 0;

  return minutes * 60 + seconds;
}

function normalizePlayerLyricsAnimation(
  block
) {
  const legacyPreset =
    block?.animationPreset ||
    'fade';

  return {
    in: {
      preset:
        block?.animation
          ?.in?.preset ??
        legacyPreset,

      duration:
        Number(
          block?.animation
            ?.in?.duration ??
          0.5
        )
    },

    hold: {
      preset:
        block?.animation
          ?.hold?.preset ??
        'off',

      speed:
        Number(
          block?.animation
            ?.hold?.speed ??
          1
        ),

      strength:
        Number(
          block?.animation
            ?.hold?.strength ??
          12
        )
    },

    out: {
      preset:
        block?.animation
          ?.out?.preset ??
        'off',

      duration:
        Number(
          block?.animation
            ?.out?.duration ??
          0.5
        )
    }
  };
}


function loadLyricsBlocksFromProject(song) {
  currentLyricsBlocks = [];
  currentLyricsBlockSignature = '';

  if (!song?.projectPath || !fs.existsSync(song.projectPath)) {
    ipcRenderer.invoke('send-lyrics-to-visualizer', null);
    return;
  }

  try {
    const project = JSON.parse(fs.readFileSync(song.projectPath, 'utf-8'));
    const sections = project?.project?.lyrics?.sections || {};

    currentLyricsBlocks =
  Object.values(sections)
    .flat()
    .map(block => ({
      id:
        block.id,

      /*
       * プレーヤー内部では秒数で保持。
       */
      start:
        parseTimeToSeconds(
          block.start
        ),

      end:
        parseTimeToSeconds(
          block.end
        ),

      startText:
        block.start ||
        '00:00.00',

      endText:
        block.end ||
        '00:03.00',

      lines:
        String(
          block.text || ''
        ).split('\n'),

      text:
        block.text || '',

      style:
        block.style || {},

      position:
        block.position || {
          x: 0,
          y: 0,
          z: 0
        },

      layout:
        block.layout || {
          width: 900,
          rotation: 0
        },

      /*
       * 保存されたIN / HOLD / OUTを
       * そのまま読み込む。
       */
      animation:
        normalizePlayerLyricsAnimation(
          block
        )
    }))
    .sort(
      (a, b) =>
        a.start - b.start
    );

    ipcRenderer.invoke('send-lyrics-to-visualizer', null);
  } catch (error) {
    console.warn('project.jsonの歌詞読み込み失敗:', error);
    currentLyricsBlocks = [];
  }
}

function getCurrentLyricsBlocks(currentTime) {
  return currentLyricsBlocks
    .filter(block =>
      currentTime >= block.start &&
      currentTime < block.end
    )
    .sort((a, b) => {
      const zA = Number(a.position?.z) || 0;
      const zB = Number(b.position?.z) || 0;

      return zA - zB;
    });
}

function updateLyricsByTime() {
  const currentTime =
    Number(audio.currentTime) || 0;

  const activeBlocks =
    getCurrentLyricsBlocks(
      currentTime
    );

  const signature =
    activeBlocks
      .map(block => block.id)
      .join('|');


  /*
   * 歌詞がなくなった瞬間だけ
   * Visualizerをクリアする。
   */
  if (activeBlocks.length === 0) {
    if (
      currentLyricsBlockSignature !==
      ''
    ) {
      currentLyricsBlockSignature =
        '';

      ipcRenderer.invoke(
        'send-lyrics-to-visualizer',
        {
          source: 'player',
          blocks: []
        }
      );
    }

    return;
  }


  currentLyricsBlockSignature =
    signature;


  /*
   * Visualizerへ送るPayload。
   *
   * elapsedSeconds：
   * HOLDの位相同期用。
   *
   * remainingSeconds：
   * OUTの進行計算用。
   */
  const payloads =
    activeBlocks.map(block => ({
      id:
        block.id,

      start:
        block.startText,

      end:
        block.endText,

      lines:
        block.lines,

      text:
        block.text,

      style:
        block.style,

      position:
        block.position,

      layout:
        block.layout,

      animation:
        block.animation,

      elapsedSeconds:
        Math.max(
          0,
          currentTime -
            block.start
        ),

      remainingSeconds:
        Math.max(
          0,
          block.end -
            currentTime
        )
    }));


  /*
   * IDが同じでも送信する。
   *
   * HOLDの位相とOUTの残り時間は
   * 再生中ずっと変化するため。
   */
  ipcRenderer.invoke(
    'send-lyrics-to-visualizer',
    {
      source: 'player',
      blocks: payloads
    }
  );
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
  if (queue.length > 0) {
    const nextSong = queue.shift();

    renderQueue();
    renderLibrarySongs();

    playSong(nextSong, -1);
    return;
  }

  playNext();
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
  initializeLibrarySidebarCollapse();

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
    openSelectedSongEditor();
  });
}

const openBottomEditorButton =
  document.getElementById('openBottomEditorButton');

if (openBottomEditorButton) {
  openBottomEditorButton.addEventListener('click', () => {
    openSelectedSongEditor();
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

[
  'inspectorCoverEnabled',
  'inspectorSpectrumEnabled',
  'inspectorSpectrumStrength',
  'inspectorParticlesEnabled',
  'inspectorParticlesStrength',
  'inspectorAuroraEnabled',
  'inspectorAuroraStrength',
  'inspectorGlowEnabled',
  'inspectorGlowStrength'
].forEach(id => {
  const element = document.getElementById(id);

  if (!element) {
    console.warn('Effect control not found:', id);
    return;
  }

  console.log('Effect control connected:', id);

  const handler = () => {
    console.log('Effect control changed:', id);
    sendEffectSettingsToVisualizer();
  };

  element.addEventListener('input', handler);
  element.addEventListener('change', handler);
});

ensureLibraryFolders();
loadLibraryTabs();
renderLibraryTabs();
renderLibrarySongs();

const outputRoutingButton =
  document.getElementById(
    'outputRoutingButton'
  );

const outputRoutingPanel =
  document.getElementById(
    'outputRoutingPanel'
  );

const closeOutputRoutingButton =
  document.getElementById(
    'closeOutputRoutingButton'
  );


outputRoutingButton
  ?.addEventListener(
    'click',
    event => {
      event.stopPropagation();

      toggleOutputRoutingPanel();
    }
  );


closeOutputRoutingButton
  ?.addEventListener(
    'click',
    closeOutputRoutingPanel
  );


document
  .querySelectorAll(
    '.outputRoutingOption'
  )
  .forEach(button => {
    button.addEventListener(
      'click',
      async event => {
        event.stopPropagation();

        const group =
          button.closest(
            '.outputRoutingOptions'
          );

        const componentName =
          group?.dataset
            ?.routingComponent;

        const destination =
          button.dataset
            .routingValue;

        await changeOutputRouting(
          componentName,
          destination
        );
      }
    );
  });

function initializeScreenPanel() {
  const screenButton =
    document.getElementById(
      'screenButton'
    );

  const screenPanel =
    document.getElementById(
      'screenPanel'
    );

  if (!screenButton || !screenPanel) {
    console.error(
      'スクリーンUIが見つかりません',
      {
        screenButton,
        screenPanel
      }
    );

    return;
  }

  screenButton.addEventListener(
    'click',
    () => {
      const isHidden =
        screenPanel.getAttribute(
          'aria-hidden'
        ) === 'true';

      screenPanel.setAttribute(
        'aria-hidden',
        isHidden ? 'false' : 'true'
      );

      screenButton.setAttribute(
        'aria-expanded',
        isHidden ? 'true' : 'false'
      );
    }
  );

  const visualizerScreenOptions =
  document.querySelectorAll(
    'input[name="visualizerScreen"]'
  );


async function restoreVisualizerScreen() {
  try {
    const savedValue =
      await ipcRenderer.invoke(
        'get-visualizer-screen'
      );

    const targetRadio =
      document.querySelector(
        `input[name="visualizerScreen"][value="${savedValue}"]`
      );

    if (targetRadio) {
      targetRadio.checked = true;
    }

    console.log(
      '[Visualizer Screen] restore:',
      savedValue
    );
  } catch (error) {
    console.error(
      '[Visualizer Screen] 復元失敗:',
      error
    );
  }
}


visualizerScreenOptions.forEach(
  (radio) => {
    radio.addEventListener(
      'change',
      async () => {
        if (!radio.checked) {
          return;
        }

        try {
          const result =
            await ipcRenderer.invoke(
              'set-visualizer-screen',
              radio.value
            );

          console.log(
            '[Visualizer Screen] saved:',
            result
          );
        } catch (error) {
          console.error(
            '[Visualizer Screen] 保存失敗:',
            error
          );
        }
      }
    );
  }
);


/*
  起動時に前回値を復元
*/
restoreVisualizerScreen();

  const lyricsScreenOptions =
    document.querySelectorAll(
      'input[name="lyricsScreen"]'
    );

  lyricsScreenOptions.forEach(
    (radio) => {
      radio.addEventListener(
        'change',
        async () => {
          if (!radio.checked) {
            return;
          }

          await ipcRenderer.invoke(
            'set-lyrics-output-screen',
            radio.value
          );
        }
      );
    }
  );
}


const lyricsDestinationOptions =
  document.querySelectorAll(
    'input[name="lyricsDestination"]'
  );

lyricsDestinationOptions.forEach(
  radio => {
    radio.addEventListener(
      'change',
      async () => {
        if (!radio.checked) return;

        await changeOutputRouting(
          'lyrics',
          radio.value
        );
      }
    );
  }
);


const songInfoDestinationOptions =
  document.querySelectorAll(
    'input[name="songInfoDestination"]'
  );

songInfoDestinationOptions.forEach(
  radio => {
    radio.addEventListener(
      'change',
      async () => {
        if (!radio.checked) return;

        await changeOutputRouting(
          'songInfo',
          radio.value
        );
      }
    );
  }
);


async function initializeSongInfoItemControls() {
  const outputTitle =
    document.getElementById('outputTitle');

  const outputArtist =
    document.getElementById('outputArtist');

  const outputTime =
    document.getElementById('outputTime');

  console.log(
    '[Song Info Controls] elements:',
    {
      outputTitle,
      outputArtist,
      outputTime
    }
  );

  if (
    !outputTitle ||
    !outputArtist ||
    !outputTime
  ) {
    console.error(
      '[Song Info Controls] チェックボックスが見つかりません',
      {
        outputTitle: Boolean(outputTitle),
        outputArtist: Boolean(outputArtist),
        outputTime: Boolean(outputTime)
      }
    );

    return;
  }

  async function restoreSongInfoItems() {
  try {
    const items =
      await ipcRenderer.invoke(
        'get-song-info-items'
      );

    console.log(
      '[Song Info Controls] restore:',
      items
    );

    if (
      !items ||
      typeof items !== 'object'
    ) {
      return;
    }

    if (
      typeof items.title === 'boolean'
    ) {
      outputTitle.checked =
        items.title;
    }

    if (
      typeof items.artist === 'boolean'
    ) {
      outputArtist.checked =
        items.artist;
    }

    if (
      typeof items.time === 'boolean'
    ) {
      outputTime.checked =
        items.time;
    }
  } catch (error) {
    console.error(
      '[Song Info Controls] 復元失敗:',
      error
    );
  }
}

async function restoreOutputRouting() {
  try {
    const routing =
      await ipcRenderer.invoke(
        'get-output-routing'
      );

    console.log(
      '[Output Routing] restore:',
      routing
    );

    if (
      !routing ||
      typeof routing !== 'object'
    ) {
      return;
    }


    const lyricsRadio =
  document.querySelector(
    `input[name="lyricsDestination"][value="${routing.lyrics}"]`
  );

if (lyricsRadio) {
  lyricsRadio.checked = true;
}

    const songInfoRadio =
      document.querySelector(
        `input[name="songInfoDestination"][value="${routing.songInfo}"]`
      );

    if (songInfoRadio) {
      songInfoRadio.checked = true;
    }
  } catch (error) {
    console.error(
      '[Output Routing] 復元失敗:',
      error
    );
  }
}


async function updateSongInfoItems() {
  const items = {
    title: outputTitle.checked,
    artist: outputArtist.checked,
    time: outputTime.checked
  };

  console.log(
    '[Song Info Controls] send:',
    items
  );

  try {
    const result =
      await ipcRenderer.invoke(
        'set-song-info-items',
        items
      );

    console.log(
      '[Song Info Controls] result:',
      result
    );
  } catch (error) {
    console.error(
      '[Song Info Controls] IPC送信失敗:',
      error
    );
  }
}


/*
  保存済みのチェック状態を先に復元
*/
await restoreSongInfoItems();


outputTitle.addEventListener(
  'change',
  updateSongInfoItems
);

outputArtist.addEventListener(
  'change',
  updateSongInfoItems
);

outputTime.addEventListener(
  'change',
  updateSongInfoItems
);


await restoreOutputRouting();

console.log(
  '[Song Info Controls] 初期化完了'
);
}



if (
  document.readyState === 'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    initializeScreenPanel
  );
} else {
  initializeScreenPanel();
}

document.addEventListener(
  'click',
  event => {
    if (
      !outputRoutingPanel ||
      !outputRoutingPanel
        .classList
        .contains('show')
    ) {
      return;
    }

    const clickedInsidePanel =
      outputRoutingPanel
        .contains(
          event.target
        );

    const clickedButton =
      outputRoutingButton
        ?.contains(
          event.target
        );

    if (
      !clickedInsidePanel &&
      !clickedButton
    ) {
      closeOutputRoutingPanel();
    }
  }
);




const openLibraryFolderButton =
  document.getElementById(
    'openLibraryFolderButton'
  );


const migrateLibraryButton =
  document.getElementById(
    'migrateLibraryButton'
  );

openLibraryFolderButton
  ?.addEventListener(
    'click',
    openCurrentLibraryFolder
  );


migrateLibraryButton
  ?.addEventListener(
    'click',
    migrateCurrentLibraryFolder
  );


const librarySearchInput =
  document.getElementById('searchInput');

const clearLibrarySearchButton =
  document.getElementById(
    'clearLibrarySearchButton'
  );

librarySearchInput?.addEventListener(
  'input',
  () => {
    renderLibrarySongs();
    updateLibrarySearchClearButton();
  }
);

clearLibrarySearchButton?.addEventListener(
  'click',
  () => {
    if (!librarySearchInput) return;

    librarySearchInput.value = '';
    librarySearchInput.focus();

    renderLibrarySongs();
    updateLibrarySearchClearButton();
  }
);

updateLibrarySearchClearButton();



const studioWorkspace =
  document.getElementById(
    'studioWorkspace'
  );

const collapseLibrarySidebarButton =
  document.getElementById(
    'collapseLibrarySidebarButton'
  );

const expandLibrarySidebarButton =
  document.getElementById(
    'expandLibrarySidebarButton'
  );

function setLibrarySidebarCollapsed(
  collapsed
) {
  if (!studioWorkspace) return;

  studioWorkspace.classList.toggle(
    'librarySidebarCollapsed',
    collapsed
  );

  localStorage.setItem(
    LIBRARY_SIDEBAR_COLLAPSED_KEY,
    String(collapsed)
  );
}

collapseLibrarySidebarButton
  ?.addEventListener(
    'click',
    () => {
      setLibrarySidebarCollapsed(true);
    }
  );

expandLibrarySidebarButton
  ?.addEventListener(
    'click',
    () => {
      setLibrarySidebarCollapsed(false);
    }
  );

const savedSidebarCollapsed =
  localStorage.getItem(
    LIBRARY_SIDEBAR_COLLAPSED_KEY
  ) === 'true';

setLibrarySidebarCollapsed(
  savedSidebarCollapsed
);


initializeOutputRouting();
initializeSongInfoItemControls();
loadEffectSettingsFromStorage();


});



function initializeLibrarySidebarCollapse() {
  const workspace =
    document.getElementById(
      'studioWorkspace'
    );

  const collapseButton =
    document.getElementById(
      'collapseLibrarySidebarButton'
    );

  const expandButton =
    document.getElementById(
      'expandLibrarySidebarButton'
    );

  if (
    !workspace ||
    !collapseButton ||
    !expandButton
  ) {
    console.warn(
      'Library sidebar collapse elements were not found.',
      {
        workspace,
        collapseButton,
        expandButton
      }
    );

    return;
  }

  function setCollapsed(collapsed) {
    workspace.classList.toggle(
      'librarySidebarCollapsed',
      collapsed
    );

    collapseButton.setAttribute(
      'aria-expanded',
      String(!collapsed)
    );

    expandButton.setAttribute(
      'aria-expanded',
      String(!collapsed)
    );

    localStorage.setItem(
      LIBRARY_SIDEBAR_COLLAPSED_KEY,
      String(collapsed)
    );
  }

  collapseButton.addEventListener(
    'click',
    () => {
      setCollapsed(true);
    }
  );

  expandButton.addEventListener(
    'click',
    () => {
      setCollapsed(false);
    }
  );

  const savedCollapsed =
    localStorage.getItem(
      LIBRARY_SIDEBAR_COLLAPSED_KEY
    ) === 'true';

  setCollapsed(savedCollapsed);
}




async function loadSongs() {
  try {
    document.getElementById('nowPlaying').textContent = 'musicフォルダ読込中...';

   data = await ipcRenderer.invoke('get-songs');


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



function toggleSongFavorite(songId) {
  if (!songId) return null;

  const library = loadLibrary();
  const targetSong = library.find(song => song.id === songId);

  if (!targetSong) {
    console.warn('お気に入り対象の曲が見つかりません:', songId);
    return null;
  }

  const updatedSong = updateSong(songId, {
    favorite: !Boolean(targetSong.favorite)
  });

  if (!updatedSong) {
    console.warn('お気に入り状態を保存できませんでした:', songId);
    return null;
  }

  // インスペクタで選択している曲も最新状態へ更新
  if (selectedLibrarySong?.id === updatedSong.id) {
    selectedLibrarySong = updatedSong;
    updateSongInspector(updatedSong);
  }

  // 再生中の曲も最新状態へ更新
  if (currentSong?.id === updatedSong.id) {
    currentSong = createPlayableLibrarySong(updatedSong);
    updateBottomPlayer(currentSong);
  }

  renderLibrarySongs();

  return updatedSong;
}



function renderLibrarySongs() {
  const library = loadLibrary();
  const songsContainer = document.getElementById('songs');

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
  const searchKeyword =
  document
    .getElementById('searchInput')
    ?.value
    .trim()
    .toLowerCase() || '';

if (searchKeyword) {
  filteredLibrary =
    filteredLibrary.filter(song => {
      const searchableText = [
        song.title,
        song.artist,
        song.album,
        song.genre,
        ...(Array.isArray(song.tags)
          ? song.tags
          : String(song.tags || '').split(','))
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(
        searchKeyword
      );
    });
}

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

currentPlaybackList = filteredLibrary.map(song =>
  createPlayableLibrarySong(song)
);
  filteredLibrary.forEach((song, songIndex) => {
    
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

  <button
  class="libraryFavoriteButton ${song.favorite ? 'isFavorite' : ''}"
  title="${song.favorite ? 'お気に入りから解除' : 'お気に入りに追加'}"
  aria-pressed="${song.favorite ? 'true' : 'false'}"
  type="button"
>
  ${song.favorite ? '♥' : '♡'}
</button>

  <button class="libraryDeleteButton" title="削除">
    ×
  </button>
`;


const favoriteButton =
  songElement.querySelector('.libraryFavoriteButton');

if (favoriteButton) {
  favoriteButton.addEventListener('click', event => {
    event.stopPropagation();

    toggleSongFavorite(song.id);
  });
}


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


  songElement.addEventListener(
  'click',
  () => {
    if (selectedSongElement) {
      selectedSongElement
        .classList
        .remove('selected');
    }

    selectedSongElement =
      songElement;

    songElement
      .classList
      .add('selected');

    selectedLibrarySong =
      song;

    /*
      右側インスペクターを更新
    */
    updateSongInspector(song);

    
  }
);


songElement.addEventListener(
  'dblclick',
  () => {
    playLibrarySong(
      song,
      songIndex
    );
  }
);

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

const bottomFavoriteButton =
  document.getElementById('bottomFavoriteButton');

if (bottomFavoriteButton) {
  const isFavorite = Boolean(song.favorite);

  bottomFavoriteButton.textContent =
    isFavorite ? '♥' : '♡';

  bottomFavoriteButton.classList.toggle(
    'isFavorite',
    isFavorite
  );

  bottomFavoriteButton.setAttribute(
    'aria-pressed',
    String(isFavorite)
  );

  bottomFavoriteButton.title =
    isFavorite
      ? 'お気に入りから解除'
      : 'お気に入りに追加';
}
}

function updateSongInspector(song) {
  selectedLibrarySong = song;

  const artwork = document.querySelector('.songInfoArtwork');
  const title = document.querySelector('.songInfoTitle');
  const artist = document.querySelector('.songInfoArtist');

  if (artwork) {
    artwork.style.backgroundImage = song.artworkPath
      ? `url("${pathToFileURL(song.artworkPath).href}")`
      : '';
  }

  if (title) title.textContent = song.title || 'Untitled';
  if (artist) {
    artist.textContent = [
      song.artist || '-',
      song.genre || '',
      song.tags?.length ? song.tags.join(', ') : ''
    ].filter(Boolean).join(' / ');
  }

  const titleInput = document.getElementById('editSongTitle');
  const artistInput = document.getElementById('editSongArtist');
  const albumInput = document.getElementById('editSongAlbum');
  const genreInput = document.getElementById('editSongGenre');
  const tagsInput = document.getElementById('editSongTags');
  const favoriteInput = document.getElementById('editSongFavorite');

  if (titleInput) titleInput.value = song.title || '';
  if (artistInput) artistInput.value = song.artist || '';
  if (albumInput) albumInput.value = song.album || '';
  if (genreInput) genreInput.value = song.genre || '';
  if (tagsInput) tagsInput.value = song.tags?.join(', ') || '';
  if (favoriteInput) favoriteInput.checked = !!song.favorite;

  loadEffectSettingsFromProject(song);
}

async function playLibrarySong(song, songIndex = -1) {
  const playableSong = createPlayableLibrarySong(song);
  
  loadLyricsBlocksFromProject(playableSong);

  currentPlaybackIndex =
  songIndex >= 0
    ? songIndex
    : currentPlaybackList.findIndex(item => item.id === song.id);

  console.log('★★★★★ playLibrarySong START ★★★★★');
  console.log(playableSong);

  currentSong = playableSong;
  updateBottomPlayer(playableSong);

  audio.src = playableSong.fileUrl;
  audio.load();

  setupAudioAnalyzer();

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  audio.play().catch(error => {
    alert('再生できませんでした: ' + error.message);
  });

  startVisualizerLevelLoop();

  await ipcRenderer.invoke('send-song-to-visualizer', playableSong);

  console.log('★★★★★ send-song finished ★★★★★');

  if (currentBackground) {
    await ipcRenderer.invoke('send-background-to-visualizer', currentBackground);
  }

  await sendOverlayLayersToVisualizer();

  renderLibrarySongs();
  updateSongInspector(playableSong);
}


function createPlayableLibrarySong(song) {
  return {
    ...song,
    fileUrl: pathToFileURL(song.audioPath).href,
    artworkUrl: song.artworkPath
      ? pathToFileURL(song.artworkPath).href
      : '',
    mediaType: 'audio'
  };
}

function loadLibrarySongIntoBottomPlayer(
  song,
  songIndex = -1
) {
  if (!song?.id || !song.audioPath) {
    return;
  }

  const playableSong =
    createPlayableLibrarySong(song);

  currentSong = playableSong;

  currentPlaybackIndex =
    songIndex >= 0
      ? songIndex
      : currentPlaybackList.findIndex(
          item => item.id === song.id
        );

  /*
    下部Playerの表示を更新
    タイトル・アーティスト・ジャケット・お気に入り
  */
  updateBottomPlayer(playableSong);

  /*
    再生ボタンを押したらすぐ再生できるよう、
    音源だけ読み込んでおく。
  */
  if (audio.src !== playableSong.fileUrl) {
    audio.src = playableSong.fileUrl;
    audio.load();
  }

  /*
    歌詞プロジェクトも先に読み込む。
  */
  loadLyricsBlocksFromProject(
    playableSong
  );
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
  loadLyricsBlocksFromProject(song);
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
  if (!currentPlaybackList.length) return;

  const prevIndex =
    currentPlaybackIndex > 0
      ? currentPlaybackIndex - 1
      : currentPlaybackList.length - 1;

  currentPlaybackIndex = prevIndex;
  playSong(currentPlaybackList[prevIndex], prevIndex);
}

function playNext() {
  if (!currentPlaybackList.length) return;

  const nextIndex =
    currentPlaybackIndex < currentPlaybackList.length - 1
      ? currentPlaybackIndex + 1
      : 0;

  currentPlaybackIndex = nextIndex;
  playSong(currentPlaybackList[nextIndex], nextIndex);
}

async function copyCurrent() {
  if (!currentSong) {
    alert('まだ曲が再生されていません。');
    return;
  }

  const text = `♫${currentSong.title} - ${currentSong.artist}`;
  await ipcRenderer.invoke('copy-text', text);
}


async function openLyricsOutput() {
  try {
    await ipcRenderer.invoke('open-lyrics-output-window');
  } catch (error) {
    console.error('Lyrics Outputを開けませんでした:', error);
  }
}

function normalizeOutputRouting(
  routing
) {
  return {
    lyrics:
      VALID_OUTPUT_DESTINATIONS.has(
        routing?.lyrics
      )
        ? routing.lyrics
        : 'visualizer',

    songInfo:
      VALID_OUTPUT_DESTINATIONS.has(
        routing?.songInfo
      )
        ? routing.songInfo
        : 'visualizer'
  };
}


function loadOutputRoutingFromStorage() {
  const saved =
    localStorage.getItem(
      OUTPUT_ROUTING_STORAGE_KEY
    );

  if (!saved) {
    return {
      lyrics: 'visualizer',
      songInfo: 'visualizer'
    };
  }

  try {
    return normalizeOutputRouting(
      JSON.parse(saved)
    );
  } catch (error) {
    console.warn(
      'Output Routingの読込に失敗:',
      error
    );

    localStorage.removeItem(
      OUTPUT_ROUTING_STORAGE_KEY
    );

    return {
      lyrics: 'visualizer',
      songInfo: 'visualizer'
    };
  }
}


function saveOutputRoutingToStorage() {
  localStorage.setItem(
    OUTPUT_ROUTING_STORAGE_KEY,
    JSON.stringify(
      outputRouting
    )
  );
}


function updateOutputRoutingUI() {
  document
    .querySelectorAll(
      '.outputRoutingOptions'
    )
    .forEach(group => {
      const componentName =
        group.dataset
          .routingComponent;

      const currentValue =
        outputRouting[
          componentName
        ];

      group
        .querySelectorAll(
          '.outputRoutingOption'
        )
        .forEach(button => {
          button.classList.toggle(
            'active',
            button.dataset
              .routingValue ===
              currentValue
          );
        });
    });
}


async function sendOutputRoutingToMain() {
  try {
    const result =
      await ipcRenderer.invoke(
        'set-output-routing',
        outputRouting
      );

    outputRouting =
      normalizeOutputRouting(
        result
      );

    saveOutputRoutingToStorage();
    updateOutputRoutingUI();

    return true;
  } catch (error) {
    console.error(
      'Output Routingの送信に失敗:',
      error
    );

    return false;
  }
}


async function changeOutputRouting(
  componentName,
  destination
) {
  if (
    componentName !== 'lyrics' &&
    componentName !== 'songInfo'
  ) {
    return;
  }

  if (
    !VALID_OUTPUT_DESTINATIONS.has(
      destination
    )
  ) {
    return;
  }

  outputRouting = {
    ...outputRouting,

    [componentName]:
      destination
  };

  saveOutputRoutingToStorage();
  updateOutputRoutingUI();

  await sendOutputRoutingToMain();
}


function openOutputRoutingPanel() {
  const panel =
    document.getElementById(
      'outputRoutingPanel'
    );

  const button =
    document.getElementById(
      'outputRoutingButton'
    );

  if (!panel) {
    return;
  }

  panel.classList.add(
    'show'
  );

  panel.setAttribute(
    'aria-hidden',
    'false'
  );

  button?.classList.add(
    'active'
  );

  button?.setAttribute(
    'aria-expanded',
    'true'
  );
}


function closeOutputRoutingPanel() {
  const panel =
    document.getElementById(
      'outputRoutingPanel'
    );

  const button =
    document.getElementById(
      'outputRoutingButton'
    );

  if (!panel) {
    return;
  }

  panel.classList.remove(
    'show'
  );

  panel.setAttribute(
    'aria-hidden',
    'true'
  );

  button?.classList.remove(
    'active'
  );

  button?.setAttribute(
    'aria-expanded',
    'false'
  );
}


function toggleOutputRoutingPanel() {
  const panel =
    document.getElementById(
      'outputRoutingPanel'
    );

  if (!panel) {
    return;
  }

  if (
    panel.classList.contains(
      'show'
    )
  ) {
    closeOutputRoutingPanel();
  } else {
    openOutputRoutingPanel();
  }
}


async function initializeOutputRouting() {
  outputRouting =
    loadOutputRoutingFromStorage();

  /*
   * Main Processが再起動した場合でも
   * Player側の保存値を復元する。
   */
  await sendOutputRoutingToMain();

  updateOutputRoutingUI();
}

async function toggleSettingsPanel() {
  const panel =
    document.getElementById(
      'settingsPanel'
    );

  if (!panel) {
    return;
  }

  const willOpen =
    !panel.classList.contains(
      'show'
    );

  panel.classList.toggle(
    'show'
  );

  panel.setAttribute(
    'aria-hidden',
    String(!willOpen)
  );

  if (willOpen) {
    await refreshLibrarySettingsDisplay();
  }
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

}

function toggleRandomPanel() {
  const panel = document.getElementById('randomPanel');
  panel.classList.toggle('show');
  renderRandomPanel();
}

function renderRandomPanel() {
  const list = document.getElementById('randomArtistList');
  console.log('renderRandomPanel list:', list);
  console.log('renderRandomPanel data:', data);

  if (!list) return;

  list.innerHTML = '';

  const excludedArtists = getExcludedArtists();
  console.log('excludedArtists:', excludedArtists);

  data.forEach(artistData => {
    const label = document.createElement('label');
    label.className = 'randomArtistItem';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = excludedArtists.includes(artistData.artist);

    checkbox.onchange = () => {
      console.log(
        'checkbox changed:',
        artistData.artist,
        checkbox.checked
      );

      const currentExcluded = getExcludedArtists();

      let nextExcluded;

      if (checkbox.checked) {
        nextExcluded = [
          ...new Set([
            ...currentExcluded,
            artistData.artist
          ])
        ];
      } else {
        nextExcluded =
          currentExcluded.filter(
            artist =>
              artist !== artistData.artist
          );
      }

      console.log(
        'saving excluded artists:',
        nextExcluded
      );

      localStorage.setItem(
        'paradoxRandomExcludedArtists',
        JSON.stringify(nextExcluded)
      );
    };

    const name = document.createElement('span');
    name.textContent =
      `${artistData.artist} (${artistData.songs.length})`;

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

function getEffectValue(enabledId, strengthId) {
  const enabled = document.getElementById(enabledId)?.checked;
  const slider = document.getElementById(strengthId);

  if (!enabled || !slider) return 0;

  const raw = Number(slider.value);
  const max = Number(slider.max || 1);

  return max > 1 ? raw / max : raw;
}

function collectEffectSettings() {
  return {

    cover:
      document.getElementById(
        'inspectorCoverEnabled'
      )?.checked
        ? 1
        : 0,

    spectrum: getEffectValue(
      'inspectorSpectrumEnabled',
      'inspectorSpectrumStrength'
    ),

    particles: getEffectValue(
      'inspectorParticlesEnabled',
      'inspectorParticlesStrength'
    ),

    aurora: getEffectValue(
      'inspectorAuroraEnabled',
      'inspectorAuroraStrength'
    ),

    glow: getEffectValue(
      'inspectorGlowEnabled',
      'inspectorGlowStrength'
    )
  };
}



function closeSettingsPanel() {
  const panel =
    document.getElementById(
      'settingsPanel'
    );

  if (!panel) {
    return;
  }

  panel.classList.remove(
    'show'
  );

  panel.setAttribute(
    'aria-hidden',
    'true'
  );
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


function saveSongInspectorEdit() {
  if (!selectedLibrarySong) {
    alert('曲が選択されていません。');
    return;
  }

  const title = document.getElementById('editSongTitle')?.value.trim() || '';
  const artist = document.getElementById('editSongArtist')?.value.trim() || '';

  if (!title || !artist) {
    alert('曲名とアーティスト名は必須です。');
    return;
  }

  const artworkInput = document.getElementById('editSongArtwork');

let nextArtworkPath = selectedLibrarySong.artworkPath || '';

if (artworkInput?.files?.length) {
  nextArtworkPath = webUtils.getPathForFile(artworkInput.files[0]);
}

  const updatedSong = updateSong(selectedLibrarySong.id, {
    title,
    artist,
    album: document.getElementById('editSongAlbum')?.value.trim() || '',
    genre: document.getElementById('editSongGenre')?.value.trim() || '',
    tags:
      document.getElementById('editSongTags')?.value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean) || [],
    favorite: document.getElementById('editSongFavorite')?.checked || false
  });

let finalUpdatedSong = updatedSong;

if (artworkInput?.files?.length) {
  const selectedArtworkPath = webUtils.getPathForFile(artworkInput.files[0]);
  finalUpdatedSong = updateSongArtwork(updatedSong.id, selectedArtworkPath);
  artworkInput.value = '';
}

  if (!updatedSong) {
    alert('保存に失敗しました。');
    return;
  }

  selectedLibrarySong = finalUpdatedSong;

  if (currentSong?.id === finalUpdatedSong.id) {
    currentSong = createPlayableLibrarySong(finalUpdatedSong);
    updateBottomPlayer(currentSong);
    ipcRenderer.invoke('send-song-to-visualizer', currentSong);
  }

  renderLibrarySongs();
  updateSongInspector(finalUpdatedSong);

  alert('曲情報を保存しました。');

  saveCurrentEffectSettingsToProject(finalUpdatedSong);
}

async function copySelectedSongTitle() {
  if (!selectedLibrarySong) return;
  await ipcRenderer.invoke('copy-text', selectedLibrarySong.title || '');
}

async function copySelectedSongFullName() {
  if (!selectedLibrarySong) return;

  await ipcRenderer.invoke(
    'copy-text',
    `${selectedLibrarySong.title || ''} - ${selectedLibrarySong.artist || ''}`
  );
}

const openSongEditorButton =
  document.getElementById('openSongEditorButton');

if (openSongEditorButton) {
  openSongEditorButton.addEventListener('click', () => {
    console.log('Editor button clicked');
    openSelectedSongEditor();
  });
}

async function openSelectedSongEditor() {
  console.log('openSelectedSongEditor');
  console.log('selectedLibrarySong:', selectedLibrarySong);
  console.log('currentSong:', currentSong);

  const targetSong = selectedLibrarySong || currentSong;

  if (!targetSong) {
    alert('曲が選択されていません。');
    return;
  }

  await ipcRenderer.invoke('open-lyrics-editor-window', {
    songId: targetSong.id,
    title: targetSong.title,
    artist: targetSong.artist,
    audioPath: targetSong.audioPath,
    artworkPath: targetSong.artworkPath,
    projectPath: targetSong.projectPath
  });
}



async function sendEffectSettingsToVisualizer() {
  const settings = collectEffectSettings();

  console.log('Effect settings send:', settings);

  await ipcRenderer.invoke(
    'send-visualizer-effect-settings',
    settings
  );

  localStorage.setItem(
    'paradoxEffectSettings',
    JSON.stringify(settings)
  );

  saveCurrentEffectSettingsToProject();
}

function saveCurrentEffectSettingsToProject(song = selectedLibrarySong) {
  if (!song?.projectPath || !fs.existsSync(song.projectPath)) return;

  const project = JSON.parse(fs.readFileSync(song.projectPath, 'utf-8'));

  if (!project.project) project.project = {};

  project.project.effects = collectEffectSettings();
  project.updatedAt = new Date().toISOString();

  fs.writeFileSync(
    song.projectPath,
    JSON.stringify(project, null, 2),
    'utf-8'
  );

  console.log('Effect settings saved to project:', project.project.effects);
}


function applyEffectSettingsToInspector(
  settings = {}
) {
  const values = {
    cover:
      settings.cover ?? 1,

    spectrum:
      settings.spectrum ?? 1,

    particles:
      settings.particles ?? 1,

    aurora:
      settings.aurora ?? 1,

    glow:
      settings.glow ?? 1
  };

  const coverEnabled =
    document.getElementById(
      'inspectorCoverEnabled'
    );

  if (coverEnabled) {
    coverEnabled.checked =
      Number(values.cover) > 0;
  }

  setEffectControl(
    'inspectorSpectrumEnabled',
    'inspectorSpectrumStrength',
    values.spectrum
  );

  setEffectControl(
    'inspectorParticlesEnabled',
    'inspectorParticlesStrength',
    values.particles
  );

  setEffectControl(
    'inspectorAuroraEnabled',
    'inspectorAuroraStrength',
    values.aurora
  );

  setEffectControl(
    'inspectorGlowEnabled',
    'inspectorGlowStrength',
    values.glow
  );

  sendEffectSettingsToVisualizer();
}

function loadEffectSettingsFromStorage() {
  try {
    const saved =
      localStorage.getItem(
        'paradoxEffectSettings'
      );

    if (!saved) {
      applyEffectSettingsToInspector();
      return;
    }

    const settings =
      JSON.parse(saved);

    applyEffectSettingsToInspector(
      settings
    );

    console.log(
      '[Effect Settings] restored:',
      settings
    );
  } catch (error) {
    console.warn(
      '[Effect Settings] restore failed:',
      error
    );

    applyEffectSettingsToInspector();
  }
}




function setEffectControl(enabledId, strengthId, value) {
  const enabled = document.getElementById(enabledId);
  const strength = document.getElementById(strengthId);

  if (!enabled || !strength) return;

  enabled.checked = Number(value) > 0;
  strength.value = String(Number(value) || 0);
}


function loadEffectSettingsFromProject(song) {
  if (
  !song?.projectPath ||
  !fs.existsSync(song.projectPath)
) {
  loadEffectSettingsFromStorage();
  return;
}

  try {
    const project = JSON.parse(fs.readFileSync(song.projectPath, 'utf-8'));
    const settings = project?.project?.effects;

    applyEffectSettingsToInspector(settings || {});
  } catch (error) {
    console.warn('Effect settings load failed:', error);
    loadEffectSettingsFromStorage();
  }
}


async function getCurrentLibraryRootPath() {
  try {
    const result =
      await ipcRenderer.invoke(
        'get-library-root-path'
      );

    if (!result?.success) {
      console.warn(
        'ライブラリ保存先を取得できません:',
        result?.message
      );

      return '';
    }

    return result.path || '';
  } catch (error) {
    console.error(
      'ライブラリ保存先取得IPCに失敗しました:',
      error
    );

    return '';
  }
}


async function openCurrentLibraryFolder() {
  try {
    const result =
      await ipcRenderer.invoke(
        'open-library-root-folder'
      );

    if (!result?.success) {
      alert(
        result?.message ||
        'ライブラリフォルダを開けませんでした。'
      );
    }
  } catch (error) {
    console.error(
      'ライブラリフォルダを開く処理に失敗しました:',
      error
    );

    alert(
      'ライブラリフォルダを開けませんでした。'
    );
  }
}


async function selectExistingLibraryFolder() {
  try {
    const result =
      await ipcRenderer.invoke(
        'select-existing-library-folder'
      );

    if (result?.canceled) {
      return;
    }

    if (!result?.success) {
      alert(
        result?.message ||
        '選択したフォルダは使用できません。'
      );

      return;
    }

    const ok = confirm(
      [
        'ライブラリを切り替えました。',
        '',
        `変更前：${result.previousPath || '-'}`,
        `変更後：${result.path || '-'}`,
        '',
        '画面を再読み込みします。'
      ].join('\n')
    );

    if (!ok) {
      /*
        この時点ですでに保存先設定は変更されているため、
        キャンセルしても次回起動時には新しい保存先になる。
        ここでは再読み込みだけを保留する。
      */
      return;
    }

    await ipcRenderer.invoke(
      'reload-main-window'
    );
  } catch (error) {
    console.error(
      'ライブラリ切り替え処理に失敗しました:',
      error
    );

    alert(
      'ライブラリを切り替えられませんでした。'
    );
  }
}



async function migrateCurrentLibraryFolder() {
  const currentPath =
    await getCurrentLibraryRootPath();

  const confirmed = confirm(
    [
      '現在のライブラリを新しい保存先へコピーします。',
      '',
      `現在の保存先：`,
      currentPath || '-',
      '',
      '・元のライブラリは削除されません',
      '・コピー完了後に新しい保存先へ切り替わります',
      '・曲数が多い場合は時間がかかります',
      '',
      '移行を開始しますか？'
    ].join('\n')
  );

  if (!confirmed) {
    return;
  }

  try {
    const result =
      await ipcRenderer.invoke(
        'migrate-library-folder'
      );

    if (result?.canceled) {
      return;
    }

    if (!result?.success) {
      alert(
        [
          'ライブラリを移行できませんでした。',
          '',
          result?.message || ''
        ]
          .filter(Boolean)
          .join('\n')
      );

      return;
    }

    alert(
      [
        'ライブラリの移行が完了しました。',
        '',
        `変更前：`,
        result.previousPath || '-',
        '',
        `変更後：`,
        result.path || '-',
        '',
        '元のライブラリは削除されていません。',
        '画面を再読み込みします。'
      ].join('\n')
    );

    await ipcRenderer.invoke(
      'reload-main-window'
    );
  } catch (error) {
    console.error(
      'ライブラリ移行IPCに失敗しました:',
      error
    );

    alert(
      'ライブラリを移行できませんでした。'
    );
  }
}


document.addEventListener('click', event => {
  const openButton =
    event.target.closest(
      '[data-open-settings]'
    );

  if (openButton) {
    event.preventDefault();
    event.stopPropagation();

    const panel =
      document.getElementById(
        'settingsPanel'
      );

    console.log(
      '設定ボタン押下:',
      {
        openButton,
        panel
      }
    );

    if (!panel) {
      console.error(
        '#settingsPanel が見つかりません'
      );

      alert(
        '設定パネルが見つかりません。'
      );

      return;
    }

    panel.classList.toggle('show');

const isSettingsOpen =
  panel.classList.contains('show');

panel.setAttribute(
  'aria-hidden',
  String(!isSettingsOpen)
);

if (isSettingsOpen) {
  refreshLibrarySettingsDisplay();
}

console.log(
  'settingsPanel classes:',
  panel.className
);

return;
  }

  const closeButton =
    event.target.closest(
      '[data-close-settings]'
    );

  if (closeButton) {
    event.preventDefault();
    event.stopPropagation();

   const panel =
  document.getElementById(
    'settingsPanel'
  );

panel?.classList.remove('show');
panel?.setAttribute('aria-hidden', 'true');
  }
});


async function refreshLibrarySettingsDisplay() {
  const pathDisplay =
    document.getElementById(
      'libraryRootPathDisplay'
    );

  const status =
    document.getElementById(
      'librarySettingsStatus'
    );

  if (pathDisplay) {
    pathDisplay.textContent =
      '読み込み中...';

    pathDisplay.title = '';
  }

  if (status) {
    status.textContent = '';
    status.classList.remove(
      'error'
    );
  }

  try {
    const libraryRoot =
      await getCurrentLibraryRootPath();

    if (!libraryRoot) {
      if (pathDisplay) {
        pathDisplay.textContent =
          '保存先を取得できませんでした。';
      }

      if (status) {
        status.textContent =
          'ライブラリ保存先の取得に失敗しました。';

        status.classList.add(
          'error'
        );
      }

      return;
    }

    if (pathDisplay) {
      pathDisplay.textContent =
        libraryRoot;

      pathDisplay.title =
        libraryRoot;
    }
  } catch (error) {
    console.error(
      'ライブラリ設定表示の更新に失敗しました:',
      error
    );

    if (pathDisplay) {
      pathDisplay.textContent =
        '保存先を取得できませんでした。';
    }

    if (status) {
      status.textContent =
        'ライブラリ情報を読み込めませんでした。';

      status.classList.add(
        'error'
      );
    }
  }
}


function updateLibrarySearchClearButton() {
  const input =
    document.getElementById('searchInput');

  const clearButton =
    document.getElementById(
      'clearLibrarySearchButton'
    );

  if (!input || !clearButton) return;

  clearButton.classList.toggle(
    'show',
    input.value.trim().length > 0
  );
}

function isTypingTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable === true
  );
}




