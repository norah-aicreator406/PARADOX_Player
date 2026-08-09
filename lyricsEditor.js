const fs = require('fs');
const { pathToFileURL } = require('url');
let timelineScale = 90; // 1秒 = 90px
const TIMELINE_SCALE_MIN = 20;
const TIMELINE_SCALE_MAX = 260;
const TIMELINE_ROW_HEIGHT = 56;
const TIMELINE_MIN_BLOCK_WIDTH = 24;


/* ==================================================
   Timeline Module Connection
================================================== */

const lyricsEditorTimeline =
  window.LyricsEditorTimeline.create({
    getAudio() {
      return editorAudio;
    },

    getTimelineScale() {
      return timelineScale;
    },

    getRowHeight() {
      return TIMELINE_ROW_HEIGHT;
    },

    getCurrentBlocks() {
      return (
        sectionData[
          currentSectionName
        ] || []
      );
    },

    formatTime(
      seconds
    ) {
      return formatEditorTime(
        seconds
      );
    },

    getRulerStep() {
      return getTimelineRulerStep();
    },

    getScrollArea() {
      return getTimelineScrollArea();
    }
  });



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
  if (!fontInput) {
    console.warn(
      '[Font] lyricsFontが見つかりません。'
    );

    return;
  }

  const fontLibraryFonts =
  window
    .NorahFontManager
    ?.getAllFonts();

  if (
    !Array.isArray(
      fontLibraryFonts
    )
  ) {
    console.warn(
      '[Font] Font Libraryの一覧を取得できません。'
    );

    return;
  }

  const previousFont =
    fontInput.value ||
    'Noto Sans JP';

  fontInput.innerHTML = '';

  const categoryGroups = [
    {
      label: '日本語',
      category: 'japanese'
    },
    {
      label: '英語',
      category: 'english'
    }
  ];

  const addedFonts =
    new Set();

  categoryGroups.forEach(
    groupData => {
      const matchingFonts =
        fontLibraryFonts.filter(
          fontData =>
            Array.isArray(
              fontData.categories
            ) &&
            fontData.categories.includes(
              groupData.category
            )
        );

      if (!matchingFonts.length) {
        return;
      }

      const optgroup =
        document.createElement(
          'optgroup'
        );

      optgroup.label =
        groupData.label;

      matchingFonts.forEach(
        fontData => {
          if (
            !fontData?.value ||
            addedFonts.has(
              fontData.value
            )
          ) {
            return;
          }

          const option =
            document.createElement(
              'option'
            );

          option.value =
            fontData.value;

          option.textContent =
            fontData.label ||
            fontData.value;

          option.style.fontFamily =
            `"${fontData.value}", sans-serif`;

          optgroup.appendChild(
            option
          );

          addedFonts.add(
            fontData.value
          );
        }
      );

      fontInput.appendChild(
        optgroup
      );
    }
  );

  const otherFonts =
    fontLibraryFonts.filter(
      fontData =>
        fontData?.value &&
        !addedFonts.has(
          fontData.value
        )
    );

  if (otherFonts.length) {
    const otherGroup =
      document.createElement(
        'optgroup'
      );

    otherGroup.label =
      'その他';

    otherFonts.forEach(
      fontData => {
        const option =
          document.createElement(
            'option'
          );

        option.value =
          fontData.value;

        option.textContent =
          fontData.label ||
          fontData.value;

        option.style.fontFamily =
          `"${fontData.value}", sans-serif`;

        otherGroup.appendChild(
          option
        );

        addedFonts.add(
          fontData.value
        );
      }
    );

    fontInput.appendChild(
      otherGroup
    );
  }

  const previousFontExists =
    Array.from(
      fontInput.options
    ).some(
      option =>
        option.value ===
        previousFont
    );

  if (previousFontExists) {
    fontInput.value =
      previousFont;
  } else if (
    Array.from(
      fontInput.options
    ).some(
      option =>
        option.value ===
        'Noto Sans JP'
    )
  ) {
    fontInput.value =
      'Noto Sans JP';
  } else {
    fontInput.selectedIndex =
      0;
  }
}


window.addEventListener(
  'norah-fonts-reloaded',
  () => {
    setupFontOptions();
  }
);

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

const holdDescription =
  document.getElementById(
    'lyricsHoldDescription'
  );

const outPresetInput =
  document.getElementById(
    'lyricsOutPreset'
  );

const outDescription =
  document.getElementById(
    'lyricsOutDescription'
  );

const outDurationInput =
  document.getElementById(
    'lyricsOutDuration'
  );

const outDurationValue =
  document.getElementById(
    'lyricsOutDurationValue'
  );

const applyAllAnimationButton =
  document.getElementById(
    'applyAllAnimationButton'
  );


const sizeInput = document.getElementById('lyricsSize');
const opacityInput = document.getElementById('lyricsOpacity');

const opacityValue = document.getElementById('lyricsOpacityValue');
const colorInput = document.getElementById('lyricsColor');
const fontInput = document.getElementById('lyricsFont');
const stylePresetInput =
    document.getElementById('lyricsStylePreset');
const outlineColorInput = document.getElementById('lyricsOutlineColor');
const outlineWidthInput = document.getElementById('lyricsOutlineWidth');
const writingModeInput = document.getElementById('lyricsWritingMode');
const alignInput = document.getElementById('lyricsAlign');

