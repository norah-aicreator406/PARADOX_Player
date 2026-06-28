console.log("LayerManager Loaded");


//==============================
// UI
//==============================

function renderLayerPanel() {
  const layerList = document.getElementById('layerList');
  if (!layerList) return;

  layerList.innerHTML = '';

  overlayLayers.forEach((layer, index) => {
    const item = document.createElement('div');
    item.className =
      'layerItem' + (index === selectedOverlayLayerIndex ? ' active' : '');
      item.draggable = true;
      item.dataset.index = index;

    const visibleButton = document.createElement('button');
    visibleButton.textContent = layer.visible ? '👁' : '🚫';
    visibleButton.title = '表示 / 非表示';

    visibleButton.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();

      await updateOverlayLayer(index, {
        visible: !layer.visible
      });

      renderLayerPanel();
      updateSelectedLayerControls();
    };

    const name = document.createElement('span');
    name.textContent = layer.name || `Layer ${index + 1}`;
    name.style.flex = '1';
    name.style.marginLeft = '8px';
    name.style.marginRight = '8px';

    const renameButton = document.createElement('button');
    renameButton.textContent = '✏️';
    renameButton.title = '名前変更';

    renameButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      renameOverlayLayer(index);
    };

    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '4px';

    item.onclick = () => {
      selectedOverlayLayerIndex = index;
      renderLayerPanel();
      updateSelectedLayerControls();
    };

    item.ondblclick = async () => {
  if (layer.type === 'lyrics') {
    await ipcRenderer.invoke('open-lyrics-editor-window', {
  text: layer.data?.text || '',
  size: layer.data?.size || 72,
  color: layer.data?.color || '#ffffff',
  font: layer.data?.font || 'Arial',

  outlineColor: layer.data?.outlineColor || '#000000',
  outlineWidth: layer.data?.outlineWidth ?? 0,

  align: layer.data?.align || 'center',

  shadowColor: layer.data?.shadowColor || '#000000',
  shadowBlur: layer.data?.shadowBlur ?? 0,
  shadowX: layer.data?.shadowX ?? 0,
  shadowY: layer.data?.shadowY ?? 0,

  letterSpacing: layer.data?.letterSpacing ?? 0,
  lineHeight: layer.data?.lineHeight ?? 1.2
});
  }
};

    item.addEventListener('dragstart', (event) => {
  event.dataTransfer.setData('text/plain', String(index));
  item.classList.add('dragging');
});

item.addEventListener('dragend', () => {
  item.classList.remove('dragging');
});

item.addEventListener('dragover', (event) => {
  event.preventDefault();
  item.classList.add('drag-over');
});

item.addEventListener('dragleave', () => {
  item.classList.remove('drag-over');
});

item.addEventListener('drop', async (event) => {
  event.preventDefault();
  item.classList.remove('drag-over');

  const fromIndex = Number(event.dataTransfer.getData('text/plain'));
  const toIndex = index;

  if (fromIndex === toIndex) return;

  await moveOverlayLayer(fromIndex, toIndex);
});

    item.appendChild(visibleButton);
    item.appendChild(name);
    item.appendChild(renameButton);
    layerList.appendChild(item);
  });

  updateSelectedLayerControls();
}


function updateSelectedLayerControls() {
  const layer = overlayLayers[selectedOverlayLayerIndex];
  if (!layer) return;

  const opacityInput = document.getElementById('overlayOpacity');
  if (opacityInput) {
    opacityInput.value = Math.round((layer.opacity ?? 1) * 100);
  }

  const select = document.getElementById('overlaySelect');
  if (select) {
    select.value = layer.data?.fileUrl || '';
  }

const lyricsInput = document.getElementById('lyricsTextInput');

if (lyricsInput) {
  lyricsInput.value = layer.type === 'lyrics'
    ? layer.data?.text || ''
    : '';
}

const imageControl = document.getElementById('overlayControl');
const lyricsControl = document.getElementById('lyricsTextControl');

if (imageControl) {
  imageControl.style.setProperty(
    'display',
    layer.type === 'image' ? 'flex' : 'none',
    'important'
  );
}

if (lyricsControl) {
  lyricsControl.style.setProperty(
    'display',
    layer.type === 'lyrics' ? 'flex' : 'none',
    'important'
  );
}

const lyricsSizeControl = document.getElementById('lyricsSizeControl');

if (lyricsSizeControl) {
  lyricsSizeControl.style.setProperty(
    'display',
    layer.type === 'lyrics' ? 'flex' : 'none',
    'important'
  );
}


const lyricsSizeInput = document.getElementById('lyricsSizeInput');

if (lyricsSizeInput) {
  lyricsSizeInput.value = layer.type === 'lyrics'
    ? layer.data?.size || 72
    : 72;
}

}


