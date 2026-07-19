const fs = require('fs');
const path = require('path');
const os = require('os');

/*
  ライブラリ本体とは別に、
  「現在どのライブラリを使うか」だけを保存する。

  Mac:
  /Users/ユーザー名/.norah-studio/library-location.json

  Windows:
  C:\Users\ユーザー名\.norah-studio\library-location.json
*/

const APP_CONFIG_DIR = path.join(
  os.homedir(),
  '.norah-studio'
);

const LIBRARY_LOCATION_FILE = path.join(
  APP_CONFIG_DIR,
  'library-location.json'
);

function getDefaultLibraryPath() {
  return path.join(
    os.homedir(),
    'Documents',
    'NORAH Studio',
    'Library'
  );
}

function ensureAppConfigFolder() {
  if (!fs.existsSync(APP_CONFIG_DIR)) {
    fs.mkdirSync(APP_CONFIG_DIR, {
      recursive: true
    });
  }
}

/*
  現在使用するライブラリ保存先を取得する。

  設定がまだない場合は、今までどおり
  Documents/NORAH Studio/Libraryを使用する。
*/
function getLibraryRootPath() {
  ensureAppConfigFolder();

  if (!fs.existsSync(LIBRARY_LOCATION_FILE)) {
    return getDefaultLibraryPath();
  }

  try {
    const raw = fs.readFileSync(
      LIBRARY_LOCATION_FILE,
      'utf-8'
    );

    const data = JSON.parse(raw);
    const savedPath = String(
      data.libraryRoot || ''
    ).trim();

    return savedPath || getDefaultLibraryPath();
  } catch (error) {
    console.warn(
      'ライブラリ保存先設定の読み込みに失敗しました:',
      error
    );

    return getDefaultLibraryPath();
  }
}

