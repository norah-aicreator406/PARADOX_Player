const {
  ipcRenderer
} = require('electron');

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1920;

const blocksLayer =
  document.getElementById(
    'lyricsOutputBlocks'
  );

let lyricsEditorControlsOutput =
  false;

let currentAspectRatio =
  '9:16';


/* ========================================
   Canvas scale
======================================== */

function resizeLyricsOutputCanvas() {
  const canvas =
    document.getElementById(
      'lyricsOutputCanvas'
    );

  if (!canvas) {
    return;
  }

  const scale = Math.min(
    window.innerWidth /
      BASE_WIDTH,

    window.innerHeight /
      BASE_HEIGHT
  );

  canvas.style.setProperty(
    '--lyrics-output-scale',
    String(scale)
  );

  document.documentElement
    .style
    .setProperty(
      '--lyrics-output-scale',
      String(scale)
    );
}

window.addEventListener(
  'resize',
  resizeLyricsOutputCanvas
);

resizeLyricsOutputCanvas();


/* ========================================
   Render helpers
======================================== */

function applyLyricsInAnimation(
  targetElement,
  animation = {}
) {
  window
    .LyricsAnimationEngine
    ?.applyIn(
      targetElement,
      animation
    );
}


function applyLyricsHoldAnimation(
  targetElement,
  animation = {},
  elapsedSeconds = 0
) {
  window
    .LyricsAnimationEngine
    ?.applyHold(
      targetElement,
      animation,
      elapsedSeconds
    );
}


function applyLyricsOutAnimation(
  targetElement,
  animation = {},
  remainingSeconds = Infinity
) {
  window
    .LyricsAnimationEngine
    ?.applyOut(
      targetElement,
      animation,
      remainingSeconds
    );
}


function clearLyrics() {
  if (!blocksLayer) {
    return;
  }

  blocksLayer.innerHTML = '';
}


function setSingleLyrics(
  lines,
  animation = {
    preset: 'fade',
    duration: 0.5
  },
  style = {},
  position = {
    x: 0,
    y: 0,
    z: 0
  },
  layout = {
    width: 900,
    rotation: 0
  }
) {
  if (!blocksLayer) {
    console.error(
      '[Lyrics Output] blocks layerがありません。'
    );

    return;
  }

  blocksLayer.innerHTML = '';

  const lyricsBlock =
    document.createElement(
      'div'
    );

  lyricsBlock.className =
    'lyricsOutputBlock';

  blocksLayer.appendChild(
    lyricsBlock
  );

  const payload = {
    lines,
    style,
    position,
    layout,
    animation
  };

  window.LyricsRenderer.render(
    lyricsBlock,
    payload
  );

  applyLyricsInAnimation(
    lyricsBlock,
    animation
  );

  applyLyricsHoldAnimation(
    lyricsBlock,
    animation,
    0
  );
}


/* ========================================
   Multiple active blocks
======================================== */

function setLyricsBlocks(blocks) {
  if (!blocksLayer) {
    console.error(
      '[Lyrics Output] blocks layerがありません。'
    );

    return;
  }

  const safeBlocks =
    Array.isArray(blocks)
      ? blocks.filter(Boolean)
      : [];

  const activeIds =
    new Set(
      safeBlocks.map(
        block =>
          String(
            block.id || ''
          )
      )
    );

  /*
   * 再生範囲から外れたブロックだけ削除。
   */
  blocksLayer
    .querySelectorAll(
      '.lyricsOutputBlock'
    )
    .forEach(element => {
      const blockId =
        element.dataset.blockId ||
        '';

      if (
        !activeIds.has(blockId)
      ) {
        element.remove();
      }
    });

  /*
   * z値が小さいものから描画。
   */
  safeBlocks
    .slice()
    .sort((a, b) => {
      const zA =
        Number(
          a?.position?.z
        ) || 0;

      const zB =
        Number(
          b?.position?.z
        ) || 0;

      return zA - zB;
    })
    .forEach(block => {
      const blockId =
        String(
          block.id || ''
        );

      let lyricsBlock =
        blocksLayer.querySelector(
          `.lyricsOutputBlock[data-block-id="${CSS.escape(blockId)}"]`
        );

      const isNewBlock =
        !lyricsBlock;

      if (!lyricsBlock) {
        lyricsBlock =
          document.createElement(
            'div'
          );

        lyricsBlock.className =
          'lyricsOutputBlock';

        lyricsBlock.dataset.blockId =
          blockId;

        blocksLayer.appendChild(
          lyricsBlock
        );
      }

      lyricsBlock.style.zIndex =
        String(
          Number(
            block?.position?.z
          ) || 0
        );

      /*
       * 内容、位置、スタイル、アニメーションの
       * どれかが変更された場合のみ再描画する。
       */
      const renderSignature =
        JSON.stringify({
          text:
            block.text ||
            block.lines,

          style:
            block.style,

          position:
            block.position,

          layout:
            block.layout,

          animation:
            block.animation
        });

      const previousSignature =
        lyricsBlock
          .dataset
          .renderSignature ||
        '';

      const needsRender =
        isNewBlock ||
        previousSignature !==
          renderSignature;

      if (needsRender) {
        window.LyricsRenderer.render(
          lyricsBlock,
          block
        );

        lyricsBlock
          .dataset
          .renderSignature =
            renderSignature;
      }

      /*
       * INは初めて表示された時だけ。
       */
      if (isNewBlock) {
        applyLyricsInAnimation(
          lyricsBlock,
          block.animation || {}
        );
      }

     /*
 * HOLDは受信ごとに経過時間を同期する。
 *
 * Lyrics Outputを途中で開いた場合でも、
 * 現在の位相から正しく開始できる。
 */
applyLyricsHoldAnimation(
  lyricsBlock,
  block.animation || {},
  Number(
    block.elapsedSeconds
  ) || 0
);

      /*
       * OUTは残り時間が継続的に変わるため、
       * データ受信ごとに更新する。
       */
      applyLyricsOutAnimation(
        lyricsBlock,
        block.animation || {},
        Number.isFinite(
          Number(
            block.remainingSeconds
          )
        )
          ? Number(
              block.remainingSeconds
            )
          : Infinity
      );
    });
}