const applyStyleScopeButton = document.getElementById('applyStyleScopeButton');
const applyLayoutScopeButton = document.getElementById('applyLayoutScopeButton');
const applyEffectScopeButton = document.getElementById('applyEffectScopeButton');

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

  opacityValue.textContent =
  `${opacityInput.value}%`;

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
    opacity: Number(opacityInput.value),
    color: colorInput.value,
    font: fontInput.value,
    outlineColor: outlineColorInput.value,
    outlineWidth: Number(outlineWidthInput.value),
    writingMode: writingModeInput.value,
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
  opacity: Number(opacityInput.value),
  color: colorInput.value,
  writingMode: writingModeInput.value,
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

  const ratioLayout =
  blockData
    ? getLyricsLayoutForCurrentRatio(
        blockData
      )
    : null;

  const payload = {
    id: blockData?.id || null,
    text: blockData?.text ?? textInput.value ?? '',
    lines: String(blockData?.text ?? textInput.value ?? '').split('\n'),
    style: {
  ...style,

  size:
    ratioLayout?.size ??
    style?.size ??
    72
},

position:
  ratioLayout?.position ||
  blockData?.position ||
  {
    x: 0,
    y: 0,
    z: 0
  },

layout:
  ratioLayout?.layout ||
  blockData?.layout ||
  {
    width: 900,
    rotation: 0
  },

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

  if (payload.id) {
  previewLyrics.dataset.blockId =
    payload.id;
} else {
  previewLyrics.removeAttribute(
    'data-block-id'
  );
}

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
 
applyEditorLyricsHoldAnimation(
  previewLyrics,
  payload.animation,
  Number(
    options.holdElapsedSeconds
  ) || 0
);

/*
 * 停止中の通常編集では、
 * OUT状態を残さず完全表示する。
 */
if (
  !editorAudio ||
  editorAudio.paused
) {
  applyEditorLyricsOutAnimation(
    previewLyrics,
    payload.animation,
    Infinity
  );
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

/*
 * 現在選択中の全ブロックデータを取得する。
 */
function getSelectedLyricsBlocksData() {
  const selectedIds =
    selectedLyricsBlockIds;

  if (!selectedIds.size) {
    return [];
  }

  return Object.values(
    sectionData
  )
    .flat()
    .filter(block =>
      selectedIds.has(
        block.id
      )
    );
}


function copySelectedLyricsAppearance() {
  /*
   * 複数選択中でも、
   * 最後に操作した代表ブロックをコピーする。
   */
  const sourceBlock =
    (
      lastSelectedLyricsBlockId
        ? Object.values(
            sectionData
          )
            .flat()
            .find(
              block =>
                block.id ===
                lastSelectedLyricsBlockId
            )
        : null
    ) ||
    getSelectedLyricsBlockData();


  if (!sourceBlock) {
    return false;
  }


  const copied =
    window
      .LyricsEditorClipboard
      .copyAppearance(
        sourceBlock
      );


  if (copied) {
    console.log(
      '歌詞の見た目をコピーしました:',
      sourceBlock.text
    );
  }


  return copied;
}



function pasteLyricsAppearanceToSelection() {
  const targetBlocks =
    getSelectedLyricsBlocksData();


  if (!targetBlocks.length) {
    return false;
  }


  if (
    !window
      .LyricsEditorClipboard
      .hasAppearance()
  ) {
    return false;
  }


  /*
   * 貼り付け前の状態を保存。
   *
   * 複数ブロックへの貼り付けも
   * Undo 1回で戻せる。
   */
  const beforeState =
    captureEditorState();


  let pastedCount = 0;


  targetBlocks.forEach(block => {
    const pasted =
      window
        .LyricsEditorClipboard
        .pasteAppearance(
          block
        );

    if (pasted) {
      pastedCount += 1;
    }
  });


  if (!pastedCount) {
    return false;
  }


  renderSectionBlocks();
  applyLyricsBlockSelectionClasses();


  /*
   * 代表ブロックを
   * インスペクタへ再読込。
   */
  const representativeId =
    (
      lastSelectedLyricsBlockId &&
      selectedLyricsBlockIds.has(
        lastSelectedLyricsBlockId
      )
    )
      ? lastSelectedLyricsBlockId
      : (
          [
            ...selectedLyricsBlockIds
          ][0] ||
          null
        );


  const representativeElement =
    representativeId
      ? document.querySelector(
          `.lyricsBlock[data-block-id="${representativeId}"]`
        )
      : null;


  if (representativeElement) {
    loadLyricsBlockToInspector(
      representativeElement
    );
  }


  /*
   * Visualizer送信キャッシュを解除。
   */
  lastEditorActiveLyricsSignature =
    '';

  lastSentPreviewLyricsSignature =
    '';


  const representativeBlock =
    representativeId
      ? targetBlocks.find(
          block =>
            block.id ===
            representativeId
        )
      : targetBlocks[0];


  if (representativeBlock) {
    updateEditorPreview(
      representativeBlock,
      {
        animate: false
      }
    );

    sendLyricsBlockToVisualizer(
      representativeBlock
    );
  }


  commitEditorHistory(
    beforeState
  );


  console.log(
    `${pastedCount}件へ見た目を貼り付けました`
  );


  return true;
}


/* ==================================================
   Preview Center Guides
================================================== */

function ensurePreviewCenterGuides() {
  const canvas =
    document.getElementById(
      'editorPreviewCanvas'
    );

  if (!canvas) {
    return null;
  }


  let guideLayer =
    canvas.querySelector(
      '.previewSnapGuideLayer'
    );


  if (!guideLayer) {
    guideLayer =
      document.createElement(
        'div'
      );

    guideLayer.className =
      'previewSnapGuideLayer';


    const verticalGuide =
      document.createElement(
        'div'
      );

    verticalGuide.className =
      'previewSnapGuide previewSnapGuideVertical';


    const horizontalGuide =
      document.createElement(
        'div'
      );

    horizontalGuide.className =
      'previewSnapGuide previewSnapGuideHorizontal';


    const centerPoint =
      document.createElement(
        'div'
      );

    centerPoint.className =
      'previewSnapCenterPoint';


    guideLayer.append(
      verticalGuide,
      horizontalGuide,
      centerPoint
    );


    canvas.appendChild(
      guideLayer
    );
  }


  return {
    layer:
      guideLayer,

    vertical:
      guideLayer.querySelector(
        '.previewSnapGuideVertical'
      ),

    horizontal:
      guideLayer.querySelector(
        '.previewSnapGuideHorizontal'
      ),

    centerPoint:
      guideLayer.querySelector(
        '.previewSnapCenterPoint'
      )
  };
}


function updatePreviewCenterGuides({
  showX = false,
  showY = false
} = {}) {
  const guides =
    ensurePreviewCenterGuides();

  if (!guides) return;


  /*
   * X座標が中央に吸着
   * → 縦線を表示。
   */
  guides.vertical
    ?.classList.toggle(
      'is-visible',
      showX
    );


  /*
   * Y座標が中央に吸着
   * → 横線を表示。
   */
  guides.horizontal
    ?.classList.toggle(
      'is-visible',
      showY
    );


  /*
   * X・Y両方が中央なら
   * 中央ポイントも表示。
   */
  guides.centerPoint
    ?.classList.toggle(
      'is-visible',
      showX && showY
    );


  guides.layer
    ?.classList.toggle(
      'is-active',
      showX || showY
    );
}


function hidePreviewCenterGuides() {
  updatePreviewCenterGuides({
    showX: false,
    showY: false
  });
}



function setupPreviewLyricsDrag() {
  const previewLyrics =
    document.getElementById(
      'editorPreviewLyrics'
    );

  if (!previewLyrics) {
    return;
  }


  let isDragging = false;
  let hasMoved = false;

  let startMouseX = 0;
  let startMouseY = 0;

  let startX = 0;
  let startY = 0;

  let targetBlock = null;
  let beforeDragState = null;


  previewLyrics.addEventListener(
    'mousedown',
    event => {
      if (event.detail >= 2) {
        return;
      }

      if (
        event.target.closest(
          '.selectionHandle'
        )
      ) {
        return;
      }

      if (
        event.target.closest(
          '.selectionSideHandle'
        )
      ) {
        return;
      }

      if (event.button !== 0) {
        return;
      }


      targetBlock =
        getSelectedLyricsBlockData();

      if (!targetBlock) {
        return;
      }

      const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

if (!ratioLayout) {
  return;
}


      if (!targetBlock.position) {
        targetBlock.position = {
          x: 0,
          y: 0,
          z: 0
        };
      }

   

      /*
       * ドラッグ開始前の状態を保存。
       * 1回の移動をUndo 1回にする。
       */
      beforeDragState =
        captureEditorState();


      isDragging = true;
      hasMoved = false;


      startMouseX =
        event.clientX;

      startMouseY =
        event.clientY;


startX =
  Number(
    ratioLayout.position.x
  ) || 0;

startY =
  Number(
    ratioLayout.position.y
  ) || 0;

      previewLyrics.classList.add(
        'is-dragging'
      );


      hidePreviewCenterGuides();


      event.preventDefault();
      event.stopPropagation();
    }
  );


  document.addEventListener(
    'mousemove',
    event => {
      if (
        !isDragging ||
        !targetBlock
      ) {
        return;
      }


      const canvas =
        document.getElementById(
          'editorPreviewCanvas'
        );

      if (!canvas) {
        return;
      }


     const canvasScale =
  window.NorahViewport
    .getElementScale(
      canvas
    );

const scaleX =
  canvasScale.x;

const scaleY =
  canvasScale.y;


      if (
        !Number.isFinite(scaleX) ||
        !Number.isFinite(scaleY) ||
        scaleX <= 0 ||
        scaleY <= 0
      ) {
        return;
      }


      const mouseDeltaX =
        event.clientX -
        startMouseX;

      const mouseDeltaY =
        event.clientY -
        startMouseY;


      if (
        Math.abs(mouseDeltaX) > 2 ||
        Math.abs(mouseDeltaY) > 2
      ) {
        hasMoved = true;
      }


      const canvasDelta =
  window.NorahViewport
    .screenDeltaToCanvas(
      canvas,
      mouseDeltaX,
      mouseDeltaY
    );

const deltaX =
  canvasDelta.x;

const deltaY =
  canvasDelta.y;


      const rawX =
        startX +
        deltaX;

      const rawY =
        startY +
        deltaY;


      /*
       * 画面上で約12px以内に入ると
       * 中央へ吸着する。
       *
       * 表示倍率に左右されないように、
       * Canvas内部座標へ換算する。
       */
      const screenThreshold =
        12;

      const thresholdX =
        screenThreshold /
        scaleX;

      const thresholdY =
        screenThreshold /
        scaleY;


      /*
       * Shiftを押している間は
       * 中央スナップを一時解除。
       */
      const snapDisabled =
        event.shiftKey;


      const snapped =
        window.NorahSnapManager
          .snapPosition({
            x: rawX,
            y: rawY,

            targetX: 0,
            targetY: 0,

            thresholdX,
            thresholdY,

            disabled:
              snapDisabled
          });


     const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

ratioLayout.position.x =
  snapped.x;

ratioLayout.position.y =
  snapped.y;


      previewLyrics.style.transform =
        `translate(-50%, -50%) ` +
        `translate(${snapped.x}px, ${snapped.y}px)`;


      updatePreviewCenterGuides({
        showX:
          snapped.snappedX,

        showY:
          snapped.snappedY
      });
    }
  );


  document.addEventListener(
    'mouseup',
    () => {
      if (!isDragging) {
        return;
      }


      isDragging = false;


      previewLyrics.classList.remove(
        'is-dragging'
      );


      hidePreviewCenterGuides();


      if (
        !targetBlock ||
        !hasMoved
      ) {
        beforeDragState = null;
        targetBlock = null;
        hasMoved = false;

        return;
      }


      updateEditorPreview(
        targetBlock,
        {
          animate: false
        }
      );


      sendLyricsBlockToVisualizer(
        targetBlock
      );


      /*
       * ドラッグ全体を
       * Undo履歴へ1回だけ登録。
       */
      commitEditorHistory(
        beforeDragState
      );


      beforeDragState = null;
      targetBlock = null;
      hasMoved = false;
    }
  );


  /*
   * ウィンドウ外へマウスが出た場合も
   * ガイドだけは残さない。
   */
  window.addEventListener(
    'blur',
    hidePreviewCenterGuides
  );
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

const selection = window.getSelection();

if (selection) {
  selection.removeAllRanges();

  let range = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(
      event.clientX,
      event.clientY
    );
  }

  if (
    range &&
    previewLyrics.contains(range.startContainer)
  ) {
    range.collapse(true);
    selection.addRange(range);
  } else {
    range = document.createRange();
    range.selectNodeContents(previewLyrics);
    range.collapse(false);
    selection.addRange(range);
  }
}

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

   document.addEventListener('pointerdown', (event) => {

    if (!editingBlock) return;

    if (event.target.closest('#editorPreviewLyrics')) {
        return;
    }

    finishInlineLyricsEdit();

});
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
  const beforeState =
    captureEditorState();

  switch (
    shadowPresetInput.value
  ) {

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

  commitEditorHistory(
    beforeState
  );
}


function applyStylePreset() {
  const style =
    stylePresets[
      stylePresetInput.value
    ];

  if (!style) return;

  const beforeState =
    captureEditorState();

  colorInput.value =
    style.color;

  outlineColorInput.value =
    style.outlineColor;

  outlineWidthInput.value =
    style.outlineWidth;

  shadowPresetInput.value =
    style.shadowPreset;

  shadowColorInput.value =
    style.shadowColor;

  shadowBlurInput.value =
    style.shadowBlur;

  shadowXInput.value =
    style.shadowX;

  shadowYInput.value =
    style.shadowY;

  letterSpacingInput.value =
    style.letterSpacing;

  lineHeightInput.value =
    style.lineHeight;

  sendLyricsUpdate();

  commitEditorHistory(
    beforeState
  );
}


/*
 * プリセット操作を接続
 */
stylePresetInput?.addEventListener(
  'change',
  applyStylePreset
);

shadowPresetInput?.addEventListener(
  'change',
  applyShadowPreset
);

/*
 * 影プリセット変更
 */
shadowPresetInput?.addEventListener(
  'change',
  () => {
    applyShadowPreset();
  }
);




ipcRenderer.on('lyrics-editor-data', (event, data) => {
  if (!data) return;

  currentEditorSong = data;
  currentProjectPath = data.projectPath || null;

    updateEditorSongInfoPreview();

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

    resetEditorHistory();
  }

  document.title = `Lyrics Editor - ${data.title || ''}`;
});

let currentSectionName = 'Verse 1';



/* ==================================================
   Inspector Edit History
================================================== */

let inspectorHistoryBeforeState =
  null;


function beginInspectorHistory() {
  if (
    isEditorHistoryRestoring() ||
    inspectorHistoryBeforeState
  ) {
    return;
  }

  if (!getSelectedLyricsBlockData()) {
    return;
  }

  inspectorHistoryBeforeState =
    captureEditorState();
}


/*
 * インスペクタ編集を
 * Undo履歴へ1回だけ登録する。
 */
function commitInspectorHistory() {
  if (
    !inspectorHistoryBeforeState
  ) {
    return;
  }

  commitEditorHistory(
    inspectorHistoryBeforeState
  );

  inspectorHistoryBeforeState =
    null;
}


/*
 * 変更をキャンセルしたい場合などに使用。
 */
function cancelInspectorHistory() {
  inspectorHistoryBeforeState =
    null;
}



const sectionData = {
  'Verse 1': [],
  'Chorus': []
};

const selectedLyricsBlockIds = new Set();
let lastSelectedLyricsBlockId = null;
/*
 * セクションごとに、
 * 最後に編集していたブロックを記憶する。
 */
const lastSelectedBlockIdBySection =
  new Map();

/* ==================================================
   Editor History Connection
================================================== */


/*
 * 現在のNORAH Studio編集状態を取得する。
 */
function captureLyricsEditorState() {
  return {
    currentSectionName,

    sectionData:
      JSON.parse(
        JSON.stringify(
          sectionData
        )
      ),

    selectedBlockIds:
      [
        ...selectedLyricsBlockIds
      ],

    lastSelectedLyricsBlockId,

    sectionSelections:
      [
        ...lastSelectedBlockIdBySection
          .entries()
      ]
  };
}


/*
 * 履歴からNORAH Studioの状態を復元する。
 */
function restoreLyricsEditorState(
  state
) {
  if (!state) return;


  currentSectionName =
    state.currentSectionName ||
    currentSectionName;


  Object
    .keys(sectionData)
    .forEach(sectionName => {
      delete sectionData[
        sectionName
      ];
    });


  Object.assign(
    sectionData,
    JSON.parse(
      JSON.stringify(
        state.sectionData || {}
      )
    )
  );


  /*
   * 復元後に実在するブロックID。
   */
  const restoredBlockIds =
    new Set(
      Object.values(
        sectionData
      )
        .flat()
        .map(
          block => block.id
        )
    );


  selectedLyricsBlockIds.clear();

  (
    state.selectedBlockIds || []
  ).forEach(blockId => {
    if (
      restoredBlockIds.has(
        blockId
      )
    ) {
      selectedLyricsBlockIds.add(
        blockId
      );
    }
  });


  lastSelectedLyricsBlockId =
    (
      state.lastSelectedLyricsBlockId &&
      restoredBlockIds.has(
        state.lastSelectedLyricsBlockId
      )
    )
      ? state.lastSelectedLyricsBlockId
      : null;


  lastSelectedBlockIdBySection.clear();

  (
    state.sectionSelections || []
  ).forEach(
    ([sectionName, blockId]) => {
      if (
        restoredBlockIds.has(
          blockId
        )
      ) {
        lastSelectedBlockIdBySection.set(
          sectionName,
          blockId
        );
      }
    }
  );


  /*
   * タイムラインとセクション表示を復元。
   */
  renderSectionTabs();
  renderSectionBlocks();

  applyLyricsBlockSelectionClasses();


  const selectedBlockId =
    (
      lastSelectedLyricsBlockId &&
      selectedLyricsBlockIds.has(
        lastSelectedLyricsBlockId
      )
    )
      ? lastSelectedLyricsBlockId
      : (
          [
            ...selectedLyricsBlockIds
          ][0] ||
          null
        );


  const selectedElement =
    selectedBlockId
      ? document.querySelector(
          `.lyricsBlock[data-block-id="${selectedBlockId}"]`
        )
      : null;


  if (selectedElement) {
    loadLyricsBlockToInspector(
      selectedElement
    );
  } else {
    const previewLyrics =
      document.getElementById(
        'editorPreviewLyrics'
      );

    const previewLayer =
      document.getElementById(
        'editorPreviewLyricsLayer'
      );

    if (previewLyrics) {
      previewLyrics.innerHTML =
        '';
    }

    if (previewLayer) {
      previewLayer.innerHTML =
        '';
    }
  }


  /*
   * 再生プレビューとVisualizerの
   * キャッシュを解除する。
   */
  lastEditorActiveLyricsSignature =
    '';

  lastSentPreviewLyricsSignature =
    '';


  updateTimelineContentHeight();
  updateTimelineContentWidth();
  renderTimelineRuler();


  const restoredSelectedBlock =
    getSelectedLyricsBlockData();

  if (restoredSelectedBlock) {
    sendLyricsBlockToVisualizer(
      restoredSelectedBlock
    );
  }
}


/*
 * 共通履歴エンジンを初期化。
 */
const lyricsEditorHistory =
  window.LyricsEditorHistory.create({
    captureState:
      captureLyricsEditorState,

    restoreState:
      restoreLyricsEditorState,

    historyLimit:
      100
  });


/*
 * 既存コードとの互換用ラッパー。
 *
 * これまでの呼び出し箇所を
 * 変更しなくて済む。
 */
function captureEditorState() {
  return lyricsEditorHistory.capture();
}


function commitEditorHistory(
  beforeState
) {
  return lyricsEditorHistory.commit(
    beforeState
  );
}


function undoEditorAction() {
  cancelInspectorHistory?.();

  return lyricsEditorHistory.undo();
}


function redoEditorAction() {
  cancelInspectorHistory?.();

  return lyricsEditorHistory.redo();
}


function resetEditorHistory() {
  return lyricsEditorHistory.reset();
}


function isEditorHistoryRestoring() {
  return lyricsEditorHistory
    .isRestoring();
}

let currentEditorSong = null;
let currentProjectPath = null;
let editorAudio = null;
let editorAudioReady = false;

/* ==================================================
   Song Info Editor State
================================================== */

const SONG_INFO_STORAGE_KEY =
  'norahStudioSongInfoSettings';


let songInfoSettings = {
  visible:
    true,

  title:
    '',

  artist:
    '',

  showTitle:
    true,

  showArtist:
    true,

  showTime:
    true,

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


let selectedEditorObject =
  'lyrics';


function getCurrentSongInfoPosition() {
  const ratio =
    getCurrentEditorAspectRatio();

  const savedPosition =
    songInfoSettings
      ?.positionByRatio
      ?.[ratio];

  return {
    x:
      Number(
        savedPosition?.x
      ) || 0,

    y:
      Number(
        savedPosition?.y
      ) || 0
  };
}


/* ==================================================
   Song Info Inspector
================================================== */

const songInfoInspector =
  document.getElementById(
    'songInfoInspector'
  );

const songInfoVisibilityToggle =
  document.getElementById(
    'songInfoVisibilityToggle'
  );

const songInfoTitleInput =
  document.getElementById(
    'songInfoTitleInput'
  );

const songInfoArtistInput =
  document.getElementById(
    'songInfoArtistInput'
  );

const songInfoShowTitle =
  document.getElementById(
    'songInfoShowTitle'
  );

const songInfoShowArtist =
  document.getElementById(
    'songInfoShowArtist'
  );

const songInfoShowTime =
  document.getElementById(
    'songInfoShowTime'
  );


function updateSongInfoInspector() {
  if (
    !songInfoInspector
  ) {
    return;
  }


  if (songInfoTitleInput) {
    songInfoTitleInput.value =
      songInfoSettings.title ||
      currentEditorSong?.title ||
      currentEditorSong?.name ||
      '';
  }


  if (songInfoArtistInput) {
    songInfoArtistInput.value =
      songInfoSettings.artist ||
      currentEditorSong?.artist ||
      '';
  }


  if (songInfoShowTitle) {
    songInfoShowTitle.checked =
      songInfoSettings.showTitle !==
      false;
  }


  if (songInfoShowArtist) {
    songInfoShowArtist.checked =
      songInfoSettings.showArtist !==
      false;
  }


  if (songInfoShowTime) {
    songInfoShowTime.checked =
      songInfoSettings.showTime !==
      false;
  }


  if (
    songInfoVisibilityToggle
  ) {
    const visible =
      songInfoSettings.visible !==
      false;


    songInfoVisibilityToggle
      .classList.toggle(
        'is-active',
        visible
      );

    songInfoVisibilityToggle
      .setAttribute(
        'aria-pressed',
        String(visible)
      );

    songInfoVisibilityToggle
      .textContent =
        visible
          ? 'ON'
          : 'OFF';
  }
}


async function applySongInfoInspectorChange() {
  updateEditorSongInfoPreview();

  saveSongInfoSettingsLocally();

  try {
    await ipcRenderer.invoke(
      'set-song-info-editor-settings',
      {
        ...songInfoSettings
      }
    );
  } catch (error) {
    console.error(
      '[Song Info Editor] 設定送信に失敗しました:',
      error
    );
  }
}

songInfoVisibilityToggle
  ?.addEventListener(
    'click',
    () => {
      songInfoSettings.visible =
        songInfoSettings.visible ===
        false;

      updateSongInfoInspector();

      applySongInfoInspectorChange();
    }
  );


songInfoTitleInput
  ?.addEventListener(
    'input',
    () => {
      songInfoSettings.title =
        songInfoTitleInput.value;

      applySongInfoInspectorChange();
    }
  );


songInfoArtistInput
  ?.addEventListener(
    'input',
    () => {
      songInfoSettings.artist =
        songInfoArtistInput.value;

      applySongInfoInspectorChange();
    }
  );


songInfoShowTitle
  ?.addEventListener(
    'change',
    () => {
      songInfoSettings.showTitle =
        songInfoShowTitle.checked;

      applySongInfoInspectorChange();
    }
  );


songInfoShowArtist
  ?.addEventListener(
    'change',
    () => {
      songInfoSettings.showArtist =
        songInfoShowArtist.checked;

      applySongInfoInspectorChange();
    }
  );


songInfoShowTime
  ?.addEventListener(
    'change',
    () => {
      songInfoSettings.showTime =
        songInfoShowTime.checked;

      applySongInfoInspectorChange();
    }
  );


function updateEditorSongInfoPreview() {
  const songInfo =
    document.getElementById(
      'editorPreviewSongInfo'
    );

  const title =
    document.getElementById(
      'editorPreviewSongTitle'
    );

  const artist =
    document.getElementById(
      'editorPreviewSongArtist'
    );

  const time =
    document.getElementById(
      'editorPreviewSongTime'
    );


  if (!songInfo) {
    return;
  }


  const titleText =
    songInfoSettings.title ||
    currentEditorSong?.title ||
    currentEditorSong?.name ||
    'Song Title';


  const artistText =
    songInfoSettings.artist ||
    currentEditorSong?.artist ||
    'Artist';


  if (title) {
    title.textContent =
      titleText;

    title.classList.toggle(
      'is-hidden',
      songInfoSettings.showTitle ===
        false
    );
  }


  if (artist) {
    artist.textContent =
      artistText;

    artist.classList.toggle(
      'is-hidden',
      songInfoSettings.showArtist ===
        false
    );
  }


  if (time) {
    time.classList.toggle(
      'is-hidden',
      songInfoSettings.showTime ===
        false
    );
  }


  songInfo.classList.toggle(
    'is-hidden',
    songInfoSettings.visible ===
      false
  );


  const position =
    getCurrentSongInfoPosition();


  songInfo.style.setProperty(
    '--song-info-x',
    `${position.x}px`
  );

  songInfo.style.setProperty(
    '--song-info-y',
    `${position.y}px`
  );


  const isSelected =
    selectedEditorObject ===
    'songInfo';


  songInfo.classList.toggle(
    'is-selected',
    isSelected
  );


  document
    .getElementById(
      'songInfoLayerItem'
    )
    ?.classList.toggle(
      'is-selected',
      isSelected
    );
}


function selectSongInfoEditorObject() {
  selectedEditorObject =
    'songInfo';


  showInspectorByType(
    'Song Info'
  );


  updateEditorSongInfoPreview();

  updateSongInfoInspector();
}


function setupSongInfoLayerSelection() {
  const layerItem =
    document.getElementById(
      'songInfoLayerItem'
    );

  const songInfo =
    document.getElementById(
      'editorPreviewSongInfo'
    );


  layerItem?.addEventListener(
    'click',
    event => {
      event.preventDefault();
      event.stopPropagation();

      selectSongInfoEditorObject();
    }
  );


  songInfo?.addEventListener(
    'mousedown',
    event => {
      selectSongInfoEditorObject();

      event.preventDefault();
      event.stopPropagation();
    }
  );
}


/* ==================================================
   Common Preview Object Drag
================================================== */

function setupPreviewObjectDrag({
  element,
  getPosition,
  setPosition,
  onSelect = null,
  onDragStart = null,
  onDragMove = null,
  onDragEnd = null,
  snapToCenter = true
}) {
  const canvas =
    document.getElementById(
      'editorPreviewCanvas'
    );

  if (
    !element ||
    !canvas ||
    typeof getPosition !== 'function' ||
    typeof setPosition !== 'function'
  ) {
    return;
  }

  // 同じ要素への二重登録を防止
  if (
    element.dataset
      .previewObjectDragInitialized ===
    'true'
  ) {
    return;
  }

  element.dataset
    .previewObjectDragInitialized =
    'true';


  let isDragging = false;
  let hasMoved = false;

  let startMouseX = 0;
  let startMouseY = 0;

  let startX = 0;
  let startY = 0;


  function finishDrag() {
    if (!isDragging) {
      return;
    }

    isDragging = false;

    element.classList.remove(
      'is-dragging'
    );

    hidePreviewCenterGuides();

    if (
      hasMoved &&
      typeof onDragEnd === 'function'
    ) {
      onDragEnd();
    }

    hasMoved = false;
  }


  element.addEventListener(
    'mousedown',
    event => {
      if (event.button !== 0) {
        return;
      }

      /*
       * リサイズ・回転ハンドルを
       * ドラッグした場合は移動しない。
       */
      if (
        event.target.closest(
          '.selectionHandle'
        ) ||
        event.target.closest(
          '.selectionSideHandle'
        ) ||
        event.target.closest(
          '.rotationHandle'
        )
      ) {
        return;
      }


      const position =
        getPosition() || {
          x: 0,
          y: 0
        };


      startX =
        Number(position.x) || 0;

      startY =
        Number(position.y) || 0;

      startMouseX =
        event.clientX;

      startMouseY =
        event.clientY;

      isDragging = true;
      hasMoved = false;


      if (
        typeof onSelect ===
        'function'
      ) {
        onSelect();
      }

      if (
        typeof onDragStart ===
        'function'
      ) {
        onDragStart();
      }


      element.classList.add(
        'is-dragging'
      );

      hidePreviewCenterGuides();

      event.preventDefault();
      event.stopPropagation();
    }
  );


  document.addEventListener(
    'mousemove',
    event => {
      if (!isDragging) {
        return;
      }


      const mouseDeltaX =
        event.clientX -
        startMouseX;

      const mouseDeltaY =
        event.clientY -
        startMouseY;


      if (
        Math.abs(mouseDeltaX) > 2 ||
        Math.abs(mouseDeltaY) > 2
      ) {
        hasMoved = true;
      }


      const canvasDelta =
  window.NorahViewport
    .screenDeltaToCanvas(
      canvas,
      mouseDeltaX,
      mouseDeltaY
    );

const rawX =
  startX +
  canvasDelta.x;

const rawY =
  startY +
  canvasDelta.y;


      let nextPosition = {
        x: rawX,
        y: rawY,
        snappedX: false,
        snappedY: false
      };


      if (snapToCenter) {
        const canvasScale =
          window.NorahViewport
            .getElementScale(
              canvas
            );

        const scaleX =
          Number(canvasScale.x) || 1;

        const scaleY =
          Number(canvasScale.y) || 1;

        /*
         * 画面上で約12px以内に
         * 入ったら中央へ吸着。
         */
        const thresholdX =
          12 / scaleX;

        const thresholdY =
          12 / scaleY;


        nextPosition =
          window.NorahSnapManager
            .snapPosition({
              x: rawX,
              y: rawY,

              targetX: 0,
              targetY: 0,

              thresholdX,
              thresholdY,

              // Shift中はスナップ解除
              disabled:
                event.shiftKey
            });
      }


      setPosition({
        x: nextPosition.x,
        y: nextPosition.y
      });


      updatePreviewCenterGuides({
        showX:
          Boolean(
            nextPosition.snappedX
          ),

        showY:
          Boolean(
            nextPosition.snappedY
          )
      });


      if (
        typeof onDragMove ===
        'function'
      ) {
        onDragMove(
          nextPosition
        );
      }
    }
  );


  document.addEventListener(
    'mouseup',
    finishDrag
  );


  window.addEventListener(
    'blur',
    finishDrag
  );
}


/* ==================================================
   Song Info Drag
================================================== */

function setupSongInfoDrag() {
  const songInfo =
    document.getElementById(
      'editorPreviewSongInfo'
    );

  if (!songInfo) {
    return;
  }


  setupPreviewObjectDrag({
    element:
      songInfo,


    getPosition() {
      return (
        getCurrentSongInfoPosition()
      );
    },


    setPosition(position) {
      const ratio =
        getCurrentEditorAspectRatio();


      if (
        !songInfoSettings
          .positionByRatio
      ) {
        songInfoSettings
          .positionByRatio = {};
      }


      songInfoSettings
        .positionByRatio[
          ratio
        ] = {
          x:
            Math.round(
              Number(position.x) || 0
            ),

          y:
            Math.round(
              Number(position.y) || 0
            )
        };


      updateEditorSongInfoPreview();
    },


    onSelect() {
      selectSongInfoEditorObject();
    },


    onDragEnd() {
  saveSongInfoSettingsLocally();

  sendSongInfoSettingsToOutputs();
},
    snapToCenter:
      true
  });
}



function saveSongInfoSettingsLocally() {
  localStorage.setItem(
    SONG_INFO_STORAGE_KEY,
    JSON.stringify(
      songInfoSettings
    )
  );
}


function loadSongInfoSettingsLocally() {
  try {
    const saved =
      localStorage.getItem(
        SONG_INFO_STORAGE_KEY
      );


    if (!saved) {
      return;
    }


    const parsed =
      JSON.parse(saved);


    if (
      parsed &&
      typeof parsed ===
      'object'
    ) {
      songInfoSettings = {
        ...songInfoSettings,
        ...parsed,

        positionByRatio: {
          ...songInfoSettings
            .positionByRatio,

          ...parsed
            .positionByRatio
        }
      };
    }
  } catch (error) {
    console.warn(
      '[Song Info] 設定の読み込みに失敗しました',
      error
    );
  }
}




const EDITOR_STORAGE_KEY = 'norahStudioEditorData';

/* ==================================================
   Inspector Input Events
================================================== */


/*
 * テキスト系入力。
 *
 * フォーカスを得た時点から、
 * フォーカスを失うまでを
 * Undo 1回として扱う。
 */
[
  textInput,
  startTimeInput,
  endTimeInput
].forEach(input => {
  if (!input) return;

  input.addEventListener(
    'focus',
    beginInspectorHistory
  );

  input.addEventListener(
    'input',
    sendLyricsUpdate
  );

  input.addEventListener(
    'blur',
    commitInspectorHistory
  );
});


/*
 * スライダー系。
 *
 * ドラッグ開始から終了までを
 * Undo 1回として扱う。
 */
[
  sizeInput,
  opacityInput,
  outlineWidthInput,
  shadowBlurInput,
  shadowXInput,
  shadowYInput,
  letterSpacingInput,
  lineHeightInput
].forEach(input => {
  if (!input) return;

  input.addEventListener(
    'pointerdown',
    beginInspectorHistory
  );

  /*
   * キーボードの矢印キー操作にも対応。
   */
  input.addEventListener(
    'keydown',
    beginInspectorHistory
  );

  input.addEventListener(
    'input',
    sendLyricsUpdate
  );

  input.addEventListener(
    'pointerup',
    commitInspectorHistory
  );

  input.addEventListener(
    'change',
    commitInspectorHistory
  );

  input.addEventListener(
    'blur',
    commitInspectorHistory
  );
});


/*
 * 色入力。
 *
 * カラーピッカーを開く前に保存し、
 * 決定時に履歴へ登録する。
 */
[
  colorInput,
  outlineColorInput,
  shadowColorInput
].forEach(input => {
  if (!input) return;

  input.addEventListener(
    'pointerdown',
    beginInspectorHistory
  );

  input.addEventListener(
    'focus',
    beginInspectorHistory
  );

  input.addEventListener(
    'input',
    sendLyricsUpdate
  );

  input.addEventListener(
    'change',
    () => {
      sendLyricsUpdate();
      commitInspectorHistory();
    }
  );

  input.addEventListener(
    'blur',
    commitInspectorHistory
  );
});


/*
 * セレクト系。
 */
[
  fontInput,
  writingModeInput,
  alignInput
].forEach(input => {
  if (!input) return;

  input.addEventListener(
    'focus',
    beginInspectorHistory
  );

  input.addEventListener(
    'pointerdown',
    beginInspectorHistory
  );

  input.addEventListener(
    'change',
    () => {
      sendLyricsUpdate();
      commitInspectorHistory();
    }
  );

  input.addEventListener(
    'blur',
    commitInspectorHistory
  );
});

console.log('Lyrics Editor Loaded');

inDurationInput?.addEventListener(
  'input',
  () => {
    updateAnimationControlValues();
    previewAnimationFromControls('in');
  }
);

holdSpeedInput?.addEventListener(
  'input',
  () => {
    updateAnimationControlValues();
    previewAnimationFromControls('hold');
  }
);

holdStrengthInput?.addEventListener(
  'input',
  () => {
    updateAnimationControlValues();
    previewAnimationFromControls('hold');
  }
);

outDurationInput?.addEventListener(
  'input',
  () => {
    updateAnimationControlValues();
    previewAnimationFromControls('out');
  }
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

animationPresetInput?.addEventListener(
  'change',
  () => {
    updateAnimationDescription();
    previewAnimationFromControls('in');
  }
);

holdPresetInput?.addEventListener(
  'change',
  () => {
    updateHoldDescription();
    previewAnimationFromControls('hold');
  }
);

outPresetInput?.addEventListener(
  'change',
  () => {
    updateOutDescription();
    previewAnimationFromControls('out');
  }
);

updateAnimationControlValues();
updateHoldDescription();
updateOutDescription();


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
  updateEditorLyricsOutByTimeline();
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
  const primaryElapsedSeconds =
  editorAudio
    ? Math.max(
        0,
        editorAudio.currentTime -
        parseTimeToSeconds(
          primaryBlock.start
        )
      )
    : 0;

updateEditorPreview(
  primaryBlock,
  {
    animate:
      newlyActiveIds.has(
        primaryBlock.id
      ),

    holdElapsedSeconds:
      primaryElapsedSeconds
  }
);
/* 削除してもOK
  textInput.value = primaryBlock.text || '';
  startTimeInput.value =
    primaryBlock.start || '00:00.00';
  endTimeInput.value =
    primaryBlock.end || '00:03.00';

  animationPresetInput.value =
    primaryBlock.animationPreset || 'fade';
*/

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

   const elapsedSeconds =
  editorAudio
    ? Math.max(
        0,
        editorAudio.currentTime -
        parseTimeToSeconds(
          block.start
        )
      )
    : 0;

applyEditorLyricsHoldAnimation(
  item,
  payload.animation,
  elapsedSeconds
);

  });

  previousEditorActiveLyricsIds =
    nextActiveIds;
}



