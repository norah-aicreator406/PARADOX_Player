const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

function getBaseDir() {
  if (app.isPackaged) {
    if (process.platform === 'darwin') {
      return path.resolve(path.dirname(app.getPath('exe')), '../../..');
    }

    return path.dirname(app.getPath('exe'));
  }

  return __dirname;
}

function getBackgroundsDir() {
  return path.join(getBaseDir(), 'backgrounds');
}

function getOverlaysDir() {
  return path.join(getBaseDir(), 'overlays');
}

function isImageFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  return [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.gif'
  ].includes(ext);
}

function findCoverImage(artistDir, title) {
  const candidates = [
    `${title}.png`,
    `${title}.jpg`,
    `${title}.jpeg`,
    `${title}.webp`,
    'cover.png',
    'cover.jpg',
    'cover.jpeg',
    'folder.png',
    'folder.jpg'
  ];

  for (const file of candidates) {
    const fullPath = path.join(artistDir, file);

    if (fs.existsSync(fullPath)) {
      return {
        filePath: fullPath,
        fileUrl: pathToFileURL(fullPath).href
      };
    }
  }

  return null;
}

let mainWindow = null;
let visualizerWindow = null;
let lyricsEditorWindow = null;
let currentLyricsEditorData = null;
let currentVisualTheme = null;

const ARTIST_ORDER = [
  'norah',
  'PELL',
  'mOkilatty',
  '夜零羽／YØREIHA',
  '柚季',
  'PARADOX'
];

function getMusicDir() {
  let baseDir;

  if (app.isPackaged) {
    if (process.platform === 'darwin') {
      // mac: xxx.app/Contents/MacOS から .app の外側へ戻る
      baseDir = path.resolve(path.dirname(app.getPath('exe')), '../../..');
    } else {
      // Windows: exe と同じフォルダ
      baseDir = path.dirname(app.getPath('exe'));
    }
  } else {
    // 開発中
    baseDir = __dirname;
  }

  return path.join(baseDir, 'music');
}

function isAudioFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  return [
    '.mp3',
    '.wav',
    '.aif',
    '.aiff',
    '.m4a',
    '.flac'
  ].includes(ext);
}

function isVideoFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  return [
    '.mp4',
    '.mov',
    '.webm'
  ].includes(ext);
}

function isMediaFile(fileName) {
  return isAudioFile(fileName) || isVideoFile(fileName);
}


function openLyricsEditorWindow() {
  if (lyricsEditorWindow && !lyricsEditorWindow.isDestroyed()) {
    lyricsEditorWindow.focus();
    return;
  }

  lyricsEditorWindow = new BrowserWindow({
    width: 520,
    height: 520,
    backgroundColor: '#111111',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  lyricsEditorWindow.loadFile('lyricsEditor.html');
  lyricsEditorWindow.webContents.once('did-finish-load', () => {
  if (currentLyricsEditorData) {
    lyricsEditorWindow.webContents.send('lyrics-editor-data', currentLyricsEditorData);
  }
});

  lyricsEditorWindow.on('closed', () => {
    lyricsEditorWindow = null;
  });
}


function findMatchingVideoFile(artistDir, title) {
  const files = fs.readdirSync(artistDir);

  return files.find(file => {
    const fileTitle = path.basename(file, path.extname(file));
    return fileTitle === title && isVideoFile(file);
  }) || null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

function openVisualizerWindow() {
  if (visualizerWindow && !visualizerWindow.isDestroyed()) {
    visualizerWindow.focus();
    return;
  }

  visualizerWindow = new BrowserWindow({
    width: 540,
    height: 960,
    title: 'PARADOX Visualizer',
    backgroundColor: '#000000',
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  visualizerWindow.loadFile('visualizer.html');

visualizerWindow.webContents.once('did-finish-load', () => {
  if (currentVisualTheme) {
    visualizerWindow.webContents.send('visual-theme', currentVisualTheme);
  }
});

visualizerWindow.setAlwaysOnTop(true);

  visualizerWindow.on('closed', () => {
    visualizerWindow = null;
  });
}

function sendSongToVisualizer(song) {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return;

  visualizerWindow.webContents.send('visualizer-song', song);
}

ipcMain.handle('get-songs', async () => {
  const musicDir = getMusicDir();
  const result = [];

  if (!fs.existsSync(musicDir)) {
    return result;
  }

  const artists = fs.readdirSync(musicDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .sort((a, b) => {
    const indexA = ARTIST_ORDER.indexOf(a);
    const indexB = ARTIST_ORDER.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b, 'ja');
  });

  artists.forEach(artist => {
    const artistDir = path.join(musicDir, artist);

    const songs = fs.readdirSync(artistDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name)
      .filter(file => isMediaFile(file))
      .sort((a, b) => a.localeCompare(b, 'ja'))
      .map(file => {
  const filePath = path.join(artistDir, file);
  const title = path.basename(file, path.extname(file));
  const mediaType = isVideoFile(file) ? 'video' : 'audio';

  const cover = findCoverImage(artistDir, title);

  return {
  artist,
  title,
  fileName: file,
  filePath,
  fileUrl: pathToFileURL(filePath).href,

  coverUrl: cover?.fileUrl || null,

  mediaType,
  hasAudio: mediaType === 'audio',
  hasVideo: mediaType === 'video'
};
});

    result.push({
      artist,
      songs
    });
  });

  return result;
});

ipcMain.handle('get-backgrounds', async () => {
  const backgroundsDir = getBackgroundsDir();

  if (!fs.existsSync(backgroundsDir)) {
    return [];
  }

  return fs.readdirSync(backgroundsDir, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name)
    .filter(file => isImageFile(file))
    .sort((a, b) => a.localeCompare(b, 'ja'))
    .map(file => {
      const filePath = path.join(backgroundsDir, file);

      return {
        name: file,
        filePath,
        fileUrl: pathToFileURL(filePath).href
      };
    });
});

ipcMain.handle('get-overlays', async () => {
  const overlaysDir = getOverlaysDir();

  if (!fs.existsSync(overlaysDir)) {
    return [];
  }

  return fs.readdirSync(overlaysDir, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name)
    .filter(file => isImageFile(file))
    .sort((a, b) => a.localeCompare(b, 'ja'))
    .map(file => {

      const filePath = path.join(overlaysDir, file);

      return {
        name: file,
        fileUrl: pathToFileURL(filePath).href
      };

    });
});

ipcMain.handle('send-background-to-visualizer', async (event, background) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-background', background);
  return true;
});

ipcMain.handle('send-lyrics-to-visualizer', async (event, lyrics) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-lyrics', lyrics);
  return true;
});

ipcMain.handle('send-overlay-to-visualizer', async (event, overlay) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-overlay', overlay);
  return true;
});

ipcMain.handle('send-overlay-layer-settings', async (event, settings) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-overlay-layer-settings', settings);
  return true;
});

ipcMain.handle('send-overlay-layers-to-visualizer', async (event, layers) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-overlay-layers', layers);
  return true;
});

