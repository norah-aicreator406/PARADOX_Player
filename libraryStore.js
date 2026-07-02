const fs = require('fs');
const path = require('path');
const os = require('os');

function getDefaultLibraryPath() {
  return path.join(
    os.homedir(),
    'Documents',
    'NORAH Studio',
    'Library'
  );
}

const LIBRARY_ROOT = getDefaultLibraryPath();
const SONGS_DIR = path.join(LIBRARY_ROOT, 'songs');
const LIBRARY_JSON = path.join(LIBRARY_ROOT, 'library.json');

function ensureLibraryFolders() {
  if (!fs.existsSync(LIBRARY_ROOT)) {
    fs.mkdirSync(LIBRARY_ROOT, { recursive: true });
  }

  if (!fs.existsSync(SONGS_DIR)) {
    fs.mkdirSync(SONGS_DIR, { recursive: true });
  }

  if (!fs.existsSync(LIBRARY_JSON)) {
    fs.writeFileSync(
      LIBRARY_JSON,
      JSON.stringify({ songs: [] }, null, 2),
      'utf-8'
    );
  }
}

function generateSongId() {
  return `song_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadLibrary() {
  ensureLibraryFolders();

  try {
    const raw = fs.readFileSync(LIBRARY_JSON, 'utf-8');
    const data = JSON.parse(raw);

    return data.songs || [];
  } catch (error) {
    console.error('Failed to load library:', error);
    return [];
  }
}

function saveLibrary(songs) {
  ensureLibraryFolders();

  fs.writeFileSync(
    LIBRARY_JSON,
    JSON.stringify({ songs }, null, 2),
    'utf-8'
  );
}

function createProjectData(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    audioPath: song.audioPath,
    artworkPath: song.artworkPath,
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

  const id = generateSongId();
  const now = new Date().toISOString();

  const ext = path.extname(filePath);
  const songDir = path.join(SONGS_DIR, id);
  const audioDir = path.join(songDir, 'audio');
  const artworkDir = path.join(songDir, 'artwork');
  const assetsDir = path.join(songDir, 'assets');

  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(artworkDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  const audioFileName = `original${ext}`;
  const copiedAudioPath = path.join(audioDir, audioFileName);

  fs.copyFileSync(filePath, copiedAudioPath);


let artworkPath = '';

if (meta.artworkPath) {
  const artworkExt = path.extname(meta.artworkPath);
  const artworkFileName = `cover${artworkExt}`;
  const copiedArtworkPath = path.join(artworkDir, artworkFileName);

  fs.copyFileSync(meta.artworkPath, copiedArtworkPath);

  artworkPath = copiedArtworkPath;
}

const song = {
  id,
  title: meta.title || path.basename(filePath, ext),
  artist: meta.artist || '',
  album: meta.album || '',
  genre: meta.genre || '',
  tags: meta.tags || [],
  favorite: meta.favorite || false,
  audioPath: copiedAudioPath,
  artworkPath,
  projectPath: path.join(songDir, 'project.json')
  };

  const songs = loadLibrary();
  songs.push(song);
  saveLibrary(songs);

  fs.writeFileSync(
    song.projectPath,
    JSON.stringify(createProjectData(song), null, 2),
    'utf-8'
  );

  return song;
}

function getSongById(songId) {
  const songs = loadLibrary();
  return songs.find(song => song.id === songId) || null;
}

function updateSong(songId, updates) {
  const songs = loadLibrary();

  const updatedSongs = songs.map(song => {
    if (song.id !== songId) return song;

    return {
      ...song,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  });

  saveLibrary(updatedSongs);

  return updatedSongs.find(song => song.id === songId) || null;
}

function deleteSong(songId) {
  const songs = loadLibrary();
  const song = songs.find(item => item.id === songId);

  const updatedSongs = songs.filter(item => item.id !== songId);
  saveLibrary(updatedSongs);

  // まずは安全のためフォルダ削除はしない
  console.log('Song removed from library:', song);
}

module.exports = {
  getDefaultLibraryPath,
  ensureLibraryFolders,
  loadLibrary,
  saveLibrary,
  addSongFromFile,
  getSongById,
  updateSong,
  deleteSong
};