/* ========================================
   Payload router
======================================== */

function receiveLyricsPayload(
  lyricsPayload
) {
  const hasBlocks =
    Array.isArray(
      lyricsPayload?.blocks
    );

  const source =
    lyricsPayload?.source ||
    'unknown';

  console.log(
    '[Lyrics Output] received:',
    source,
    hasBlocks
      ? lyricsPayload.blocks.length
      : 1
  );

  /*
   * Editorからの新形式。
   */
  if (
    source ===
      'lyrics-editor' &&
    hasBlocks
  ) {
    lyricsEditorControlsOutput =
      true;

    setLyricsBlocks(
      lyricsPayload.blocks
    );

    return;
  }

  /*
   * Playerからの新形式。
   */
  if (
    source === 'player' &&
    hasBlocks
  ) {
    lyricsEditorControlsOutput =
      false;

    setLyricsBlocks(
      lyricsPayload.blocks
    );

    return;
  }

  /*
   * Editorが制御している間は、
   * Playerの旧形式では上書きしない。
   */
  if (
    lyricsEditorControlsOutput
  ) {
    return;
  }

  if (!lyricsPayload) {
    clearLyrics();
    return;
  }

  /*
   * 配列が直接届く旧形式。
   */
  if (
    Array.isArray(
      lyricsPayload
    )
  ) {
    setLyricsBlocks(
      lyricsPayload
    );

    return;
  }

  /*
   * sourceなしのblocks形式。
   */
  if (
    Array.isArray(
      lyricsPayload.blocks
    )
  ) {
    setLyricsBlocks(
      lyricsPayload.blocks
    );

    return;
  }

  /*
   * 後方互換用の単体形式。
   */
  if (
    Array.isArray(
      lyricsPayload.lines
    ) ||
    typeof lyricsPayload.text ===
      'string'
  ) {
    setSingleLyrics(
      lyricsPayload.lines ||
        String(
          lyricsPayload.text ||
          ''
        ).split('\n'),

      lyricsPayload.animation,
      lyricsPayload.style,
      lyricsPayload.position,
      lyricsPayload.layout
    );

    return;
  }

  clearLyrics();
}


/* ========================================
   IPC
======================================== */

ipcRenderer.on(
  'lyrics-output-data',
  (
    event,
    lyricsPayload
  ) => {
    receiveLyricsPayload(
      lyricsPayload
    );
  }
);


ipcRenderer.on(
  'lyrics-output-aspect-ratio',
  (
    event,
    ratio
  ) => {
    currentAspectRatio =
      ratio === '16:9'
        ? '16:9'
        : '9:16';

    document.body.dataset.ratio =
      currentAspectRatio;

    resizeLyricsOutputCanvas();
  }
);


/*
 * Phase 2用。
 * 現時点では受信だけして表示しない。
 */
ipcRenderer.on(
  'lyrics-output-song',
  (
    event,
    song
  ) => {
    console.log(
      '[Lyrics Output] song:',
      song
    );
  }
);


ipcRenderer.on(
  'lyrics-output-time',
  (
    event,
    timeData
  ) => {
    console.log(
      '[Lyrics Output] time:',
      timeData
    );
  }
);

/* ========================================
   Window controls
======================================== */

const minimizeButton =
  document.getElementById(
    'lyricsOutputMinimizeButton'
  );

const closeButton =
  document.getElementById(
    'lyricsOutputCloseButton'
  );

minimizeButton?.addEventListener(
  'click',
  () => {
    ipcRenderer.invoke(
      'minimize-lyrics-output-window'
    );
  }
);

closeButton?.addEventListener(
  'click',
  () => {
    ipcRenderer.invoke(
      'close-lyrics-output-window'
    );
  }
);