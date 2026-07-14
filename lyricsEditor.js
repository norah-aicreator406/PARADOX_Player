const fs = require('fs');
const { pathToFileURL } = require('url');
let timelineScale = 90; // 1秒 = 90px
const TIMELINE_SCALE_MIN = 20;
const TIMELINE_SCALE_MAX = 260;
const TIMELINE_ROW_HEIGHT = 56;
const TIMELINE_MIN_BLOCK_WIDTH = 24;

const lyricsImportDialog = document.getElementById('lyricsImportDialog');
const openLyricsImportButton = document.getElementById('openLyricsImportButton');
const cancelLyricsImportButton = document.getElementById('cancelLyricsImportButton');
const applyLyricsImportButton = document.getElementById('applyLyricsImportButton');

function openLyricsImportDialog() {
  lyricsImportDialog?.classList.remove('is-hidden');

  lyricsImportStep = 'analyze';
  latestParsedLyrics = null;

  if (applyLyricsImportButton) {
    applyLyricsImportButton.textContent = '解析';
  }

  const preview = document.getElementById('lyricsImportPreview');
  const previewContent = document.getElementById('lyricsImportPreviewContent');

  if (preview) preview.classList.add('is-hidden');
  if (previewContent) previewContent.innerHTML = '';
}

function closeLyricsImportDialog() {
  lyricsImportDialog?.classList.add('is-hidden');
}

openLyricsImportButton?.addEventListener('click', openLyricsImportDialog);

cancelLyricsImportButton?.addEventListener('click', closeLyricsImportDialog);

applyLyricsImportButton?.addEventListener('click', () => {
  if (lyricsImportStep === 'import') {
  importParsedLyricsToEditor();
  return;
}
  console.log('解析ボタン押されました');

  const textarea = document.getElementById('lyricsImportTextarea');
  const blockModeInput = document.querySelector('input[name="lyricsBlockMode"]:checked');
  const sectionOption = document.getElementById('detectSectionOption');
  const preview = document.getElementById('lyricsImportPreview');
  const previewContent = document.getElementById('lyricsImportPreviewContent');

  if (!textarea || !preview || !previewContent) {
    console.error('歌詞取り込み要素が見つかりません', {
      textarea,
      preview,
      previewContent
    });
    return;
  }

  const parsed = parseImportedLyrics(textarea.value, {
  blockMode: blockModeInput?.value || 'blankLine',
  detectSection: sectionOption?.checked ?? true
});

// ←ここ！！
latestParsedLyrics = parsed;

console.log('textarea value:', textarea.value);
console.log('textarea length:', textarea.value.length);
console.log('解析結果:', parsed);

previewContent.innerHTML = '';

  Object.entries(parsed).forEach(([sectionName, blocks]) => {
  const section = document.createElement('div');
  section.className = 'importSectionPreview';

  const samples = blocks.slice(0, 3);

  section.innerHTML = `
    <strong>${sectionName}</strong>：${blocks.length}ブロック
    <div class="importBlockSamples">
      ${samples.map((text, index) => `
        <div class="importBlockSample">
          <span>${index + 1}.</span>
          <em>${String(text).replace(/\n/g, ' / ')}</em>
        </div>
      `).join('')}
      ${
        blocks.length > 3
          ? `<div class="importBlockMore">...ほか${blocks.length - 3}件</div>`
          : ''
      }
    </div>
  `;

  previewContent.appendChild(section);
});

  preview.classList.remove('is-hidden');
  lyricsImportStep = 'import';
  applyLyricsImportButton.textContent = '取り込み';
});
  

document.addEventListener('keydown', (event) => {
  if (
    event.key === 'Escape' &&
    !lyricsImportDialog.classList.contains('is-hidden')
  ) {
    closeLyricsImportDialog();
  }
});


const { ipcRenderer } = require('electron');
const fontGroups = [
  {
    label: 'Japanese',
    fonts: [
      'Yu Gothic UI',
      'Yu Gothic',
      'Meiryo',
      'MS Gothic',
      'MS PGothic',
      'MS UI Gothic',
      'Yu Mincho',
      'MS Mincho'
    ]
  },
  {
    label: 'English',
    fonts: [
      'Arial',
      'Verdana',
      'Tahoma',
      'Trebuchet MS',
      'Georgia',
      'Times New Roman',
      'Impact',
      'Comic Sans MS'
    ]
  }
];

const stylePresets = {

  default: {
    color: "#ffffff",
    outlineColor: "#000000",
    outlineWidth: 0,
    shadowPreset: "off",
    shadowColor: "#000000",
    shadowBlur: 0,
    shadowX: 0,
    shadowY: 0,
    letterSpacing: 0,
    lineHeight: 1.2
  },

  pop: {
    color: "#ffffff",
    outlineColor: "#ff4fc3",
    outlineWidth: 2,
    shadowPreset: "soft",
    shadowColor: "#ff4fc3",
    shadowBlur: 12,
    shadowX: 2,
    shadowY: 2,
    letterSpacing: 0,
    lineHeight: 1.2
  },

  rock: {
    color: "#ffffff",
    outlineColor: "#000000",
    outlineWidth: 4,
    shadowPreset: "hard",
    shadowColor: "#000000",
    shadowBlur: 0,
    shadowX: 6,
    shadowY: 6,
    letterSpacing: 0,
    lineHeight: 1.1
  },

  metal: {
    color: "#dcdcdc",
    outlineColor: "#000000",
    outlineWidth: 5,
    shadowPreset: "hard",
    shadowColor: "#000000",
    shadowBlur: 0,
    shadowX: 8,
    shadowY: 8,
    letterSpacing: 1,
    lineHeight: 1.0
  },

  neon: {
    color: "#ffffff",
    outlineColor: "#00ffff",
    outlineWidth: 2,
    shadowPreset: "neon",
    shadowColor: "#00ffff",
    shadowBlur: 32,
    shadowX: 0,
    shadowY: 0,
    letterSpacing: 1,
    lineHeight: 1.2
  },

  cinematic: {
    color: "#ffffff",
    outlineColor: "#222222",
    outlineWidth: 1,
    shadowPreset: "soft",
    shadowColor: "#000000",
    shadowBlur: 16,
    shadowX: 4,
    shadowY: 4,
    letterSpacing: 2,
    lineHeight: 1.35
  }

};

let timelinePlayheadAnimationId = null;
let autoFollowPlayhead = true;
let isDraggingPlayhead = false;
let isUserScrollingTimeline = false;
let timelineScrollTimer = null;
let isAutoScrollingTimeline = false;
let isTimingInputMode = false;
let timingInputStarted = false;
let timingInputBlockIndex = -1;





function parseTimeToSeconds(timeText) {
  if (!timeText) return 0;

  const [minutesPart, secondsPart] = String(timeText).split(':');
  const minutes = Number(minutesPart) || 0;
  const seconds = Number(secondsPart) || 0;

  return minutes * 60 + seconds;
}

function formatSecondsToTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);

  const minutes = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  const centiseconds = Math.floor((safeSeconds % 1) * 100);

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}


function setupFontOptions() {
  fontInput.innerHTML = '';

  fontGroups.forEach((group) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;

    group.fonts.forEach((fontName) => {
      const option = document.createElement('option');
      option.value = fontName;
      option.textContent = fontName;
      option.style.fontFamily = fontName;

      optgroup.appendChild(option);
    });

    fontInput.appendChild(optgroup);
  });
}


const textInput = document.getElementById('lyricsText');
const startTimeInput = document.getElementById('lyricsStartTime');
const endTimeInput = document.getElementById('lyricsEndTime');
const animationPresetInput = document.getElementById('lyricsAnimationPreset');
const sizeInput = document.getElementById('lyricsSize');
const colorInput = document.getElementById('lyricsColor');
const fontInput = document.getElementById('lyricsFont');
const stylePresetInput =
    document.getElementById('lyricsStylePreset');
const outlineColorInput = document.getElementById('lyricsOutlineColor');
const outlineWidthInput = document.getElementById('lyricsOutlineWidth');
const alignInput = document.getElementById('lyricsAlign');
const shadowColorInput = document.getElementById('lyricsShadowColor');
const shadowBlurInput = document.getElementById('lyricsShadowBlur');
const shadowXInput = document.getElementById('lyricsShadowX');
const shadowYInput = document.getElementById('lyricsShadowY');
const shadowPresetInput =
    document.getElementById('shadowPreset');
const letterSpacingInput =
    document.getElementById('lyricsLetterSpacing');
const lineHeightInput = document.getElementById('lyricsLineHeight');
const sizeValue =
    document.getElementById('lyricsSizeValue');
const outlineWidthValue =
    document.getElementById('outlineWidthValue');
const shadowBlurValue =
    document.getElementById('shadowBlurValue');

const shadowXValue =
    document.getElementById('shadowXValue');

const shadowYValue =
    document.getElementById('shadowYValue');

const letterSpacingValue =
    document.getElementById('letterSpacingValue');

const lineHeightValue =
    document.getElementById('lineHeightValue');

setupFontOptions();


