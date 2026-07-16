/* ==================================================
   NORAH Studio
   Lyrics Editor Timeline
================================================== */

window.LyricsEditorTimeline =
  (() => {
    function create(options = {}) {
      const getAudio =
        options.getAudio;

      const getTimelineScale =
        options.getTimelineScale;

      const getRowHeight =
        options.getRowHeight;

      const getCurrentBlocks =
        options.getCurrentBlocks;

      const formatTime =
        options.formatTime;

      const getRulerStep =
        options.getRulerStep;

      const getScrollArea =
        options.getScrollArea;


      /*
       * 音源の長さに応じた
       * タイムライン全体幅を返す。
       */
      function getTotalWidth() {
        const audio =
          getAudio?.();

        const timelineScale =
          Number(
            getTimelineScale?.()
          ) || 90;


        if (
          !audio ||
          !Number.isFinite(
            audio.duration
          )
        ) {
          return 1600;
        }


        return Math.max(
          1600,

          audio.duration *
            timelineScale +
            800
        );
      }


      /*
       * タイムライン各領域の
       * 横幅を同期する。
       */
      function updateContentWidth() {
        const timelineContent =
          document.getElementById(
            'timelineContent'
          );

        const lyricsBlockList =
          document.getElementById(
            'lyricsBlockList'
          );


        const width =
          getTotalWidth();

        const widthText =
          `${width}px`;


        if (timelineContent) {
          timelineContent.style.width =
            widthText;

          timelineContent.style.minWidth =
            widthText;
        }


        if (lyricsBlockList) {
          lyricsBlockList.style.width =
            widthText;

          lyricsBlockList.style.minWidth =
            widthText;
        }
      }


      /*
       * ブロック数と表示領域に応じて
       * タイムラインの高さを更新する。
       */
      function updateContentHeight() {
        const timelineContent =
          document.getElementById(
            'timelineContent'
          );

        const lyricsBlockList =
          document.getElementById(
            'lyricsBlockList'
          );

        const trackArea =
         document.querySelector(
            '.timelineTrackArea'
          );

        const gridLines =
          document.getElementById(
            'timelineGridLines'
          );

        const playhead =
          document.getElementById(
            'timelinePlayhead'
          );


        const scrollArea =
          getScrollArea?.() ||
          document.querySelector(
            '.timelineScrollArea'
          );


        const blocks =
          getCurrentBlocks?.() || [];


        const rowHeight =
          Number(
            getRowHeight?.()
          ) || 56;


        /*
         * 最低でも1行分の高さを確保。
         */
        const blocksHeight =
          Math.max(
            blocks.length *
              rowHeight,

            rowHeight
          );


        const visibleHeight =
          scrollArea
            ? scrollArea.clientHeight
            : 0;


        const bottomPadding =
          40;


        const contentHeight =
          Math.max(
            blocksHeight +
              bottomPadding,

            visibleHeight
          );


        const heightText =
          `${contentHeight}px`;


        if (scrollArea) {
          scrollArea.style.overflow =
            'auto';

          scrollArea.style.minHeight =
            '0';
        }


        if (timelineContent) {
          timelineContent.style.position =
            'relative';

          timelineContent.style.height =
            heightText;

          timelineContent.style.minHeight =
            heightText;

          timelineContent.style
            .removeProperty(
              'overflow'
            );
        }


        /*
 * ブロック・グリッド・再生ヘッドを
 * 内包する領域も同じ高さへ伸ばす。
 */
if (trackArea) {
  trackArea.style.position =
    'relative';

  trackArea.style.height =
    heightText;

  trackArea.style.minHeight =
    heightText;

  trackArea.style.removeProperty(
    'overflow'
  );
}


        if (lyricsBlockList) {
          lyricsBlockList.style.position =
            'relative';

          lyricsBlockList.style.height =
            heightText;

          lyricsBlockList.style.minHeight =
            heightText;

          lyricsBlockList.style
            .removeProperty(
              'overflow'
            );
        }

        if (trackArea) {
  trackArea.style.position =
    'relative';

  trackArea.style.height =
    heightText;

  trackArea.style.minHeight =
    heightText;

  trackArea.style.removeProperty(
    'overflow'
  );
}


        if (gridLines) {
          gridLines.style.position =
            'absolute';

          gridLines.style.left =
            '0';

          gridLines.style.top =
            '0';

          gridLines.style.width =
            '100%';

          gridLines.style.height =
            heightText;

          gridLines.style.minHeight =
            heightText;

          gridLines.style.overflow =
            'visible';

          gridLines.style.pointerEvents =
            'none';


          gridLines
            .querySelectorAll(
              '.timelineGridLine'
            )
            .forEach(line => {
              line.style.top =
                '0';

              line.style.height =
                heightText;
            });
        }


        if (playhead) {
          playhead.style.top =
            '0';

          playhead.style.bottom =
            'auto';

          playhead.style.height =
            heightText;

          playhead.style.minHeight =
            heightText;
        }
      }


      /*
       * 秒数目盛りと縦グリッドを描画。
       */
      function renderRuler() {
        const ruler =
          document.querySelector(
            '.timelineRuler'
          );

        const gridLines =
          document.getElementById(
            'timelineGridLines'
          );

        const audio =
          getAudio?.();


        if (
          !ruler ||
          !gridLines ||
          !audio ||
          !Number.isFinite(
            audio.duration
          )
        ) {
          return;
        }


        ruler.innerHTML =
          '';

        gridLines.innerHTML =
          '';


        const duration =
          audio.duration;

        const timelineScale =
          Number(
            getTimelineScale?.()
          ) || 90;

        const step =
          Number(
            getRulerStep?.()
          ) || 1;

        const totalWidth =
          getTotalWidth();


        ruler.style.position =
          'relative';

        ruler.style.width =
          `${totalWidth}px`;


        for (
          let time = 0;
          time <= duration;
          time += step
        ) {
          const mark =
            document.createElement(
              'div'
            );

          const line =
            document.createElement(
              'div'
            );


          line.className =
            'timelineGridLine';

          line.style.left =
            `${time *
              timelineScale}px`;

          line.style.top =
            '0';

          gridLines.appendChild(
            line
          );


          mark.className =
            'timelineRulerMark';

          mark.style.position =
            'absolute';

          mark.style.left =
            `${time *
              timelineScale}px`;


          const formattedTime =
            typeof formatTime ===
              'function'
              ? formatTime(time)
              : String(time);


          mark.textContent =
            formattedTime.replace(
              '.00',
              ''
            );


          ruler.appendChild(
            mark
          );
        }


        updateContentWidth();
        updateContentHeight();
      }

      function setupBlockDrag({
  block,
  blockData,

  captureHistory,
  commitHistory,

  parseTime,
  formatTime,

  getScale,

  selectBlock,
  updatePreview,

  startTimeInput,
  endTimeInput
}) {
  if (
    !block ||
    !blockData
  ) {
    return;
  }

  let isDragging = false;
  let hasMoved = false;

  let startMouseX = 0;
  let startLeft = 0;
  let durationSeconds = 0;

  let beforeDragState = null;


  block.addEventListener(
    'mousedown',
    event => {
      if (
        event.target.closest(
          '.lyricsResizeHandle'
        )
      ) {
        return;
      }

      if (event.button !== 0) {
        return;
      }


      isDragging = true;
      hasMoved = false;


      beforeDragState =
        captureHistory?.();


      startMouseX =
        event.clientX;

      startLeft =
        parseFloat(
          block.style.left
        ) || 0;


      const startSeconds =
        parseTime(
          blockData.start
        );

      const endSeconds =
        parseTime(
          blockData.end
        );


      durationSeconds =
        Math.max(
          endSeconds -
            startSeconds,
          0.5
        );


      block.classList.add(
        'dragging'
      );


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


      const deltaX =
        event.clientX -
        startMouseX;


      if (
        Math.abs(deltaX) > 3
      ) {
        hasMoved = true;
      }


      const nextLeft =
        Math.max(
          0,
          startLeft + deltaX
        );


      block.style.left =
        `${nextLeft}px`;
    }
  );


  document.addEventListener(
    'mouseup',
    () => {
      if (!isDragging) {
        return;
      }


      isDragging = false;

      block.classList.remove(
        'dragging'
      );


      if (!hasMoved) {
        beforeDragState = null;
        return;
      }


      const finalLeft =
        parseFloat(
          block.style.left
        ) || 0;


      const timelineScale =
        Number(
          getScale?.()
        ) || 90;


      const nextStartSeconds =
        finalLeft /
        timelineScale;


      const nextEndSeconds =
        nextStartSeconds +
        durationSeconds;


      blockData.start =
        formatTime(
          nextStartSeconds
        );

      blockData.end =
        formatTime(
          nextEndSeconds
        );


      if (startTimeInput) {
        startTimeInput.value =
          blockData.start;
      }


      if (endTimeInput) {
        endTimeInput.value =
          blockData.end;
      }


      selectBlock?.(
        block
      );


      updatePreview?.();


      commitHistory?.(
        beforeDragState
      );


      beforeDragState = null;
    }
  );
}


function setupBlockResize({
  block,
  blockData,

  minBlockWidth,

  getScale,

  parseTime,
  formatTime,

  captureHistory,
  commitHistory,

  getSelectedIds,
  getLastSelectedId,
  setSelection,

  applySelectionClasses,
  loadInspector,

  renderBlocks,
  updatePreview,
  sendToVisualizer
}) {
  if (
    !block ||
    !blockData
  ) {
    return;
  }


  const leftHandle =
    block.querySelector(
      '.lyricsResizeHandleLeft'
    );

  const rightHandle =
    block.querySelector(
      '.lyricsResizeHandleRight'
    );


  if (
    !leftHandle ||
    !rightHandle
  ) {
    return;
  }


  let resizing = false;
  let resizeSide = null;
  let hasResized = false;

  let startMouseX = 0;
  let startLeft = 0;
  let startWidth = 0;

  let originalStartSeconds = 0;
  let originalEndSeconds = 0;

  let beforeResizeState = null;


  function beginResize(
    event,
    side
  ) {
    if (event.button !== 0) {
      return;
    }


    const selectedIds =
      getSelectedIds?.() ||
      new Set();


    const isOnlyThisBlockSelected =
      selectedIds.size === 1 &&
      selectedIds.has(
        blockData.id
      );


    /*
     * 操作対象を先に選択する。
     */
    if (!isOnlyThisBlockSelected) {
      setSelection?.(
        blockData.id
      );

      applySelectionClasses?.();

      loadInspector?.(
        block
      );
    }


    /*
     * 選択確定後に履歴を取得する。
     */
    beforeResizeState =
      captureHistory?.();


    resizing = true;
    resizeSide = side;
    hasResized = false;


    startMouseX =
      event.clientX;


    startLeft =
      parseFloat(
        block.style.left
      ) || 0;


    startWidth =
      parseFloat(
        block.style.width
      ) ||
      block.offsetWidth;


    originalStartSeconds =
      parseTime(
        blockData.start
      );


    originalEndSeconds =
      parseTime(
        blockData.end
      );


    block.classList.add(
      'resizing'
    );


    event.preventDefault();
    event.stopPropagation();
  }


  leftHandle.addEventListener(
    'mousedown',
    event => {
      beginResize(
        event,
        'left'
      );
    }
  );


  rightHandle.addEventListener(
    'mousedown',
    event => {
      beginResize(
        event,
        'right'
      );
    }
  );


  document.addEventListener(
    'mousemove',
    event => {
      if (!resizing) {
        return;
      }


      const deltaX =
        event.clientX -
        startMouseX;


      if (
        Math.abs(deltaX) > 2
      ) {
        hasResized = true;
      }


      if (
        resizeSide === 'right'
      ) {
        const nextWidth =
          Math.max(
            minBlockWidth,
            startWidth + deltaX
          );


        block.style.width =
          `${nextWidth}px`;

        return;
      }


      if (
        resizeSide === 'left'
      ) {
        const fixedRight =
          startLeft +
          startWidth;


        const maximumLeft =
          fixedRight -
          minBlockWidth;


        const nextLeft =
          Math.max(
            0,
            Math.min(
              startLeft + deltaX,
              maximumLeft
            )
          );


        const nextWidth =
          fixedRight -
          nextLeft;


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
      if (!resizing) {
        return;
      }


      resizing = false;

      block.classList.remove(
        'resizing'
      );


      /*
       * 実際に変更していない場合。
       */
      if (!hasResized) {
        resizeSide = null;
        beforeResizeState = null;

        renderBlocks?.();
        applySelectionClasses?.();

        return;
      }


      const finalLeft =
        parseFloat(
          block.style.left
        ) || 0;


      const finalWidth =
        parseFloat(
          block.style.width
        ) ||
        minBlockWidth;


      const timelineScale =
        Number(
          getScale?.()
        ) || 90;


      if (
        resizeSide === 'right'
      ) {
        const nextEndSeconds =
          originalStartSeconds +
          finalWidth /
            timelineScale;


        blockData.end =
          formatTime(
            nextEndSeconds
          );
      }


      if (
        resizeSide === 'left'
      ) {
        const nextStartSeconds =
          finalLeft /
          timelineScale;


        blockData.start =
          formatTime(
            Math.min(
              nextStartSeconds,
              originalEndSeconds -
                0.01
            )
          );


        /*
         * 左側変更時は終了時間を固定。
         */
        blockData.end =
          formatTime(
            originalEndSeconds
          );
      }


      renderBlocks?.();
      applySelectionClasses?.();


      const restoredElement =
        document.querySelector(
          `.lyricsBlock[data-block-id="${blockData.id}"]`
        );


      if (restoredElement) {
        loadInspector?.(
          restoredElement
        );
      }


      updatePreview?.(
        blockData,
        {
          animate: false
        }
      );


      sendToVisualizer?.(
        blockData
      );


      commitHistory?.(
        beforeResizeState
      );


      resizeSide = null;
      beforeResizeState = null;
      hasResized = false;
    }
  );
}


/*
 * タイムライン用の
 * 歌詞ブロックDOMを作成する。
 */
function createBlockElement({
  blockData,
  blocks = [],
  sectionName = '',

  timelineScale = 90,
  rowHeight = 56,
  minBlockWidth = 40,

  parseTime,
  getAnimationLabel,

  onSelect,
  onTimingRestart,

  isTimingInputMode = false,

  setupDrag,
  setupResize
}) {
  if (!blockData) {
    return null;
  }


  const block =
    document.createElement(
      'div'
    );


  block.className =
    'lyricsBlock';

  block.draggable =
    false;

  block.dataset.blockId =
    blockData.id;

  block.dataset.animationPreset =
    blockData.animationPreset ||
    'fade';


  const startSeconds =
    parseTime(
      blockData.start
    );

  const endSeconds =
    parseTime(
      blockData.end
    );


  const durationSeconds =
    Math.max(
      endSeconds -
        startSeconds,
      0.5
    );


  const index =
    blocks.findIndex(
      item =>
        item.id ===
        blockData.id
    );


  block.style.position =
    'absolute';

  block.style.left =
    `${startSeconds *
      timelineScale}px`;

  block.style.top =
    `${Math.max(0, index) *
      rowHeight}px`;

  block.style.width =
    `${Math.max(
      durationSeconds *
        timelineScale,

      minBlockWidth
    )}px`;


  const animationLabel =
    typeof getAnimationLabel ===
      'function'
      ? getAnimationLabel(
          blockData.animationPreset
        )
      : (
          blockData.animationPreset ||
          'fade'
        );


  const position =
    blockData.position || {
      x: 0,
      y: 0,
      z: 0
    };


  block.innerHTML = `
    <div class="lyricsBlockTop">
      <div class="lyricsBlockMotion"></div>
      <div class="lyricsBlockSection"></div>
    </div>

    <div class="lyricsTime"></div>

    <div class="lyricsSentence"></div>

    <div class="lyricsBlockMeta">
      <span></span>
    </div>

    <div
      class="lyricsResizeHandle
             lyricsResizeHandleLeft"
    ></div>

    <div
      class="lyricsResizeHandle
             lyricsResizeHandleRight"
    ></div>
  `;


  /*
   * textContentで設定し、
   * 歌詞内のHTML文字列を
   * DOMとして解釈させない。
   */
  const motionElement =
    block.querySelector(
      '.lyricsBlockMotion'
    );

  const sectionElement =
    block.querySelector(
      '.lyricsBlockSection'
    );

  const timeElement =
    block.querySelector(
      '.lyricsTime'
    );

  const sentenceElement =
    block.querySelector(
      '.lyricsSentence'
    );

  const metaElement =
    block.querySelector(
      '.lyricsBlockMeta span'
    );


  if (motionElement) {
    motionElement.textContent =
      animationLabel;
  }

  if (sectionElement) {
    sectionElement.textContent =
      sectionName;
  }

  if (timeElement) {
    timeElement.textContent =
      `${blockData.start} → ${blockData.end}`;
  }

  if (sentenceElement) {
    sentenceElement.textContent =
      blockData.text || '';
  }

  if (metaElement) {
    metaElement.textContent =
      `Position X:${Number(position.x) || 0} ` +
      `Y:${Number(position.y) || 0} ` +
      `Z:${Number(position.z) || 0}`;
  }


  block.addEventListener(
    'click',
    event => {
      const additive =
        event.ctrlKey ||
        event.metaKey;

      const range =
        event.shiftKey;


      onSelect?.(
        block,
        {
          additive,
          range
        }
      );


      if (
        isTimingInputMode &&
        !additive &&
        !range
      ) {
        onTimingRestart?.(
          block
        );
      }


      event.stopPropagation();
    }
  );


  setupDrag?.(
    block,
    blockData
  );

  setupResize?.(
    block,
    blockData
  );


  return block;
}


/*
 * タイムラインの全ブロックを描画する。
 */
function renderBlocks({
  container,
  blocks = [],
  sectionName = '',

  createElement,

  applySelection,
  updateHeight
}) {
  if (!container) {
    return;
  }


  container.innerHTML =
    '';


  blocks.forEach(blockData => {
    const block =
      createElement?.({
        blockData,
        blocks,
        sectionName
      });


    if (block) {
      container.appendChild(
        block
      );
    }
  });


  applySelection?.();


  /*
   * DOM配置後に高さを再計算する。
   */
  requestAnimationFrame(
    () => {
      updateHeight?.();
    }
  );
}


   return {
  getTotalWidth,
  updateContentWidth,
  updateContentHeight,
  renderRuler,
  setupBlockDrag,
  setupBlockResize,
  createBlockElement,
  renderBlocks
};
    }


    return {
      create
    };
  })();