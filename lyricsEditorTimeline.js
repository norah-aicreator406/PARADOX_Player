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


      return {
        getTotalWidth,
        updateContentWidth,
        updateContentHeight,
        renderRuler
      };
    }


    return {
      create
    };
  })();