/*
  ライブラリ保存先の参照先だけを変更する。

  この関数はファイルコピーを行わない。
  実際の移行処理は別関数で行う。
*/
function setLibraryRootPath(nextLibraryRoot) {
  const normalizedPath = path.resolve(
    String(nextLibraryRoot || '').trim()
  );

  if (!normalizedPath) {
    throw new Error(
      'ライブラリ保存先が指定されていません。'
    );
  }

  ensureAppConfigFolder();

  fs.writeFileSync(
    LIBRARY_LOCATION_FILE,
    JSON.stringify(
      {
        libraryRoot: normalizedPath,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    ),
    'utf-8'
  );

  ensureLibraryFolders();

  return normalizedPath;
}

function getSongsDir() {
  return path.join(
    getLibraryRootPath(),
    'songs'
  );
}

function getLibraryJsonPath() {
  return path.join(
    getLibraryRootPath(),
    'library.json'
  );
}

function ensureLibraryFolders() {
  const libraryRoot = getLibraryRootPath();
  const songsDir = getSongsDir();
  const libraryJson = getLibraryJsonPath();

  if (!fs.existsSync(libraryRoot)) {
    fs.mkdirSync(libraryRoot, {
      recursive: true
    });
  }

  if (!fs.existsSync(songsDir)) {
    fs.mkdirSync(songsDir, {
      recursive: true
    });
  }

  if (!fs.existsSync(libraryJson)) {
    fs.writeFileSync(
      libraryJson,
      JSON.stringify(
        {
          version: 1,
          songs: []
        },
        null,
        2
      ),
      'utf-8'
    );
  }
}

function generateSongId() {
  return (
    `song_${Date.now()}_` +
    Math.random().toString(16).slice(2)
  );
}

function sanitizeFileName(name) {
  return String(name || 'Untitled')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

/*
  ライブラリ内のパスはlibrary.jsonへ
  相対パスとして保存する。

  例:
  songs/曲名_song_xxx/audio/song.mp3

  既存の絶対パスも読み込める。
*/
function toStoredPath(filePath) {
  if (!filePath) return '';

  const libraryRoot = getLibraryRootPath();
  const absolutePath = path.resolve(filePath);
  const relativePath = path.relative(
    libraryRoot,
    absolutePath
  );

  /*
    ライブラリ外のファイルは絶対パスのまま保持。
    現在は原則としてライブラリ内へコピーされるため、
    通常ここには入らない。
  */
  if (
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath)
  ) {
    return absolutePath;
  }

  return relativePath.replace(/\\/g, '/');
}

function fromStoredPath(storedPath) {
  if (!storedPath) return '';

  /*
    既存library.jsonに入っている絶対パスにも対応。
  */
  if (path.isAbsolute(storedPath)) {
    return storedPath;
  }

  const platformPath = storedPath.replace(
    /\//g,
    path.sep
  );

  return path.join(
    getLibraryRootPath(),
    platformPath
  );
}

function normalizeSongForStorage(song) {
  return {
    ...song,
    audioPath: toStoredPath(song.audioPath),
    artworkPath: toStoredPath(song.artworkPath),
    projectPath: toStoredPath(song.projectPath)
  };
}

function normalizeSongForUse(song) {
  return {
    ...song,
    audioPath: fromStoredPath(song.audioPath),
    artworkPath: fromStoredPath(song.artworkPath),
    projectPath: fromStoredPath(song.projectPath)
  };
}

function loadLibrary() {
  ensureLibraryFolders();

  try {
    const raw = fs.readFileSync(
      getLibraryJsonPath(),
      'utf-8'
    );

    const data = JSON.parse(raw);
    const songs = Array.isArray(data.songs)
      ? data.songs
      : [];

    return songs.map(normalizeSongForUse);
  } catch (error) {
    console.error(
      'Failed to load library:',
      error
    );

    return [];
  }
}

function saveLibrary(songs) {
  ensureLibraryFolders();

  const storedSongs = songs.map(
    normalizeSongForStorage
  );

  /*
    書き込み途中でlibrary.jsonが壊れにくいよう、
    一時ファイルへ保存してから置き換える。
  */
  const libraryJson = getLibraryJsonPath();
  const temporaryPath =
    `${libraryJson}.tmp`;

  const data = {
    version: 1,
    updatedAt: new Date().toISOString(),
    songs: storedSongs
  };

  fs.writeFileSync(
    temporaryPath,
    JSON.stringify(data, null, 2),
    'utf-8'
  );

  fs.renameSync(
    temporaryPath,
    libraryJson
  );
}

function createProjectData(song) {
  return {
    version: 1,

    id: song.id,
    title: song.title,
    artist: song.artist,

    /*
      project.jsonもライブラリ基準の
      相対パスとして保存する。
    */
    audioPath: toStoredPath(song.audioPath),
    artworkPath: toStoredPath(song.artworkPath),

    createdAt: song.createdAt,
    updatedAt: song.updatedAt,

    project: {
      lyrics: {
        sections: {}
      },
      timeline: {},
      visualLayers: [],
      editorSettings: {}
    }
  };
}

function addSongFromFile(filePath, meta = {}) {
  ensureLibraryFolders();

  if (
    !filePath ||
    !fs.existsSync(filePath)
  ) {
    throw new Error(
      '登録する音源ファイルが見つかりません。'
    );
  }

  const id = generateSongId();
  const now = new Date().toISOString();

  const ext = path.extname(filePath);
  const baseTitle =
    meta.title ||
    path.basename(filePath, ext);

  const safeTitle =
    sanitizeFileName(baseTitle);

  const songDirName =
    `${safeTitle}_${id}`;

  const songDir = path.join(
    getSongsDir(),
    songDirName
  );

  const audioDir = path.join(
    songDir,
    'audio'
  );

  const artworkDir = path.join(
    songDir,
    'artwork'
  );

  const assetsDir = path.join(
    songDir,
    'assets'
  );

  fs.mkdirSync(audioDir, {
    recursive: true
  });

  fs.mkdirSync(artworkDir, {
    recursive: true
  });

  fs.mkdirSync(assetsDir, {
    recursive: true
  });

  const audioFileName =
    sanitizeFileName(
      path.basename(filePath)
    );

  const copiedAudioPath = path.join(
    audioDir,
    audioFileName
  );

  fs.copyFileSync(
    filePath,
    copiedAudioPath
  );

  let artworkPath = '';

  if (
    meta.artworkPath &&
    fs.existsSync(meta.artworkPath)
  ) {
    const artworkExt =
      path.extname(meta.artworkPath);

    const artworkFileName =
      `cover${artworkExt}`;

    const copiedArtworkPath = path.join(
      artworkDir,
      artworkFileName
    );

    fs.copyFileSync(
      meta.artworkPath,
      copiedArtworkPath
    );

    artworkPath = copiedArtworkPath;
  }

  const song = {
    id,

    title:
      meta.title ||
      path.basename(filePath, ext),

    artist: meta.artist || '',
    album: meta.album || '',
    genre: meta.genre || '',

    tags: Array.isArray(meta.tags)
      ? meta.tags
      : [],

    favorite:
      Boolean(meta.favorite),

    audioPath:
      copiedAudioPath,

    artworkPath,

    projectPath:
      path.join(songDir, 'project.json'),

    createdAt: now,
    updatedAt: now
  };

  const songs = loadLibrary();

  songs.push(song);
  saveLibrary(songs);

  fs.writeFileSync(
    song.projectPath,
    JSON.stringify(
      createProjectData(song),
      null,
      2
    ),
    'utf-8'
  );

  return song;
}

function getSongById(songId) {
  const songs = loadLibrary();

  return (
    songs.find(
      song => song.id === songId
    ) || null
  );
}

function updateSong(songId, updates) {
  const songs = loadLibrary();
  const now = new Date().toISOString();

  let updatedSong = null;

  const updatedSongs = songs.map(song => {
    if (song.id !== songId) {
      return song;
    }

    updatedSong = {
      ...song,
      ...updates,
      updatedAt: now
    };

    return updatedSong;
  });

  saveLibrary(updatedSongs);

  /*
    曲名などの基本情報もproject.jsonへ反映する。
  */
  if (
    updatedSong?.projectPath &&
    fs.existsSync(updatedSong.projectPath)
  ) {
    try {
      const project = JSON.parse(
        fs.readFileSync(
          updatedSong.projectPath,
          'utf-8'
        )
      );

      project.title =
        updatedSong.title;

      project.artist =
        updatedSong.artist;

      project.audioPath =
        toStoredPath(
          updatedSong.audioPath
        );

      project.artworkPath =
        toStoredPath(
          updatedSong.artworkPath
        );

      project.updatedAt = now;

      fs.writeFileSync(
        updatedSong.projectPath,
        JSON.stringify(
          project,
          null,
          2
        ),
        'utf-8'
      );
    } catch (error) {
      console.warn(
        'project.jsonの更新に失敗しました:',
        error
      );
    }
  }

  return updatedSong;
}

function updateSongArtwork(
  songId,
  sourceArtworkPath
) {
  const songs = loadLibrary();

  const song = songs.find(
    item => item.id === songId
  );

  if (
    !song ||
    !sourceArtworkPath ||
    !fs.existsSync(sourceArtworkPath)
  ) {
    return null;
  }

  const songDir =
    path.dirname(song.projectPath);

  const artworkDir =
    path.join(songDir, 'artwork');

  fs.mkdirSync(artworkDir, {
    recursive: true
  });

  const artworkExt =
    path.extname(sourceArtworkPath);

  /*
    前の画像と拡張子が違う場合に、
    cover.pngとcover.jpgが残らないよう削除する。
  */
  fs.readdirSync(artworkDir)
    .filter(fileName =>
      fileName.startsWith('cover.')
    )
    .forEach(fileName => {
      fs.unlinkSync(
        path.join(
          artworkDir,
          fileName
        )
      );
    });

  const copiedArtworkPath = path.join(
    artworkDir,
    `cover${artworkExt}`
  );

  fs.copyFileSync(
    sourceArtworkPath,
    copiedArtworkPath
  );

  return updateSong(songId, {
    artworkPath: copiedArtworkPath
  });
}

/*
  ライブラリ一覧から取り除くだけ。
  曲フォルダは削除しない。
*/
function deleteSong(songId) {
  const songs = loadLibrary();

  const song = songs.find(
    item => item.id === songId
  );

  if (!song) {
    return null;
  }

  const updatedSongs = songs.filter(
    item => item.id !== songId
  );

  saveLibrary(updatedSongs);

  console.log(
    'Song removed from library:',
    song
  );

  return song;
}


/*
  フォルダを再帰的にコピーする。
  fs.cpSyncへ依存せず、ElectronのNodeバージョン差を避ける。
*/
function copyDirectoryRecursive(
  sourceDir,
  destinationDir
) {
  fs.mkdirSync(destinationDir, {
    recursive: true
  });

  const entries = fs.readdirSync(
    sourceDir,
    {
      withFileTypes: true
    }
  );

  entries.forEach(entry => {
    const sourcePath = path.join(
      sourceDir,
      entry.name
    );

    const destinationPath = path.join(
      destinationDir,
      entry.name
    );

    if (entry.isDirectory()) {
      copyDirectoryRecursive(
        sourcePath,
        destinationPath
      );

      return;
    }

    if (entry.isFile()) {
      fs.copyFileSync(
        sourcePath,
        destinationPath
      );
    }
  });
}


/*
  childPathがparentPath自身、またはその内側か判定する。
*/
function isSameOrInsidePath(
  childPath,
  parentPath
) {
  const resolvedChild =
    path.resolve(childPath);

  const resolvedParent =
    path.resolve(parentPath);

  const relative = path.relative(
    resolvedParent,
    resolvedChild
  );

  return (
    relative === '' ||
    (
      !relative.startsWith('..') &&
      !path.isAbsolute(relative)
    )
  );
}


/*
  既存の絶対パスを、
  移行後も利用できる相対パスへ変換する。
*/
function convertPathForMigration(
  storedPath,
  sourceRoot
) {
  if (!storedPath) return '';

  /*
    すでに相対パスならそのまま使う。
  */
  if (!path.isAbsolute(storedPath)) {
    return String(storedPath)
      .replace(/\\/g, '/');
  }

  const resolvedSourceRoot =
    path.resolve(sourceRoot);

  const resolvedStoredPath =
    path.resolve(storedPath);

  const relative = path.relative(
    resolvedSourceRoot,
    resolvedStoredPath
  );

  /*
    元ライブラリ内のパスなら相対化する。
  */
  if (
    relative === '' ||
    (
      !relative.startsWith('..') &&
      !path.isAbsolute(relative)
    )
  ) {
    return relative.replace(/\\/g, '/');
  }

  /*
    ライブラリ外の参照は絶対パスを維持する。
  */
  return resolvedStoredPath;
}


/*
  移行先のlibrary.jsonと各project.jsonを
  相対パス形式へ統一する。
*/
function rewriteMigratedLibraryPaths(
  destinationRoot,
  sourceRoot
) {
  const libraryJson = path.join(
    destinationRoot,
    'library.json'
  );

  const raw = fs.readFileSync(
    libraryJson,
    'utf-8'
  );

  const data = JSON.parse(raw);

  if (!Array.isArray(data.songs)) {
    throw new Error(
      'library.jsonのsongsが正しくありません。'
    );
  }

  data.songs = data.songs.map(song => {
    const normalizedSong = {
      ...song,

      audioPath:
        convertPathForMigration(
          song.audioPath,
          sourceRoot
        ),

      artworkPath:
        convertPathForMigration(
          song.artworkPath,
          sourceRoot
        ),

      projectPath:
        convertPathForMigration(
          song.projectPath,
          sourceRoot
        )
    };

    return normalizedSong;
  });

  data.version = 1;
  data.updatedAt =
    new Date().toISOString();

  fs.writeFileSync(
    libraryJson,
    JSON.stringify(
      data,
      null,
      2
    ),
    'utf-8'
  );

  /*
    コピー先の各project.jsonも修正する。
  */
  data.songs.forEach(song => {
    if (!song.projectPath) return;

    const projectPath = path.join(
      destinationRoot,
      song.projectPath.replace(
        /\//g,
        path.sep
      )
    );

    if (!fs.existsSync(projectPath)) {
      return;
    }

    try {
      const project = JSON.parse(
        fs.readFileSync(
          projectPath,
          'utf-8'
        )
      );

      project.audioPath =
        song.audioPath || '';

      project.artworkPath =
        song.artworkPath || '';

      project.updatedAt =
        new Date().toISOString();

      fs.writeFileSync(
        projectPath,
        JSON.stringify(
          project,
          null,
          2
        ),
        'utf-8'
      );
    } catch (error) {
      throw new Error(
        `project.jsonの更新に失敗しました: ${projectPath}`
      );
    }
  });
}


/*
  移行先に必要な曲ファイルが存在するか検証する。
*/
function validateMigratedSongFiles(
  libraryRoot
) {
  const libraryJson = path.join(
    libraryRoot,
    'library.json'
  );

  const raw = fs.readFileSync(
    libraryJson,
    'utf-8'
  );

  const data = JSON.parse(raw);
  const missingFiles = [];

  for (const song of data.songs || []) {
    const checks = [
      {
        label: '音源',
        storedPath: song.audioPath,
        required: true
      },
      {
        label: 'プロジェクト',
        storedPath: song.projectPath,
        required: true
      },
      {
        label: 'アートワーク',
        storedPath: song.artworkPath,
        required: false
      }
    ];

    checks.forEach(check => {
      if (!check.storedPath) {
        if (check.required) {
          missingFiles.push(
            `${song.title || song.id}: ${check.label}のパスなし`
          );
        }

        return;
      }

      const filePath = path.isAbsolute(
        check.storedPath
      )
        ? check.storedPath
        : path.join(
            libraryRoot,
            check.storedPath.replace(
              /\//g,
              path.sep
            )
          );

      if (!fs.existsSync(filePath)) {
        missingFiles.push(
          `${song.title || song.id}: ${check.label}が見つかりません`
        );
      }
    });
  }

  return {
    valid: missingFiles.length === 0,
    missingFiles
  };
}


/*
  現在のライブラリを指定先へコピー移行する。

  destinationRoot:
  新しいLibraryフォルダそのもののパス。
*/
function migrateLibraryTo(
  destinationRoot
) {
  ensureLibraryFolders();

  const sourceRoot =
    path.resolve(
      getLibraryRootPath()
    );

  const finalDestinationRoot =
    path.resolve(
      String(destinationRoot || '')
    );

  if (!destinationRoot) {
    throw new Error(
      '移行先が指定されていません。'
    );
  }

  if (
    finalDestinationRoot === sourceRoot
  ) {
    throw new Error(
      '現在と同じライブラリ保存先です。'
    );
  }

  /*
    現在のLibrary内にコピーすると、
    再帰コピーになるため禁止する。
  */
  if (
    isSameOrInsidePath(
      finalDestinationRoot,
      sourceRoot
    )
  ) {
    throw new Error(
      '現在のライブラリ内は移行先に指定できません。'
    );
  }

  /*
    移行先が現在のLibraryの親でも、
    現在のLibraryを巻き込む可能性があるため禁止。
  */
  if (
    isSameOrInsidePath(
      sourceRoot,
      finalDestinationRoot
    )
  ) {
    throw new Error(
      '現在のライブラリを含むフォルダは移行先に指定できません。'
    );
  }

  if (
    fs.existsSync(
      finalDestinationRoot
    )
  ) {
    throw new Error(
      '移行先に同名のLibraryフォルダがすでに存在します。'
    );
  }

  const temporaryRoot =
    `${finalDestinationRoot}.migrating-${Date.now()}`;

  try {
    /*
      まず一時フォルダへコピーする。
    */
    copyDirectoryRecursive(
      sourceRoot,
      temporaryRoot
    );

    /*
      コピー先のパスを相対形式へ変換。
    */
    rewriteMigratedLibraryPaths(
      temporaryRoot,
      sourceRoot
    );

    /*
      Libraryとしての基本構造を検証。
    */
    const structureValidation =
      validateLibraryFolder(
        temporaryRoot
      );

    if (!structureValidation.valid) {
      throw new Error(
        structureValidation.reason ||
        '移行先ライブラリの構造確認に失敗しました。'
      );
    }

    /*
      音源・project.jsonなどを検証。
    */
    const fileValidation =
      validateMigratedSongFiles(
        temporaryRoot
      );

    if (!fileValidation.valid) {
      const preview =
        fileValidation.missingFiles
          .slice(0, 5)
          .join('\n');

      throw new Error(
        [
          '移行先で一部のファイルを確認できませんでした。',
          preview,
          fileValidation.missingFiles.length > 5
            ? `ほか${fileValidation.missingFiles.length - 5}件`
            : ''
        ]
          .filter(Boolean)
          .join('\n')
      );
    }

    /*
      検証後に正式フォルダ名へ確定する。
    */
    fs.renameSync(
      temporaryRoot,
      finalDestinationRoot
    );

    /*
      すべて成功してから参照先を変更する。
    */
    setLibraryRootPath(
      finalDestinationRoot
    );

    return {
      success: true,
      previousPath: sourceRoot,
      path: finalDestinationRoot
    };
  } catch (error) {
    /*
      失敗した一時コピーのみ削除する。
      元ライブラリには触れない。
    */
    if (
      fs.existsSync(
        temporaryRoot
      )
    ) {
      fs.rmSync(
        temporaryRoot,
        {
          recursive: true,
          force: true
        }
      );
    }

    throw error;
  }
}


/*
  指定されたフォルダが、
  NORAH Studio Libraryとして使用可能か確認する。
*/
function validateLibraryFolder(folderPath) {
  if (!folderPath) {
    return {
      valid: false,
      reason:
        'フォルダが指定されていません。'
    };
  }

  const resolvedPath =
    path.resolve(folderPath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      valid: false,
      reason:
        '指定されたフォルダが存在しません。'
    };
  }

  const stat =
    fs.statSync(resolvedPath);

  if (!stat.isDirectory()) {
    return {
      valid: false,
      reason:
        '指定された場所はフォルダではありません。'
    };
  }

  const libraryJson = path.join(
    resolvedPath,
    'library.json'
  );

  const songsDir = path.join(
    resolvedPath,
    'songs'
  );

  if (!fs.existsSync(libraryJson)) {
    return {
      valid: false,
      reason:
        'library.jsonが見つかりません。'
    };
  }

  if (!fs.existsSync(songsDir)) {
    return {
      valid: false,
      reason:
        'songsフォルダが見つかりません。'
    };
  }

  try {
    const raw = fs.readFileSync(
      libraryJson,
      'utf-8'
    );

    const data = JSON.parse(raw);

    if (!Array.isArray(data.songs)) {
      return {
        valid: false,
        reason:
          'library.jsonの形式が正しくありません。'
      };
    }
  } catch (error) {
    return {
      valid: false,
      reason:
        'library.jsonを読み込めません。'
    };
  }

  return {
    valid: true,
    path: resolvedPath
  };
}

module.exports = {
  getDefaultLibraryPath,
  getLibraryRootPath,
  setLibraryRootPath,
  getSongsDir,
  getLibraryJsonPath,

  ensureLibraryFolders,
  validateLibraryFolder,
  validateMigratedSongFiles,
  migrateLibraryTo,

  loadLibrary,
  saveLibrary,

  addSongFromFile,
  getSongById,
  updateSong,
  deleteSong,
  updateSongArtwork
};