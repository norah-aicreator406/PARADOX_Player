/* ==================================================
   NORAH Studio
   Lyrics Editor Media Track (Phase 3-1)

   歌詞タイムライン（lyricsEditorTimeline.js）とは
   別のDOM id・別のデータ配列（mediaLayers）を持つ、
   独立したタイムライン実装。

   lyricsEditorTimeline.js内部が#lyricsBlockList等の
   DOM idを直書きしているため、同じファクトリを
   2つ目のインスタンスとして使い回すことはできない。
   そのため座標変換のロジックのみを踏襲し、
   別ファイルとして再実装している。
================================================== */

window.LyricsEditorMediaTrack =
  (() => {
    function create(options = {}) {
      const getCurrentLayers =
        options.getCurrentLayers;

      const getTimelineScale =
        options.getTimelineScale;

      const getTotalWidth =
        options.getTotalWidth;

      const parseTime =
        options.parseTime;

      const formatTime =
        options.formatTime;

      const minBlockWidth =
        Number(options.minBlockWidth) ||
        24;

      const rowHeight =
        Number(options.rowHeight) ||
        44;

      const onSelectionChange =
        options.onSelectionChange;

      const onLayoutChange =
        options.onLayoutChange;


      let selectedLayerId =
        null;


      function getBlockListElement() {
        return document.getElementById(
          'mediaBlockList'
        );
      }


      /*
       * 歌詞タイムラインと横幅を揃える。
       * 幅の計算自体はlyricsEditorTimeline側の
       * getTotalWidth()をそのまま利用する
       * （読み取りのみ、別実装を持たない）。
       */
      function updateContentWidth() {
        const content =
          document.getElementById(
            'mediaTrackContent'
          );

        const blockList =
          getBlockListElement();

        const totalWidth =
          Number(
            getTotalWidth?.()
          ) || 1600;

        const widthText =
          `${totalWidth}px`;

        if (content) {
          content.style.width =
            widthText;

          content.style.minWidth =
            widthText;
        }

        if (blockList) {
          blockList.style.width =
            widthText;

          blockList.style.minWidth =
            widthText;
        }
      }


      function getEndSeconds(layer) {
        const startSeconds =
          parseTime(
            layer.start
          );

        if (
          layer.end === null ||
          layer.end === undefined ||
          layer.end === ''
        ) {
          return startSeconds + 3;
        }

        return parseTime(
          layer.end
        );
      }


      function createBlockElement(
        layer,
        scale
      ) {
        const startSeconds =
          parseTime(
            layer.start
          );

        const endSeconds =
          getEndSeconds(
            layer
          );

        const left =
          Math.max(
            0,
            startSeconds * scale
          );

        const width =
          Math.max(
            minBlockWidth,
            (endSeconds - startSeconds) * scale
          );

        const el =
          document.createElement(
            'div'
          );

        el.className =
          'mediaBlock' +
          (
            layer.id === selectedLayerId
              ? ' selected'
              : ''
          );

        el.dataset.mediaLayerId =
          layer.id;

        el.style.left =
          `${left}px`;

        el.style.width =
          `${width}px`;

        el.style.height =
          `${rowHeight}px`;

        const label =
          document.createElement(
            'span'
          );

        label.className =
          'mediaBlockLabel';

        label.textContent =
          (layer.source && layer.source.fileName) ||
          (layer.type === 'video' ? '動画' : '画像');

        el.appendChild(
          label
        );

        const leftHandle =
          document.createElement(
            'div'
          );

        leftHandle.className =
          'mediaBlockResizeHandle left';

        el.appendChild(
          leftHandle
        );

        const rightHandle =
          document.createElement(
            'div'
          );

        rightHandle.className =
          'mediaBlockResizeHandle right';

        el.appendChild(
          rightHandle
        );

        el.addEventListener(
          'mousedown',
          (event) => {
            if (
              event.target === leftHandle ||
              event.target === rightHandle
            ) {
              return;
            }

            startDrag(
              event,
              layer,
              el,
              scale
            );
          }
        );

        leftHandle.addEventListener(
          'mousedown',
          (event) => {
            startResize(
              event,
              layer,
              el,
              scale,
              'left'
            );
          }
        );

        rightHandle.addEventListener(
          'mousedown',
          (event) => {
            startResize(
              event,
              layer,
              el,
              scale,
              'right'
            );
          }
        );

        el.addEventListener(
          'click',
          (event) => {
            event.stopPropagation();

            selectLayer(
              layer.id
            );
          }
        );

        return el;
      }


      function render() {
        const blockList =
          getBlockListElement();

        if (!blockList) {
          return;
        }

        updateContentWidth();

        blockList.innerHTML =
          '';

        const layers =
          getCurrentLayers?.() ||
          [];

        const scale =
          Number(
            getTimelineScale?.()
          ) || 90;

        layers.forEach(layer => {
          blockList.appendChild(
            createBlockElement(
              layer,
              scale
            )
          );
        });
      }


      function selectLayer(id) {
        selectedLayerId =
          id;

        render();

        onSelectionChange?.(
          id
        );
      }


      function clearSelection() {
        selectedLayerId =
          null;

        render();

        onSelectionChange?.(
          null
        );
      }


      function getSelectedId() {
        return selectedLayerId;
      }


      function startDrag(
        event,
        layer,
        el,
        scale
      ) {
        event.preventDefault();

        const startX =
          event.clientX;

        const startSeconds =
          parseTime(
            layer.start
          );

        const endSeconds =
          getEndSeconds(
            layer
          );

        const duration =
          endSeconds - startSeconds;

        function onMouseMove(moveEvent) {
          const deltaSeconds =
            (moveEvent.clientX - startX) / scale;

          const newStart =
            Math.max(
              0,
              startSeconds + deltaSeconds
            );

          const newEnd =
            newStart + duration;

          layer.start =
            formatTime(
              newStart
            );

          layer.end =
            formatTime(
              newEnd
            );

          el.style.left =
            `${newStart * scale}px`;
        }

        function onMouseUp() {
          document.removeEventListener(
            'mousemove',
            onMouseMove
          );

          document.removeEventListener(
            'mouseup',
            onMouseUp
          );

          layer.updatedAt =
            new Date().toISOString();

          onLayoutChange?.(
            layer
          );

          render();
        }

        document.addEventListener(
          'mousemove',
          onMouseMove
        );

        document.addEventListener(
          'mouseup',
          onMouseUp
        );
      }


      function startResize(
        event,
        layer,
        el,
        scale,
        side
      ) {
        event.preventDefault();
        event.stopPropagation();

        const startX =
          event.clientX;

        const startSeconds =
          parseTime(
            layer.start
          );

        const endSeconds =
          getEndSeconds(
            layer
          );

        function onMouseMove(moveEvent) {
          const deltaSeconds =
            (moveEvent.clientX - startX) / scale;

          if (side === 'left') {
            const maxStart =
              endSeconds - (minBlockWidth / scale);

            const newStart =
              Math.min(
                maxStart,
                Math.max(
                  0,
                  startSeconds + deltaSeconds
                )
              );

            layer.start =
              formatTime(
                newStart
              );

            el.style.left =
              `${newStart * scale}px`;

            el.style.width =
              `${(endSeconds - newStart) * scale}px`;

            return;
          }

          const minEnd =
            startSeconds + (minBlockWidth / scale);

          const newEnd =
            Math.max(
              minEnd,
              endSeconds + deltaSeconds
            );

          layer.end =
            formatTime(
              newEnd
            );

          el.style.width =
            `${(newEnd - startSeconds) * scale}px`;
        }

        function onMouseUp() {
          document.removeEventListener(
            'mousemove',
            onMouseMove
          );

          document.removeEventListener(
            'mouseup',
            onMouseUp
          );

          layer.updatedAt =
            new Date().toISOString();

          onLayoutChange?.(
            layer
          );

          render();
        }

        document.addEventListener(
          'mousemove',
          onMouseMove
        );

        document.addEventListener(
          'mouseup',
          onMouseUp
        );
      }


      return {
        render,
        selectLayer,
        clearSelection,
        getSelectedId
      };
    }

    return {
      create
    };
  })();