function sendLyricsUpdate() {

  sizeValue.textContent =
    sizeInput.value;

  outlineWidthValue.textContent =
    outlineWidthInput.value;

  shadowBlurValue.textContent =
    shadowBlurInput.value;

  shadowXValue.textContent =
    shadowXInput.value;

  shadowYValue.textContent =
    shadowYInput.value;

  letterSpacingValue.textContent =
    letterSpacingInput.value;

  lineHeightValue.textContent =
    lineHeightInput.value;

  

  ipcRenderer.invoke('update-selected-lyrics-layer', {
    text: textInput.value,
    size: Number(sizeInput.value),
    color: colorInput.value,
    font: fontInput.value,
    outlineColor: outlineColorInput.value,
    outlineWidth: Number(outlineWidthInput.value),
    align: alignInput.value,
    shadowColor: shadowColorInput.value,
    shadowBlur: Number(shadowBlurInput.value),
    shadowX: Number(shadowXInput.value),
    shadowY: Number(shadowYInput.value),
    letterSpacing:
    Number(letterSpacingInput.value),
    lineHeight: Number(lineHeightInput.value)
  });

 const selectedBlock =
  document.querySelector('.lyricsBlock.selected');

if (selectedBlock) {
  selectedBlock.dataset.animationPreset = animationPresetInput.value;

  const blockId = selectedBlock.dataset.blockId;
  const blocks = sectionData[currentSectionName] || [];
  const blockData = blocks.find(block => block.id === blockId);

  if (blockData) {
    blockData.text = textInput.value;
    blockData.start = startTimeInput.value;
    blockData.end = endTimeInput.value;
    blockData.animationPreset = animationPresetInput.value;
    blockData.style = {
  font: fontInput.value,
  size: Number(sizeInput.value),
  color: colorInput.value,
  align: alignInput.value,
  outlineColor: outlineColorInput.value,
  outlineWidth: Number(outlineWidthInput.value),
  shadowColor: shadowColorInput.value,
  shadowBlur: Number(shadowBlurInput.value),
  shadowX: Number(shadowXInput.value),
  shadowY: Number(shadowYInput.value),
  letterSpacing: Number(letterSpacingInput.value),
  lineHeight: Number(lineHeightInput.value)
};
  }

  renderSectionBlocks();

  const updatedBlock = document.querySelector(
    `.lyricsBlock[data-block-id="${blockId}"]`
  );

  if (updatedBlock) {
    updatedBlock.classList.add('selected');
  }
}
updateEditorPreview();
}

function updateEditorPreview(targetBlockData = null) {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return;

  const blockData = targetBlockData || getSelectedLyricsBlockData();
  const style = blockData?.style || getCurrentInspectorStyle();

  const payload = {
    id: blockData?.id || null,
    text: blockData?.text ?? textInput.value ?? '',
    lines: String(blockData?.text ?? textInput.value ?? '').split('\n'),
    style,
    position: blockData?.position || { x: 0, y: 0, z: 0 },
    layout: blockData?.layout || { width: 900, rotation: 0 },
    animation: {
      preset: blockData?.animationPreset || animationPresetInput.value || 'fade',
      duration: 0.5
    }
  };

 window.LyricsRenderer.render(previewLyrics, payload);
 
 ensureLyricsSelectionBox();
}




function getSelectedLyricsBlockData() {
  const selectedBlock = document.querySelector('.lyricsBlock.selected');
  if (!selectedBlock) return null;

  const blockId = selectedBlock.dataset.blockId;

  for (const blocks of Object.values(sectionData)) {
    const found = (blocks || []).find(block => block.id === blockId);
    if (found) return found;
  }

  return null;
}

