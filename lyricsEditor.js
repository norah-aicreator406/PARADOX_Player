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
const animationDescription = document.getElementById('lyricsAnimationDescription');

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
const TIMING_GUIDE_POSITION_KEY =
  'norahStudioTimingGuidePosition';

let timingGuidePanel = null;
let lastEditorActiveLyricsSignature = '';
let previousEditorActiveLyricsIds = new Set();





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
const inDurationInput =
  document.getElementById(
    'lyricsInDuration'
  );

const inDurationValue =
  document.getElementById(
    'lyricsInDurationValue'
  );

const holdPresetInput =
  document.getElementById(
    'lyricsHoldPreset'
  );

const holdSpeedInput =
  document.getElementById(
    'lyricsHoldSpeed'
  );

const holdSpeedValue =
  document.getElementById(
    'lyricsHoldSpeedValue'
  );

const holdStrengthInput =
  document.getElementById(
    'lyricsHoldStrength'
  );

const holdStrengthValue =
  document.getElementById(
    'lyricsHoldStrengthValue'
  );

const outPresetInput =
  document.getElementById(
    'lyricsOutPreset'
  );

const outDurationInput =
  document.getElementById(
    'lyricsOutDuration'
  );

const outDurationValue =
  document.getElementById(
    'lyricsOutDurationValue'
  );

const applyInAnimationButton =
  document.getElementById(
    'applyInAnimationButton'
  );

const applyHoldAnimationButton =
  document.getElementById(
    'applyHoldAnimationButton'
  );

const applyOutAnimationButton =
  document.getElementById(
    'applyOutAnimationButton'
  );
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
    blockData.animation =
  getNormalizedLyricsAnimation(
    blockData
  );

blockData.animation.in = {
  preset:
    animationPresetInput.value,

  duration:
    Number(
      inDurationInput.value
    ) || 0.5
};
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

function updateEditorPreview(
  targetBlockData = null,
  options = {}
) {
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
  ...getNormalizedLyricsAnimation(
    blockData || {
      animationPreset:
        animationPresetInput.value,

      animation: {
        in: {
          preset:
            animationPresetInput.value,

          duration:
            Number(
              inDurationInput.value
            ) || 0.5
        },

        hold: {
          preset:
            holdPresetInput.value,

          speed:
            Number(
              holdSpeedInput.value
            ) || 1,

          strength:
            Number(
              holdStrengthInput.value
            ) || 12
        },

        out: {
          preset:
            outPresetInput.value,

          duration:
            Number(
              outDurationInput.value
            ) || 0.5
        }
      }
    }
  )
}
  };

 window.LyricsRenderer.render(previewLyrics, payload);

 if (options.animate !== false) {
  applyEditorLyricsAnimation(
    previewLyrics,
    payload.animation
  );
} else {
  const motionWrapper =
    previewLyrics.querySelector('.lyricsMotionWrapper');

  if (motionWrapper) {
    motionWrapper.classList.remove(
  'lyrics-motion-fade',
  'lyrics-motion-slide-up',
  'lyrics-motion-slide-down',
  'lyrics-motion-slide-left',
  'lyrics-motion-slide-right',
  'lyrics-motion-zoom',
  'lyrics-motion-blur-in',
   'lyrics-motion-rotate-in',
  'lyrics-motion-bounce-in',
  'lyrics-motion-glitch',
  'lyrics-motion-neon-flicker'
);

motionWrapper.style.opacity = '1';
motionWrapper.style.transform = 'none';
motionWrapper.style.filter = 'none';
  }
}
 
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

const selectedLyricsBlockIds = new Set();
let lastSelectedLyricsBlockId = null;
let currentEditorSong = null;
let currentProjectPath = null;
let editorAudio = null;
let editorAudioReady = false;

const EDITOR_STORAGE_KEY = 'norahStudioEditorData';

textInput.addEventListener('input', sendLyricsUpdate);
animationPresetInput.addEventListener('change', () => {

updateAnimationDescription();

  const selectedCount = selectedLyricsBlockIds.size;

  // 複数選択中は、ボタンを押すまで保存しない
  if (selectedCount > 1) {
    return;
  }

  sendLyricsUpdate();
});
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

inDurationInput?.addEventListener(
  'input',
  updateAnimationControlValues
);

holdSpeedInput?.addEventListener(
  'input',
  updateAnimationControlValues
);

holdStrengthInput?.addEventListener(
  'input',
  updateAnimationControlValues
);

outDurationInput?.addEventListener(
  'input',
  updateAnimationControlValues
);

updateAnimationControlValues();



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


function getTimelineScrollArea() {
  return document.querySelector(
    '.timelineScrollArea'
  );
}