function buildLyricsPayloadForVisualizer(
  block
) {
  console.log(
    '★★★★ NEW buildLyricsPayloadForVisualizer RUNNING ★★★★',
    block
  );

  if (!block) return null;

  const style =
    block.style ||
    getCurrentInspectorStyle();


    const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    block
  );

  /*
   * 現在の再生時刻。
   *
   * 停止中や音源未読込なら0秒。
   */
  const currentTime =
    editorAudio
      ? Number(
          editorAudio.currentTime
        ) || 0
      : 0;


  const blockStart =
    parseTimeToSeconds(
      block.start
    );

  const blockEnd =
    parseTimeToSeconds(
      block.end
    );


  /*
   * 歌詞が始まってから何秒経過したか。
   * HOLDの位相同期に使う。
   */
  const elapsedSeconds =
    Math.max(
      0,
      currentTime -
        blockStart
    );


  /*
   * 歌詞終了まで残り何秒か。
   * OUTの進行計算に使う。
   */
  const remainingSeconds =
    Math.max(
      0,
      blockEnd -
        currentTime
    );


  return {
    id:
      block.id,

    sectionName:
      block.sectionName ||
      currentSectionName,

    start:
      block.start,

    end:
      block.end,

    layoutByRatio:
    block.layoutByRatio || null,

    elapsedSeconds,

    remainingSeconds,

    lines:
      String(
        block.text || ''
      ).split('\n'),

    text:
      block.text || '',

   position:
  ratioLayout?.position ||
  block.position ||
  {
    x: 0,
    y: 0,
    z: 0
  },

layout:
  ratioLayout?.layout ||
  block.layout ||
  {
    width: 900,
    rotation: 0
  },


    /*
     * IN / HOLD / OUTを
     * 新しい形式で送る。
     */
    animation:
      getNormalizedLyricsAnimation(
        block
      ),

    style: {
      font:
        style.font ||
        'Arial',

     size:
  Number(
    ratioLayout?.size ??
    style.size
  ) || 72,

      opacity:
        Number(style.opacity) || 100,

      color:
        style.color ||
        '#ffffff',

      writingMode:
  style.writingMode ||
  'horizontal',

  
      align:
        style.align ||
        'center',

      outlineColor:
        style.outlineColor ||
        '#000000',

      outlineWidth:
        Number(
          style.outlineWidth
        ) || 0,

      shadowColor:
        style.shadowColor ||
        '#000000',

      shadowBlur:
        Number(
          style.shadowBlur
        ) || 0,

      shadowX:
        Number(
          style.shadowX
        ) || 0,

      shadowY:
        Number(
          style.shadowY
        ) || 0,

      letterSpacing:
        Number(
          style.letterSpacing
        ) || 0,

      lineHeight:
        Number(
          style.lineHeight
        ) || 1.2
    }
  };
}

