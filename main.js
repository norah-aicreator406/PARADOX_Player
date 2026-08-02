console.log('[Main] 起動ファイル:', __filename);


const {
  app,
  BrowserWindow,
  ipcMain,
  clipboard,
  dialog,
  shell
} = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const { ipcRenderer } = require("electron");

const FontService = require("./FontService");

const {
  getLibraryRootPath,
  setLibraryRootPath,
  validateLibraryFolder,
  ensureLibraryFolders,
  migrateLibraryTo
} = require('./libraryStore');

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
let lyricsOutputWindow = null;
let lyricsEditorWindow = null;

let currentLyricsEditorData = null;
let currentVisualTheme = null;
let currentVisualizerScreen = 'off';


/*
  Lyrics Outputを後から開いた場合でも、
  現在の歌詞と再生情報を復元するためのキャッシュ
*/
let currentLyricsOutputData = null;
let currentLyricsOutputTime = {
  current: '00:00',
  duration: '00:00'
};

let currentLyricsOutputSong = null;
let currentLyricsOutputAspectRatio = '9:16';

/*
  出力先ルーティング

  visualizer:
    Visualizer Outputに表示

  lyrics:
    Lyrics Outputに表示

  off:
    どちらにも表示しない
*/
let currentOutputRouting = {
  lyrics: 'visualizer',
  songInfo: 'visualizer'
};

let currentSongInfoItems = {
  title: true,
  artist: true,
  time: true
};


const DEFAULT_SONG_INFO_EDITOR_SETTINGS = {
  visible: true,

  title: '',

  artist: '',

  showTitle: true,

  showArtist: true,

  showTime: true,

  positionByRatio: {
    '16:9': {
      x: 0,
      y: 0
    },

    '9:16': {
      x: 0,
      y: 0
    }
  }
};


let currentSongInfoEditorSettings = {
  ...DEFAULT_SONG_INFO_EDITOR_SETTINGS,

  positionByRatio: {
    '16:9': {
      ...DEFAULT_SONG_INFO_EDITOR_SETTINGS
        .positionByRatio['16:9']
    },

    '9:16': {
      ...DEFAULT_SONG_INFO_EDITOR_SETTINGS
        .positionByRatio['9:16']
    }
  }
};


/*
  Song Info設定ファイルの保存場所
*/
function getSongInfoSettingsFilePath() {
  return path.join(
    app.getPath('userData'),
    'song-info-settings.json'
  );
}


/*
  保存済みのSong Info設定を読み込む
*/
function loadSongInfoEditorSettings() {
  const filePath =
    getSongInfoSettingsFilePath();

  try {
    if (!fs.existsSync(filePath)) {
      console.log(
        '[Song Info] 保存済み設定なし。初期値を使用します。'
      );

      return;
    }

    const fileText =
      fs.readFileSync(
        filePath,
        'utf8'
      );

    const savedData =
      JSON.parse(fileText);

    if (
      !savedData ||
      typeof savedData !== 'object'
    ) {
      console.warn(
        '[Song Info] 保存データが不正なため初期値を使用します。'
      );

      return;
    }

    /*
      旧保存形式との互換性を残す。

      旧形式:
        Song Info設定そのもの

      新形式:
        {
          editorSettings: {...},
          items: {...}
        }
    */
    const savedSettings =
      savedData.editorSettings &&
      typeof savedData.editorSettings ===
        'object'
        ? savedData.editorSettings
        : savedData;

    const savedItems =
      savedData.items &&
      typeof savedData.items === 'object'
        ? savedData.items
        : null;


      const savedOutputRouting =
  savedData.outputRouting &&
  typeof savedData.outputRouting === 'object'
    ? savedData.outputRouting
    : null;

    currentSongInfoEditorSettings = {
      ...DEFAULT_SONG_INFO_EDITOR_SETTINGS,
      ...savedSettings,

      positionByRatio: {
        '16:9': {
          ...DEFAULT_SONG_INFO_EDITOR_SETTINGS
            .positionByRatio['16:9'],

          ...savedSettings
            .positionByRatio?.['16:9']
        },

        '9:16': {
          ...DEFAULT_SONG_INFO_EDITOR_SETTINGS
            .positionByRatio['9:16'],

          ...savedSettings
            .positionByRatio?.['9:16']
        }
      }
    };

    if (savedItems) {
      currentSongInfoItems = {
        title:
          typeof savedItems.title ===
          'boolean'
            ? savedItems.title
            : currentSongInfoItems.title,

        artist:
          typeof savedItems.artist ===
          'boolean'
            ? savedItems.artist
            : currentSongInfoItems.artist,

        time:
          typeof savedItems.time ===
          'boolean'
            ? savedItems.time
            : currentSongInfoItems.time
      };
    }

    if (savedOutputRouting) {
  const validDestinations = [
    'off',
    'visualizer',
    'lyricsOutput'
  ];

  currentOutputRouting = {
    lyrics:
      validDestinations.includes(
        savedOutputRouting.lyrics
      )
        ? savedOutputRouting.lyrics
        : currentOutputRouting.lyrics,

    songInfo:
      validDestinations.includes(
        savedOutputRouting.songInfo
      )
        ? savedOutputRouting.songInfo
        : currentOutputRouting.songInfo
  };
}

    console.log(
      '[Song Info] 設定を読み込みました:',
      {
        editorSettings:
          currentSongInfoEditorSettings,

        items:
          currentSongInfoItems
      }
    );
  } catch (error) {
    console.error(
      '[Song Info] 設定の読み込みに失敗しました:',
      error
    );
  }
}