function updateTimelinePlayhead() {
  if (!editorAudio) return;

  const playhead = document.getElementById('timelinePlayhead');
  const currentTimeLabel = document.getElementById('editorCurrentTime');
  const seekBar = document.getElementById('editorSeekBar');

  if (playhead) {
  const x =
    editorAudio.currentTime *
    timelineScale;

  playhead.style.left = `${x}px`;

  followTimelinePlayheadHorizontally();
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


function followTimelinePlayheadHorizontally() {
  if (!editorAudio) return;
  if (!autoFollowPlayhead) return;
  if (isDraggingPlayhead) return;

  const scrollArea =
    getTimelineScrollArea();

  if (!scrollArea) return;

  const playheadX =
    editorAudio.currentTime * timelineScale;

  const visibleLeft =
    scrollArea.scrollLeft;

  const visibleRight =
    visibleLeft + scrollArea.clientWidth;

  /*
   * 赤バーが右端ギリギリまで行く前に
   * 横スクロールを開始する。
   */
  const rightMargin = 160;

  /*
   * 巻き戻した際の左側余白。
   */
  const leftMargin = 80;

  if (
    playheadX >
    visibleRight - rightMargin
  ) {
    const nextScrollLeft =
      playheadX -
      scrollArea.clientWidth +
      rightMargin;

    isAutoScrollingTimeline = true;

    scrollArea.scrollLeft =
      Math.max(0, nextScrollLeft);

    requestAnimationFrame(() => {
      isAutoScrollingTimeline = false;
    });

    return;
  }

  if (
    playheadX <
    visibleLeft + leftMargin
  ) {
    const nextScrollLeft =
      playheadX - leftMargin;

    isAutoScrollingTimeline = true;

    scrollArea.scrollLeft =
      Math.max(0, nextScrollLeft);

    requestAnimationFrame(() => {
      isAutoScrollingTimeline = false;
    });
  }
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
  const layer =
    document.getElementById('editorPreviewLyricsLayer');

  const mainLyrics =
    document.getElementById('editorPreviewLyrics');

  if (!layer || !mainLyrics) return;

  const nextActiveIds = new Set(
    blocks.map(block => block.id)
  );

  const newlyActiveIds = new Set(
    [...nextActiveIds].filter(
      id => !previousEditorActiveLyricsIds.has(id)
    )
  );

  layer.innerHTML = '';

  if (!blocks.length) {
    mainLyrics.innerHTML = '';
    previousEditorActiveLyricsIds = new Set();
    return;
  }

  const selectedBlockData =
    getSelectedLyricsBlockData();

  const primaryBlock =
    blocks.find(
      block => block.id === selectedBlockData?.id
    ) ||
    blocks[blocks.length - 1];

  /*
   * すでに表示中だった歌詞が
   * サブ表示からメイン表示へ移っただけなら、
   * アニメーションを再実行しない。
   */
  updateEditorPreview(
    primaryBlock,
    {
      animate: newlyActiveIds.has(primaryBlock.id)
    }
  );

  textInput.value = primaryBlock.text || '';
  startTimeInput.value =
    primaryBlock.start || '00:00.00';
  endTimeInput.value =
    primaryBlock.end || '00:03.00';

  animationPresetInput.value =
    primaryBlock.animationPreset || 'fade';

  blocks.forEach(block => {
    if (block.id === primaryBlock.id) return;

    const item = document.createElement('div');

    item.className =
      'editorPreviewLyricsItem';

    item.dataset.blockId = block.id;

    item.style.zIndex =
      String(Number(block.position?.z) || 0);

    layer.appendChild(item);

    const payload =
      buildLyricsPayloadForVisualizer(block);

    window.LyricsRenderer.render(
      item,
      payload
    );

    if (newlyActiveIds.has(block.id)) {
      applyEditorLyricsAnimation(
        item,
        payload.animation
      );
    } else {
      const motionWrapper =
        item.querySelector('.lyricsMotionWrapper');

      if (motionWrapper) {
        motionWrapper.style.opacity = '1';
        motionWrapper.style.transform = 'none';
      }
    }
  });

  previousEditorActiveLyricsIds =
    nextActiveIds;
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

  const signature = currentBlocks
    .map(block => block.id)
    .join('|');

  // 同じ歌詞構成なら再描画しない
  if (signature === lastEditorActiveLyricsSignature) {
    return;
  }

  lastEditorActiveLyricsSignature = signature;

  if (currentBlocks.length === 0) {
    previousEditorActiveLyricsIds = new Set();
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

    if (lastSentPreviewLyricsSignature !== '[]') {
      lastSentPreviewLyricsSignature = '[]';

      ipcRenderer.invoke(
        'send-lyrics-to-visualizer',
        null
      );
    }

    return;
  }

  renderEditorActiveLyrics(currentBlocks);
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
  lastEditorActiveLyricsSignature = '';

  /*
   * 再生開始時は、
   * 現在の赤バー位置への追従を再開する。
   */
  autoFollowPlayhead = true;

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

  document.addEventListener('mousemove', event => {
  if (!isResizingTimeline) return;

  const windowHeight =
    window.innerHeight;

  const newTimelineHeight =
    windowHeight - event.clientY;

  const clampedHeight =
    Math.min(
      Math.max(newTimelineHeight, 180),
      560
    );

  editorApp.style.gridTemplateRows =
    `minmax(0, 1fr) 8px ${clampedHeight}px`;

  requestAnimationFrame(() => {
    updateTimelineContentHeight();
    resizeEditorPreviewCanvas();
  });
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

function selectLyricsBlock(
  block,
  {
    additive = false,
    range = false
  } = {}
) {
  if (!block) return;

  const blockId = block.dataset.blockId;
  if (!blockId) return;

  const blocks = sectionData[currentSectionName] || [];

  // Shift＋クリック：直前選択から範囲選択
  if (
    range &&
    lastSelectedLyricsBlockId
  ) {
    const startIndex = blocks.findIndex(
      item => item.id === lastSelectedLyricsBlockId
    );

    const endIndex = blocks.findIndex(
      item => item.id === blockId
    );

    if (startIndex !== -1 && endIndex !== -1) {
      const from = Math.min(startIndex, endIndex);
      const to = Math.max(startIndex, endIndex);

      // Shift単独なら既存選択を解除して範囲だけ選択
      if (!additive) {
        selectedLyricsBlockIds.clear();
      }

      for (let index = from; index <= to; index += 1) {
        selectedLyricsBlockIds.add(blocks[index].id);
      }
    }
  }

  // Command / Ctrl＋クリック：個別追加・解除
  else if (additive) {
    if (selectedLyricsBlockIds.has(blockId)) {
      selectedLyricsBlockIds.delete(blockId);
    } else {
      selectedLyricsBlockIds.add(blockId);
    }

    lastSelectedLyricsBlockId = blockId;
  }

  // 通常クリック：1件だけ選択
  else {
    selectedLyricsBlockIds.clear();
    selectedLyricsBlockIds.add(blockId);
    lastSelectedLyricsBlockId = blockId;
  }

  applyLyricsBlockSelectionClasses();

  // 最後にクリックしたブロックをInspectorの代表にする
  if (selectedLyricsBlockIds.has(blockId)) {
    loadLyricsBlockToInspector(block);
  }
}


function applyLyricsBlockSelectionClasses() {
  document
    .querySelectorAll('.lyricsBlock')
    .forEach(block => {
      const blockId = block.dataset.blockId;

      block.classList.toggle(
        'selected',
        selectedLyricsBlockIds.has(blockId)
      );
    });
}



function loadLyricsBlockToInspector(block) {
  const blockId = block.dataset.blockId;
  const blocks = sectionData[currentSectionName] || [];
  const blockData = blocks.find(item => item.id === blockId);

  if (!blockData) return;

  textInput.value = blockData.text || '';
  startTimeInput.value = blockData.start || '00:00.00';
  endTimeInput.value = blockData.end || '00:03.00';
  const animation =
  getNormalizedLyricsAnimation(
    blockData
  );

animationPresetInput.value =
  animation.in.preset;

inDurationInput.value =
  String(animation.in.duration);

holdPresetInput.value =
  animation.hold.preset;

holdSpeedInput.value =
  String(animation.hold.speed);

holdStrengthInput.value =
  String(animation.hold.strength);

outPresetInput.value =
  animation.out.preset;

outDurationInput.value =
  String(animation.out.duration);

updateAnimationControlValues();
updateAnimationDescription();

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

    timingInputToggle.textContent =
      isTimingInputMode
        ? 'ON'
        : 'OFF';

    timingInputToggle.classList.toggle(
      'is-active',
      isTimingInputMode
    );

    if (
      typeof timingShortcutGuide !== 'undefined' &&
      timingShortcutGuide
    ) {
      timingShortcutGuide.classList.toggle(
        'is-active',
        isTimingInputMode
      );
    }

    if (isTimingInputMode) {
      showTimingGuidePanel();
      return;
    }

    timingInputStarted = false;
    timingInputBlockIndex = -1;

    hideTimingGuidePanel();
  });
}



function createLyricsBlockData(text = '新しい歌詞') {
  return {
    id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    start: '00:00.00',
    end: '00:03.00',
    text,
    animationPreset: 'fade',
    animation: {
  in: {
    preset: 'fade',
    duration: 0.5
  },

  hold: {
    preset: 'off',
    speed: 1,
    strength: 12
  },

  out: {
    preset: 'off',
    duration: 0.5
  }
},

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

  const blocks =
    sectionData[currentSectionName] || [];

  blocks.forEach(blockData => {
    const block =
      createLyricsBlockFromData(blockData);

    lyricsBlockList.appendChild(block);
  });

  applyLyricsBlockSelectionClasses();

  updateTimelineContentHeight();
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
    <div class="lyricsResizeHandle lyricsResizeHandleLeft"></div>
    <div class="lyricsResizeHandle lyricsResizeHandleRight"></div>
  `;

  block.addEventListener('click', event => {
  const additive =
    event.ctrlKey ||
    event.metaKey;

  const range =
    event.shiftKey;

  selectLyricsBlock(block, {
    additive,
    range
  });

  /*
   * タイミング入力ON中に
   * 通常クリックした場合だけ、
   * その歌詞から再開準備する。
   *
   * Command / Ctrl / Shiftによる
   * 複数選択時は再開させない。
   */
  if (
    isTimingInputMode &&
    !additive &&
    !range
  ) {
    prepareTimingRestartFromBlock(
      block
    );
  }

  event.stopPropagation();
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



function setupTimelineResize(
  block,
  blockData
) {
  const leftHandle =
    block.querySelector(
      '.lyricsResizeHandleLeft'
    );

  const rightHandle =
    block.querySelector(
      '.lyricsResizeHandleRight'
    );

  if (!leftHandle || !rightHandle) {
    console.warn(
      '左右のリサイズハンドルが見つかりません',
      {
        leftHandle,
        rightHandle,
        blockId: blockData?.id
      }
    );

    return;
  }

  let resizing = false;
  let resizeSide = null;

  let startMouseX = 0;
  let startLeft = 0;
  let startWidth = 0;

  let originalStartSeconds = 0;
  let originalEndSeconds = 0;

  function beginResize(event, side) {
    if (event.button !== 0) return;

    resizing = true;
    resizeSide = side;

    startMouseX =
      event.clientX;

    startLeft =
      parseFloat(block.style.left) || 0;

    startWidth =
      parseFloat(block.style.width) ||
      block.offsetWidth;

    originalStartSeconds =
      parseTimeToSeconds(
        blockData.start
      );

    originalEndSeconds =
      parseTimeToSeconds(
        blockData.end
      );

    block.classList.add('resizing');

    event.preventDefault();
    event.stopPropagation();
  }

  leftHandle.addEventListener(
    'mousedown',
    event => {
      beginResize(event, 'left');
    }
  );

  rightHandle.addEventListener(
    'mousedown',
    event => {
      beginResize(event, 'right');
    }
  );

  document.addEventListener(
    'mousemove',
    event => {
      if (!resizing) return;

      const deltaX =
        event.clientX - startMouseX;

      if (resizeSide === 'right') {
        const nextWidth =
          Math.max(
            TIMELINE_MIN_BLOCK_WIDTH,
            startWidth + deltaX
          );

        block.style.width =
          `${nextWidth}px`;

        return;
      }

      if (resizeSide === 'left') {
        const fixedRight =
          startLeft + startWidth;

        const maximumLeft =
          fixedRight -
          TIMELINE_MIN_BLOCK_WIDTH;

        const nextLeft =
          Math.max(
            0,
            Math.min(
              startLeft + deltaX,
              maximumLeft
            )
          );

        const nextWidth =
          fixedRight - nextLeft;

        block.style.left =
          `${nextLeft}px`;

        block.style.width =
          `${nextWidth}px`;
      }
    }
  );

  document.addEventListener(
    'mouseup',
    () => {
      if (!resizing) return;

      resizing = false;

      block.classList.remove('resizing');

      const finalLeft =
        parseFloat(block.style.left) || 0;

      const finalWidth =
        parseFloat(block.style.width) ||
        TIMELINE_MIN_BLOCK_WIDTH;

      if (resizeSide === 'right') {
        const nextEndSeconds =
          originalStartSeconds +
          finalWidth / timelineScale;

        blockData.end =
          formatSecondsToTime(
            nextEndSeconds
          );

        endTimeInput.value =
          blockData.end;
      }

      if (resizeSide === 'left') {
        const nextStartSeconds =
          finalLeft / timelineScale;

        blockData.start =
          formatSecondsToTime(
            Math.min(
              nextStartSeconds,
              originalEndSeconds
            )
          );

        /*
         * 左ハンドルでは終了時刻を変更しない。
         */
        blockData.end =
          formatSecondsToTime(
            originalEndSeconds
          );

        startTimeInput.value =
          blockData.start;

        endTimeInput.value =
          blockData.end;
      }

      resizeSide = null;

      updateEditorPreview(
        blockData,
        {
          animate: false
        }
      );

      sendLyricsBlockToVisualizer(
        blockData
      );
    }
  );
}



function getAnimationLabel(value) {
  const labels = {
    fade: 'Fade',
    slideUp: 'Slide Up',
    slideDown: 'Slide Down',
    slideLeft: 'Slide Left',
    slideRight: 'Slide Right',
    zoom: 'Zoom In',
    blurIn: 'Blur In',
    rotateIn: 'Rotate In',
    bounceIn: 'Bounce In',
    glitch: 'Glitch',
    neonFlicker: 'Neon Flicker'
  };

  return labels[value] || 'Fade';
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
  lyricsBlockList.addEventListener('click', event => {
    if (event.target.closest('.lyricsBlock')) return;

    selectedLyricsBlockIds.clear();
    lastSelectedLyricsBlockId = null;

    applyLyricsBlockSelectionClasses();
  });
}

/*
if (lyricsBlockList) {
  lyricsBlockList.addEventListener('click', (event) => {
    const block = event.target.closest('.lyricsBlock');

    if (!block) return;

    selectLyricsBlock(block);
  });
}
*/  

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


applyInAnimationButton?.addEventListener(
  'click',
  () => {
    applyAnimationValueToScope(
      block => {
        block.animation.in = {
          preset:
            animationPresetInput.value,

          duration:
            Number(
              inDurationInput.value
            ) || 0.5
        };

        /*
         * 旧形式との互換用
         */
        block.animationPreset =
          block.animation.in.preset;
      }
    );
  }
);


applyHoldAnimationButton?.addEventListener(
  'click',
  () => {
    applyAnimationValueToScope(
      block => {
        block.animation.hold = {
          preset:
            holdPresetInput.value,

          speed:
            Number(
              holdSpeedInput.value
            ) || 1,

          strength:
            Number(
              holdStrengthInput.value
            ) || 12
        };
      }
    );
  }
);


applyOutAnimationButton?.addEventListener(
  'click',
  () => {
    applyAnimationValueToScope(
      block => {
        block.animation.out = {
          preset:
            outPresetInput.value,

          duration:
            Number(
              outDurationInput.value
            ) || 0.5
        };
      }
    );
  }
);



if (deleteLyricsBlockButton) {
  deleteLyricsBlockButton.addEventListener('click', () => {
    if (selectedLyricsBlockIds.size === 0) return;

    const deleteCount = selectedLyricsBlockIds.size;

    const ok = confirm(
      `${deleteCount}個の歌詞ブロックを削除しますか？`
    );

    if (!ok) return;

    const blocks = sectionData[currentSectionName] || [];

    sectionData[currentSectionName] =
      blocks.filter(block =>
        !selectedLyricsBlockIds.has(block.id)
      );

    selectedLyricsBlockIds.clear();
    lastSelectedLyricsBlockId = null;

    renderSectionBlocks();

    const firstBlock =
      document.querySelector('.lyricsBlock');

    if (firstBlock) {
      selectLyricsBlock(firstBlock);
    } else {
      const previewLyrics =
        document.getElementById('editorPreviewLyrics');

      const previewLayer =
        document.getElementById('editorPreviewLyricsLayer');

      if (previewLyrics) {
        previewLyrics.innerHTML = '';
      }

      if (previewLayer) {
        previewLayer.innerHTML = '';
      }
    }
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
      block.animation =
  getNormalizedLyricsAnimation(
    block
  );

block.animation.in = {
  preset:
    animationPresetInput.value,

  duration:
    Number(
      inDurationInput.value
    ) || 0.5
};

block.animation.hold = {
  preset:
    holdPresetInput.value,

  speed:
    Number(
      holdSpeedInput.value
    ) || 1,

  strength:
    Number(
      holdStrengthInput.value
    ) || 12
};

block.animation.out = {
  preset:
    outPresetInput.value,

  duration:
    Number(
      outDurationInput.value
    ) || 0.5
};
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

window.addEventListener(
  'resize',
   resizeEditorPreviewCanvas
);

window.addEventListener(
  'resize',
  updateTimelineContentHeight
);



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

  // 空白部分を押した時点で全選択解除
  selectedLyricsBlockIds.clear();
  lastSelectedLyricsBlockId = null;
  applyLyricsBlockSelectionClasses();

  if (!editorAudio || !editorAudioReady) return;

  autoFollowPlayhead = true;

    const rect = timelineContent.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const nextTime = Math.max(0, x / timelineScale);

    lastEditorActiveLyricsSignature = '';
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
  const scrollArea =
    getTimelineScrollArea();

  if (!scrollArea) return;

  /*
   * マウスホイールでタイムラインを操作した場合のみ、
   * 自動追従を解除する。
   *
   * JavaScriptによるscrollLeft変更では
   * wheelイベントは発生しないため、
   * 自動スクロールを誤認しない。
   */
  scrollArea.addEventListener(
    'wheel',
    event => {
      /*
       * Command / Ctrl＋ホイールは
       * タイムラインズーム用なので、
       * 追従解除には使わない。
       */
      if (
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      isUserScrollingTimeline = true;
      autoFollowPlayhead = false;

      clearTimeout(timelineScrollTimer);

      timelineScrollTimer =
        setTimeout(() => {
          isUserScrollingTimeline = false;
        }, 300);
    },
    {
      passive: true
    }
  );

  /*
   * スクロールバーを直接ドラッグした場合にも
   * 追従を解除する。
   *
   * 歌詞ブロックや赤バーを押した操作は除外する。
   */
  scrollArea.addEventListener(
    'mousedown',
    event => {
      if (
        event.target.closest(
          '.lyricsBlock'
        )
      ) {
        return;
      }

      if (
        event.target.closest(
          '#timelinePlayhead'
        )
      ) {
        return;
      }

      /*
       * 横スクロールバー付近を押した場合だけ判定。
       */
      const rect =
        scrollArea.getBoundingClientRect();

      const scrollbarAreaHeight = 18;

      const isScrollbarArea =
        event.clientY >=
        rect.bottom - scrollbarAreaHeight;

      if (!isScrollbarArea) return;

      autoFollowPlayhead = false;
      isUserScrollingTimeline = true;
    }
  );
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

function setupTimelineZoomControls() {
  const zoomOutButton =
    document.getElementById('timelineZoomOutButton');

  const zoomInButton =
    document.getElementById('timelineZoomInButton');

  const zoomSlider =
    document.getElementById('timelineZoomSlider');

  const zoomValue =
    document.getElementById('timelineZoomValue');

  if (!zoomSlider) return;

  function refreshZoomUi() {
    zoomSlider.value = String(timelineScale);

    if (zoomValue) {
      zoomValue.textContent = `${timelineScale}px/s`;
    }
  }

  zoomSlider.addEventListener('input', () => {
    setTimelineZoom(Number(zoomSlider.value));
    refreshZoomUi();
  });

  zoomOutButton?.addEventListener('click', () => {
    setTimelineZoom(timelineScale - 10);
    refreshZoomUi();
  });

  zoomInButton?.addEventListener('click', () => {
    setTimelineZoom(timelineScale + 10);
    refreshZoomUi();
  });

  refreshZoomUi();
}



function getTimelineRulerStep() {
  if (timelineScale < 40) return 30;
  if (timelineScale < 80) return 10;
  if (timelineScale < 150) return 5;
  if (timelineScale < 250) return 1;
  return 0.5;
}



function renderTimelineRuler() {
  const ruler =
    document.querySelector('.timelineRuler');

  const gridLines =
    document.getElementById('timelineGridLines');

  if (
    !ruler ||
    !gridLines ||
    !editorAudio ||
    !Number.isFinite(editorAudio.duration)
  ) {
    return;
  }

  ruler.innerHTML = '';
  gridLines.innerHTML = '';

  const duration = editorAudio.duration;
  const step = getTimelineRulerStep();

  const totalWidth = getTimelineTotalWidth();

  ruler.style.position = 'relative';
  ruler.style.width = `${totalWidth}px`;

  for (let time = 0; time <= duration; time += step) {
    const mark = document.createElement('div');
    const line=document.createElement("div");

line.className = 'timelineGridLine';

line.style.left =
  `${time * timelineScale}px`;

line.style.top = '0';

gridLines.appendChild(line);

    mark.className = 'timelineRulerMark';

    mark.style.position = 'absolute';
    mark.style.left = `${time * timelineScale}px`;

    mark.textContent = formatEditorTime(time).replace('.00', '');

    ruler.appendChild(mark);
  }

  updateTimelineContentWidth();
  updateTimelineContentHeight();
}

function getTimelineTotalWidth() {
  if (!editorAudio || !Number.isFinite(editorAudio.duration)) return 1600;

  return Math.max(
    1600,
    editorAudio.duration * timelineScale + 800
  );
}


function updateTimelineContentHeight() {
  const timelineContent =
    document.getElementById('timelineContent');

  const lyricsBlockList =
    document.getElementById('lyricsBlockList');

  const gridLines =
    document.getElementById('timelineGridLines');

  const playhead =
    document.getElementById('timelinePlayhead');

  const scrollArea =
    getTimelineScrollArea
      ? getTimelineScrollArea()
      : document.querySelector('.timelineScrollArea');

  const blocks =
    sectionData[currentSectionName] || [];

  /*
   * 最後の歌詞ブロックの下端まで含める。
   */
  const blocksHeight =
    Math.max(
      blocks.length * TIMELINE_ROW_HEIGHT,
      TIMELINE_ROW_HEIGHT
    );

  const visibleHeight =
    scrollArea
      ? scrollArea.clientHeight
      : 0;

  /*
   * 最後のブロック下に余白を追加。
   */
  const bottomPadding = 40;

  const contentHeight =
    Math.max(
      blocksHeight + bottomPadding,
      visibleHeight
    );

  const heightText =
    `${contentHeight}px`;

    if (scrollArea) {
   scrollArea.style.overflow = 'auto';
   scrollArea.style.minHeight = '0';
}

  /*
   * タイムライン全体
   */
  if (timelineContent) {
  timelineContent.style.position = 'relative';
  timelineContent.style.height = heightText;
  timelineContent.style.minHeight = heightText;

  /*
   * スクロール領域の内側要素なので、
   * overflowは指定しない。
   */
  timelineContent.style.removeProperty('overflow');
}

  /*
   * 歌詞ブロック配置領域
   */
  if (lyricsBlockList) {
  lyricsBlockList.style.position = 'relative';
  lyricsBlockList.style.height = heightText;
  lyricsBlockList.style.minHeight = heightText;

  lyricsBlockList.style.removeProperty('overflow');
}

  /*
   * 秒数縦ラインのレイヤー
   */
  if (gridLines) {
    gridLines.style.position = 'absolute';
    gridLines.style.left = '0';
    gridLines.style.top = '0';
    gridLines.style.width = '100%';
    gridLines.style.height = heightText;
    gridLines.style.minHeight = heightText;
    gridLines.style.overflow = 'visible';
    gridLines.style.pointerEvents = 'none';

    /*
     * 各縦ライン自身にも高さを直接指定する。
     */
    gridLines
      .querySelectorAll('.timelineGridLine')
      .forEach(line => {
        line.style.top = '0';
        line.style.height = heightText;
      });
  }

  /*
   * 赤い再生ヘッド自身にも直接高さを指定。
   */
  if (playhead) {
    playhead.style.top = '0';
    playhead.style.bottom = 'auto';
    playhead.style.height = heightText;
    playhead.style.minHeight = heightText;
  }
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


function injectTimingGuideStyles() {
  if (document.getElementById('timingGuideStyles')) return;

  const style = document.createElement('style');
  style.id = 'timingGuideStyles';

  style.textContent = `
    #timingGuidePanel {
      position: fixed;
      z-index: 10000;
      width: 300px;
      box-sizing: border-box;
      overflow: hidden;

      background:
        linear-gradient(
          145deg,
          rgba(26, 29, 39, 0.97),
          rgba(14, 16, 24, 0.97)
        );

      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 12px;

      box-shadow:
        0 18px 45px rgba(0, 0, 0, 0.42),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);

      color: #ffffff;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      user-select: none;
      visibility: hidden;
      opacity: 0;
      pointer-events: none;

      transition:
        opacity 0.15s ease,
        visibility 0.15s ease;
    }

    #timingGuidePanel.is-visible {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }

    .timingGuideHeader {
      height: 36px;
      box-sizing: border-box;

      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: 0 12px;

      background: rgba(255, 255, 255, 0.045);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      cursor: grab;
    }

    .timingGuideHeader.is-dragging {
      cursor: grabbing;
    }

    .timingGuideTitle {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: rgba(255, 255, 255, 0.76);
    }

    .timingGuideDragIcon {
      font-size: 15px;
      line-height: 1;
      color: rgba(255, 255, 255, 0.38);
    }

    .timingGuideBody {
      padding: 12px;
    }

    .timingGuideRow + .timingGuideRow {
      margin-top: 11px;
      padding-top: 11px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .timingGuideLabel {
      margin-bottom: 5px;

      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;

      color: #9b8cff;
    }

    .timingGuideLabel.is-last {
      color: #ffb869;
    }

    .timingGuideLyrics {
      min-height: 20px;

      font-size: 14px;
      font-weight: 600;
      line-height: 1.45;

      color: rgba(255, 255, 255, 0.94);

      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;

      overflow: hidden;
      overflow-wrap: anywhere;
    }

    .timingGuideWaiting {
      padding: 4px 0 2px;
      text-align: center;
    }

    .timingGuideWaitingTitle {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.55);
    }

    .timingGuideWaitingSection {
      margin-top: 5px;

      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }

    .timingGuideWaitingKey {
      margin-top: 8px;

      font-size: 12px;
      font-weight: 700;
      color: #9b8cff;
    }
  `;

  document.head.appendChild(style);
}


function createTimingGuidePanel() {
  const existing =
    document.getElementById('timingGuidePanel');

  if (existing) {
    timingGuidePanel = existing;
    return existing;
  }

  injectTimingGuideStyles();

  const panel = document.createElement('div');

  panel.id = 'timingGuidePanel';

  panel.innerHTML = `
    <div class="timingGuideHeader">
      <span class="timingGuideTitle">
        TIMING GUIDE
      </span>

      <span class="timingGuideDragIcon">
        ⠿
      </span>
    </div>

    <div class="timingGuideBody">
      <div class="timingGuideRow">
        <div
          id="timingGuideNowLabel"
          class="timingGuideLabel"
        >
          NOW
        </div>

        <div
          id="timingGuideNowLyrics"
          class="timingGuideLyrics"
        >
          歌詞を選択してください
        </div>
      </div>

      <div class="timingGuideRow">
        <div
          id="timingGuideNextLabel"
          class="timingGuideLabel"
        >
          NEXT
        </div>

        <div
          id="timingGuideNextLyrics"
          class="timingGuideLyrics"
        >
          —
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  timingGuidePanel = panel;

  restoreTimingGuidePosition();
  setupTimingGuideDrag();

  return panel;
}


function getDefaultTimingGuidePosition() {
  const timeline =
    document.querySelector('.timelineScrollArea') ||
    document.querySelector('.timelineTrackArea') ||
    document.getElementById('lyricsBlockList');

  if (timeline) {
    const rect = timeline.getBoundingClientRect();

    return {
      left: Math.max(
        12,
        Math.min(
          window.innerWidth - 312,
          rect.right - 312
        )
      ),

      top: Math.max(
        12,
        Math.min(
          window.innerHeight - 160,
          rect.top + 12
        )
      )
    };
  }

  return {
    left: Math.max(12, window.innerWidth - 324),
    top: Math.max(12, window.innerHeight - 240)
  };
}


function clampTimingGuidePosition(left, top) {
  const panel = createTimingGuidePanel();

  const panelWidth =
    panel.offsetWidth || 300;

  const panelHeight =
    panel.offsetHeight || 150;

  return {
    left: Math.max(
      8,
      Math.min(
        Number(left) || 0,
        window.innerWidth - panelWidth - 8
      )
    ),

    top: Math.max(
      8,
      Math.min(
        Number(top) || 0,
        window.innerHeight - panelHeight - 8
      )
    )
  };
}


function setTimingGuidePosition(left, top) {
  const panel = createTimingGuidePanel();

  const position =
    clampTimingGuidePosition(left, top);

  panel.style.left = `${position.left}px`;
  panel.style.top = `${position.top}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';

  return position;
}


function restoreTimingGuidePosition() {
  const panel =
    timingGuidePanel ||
    document.getElementById('timingGuidePanel');

  if (!panel) return;

  let savedPosition = null;

  try {
    savedPosition = JSON.parse(
      localStorage.getItem(
        TIMING_GUIDE_POSITION_KEY
      )
    );
  } catch (error) {
    console.warn(
      'タイミングガイド位置の読み込みに失敗しました',
      error
    );
  }

  if (
    savedPosition &&
    Number.isFinite(Number(savedPosition.left)) &&
    Number.isFinite(Number(savedPosition.top))
  ) {
    setTimingGuidePosition(
      Number(savedPosition.left),
      Number(savedPosition.top)
    );

    return;
  }

  const defaultPosition =
    getDefaultTimingGuidePosition();

  setTimingGuidePosition(
    defaultPosition.left,
    defaultPosition.top
  );
}


function saveTimingGuidePosition() {
  const panel = createTimingGuidePanel();

  const left =
    parseFloat(panel.style.left);

  const top =
    parseFloat(panel.style.top);

  if (
    !Number.isFinite(left) ||
    !Number.isFinite(top)
  ) {
    return;
  }

  localStorage.setItem(
    TIMING_GUIDE_POSITION_KEY,
    JSON.stringify({
      left,
      top
    })
  );
}


function setupTimingGuideDrag() {
  const panel = createTimingGuidePanel();

  if (panel.dataset.dragReady === 'true') {
    return;
  }

  panel.dataset.dragReady = 'true';

  const header =
    panel.querySelector('.timingGuideHeader');

  if (!header) return;

  let isDragging = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startLeft = 0;
  let startTop = 0;

  header.addEventListener('mousedown', event => {
    if (event.button !== 0) return;

    const rect =
      panel.getBoundingClientRect();

    isDragging = true;

    startMouseX = event.clientX;
    startMouseY = event.clientY;

    startLeft = rect.left;
    startTop = rect.top;

    header.classList.add('is-dragging');

    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('mousemove', event => {
    if (!isDragging) return;

    const nextLeft =
      startLeft +
      (event.clientX - startMouseX);

    const nextTop =
      startTop +
      (event.clientY - startMouseY);

    setTimingGuidePosition(
      nextLeft,
      nextTop
    );
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;

    header.classList.remove('is-dragging');

    saveTimingGuidePosition();
  });
}


function showTimingGuidePanel() {
  const panel = createTimingGuidePanel();

  panel.classList.add('is-visible');

  updateTimingGuidePanel();
}


function hideTimingGuidePanel() {
  const panel =
    timingGuidePanel ||
    document.getElementById('timingGuidePanel');

  if (!panel) return;

  panel.classList.remove('is-visible');
}


function setTimingGuideStandardContent({
  nowText = '',
  nextText = '',
  nextLabel = 'NEXT'
} = {}) {
  const panel = createTimingGuidePanel();

  const body =
    panel.querySelector('.timingGuideBody');

  if (!body) return;

  body.innerHTML = `
    <div class="timingGuideRow">
      <div class="timingGuideLabel">
        NOW
      </div>

      <div class="timingGuideLyrics">
        ${escapeTimingGuideHtml(nowText || '—')}
      </div>
    </div>

    <div class="timingGuideRow">
      <div
        class="timingGuideLabel ${
          nextLabel === 'LAST'
            ? 'is-last'
            : ''
        }"
      >
        ${escapeTimingGuideHtml(nextLabel)}
      </div>

      <div class="timingGuideLyrics">
        ${escapeTimingGuideHtml(nextText || '—')}
      </div>
    </div>
  `;
}


function showTimingGuideWaitingState(
  nextSectionName
) {
  const panel = createTimingGuidePanel();

  const body =
    panel.querySelector('.timingGuideBody');

  if (!body) return;

  body.innerHTML = `
    <div class="timingGuideWaiting">
      <div class="timingGuideWaitingTitle">
        次のセクション
      </div>

      <div class="timingGuideWaitingSection">
        ${escapeTimingGuideHtml(
          nextSectionName || 'なし'
        )}
      </div>

      <div class="timingGuideWaitingKey">
        Bで開始
      </div>
    </div>
  `;
}


function showTimingGuideCompletedState() {
  const panel = createTimingGuidePanel();

  const body =
    panel.querySelector('.timingGuideBody');

  if (!body) return;

  body.innerHTML = `
    <div class="timingGuideWaiting">
      <div class="timingGuideWaitingTitle">
        TIMING INPUT
      </div>

      <div class="timingGuideWaitingSection">
        完了
      </div>
    </div>
  `;
}


function escapeTimingGuideHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function updateTimingGuidePanel() {
  if (!isTimingInputMode) {
    hideTimingGuidePanel();
    return;
  }

  const blocks =
    sectionData[currentSectionName] || [];

  if (blocks.length === 0) {
    setTimingGuideStandardContent({
      nowText: 'このセクションに歌詞がありません',
      nextText: '—',
      nextLabel: 'LAST'
    });

    return;
  }

  let currentIndex = timingInputBlockIndex;

  if (!timingInputStarted) {
    const selectedIndex =
      getSelectedLyricsBlockIndex();

    currentIndex =
      selectedIndex >= 0
        ? selectedIndex
        : 0;
  }

  currentIndex = Math.max(
    0,
    Math.min(currentIndex, blocks.length - 1)
  );

  const currentBlock =
    blocks[currentIndex];

  const nextBlock =
    blocks[currentIndex + 1];

  if (!nextBlock) {
    setTimingGuideStandardContent({
      nowText: currentBlock?.text || '—',
      nextText: 'Eで終了',
      nextLabel: 'LAST'
    });

    return;
  }

  const nextIsLast =
    currentIndex + 1 === blocks.length - 1;

  setTimingGuideStandardContent({
    nowText: currentBlock?.text || '—',
    nextText: nextBlock.text || '—',
    nextLabel: nextIsLast
      ? 'LAST'
      : 'NEXT'
  });
}


window.addEventListener('resize', () => {
  const panel =
    timingGuidePanel ||
    document.getElementById('timingGuidePanel');

  if (!panel) return;

  const rect =
    panel.getBoundingClientRect();

  setTimingGuidePosition(
    rect.left,
    rect.top
  );

  saveTimingGuidePosition();
});




function isTypingInInputElement() {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement?.isContentEditable
  );
}


function prepareTimingRestartFromBlock(
  blockElement
) {
  if (!isTimingInputMode) return;
  if (!blockElement) return;

  const blockId =
    blockElement.dataset.blockId;

  const blocks =
    sectionData[currentSectionName] || [];

  const selectedIndex =
    blocks.findIndex(
      block => block.id === blockId
    );

  if (selectedIndex < 0) return;

  const selectedBlock =
    blocks[selectedIndex];

  /*
   * 現在進行中のタイミング入力を終了し、
   * 次のBを「最初のB」として扱わせる。
   */
  timingInputStarted = false;
  timingInputBlockIndex = selectedIndex;

  /*
   * 選択ブロックの既存開始位置へ
   * 再生ヘッドを移動して待機する。
   */
  if (
    editorAudio &&
    editorAudioReady
  ) {
    editorAudio.pause();

    editorAudio.currentTime =
      Math.max(
        0,
        parseTimeToSeconds(
          selectedBlock.start
        )
      );

    autoFollowPlayhead = true;

    lastEditorActiveLyricsSignature = '';

    updateTimelinePlayhead();
    updateEditorPreviewByTimeline();
  }

  /*
   * NOW / NEXTを選択位置に更新。
   */
  updateTimingGuidePanel();

  console.log(
    'TIMING RESTART READY:',
    {
      sectionName: currentSectionName,
      blockIndex: selectedIndex,
      blockId,
      start: selectedBlock.start
    }
  );
}


function getSelectedLyricsBlockIndex() {
  const selectedBlock = document.querySelector('.lyricsBlock.selected');
  if (!selectedBlock) return -1;

  const blockId = selectedBlock.dataset.blockId;
  const blocks = sectionData[currentSectionName] || [];

  return blocks.findIndex(block => block.id === blockId);
}

function scrollSelectedLyricsBlockIntoVerticalView(
  blockElement
) {
  if (!blockElement) return;

  const scrollArea =
    getTimelineScrollArea
      ? getTimelineScrollArea()
      : document.querySelector('.timelineScrollArea');

  if (!scrollArea) return;

  const areaRect =
    scrollArea.getBoundingClientRect();

  const blockRect =
    blockElement.getBoundingClientRect();

  /*
   * タイムライン上部には秒数ルーラーがあるため、
   * そのぶんを表示判定から除外する。
   */
  const ruler =
    scrollArea.querySelector('.timelineRuler');

  const rulerHeight =
    ruler
      ? ruler.getBoundingClientRect().height
      : 0;

  const topMargin = rulerHeight + 12;
  const bottomMargin = 16;

  const visibleTop =
    areaRect.top + topMargin;

  const visibleBottom =
    areaRect.bottom - bottomMargin;

  let nextScrollTop =
    scrollArea.scrollTop;

  /*
   * 選択ブロックが上側へ隠れている場合
   */
  if (blockRect.top < visibleTop) {
    nextScrollTop +=
      blockRect.top - visibleTop;
  }

  /*
   * 選択ブロックが下側へ隠れている場合
   */
  else if (blockRect.bottom > visibleBottom) {
    nextScrollTop +=
      blockRect.bottom - visibleBottom;
  }

  const maxScrollTop =
    Math.max(
      0,
      scrollArea.scrollHeight -
      scrollArea.clientHeight
    );

  nextScrollTop =
    Math.max(
      0,
      Math.min(
        nextScrollTop,
        maxScrollTop
      )
    );



    console.log('VERTICAL FOLLOW:', {
  currentScrollTop: scrollArea.scrollTop,
  nextScrollTop,
  maxScrollTop,
  scrollHeight: scrollArea.scrollHeight,
  clientHeight: scrollArea.clientHeight,
  blockTop: blockRect.top,
  blockBottom: blockRect.bottom,
  visibleTop,
  visibleBottom
});

  /*
   * smoothは使わない。
   * 再生中の横スクロール更新と競合するため、
   * scrollTopを直接変更する。
   */
  scrollArea.scrollTop =
    nextScrollTop;
}



function selectLyricsBlockByIndex(
  index,
  {
    followVertical = false
  } = {}
) {
  const blocks =
    sectionData[currentSectionName] || [];

  const blockData =
    blocks[index];

  if (!blockData) return;

  renderSectionBlocks();

  const blockElement =
    document.querySelector(
      `.lyricsBlock[data-block-id="${blockData.id}"]`
    );

  if (!blockElement) return;

  selectLyricsBlock(blockElement);

  /*
   * B入力から明示的に指定された場合だけ
   * 縦方向へ追従する。
   */
  if (!followVertical) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollSelectedLyricsBlockIntoVerticalView(
        blockElement
      );
    });
  });
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
  const selectedIndex =
    getSelectedLyricsBlockIndex();

  timingInputBlockIndex =
    Math.max(
      0,
      Math.min(
        selectedIndex >= 0
          ? selectedIndex
          : timingInputBlockIndex >= 0
            ? timingInputBlockIndex
            : 0,
        blocks.length - 1
      )
    );

    const block = blocks[timingInputBlockIndex];

    block.start = currentTimeText;
    ensureBlockEndAfterStart(block, currentSeconds);

    timingInputStarted = true;

    selectLyricsBlockByIndex(
  timingInputBlockIndex,
  {
    followVertical: true
  }
);

    if (editorAudio.paused) {
  editorAudio.play();
}

updateTimingGuidePanel();

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

  selectLyricsBlockByIndex(
  timingInputBlockIndex,
  {
    followVertical: true
  }
);

  updateTimingGuidePanel();
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

    showTimingGuideWaitingState(
  nextSectionName
);

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


  showTimingGuideCompletedState();

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


function applyValueToSelectedBlocks(callback) {
  if (selectedLyricsBlockIds.size === 0) {
    alert('歌詞ブロックを選択してください。');
    return;
  }

  const blocks =
    sectionData[currentSectionName] || [];

  blocks.forEach(block => {
    if (!selectedLyricsBlockIds.has(block.id)) return;

    callback(block);
  });

  renderSectionBlocks();
  applyLyricsBlockSelectionClasses();
}


function getNormalizedLyricsAnimation(
  block
) {
  const legacyPreset =
    block?.animationPreset ||
    'fade';

  return {
    in: {
      preset:
        block?.animation?.in?.preset ??
        legacyPreset,

      duration:
        Number(
          block?.animation?.in?.duration ??
          0.5
        )
    },

    hold: {
      preset:
        block?.animation?.hold?.preset ??
        'off',

      speed:
        Number(
          block?.animation?.hold?.speed ??
          1
        ),

      strength:
        Number(
          block?.animation?.hold?.strength ??
          12
        )
    },

    out: {
      preset:
        block?.animation?.out?.preset ??
        'off',

      duration:
        Number(
          block?.animation?.out?.duration ??
          0.5
        )
    }
  };
}



function applyEditorLyricsAnimation(
  targetElement,
  animation = {}
) {
  if (!targetElement) return;

  const motionWrapper =
    targetElement.querySelector(
      '.lyricsMotionWrapper'
    );

  if (!motionWrapper) return;

  const inAnimation =
  animation.in ||
  animation;

const preset =
  inAnimation.preset ||
  'fade';

const duration =
  Number(
    inAnimation.duration ??
    0.5
  );

  if (preset === 'off') {
  motionWrapper.style.opacity = '1';
  motionWrapper.style.transform = 'none';
  motionWrapper.style.filter = 'none';
  return;
}

  const motionClassMap = {
    fade: 'lyrics-motion-fade',
    slideUp: 'lyrics-motion-slide-up',
    slideDown: 'lyrics-motion-slide-down',
    slideLeft: 'lyrics-motion-slide-left',
    slideRight: 'lyrics-motion-slide-right',
    zoom: 'lyrics-motion-zoom',
    blurIn: 'lyrics-motion-blur-in',
    rotateIn: 'lyrics-motion-rotate-in',
    bounceIn: 'lyrics-motion-bounce-in',
    glitch: 'lyrics-motion-glitch',
    neonFlicker: 'lyrics-motion-neon-flicker'
  };

  const allMotionClasses =
    Object.values(motionClassMap);

  motionWrapper.style.setProperty(
    '--lyrics-motion-duration',
    `${duration}s`
  );

  motionWrapper.classList.remove(
    ...allMotionClasses
  );

  motionWrapper.style.opacity = '';
  motionWrapper.style.transform = '';
  motionWrapper.style.filter = '';

  void motionWrapper.offsetWidth;

  const nextClass =
    motionClassMap[preset] ||
    motionClassMap.fade;

  motionWrapper.classList.add(nextClass);
}



function updateAnimationDescription() {
  if (!animationDescription) return;

  const descriptions = {
    fade: '透明から表示',
    slideUp: '下から上へ移動しながら表示',
    slideDown: '上から下へ移動しながら表示',
    slideLeft: '右から左へ移動しながら表示',
    slideRight: '左から右へ移動しながら表示',
    zoom: '小さい状態から通常サイズへ拡大',
    blurIn: 'ぼけた状態から鮮明に表示',
    rotateIn: '少し回転しながら表示',
    bounceIn: '弾むように拡大して表示',
    glitch: '位置や色が乱れるグリッチ演出',
    neonFlicker: 'ネオンが点滅しながら表示'
  };

  animationDescription.textContent =
    descriptions[animationPresetInput.value] ||
    'アニメーションなし';
}



function setupLayerPanelTabs() {
  const tabs =
    document.querySelectorAll(
      '.layerPanelTab'
    );

  const layersView =
    document.getElementById(
      'layerPanelLayers'
    );

  const assetsView =
    document.getElementById(
      'layerPanelAssets'
    );

  if (
    !tabs.length ||
    !layersView ||
    !assetsView
  ) {
    return;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target =
        tab.dataset.layerPanelTab;

      tabs.forEach(item => {
        item.classList.toggle(
          'is-active',
          item === tab
        );
      });

      layersView.classList.toggle(
        'is-active',
        target === 'layers'
      );

      assetsView.classList.toggle(
        'is-active',
        target === 'assets'
      );
    });
  });
}

setupLayerPanelTabs();


function setupLayerCollapse(){

    const workspace=
    document.getElementById(
        "editorWorkspace"
    );

    const button=
    document.getElementById(
        "layerPanelCollapseButton"
    );

    if(!workspace||!button)return;

    const saved=
    localStorage.getItem(
        "editorLeftCollapsed"
    );

    if(saved==="true"){

        workspace.classList.add(
            "leftCollapsed"
        );

        button.textContent="›";
    }

    button.onclick=()=>{

        const collapsed=
        workspace.classList.toggle(
            "leftCollapsed"
        );

        button.textContent=
        collapsed?"›":"‹";

        localStorage.setItem(
            "editorLeftCollapsed",
            collapsed
        );

        requestAnimationFrame(()=>{

            resizeEditorPreviewCanvas();

        });

        window.dispatchEvent(
    new Event("resize")
);

    };

}

setupLayerCollapse();


function setupLyricsInspectorTabs() {
  const tabs =
    document.querySelectorAll(
      '.lyricsInspectorTab'
    );

  const panes =
    document.querySelectorAll(
      '.lyricsInspectorPane'
    );

  if (
    !tabs.length ||
    !panes.length
  ) {
    return;
  }

  const storageKey =
    'norahLyricsInspectorTab';

  function activateTab(tabName) {
    tabs.forEach(tab => {
      tab.classList.toggle(
        'is-active',
        tab.dataset.inspectorTab ===
          tabName
      );
    });

    panes.forEach(pane => {
      pane.classList.toggle(
        'is-active',
        pane.dataset.inspectorPane ===
          tabName
      );
    });

    localStorage.setItem(
      storageKey,
      tabName
    );
  }

  tabs.forEach(tab => {
    tab.addEventListener(
      'click',
      () => {
        activateTab(
          tab.dataset.inspectorTab
        );
      }
    );
  });

  const savedTab =
    localStorage.getItem(
      storageKey
    );

  const validTab =
    [...tabs].some(
      tab =>
        tab.dataset.inspectorTab ===
        savedTab
    );

  activateTab(
    validTab
      ? savedTab
      : 'text'
  );
}

setupLyricsInspectorTabs();


/* ==================================================
   Editor Aspect Ratio Persistence
================================================== */

const EDITOR_ASPECT_RATIO_STORAGE_KEY =
  'norahEditorAspectRatio';

function getCurrentEditorAspectRatio() {
  const activeButton =
    document.querySelector(
      '#previewRatioControls .ratioButton.is-active'
    );

  return (
    activeButton?.dataset.ratio ||
    '16:9'
  );
}

function saveEditorAspectRatio(ratio) {
  if (
    ratio !== '16:9' &&
    ratio !== '9:16'
  ) {
    return;
  }

  localStorage.setItem(
    EDITOR_ASPECT_RATIO_STORAGE_KEY,
    ratio
  );
}

function applyEditorAspectRatio(
  ratio,
  {
    save = true
  } = {}
) {
  const previewStage =
    document.getElementById(
      'editorPreviewStage'
    );

  const ratioButtons =
    document.querySelectorAll(
      '#previewRatioControls .ratioButton'
    );

  if (
    !previewStage ||
    !ratioButtons.length
  ) {
    return;
  }

  const normalizedRatio =
    ratio === '9:16'
      ? '9:16'
      : '16:9';

  previewStage.classList.toggle(
    'ratio-16-9',
    normalizedRatio === '16:9'
  );

  previewStage.classList.toggle(
    'ratio-9-16',
    normalizedRatio === '9:16'
  );

  ratioButtons.forEach(button => {
    button.classList.toggle(
      'is-active',
      button.dataset.ratio ===
        normalizedRatio
    );
  });

  if (save) {
    saveEditorAspectRatio(
      normalizedRatio
    );
  }

  requestAnimationFrame(() => {
    if (
      typeof resizeEditorPreviewCanvas ===
      'function'
    ) {
      resizeEditorPreviewCanvas();
    }

    window.dispatchEvent(
      new Event('resize')
    );
  });
}

function setupEditorAspectRatioPersistence() {
  const ratioButtons =
    document.querySelectorAll(
      '#previewRatioControls .ratioButton'
    );

  if (!ratioButtons.length) return;

  ratioButtons.forEach(button => {
    button.addEventListener(
      'click',
      () => {
        applyEditorAspectRatio(
          button.dataset.ratio
        );
      }
    );
  });

  const savedRatio =
    localStorage.getItem(
      EDITOR_ASPECT_RATIO_STORAGE_KEY
    );

  applyEditorAspectRatio(
    savedRatio || '16:9',
    {
      save: false
    }
  );
}

setupEditorAspectRatioPersistence();


function getAnimationApplyScope() {
  return (
    document.querySelector(
      'input[name="animationApplyScope"]:checked'
    )?.value ||
    'selected'
  );
}


function getLyricsBlocksByApplyScope(
  scope
) {
  if (scope === 'selected') {
    return (
      sectionData[currentSectionName] ||
      []
    ).filter(block =>
      selectedLyricsBlockIds.has(
        block.id
      )
    );
  }

  if (scope === 'section') {
    return (
      sectionData[currentSectionName] ||
      []
    );
  }

  if (scope === 'song') {
    return Object
      .values(sectionData)
      .flatMap(blocks =>
        blocks || []
      );
  }

  return [];
}


function applyAnimationValueToScope(
  callback
) {
  const scope =
    getAnimationApplyScope();

  const targetBlocks =
    getLyricsBlocksByApplyScope(
      scope
    );

  if (!targetBlocks.length) {
    alert(
      scope === 'selected'
        ? '歌詞ブロックを選択してください。'
        : '適用できる歌詞ブロックがありません。'
    );

    return;
  }

  targetBlocks.forEach(block => {
    block.animation =
      getNormalizedLyricsAnimation(
        block
      );

    callback(block);
  });

  renderSectionBlocks();
  applyLyricsBlockSelectionClasses();

  const selectedData =
    getSelectedLyricsBlockData();

  if (selectedData) {
    const element =
      document.querySelector(
        `.lyricsBlock[data-block-id="${selectedData.id}"]`
      );

    if (element) {
      loadLyricsBlockToInspector(
        element
      );
    }

    updateEditorPreview(
      selectedData
    );
  }
}


function updateAnimationControlValues() {
  if (inDurationValue) {
    inDurationValue.textContent =
      `${Number(
        inDurationInput?.value || 0.5
      ).toFixed(2)}秒`;
  }

  if (holdSpeedValue) {
    holdSpeedValue.textContent =
      Number(
        holdSpeedInput?.value || 1
      ).toFixed(2);
  }

  if (holdStrengthValue) {
    holdStrengthValue.textContent =
      String(
        Number(
          holdStrengthInput?.value || 12
        )
      );
  }

  if (outDurationValue) {
    outDurationValue.textContent =
      `${Number(
        outDurationInput?.value || 0.5
      ).toFixed(2)}秒`;
  }
}



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
setupTimelineZoomControls();
setupTimelineZoomByWheel();
updateAnimationDescription();