let lastSentPreviewLyricsSignature = '';

function updateEditorPreviewByTimeline() {
  const currentBlocks =
    getCurrentEditorLyricsBlocks();

  /*
   * 編集対象とは別に、
   * 現在再生されているブロックだけを表示する。
   */
  applyLyricsPlaybackClasses(
    currentBlocks
  );

  const signature =
  JSON.stringify(
    currentBlocks.map(
      block => block.id
    )
  );

  // 同じ歌詞構成なら再描画しない
  if (signature === lastEditorActiveLyricsSignature) {
    return;
  }

  lastEditorActiveLyricsSignature = signature;

 if (currentBlocks.length === 0) {
  previousEditorActiveLyricsIds = new Set();

  const previewLyrics =
    document.getElementById(
      'editorPreviewLyrics'
    );

  const layer =
    document.getElementById(
      'editorPreviewLyricsLayer'
    );

  if (previewLyrics) {
    previewLyrics.innerHTML = '';
  }

  if (layer) {
    layer.innerHTML = '';
  }

  lastSentPreviewLyricsSignature = '[]';

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

  const blockId =
    block.dataset.blockId;

  if (!blockId) return;


  const blocks =
    sectionData[
      currentSectionName
    ] || [];


  /*
   * 選択計算は外部モジュールへ委譲。
   */
  const result =
    window.LyricsEditorSelection
      .calculateSelection({
        blockId,

        blocks,

        selectedIds:
          selectedLyricsBlockIds,

        lastSelectedId:
          lastSelectedLyricsBlockId,

        additive,

        range
      });


  /*
   * Setオブジェクト自体は維持し、
   * 中身だけ更新する。
   *
   * Undoなどが同じSetを参照しているため。
   */
  selectedLyricsBlockIds.clear();

  result.selectedIds.forEach(
    selectedId => {
      selectedLyricsBlockIds.add(
        selectedId
      );
    }
  );


  lastSelectedLyricsBlockId =
    result.lastSelectedId;


  applyLyricsBlockSelectionClasses();


  /*
   * 最後に操作したブロックが
   * 選択状態なら編集対象として記憶。
   */
  if (
    selectedLyricsBlockIds.has(
      blockId
    )
  ) {
    lastSelectedBlockIdBySection.set(
      currentSectionName,
      blockId
    );

    loadLyricsBlockToInspector(
      block
    );
  }
}


function applyLyricsBlockSelectionClasses() {
  window.LyricsEditorSelection
    .applySelectionClasses({
      selector:
        '.lyricsBlock',

      selectedIds:
        selectedLyricsBlockIds
    });
}

function applyLyricsPlaybackClasses(
  activeBlocks = []
) {
  window.LyricsEditorSelection
    .applyPlaybackClasses({
      selector:
        '.lyricsBlock',

      activeBlocks
    });
}




function restoreLyricsSelectionForSection(
  sectionName,
  {
    selectFirstWhenEmpty = true
  } = {}
) {
  const blocks =
    sectionData[
      sectionName
    ] || [];


  const savedBlockId =
    lastSelectedBlockIdBySection.get(
      sectionName
    );


  const targetBlockId =
    window.LyricsEditorSelection
      .resolveSectionSelection({
        blocks,

        savedBlockId,

        selectFirstWhenEmpty
      });


  selectedLyricsBlockIds.clear();


  if (!targetBlockId) {
    lastSelectedLyricsBlockId =
      null;

    applyLyricsBlockSelectionClasses();

    return;
  }


  selectedLyricsBlockIds.add(
    targetBlockId
  );


  lastSelectedLyricsBlockId =
    targetBlockId;


  lastSelectedBlockIdBySection.set(
    sectionName,
    targetBlockId
  );


  applyLyricsBlockSelectionClasses();


  const targetElement =
    document.querySelector(
      `.lyricsBlock[data-block-id="${targetBlockId}"]`
    );


  if (targetElement) {
    loadLyricsBlockToInspector(
      targetElement
    );
  }
}



function loadLyricsBlockToInspector(block) {
  selectedEditorObject =
  'lyrics';

showInspectorByType(
  '歌詞'
);

updateEditorSongInfoPreview();
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
updateHoldDescription();
updateOutDescription();

  const style = blockData.style || {};

  fontInput.value = style.font || fontInput.value || 'Arial';
  opacityInput.value = style.opacity ?? 100;
  sizeInput.value = style.size ?? 72;
  colorInput.value = style.color || '#ffffff';
  writingModeInput.value = style.writingMode || 'horizontal';
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
  opacityValue.textContent = `${opacityInput.value}%`;

  outlineWidthValue.textContent = outlineWidthInput.value;
  shadowBlurValue.textContent = shadowBlurInput.value;
  shadowXValue.textContent = shadowXInput.value;
  shadowYValue.textContent = shadowYInput.value;
  letterSpacingValue.textContent = letterSpacingInput.value;
  lineHeightValue.textContent = lineHeightInput.value;

  updateEditorPreview(
  blockData,
  {
    animate: false
  }
);
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
      font:
  fontInput.value ||
  'Noto Sans JP',
      size: Number(sizeInput.value) || 72,
      opacity: Number(opacityInput.value),
      color: colorInput.value || '#ffffff',
      writingMode: writingModeInput?.value || 'horizontal',
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
  const blocks =
    sectionData[
      currentSectionName
    ] || [];


  lyricsEditorTimeline
    .renderBlocks({
      container:
        lyricsBlockList,

      blocks,

      sectionName:
        currentSectionName,

      createElement({
        blockData,
        blocks:
          currentBlocks
      }) {
        return createLyricsBlockFromData(
          blockData,
          currentBlocks
        );
      },

      applySelection:
        applyLyricsBlockSelectionClasses,

      updateHeight:
        updateTimelineContentHeight
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

function createLyricsBlockFromData(
  blockData,
  blocks =
    sectionData[
      currentSectionName
    ] || []
) {
  return lyricsEditorTimeline
    .createBlockElement({
      blockData,
      blocks,

      sectionName:
        currentSectionName,

      timelineScale,

      rowHeight:
        TIMELINE_ROW_HEIGHT,

      minBlockWidth:
        TIMELINE_MIN_BLOCK_WIDTH,

      parseTime:
        parseTimeToSeconds,

      getAnimationLabel,

      onSelect:
        selectLyricsBlock,

      onTimingRestart:
        prepareTimingRestartFromBlock,

      isTimingInputMode,

      setupDrag:
        setupTimelineBlockDrag,

      setupResize:
        setupTimelineResize
    });
}


function setupTimelineBlockDrag(
  block,
  blockData
) {
  lyricsEditorTimeline
    .setupBlockDrag({
      block,
      blockData,

      captureHistory:
        captureEditorState,

      commitHistory:
        commitEditorHistory,

      parseTime:
        parseTimeToSeconds,

      formatTime:
        formatSecondsToTime,

      getScale() {
        return timelineScale;
      },

      selectBlock:
        selectLyricsBlock,

      updatePreview:
        updateEditorPreview,

      startTimeInput,
      endTimeInput
    });
}



function setupTimelineResize(
  block,
  blockData
) {
  lyricsEditorTimeline
    .setupBlockResize({
      block,
      blockData,

      minBlockWidth:
        TIMELINE_MIN_BLOCK_WIDTH,

      getScale() {
        return timelineScale;
      },

      parseTime:
        parseTimeToSeconds,

      formatTime:
        formatSecondsToTime,

      captureHistory:
        captureEditorState,

      commitHistory:
        commitEditorHistory,

      getSelectedIds() {
        return selectedLyricsBlockIds;
      },

      getLastSelectedId() {
        return lastSelectedLyricsBlockId;
      },

      setSelection(
        blockId
      ) {
        selectedLyricsBlockIds.clear();

        selectedLyricsBlockIds.add(
          blockId
        );

        lastSelectedLyricsBlockId =
          blockId;

        lastSelectedBlockIdBySection.set(
          currentSectionName,
          blockId
        );
      },

      applySelectionClasses:
        applyLyricsBlockSelectionClasses,

      loadInspector:
        loadLyricsBlockToInspector,

      renderBlocks:
        renderSectionBlocks,

      updatePreview:
        updateEditorPreview,

      sendToVisualizer:
        sendLyricsBlockToVisualizer
    });
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


if (
  addLyricsBlockButton &&
  lyricsBlockList
) {
  addLyricsBlockButton.addEventListener(
    'click',
    () => {
      const beforeState =
        captureEditorState();

      if (
        !sectionData[
          currentSectionName
        ]
      ) {
        sectionData[
          currentSectionName
        ] = [];
      }

      const blockData =
        createLyricsBlockData();

      sectionData[
        currentSectionName
      ].push(
        blockData
      );

      renderSectionBlocks();

      const newBlock =
        document.querySelector(
          `.lyricsBlock[data-block-id="${blockData.id}"]`
        );

      if (newBlock) {
        selectLyricsBlock(
          newBlock
        );
      }

      commitEditorHistory(
        beforeState
      );
    }
  );
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

function duplicateSelectedLyricsBlock() {
  const selectedBlock =
    getSelectedLyricsBlock();

  if (!selectedBlock) {
    return false;
  }

  const blockId =
    selectedBlock.dataset.blockId;

  const blocks =
    sectionData[
      currentSectionName
    ] || [];

  const index =
    blocks.findIndex(
      block =>
        block.id === blockId
    );

  if (index === -1) {
    return false;
  }

  const beforeState =
    captureEditorState();

  const original =
    blocks[index];

  /*
   * ネストされたstyle・animation・
   * position・layoutも独立させる。
   */
  const copy =
    JSON.parse(
      JSON.stringify(
        original
      )
    );

  copy.id =
    `block_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}`;

  /*
   * 元ブロックと完全に重なると
   * 複製されたことが分かりにくいため、
   * タイムライン上で少し後ろへずらす。
   */
  

  blocks.splice(
    index + 1,
    0,
    copy
  );

  /*
   * 複製したブロックだけを
   * 編集対象にする。
   */
  selectedLyricsBlockIds.clear();

  selectedLyricsBlockIds.add(
    copy.id
  );

  lastSelectedLyricsBlockId =
    copy.id;

  lastSelectedBlockIdBySection.set(
    currentSectionName,
    copy.id
  );

  renderSectionBlocks();
  applyLyricsBlockSelectionClasses();

  const newBlockElement =
    document.querySelector(
      `.lyricsBlock[data-block-id="${copy.id}"]`
    );

  if (newBlockElement) {
    loadLyricsBlockToInspector(
      newBlockElement
    );
  }

  commitEditorHistory(
    beforeState
  );

  return true;
}


if (
  duplicateLyricsBlockButton &&
  lyricsBlockList
) {
  duplicateLyricsBlockButton.addEventListener(
    'click',
    duplicateSelectedLyricsBlock
  );
}


applyAllAnimationButton?.addEventListener(
  'click',
  () => {

    const draftAnimation =
      getAnimationDraftFromControls();

    applyAnimationValueToScope(
      block => {

        block.animation = {
          in: {
            ...draftAnimation.in
          },

          hold: {
            ...draftAnimation.hold
          },

          out: {
            ...draftAnimation.out
          }
        };

        /*
         * 旧形式との互換用。
         */
        block.animationPreset =
          block.animation.in.preset;
      }
    );
  }
);



if (deleteLyricsBlockButton) {
  deleteLyricsBlockButton.addEventListener(
    'click',
    () => {
      if (
        selectedLyricsBlockIds.size === 0
      ) {
        return;
      }

      const deleteIds =
        new Set(
          selectedLyricsBlockIds
        );

      const deleteCount =
        deleteIds.size;

      const ok =
        confirm(
          `${deleteCount}個の歌詞ブロックを削除しますか？`
        );

      if (!ok) return;


      /*
       * 削除前の状態を保存。
       * 複数選択情報もここに含まれる。
       */
      const beforeState =
        captureEditorState();


      const blocks =
        sectionData[
          currentSectionName
        ] || [];


      /*
       * 削除対象のうち、
       * 最も上にあるブロック位置を取得。
       *
       * 削除後は、この位置に近い
       * 生き残ったブロックを選択する。
       */
      const deletedIndexes =
        blocks
          .map(
            (block, index) =>
              deleteIds.has(block.id)
                ? index
                : -1
          )
          .filter(
            index => index >= 0
          );

      const firstDeletedIndex =
        deletedIndexes.length
          ? Math.min(
              ...deletedIndexes
            )
          : 0;


      const nextBlocks =
        blocks.filter(
          block =>
            !deleteIds.has(
              block.id
            )
        );

      sectionData[
        currentSectionName
      ] = nextBlocks;


      selectedLyricsBlockIds.clear();
      lastSelectedLyricsBlockId =
        null;

      lastSelectedBlockIdBySection.delete(
        currentSectionName
      );


      /*
       * 削除位置に近いブロックを
       * 次の編集対象にする。
       */
      const nextSelectedBlock =
        nextBlocks[
          Math.min(
            firstDeletedIndex,
            Math.max(
              0,
              nextBlocks.length - 1
            )
          )
        ] || null;

      if (nextSelectedBlock) {
        selectedLyricsBlockIds.add(
          nextSelectedBlock.id
        );

        lastSelectedLyricsBlockId =
          nextSelectedBlock.id;

        lastSelectedBlockIdBySection.set(
          currentSectionName,
          nextSelectedBlock.id
        );
      }


      renderSectionBlocks();
      applyLyricsBlockSelectionClasses();


      if (nextSelectedBlock) {
        const nextElement =
          document.querySelector(
            `.lyricsBlock[data-block-id="${nextSelectedBlock.id}"]`
          );

        if (nextElement) {
          loadLyricsBlockToInspector(
            nextElement
          );
        }
      } else {
        const previewLyrics =
          document.getElementById(
            'editorPreviewLyrics'
          );

        const previewLayer =
          document.getElementById(
            'editorPreviewLyricsLayer'
          );

        if (previewLyrics) {
          previewLyrics.innerHTML =
            '';
        }

        if (previewLayer) {
          previewLayer.innerHTML =
            '';
        }
      }


      updateTimelineContentHeight();


      /*
       * 削除操作を履歴へ1回だけ登録。
       */
      commitEditorHistory(
        beforeState
      );
    }
  );
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

function showSection(
  sectionName
) {
  /*
   * 切り替え前のセクションについて、
   * 現在の編集対象を保存する。
   */
  if (
    currentSectionName &&
    lastSelectedLyricsBlockId
  ) {
    lastSelectedBlockIdBySection.set(
      currentSectionName,
      lastSelectedLyricsBlockId
    );
  }

  currentSectionName =
    sectionName;

  if (
    !sectionData[
      currentSectionName
    ]
  ) {
    sectionData[
      currentSectionName
    ] = [];
  }

  const sectionTitle =
    document.querySelector(
      '.sectionTitle'
    );

  if (sectionTitle) {
    sectionTitle.textContent =
      sectionName;
  }

  renderSectionBlocks();

  /*
   * 先頭へ強制移動せず、
   * このセクションで最後に編集していた
   * ブロックを復元する。
   */
  restoreLyricsSelectionForSection(
    currentSectionName
  );

  renderSectionTabs();
}




function showInspectorByType(type) {
  document
    .querySelectorAll(
      '.inspectorContent'
    )
    .forEach(panel => {
      panel.classList.remove(
        'is-active'
      );
    });


  let targetId =
    'lyricsInspector';


  if (
    type === 'Song Info' ||
    type === 'songInfo'
  ) {
    targetId =
      'songInfoInspector';

  } else if (
    type === '背景'
  ) {
    targetId =
      'backgroundInspector';

  } else if (
    type === '画像'
  ) {
    targetId =
      'imageInspector';

  } else if (
    type === '動画'
  ) {
    targetId =
      'videoInspector';

  } else if (
    type === 'パーティクル'
  ) {
    targetId =
      'particleInspector';

  } else if (
    type === '歌詞'
  ) {
    targetId =
      'lyricsInspector';
  }


  document
    .getElementById(
      targetId
    )
    ?.classList.add(
      'is-active'
    );
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
    opacity: Number(opacityInput.value),
    color: colorInput.value || '#ffffff',
    writingMode: writingModeInput?.value || 'horizontal',
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


/*
 * 配置タブの「文字配置」で扱う値だけ取得。
 *
 * position / width / rotation / size は含めない。
 */
function getCurrentLayoutTabValues() {
  return {
    writingMode:
      writingModeInput?.value ||
      'horizontal',

    align:
      alignInput?.value ||
      'center',

    letterSpacing:
      Number(
        letterSpacingInput?.value
      ) || 0,

    lineHeight:
      Number(
        lineHeightInput?.value
      ) || 1.2
  };
}


function getLayoutApplyScope() {
  return (
    document.querySelector(
      'input[name="layoutApplyScope"]:checked'
    )?.value ||
    'selected'
  );
}


function applyCurrentLayoutToScope() {

  const scope =
    getLayoutApplyScope();

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

  const beforeState =
    captureEditorState();

  const layoutValues =
    getCurrentLayoutTabValues();


  targetBlocks.forEach(
    block => {

      /*
       * 現在のstyleを保持しつつ、
       * 文字配置項目だけ上書き。
       */
      block.style = {
        ...(block.style || {}),
        ...layoutValues
      };
    }
  );


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
      selectedData,
      {
        animate: false
      }
    );

    sendLyricsBlockToVisualizer(
      selectedData
    );
  }


  commitEditorHistory(
    beforeState
  );
}

applyLayoutScopeButton
  ?.addEventListener(
    'click',
    applyCurrentLayoutToScope
  );


function getCurrentEffectTabValues() {
  return {
    shadowColor:
      shadowColorInput?.value ||
      '#000000',

    shadowBlur:
      Number(
        shadowBlurInput?.value
      ) || 0,

    shadowX:
      Number(
        shadowXInput?.value
      ) || 0,

    shadowY:
      Number(
        shadowYInput?.value
      ) || 0
  };
}

function getEffectApplyScope() {
  return (
    document.querySelector(
      'input[name="effectApplyScope"]:checked'
    )?.value ||
    'selected'
  );
}

function applyCurrentEffectToScope() {

  const scope =
    getEffectApplyScope();

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

  const beforeState =
    captureEditorState();

  const effectValues =
    getCurrentEffectTabValues();


  targetBlocks.forEach(
    block => {

      block.style = {
        ...(block.style || {}),
        ...effectValues
      };
    }
  );


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
      selectedData,
      {
        animate: false
      }
    );

    sendLyricsBlockToVisualizer(
      selectedData
    );
  }


  commitEditorHistory(
    beforeState
  );
}

applyEffectScopeButton
  ?.addEventListener(
    'click',
    applyCurrentEffectToScope
  );





/*
 * スタイルタブで扱う項目だけ取得。
 *
 * 配置・影・アニメーション等は含めない。
 */
function getCurrentStyleTabValues() {
  return {
    font:
      fontInput.value ||
      'Arial',

    size:
      Number(
        sizeInput.value
      ) || 72,

    opacity:
      Number(
        opacityInput.value
      ),

    color:
      colorInput.value ||
      '#ffffff',

    outlineColor:
      outlineColorInput.value ||
      '#000000',

    outlineWidth:
      Number(
        outlineWidthInput.value
      ) || 0
  };
}



function getStyleApplyScope() {
  return (
    document.querySelector(
      'input[name="styleApplyScope"]:checked'
    )?.value ||
    'selected'
  );
}


function applyCurrentStyleToScope() {

  const scope =
    getStyleApplyScope();

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

  const beforeState =
    captureEditorState();

  const styleValues =
    getCurrentStyleTabValues();


  targetBlocks.forEach(
    block => {

      /*
       * 既存Styleを残しながら、
       * スタイルタブの項目だけ上書き。
       */
      block.style = {
        ...(block.style || {}),
        ...styleValues
      };
    }
  );


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
      selectedData,
      {
        animate: false
      }
    );

    sendLyricsBlockToVisualizer(
      selectedData
    );
  }


  commitEditorHistory(
    beforeState
  );
}


applyStyleScopeButton
  ?.addEventListener(
    'click',
    applyCurrentStyleToScope
  );





function getEditorPreviewScale() {
  const stage =
    document.getElementById(
      'editorPreviewStage'
    );

  if (!stage) return 1;

  const isWide =
    stage.classList.contains(
      'ratio-16-9'
    );

  const baseWidth =
    isWide ? 1920 : 1080;

  const baseHeight =
    isWide ? 1080 : 1920;

  return Math.min(
    stage.clientWidth / baseWidth,
    stage.clientHeight / baseHeight
  );
}


function applyPreviewLyricsPosition(blockData) {
  const previewLyrics = document.getElementById('editorPreviewLyrics');
  if (!previewLyrics) return;

  const position = blockData?.position || { x: 0, y: 0 };

  previewLyrics.style.transform =
    `translate(-50%, -50%) translate(${Number(position.x) || 0}px, ${Number(position.y) || 0}px)`;
}


function sendLyricsBlockToVisualizer(
  block
) {
  if (!block) return;

  /*
   * 再生中は現在表示対象の全ブロックを送る。
   * 編集中のブロックだけは最新データへ差し替える。
   */
  if (
    editorAudio &&
    editorAudioReady &&
    !editorAudio.paused
  ) {
    const activeBlocks =
      getCurrentEditorLyricsBlocks();

    const syncedBlocks =
      activeBlocks.map(activeBlock => {
        if (
          activeBlock.id === block.id
        ) {
          return block;
        }

        return activeBlock;
      });

    sendLyricsBlocksToVisualizer(
      syncedBlocks
    );

    return;
  }

  /*
   * 停止中は対象ブロックを単体で送る。
   */
  const payload =
    buildLyricsPayloadForVisualizer(
      block
    );

  if (!payload) return;

  lastSentPreviewLyricsSignature =
    '';

  ipcRenderer.invoke(
    'send-lyrics-to-visualizer',
    {
      source:
        'lyrics-editor',

      blocks:
        [payload]
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
  const stage =
    document.getElementById(
      'editorPreviewStage'
    );

  const canvas =
    document.getElementById(
      'editorPreviewCanvas'
    );

  if (!stage || !canvas) {
    return;
  }

  const isWide =
    stage.classList.contains(
      'ratio-16-9'
    );

  const ratio =
    isWide
      ? '16:9'
      : '9:16';

  window.NorahViewport.fitCanvas({
    container: stage,
    canvas,
    ratio,
    cssVariable:
      '--editor-preview-canvas-scale'
  });
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
    const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

if (!ratioLayout) {
  return;
}

startFontSize =
  Number(
    ratioLayout.size
  ) || 72;

    event.preventDefault();
    event.stopPropagation();
  });

  document.addEventListener('mousemove', (event) => {
    if (!resizing || !targetBlock) return;

    const dx = event.clientX - startMouseX;

    const newSize = Math.max(10, Math.round(startFontSize + dx));

    const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

if (!ratioLayout) {
  return;
}

ratioLayout.size =
  newSize;

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

    const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

if (!ratioLayout) {
  return;
}

resizing = true;
startMouseX =
  event.clientX;

startWidth =
  Number(
    ratioLayout.layout?.width
  ) || 900;


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

  const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

if (!ratioLayout) {
  return;
}

ratioLayout.layout.width =
  newWidth;

  updateEditorPreview(targetBlock);
  sendLyricsBlockToVisualizer(targetBlock);
});

  document.addEventListener('mouseup', () => {
    resizing = false;
    targetBlock = null;
    activeSide = null;
  });
}

function clearLyricsBlockSelection() {
  selectedLyricsBlockIds.clear();

  lastSelectedLyricsBlockId =
    null;

  lastSelectedBlockIdBySection.delete(
    currentSectionName
  );

  cancelInspectorHistory();

  applyLyricsBlockSelectionClasses();
}


function releaseLyricsEditorInputFocus() {
  const activeElement =
    document.activeElement;

  if (
    activeElement &&
    activeElement !== document.body &&
    typeof activeElement.blur ===
      'function'
  ) {
    activeElement.blur();
  }

  /*
   * contentEditableの文字選択やカーソルも解除。
   */
  const selection =
    window.getSelection();

  selection?.removeAllRanges();
}


function setupTimelineSeekByClick() {
  const trackArea =
    document.querySelector(
      '.timelineScrollArea'
    );

  const timelineContent =
    document.getElementById(
      'lyricsBlockList'
    );

  if (
    !trackArea ||
    !timelineContent
  ) {
    return;
  }

  trackArea.addEventListener(
    'mousedown',
    event => {
      /*
       * 歌詞ブロックの通常操作は妨げない。
       */
      if (
        event.target.closest(
          '.lyricsBlock'
        )
      ) {
        return;
      }

      /*
       * 再生バーのドラッグ操作は妨げない。
       */
      if (
        event.target.closest(
          '#timelinePlayhead'
        )
      ) {
        return;
      }

      /*
       * 最重要：
       * タイムライン空白を押したら、
       * Inspectorやインライン編集から
       * キーボードフォーカスを外す。
       *
       * event.preventDefault()より先に実行する。
       */
      releaseLyricsEditorInputFocus();

      /*
       * 歌詞ブロックの選択も解除。
       */
      selectedLyricsBlockIds.clear();

      lastSelectedLyricsBlockId =
        null;

      lastSelectedBlockIdBySection.delete(
        currentSectionName
      );

      cancelInspectorHistory();

      applyLyricsBlockSelectionClasses();

      /*
       * 音源がなくても、
       * フォーカスと選択の解除までは実行する。
       */
      if (
        !editorAudio ||
        !editorAudioReady
      ) {
        return;
      }

      autoFollowPlayhead =
        true;

      const rect =
        timelineContent
          .getBoundingClientRect();

      const x =
        event.clientX -
        rect.left;

      const nextTime =
        Math.max(
          0,
          x / timelineScale
        );

      lastEditorActiveLyricsSignature =
        '';

      editorAudio.currentTime =
        nextTime;

      updateTimelinePlayhead();
      updateEditorPreviewByTimeline();

      event.preventDefault();
    }
  );
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


/* ==================================================
   Timeline Compatibility Wrappers
================================================== */

function renderTimelineRuler() {
  return lyricsEditorTimeline
    .renderRuler();
}


function getTimelineTotalWidth() {
  return lyricsEditorTimeline
    .getTotalWidth();
}


function updateTimelineContentWidth() {
  return lyricsEditorTimeline
    .updateContentWidth();
}


function updateTimelineContentHeight() {
  return lyricsEditorTimeline
    .updateContentHeight();
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
  let hasRotated = false;

  let targetBlock = null;
  let beforeRotateState = null;

  let startAngle = 0;
  let startRotation = 0;


  document.addEventListener(
    'mousedown',
    event => {
      const handle =
        event.target.closest(
          '.selectionHandle.topRight'
        );

      if (!handle) return;
      if (event.button !== 0) return;


      const previewLyrics =
        document.getElementById(
          'editorPreviewLyrics'
        );

      if (!previewLyrics) return;


      targetBlock =
        getSelectedLyricsBlockData();

      if (!targetBlock) return;


      const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

if (!ratioLayout) {
  return;
}


      /*
       * 回転開始前の状態を保存。
       * 1回の回転ドラッグを
       * Undo 1回として扱う。
       */
      beforeRotateState =
        captureEditorState();


      const rect =
        previewLyrics
          .getBoundingClientRect();

      const centerX =
        rect.left +
        rect.width / 2;

      const centerY =
        rect.top +
        rect.height / 2;


      startAngle =
        Math.atan2(
          event.clientY - centerY,
          event.clientX - centerX
        );


      startRotation =
  Number(
    ratioLayout.layout?.rotation
  ) || 0;


      rotating = true;
      hasRotated = false;


      event.preventDefault();
      event.stopPropagation();
    }
  );


  document.addEventListener(
    'mousemove',
    event => {
      if (
        !rotating ||
        !targetBlock
      ) {
        return;
      }


      const previewLyrics =
        document.getElementById(
          'editorPreviewLyrics'
        );

      if (!previewLyrics) return;


      const rect =
        previewLyrics
          .getBoundingClientRect();

      const centerX =
        rect.left +
        rect.width / 2;

      const centerY =
        rect.top +
        rect.height / 2;


      const currentAngle =
        Math.atan2(
          event.clientY - centerY,
          event.clientX - centerX
        );


      const deltaDeg =
        (
          currentAngle -
          startAngle
        ) *
        180 /
        Math.PI;


      const rawRotation =
        startRotation +
        deltaDeg;


      /*
       * Shiftを押している間だけ
       * 45度刻みへスナップ。
       */
      const nextRotation =
        event.shiftKey
          ? Math.round(
              rawRotation / 45
            ) * 45
          : Math.round(
              rawRotation
            );


      const ratioLayout =
  getLyricsLayoutForCurrentRatio(
    targetBlock
  );

if (!ratioLayout) {
  return;
}

if (
  nextRotation !==
  ratioLayout.layout.rotation
) {
  hasRotated = true;
}

ratioLayout.layout.rotation =
  nextRotation;


      updateEditorPreview(
        targetBlock,
        {
          animate: false
        }
      );


      sendLyricsBlockToVisualizer(
        targetBlock
      );
    }
  );


  document.addEventListener(
    'mouseup',
    () => {
      if (!rotating) return;


      rotating = false;


      if (
        targetBlock &&
        hasRotated
      ) {
        commitEditorHistory(
          beforeRotateState
        );
      }


      beforeRotateState = null;
      targetBlock = null;
      hasRotated = false;
    }
  );


  /*
   * ウィンドウ外でマウスを離した場合も
   * 回転状態を解除する。
   */
  window.addEventListener(
    'blur',
    () => {
      rotating = false;
      beforeRotateState = null;
      targetBlock = null;
      hasRotated = false;
    }
  );
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


document.addEventListener(
  'keydown',
  event => {
    /*
     * 長押しによる連続実行を防ぐ。
     */
    if (event.repeat) return;


    /*
     * テキスト入力中は、
     * Spaceを通常の文字入力として扱う。
     */
    if (isTypingInInputElement()) {
      return;
    }


    /*
     * Space：
     * 通常編集・タイミング入力の両方で
     * 再生／停止する。
     */
    if (event.code === 'Space') {
      event.preventDefault();

      if (
        !editorAudio ||
        !editorAudioReady
      ) {
        return;
      }

      if (editorAudio.paused) {
        editorAudio
          .play()
          .catch(error => {
            console.warn(
              'Editor audio play failed:',
              error
            );
          });
      } else {
        editorAudio.pause();
      }

      return;
    }


    /*
     * B／Eはタイミング入力ON時だけ使用。
     */
    if (!isTimingInputMode) {
      return;
    }


    if (
      event.key.toLowerCase() ===
      'b'
    ) {
      event.preventDefault();

      handleTimingInputB();

      return;
    }


    if (
      event.key.toLowerCase() ===
      'e'
    ) {
      event.preventDefault();

      handleTimingInputE();
    }
  }
);



document.addEventListener(
  'keydown',
  event => {
    const modifierPressed =
      event.metaKey ||
      event.ctrlKey;

    if (!modifierPressed) {
      return;
    }


    /*
     * テキスト入力中はブラウザ標準の
     * 文字単位Undoを優先する。
     */
    const target =
      event.target;

    const isTextEditing =
      target instanceof
        HTMLTextAreaElement ||
      (
        target instanceof
          HTMLInputElement &&
        ![
          'range',
          'color',
          'checkbox',
          'radio',
          'button'
        ].includes(
          target.type
        )
      ) ||
      target?.isContentEditable;

    if (isTextEditing) {
      return;
    }


    const key =
      event.key.toLowerCase();


    /*
     * Command/Ctrl + Shift + Z
     * またはCtrl + Y
     * → Redo
     */
    if (
      (
        key === 'z' &&
        event.shiftKey
      ) ||
      (
        key === 'y' &&
        event.ctrlKey &&
        !event.metaKey
      )
    ) {
      event.preventDefault();

      redoEditorAction();

      return;
    }


    /*
     * Command/Ctrl + Z
     * → Undo
     */
    if (
      key === 'z' &&
      !event.shiftKey
    ) {
      event.preventDefault();

      undoEditorAction();
    }
  }
);


document.addEventListener(
  'keydown',
  event => {
    const modifierPressed =
      event.metaKey ||
      event.ctrlKey;

    if (!modifierPressed) {
      return;
    }

    if (
      event.key.toLowerCase() !==
      'd'
    ) {
      return;
    }

    /*
     * 文字入力中は、
     * OSやブラウザの操作を妨げない。
     */
    const target =
      event.target;

    const isTextEditing =
      target instanceof
        HTMLTextAreaElement ||
      (
        target instanceof
          HTMLInputElement &&
        ![
          'range',
          'color',
          'checkbox',
          'radio',
          'button'
        ].includes(
          target.type
        )
      ) ||
      target?.isContentEditable;

    if (isTextEditing) {
      return;
    }

    const duplicated =
      duplicateSelectedLyricsBlock();

    if (duplicated) {
      event.preventDefault();
    }
  }
);

document.addEventListener(
  'keydown',
  event => {
    /*
     * Delete または Backspace 以外は無視。
     */
    if (
      event.key !== 'Delete' &&
      event.key !== 'Backspace'
    ) {
      return;
    }


    /*
     * 文字入力中は、
     * 通常の文字削除を優先する。
     */
    const target =
      event.target;

    const isTextEditing =
      target instanceof
        HTMLTextAreaElement ||
      (
        target instanceof
          HTMLInputElement &&
        ![
          'range',
          'color',
          'checkbox',
          'radio',
          'button'
        ].includes(
          target.type
        )
      ) ||
      target?.isContentEditable;


    if (isTextEditing) {
      return;
    }


    /*
     * 選択中ブロックがなければ何もしない。
     */
    if (
      selectedLyricsBlockIds.size === 0
    ) {
      return;
    }


    /*
     * ブラウザの戻る操作などを防ぐ。
     */
    event.preventDefault();


    /*
     * 既存の削除ボタン処理を再利用。
     */
    deleteLyricsBlockButton?.click();
  }
);


document.addEventListener(
  'keydown',
  event => {
    const modifierPressed =
      event.metaKey ||
      event.ctrlKey;

    if (!modifierPressed) {
      return;
    }


    /*
     * テキスト編集中は、
     * 通常の文字コピー／貼り付けを優先。
     */
    const target =
      event.target;

    const isTextEditing =
      target instanceof
        HTMLTextAreaElement ||
      (
        target instanceof
          HTMLInputElement &&
        ![
          'range',
          'color',
          'checkbox',
          'radio',
          'button'
        ].includes(
          target.type
        )
      ) ||
      target?.isContentEditable;


    if (isTextEditing) {
      return;
    }


    const key =
      event.key.toLowerCase();


    /*
     * Command / Ctrl + C
     * 選択ブロックの見た目をコピー。
     */
    if (
      key === 'c' &&
      !event.shiftKey
    ) {
      const copied =
        copySelectedLyricsAppearance();

      if (copied) {
        event.preventDefault();
      }

      return;
    }


    /*
     * Command / Ctrl + V
     * 選択ブロックへ見た目を貼り付け。
     */
    if (
      key === 'v' &&
      !event.shiftKey
    ) {
      const pasted =
        pasteLyricsAppearanceToSelection();

      if (pasted) {
        event.preventDefault();
      }
    }
  }
);



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
  return window
    .LyricsEditorAnimation
    .normalize(
      block
    );
}



function applyEditorLyricsAnimation(
  targetElement,
  animation = {}
) {
  window
    .LyricsEditorAnimation
    .applyIn(
      targetElement,
      animation
    );
}


function applyEditorLyricsHoldAnimation(
  targetElement,
  animation = {},
  elapsedSeconds = 0
) {
  window
    .LyricsEditorAnimation
    .applyHold(
      targetElement,
      animation,
      elapsedSeconds
    );
}



function applyEditorLyricsOutAnimation(
  targetElement,
  animation = {},
  remainingSeconds = Infinity
) {
  window
    .LyricsEditorAnimation
    .applyOut(
      targetElement,
      animation,
      remainingSeconds
    );
}



function updateEditorLyricsOutByTimeline() {
  if (
    !editorAudio ||
    !editorAudioReady
  ) {
    return;
  }

  const currentTime =
    editorAudio.currentTime;

  const activeBlocks =
    getCurrentEditorLyricsBlocks();

  activeBlocks.forEach(block => {
    const blockEnd =
      parseTimeToSeconds(
        block.end
      );

    const remainingSeconds =
      blockEnd - currentTime;

    const animation =
      getNormalizedLyricsAnimation(
        block
      );

    /*
     * メイン歌詞または重なり歌詞から
     * 対応するDOMを探す。
     */
    const targetElement =
      document.querySelector(
        `#editorPreviewLyrics[data-block-id="${block.id}"]`
      ) ||
      document.querySelector(
        `.editorPreviewLyricsItem[data-block-id="${block.id}"]`
      );

    if (!targetElement) return;

    applyEditorLyricsOutAnimation(
      targetElement,
      animation,
      remainingSeconds
    );
  });
}



function updateAnimationDescription() {
  if (!animationDescription) {
    return;
  }

  animationDescription.textContent =
    window
      .LyricsEditorAnimation
      .getInDescription(
        animationPresetInput?.value
      );
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


function getLyricsLayoutForCurrentRatio(
  block
) {
  if (!block) {
    return null;
  }

  const ratio =
    getCurrentEditorAspectRatio();

  if (!block.layoutByRatio) {
    block.layoutByRatio = {};
  }

  /*
   * 現在比率にまだデータがない場合だけ、
   * 従来データを初期値としてコピーする。
   */
  if (!block.layoutByRatio[ratio]) {
    block.layoutByRatio[ratio] = {
      position: {
        x:
          Number(
            block.position?.x
          ) || 0,

        y:
          Number(
            block.position?.y
          ) || 0,

        z:
          Number(
            block.position?.z
          ) || 0
      },

      layout: {
        width:
          Number(
            block.layout?.width
          ) || 900,

        rotation:
          Number(
            block.layout?.rotation
          ) || 0
      },

      size:
        Number(
          block.style?.size
        ) || 72
    };
  }

  return block.layoutByRatio[
    ratio
  ];
}


function ensureBlockLayoutByRatio(
  block
) {
  if (!block) {
    return;
  }

  if (!block.style) {
    block.style = {};
  }

  if (!block.position) {
    block.position = {
      x: 0,
      y: 0,
      z: 0
    };
  }

  if (!block.layout) {
    block.layout = {
      width: 900,
      rotation: 0
    };
  }


  if (!block.layoutByRatio) {

    const initialLayout = {
      position: {
        x:
          Number(
            block.position.x
          ) || 0,

        y:
          Number(
            block.position.y
          ) || 0,

        z:
          Number(
            block.position.z
          ) || 0
      },

      layout: {
        width:
          Number(
            block.layout.width
          ) || 900,

        rotation:
          Number(
            block.layout.rotation
          ) || 0
      },

      size:
        Number(
          block.style.size
        ) || 72
    };


    /*
     * 既存プロジェクト互換。
     *
     * 最初だけ現在値を
     * 両方の比率へ複製する。
     */
    block.layoutByRatio = {

      '16:9':
        JSON.parse(
          JSON.stringify(
            initialLayout
          )
        ),

      '9:16':
        JSON.parse(
          JSON.stringify(
            initialLayout
          )
        )
    };
  }
}



function saveBlockLayoutForRatio(
  block,
  ratio
) {
  if (!block) {
    return;
  }

  ensureBlockLayoutByRatio(
    block
  );

  const normalizedRatio =
    ratio === '9:16'
      ? '9:16'
      : '16:9';


  block.layoutByRatio[
    normalizedRatio
  ] = {

    position: {
      x:
        Number(
          block.position?.x
        ) || 0,

      y:
        Number(
          block.position?.y
        ) || 0,

      z:
        Number(
          block.position?.z
        ) || 0
    },

    layout: {
      width:
        Number(
          block.layout?.width
        ) || 900,

      rotation:
        Number(
          block.layout?.rotation
        ) || 0
    },

    size:
      Number(
        block.style?.size
      ) || 72
  };
}


function loadBlockLayoutForRatio(
  block,
  ratio
) {
  if (!block) {
    return;
  }

  ensureBlockLayoutByRatio(
    block
  );

  const normalizedRatio =
    ratio === '9:16'
      ? '9:16'
      : '16:9';

  const ratioData =
    block.layoutByRatio[
      normalizedRatio
    ];

  if (!ratioData) {
    return;
  }


  block.position = {
    x:
      Number(
        ratioData.position?.x
      ) || 0,

    y:
      Number(
        ratioData.position?.y
      ) || 0,

    z:
      Number(
        ratioData.position?.z
      ) || 0
  };


  block.layout = {
    width:
      Number(
        ratioData.layout?.width
      ) || 900,

    rotation:
      Number(
        ratioData.layout?.rotation
      ) || 0
  };


  block.style = {
    ...(block.style || {}),

    size:
      Number(
        ratioData.size
      ) || 72
  };
}



function saveAllBlockLayoutsForRatio(
  ratio
) {
  Object.values(
    sectionData
  ).forEach(blocks => {

    (blocks || [])
      .forEach(block => {

        saveBlockLayoutForRatio(
          block,
          ratio
        );
      });
  });
}


function loadAllBlockLayoutsForRatio(
  ratio
) {
  Object.values(
    sectionData
  ).forEach(blocks => {

    (blocks || [])
      .forEach(block => {

        loadBlockLayoutForRatio(
          block,
          ratio
        );
      });
  });
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

  const previousRatio =
  getCurrentEditorAspectRatio();

  const normalizedRatio =
    ratio === '9:16'
      ? '9:16'
      : '16:9';


  console.log(
  '★★★★★ RATIO SWITCH ★★★★★',
  {
    previousRatio,
    normalizedRatio
  }
);

  

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

if (
  previousRatio !==
  normalizedRatio
) {

  console.log(
    '★★★★★ BEFORE RATIO LOAD ★★★★★',
    {
      ratio: normalizedRatio,

      activePosition:
        getSelectedLyricsBlockData()
          ?.position,

      targetPosition:
        getSelectedLyricsBlockData()
          ?.layoutByRatio?.[
            normalizedRatio
          ]?.position
    }
  );

  loadAllBlockLayoutsForRatio(
    normalizedRatio
  );

  console.log(
    '★★★★★ AFTER RATIO LOAD ★★★★★',
    {
      ratio: normalizedRatio,

      activePosition:
        getSelectedLyricsBlockData()
          ?.position,

      targetPosition:
        getSelectedLyricsBlockData()
          ?.layoutByRatio?.[
            normalizedRatio
          ]?.position
    }
  );
}


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
   //loadLyricsBlockToInspector(
     // element
    // );
  }

  updateEditorPreview(
    selectedData,
    {
      animate: false
    }
  );

  sendLyricsBlockToVisualizer(
    selectedData
  );
}

    updateEditorSongInfoPreview();

    window.dispatchEvent(
      new Event('resize')
    );

console.log(
  '★★★★★ AFTER RATIO RENDER ★★★★★',
  {
    ratio:
      getCurrentEditorAspectRatio(),

    activePosition:
      getSelectedLyricsBlockData()
        ?.position
  }
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

  const beforeState =
  captureEditorState();

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


  const beforeState =
    captureEditorState();


  targetBlocks.forEach(
    block => {
      block.animation =
        getNormalizedLyricsAnimation(
          block
        );

      callback(block);
    }
  );


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

  /*
   * 同じブロックでも再描画されるように、
   * プレビュー判定用キャッシュを解除する。
   */
  lastEditorActiveLyricsSignature =
    '';

  lastSentPreviewLyricsSignature =
    '';

  /*
   * 適用直後にINを再生して、
   * 設定結果をその場で確認できるようにする。
   */
  updateEditorPreview(
    selectedData,
    {
      animate: true
    }
  );

  sendLyricsBlockToVisualizer(
    selectedData
  );
}

 if (selectedData) {
  // Inspector再読込
  // キャッシュ解除
  // animate:trueでPreview更新
  // Visualizer送信
}

commitEditorHistory(
  beforeState
);
}
}


/*
 * Inspector上の現在値から
 * 一時プレビュー用Animationを作る。
 *
 * sectionData自体は変更しない。
 */
function getAnimationDraftFromControls() {
  return {
    in: {
      preset:
        animationPresetInput?.value ||
        'off',

      duration:
        Number(
          inDurationInput?.value
        ) || 0.5
    },

    hold: {
      preset:
        holdPresetInput?.value ||
        'off',

      speed:
        Number(
          holdSpeedInput?.value
        ) || 1,

      strength:
        Number(
          holdStrengthInput?.value
        ) || 12
    },

    out: {
      preset:
        outPresetInput?.value ||
        'off',

      duration:
        Number(
          outDurationInput?.value
        ) || 0.5
    }
  };
}


/*
 * Inspectorを触った瞬間に
 * 選択中ブロックだけプレビューする。
 *
 * 保存はしない。
 */
function previewAnimationFromControls(
  phase = 'all'
) {
  const selectedBlock =
    getSelectedLyricsBlockData();

  if (!selectedBlock) {
    return;
  }

  const draftAnimation =
    getAnimationDraftFromControls();

  const previewBlock = {
    ...selectedBlock,

    animation:
      draftAnimation,

    /*
     * 旧形式互換。
     */
    animationPreset:
      draftAnimation.in.preset
  };


  /*
   * Editor内プレビュー。
   *
   * INを変更したときだけ
   * 登場アニメーションを再スタート。
   */
  updateEditorPreview(
    previewBlock,
    {
      animate:
        phase === 'in'
    }
  );


  /*
   * 外出しVisualizerにも
   * 保存前のDraftを送る。
   */
  sendLyricsBlockToVisualizer(
    previewBlock
  );


  /*
   * OUTだけは停止中だと通常表示になるため、
   * OUT操作時だけ直接プレビューする。
   */
  if (phase === 'out') {
    const previewLyrics =
      document.getElementById(
        'editorPreviewLyrics'
      );

    if (previewLyrics) {
      applyEditorLyricsOutAnimation(
        previewLyrics,
        draftAnimation,
        Math.max(
          0.01,
          draftAnimation.out.duration *
          0.5
        )
      );
    }
  }
}



function updateAnimationControlValues() {
  const animationModule =
    window.LyricsEditorAnimation;


  if (inDurationValue) {
    inDurationValue.textContent =
      animationModule
        .formatDuration(
          inDurationInput?.value,
          0.5
        );
  }


  if (holdSpeedValue) {
    holdSpeedValue.textContent =
      animationModule
        .formatNumber(
          holdSpeedInput?.value,
          1,
          2
        );
  }


  if (holdStrengthValue) {
    holdStrengthValue.textContent =
      animationModule
        .formatInteger(
          holdStrengthInput?.value,
          12
        );
  }


  if (outDurationValue) {
    outDurationValue.textContent =
      animationModule
        .formatDuration(
          outDurationInput?.value,
          0.5
        );
  }
}

function updateHoldDescription() {
  if (!holdDescription) {
    return;
  }

  holdDescription.textContent =
    window
      .LyricsEditorAnimation
      .getHoldDescription(
        holdPresetInput?.value
      );
}


function updateOutDescription() {
  if (!outDescription) {
    return;
  }

  outDescription.textContent =
    window
      .LyricsEditorAnimation
      .getOutDescription(
        outPresetInput?.value
      );
}






/*
 * Webフォントの読込完了後に
 * 選択中歌詞を再描画する。
 */
document.fonts?.ready
  .then(() => {
    const selectedData =
      getSelectedLyricsBlockData();

    if (!selectedData) {
      return;
    }

    updateEditorPreview(
      selectedData,
      {
        animate: false
      }
    );

    sendLyricsBlockToVisualizer(
      selectedData
    );
  })
  .catch(error => {
    console.warn(
      'Font loading failed:',
      error
    );
  });



  /* ==================================================
   Font Library Connection
================================================== */

const fontLibrary =
  window
    .LyricsEditorFontLibrary
    ?.create({
      getPreviewText() {
        const selectedBlock =
          getSelectedLyricsBlockData();

        return (
          selectedBlock?.text ||
          textInput?.value ||
          '観覧車が止まる前に'
        );
      },

      getCurrentFont() {
        return (
          fontInput?.value ||
          'Noto Sans JP'
        );
      },

      applyFont(fontValue) {
        if (!fontInput) return;

        fontInput.value =
          fontValue;

        sendLyricsUpdate();

        document.fonts?.ready
          .then(() => {
            const selectedBlock =
              getSelectedLyricsBlockData();

            if (!selectedBlock) return;

            updateEditorPreview(
              selectedBlock,
              {
                animate: false
              }
            );

            sendLyricsBlockToVisualizer(
              selectedBlock
            );
          });
      }
    });


document
  .getElementById(
    openFontLibraryButton
  ?.addEventListener(
    'click',
    () => {
      fontLibrary?.open();

      document.body.classList.add(
        'font-library-open'
      );
    }
  )
  );



  const addCustomFontButton =
  document.getElementById(
    'addCustomFontButton'
  );

if (addCustomFontButton) {
  addCustomFontButton.addEventListener(
    'click',
    async () => {
      addCustomFontButton.disabled =
        true;

      try {
        const added =
          await window.NorahFontManager
            .importCustomFont();

        if (added) {
          console.log(
            '[Font UI] フォントを追加しました。'
          );
        }
      } catch (error) {
        console.error(
          '[Font UI] フォント追加処理に失敗しました。',
          error
        );

        alert(
          'フォントの追加に失敗しました。'
        );
      } finally {
        addCustomFontButton.disabled =
          false;
      }
    }
  );
}



async function sendSongInfoSettingsToOutputs() {
  try {
    const result =
      await ipcRenderer.invoke(
        'set-song-info-editor-settings',
        {
          ...songInfoSettings,

          positionByRatio: {
            '16:9': {
              ...songInfoSettings
                .positionByRatio
                ['16:9']
            },

            '9:16': {
              ...songInfoSettings
                .positionByRatio
                ['9:16']
            }
          }
        }
      );

    console.log(
      '[Editor] Song Info settings sent:',
      songInfoSettings,
      result
    );
  } catch (error) {
    console.error(
      '[Editor] Song Info settings send failed:',
      error
    );
  }
}



ensurePreviewCenterGuides();
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
updateAnimationDescription();

loadSongInfoSettingsLocally();
updateSongInfoInspector();

setupSongInfoLayerSelection();
setupSongInfoDrag();
updateEditorSongInfoPreview();