/*
  現在のSong Info設定を保存する
*/
function saveSongInfoEditorSettings() {
  const filePath =
    getSongInfoSettingsFilePath();

  try {
    fs.mkdirSync(
      path.dirname(filePath),
      {
        recursive: true
      }
    );

    const saveData = {
  editorSettings: {
    ...currentSongInfoEditorSettings,

    positionByRatio: {
      '16:9': {
        ...currentSongInfoEditorSettings
          .positionByRatio['16:9']
      },

      '9:16': {
        ...currentSongInfoEditorSettings
          .positionByRatio['9:16']
      }
    }
  },

  items: {
    ...currentSongInfoItems
  },

  outputRouting: {
    ...currentOutputRouting
  }
};

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        saveData,
        null,
        2
      ),
      'utf8'
    );

    console.log(
      '[Song Info] 設定を保存しました:',
      filePath
    );

    return true;
  } catch (error) {
    console.error(
      '[Song Info] 設定の保存に失敗しました:',
      error
    );

    return false;
  }
}

const ARTIST_ORDER = [
  'norah',
  'PELL',
  'mOkilatty',
  '夜零羽／YØREIHA',
  '柚季',
  'PARADOX'
];


function sendSongInfoEditorSettings() {
  const settings = {
    ...currentSongInfoEditorSettings,

    positionByRatio: {
      '16:9': {
        ...currentSongInfoEditorSettings
          .positionByRatio?.['16:9']
      },

      '9:16': {
        ...currentSongInfoEditorSettings
          .positionByRatio?.['9:16']
      }
    }
  };

  if (
    visualizerWindow &&
    !visualizerWindow.isDestroyed()
  ) {
    visualizerWindow
      .webContents
      .send(
        'visualizer-song-info-editor-settings',
        settings
      );
  }

  if (
    lyricsOutputWindow &&
    !lyricsOutputWindow.isDestroyed()
  ) {
    lyricsOutputWindow
      .webContents
      .send(
        'lyrics-output-song-info-editor-settings',
        settings
      );
  }
}



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
  width: 1500,
  height: 950,
  minWidth: 1200,
  minHeight: 760,
  title: 'NORAH Studio Editor',
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

  lyricsEditorWindow.on(
  'closed',
  () => {
    lyricsEditorWindow = null;
  }
);
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
    width: 1600,
    height: 900,

    minWidth: 1400,
    minHeight: 850,

    show: false,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  attachPerformanceShortcuts(
  mainWindow
);

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // 起動時に最大化
    mainWindow.show();
  });
}


