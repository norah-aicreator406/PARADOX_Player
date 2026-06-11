const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
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

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
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
      .filter(file => isAudioFile(file))
      .sort((a, b) => a.localeCompare(b, 'ja'))
      .map(file => {
        const filePath = path.join(artistDir, file);
        const title = path.basename(file, path.extname(file));

        return {
          artist,
          title,
          fileName: file,
          filePath,
          fileUrl: pathToFileURL(filePath).href,
          hasAudio: true
        };
      });

    result.push({
      artist,
      songs
    });
  });

  return result;
});

ipcMain.handle('copy-text', async (event, text) => {
  clipboard.writeText(text);
  return true;
});

app.whenReady().then(() => {
  createWindow();
});