function renameOverlayLayer(index) {
  const layerList = document.getElementById('layerList');
  if (!layerList) return;

  const item = layerList.children[index];
  if (!item) return;

  const layer = overlayLayers[index];
  if (!layer) return;

  let isSaving = false;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = layer.name || `Layer ${index + 1}`;
  input.style.flex = '1';
  input.style.marginRight = '8px';

  item.innerHTML = '';
  item.appendChild(input);

  input.focus();
  input.select();

  const saveName = async () => {
    if (isSaving) return;
    isSaving = true;

    const nextName = input.value.trim();

    if (nextName) {
      await updateOverlayLayer(index, {
        name: nextName
      });
    }

    renderLayerPanel();
    updateSelectedLayerControls();
  };

  input.onkeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveName();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      isSaving = true;
      renderLayerPanel();
      updateSelectedLayerControls();
    }
  };

  input.onblur = () => {
    saveName();
  };
}


//==============================
// Save / Load
//==============================

function saveOverlayLayers() {
  localStorage.setItem(
    'paradoxOverlayLayers',
    JSON.stringify(overlayLayers)
  );
}



function loadOverlayLayers() {
  const saved = localStorage.getItem('paradoxOverlayLayers');

  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) {
      overlayLayers = parsed.map(layer => normalizeLayer(layer));
    }
  } catch (error) {
    localStorage.removeItem('paradoxOverlayLayers');
  }
}


function normalizeLayer(layer) {
  const type = layer.type || "image";

  return {
    id: layer.id || `layer-${Date.now()}-${Math.random()}`,
    type,
    name: layer.name || "Layer",
    visible: layer.visible ?? true,
    opacity: layer.opacity ?? 1,
    x: layer.x ?? 50,
    y: layer.y ?? 50,
    width: layer.width ?? 180,
    rotation: layer.rotation ?? 0,
    blendMode: layer.blendMode || "normal",
    data: {
      fileUrl: layer.data?.fileUrl ?? layer.fileUrl ?? "",
      fileName: layer.data?.fileName ?? layer.fileName ?? "",
      text: layer.data?.text ?? layer.text ?? "",
      font: layer.data?.font ?? layer.font ?? "Noto Sans JP",
      size: layer.data?.size ?? layer.size ?? 72,
      color: layer.data?.color ?? layer.color ?? "#ffffff",
      align: layer.data?.align ?? layer.align ?? "center",
      outlineColor:
      layer.data?.outlineColor ??
      layer.outlineColor ??
      "#000000",

    outlineWidth:
      layer.data?.outlineWidth ??
     layer.outlineWidth ??
      0,
      align:
    layer.data?.align ??
    layer.align ??
    "center",
shadowColor:
  layer.data?.shadowColor ??
  layer.shadowColor ??
  "#000000",

shadowBlur:
  layer.data?.shadowBlur ??
  layer.shadowBlur ??
  0,

shadowX:
  layer.data?.shadowX ??
  layer.shadowX ??
  0,

shadowY:
  layer.data?.shadowY ??
  layer.shadowY ??
  0,
  letterSpacing:
  layer.data?.letterSpacing ??
  layer.letterSpacing ??
  0,
  lineHeight:
  layer.data?.lineHeight ??
  layer.lineHeight ??
  1.2,
    }
  };
}


//==============================
// Layer CRUD
//==============================

async function addOverlayLayer() {
  const nextNumber = overlayLayers.length + 1;

  overlayLayers.push({
    id: `layer-${Date.now()}`,
    type: "image",
    name: `Layer ${nextNumber}`,
    visible: false,
    opacity: 1,
    x: 50,
    y: 50,
    width: 180,
    rotation: 0,
    blendMode: "normal",
    data: {
  fileUrl: "",
  fileName: "",
  text: "",
  font: "Noto Sans JP",
  size: 72,
  color: "#ffffff",
  align: "center"
}
  });

  selectedOverlayLayerIndex = overlayLayers.length - 1;

  saveOverlayLayers();
  renderLayerPanel();
  updateSelectedLayerControls();
  await sendOverlayLayersToVisualizer();
}