function openVisualizerWindow() {
  if (
    visualizerWindow &&
    !visualizerWindow.isDestroyed()
  ) {
    visualizerWindow.focus();
    return;
  }

  visualizerWindow =
    new BrowserWindow({
      width: 540,
      height: 960,
      useContentSize: true,
      title: 'PARADOX Visualizer',
      backgroundColor: '#000000',
      alwaysOnTop: true,

      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

  attachPerformanceShortcuts(
    visualizerWindow
  );

  visualizerWindow.loadFile(
    'visualizer.html'
  );

  visualizerWindow
    .webContents
    .once(
      'did-finish-load',
      () => {

         
        /*
         * テーマを復元
         */
        if (currentVisualTheme) {
          visualizerWindow
            .webContents
            .send(
              'visual-theme',
              currentVisualTheme
            );
        }

        /*
         * 現在の曲情報と
         * ジャケットを復元
         */
        if (currentLyricsOutputSong) {
          visualizerWindow
            .webContents
            .send(
              'visualizer-song',
              currentLyricsOutputSong
            );
        }

        /*
         * 歌詞の表示状態を復元
         */
        visualizerWindow
          .webContents
          .send(
            'visualizer-lyrics-visible',
            currentOutputRouting
              .lyrics ===
              'visualizer'
          );

        /*
         * Song Infoの表示状態を復元
         */
        visualizerWindow
          .webContents
          .send(
            'visualizer-song-info-visible',
            currentOutputRouting
              .songInfo ===
              'visualizer'
          );
          sendSongInfoEditorSettings();
      }
    );

  visualizerWindow.setAlwaysOnTop(
    true
  );

  visualizerWindow.on(
    'closed',
    () => {
      visualizerWindow = null;
    }
  );
}


function isVisualizerDestination(
  componentName
) {
  return (
    currentOutputRouting[
      componentName
    ] === 'visualizer'
  );
}


function isLyricsOutputDestination(
  componentName
) {
  return (
    currentOutputRouting[
      componentName
    ] === 'lyrics'
  );
}

let isAdjustingLyricsOutputSize =
  false;

function enforceLyricsOutputContentRatio() {
  if (
    isAdjustingLyricsOutputSize ||
    !lyricsOutputWindow ||
    lyricsOutputWindow.isDestroyed()
  ) {
    return;
  }

  const [
    currentWidth,
    currentHeight
  ] =
    lyricsOutputWindow.getContentSize();

  const targetRatio =
    currentLyricsOutputAspectRatio === '16:9'
      ? 16 / 9
      : 9 / 16;

  const targetHeight =
    Math.round(
      currentWidth / targetRatio
    );

  if (
    Math.abs(
      currentHeight -
      targetHeight
    ) <= 1
  ) {
    return;
  }

  isAdjustingLyricsOutputSize =
    true;

  lyricsOutputWindow.setContentSize(
    currentWidth,
    targetHeight
  );

  isAdjustingLyricsOutputSize =
    false;
}


function sendOutputVisibilityState() {
  const showSongInfoOnVisualizer =
    currentOutputRouting.songInfo ===
    'visualizer';

  const showSongInfoOnLyricsOutput =
    isLyricsOutputDestination(
      'songInfo'
    );

  if (
    visualizerWindow &&
    !visualizerWindow.isDestroyed()
  ) {
    visualizerWindow
      .webContents
      .send(
        'visualizer-lyrics-visible',
        currentOutputRouting
          .lyrics ===
          'visualizer'
      );

    visualizerWindow
      .webContents
      .send(
        'visualizer-song-info-visible',
        showSongInfoOnVisualizer
      );

    visualizerWindow
      .webContents
      .send(
        'visualizer-song-info-items',
        {
          title:
            showSongInfoOnVisualizer &&
            currentSongInfoItems.title,

          artist:
            showSongInfoOnVisualizer &&
            currentSongInfoItems.artist,

          time:
            showSongInfoOnVisualizer &&
            currentSongInfoItems.time
        }
      );
  }

  if (
    lyricsOutputWindow &&
    !lyricsOutputWindow.isDestroyed()
  ) {
    lyricsOutputWindow
      .webContents
      .send(
        'lyrics-output-lyrics-visible',
        isLyricsOutputDestination(
          'lyrics'
        )
      );

    lyricsOutputWindow
      .webContents
      .send(
        'lyrics-output-song-info-visible',
        showSongInfoOnLyricsOutput
      );

    lyricsOutputWindow
      .webContents
      .send(
        'lyrics-output-song-info-items',
        {
          title:
            showSongInfoOnLyricsOutput &&
            currentSongInfoItems.title,

          artist:
            showSongInfoOnLyricsOutput &&
            currentSongInfoItems.artist,

          time:
            showSongInfoOnLyricsOutput &&
            currentSongInfoItems.time
        }
      );
  }
}


function openLyricsOutputWindow() {
  if (
    lyricsOutputWindow &&
    !lyricsOutputWindow.isDestroyed()
  ) {
    lyricsOutputWindow.focus();
    return;
  }

  const initialSize =
    currentLyricsOutputAspectRatio === '16:9'
      ? {
          width: 1280,
          height: 720
        }
      : {
          width: 540,
          height: 960
        };

  lyricsOutputWindow =
    new BrowserWindow({
      width: initialSize.width,
      height: initialSize.height,

      useContentSize: true,

      minWidth: 320,
      minHeight: 320,

      title: 'NORAH Lyrics Output',

      /*
 * OBSではマゼンタをクロマキーで透過する。
 * Electronの透明ウィンドウで発生する
 * 文字縁の黒いフリンジを回避する。
 */
      transparent: false,
backgroundColor: '#ff00ff',
hasShadow: false,

      /*
        外出し画面を操作中に見失いにくくする。
        OBSキャプチャには問題なし。
      */
      alwaysOnTop: true,

      /*
        初期実装では通常のウィンドウ枠を残す。
        安定後にフレームレス化を検討する。
      */
     /*
 * 透明画面ではネイティブ枠ではなく、
 * HTML製の専用操作バーを使う。
 */
frame: false,
titleBarStyle: 'hidden',
resizable: true,
maximizable: true,
minimizable: true,
closable: true,
hasShadow: true,

      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });


  
    lyricsOutputWindow.setAspectRatio(
  currentLyricsOutputAspectRatio === '16:9'
    ? 16 / 9
    : 9 / 16
);

lyricsOutputWindow.setContentSize(
  initialSize.width,
  initialSize.height
);

lyricsOutputWindow.on(
  'resize',
  enforceLyricsOutputContentRatio
);

lyricsOutputWindow.loadFile(
  'lyricsOutput.html'
);


  lyricsOutputWindow
    .webContents
    .once(
      'did-finish-load',
      () => {
        lyricsOutputWindow
          .webContents
          .send(
            'lyrics-output-aspect-ratio',
            currentLyricsOutputAspectRatio
          );

        if (currentLyricsOutputData) {
          lyricsOutputWindow
            .webContents
            .send(
              'lyrics-output-data',
              currentLyricsOutputData
            );
        }

        if (currentLyricsOutputSong) {
          lyricsOutputWindow
            .webContents
            .send(
              'lyrics-output-song',
              currentLyricsOutputSong
            );
        }

        lyricsOutputWindow
          .webContents
          .send(
            'lyrics-output-time',
            currentLyricsOutputTime
          );

          lyricsOutputWindow
  .webContents
  .send(
    'lyrics-output-lyrics-visible',
    isLyricsOutputDestination(
      'lyrics'
    )
  );

lyricsOutputWindow
  .webContents
  .send(
    'lyrics-output-song-info-visible',
    isLyricsOutputDestination(
      'songInfo'
    )
  );

   sendSongInfoEditorSettings();
      }
    );

  lyricsOutputWindow.setAlwaysOnTop(
    true
  );

  lyricsOutputWindow.on(
    'closed',
    () => {
      lyricsOutputWindow = null;
    }
  );
}


ipcMain.handle(
  'set-lyrics-output-screen',
  async (event, mode) => {
    if (mode === 'off') {
      if (
        lyricsOutputWindow &&
        !lyricsOutputWindow.isDestroyed()
      ) {
        lyricsOutputWindow.close();
      }

      return true;
    }

    currentLyricsOutputAspectRatio = mode;

    openLyricsOutputWindow();

    if (
      !lyricsOutputWindow ||
      lyricsOutputWindow.isDestroyed()
    ) {
      return false;
    }

    if (mode === '9:16') {
      lyricsOutputWindow.setAspectRatio(9 / 16);
      lyricsOutputWindow.setContentSize(540, 960);
    }

    if (mode === '16:9') {
      lyricsOutputWindow.setAspectRatio(16 / 9);
      lyricsOutputWindow.setContentSize(1280, 720);
    }

    lyricsOutputWindow.center();

    lyricsOutputWindow.webContents.send(
      'lyrics-output-aspect-ratio',
      mode
    );

    return true;
  }
);



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



ipcMain.handle(
  'get-song-info-editor-settings',
  async () => {
    return {
      ...currentSongInfoEditorSettings,

      positionByRatio: {
        '16:9': {
          ...currentSongInfoEditorSettings
            .positionByRatio['16:9']
        },

        '9:16': {
          ...currentSongInfoEditorSettings
            .positionByRatio['9:16']
        }
      }
    };
  }
);





ipcMain.handle(
  'set-song-info-editor-settings',
  async (
    event,
    settings
  ) => {
    if (
      !settings ||
      typeof settings !== 'object'
    ) {
      return {
        ...currentSongInfoEditorSettings
      };
    }

    currentSongInfoEditorSettings = {
      ...currentSongInfoEditorSettings,
      ...settings,

      positionByRatio: {
        ...currentSongInfoEditorSettings
          .positionByRatio,

        ...settings.positionByRatio,

        '16:9': {
          ...currentSongInfoEditorSettings
            .positionByRatio['16:9'],

          ...settings
            .positionByRatio?.['16:9']
        },

        '9:16': {
          ...currentSongInfoEditorSettings
            .positionByRatio['9:16'],

          ...settings
            .positionByRatio?.['9:16']
        }
      }
    };

    /*
      最後に編集したSong Info設定を保存
    */
    saveSongInfoEditorSettings();

    /*
      VisualizerとLyrics Outputへ反映
    */
    sendSongInfoEditorSettings();

    return {
      ...currentSongInfoEditorSettings,

      positionByRatio: {
        '16:9': {
          ...currentSongInfoEditorSettings
            .positionByRatio['16:9']
        },

        '9:16': {
          ...currentSongInfoEditorSettings
            .positionByRatio['9:16']
        }
      }
    };
  }
);


ipcMain.handle(
  'set-song-info-items',
  async (
    event,
    items
  ) => {
    currentSongInfoItems = {
      title:
        typeof items?.title ===
        'boolean'
          ? items.title
          : currentSongInfoItems.title,

      artist:
        typeof items?.artist ===
        'boolean'
          ? items.artist
          : currentSongInfoItems.artist,

      time:
        typeof items?.time ===
        'boolean'
          ? items.time
          : currentSongInfoItems.time
    };

    /*
  Title / Artist / Timeの表示状態も保存
*/
saveSongInfoEditorSettings();

/*
  VisualizerとLyrics Outputへ反映
*/
sendOutputVisibilityState();

return {
  ...currentSongInfoItems
};
  }
);


ipcMain.handle(
  'get-song-info-items',
  async () => {
    return {
      ...currentSongInfoItems
    };
  }
);


ipcMain.handle(
  'get-visualizer-screen',
  async () => {
    return currentVisualizerScreen;
  }
);



ipcMain.handle(
  'send-lyrics-to-visualizer',
  async (
    event,
    lyrics
  ) => {
    console.log(
      '🔥 MAIN RECEIVED LYRICS:',
      JSON.stringify(
        lyrics,
        null,
        2
      )
    );

    currentLyricsOutputData =
      lyrics || null;

    console.log(
      '[Lyrics Output Routing]',
      {
        source:
          lyrics?.source,

        destinationEnabled:
          isLyricsOutputDestination(
            'lyrics'
          ),

        hasWindow:
          Boolean(
            lyricsOutputWindow
          ),

        destroyed:
          lyricsOutputWindow
            ? lyricsOutputWindow.isDestroyed()
            : null
      }
    );

    let sentToAnyOutput =
      false;

    /*
      Lyricsの表示先がVisualizerの場合
    */
    if (
      isVisualizerDestination(
        'lyrics'
      ) &&
      visualizerWindow &&
      !visualizerWindow.isDestroyed()
    ) {
      visualizerWindow
        .webContents
        .send(
          'visualizer-lyrics',
          lyrics
        );

      sentToAnyOutput = true;
    }

    /*
      Lyricsの表示先がLyrics Outputの場合
    */
    if (
      isLyricsOutputDestination(
        'lyrics'
      ) &&
      lyricsOutputWindow &&
      !lyricsOutputWindow.isDestroyed()
    ) {
      lyricsOutputWindow
        .webContents
        .send(
          'lyrics-output-data',
          lyrics
        );

      sentToAnyOutput = true;
    }

    return sentToAnyOutput;
  }
);



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

/* ========================================
   Library location
======================================== */

/*
  現在使用しているライブラリ保存先を返す。
*/
ipcMain.handle(
  'get-library-root-path',
  async () => {
    try {
      ensureLibraryFolders();

      return {
        success: true,
        path: getLibraryRootPath()
      };
    } catch (error) {
      console.error(
        'ライブラリ保存先の取得に失敗しました:',
        error
      );

      return {
        success: false,
        path: '',
        message:
          error.message ||
          'ライブラリ保存先を取得できませんでした。'
      };
    }
  }
);


/*
  現在のライブラリ保存先を、
  Finderまたはエクスプローラーで開く。
*/
ipcMain.handle(
  'open-library-root-folder',
  async () => {
    try {
      ensureLibraryFolders();

      const libraryRoot =
        getLibraryRootPath();

      const errorMessage =
        await shell.openPath(libraryRoot);

      /*
        shell.openPathは成功時に空文字、
        失敗時にエラー文字列を返す。
      */
      if (errorMessage) {
        return {
          success: false,
          message: errorMessage
        };
      }

      return {
        success: true,
        path: libraryRoot
      };
    } catch (error) {
      console.error(
        'ライブラリフォルダを開けませんでした:',
        error
      );

      return {
        success: false,
        message:
          error.message ||
          'ライブラリフォルダを開けませんでした。'
      };
    }
  }
);


/*
  既存のNORAH Studio Libraryを選択し、
  構造を検証してから切り替える。
*/
ipcMain.handle(
  'select-existing-library-folder',
  async () => {
    try {
      const result =
        await dialog.showOpenDialog(
          mainWindow,
          {
            title:
              '既存のNORAH Studio Libraryを選択',

            properties: [
              'openDirectory'
            ],

            buttonLabel:
              'このライブラリを使用'
          }
        );

      if (
        result.canceled ||
        !result.filePaths.length
      ) {
        return {
          success: false,
          canceled: true
        };
      }

      const selectedPath =
        result.filePaths[0];

      const validation =
        validateLibraryFolder(
          selectedPath
        );

      if (!validation.valid) {
        return {
          success: false,
          canceled: false,
          message:
            validation.reason ||
            'NORAH Studio Libraryとして使用できません。'
        };
      }

      const previousPath =
        getLibraryRootPath();

      const nextPath =
        setLibraryRootPath(
          validation.path
        );

      return {
        success: true,
        canceled: false,
        previousPath,
        path: nextPath,

        /*
          ライブラリ切り替え後は、
          Rendererを再読み込みする必要がある。
        */
        requiresReload: true
      };
    } catch (error) {
      console.error(
        '既存ライブラリへの切り替えに失敗しました:',
        error
      );

      return {
        success: false,
        canceled: false,
        message:
          error.message ||
          '既存ライブラリへ切り替えられませんでした。'
      };
    }
  }
);



/*
  現在のLibraryを新しい場所へ安全にコピー移行する。
*/
ipcMain.handle(
  'migrate-library-folder',
  async () => {
    try {
      const currentLibraryRoot =
        getLibraryRootPath();

      const result =
        await dialog.showOpenDialog(
          mainWindow,
          {
            title:
              '新しいライブラリ保存先を選択',

            /*
              ここではLibraryそのものではなく、
              Libraryを作成する親フォルダを選ぶ。
            */
            properties: [
              'openDirectory',
              'createDirectory'
            ],

            buttonLabel:
              'ここへ移行',

            defaultPath:
              path.dirname(
                currentLibraryRoot
              )
          }
        );

      if (
        result.canceled ||
        !result.filePaths.length
      ) {
        return {
          success: false,
          canceled: true
        };
      }

      const selectedParent =
        result.filePaths[0];

      /*
        選択した場所の中に、
        NORAH Studio Libraryを作成する。
      */
      const destinationRoot =
        path.join(
          selectedParent,
          'NORAH Studio Library'
        );

      const migrationResult =
        migrateLibraryTo(
          destinationRoot
        );

      return {
        ...migrationResult,
        canceled: false,
        requiresReload: true
      };
    } catch (error) {
      console.error(
        'ライブラリ移行に失敗しました:',
        error
      );

      return {
        success: false,
        canceled: false,
        message:
          error.message ||
          'ライブラリを移行できませんでした。'
      };
    }
  }
);


/*
  Rendererを安全に再読み込みする。
*/
ipcMain.handle(
  'reload-main-window',
  async () => {
    if (
      !mainWindow ||
      mainWindow.isDestroyed()
    ) {
      return false;
    }

    mainWindow.reload();

    return true;
  }
);



ipcMain.handle('open-visualizer-window', async () => {
  openVisualizerWindow();
  return true;
});

ipcMain.handle('open-lyrics-output-window', async () => {
  openLyricsOutputWindow();
  return true;
});

ipcMain.handle(
  'set-visualizer-screen',
  async (event, mode) => {
    currentVisualizerScreen =
      mode;

    if (mode === 'off') {
      if (
        visualizerWindow &&
        !visualizerWindow.isDestroyed()
      ) {
        visualizerWindow.close();
      }

      return true;
    }

    openVisualizerWindow();

    if (
      !visualizerWindow ||
      visualizerWindow.isDestroyed()
    ) {
      return false;
    }

    if (mode === '9:16') {
      visualizerWindow.setAspectRatio(9 / 16);
      visualizerWindow.setContentSize(540, 960);
      visualizerWindow.center();
      return true;
    }

    if (mode === '16:9') {
      visualizerWindow.setAspectRatio(16 / 9);
      visualizerWindow.setContentSize(1280, 720);
      visualizerWindow.center();
      return true;
    }

    return false;
  }
);



ipcMain.handle(
  'minimize-lyrics-output-window',
  async () => {
    if (
      !lyricsOutputWindow ||
      lyricsOutputWindow.isDestroyed()
    ) {
      return false;
    }

    lyricsOutputWindow.minimize();
    return true;
  }
);

ipcMain.handle(
  'close-lyrics-output-window',
  async () => {
    if (
      !lyricsOutputWindow ||
      lyricsOutputWindow.isDestroyed()
    ) {
      return false;
    }

    lyricsOutputWindow.close();
    return true;
  }
);

ipcMain.handle(
  'send-song-to-visualizer',
  async (
    event,
    song
  ) => {
    /*
     * 最新の曲データを保存
     */
    currentLyricsOutputSong =
      song || null;

    /*
     * 曲データ自体はVisualizerへ常に送る。
     *
     * Song Infoの表示・非表示は
     * visualizer-song-info-visibleで制御する。
     *
     * これによりSong InfoがLyrics出力でも、
     * Visualizerのジャケットや動画は更新される。
     */
    if (
      visualizerWindow &&
      !visualizerWindow.isDestroyed()
    ) {
      visualizerWindow
        .webContents
        .send(
          'visualizer-song',
          currentLyricsOutputSong
        );
    }

    /*
     * Lyrics Outputにも曲データを常に送る。
     *
     * Lyrics Output側のSong Info表示は
     * lyrics-output-song-info-visibleで制御する。
     */
    if (
      lyricsOutputWindow &&
      !lyricsOutputWindow.isDestroyed()
    ) {
      lyricsOutputWindow
        .webContents
        .send(
          'lyrics-output-song',
          currentLyricsOutputSong
        );
    }

    return true;
  }
);

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

ipcMain.handle(
  'send-visualizer-time',
  async (
    event,
    timeData
  ) => {
    currentLyricsOutputTime = {
      current:
        String(
          timeData?.current ||
          '00:00'
        ),

      duration:
        String(
          timeData?.duration ||
          '00:00'
        )
    };

    let sentToAnyOutput =
      false;

    /*
      時間表示はSong Infoの一部として扱う。
    */
    if (
      isVisualizerDestination(
        'songInfo'
      ) &&
      visualizerWindow &&
      !visualizerWindow.isDestroyed()
    ) {
      visualizerWindow
        .webContents
        .send(
          'visualizer-time',
          currentLyricsOutputTime
        );

      sentToAnyOutput = true;
    }

    if (
      isLyricsOutputDestination(
        'songInfo'
      ) &&
      lyricsOutputWindow &&
      !lyricsOutputWindow.isDestroyed()
    ) {
      lyricsOutputWindow
        .webContents
        .send(
          'lyrics-output-time',
          currentLyricsOutputTime
        );

      sentToAnyOutput = true;
    }

    return sentToAnyOutput;
  }
);


ipcMain.handle(
  'set-output-routing',
  async (
    event,
    routing
  ) => {
    const validDestinations =
      new Set([
        'visualizer',
        'lyrics',
        'off'
      ]);

    const nextLyrics =
      validDestinations.has(
        routing?.lyrics
      )
        ? routing.lyrics
        : currentOutputRouting.lyrics;

    const nextSongInfo =
      validDestinations.has(
        routing?.songInfo
      )
        ? routing.songInfo
        : currentOutputRouting.songInfo;

    currentOutputRouting = {
      lyrics: nextLyrics,
      songInfo: nextSongInfo
    };

    saveSongInfoEditorSettings();

    sendOutputVisibilityState();

    /*
      出力先を変更した直後に
      最新データを新しい出力先へ送る。
    */
    if (
      isVisualizerDestination(
        'lyrics'
      ) &&
      currentLyricsOutputData &&
      visualizerWindow &&
      !visualizerWindow.isDestroyed()
    ) {
      visualizerWindow
        .webContents
        .send(
          'visualizer-lyrics',
          currentLyricsOutputData
        );
    }

    if (
      isLyricsOutputDestination(
        'lyrics'
      ) &&
      currentLyricsOutputData &&
      lyricsOutputWindow &&
      !lyricsOutputWindow.isDestroyed()
    ) {
      lyricsOutputWindow
        .webContents
        .send(
          'lyrics-output-data',
          currentLyricsOutputData
        );
    }

    /*
 * 曲データはルーティングに関係なく両方へ再送する。
 *
 * Visualizerではジャケットや背景動画の更新にも
 * 曲データを使用しているため、送信を止めてはいけない。
 */
if (
  visualizerWindow &&
  !visualizerWindow.isDestroyed()
) {
  visualizerWindow
    .webContents
    .send(
      'visualizer-song',
      currentLyricsOutputSong
    );
}

if (
  lyricsOutputWindow &&
  !lyricsOutputWindow.isDestroyed()
) {
  lyricsOutputWindow
    .webContents
    .send(
      'lyrics-output-song',
      currentLyricsOutputSong
    );
}

/*
 * 時間はSong Infoの表示先だけへ送る。
 */
if (
  isVisualizerDestination(
    'songInfo'
  ) &&
  visualizerWindow &&
  !visualizerWindow.isDestroyed()
) {
  visualizerWindow
    .webContents
    .send(
      'visualizer-time',
      currentLyricsOutputTime
    );
}

if (
  isLyricsOutputDestination(
    'songInfo'
  ) &&
  lyricsOutputWindow &&
  !lyricsOutputWindow.isDestroyed()
) {
  lyricsOutputWindow
    .webContents
    .send(
      'lyrics-output-time',
      currentLyricsOutputTime
    );
}

    return {
      ...currentOutputRouting
    };
  }
);


ipcMain.handle(
  'get-output-routing',
  async () => {
    return {
      ...currentOutputRouting
    };
  }
);




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

ipcMain.handle(
  'send-visual-theme',
  async (
    event,
    theme
  ) => {
    console.log(
      '[Main] send-visual-theme:',
      theme
    );

    currentVisualTheme =
      theme;

    if (
      !visualizerWindow ||
      visualizerWindow.isDestroyed()
    ) {
      openVisualizerWindow();
      return true;
    }

    if (
      visualizerWindow
        .webContents
        .isLoading()
    ) {
      visualizerWindow
        .webContents
        .once(
          'did-finish-load',
          () => {
            visualizerWindow
              .webContents
              .send(
                'visual-theme',
                currentVisualTheme
              );
          }
        );

      return true;
    }

    visualizerWindow
      .webContents
      .send(
        'visual-theme',
        currentVisualTheme
      );

    return true;
  }
);

ipcMain.handle('send-visualizer-effect-settings', async (event, settings) => {
  if (!visualizerWindow || visualizerWindow.isDestroyed()) return false;

  visualizerWindow.webContents.send('visualizer-effect-settings', settings);
  return true;
});

let currentVisualizerAspectRatio =
  '9:16';

let isAdjustingVisualizerSize =
  false;

function enforceVisualizerContentRatio() {
  if (
    isAdjustingVisualizerSize ||
    !visualizerWindow ||
    visualizerWindow.isDestroyed()
  ) {
    return;
  }

  const [
    currentWidth,
    currentHeight
  ] =
    visualizerWindow.getContentSize();

  const targetRatio =
    currentVisualizerAspectRatio ===
    '16:9'
      ? 16 / 9
      : 9 / 16;

  const targetHeight =
    Math.round(
      currentWidth / targetRatio
    );

  if (
    Math.abs(
      currentHeight -
      targetHeight
    ) <= 1
  ) {
    return;
  }

  isAdjustingVisualizerSize =
    true;

  visualizerWindow.setContentSize(
    currentWidth,
    targetHeight
  );

  isAdjustingVisualizerSize =
    false;
}

ipcMain.handle(
  'set-lyrics-output-aspect-ratio',
  async (event, ratio) => {


    currentVisualizerAspectRatio =
  ratio === '16:9'
    ? '16:9'
    : '9:16';

    if (
      ratio !== '16:9' &&
      ratio !== '9:16'
    ) {
      return false;
    }

    currentLyricsOutputAspectRatio =
      ratio;

    if (
      !lyricsOutputWindow ||
      lyricsOutputWindow.isDestroyed()
    ) {
      return true;
    }

   if (ratio === '16:9') {
  lyricsOutputWindow.setAspectRatio(
    16 / 9
  );

  lyricsOutputWindow.setContentSize(
    1280,
    720
  );
} else {
  lyricsOutputWindow.setAspectRatio(
    9 / 16
  );

  lyricsOutputWindow.setContentSize(
    540,
    960
  );
}

    lyricsOutputWindow
      .webContents
      .send(
        'lyrics-output-aspect-ratio',
        ratio
      );

    return true;
  }
);



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

  FontService.initialize();

  console.log(
    FontService.getAllFonts().length
  );

  /*
    ウィンドウを開く前に、
    前回のSong Info設定を復元する
  */
  loadSongInfoEditorSettings();

  createWindow();

});