ipcMain.handle('send-overlay2-to-visualizer', async (event, overlay) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-overlay2', overlay);
  return true;
});

ipcMain.handle('copy-text', async (event, text) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('open-visualizer-window', async () => {
  openVisualizerWindow();
  return true;
});

ipcMain.handle('send-song-to-visualizer', async (event, song) => {
  sendSongToVisualizer(song);
  return true;
});

ipcMain.handle('visualizer-video-ended', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('visualizer-video-ended');
  }

  return true;
});

ipcMain.handle('stop-visualizer-video', async () => {
  if (visualizerWindow && !visualizerWindow.isDestroyed()) {
    visualizerWindow.webContents.send('visualizer-stop-video');
  }

  return true;
});

ipcMain.handle('send-visualizer-level', async (event, visualizerData) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-level', visualizerData);
  return true;
});

ipcMain.handle('send-visualizer-time', async (event, timeData) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-time', timeData);
  return true;
});

ipcMain.handle('send-visualizer-enabled', async (event, enabled) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-enabled', enabled);
  return true;
});

ipcMain.handle('send-visualizer-brand-name', async (event, brandName) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-brand-name', brandName);
  return true;
});

ipcMain.handle('send-visualizer-template', async (event, templateName) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-template', templateName);
  return true;
});

ipcMain.handle('send-visual-theme', async (event, theme) => {
  console.log('[Main] send-visual-theme:', theme);

  currentVisualTheme = theme;

  if (!visualizerWindow || visualizerWindow.isDestroyed()) {
    openVisualizerWindow();
    return true;
  }

  if (visualizerWindow.webContents.isLoading()) {
    visualizerWindow.webContents.once('did-finish-load', () => {
      visualizerWindow.webContents.send('visual-theme', currentVisualTheme);
    });

    return true;
  }

  visualizerWindow.webContents.send('visual-theme', currentVisualTheme);

  return true;
});

ipcMain.handle('send-visualizer-effect-settings', async (event, settings) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-effect-settings', settings);
  return true;
});

ipcMain.handle('set-visualizer-aspect-ratio', async (event, ratio) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  if (ratio === '16:9') {
    visualizerWindow.setSize(1280, 720);
  } else {
    visualizerWindow.setSize(540, 960);
  }

  visualizerWindow.webContents.send('visualizer-aspect-ratio', ratio);
  return true;
});

ipcMain.handle('select-overlay-layer-in-player', async (event, layerIndex) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;

  mainWindow.webContents.send('player-overlay-layer-selected', layerIndex);
  return true;
});


ipcMain.handle('update-selected-lyrics-layer', (event, data) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;

  mainWindow.webContents.send('update-selected-lyrics-layer', data);
  return true;
});

ipcMain.handle('open-lyrics-editor-window', (event, data) => {
  currentLyricsEditorData = data || null;
  openLyricsEditorWindow();
});


app.whenReady().then(() => {
  createWindow();
});