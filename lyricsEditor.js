
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
  }

  renderSectionBlocks();

  const updatedBlock = document.querySelector(
    `.lyricsBlock[data-block-id="${blockId}"]`
  );

  if (updatedBlock) {
    updatedBlock.classList.add('selected');
  }
}
}
function updateEditorPreview() {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return;

  previewLyrics.textContent = textInput.value || '';
  previewLyrics.style.fontFamily = `"${fontInput.value}", sans-serif`;
  previewLyrics.style.fontSize = `${sizeInput.value}px`;
  previewLyrics.style.color = colorInput.value;
  previewLyrics.style.textAlign = alignInput.value;
  previewLyrics.style.letterSpacing = `${letterSpacingInput.value}px`;
  previewLyrics.style.lineHeight = String(lineHeightInput.value);
  previewLyrics.style.webkitTextStroke =
    `${outlineWidthInput.value}px ${outlineColorInput.value}`;
  previewLyrics.style.textShadow =
    `${shadowXInput.value}px ${shadowYInput.value}px ${shadowBlurInput.value}px ${shadowColorInput.value}`;
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

  textInput.value = data.text || '';
  sizeInput.value = data.size || 72;

  sizeValue.textContent =
    sizeInput.value;

  colorInput.value = data.color || '#ffffff';
  fontInput.value = data.font || 'Arial';

  outlineColorInput.value = data.outlineColor || '#000000';
  outlineWidthInput.value = data.outlineWidth ?? 0;

  alignInput.value = data.align || 'center';
  
  shadowColorInput.value = data.shadowColor || '#000000';
  shadowBlurInput.value = data.shadowBlur ?? 0;
  shadowXInput.value = data.shadowX ?? 0;
  shadowYInput.value = data.shadowY ?? 0;

    letterSpacingInput.value =
    data.letterSpacing ?? 0;

  lineHeightInput.value =
    data.lineHeight ?? 1.2;

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

});

let currentSectionName = 'Verse 1';

const sectionData = {
  'Verse 1': [],
  'Chorus': []
};

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

function saveEditorData() {
  localStorage.setItem(
    EDITOR_STORAGE_KEY,
    JSON.stringify({
      currentSectionName,
      sectionData
    })
  );

  console.log('Editor data saved');
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
  });
});



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
  document.getElementById('duplicateLyricsBlockButton');

const deleteLyricsBlockButton =
  document.getElementById('deleteLyricsBlockButton');

function selectLyricsBlock(block) {
  document.querySelectorAll('.lyricsBlock').forEach(item => {
    item.classList.remove('selected');
  });

  block.classList.add('selected');

  loadLyricsBlockToInspector(block);
}

function loadLyricsBlockToInspector(block) {
  const sentence =
    block.querySelector('.lyricsSentence')?.textContent.trim() || '';

  const timeText =
    block.querySelector('.lyricsTime')?.textContent.trim() || '00:00.00 → 00:03.00';

  const [start, end] = timeText.split('→').map(value => value.trim());

  textInput.value = sentence;
  startTimeInput.value = start || '00:00.00';
  endTimeInput.value = end || '00:03.00';

  animationPresetInput.value =
    block.dataset.animationPreset || 'fade';

  updateEditorPreview();
}

function createLyricsBlock() {
  const block = document.createElement('div');
  block.className = 'lyricsBlock';
  block.dataset.animationPreset = 'fade';
  block.draggable = true;

  block.innerHTML = `
  <div class="lyricsBlockTop">
    <div class="lyricsBlockMotion">
      Fade
    </div>

    <div class="lyricsBlockSection">
      Verse 1
    </div>
  </div>

  <div class="lyricsTime">
    00:00.00 → 00:03.00
  </div>

  <div class="lyricsSentence">
    新しい歌詞
  </div>

  <div class="lyricsBlockMeta">
    <span>Position X:0 Y:0 Z:0</span>

  </div>
`;

  block.addEventListener('click', () => {
  selectLyricsBlock(block);
});

setupLyricsBlockDrag(block);

return block;
}

function createLyricsBlockData(text = '新しい歌詞') {
  return {
    id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    start: '00:00.00',
    end: '00:03.00',
    text,
    animationPreset: 'fade',
    position: {
      x: 0,
      y: 0,
      z: 0
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
  const block = document.createElement('div');
  block.className = 'lyricsBlock';
  block.draggable = true;
  block.dataset.blockId = blockData.id;
  block.dataset.animationPreset = blockData.animationPreset || 'fade';

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
  `;

  block.addEventListener('click', () => {
    selectLyricsBlock(block);
  });

  setupLyricsBlockDrag(block);

  return block;
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
  lyricsBlockList.addEventListener('dragover', (event) => {
    event.preventDefault();

    const dragging = document.querySelector('.lyricsBlock.dragging');
    const target = event.target.closest('.lyricsBlock');

    if (!dragging || !target || dragging === target) return;

    document.querySelectorAll('.lyricsBlock').forEach(item => {
      item.classList.remove('drag-over');
    });

    target.classList.add('drag-over');

    const rect = target.getBoundingClientRect();
    const isAfter = event.clientX > rect.left + rect.width / 2;

    if (isAfter) {
      target.after(dragging);
    } else {
      target.before(dragging);
    }
  });

  lyricsBlockList.addEventListener('drop', () => {
  document.querySelectorAll('.lyricsBlock').forEach(item => {
    item.classList.remove('drag-over');
  });

  syncCurrentSectionOrderFromDOM();
});
}

function setupLyricsBlockDrag(block) {
  block.draggable = true;

  block.addEventListener('dragstart', () => {
    block.classList.add('dragging');
  });

  block.addEventListener('dragend', () => {
    block.classList.remove('dragging');

    document.querySelectorAll('.lyricsBlock').forEach(item => {
      item.classList.remove('drag-over');
    });
  });
}



document.querySelectorAll('.lyricsBlock').forEach(block => {
  setupLyricsBlockDrag(block);
});


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