ipcMain.on('performance-effect', (event, payload) => {
  if (
    !visualizerWindow ||
    visualizerWindow.isDestroyed()
  ) {
    console.warn(
      '[Performance] Visualizer window is not available'
    );
    return;
  }

  visualizerWindow.webContents.send(
    'performance-effect',
    payload
  );

  console.log(
    '[Performance] Sent to Visualizer:',
    payload
  );
});


ipcMain.handle(
    "font:getAll",
    async () => {

        return FontService.getAllFonts();

    }
);

ipcMain.on(
    "font:getAllSync",
    (event) => {
        event.returnValue =
            FontService.getAllFonts();
    }
);


ipcMain.handle(
  'font:addCustom',
  async (
    event,
    sourceFilePath
  ) => {
    console.log(
  '[Main] font:addCustom 実行:',
  sourceFilePath
);

    const result =
      await FontService.addCustomFont(
        sourceFilePath
      );

    console.log(
      '[Main] addCustomFont result:',
      result
    );

    if (result.success) {
      console.log(
        '[Main] フォント追加成功。全画面へ通知します。'
      );

      notifyFontLibraryUpdated();
    }

    return result;
  }
);


ipcMain.handle(
    "font:selectCustomFile",
    async () => {
        const result =
            await dialog.showOpenDialog({
                title:
                    "追加するフォントを選択",
                properties: [
                    "openFile"
                ],
                filters: [
                    {
                        name:
                            "Font Files",
                        extensions: [
                            "ttf",
                            "otf",
                            "woff",
                            "woff2"
                        ]
                    }
                ]
            });

        if (
            result.canceled ||
            result.filePaths.length === 0
        ) {
            return {
                success: false,
                canceled: true
            };
        }

        return {
            success: true,
            canceled: false,
            filePath:
                result.filePaths[0]
        };
    }
);


