const {
  ipcRenderer
} = require('electron');



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

  const stage =
    document.getElementById(
      'lyricsOutputStage'
    );

  if (!canvas || !stage) {
    return;
  }

  const ratio =
    currentAspectRatio === '16:9'
      ? '16:9'
      : '9:16';

  const result =
    window.NorahViewport.fitCanvas({
      container: stage,
      canvas,
      ratio,
      cssVariable:
        '--lyrics-output-scale'
    });

  if (result) {
    document.documentElement
      .style
      .setProperty(
        '--lyrics-output-scale',
        String(result.scale)
      );
  }
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

  console.log(
  '[Lyrics Output setSingleLyrics]',
  {
    lines,
    style,
    position,
    layout,
    animation
  }
);

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
/*
 * HOLDは新規表示または内容変更時だけ適用する。
 *
 * elapsedSecondsを渡すため、
 * Lyrics Outputを途中で開いても
 * 現在の位相から開始できる。
 */



if (
  isNewBlock ||
  needsRender
) {
  applyLyricsHoldAnimation(
    lyricsBlock,
    block.animation || {},
    Number(
      block.elapsedSeconds
    ) || 0
  );
}



      
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


  if (
  source === 'player' &&
  hasBlocks
) {
  /*
   * EditorがLyrics Outputを制御中なら、
   * Playerから届く更新では上書きしない。
   */
  if (
    lyricsEditorControlsOutput
  ) {
    return;
  }

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
    applyLyricsOutputSongInfoPosition();
  }
);


/* ========================================
   Song Info
======================================== */

const songInfoElement =
  document.getElementById(
    'lyricsOutputSongInfo'
  );

let currentSongInfoEditorSettings =
  null;


function applyLyricsOutputSongInfoPosition() {
  if (
    !currentSongInfoEditorSettings ||
    !songInfoElement
  ) {

       console.warn(
      '[Lyrics Output] Song Info position skipped',
      {
        settings:
          currentSongInfoEditorSettings,
        element:
          songInfoElement
      }
    );


    return;
  }

  const ratio =
    currentAspectRatio === '16:9'
      ? '16:9'
      : '9:16';

  const position =
    currentSongInfoEditorSettings
      ?.positionByRatio
      ?.[ratio] || {
        x: 0,
        y: 0
      };

  const positionScale =
    0.43;

  const x =
    (Number(position.x) || 0) *
    positionScale;

  const y =
    (Number(position.y) || 0) *
    positionScale;

  songInfoElement.style.setProperty(
    '--song-info-x',
    `${x}px`
  );

  songInfoElement.style.setProperty(
    '--song-info-y',
    `${y}px`
  );
}

const titleElement =
  document.getElementById(
    'lyricsOutputTitle'
  );

const artistElement =
  document.getElementById(
    'lyricsOutputArtist'
  );

const currentTimeElement =
  document.getElementById(
    'lyricsOutputCurrentTime'
  );

const durationElement =
  document.getElementById(
    'lyricsOutputDuration'
  );


function applyLyricsOutputSongInfoPosition() {
  if (
    !currentSongInfoEditorSettings ||
    !songInfoElement
  ) {
    return;
  }

  const ratio = currentAspectRatio;

  const position =
    currentSongInfoEditorSettings
      ?.positionByRatio?.[ratio] || {
      x: 0,
      y: 0
    };

  const scale = 1;

  songInfoElement.style.setProperty(
    '--song-info-x',
    `${position.x * scale}px`
  );

  songInfoElement.style.setProperty(
    '--song-info-y',
    `${position.y * scale}px`
  );
}




function updateSongInfo(
  song
) {
  if (titleElement) {
    titleElement.textContent =
      song?.title || '';
  }

  if (artistElement) {
    /*
     * 大文字・小文字を変換せず、
     * 登録された表記をそのまま使用する。
     */
    artistElement.textContent =
      song?.artist || '';
  }
}


function formatOutputTime(
  value
) {
  if (
    typeof value ===
    'string'
  ) {
    return value;
  }

  const totalSeconds =
    Math.max(
      0,
      Number(value) || 0
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    Math.floor(
      totalSeconds % 60
    );

  return (
    String(minutes)
      .padStart(2, '0') +
    ':' +
    String(seconds)
      .padStart(2, '0')
  );
}


function updateTimeInfo(
  timeData
) {
  if (currentTimeElement) {
    currentTimeElement.textContent =
      formatOutputTime(
        timeData?.currentText ??
        timeData?.currentTime ??
        timeData?.current ??
        0
      );
  }

  if (durationElement) {
    durationElement.textContent =
      formatOutputTime(
        timeData?.durationText ??
        timeData?.durationTime ??
        timeData?.duration ??
        0
      );
  }
}


function setSongInfoVisible(
  visible
) {
  if (!songInfoElement) {
    return;
  }

  const shouldShow =
    Boolean(visible);

  songInfoElement
    .classList
    .toggle(
      'is-visible',
      shouldShow
    );

  songInfoElement.setAttribute(
    'aria-hidden',
    shouldShow
      ? 'false'
      : 'true'
  );
}


function setLyricsVisible(
  visible
) {
  if (!blocksLayer) {
    return;
  }

  blocksLayer.style.display =
    visible
      ? 'block'
      : 'none';
}


ipcRenderer.on(
  'lyrics-output-song',
  (
    event,
    song
  ) => {
    updateSongInfo(
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
    updateTimeInfo(
      timeData
    );
  }
);





ipcRenderer.on(
  'lyrics-output-song-info-editor-settings',
  (
    event,
    settings
  ) => {


     console.log(
      '[Lyrics Output] Song Info settings received:',
      settings
    );


    currentSongInfoEditorSettings =
      settings || null;

    applyLyricsOutputSongInfoPosition();
  }
);



ipcRenderer.on(
  'lyrics-output-song-info-visible',
  (
    event,
    visible
  ) => {
    setSongInfoVisible(
      visible
    );
  }
);

ipcRenderer.on(
  'lyrics-output-song-info-items',
  (
    event,
    items
  ) => {
    const title =
      document.getElementById(
        'lyricsOutputTitle'
      );

    const artist =
      document.getElementById(
        'lyricsOutputArtist'
      );

    const time =
      document.getElementById(
        'lyricsOutputTime'
      );

    console.log(
      '[Lyrics Output Routing] Song Info Items:',
      items
    );

    if (
      !title ||
      !artist ||
      !time
    ) {
      console.warn(
        '[Lyrics Output Routing] Song Info内の要素が見つかりません',
        {
          title: Boolean(title),
          artist: Boolean(artist),
          time: Boolean(time)
        }
      );

      return;
    }

    title.classList.toggle(
      'output-routing-hidden',
      !Boolean(items?.title)
    );

    artist.classList.toggle(
      'output-routing-hidden',
      !Boolean(items?.artist)
    );

    time.classList.toggle(
      'output-routing-hidden',
      !Boolean(items?.time)
    );
  }
);




ipcRenderer.on(
  'lyrics-output-lyrics-visible',
  (
    event,
    visible
  ) => {
    setLyricsVisible(
      visible
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

/*
 * 初期状態
 *
 * 表示先切替をまだ受信していない間は、
 * 歌詞を表示し、Song Infoは非表示にする。
 */
setLyricsVisible(
  true
);

setSongInfoVisible(
  false
);