function setupPreviewLyricsDrag() {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  
  if (!previewLyrics) return;

  let isDragging = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startX = 0;
  let startY = 0;
  let targetBlock = null;

  previewLyrics.addEventListener('mousedown', (event) => {
  if (event.detail >= 2) return;
  if (event.target.closest('.selectionHandle')) return;
  if (event.target.closest('.selectionSideHandle')) return;

  targetBlock = getSelectedLyricsBlockData();
    if (!targetBlock) return;
    if (event.button !== 0) return;

    if (!targetBlock.position) {
      targetBlock.position = { x: 0, y: 0, z: 0 };
    }

    isDragging = true;

    startMouseX = event.clientX;
    startMouseY = event.clientY;
    startX = Number(targetBlock.position.x) || 0;
    startY = Number(targetBlock.position.y) || 0;

    previewLyrics.classList.add('is-dragging');

    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('mousemove', (event) => {
  if (!isDragging || !targetBlock) return;

  const canvas = document.getElementById('editorPreviewCanvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();

  const scaleX = rect.width / canvas.offsetWidth;
  const scaleY = rect.height / canvas.offsetHeight;

  const dx = (event.clientX - startMouseX) / scaleX;
  const dy = (event.clientY - startMouseY) / scaleY;

  targetBlock.position.x = startX + dx;
  targetBlock.position.y = startY + dy;

  previewLyrics.style.transform =
    `translate(-50%, -50%) translate(${targetBlock.position.x}px, ${targetBlock.position.y}px)`;
});

  document.addEventListener('mouseup', () => {
  if (!isDragging) return;

  isDragging = false;
  previewLyrics.classList.remove('is-dragging');

  updateEditorPreview(targetBlock);
  sendLyricsBlockToVisualizer(targetBlock);

  targetBlock = null;
});
}



function setupInlineLyricsTextEdit() {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return;

  let editingBlock = null;
  let originalText = '';

  document.addEventListener('dblclick', (event) => {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return;

  if (!event.target.closest('#editorPreviewLyrics')) return;
  if (event.target.closest('.selectionHandle')) return;

  editingBlock = getSelectedLyricsBlockData();
  if (!editingBlock) return;

  originalText = editingBlock.text || '';

  previewLyrics.contentEditable = 'true';
  previewLyrics.classList.add('is-editing');
  previewLyrics.focus();

  const range = document.createRange();
  range.selectNodeContents(previewLyrics);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  event.preventDefault();
  event.stopPropagation();
});

  previewLyrics.addEventListener('keydown', (event) => {
    if (!editingBlock) return;

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      finishInlineLyricsEdit();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelInlineLyricsEdit();
    }
  });

  previewLyrics.addEventListener('blur', () => {
    if (editingBlock) {
      finishInlineLyricsEdit();
    }
  });

  function finishInlineLyricsEdit() {
    if (!editingBlock) return;

    const nextText = previewLyrics.innerText.trim();

    editingBlock.text = nextText;
    textInput.value = nextText;

    previewLyrics.contentEditable = 'false';
    previewLyrics.classList.remove('is-editing');

    updateEditorPreview(editingBlock);
    renderSectionBlocks();
    sendLyricsBlockToVisualizer(editingBlock);

    editingBlock = null;
  }

  function cancelInlineLyricsEdit() {
    if (!editingBlock) return;

    editingBlock.text = originalText;
    textInput.value = originalText;

    previewLyrics.contentEditable = 'false';
    previewLyrics.classList.remove('is-editing');

    updateEditorPreview(editingBlock);

    editingBlock = null;
  }
}




function applyShadowPreset() {

    switch (shadowPresetInput.value) {

        case "off":
            shadowColorInput.value="#000000";
            shadowBlurInput.value=0;
            shadowXInput.value=0;
            shadowYInput.value=0;
            break;

        case "soft":
    shadowColorInput.value = "#000000";
    shadowBlurInput.value = 22;
    shadowXInput.value = 6;
    shadowYInput.value = 6;
    break;

case "hard":
    shadowColorInput.value = "#000000";
    shadowBlurInput.value = 0;
    shadowXInput.value = 8;
    shadowYInput.value = 8;
    break;

        case "glow":
            shadowColorInput.value="#ffffff";
            shadowBlurInput.value=24;
            shadowXInput.value=0;
            shadowYInput.value=0;
            break;

        case "neon":
            shadowColorInput.value="#00ffff";
            shadowBlurInput.value=32;
            shadowXInput.value=0;
            shadowYInput.value=0;
            break;
    }

    sendLyricsUpdate();

}


function applyStylePreset() {

  const style = stylePresets[stylePresetInput.value];

  if (!style) return;

  colorInput.value = style.color;

  outlineColorInput.value = style.outlineColor;
  outlineWidthInput.value = style.outlineWidth;

  shadowPresetInput.value = style.shadowPreset;
  shadowColorInput.value = style.shadowColor;
  shadowBlurInput.value = style.shadowBlur;
  shadowXInput.value = style.shadowX;
  shadowYInput.value = style.shadowY;

  letterSpacingInput.value = style.letterSpacing;
  lineHeightInput.value = style.lineHeight;

  sendLyricsUpdate();
}




ipcRenderer.on('lyrics-editor-data', (event, data) => {
  if (!data) return;

  currentEditorSong = data;
  currentProjectPath = data.projectPath || null;

  if (data.audioPath) {
  setupEditorAudioPlayer(data.audioPath);
}

  if (currentProjectPath && fs.existsSync(currentProjectPath)) {
    const project = JSON.parse(fs.readFileSync(currentProjectPath, 'utf-8'));

    const savedSections =
      project?.project?.lyrics?.sections || {};

    Object.keys(sectionData).forEach(key => {
      delete sectionData[key];
    });

    Object.assign(sectionData, savedSections);

    const sectionNames = Object.keys(sectionData);

    if (sectionNames.length > 0) {
      currentSectionName = sectionNames[0];
    } else {
      currentSectionName = 'Verse 1';
      sectionData[currentSectionName] = [];
    }

    showSection(currentSectionName);
  }

  document.title = `Lyrics Editor - ${data.title || ''}`;
});

let currentSectionName = 'Verse 1';

/*const commandUndoStack = [];
const commandRedoStack = [];
const COMMAND_HISTORY_LIMIT = 100;

function pushCommand(command) {
  commandUndoStack.push(command);

  if (commandUndoStack.length > COMMAND_HISTORY_LIMIT) {
    commandUndoStack.shift();
  }

  commandRedoStack.length = 0;
}

function undoEditorAction() {
  const command = commandUndoStack.pop();
  if (!command || typeof command.undo !== 'function') return;

  command.undo();
  commandRedoStack.push(command);
}

function redoEditorAction() {
  const command = commandRedoStack.pop();
  if (!command || typeof command.redo !== 'function') return;

  command.redo();
  commandUndoStack.push(command);
}

function refreshEditorAfterCommand() {
  renderSectionBlocks();

  const firstBlock = document.querySelector('.lyricsBlock.selected')
    || document.querySelector('.lyricsBlock');

  if (firstBlock) {
    selectLyricsBlock(firstBlock);
  } else {
    updateEditorPreview(null);
  }
}*/

const sectionData = {
  'Verse 1': [],
  'Chorus': []
};

let currentEditorSong = null;
let currentProjectPath = null;
let editorAudio = null;
let editorAudioReady = false;

const EDITOR_STORAGE_KEY = 'norahStudioEditorData';

textInput.addEventListener('input', sendLyricsUpdate);
animationPresetInput.addEventListener('change', sendLyricsUpdate);
startTimeInput.addEventListener('input', sendLyricsUpdate);
endTimeInput.addEventListener('input', sendLyricsUpdate);
sizeInput.addEventListener('input', sendLyricsUpdate);
colorInput.addEventListener('input', sendLyricsUpdate);
fontInput.addEventListener('change', sendLyricsUpdate);
fontInput.addEventListener('input', sendLyricsUpdate);
outlineColorInput.addEventListener('input', sendLyricsUpdate);
outlineWidthInput.addEventListener('input', sendLyricsUpdate);
alignInput.addEventListener('change', sendLyricsUpdate);

shadowColorInput.addEventListener('input', sendLyricsUpdate);
shadowBlurInput.addEventListener('input', sendLyricsUpdate);
shadowXInput.addEventListener('input', sendLyricsUpdate);
shadowYInput.addEventListener('input', sendLyricsUpdate);

shadowPresetInput.addEventListener(
    'change',
    applyShadowPreset
);

stylePresetInput.addEventListener(
    'change',
    applyStylePreset
);

letterSpacingInput.addEventListener(
    'input',
    sendLyricsUpdate
);
lineHeightInput.addEventListener('input', sendLyricsUpdate);

console.log('Lyrics Editor Loaded');

const saveEditorButton = document.getElementById('saveEditorButton');


function normalizeAllLyricsBlocksBeforeSave() {
  Object.values(sectionData).forEach(blocks => {
    (blocks || []).forEach(block => {
      if (!block.style) {
        block.style = {
          font: fontInput.value || 'Arial',
          size: Number(sizeInput.value) || 72,
          color: colorInput.value || '#ffffff',
          align: alignInput.value || 'center',
          outlineColor: outlineColorInput.value || '#000000',
          outlineWidth: Number(outlineWidthInput.value) || 0,
          shadowColor: shadowColorInput.value || '#000000',
          shadowBlur: Number(shadowBlurInput.value) || 0,
          shadowX: Number(shadowXInput.value) || 0,
          shadowY: Number(shadowYInput.value) || 0,
          letterSpacing: Number(letterSpacingInput.value) || 0,
          lineHeight: Number(lineHeightInput.value) || 1.2
        };
      }

      if (!block.position) {
        block.position = { x: 0, y: 0, z: 0 };
      if (!block.layout) {
  block.layout = { width: 900, rotation: 0 };
}

if (block.layout.width == null) {
  block.layout.width = 900;
}

if (block.layout.rotation == null) {
  block.layout.rotation = 0;
}
      }
    });
  });
}


/*function cloneEditorState() {
  return {
    currentSectionName,
    sectionData: JSON.parse(JSON.stringify(sectionData))
  };
}*/

/*function restoreEditorState(state) {
  if (!state) return;

  currentSectionName = state.currentSectionName || currentSectionName;

  Object.keys(sectionData).forEach(key => {
    delete sectionData[key];
  });

  Object.assign(
    sectionData,
    JSON.parse(JSON.stringify(state.sectionData || {}))
  );

  showSection(currentSectionName);
  updateEditorPreview();
}*/

/*function pushUndoState() {
  undoStack.push(cloneEditorState());

  if (undoStack.length > HISTORY_LIMIT) {
    undoStack.shift();
  }

  redoStack.length = 0;
}:*/

function saveEditorData() {
  syncSelectedBlockDataFromInspector();

  console.log(
    'SECTION DATA TO SAVE:',
    JSON.stringify(sectionData, null, 2)
  );

  if (currentProjectPath && fs.existsSync(currentProjectPath)) {
    const project = JSON.parse(fs.readFileSync(currentProjectPath, 'utf-8'));

    if (!project.project) project.project = {};
    if (!project.project.lyrics) project.project.lyrics = {};

    project.project.lyrics.sections = sectionData;
    project.updatedAt = new Date().toISOString();

    fs.writeFileSync(
      currentProjectPath,
      JSON.stringify(project, null, 2),
      'utf-8'
    );

    console.log('project.json saved:', currentProjectPath);
    console.log('saved project:', project);

    alert('project.jsonに保存しました。');
    return;
  }

  console.warn('project.json保存ではなくlocalStorage保存になりました');

  localStorage.setItem(
    EDITOR_STORAGE_KEY,
    JSON.stringify({
      currentSectionName,
      sectionData
    })
  );

  alert('ローカルに保存しました。');
}

function formatEditorTime(seconds) {
  if (!Number.isFinite(seconds)) return '00:00.00';

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}


function updateTimelinePlayhead() {
  if (!editorAudio) return;

  const playhead = document.getElementById('timelinePlayhead');
  const currentTimeLabel = document.getElementById('editorCurrentTime');
  const seekBar = document.getElementById('editorSeekBar');

  if (playhead) {
    const x = editorAudio.currentTime * timelineScale;
    playhead.style.left = `${x}px`;
    if (autoFollowPlayhead) {
  const trackArea = document.querySelector('.timelineTrackArea');

  if (trackArea) {
    const playheadX = editorAudio.currentTime * timelineScale;
    const visibleLeft = trackArea.scrollLeft;
    const visibleRight = visibleLeft + trackArea.clientWidth;

    const margin = 120;

    if (playheadX > visibleRight - margin) {
      trackArea.scrollLeft = playheadX - trackArea.clientWidth + margin;
    }

    if (playheadX < visibleLeft + margin) {
      trackArea.scrollLeft = Math.max(0, playheadX - margin);
    }
  }
}
  }

  if (currentTimeLabel) {
    currentTimeLabel.textContent = formatEditorTime(editorAudio.currentTime);
  }

  if (
    seekBar &&
    Number.isFinite(editorAudio.duration) &&
    editorAudio.duration > 0
  ) {
    seekBar.value = String(
      (editorAudio.currentTime / editorAudio.duration) * 100
    );
  }
  updateEditorPreviewByTimeline();
}

function getAllLyricsBlocksSorted() {
  return Object.entries(sectionData)
    .flatMap(([sectionName, blocks]) =>
      (blocks || []).map(block => {
        block.sectionName = sectionName;
        return block;
      })
    )
    .sort((a, b) =>
      parseTimeToSeconds(a.start) - parseTimeToSeconds(b.start)
    );
}

function getCurrentEditorLyricsBlock() {
  if (!editorAudio) return null;

  const currentTime = editorAudio.currentTime;
  const blocks = getAllLyricsBlocksSorted();

  return blocks.find(block => {
    const start = parseTimeToSeconds(block.start);
    const end = parseTimeToSeconds(block.end);

    return currentTime >= start && currentTime < end;
  }) || null;
}


function getCurrentEditorLyricsBlocks() {
  if (!editorAudio) return [];

  const currentTime = editorAudio.currentTime;
  const blocks = getAllLyricsBlocksSorted();

  return blocks
    .filter(block => {
      const start = parseTimeToSeconds(block.start);
      const end = parseTimeToSeconds(block.end);

      return currentTime >= start && currentTime < end;
    })
    .sort((a, b) => {
      const zA = Number(a.position?.z) || 0;
      const zB = Number(b.position?.z) || 0;

      return zA - zB;
    });
}


function renderEditorActiveLyrics(blocks) {
  const layer = document.getElementById('editorPreviewLyricsLayer');
  const mainLyrics = document.getElementById('editorPreviewLyrics');

  if (!layer || !mainLyrics) return;

  layer.innerHTML = '';

  if (!blocks.length) {
    mainLyrics.innerHTML = '';
    return;
  }

  const selectedBlockData = getSelectedLyricsBlockData();

  const primaryBlock =
    blocks.find(block => block.id === selectedBlockData?.id) ||
    blocks[blocks.length - 1];

  // 選択・直接操作用のメイン歌詞
  updateEditorPreview(primaryBlock);

  // Inspectorもメイン歌詞へ同期
  textInput.value = primaryBlock.text || '';
  startTimeInput.value = primaryBlock.start || '00:00.00';
  endTimeInput.value = primaryBlock.end || '00:03.00';
  animationPresetInput.value =
    primaryBlock.animationPreset || 'fade';

  // メイン以外を追加表示
  blocks.forEach(block => {
    if (block.id === primaryBlock.id) return;

    const item = document.createElement('div');
    item.className = 'editorPreviewLyricsItem';
    item.dataset.blockId = block.id;
    item.style.zIndex = String(Number(block.position?.z) || 0);

    layer.appendChild(item);

    const payload = buildLyricsPayloadForVisualizer(block);
    window.LyricsRenderer.render(item, payload);
  });
}



function buildLyricsPayloadForVisualizer(block) {
  console.log('★★★★ NEW buildLyricsPayloadForVisualizer RUNNING ★★★★', block);
  if (!block) return null;

  const style = block.style || getCurrentInspectorStyle();

  return {
    id: block.id,
    sectionName: block.sectionName || currentSectionName,
    lines: String(block.text || '').split('\n'),
    text: block.text || '',

    position: block.position || { x: 0, y: 0, z: 0 },

    layout: block.layout || { width: 900, rotation: 0 },

    animation: {
      preset: block.animationPreset || 'fade',
      duration: 0.5
    },

    style: {
      font: style.font || 'Arial',
      size: Number(style.size) || 72,
      color: style.color || '#ffffff',
      align: style.align || 'center',
      outlineColor: style.outlineColor || '#000000',
      outlineWidth: Number(style.outlineWidth) || 0,
      shadowColor: style.shadowColor || '#000000',
      shadowBlur: Number(style.shadowBlur) || 0,
      shadowX: Number(style.shadowX) || 0,
      shadowY: Number(style.shadowY) || 0,
      letterSpacing: Number(style.letterSpacing) || 0,
      lineHeight: Number(style.lineHeight) || 1.2
    }
  };
}

let lastSentPreviewLyricsSignature = '';

function updateEditorPreviewByTimeline() {
  const currentBlocks = getCurrentEditorLyricsBlocks();

 console.log(
    'ACTIVE LYRICS AT TIME:',
    editorAudio?.currentTime,
    currentBlocks.length,
    currentBlocks.map(block => ({
      text: block.text,
      start: block.start,
      end: block.end
    }))
  );

  if (currentBlocks.length === 0) {
    const previewLyrics =
      document.getElementById('editorPreviewLyrics');

    const layer =
      document.getElementById('editorPreviewLyricsLayer');

    if (previewLyrics) {
      previewLyrics.innerHTML = '';
    }

    if (layer) {
      layer.innerHTML = '';
    }

    // すでに空なら何度も送らない
    if (lastSentPreviewLyricsSignature !== '[]') {
      lastSentPreviewLyricsSignature = '[]';

      ipcRenderer.invoke(
  'send-lyrics-to-visualizer',
  {
    source: 'lyrics-editor',
    blocks: []
  }
);
    }

    return;
  }

  // エディター側の複数表示
  renderEditorActiveLyrics(currentBlocks);

  // Visualizer側へ複数ブロックを配列送信
  sendLyricsBlocksToVisualizer(currentBlocks);
}

function setupEditorAudioPlayer(audioPath) {
  const playButton = document.getElementById('editorPlayPauseButton');
  const currentTimeLabel = document.getElementById('editorCurrentTime');
  const durationLabel = document.getElementById('editorDuration');
  const seekBar = document.getElementById('editorSeekBar');

  if (!audioPath || !playButton || !currentTimeLabel || !durationLabel || !seekBar) {
    console.warn('Editor audio player setup failed');
    return;
  }

  if (!editorAudio) {
    editorAudio = new Audio();

    editorAudio.addEventListener('loadedmetadata', () => {
      editorAudioReady = true;
      durationLabel.textContent = formatEditorTime(editorAudio.duration);

      updateTimelineContentWidth();
      renderTimelineRuler();

    });

    editorAudio.addEventListener('timeupdate', () => {
  updateTimelinePlayhead();
});

    editorAudio.addEventListener('play', () => {
  playButton.textContent = 'Ⅱ';
  startTimelinePlayheadLoop();
});

editorAudio.addEventListener('pause', () => {
  playButton.textContent = '▶';
  stopTimelinePlayheadLoop();
});

editorAudio.addEventListener('ended', () => {
  stopTimelinePlayheadLoop();
  updateTimelinePlayhead();
});

  }

  editorAudio.src = pathToFileURL(audioPath).href;
  editorAudio.load();

  playButton.onclick = () => {
    if (!editorAudioReady) return;

    if (editorAudio.paused) {
      editorAudio.play();
    } else {
      editorAudio.pause();
    }
  };

  seekBar.oninput = () => {
    if (!editorAudioReady || !Number.isFinite(editorAudio.duration)) return;

    editorAudio.currentTime =
      (Number(seekBar.value) / 100) * editorAudio.duration;
  };
}


function setLyricsTimeFromEditorAudio(target) {
  if (!editorAudio) {
    alert('音源が読み込まれていません。');
    return;
  }

  const timeText = formatEditorTime(editorAudio.currentTime);

  if (target === 'start') {
    startTimeInput.value = timeText;
  }

  if (target === 'end') {
    endTimeInput.value = timeText;
  }

  sendLyricsUpdate();
}

const setLyricsStartNowButton =
  document.getElementById('setLyricsStartNowButton');

if (setLyricsStartNowButton) {
  setLyricsStartNowButton.addEventListener('click', () => {
    setLyricsTimeFromEditorAudio('start');
  });
}

const setLyricsEndNowButton =
  document.getElementById('setLyricsEndNowButton');

if (setLyricsEndNowButton) {
  setLyricsEndNowButton.addEventListener('click', () => {
    setLyricsTimeFromEditorAudio('end');
  });
}



function loadEditorData() {
  const saved = localStorage.getItem(EDITOR_STORAGE_KEY);

  if (!saved) return;

  const data = JSON.parse(saved);

  if (data.sectionData) {
    Object.keys(sectionData).forEach(key => {
      delete sectionData[key];
    });

    Object.assign(sectionData, data.sectionData);
  }

  if (data.currentSectionName) {
    currentSectionName = data.currentSectionName;
  }

  showSection(currentSectionName);
}

if (saveEditorButton) {
  saveEditorButton.addEventListener('click', saveEditorData);
}





const timelineResizeHandle =
  document.getElementById('timelineResizeHandle');

const editorApp =
  document.getElementById('editorApp');

let isResizingTimeline = false;

if (timelineResizeHandle && editorApp) {
  timelineResizeHandle.addEventListener('mousedown', () => {
    isResizingTimeline = true;
    document.body.style.cursor = 'row-resize';
  });

  document.addEventListener('mousemove', (event) => {
    if (!isResizingTimeline) return;

    const windowHeight = window.innerHeight;
    const newTimelineHeight = windowHeight - event.clientY;

    const clampedHeight =
      Math.min(Math.max(newTimelineHeight, 180), 560);

    editorApp.style.gridTemplateRows =
      `52px 1fr 8px ${clampedHeight}px`;
  });

  document.addEventListener('mouseup', () => {
    isResizingTimeline = false;
    document.body.style.cursor = '';
  });
}
const previewStage = document.getElementById('editorPreviewStage');
const ratioButtons = document.querySelectorAll('.ratioButton');

ratioButtons.forEach(button => {
  button.addEventListener('click', () => {
    const ratio = button.dataset.ratio;

    ratioButtons.forEach(item => {
      item.classList.remove('is-active');
    });

    button.classList.add('is-active');

    previewStage.classList.remove('ratio-16-9', 'ratio-9-16');

    if (ratio === '9:16') {
      previewStage.classList.add('ratio-9-16');
    } else {
      previewStage.classList.add('ratio-16-9');
    }

    resizeEditorPreviewCanvas();
  });
});

function ensurePreviewStageRatio() {
  const previewStage = document.getElementById('editorPreviewStage');
  if (!previewStage) return;

  if (
    !previewStage.classList.contains('ratio-16-9') &&
    !previewStage.classList.contains('ratio-9-16')
  ) {
    previewStage.classList.add('ratio-16-9');
  }
}

ensurePreviewStageRatio();



const layerGroupHeaders =
  document.querySelectorAll('.layerGroupHeader');

layerGroupHeaders.forEach(header => {
  header.addEventListener('click', () => {
    const group = header.closest('.layerGroup');

    if (!group) return;

    group.classList.toggle('collapsed');

    header.textContent =
      group.classList.contains('collapsed')
        ? header.textContent.replace('▼', '▶')
        : header.textContent.replace('▶', '▼');
  });
});

const addLayerButton = document.getElementById('addLayerButton');
const addLayerMenu = document.getElementById('addLayerMenu');

if (addLayerButton && addLayerMenu) {
  addLayerButton.addEventListener('click', () => {
    addLayerMenu.classList.toggle('is-open');
  });
}

const layerList = document.getElementById('layerList');

if (layerList) {
  layerList.addEventListener('click', (event) => {
    const item = event.target.closest('.layerItem');

    if (!item) return;

    selectLayerItem(item);
  });
}

const layerSubGroupHeaders =
  document.querySelectorAll('.layerSubGroupHeader');

layerSubGroupHeaders.forEach(header => {
  header.addEventListener('click', () => {
    const group = header.closest('.layerSubGroup');

    if (!group) return;

    group.classList.toggle('collapsed');

    header.textContent =
      group.classList.contains('collapsed')
        ? header.textContent.replace('▼', '▶')
        : header.textContent.replace('▶', '▼');
  });
});



const addLyricsBlockButton =
  document.getElementById('addLyricsBlockButton');

const lyricsBlockList =
  document.getElementById('lyricsBlockList');

const duplicateLyricsBlockButton =
// pushUndoState();
  document.getElementById('duplicateLyricsBlockButton');

const deleteLyricsBlockButton =
// pushUndoState();
  document.getElementById('deleteLyricsBlockButton');

function selectLyricsBlock(block) {
  document.querySelectorAll('.lyricsBlock').forEach(item => {
    item.classList.remove('selected');
  });

  block.classList.add('selected');

  loadLyricsBlockToInspector(block);
}

function loadLyricsBlockToInspector(block) {
  const blockId = block.dataset.blockId;
  const blocks = sectionData[currentSectionName] || [];
  const blockData = blocks.find(item => item.id === blockId);

  if (!blockData) return;

  textInput.value = blockData.text || '';
  startTimeInput.value = blockData.start || '00:00.00';
  endTimeInput.value = blockData.end || '00:03.00';
  animationPresetInput.value = blockData.animationPreset || 'fade';

  const style = blockData.style || {};

  fontInput.value = style.font || fontInput.value || 'Arial';
  sizeInput.value = style.size ?? 72;
  colorInput.value = style.color || '#ffffff';
  alignInput.value = style.align || 'center';

  outlineColorInput.value = style.outlineColor || '#000000';
  outlineWidthInput.value = style.outlineWidth ?? 0;

  shadowColorInput.value = style.shadowColor || '#000000';
  shadowBlurInput.value = style.shadowBlur ?? 0;
  shadowXInput.value = style.shadowX ?? 0;
  shadowYInput.value = style.shadowY ?? 0;

  letterSpacingInput.value = style.letterSpacing ?? 0;
  lineHeightInput.value = style.lineHeight ?? 1.2;

  sizeValue.textContent = sizeInput.value;

  outlineWidthValue.textContent = outlineWidthInput.value;
  shadowBlurValue.textContent = shadowBlurInput.value;
  shadowXValue.textContent = shadowXInput.value;
  shadowYValue.textContent = shadowYInput.value;
  letterSpacingValue.textContent = letterSpacingInput.value;
  lineHeightValue.textContent = lineHeightInput.value;

  updateEditorPreview(blockData);
}

const timingInputToggle = document.getElementById('timingInputToggle');

if (timingInputToggle) {
  timingInputToggle.addEventListener('click', () => {
    isTimingInputMode = !isTimingInputMode;

    timingInputToggle.textContent = isTimingInputMode ? 'ON' : 'OFF';
    timingInputToggle.classList.toggle('is-active', isTimingInputMode);

  if (timingShortcutGuide) {
      timingShortcutGuide.classList.toggle('is-active', isTimingInputMode);
    }

    if (!isTimingInputMode) {
    timingInputStarted = false;
    timingInputBlockIndex = -1;
  }

  });
}



function createLyricsBlockData(text = '新しい歌詞') {
  return {
    id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    start: '00:00.00',
    end: '00:03.00',
    text,
    animationPreset: 'fade',

    style: {
      font: fontInput.value || 'Arial',
      size: Number(sizeInput.value) || 72,
      color: colorInput.value || '#ffffff',
      align: alignInput.value || 'center',
      outlineColor: outlineColorInput.value || '#000000',
      outlineWidth: Number(outlineWidthInput.value) || 0,
      shadowColor: shadowColorInput.value || '#000000',
      shadowBlur: Number(shadowBlurInput.value) || 0,
      shadowX: Number(shadowXInput.value) || 0,
      shadowY: Number(shadowYInput.value) || 0,
      letterSpacing: Number(letterSpacingInput.value) || 0,
      lineHeight: Number(lineHeightInput.value) || 1.2
    },

    position: {
      x: 0,
      y: 0,
      z: 0
    },

layout: {
  width: 900,
  rotation: 0
}

  };
}

function renderSectionBlocks() {
  if (!lyricsBlockList) return;

  lyricsBlockList.innerHTML = '';

  const blocks = sectionData[currentSectionName] || [];

  blocks.forEach(blockData => {
    const block = createLyricsBlockFromData(blockData);
    lyricsBlockList.appendChild(block);
  });
}

function syncCurrentSectionOrderFromDOM() {
  if (!sectionData[currentSectionName]) return;

  const orderedIds = [...document.querySelectorAll('.lyricsBlock')]
    .map(block => block.dataset.blockId);

  sectionData[currentSectionName].sort((a, b) => {
    return orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id);
  });
}

function createLyricsBlockFromData(blockData) {

  console.log('createLyricsBlockFromData called:', blockData);


  const block = document.createElement('div');
  block.className = 'lyricsBlock';
  block.draggable = false;
  block.dataset.blockId = blockData.id;
  block.dataset.animationPreset = blockData.animationPreset || 'fade';

  const startSeconds = parseTimeToSeconds(blockData.start);
  const endSeconds = parseTimeToSeconds(blockData.end);
  const durationSeconds = Math.max(endSeconds - startSeconds, 0.5);

  const index =
    (sectionData[currentSectionName] || []).findIndex(
      item => item.id === blockData.id
    );

  block.style.position = 'absolute';
  block.style.left = `${startSeconds * timelineScale}px`;
block.style.top = `${index * TIMELINE_ROW_HEIGHT}px`;
block.style.width = `${Math.max(
  durationSeconds * timelineScale,
  TIMELINE_MIN_BLOCK_WIDTH
)}px`;

console.log('timeline block style:', {
  left: block.style.left,
  top: block.style.top,
  width: block.style.width
});

  block.innerHTML = `
    <div class="lyricsBlockTop">
      <div class="lyricsBlockMotion">
        ${getAnimationLabel(blockData.animationPreset)}
      </div>

      <div class="lyricsBlockSection">
        ${currentSectionName}
      </div>
    </div>

    <div class="lyricsTime">
      ${blockData.start} → ${blockData.end}
    </div>

    <div class="lyricsSentence">
      ${blockData.text}
    </div>

    <div class="lyricsBlockMeta">
      <span>Position X:${blockData.position.x} Y:${blockData.position.y} Z:${blockData.position.z}</span>
    </div>
    <div class="lyricsResizeHandle"></div>
  `;

  block.addEventListener('click', () => {
    selectLyricsBlock(block);
  });

  // setupLyricsBlockDrag(block);
  setupTimelineBlockDrag(block, blockData);
  setupTimelineResize(block, blockData);

  return block;
}


function setupTimelineBlockDrag(block, blockData) {
  let isDragging = false;
  let startMouseX = 0;
  let startLeft = 0;
  let durationSeconds = 0;
  let hasMoved = false;

  block.addEventListener('mousedown', (event) => {
    if (event.target.closest('.lyricsResizeHandle')) return;
    if (event.button !== 0) return;

    isDragging = true;
    hasMoved = false;

    startMouseX = event.clientX;
    startLeft = parseFloat(block.style.left) || 0;

    const startSeconds = parseTimeToSeconds(blockData.start);
    const endSeconds = parseTimeToSeconds(blockData.end);

    durationSeconds = Math.max(endSeconds - startSeconds, 0.5);

    block.classList.add('dragging');

    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('mousemove', (event) => {
    if (!isDragging) return;

    const deltaX = event.clientX - startMouseX;

    if (Math.abs(deltaX) > 3) {
      hasMoved = true;
    }

    const nextLeft = Math.max(0, startLeft + deltaX);
    block.style.left = `${nextLeft}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;
    block.classList.remove('dragging');

    if (!hasMoved) return;

    const finalLeft = parseFloat(block.style.left) || 0;
    const nextStartSeconds = finalLeft / timelineScale;
    const nextEndSeconds = nextStartSeconds + durationSeconds;

    blockData.start = formatSecondsToTime(nextStartSeconds);
    blockData.end = formatSecondsToTime(nextEndSeconds);

    startTimeInput.value = blockData.start;
    endTimeInput.value = blockData.end;

    selectLyricsBlock(block);
    updateEditorPreview();
  });
}



function setupTimelineResize(block, blockData){

    const handle =
    block.querySelector('.lyricsResizeHandle');

    if(!handle) return;

    let resizing=false;

    let startMouseX=0;

    let startWidth=0;

    let startSeconds=0;

    handle.addEventListener("mousedown",(event)=>{

        resizing=true;

        startMouseX=
        event.clientX;

        startWidth=
        block.offsetWidth;

        startSeconds=
        parseTimeToSeconds(blockData.start);

        event.stopPropagation();

        event.preventDefault();

    });

    document.addEventListener("mousemove",(event)=>{

        if(!resizing) return;

        const delta=
        event.clientX-startMouseX;

        const width=
        Math.max(
            TIMELINE_MIN_BLOCK_WIDTH,
            startWidth+delta
        );

        block.style.width=
        width+"px";

    });

    document.addEventListener("mouseup",()=>{

        if(!resizing) return;

        resizing=false;

        const width=
        parseFloat(block.style.width);

        const duration=
        width/timelineScale;

        blockData.end=
        formatSecondsToTime(
            startSeconds+duration
        );

        endTimeInput.value=
        blockData.end;

        updateEditorPreview();

    });

}



function getAnimationLabel(value) {
  if (value === 'slideUp') return 'Slide Up';
  if (value === 'zoom') return 'Zoom';
  return 'Fade';
}


if (addLyricsBlockButton && lyricsBlockList) {
  addLyricsBlockButton.addEventListener('click', () => {
    if (!sectionData[currentSectionName]) {
      sectionData[currentSectionName] = [];
    }

    const blockData = createLyricsBlockData();

    sectionData[currentSectionName].push(blockData);

    renderSectionBlocks();

    const newBlock = document.querySelector(
      `.lyricsBlock[data-block-id="${blockData.id}"]`
    );

    if (newBlock) {
      selectLyricsBlock(newBlock);
    }
  });
}

if (lyricsBlockList) {
  lyricsBlockList.addEventListener('click', (event) => {
    const block = event.target.closest('.lyricsBlock');

    if (!block) return;

    selectLyricsBlock(block);
  });
}

if (lyricsBlockList) {

}



function getSelectedLyricsBlock() {
  return document.querySelector('.lyricsBlock.selected');
}

if (duplicateLyricsBlockButton && lyricsBlockList) {
  duplicateLyricsBlockButton.addEventListener('click', () => {
    const selectedBlock = getSelectedLyricsBlock();
    if (!selectedBlock) return;

    const blockId = selectedBlock.dataset.blockId;
    const blocks = sectionData[currentSectionName] || [];
    const index = blocks.findIndex(block => block.id === blockId);

    if (index === -1) return;

    const original = blocks[index];

    const copy = {
      ...original,
      id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text: `${original.text}`
    };

    blocks.splice(index + 1, 0, copy);

    renderSectionBlocks();

    const newBlock = document.querySelector(
      `.lyricsBlock[data-block-id="${copy.id}"]`
    );

    if (newBlock) {
      selectLyricsBlock(newBlock);
    }
  });
}

if (deleteLyricsBlockButton) {
  deleteLyricsBlockButton.addEventListener('click', () => {
    const selectedBlock = getSelectedLyricsBlock();
    if (!selectedBlock) return;

    const blockId = selectedBlock.dataset.blockId;
    const blocks = sectionData[currentSectionName] || [];

    sectionData[currentSectionName] =
      blocks.filter(block => block.id !== blockId);

    renderSectionBlocks();
  });
}




function getLayerGroupByType(type) {
  if (type === 'lyrics') {
    return document.querySelector('.layerGroup:nth-of-type(2)');
  }

  if (type === 'image') {
    return [...document.querySelectorAll('.layerSubGroup')]
      .find(group => group.querySelector('.layerSubGroupHeader')?.textContent.includes('画像'));
  }

  if (type === 'video') {
    return [...document.querySelectorAll('.layerSubGroup')]
      .find(group => group.querySelector('.layerSubGroupHeader')?.textContent.includes('動画'));
  }

  if (type === 'particle') {
    return [...document.querySelectorAll('.layerSubGroup')]
      .find(group => group.querySelector('.layerSubGroupHeader')?.textContent.includes('パーティクル'));
  }

  return null;
}

function getLayerLabel(type) {
  if (type === 'image') return '画像';
  if (type === 'video') return '動画';
  if (type === 'lyrics') return '歌詞';
  if (type === 'particle') return 'パーティクル';
  return 'レイヤー';
}

function getNextLayerNumber(type) {
  const label = getLayerLabel(type);
  const count = [...document.querySelectorAll('.layerType')]
    .filter(item => item.textContent.trim() === label)
    .length;

  return count + 1;
}

function selectLayerItem(item) {
  document.querySelectorAll('.layerItem').forEach(layer => {
    layer.classList.remove('selected');
  });

  item.classList.add('selected');

  const type =
    item.querySelector('.layerType')?.textContent.trim();

  showInspectorByType(type);

  const sectionName = item.dataset.sectionName;

  if (sectionName) {
    showSection(sectionName);
  }
}

function showSection(sectionName) {
  currentSectionName = sectionName;

  if (!sectionData[currentSectionName]) {
    sectionData[currentSectionName] = [];
  }

  const sectionTitle = document.querySelector('.sectionTitle');

  if (sectionTitle) {
    sectionTitle.textContent = sectionName;
  }

  renderSectionBlocks();

const firstBlock = document.querySelector('.lyricsBlock');

if (firstBlock) {
  selectLyricsBlock(firstBlock);
}

renderSectionTabs();

}

function showInspectorByType(type) {
  document.querySelectorAll('.inspectorContent').forEach(panel => {
    panel.classList.remove('is-active');
  });

  let targetId = 'lyricsInspector';

  if (type === '背景') {
    targetId = 'backgroundInspector';
  } else if (type === '画像') {
    targetId = 'imageInspector';
  } else if (type === '動画') {
    targetId = 'videoInspector';
  } else if (type === 'パーティクル') {
    targetId = 'particleInspector';
  } else if (type === '歌詞') {
    targetId = 'lyricsInspector';
  }

  const target = document.getElementById(targetId);

  if (target) {
    target.classList.add('is-active');
  }
}

function createLayerItem(type) {
  const label = getLayerLabel(type);
  const number = getNextLayerNumber(type);

  const item = document.createElement('div');
  item.className = 'layerItem';

  item.innerHTML = `
    <div class="layerAccent"></div>
    <div class="layerInfo">
      <div class="layerName">${label} ${number}</div>
      <div class="layerType">${label}</div>
    </div>
  `;

  item.addEventListener('click', () => {
    selectLayerItem(item);
  });

  return item;
}

document.querySelectorAll('#addLayerMenu button').forEach(button => {
  button.addEventListener('click', () => {
    const type = button.dataset.layerType;
    const targetGroup = getLayerGroupByType(type);

    if (!targetGroup) return;

    const newLayer = createLayerItem(type);
    targetGroup.appendChild(newLayer);

    selectLayerItem(newLayer);

    addLayerMenu.classList.remove('is-open');
  });
});

const deleteLayerButton = document.getElementById('deleteLayerButton');

if (deleteLayerButton) {
  deleteLayerButton.addEventListener('click', () => {
    const selectedLayer = document.querySelector('.layerItem.selected');

    if (!selectedLayer) return;

    const layerType = selectedLayer.querySelector('.layerType')?.textContent.trim();

    if (layerType === '背景') {
      alert('背景レイヤーは削除できません');
      return;
    }

    selectedLayer.remove();
  });
}

loadEditorData();

const lyricsImportOverlay =
  document.getElementById('lyricsImportOverlay');

const importLyricsButton =
  document.getElementById('importLyricsButton');

if (importLyricsButton && lyricsImportOverlay) {
  importLyricsButton.addEventListener('click', () => {
    lyricsImportOverlay.classList.add('is-hidden');
  });
}


function startTimelinePlayheadLoop() {
  if (timelinePlayheadAnimationId) return;

  const loop = () => {
    updateTimelinePlayhead();
    timelinePlayheadAnimationId = requestAnimationFrame(loop);
  };

  loop();
}

function stopTimelinePlayheadLoop() {
  if (!timelinePlayheadAnimationId) return;

  cancelAnimationFrame(timelinePlayheadAnimationId);
  timelinePlayheadAnimationId = null;
}

function syncSelectedBlockDataFromInspector() {
  const selectedBlock = document.querySelector('.lyricsBlock.selected');
  if (!selectedBlock) return;

  const blockId = selectedBlock.dataset.blockId;

  Object.values(sectionData).forEach(blocks => {
    (blocks || []).forEach(block => {
      if (block.id !== blockId) return;

      block.text = textInput.value;
      block.start = startTimeInput.value;
      block.end = endTimeInput.value;
      block.animationPreset = animationPresetInput.value;
      block.style = getCurrentInspectorStyle();

      if (!block.position) {
        block.position = { x: 0, y: 0, z: 0 };
      }

      console.log('STYLE SAVED TO BLOCK:', block);
    });
  });
}

function getCurrentInspectorStyle() {
  return {
    font: fontInput.value || 'Arial',
    size: Number(sizeInput.value) || 72,
    color: colorInput.value || '#ffffff',
    align: alignInput.value || 'center',
    outlineColor: outlineColorInput.value || '#000000',
    outlineWidth: Number(outlineWidthInput.value) || 0,
    shadowColor: shadowColorInput.value || '#000000',
    shadowBlur: Number(shadowBlurInput.value) || 0,
    shadowX: Number(shadowXInput.value) || 0,
    shadowY: Number(shadowYInput.value) || 0,
    letterSpacing: Number(letterSpacingInput.value) || 0,
    lineHeight: Number(lineHeightInput.value) || 1.2
  };
}



function getEditorPreviewScale() {
  const stage = document.getElementById('editorPreviewStage');
  if (!stage) return 1;

  const BASE_WIDTH = 1080;
  const BASE_HEIGHT = 1920;

  const rect = stage.getBoundingClientRect();

  return Math.min(
    rect.width / BASE_WIDTH,
    rect.height / BASE_HEIGHT
  );
}


function applyPreviewLyricsPosition(blockData) {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return;

  const position = blockData?.position || { x: 0, y: 0 };

  previewLyrics.style.transform =
    `translate(-50%, -50%) translate(${Number(position.x) || 0}px, ${Number(position.y) || 0}px)`;
}


function sendLyricsBlockToVisualizer(block) {

const payloads = safeBlocks
  .map(block => buildLyricsPayloadForVisualizer(block))
  .filter(Boolean);
  
  if (!block) return;

  /*
   * 再生中は単体で送らない。
   * 現在時刻に表示対象となる全ブロックを送る。
   */
  if (
    editorAudio &&
    editorAudioReady &&
    !editorAudio.paused
  ) {
    const activeBlocks = getCurrentEditorLyricsBlocks();

    sendLyricsBlocksToVisualizer(activeBlocks);
    return;
  }

  /*
   * 停止中の編集操作では、選択中ブロックを単体表示する。
   */
  const payload =
    buildLyricsPayloadForVisualizer(block);

  lastSentPreviewLyricsSignature = '';

  ipcRenderer.invoke(
    'send-lyrics-to-visualizer',
    {
      source: 'lyrics-editor',
      blocks: [payload]
    }
  );
}


function sendLyricsBlocksToVisualizer(blocks) {
  const safeBlocks = Array.isArray(blocks)
    ? blocks.filter(Boolean)
    : [];

  const payloads = safeBlocks
    .map(block => buildLyricsPayloadForVisualizer(block))
    .filter(Boolean);

  const signature = JSON.stringify(payloads);

  if (signature === lastSentPreviewLyricsSignature) {
    return;
  }

  lastSentPreviewLyricsSignature = signature;

  console.log(
    'EDITOR SEND MULTIPLE:',
    payloads.length,
    payloads
  );

  ipcRenderer.invoke(
    'send-lyrics-to-visualizer',
    {
      source: 'lyrics-editor',
      blocks: payloads
    }
  );
}


function resizeEditorPreviewCanvas() {
  const stage = document.getElementById('editorPreviewStage');
  const canvas = document.getElementById('editorPreviewCanvas');

  if (!stage || !canvas) return;

  const isWide = stage.classList.contains('ratio-16-9');

  const baseWidth = isWide ? 1920 : 1080;
  const baseHeight = isWide ? 1080 : 1920;

  canvas.style.width = `${baseWidth}px`;
  canvas.style.height = `${baseHeight}px`;

  const rect = stage.getBoundingClientRect();

  const scale = Math.min(
    rect.width / baseWidth,
    rect.height / baseHeight
  );

  canvas.style.setProperty('--editor-preview-canvas-scale', String(scale));
}

window.addEventListener('resize', resizeEditorPreviewCanvas);



function ensureLyricsSelectionBox() {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return null;

  let box = previewLyrics.querySelector('.lyricsSelectionBox');

  if (!box) {
    box = document.createElement('div');
    box.className = 'lyricsSelectionBox';

    ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].forEach(position => {
      const handle = document.createElement('div');
      handle.className = `selectionHandle ${position}`;
      handle.dataset.handle = position;
      box.appendChild(handle);
    });

    /*-----------------------
　左右ハンドル追加
   ------------------------*/

['left', 'right'].forEach(side => {
  const handle = document.createElement('div');
  handle.className = `selectionSideHandle ${side}`;
  handle.dataset.sideHandle = side;
  box.appendChild(handle);
});


    previewLyrics.appendChild(box);
  }

  return box;
}







function setupLyricsSelectionResize() {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return;

  let resizing = false;
  let startMouseX = 0;
  let startFontSize = 72;
  let targetBlock = null;

  document.addEventListener('mousedown', (event) => {
    const handle = event.target.closest('.selectionHandle.bottomRight');
    if (!handle) return;

    targetBlock = getSelectedLyricsBlockData();
    if (!targetBlock) return;

    resizing = true;

    startMouseX = event.clientX;
    startFontSize = Number(targetBlock.style?.size || 72);

    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('mousemove', (event) => {
    if (!resizing || !targetBlock) return;

    const dx = event.clientX - startMouseX;

    const newSize = Math.max(10, Math.round(startFontSize + dx));

    targetBlock.style.size = newSize;

    sizeInput.value = newSize;

    updateEditorPreview(targetBlock);
    sendLyricsBlockToVisualizer(targetBlock);
  });

  document.addEventListener('mouseup', () => {
    resizing = false;
    targetBlock = null;
  });
}

/*--------------------
  横幅リサイズ関数を追加
--------------------*/

let activeSide = null;

function setupLyricsWidthResize() {
  let resizing = false;
  let startMouseX = 0;
  let startWidth = 900;
  let targetBlock = null;

  document.addEventListener('mousedown', (event) => {
    const handle = event.target.closest('.selectionSideHandle');
    if (!handle) return;

    targetBlock = getSelectedLyricsBlockData();
    if (!targetBlock) return;

    if (!targetBlock.layout) {
      targetBlock.layout = { width: 900 };
    }

    resizing = true;
    startMouseX = event.clientX;
    startWidth = Number(targetBlock.layout.width) || 900;
    activeSide = handle.dataset.sideHandle;

    event.preventDefault();
    event.stopPropagation();

    
  });

  document.addEventListener('mousemove', (event) => {
  if (!resizing || !targetBlock) return;

  const dx = event.clientX - startMouseX;
  const side = activeSide;

  let newWidth = startWidth;

  if (side === 'right') {
    newWidth = startWidth + dx;
  }

  if (side === 'left') {
    newWidth = startWidth - dx;
  }

  newWidth = Math.max(80, Math.round(newWidth));

  targetBlock.layout.width = newWidth;

  updateEditorPreview(targetBlock);
  sendLyricsBlockToVisualizer(targetBlock);
});

  document.addEventListener('mouseup', () => {
    resizing = false;
    targetBlock = null;
    activeSide = null;
  });
}




function setupTimelineSeekByClick() {
  const trackArea = document.querySelector('.timelineScrollArea');
  const timelineContent = document.getElementById('lyricsBlockList');

  if (!trackArea || !timelineContent) return;

  timelineContent.addEventListener('mousedown', (event) => {
    if (event.target.closest('.lyricsBlock')) return;
    if (event.target.closest('#timelinePlayhead')) return;
    if (!editorAudio || !editorAudioReady) return;

    autoFollowPlayhead = true;

    const rect = timelineContent.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const nextTime = Math.max(0, x / timelineScale);

    editorAudio.currentTime = nextTime;

    updateTimelinePlayhead();
    updateEditorPreviewByTimeline();

    event.preventDefault();
  });
}


function setupTimelinePlayheadDrag() {
  const playhead = document.getElementById('timelinePlayhead');
  const trackArea = document.querySelector('.timelineScrollArea');
  if (!playhead || !trackArea) return;

  playhead.addEventListener('mousedown', (event) => {
    if (!editorAudio || !editorAudioReady) return;

    isDraggingPlayhead = true;
    autoFollowPlayhead = true;

    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('mousemove', (event) => {
    if (!isDraggingPlayhead) return;

    const rect = trackArea.getBoundingClientRect();

    const EDGE_SIZE = 60;
    const SCROLL_SPEED = 22;

    if (event.clientX > rect.right - EDGE_SIZE) {
      trackArea.scrollLeft += SCROLL_SPEED;
    }

    if (event.clientX < rect.left + EDGE_SIZE) {
      trackArea.scrollLeft = Math.max(0, trackArea.scrollLeft - SCROLL_SPEED);
    }

    const scrollLeft = trackArea.scrollLeft || 0;
    const x = event.clientX - rect.left + scrollLeft;
    const nextTime = Math.max(0, x / timelineScale);

    editorAudio.currentTime = nextTime;

    updateTimelinePlayhead();
    updateEditorPreviewByTimeline();
  });

  document.addEventListener('mouseup', () => {
    if (!isDraggingPlayhead) return;

    isDraggingPlayhead = false;
    autoFollowPlayhead = true;
  });
}

function setupTimelineManualScrollDetection() {
  const trackArea = document.querySelector('.timelineTrackArea');
  if (isAutoScrollingTimeline) return;
  if (!trackArea) return;

  trackArea.addEventListener('scroll', () => {
    if (isDraggingPlayhead) return;

    isUserScrollingTimeline = true;
    autoFollowPlayhead = false;

    clearTimeout(timelineScrollTimer);

    timelineScrollTimer = setTimeout(() => {
      isUserScrollingTimeline = false;
    }, 300);
  });
}




function setTimelineZoom(nextScale) {
  const scrollArea = document.querySelector('.timelineScrollArea');

  const currentTime =
    editorAudio && Number.isFinite(editorAudio.currentTime)
      ? editorAudio.currentTime
      : 0;

  const oldScale = timelineScale;

  timelineScale = Math.min(
    TIMELINE_SCALE_MAX,
    Math.max(TIMELINE_SCALE_MIN, nextScale)
  );

  const playheadRatio =
    scrollArea
      ? (currentTime * oldScale - scrollArea.scrollLeft) / scrollArea.clientWidth
      : 0.5;

  renderSectionBlocks();
  updateTimelineContentWidth();
  renderTimelineRuler();
  updateTimelinePlayhead();

  if (scrollArea) {
    scrollArea.scrollLeft =
      currentTime * timelineScale - scrollArea.clientWidth * playheadRatio;
  }
}


function setupTimelineZoomByWheel() {
  const trackArea = document.querySelector('.timelineScrollArea');
  if (!trackArea) return;

  trackArea.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();

    const zoomStep = event.deltaY < 0 ? 10 : -10;
    setTimelineZoom(timelineScale + zoomStep);
  }, { passive: false });
}

function getTimelineRulerStep() {
  if (timelineScale < 40) return 30;
  if (timelineScale < 80) return 10;
  if (timelineScale < 150) return 5;
  if (timelineScale < 250) return 1;
  return 0.5;
}


function renderTimelineRuler() {
  const ruler = document.querySelector('.timelineRuler');
  const gridLines=document.getElementById("timelineGridLines");

gridLines.innerHTML="";

  if (!ruler || !editorAudio || !Number.isFinite(editorAudio.duration)) return;

  ruler.innerHTML = '';

  const duration = editorAudio.duration;
  const step = getTimelineRulerStep();

  const totalWidth = getTimelineTotalWidth();

  ruler.style.position = 'relative';
  ruler.style.width = `${totalWidth}px`;

  for (let time = 0; time <= duration; time += step) {
    const mark = document.createElement('div');
    const line=document.createElement("div");

line.className="timelineGridLine";

line.style.left=`${time*timelineScale}px`;

gridLines.appendChild(line);
    mark.className = 'timelineRulerMark';

    mark.style.position = 'absolute';
    mark.style.left = `${time * timelineScale}px`;

    mark.textContent = formatEditorTime(time).replace('.00', '');

    ruler.appendChild(mark);
  }

  updateTimelineContentWidth();
}

function getTimelineTotalWidth() {
  if (!editorAudio || !Number.isFinite(editorAudio.duration)) return 1600;

  return Math.max(
    1600,
    editorAudio.duration * timelineScale + 800
  );
}

function updateTimelineContentWidth() {
  const timelineContent = document.getElementById('timelineContent');
  const lyricsBlockList = document.getElementById('lyricsBlockList');
  const width = getTimelineTotalWidth();

  if (timelineContent) {
    timelineContent.style.width = `${width}px`;
    timelineContent.style.minWidth = `${width}px`;
  }

  if (lyricsBlockList) {
    lyricsBlockList.style.width = `${width}px`;
    lyricsBlockList.style.minWidth = `${width}px`;
  }
}


/*
function undoEditorAction() {
  if (undoStack.length === 0) return;

  redoStack.push(cloneEditorState());

  const previousState = undoStack.pop();
  restoreEditorState(previousState);
}
*/

/*
function redoEditorAction() {
  if (redoStack.length === 0) return;

  undoStack.push(cloneEditorState());

  const nextState = redoStack.pop();
  restoreEditorState(nextState);
}
*/

/*
document.addEventListener('keydown', (event) => {
  const isModifier = event.ctrlKey || event.metaKey;

  if (!isModifier) return;

  const key = event.key.toLowerCase();

  if (key === 'z') {
    event.preventDefault();
    undoEditorAction();
  }

  if (key === 'y') {
    event.preventDefault();
    redoEditorAction();
  }
});
*/

function setupLyricsRotationHandle() {
  let rotating = false;
  let targetBlock = null;
  let startAngle = 0;
  let startRotation = 0;

  document.addEventListener('mousedown', (event) => {
    const handle = event.target.closest('.selectionHandle.topRight');
    if (!handle) return;

    const previewLyrics = document.getElementById('editorPreviewLyrics');
    if (!previewLyrics) return;

    targetBlock = getSelectedLyricsBlockData();
    if (!targetBlock) return;

    if (!targetBlock.layout) {
      targetBlock.layout = { width: 900, rotation: 0 };
    }

    const rect = previewLyrics.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    startRotation = Number(targetBlock.layout.rotation) || 0;

    rotating = true;

    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('mousemove', (event) => {
    if (!rotating || !targetBlock) return;

    const previewLyrics = document.getElementById('editorPreviewLyrics');
    if (!previewLyrics) return;

    const rect = previewLyrics.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    const deltaDeg = (currentAngle - startAngle) * 180 / Math.PI;

    targetBlock.layout.rotation = Math.round(startRotation + deltaDeg);

    updateEditorPreview(targetBlock);
    sendLyricsBlockToVisualizer(targetBlock);
  });

  document.addEventListener('mouseup', () => {
    rotating = false;
    targetBlock = null;
  });
}

let latestParsedLyrics = null;
let lyricsImportStep = 'analyze';


function parseImportedLyrics(rawText, options = {}) {
  const detectSection = options.detectSection ?? true;
  const blockMode = options.blockMode || 'blankLine';

  const lines = String(rawText || '').split(/\r?\n/);

  const result = {};
  let currentSection = 'Verse 1';
  let buffer = [];

  function ensureSection(sectionName) {
    if (!result[sectionName]) {
      result[sectionName] = [];
    }
  }

  function flushBuffer() {
    const text = buffer.join('\n').trim();
    if (!text) return;

    ensureSection(currentSection);
    result[currentSection].push(text);
    buffer = [];
  }

  lines.forEach(line => {
    const trimmed = line.trim();

    const sectionMatch = detectSection
      ? trimmed.match(/^\[(.+?)\]$/)
      : null;

    if (sectionMatch) {
      flushBuffer();
      currentSection = sectionMatch[1].trim();
      ensureSection(currentSection);
      return;
    }

    if (blockMode === 'line') {
      if (trimmed !== '') {
        ensureSection(currentSection);
        result[currentSection].push(line.trim());
      }
      return;
    }

    if (blockMode === 'blankLine' && trimmed === '') {
      flushBuffer();
      return;
    }

    buffer.push(line);
  });

  flushBuffer();

  return result;
}


function importParsedLyricsToEditor() {
  if (!latestParsedLyrics) return;

  Object.keys(sectionData).forEach(key => {
    delete sectionData[key];
  });

  Object.entries(latestParsedLyrics).forEach(([sectionName, texts]) => {
    sectionData[sectionName] = texts.map((text, index) => {
      const block = createLyricsBlockData(text);

      const startSeconds = index * 3;
      const endSeconds = startSeconds + 3;

      block.start = formatSecondsToTime(startSeconds);
      block.end = formatSecondsToTime(endSeconds);

      return block;
    });
  });

  const sectionNames = Object.keys(sectionData);
currentSectionName = sectionNames[0] || 'Verse 1';

closeLyricsImportDialog();
showSection(currentSectionName);
}


function renderSectionTabs() {
  const container = document.getElementById('sectionTabs');
  if (!container) return;

  container.innerHTML = '';

  Object.keys(sectionData).forEach(sectionName => {
    const tab = document.createElement('button');
    tab.className = 'sectionTab';
    tab.textContent = sectionName;

    if (sectionName === currentSectionName) {
      tab.classList.add('active');
    }

    let sectionTabClickTimer = null;

    tab.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (sectionTabClickTimer) {
        clearTimeout(sectionTabClickTimer);
        sectionTabClickTimer = null;
        renameSection(sectionName);
        return;
      }

      sectionTabClickTimer = setTimeout(() => {
        showSection(sectionName);
        sectionTabClickTimer = null;
      }, 220);
    });

    container.appendChild(tab);
  });

  const addButton = document.createElement('button');
  addButton.className = 'sectionTab sectionTabAdd';
  addButton.textContent = '+';

  addButton.addEventListener('click', () => {
    const name = prompt('セクション名を入力してください', 'New Section');
    if (!name) return;

    if (!sectionData[name]) {
      sectionData[name] = [];
    }

    showSection(name);
  });

  container.appendChild(addButton);
}


function renameSection(oldName) {
  const newName = prompt('セクション名を変更', oldName);

  if (!newName) return;
  if (newName === oldName) return;

  if (sectionData[newName]) {
    alert('同じ名前のセクションがすでにあります。');
    return;
  }

  sectionData[newName] = sectionData[oldName] || [];
  delete sectionData[oldName];

  if (currentSectionName === oldName) {
    currentSectionName = newName;
  }

  showSection(currentSectionName);
}



function isTypingInInputElement() {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement?.isContentEditable
  );
}

function getSelectedLyricsBlockIndex() {
  const selectedBlock = document.querySelector('.lyricsBlock.selected');
  if (!selectedBlock) return -1;

  const blockId = selectedBlock.dataset.blockId;
  const blocks = sectionData[currentSectionName] || [];

  return blocks.findIndex(block => block.id === blockId);
}

function selectLyricsBlockByIndex(index) {
  const blocks = sectionData[currentSectionName] || [];
  const blockData = blocks[index];

  if (!blockData) return;

  renderSectionBlocks();

  const blockElement = document.querySelector(
    `.lyricsBlock[data-block-id="${blockData.id}"]`
  );

  if (blockElement) {
    selectLyricsBlock(blockElement);
  }
}

function ensureBlockEndAfterStart(block, startSeconds) {
  const currentEnd = parseTimeToSeconds(block.end);

  if (currentEnd <= startSeconds) {
    block.end = formatSecondsToTime(startSeconds + 0.5);
  }
}


function handleTimingInputB() {
  if (!editorAudio || !editorAudioReady) return;

  const blocks = sectionData[currentSectionName] || [];
  if (blocks.length === 0) return;

  const currentSeconds = editorAudio.currentTime;
  const currentTimeText = formatSecondsToTime(currentSeconds);

  // 最初のB
  if (!timingInputStarted) {
    const selectedIndex = getSelectedLyricsBlockIndex();

    timingInputBlockIndex =
      selectedIndex >= 0 ? selectedIndex : 0;

    const block = blocks[timingInputBlockIndex];

    block.start = currentTimeText;
    ensureBlockEndAfterStart(block, currentSeconds);

    timingInputStarted = true;

    selectLyricsBlockByIndex(timingInputBlockIndex);

    if (editorAudio.paused) {
      editorAudio.play();
    }

    return;
  }

  // 2回目以降のB
  const currentBlock = blocks[timingInputBlockIndex];
  const nextBlock = blocks[timingInputBlockIndex + 1];

  if (!currentBlock || !nextBlock) {
    console.warn('最後のブロックです。終了位置ではEを押してください。');
    return;
  }

  // 現在ブロック終了
  currentBlock.end = currentTimeText;

  // 次ブロック開始
  timingInputBlockIndex += 1;

  nextBlock.start = currentTimeText;
  ensureBlockEndAfterStart(nextBlock, currentSeconds);

  selectLyricsBlockByIndex(timingInputBlockIndex);
}


function handleTimingInputE() {
  if (!editorAudio || !editorAudioReady) return;
  if (!timingInputStarted) return;

  const blocks = sectionData[currentSectionName] || [];
  const completedBlockIndex = timingInputBlockIndex;
  const currentBlock = blocks[completedBlockIndex];

  if (!currentBlock) return;

  // 最後のブロックの終了時間を確定
  currentBlock.end =
    formatSecondsToTime(editorAudio.currentTime);

  const completedSectionName = currentSectionName;
  const sectionNames = Object.keys(sectionData);
  const currentSectionIndex =
    sectionNames.indexOf(completedSectionName);

  const nextSectionName =
    sectionNames[currentSectionIndex + 1] || null;

  editorAudio.pause();

  timingInputStarted = false;
  timingInputBlockIndex = -1;

  if (nextSectionName) {
    // 次のセクションへ移動
    showSection(nextSectionName);

    const nextBlocks = sectionData[nextSectionName] || [];

    // 次セクションの先頭ブロックを選択して待機
    if (nextBlocks.length > 0) {
      const firstBlockElement = document.querySelector(
        `.lyricsBlock[data-block-id="${nextBlocks[0].id}"]`
      );

      if (firstBlockElement) {
        selectLyricsBlock(firstBlockElement);
      }
    }

    console.log(
      `セクション完了：${completedSectionName} → ${nextSectionName}で待機`
    );

    return;
  }

  // 最終セクションでは最後のブロックを選択したまま終了
  selectLyricsBlockByIndex(completedBlockIndex);

  console.log('全セクションのタイミング入力が完了しました');
}


document.addEventListener('keydown', (event) => {
  if (!isTimingInputMode) return;
  if (isTypingInInputElement()) return;
  if (event.repeat) return;

  if (event.code === 'Space') {
    event.preventDefault();

    if (!editorAudio || !editorAudioReady) return;

    if (editorAudio.paused) {
      editorAudio.play();
    } else {
      editorAudio.pause();
    }

    return;
  }

  if (event.key.toLowerCase() === 'b') {
    event.preventDefault();
    handleTimingInputB();
    return;
  }

  if (event.key.toLowerCase() === 'e') {
    event.preventDefault();
    handleTimingInputE();
  }
});



setupPreviewLyricsDrag();
resizeEditorPreviewCanvas();
setupLyricsSelectionResize();
setupTimelineSeekByClick();
setupTimelinePlayheadDrag();
setupTimelineManualScrollDetection();
setupTimelineZoomByWheel();
setupInlineLyricsTextEdit();
setupLyricsWidthResize(); // 左右ハンドル
setupLyricsRotationHandle(); // 右上回転ハンドル