ipcMain.handle(
    "font:removeCustom",
    async (
        event,
        fontId
    ) => {
       const result =
    FontService.removeCustomFont(
        fontId
    );

if (result.success) {

    notifyFontLibraryUpdated();

}

return result;
    }
);


function notifyFontLibraryUpdated() {
  const windows =
    BrowserWindow.getAllWindows();

  console.log(
    '[Main] 通知対象ウィンドウ数:',
    windows.length
  );

  windows.forEach((win, index) => {
    if (win.isDestroyed()) {
      return;
    }

    console.log(
      '[Main] font:updated送信:',
      index,
      win.getTitle(),
      win.webContents.getURL()
    );

    win.webContents.send(
      'font:updated'
    );
  });
}





function sendPerformanceEffect(
  effect,
  active,
  params = {}
) {
  if (
    !visualizerWindow ||
    visualizerWindow.isDestroyed()
  ) {
    console.warn(
      '[Performance] Visualizer window is not available'
    );

    return;
  }

  visualizerWindow.webContents.send(
    'performance-effect',
    {
      effect,
      active,
      params
    }
  );

  console.log(
    '[Performance Main]',
    {
      effect,
      active,
      params
    }
  );
}

const activePerformanceKeys = new Map();

function resolvePerformanceShortcut(input) {
  const code = String(input.code || '');
  const key = String(input.key || '')
    .toLowerCase();

  /*
   * Shift + Space
   */
  if (
    code === 'Space' ||
    key === ' ' ||
    key === 'space' ||
    key === 'spacebar'
  ) {
    return {
      keyId: 'Space',
      effect: 'flash',
      params: {
        intensity: 1,
        speed: 6
      }
    };
  }

  /*
   * Shift + W
   */
  if (
    code === 'KeyW' ||
    key === 'w'
  ) {
    return {
      keyId: 'KeyW',
      effect: 'whiteOut',
      params: {
        intensity: 1,
        speed: 1
      }
    };
  }

  /*
   * Shift + S
   */
  if (
    code === 'KeyS' ||
    key === 's'
  ) {
    return {
      keyId: 'KeyS',
      effect: 'shake',
      params: {
        intensity: 9,
        speed: 4
      }
    };
  }


  /*
   * Shift + Z
   */

  if (
    code === 'KeyZ' ||
    key === 'z'
  ) {
  return {
    keyId: 'KeyZ',
    effect: 'punchZoom',

    params: {
      intensity: 16,
      speed: 3,
      duration: 400
    }
  };
}

if (
  code === 'KeyM' ||
  key === 'm'
) {
  return {
    keyId: 'KeyM',
    effect: 'stageSmoke',

    params: {
      density: 5,
      opacity: 0.22,
      speed: 1,
      size: 1
    }
  };
}

if (
  code === 'KeyM' ||
  key === 'm'
) {
  return {
    keyId: 'KeyM',
    effect: 'stageSmoke',

    params: {
  density: 5,
  opacity: 0.22,
  speed: 1,
  size: 1
}
  };
}

  return null;
}