async function addLyricsLayer() {
  const nextNumber = overlayLayers.length + 1;

  overlayLayers.push({
    id: `lyrics-${Date.now()}`,
    type: "lyrics",
    name: `Lyrics ${nextNumber}`,
    visible: true,
    opacity: 1,
    x: 50,
    y: 50,
    width: 600,
    rotation: 0,
    blendMode: "normal",
    data: {
      text: "NORAH Studio",
      font: "Noto Sans JP",
      size: 72,
      color: "#ffffff",
      align: "center"
    }
  });

  selectedOverlayLayerIndex = overlayLayers.length - 1;

  saveOverlayLayers();
  renderLayerPanel();
  updateSelectedLayerControls();
  await sendOverlayLayersToVisualizer();
}


async function deleteSelectedOverlayLayer() {
  if (overlayLayers.length <= 1) {
    alert('最低1つのレイヤーは残してください。');
    return;
  }

  const layer = overlayLayers[selectedOverlayLayerIndex];

  if (!layer) return;

  const ok = confirm(`${layer.name || '選択中レイヤー'} を削除しますか？`);

  if (!ok) return;

  overlayLayers.splice(selectedOverlayLayerIndex, 1);

  selectedOverlayLayerIndex = Math.max(
    0,
    Math.min(selectedOverlayLayerIndex, overlayLayers.length - 1)
  );

  saveOverlayLayers();
  renderLayerPanel();
  updateSelectedLayerControls();
  await sendOverlayLayersToVisualizer();
}


async function moveOverlayLayer(fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= overlayLayers.length ||
    toIndex >= overlayLayers.length
  ) {
    return;
  }

  const movedLayer = overlayLayers.splice(fromIndex, 1)[0];
  overlayLayers.splice(toIndex, 0, movedLayer);

  selectedOverlayLayerIndex = toIndex;

  saveOverlayLayers();
  renderLayerPanel();
  updateSelectedLayerControls();
  await sendOverlayLayersToVisualizer();
}


async function updateOverlayLayer(layerIndex, changes) {
  const layer = overlayLayers[layerIndex];
  if (!layer) return;

  overlayLayers[layerIndex] = {
    ...layer,
    ...changes,
    data: {
      ...(layer.data || {}),
      ...(changes.data || {})
    }
  };

  saveOverlayLayers();
  await sendOverlayLayersToVisualizer();
}


//==============================
// Visualizer
//==============================

async function changeOverlayImage() {
  const select = document.getElementById('overlaySelect');
  if (!select) return;

  const fileUrl = select.value;
  const name = select.options[select.selectedIndex]?.textContent || '';

  const layer = overlayLayers[selectedOverlayLayerIndex];
  if (!layer) return;

  await updateOverlayLayer(selectedOverlayLayerIndex, {
    type: 'image',
    visible: Boolean(fileUrl),
    data: {
      ...(layer.data || {}),
      fileUrl: fileUrl || '',
      fileName: name || ''
    }
  });

  updateSelectedLayerControls();
}


async function changeLyricsText() {
  const input = document.getElementById('lyricsTextInput');
  if (!input) return;

  const layer = overlayLayers[selectedOverlayLayerIndex];
  if (!layer || layer.type !== 'lyrics') return;

  await updateOverlayLayer(selectedOverlayLayerIndex, {
    data: {
      text: input.value
    }
  });
}


async function changeLyricsSize() {
  const input = document.getElementById('lyricsSizeInput');
  if (!input) return;

  const layer = overlayLayers[selectedOverlayLayerIndex];
  if (!layer || layer.type !== 'lyrics') return;

  await updateOverlayLayer(selectedOverlayLayerIndex, {
    data: {
      size: Number(input.value)
    }
  });
}


async function changeOverlayLayerSettings() {
  const opacity = Number(document.getElementById('overlayOpacity').value) / 100;

  await updateOverlayLayer(selectedOverlayLayerIndex, {
    opacity
  });

  await ipcRenderer.invoke('send-overlay-layer-settings', {
    layerIndex: selectedOverlayLayerIndex,
    opacity
  });
}

async function sendOverlayLayersToVisualizer() {
  await ipcRenderer.invoke('send-overlay-layers-to-visualizer', overlayLayers);
}