function attachPerformanceShortcuts(win) {
  if (!win || win.isDestroyed()) {
    return;
  }

  win.webContents.on(
    'before-input-event',
    (event, input) => {
      const shortcut =
        resolvePerformanceShortcut(input);

      if (!shortcut) {
        return;
      }

      console.log(
        '[Performance Input]',
        {
          type: input.type,
          code: input.code,
          key: input.key,
          shift: input.shift,
          keyId: shortcut.keyId
        }
      );

      /*
       * キーを押した瞬間
       */
      if (input.type === 'keyDown') {
        /*
         * 発動開始時だけShift必須
         */
        if (!input.shift) {
          return;
        }


        /*
         * 押しっぱなしによる連続入力を無視
         */
        if (
          input.isAutoRepeat ||
          activePerformanceKeys.has(
            shortcut.keyId
          )
        ) {
          return;
        }

        activePerformanceKeys.set(
          shortcut.keyId,
          shortcut
        );

        sendPerformanceEffect(
          shortcut.effect,
          true,
          shortcut.params
        );

        console.log(
          '[Performance] ON:',
          shortcut.effect,
          shortcut.keyId
        );

        return;
      }

      /*
       * キーを離した瞬間
       *
       * Shiftを先に離していても必ず解除する。
       */
      if (input.type === 'keyUp') {
       

        activePerformanceKeys.delete(
          shortcut.keyId
        );

        sendPerformanceEffect(
          shortcut.effect,
          false,
          {}
        );

        console.log(
          '[Performance] OFF:',
          shortcut.effect,
          shortcut.keyId
        );

        return;
      }
    }
  );
}

