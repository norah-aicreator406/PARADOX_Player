/* ==================================================
   NORAH Studio
   Lyrics Editor Selection Utilities
================================================== */

window.LyricsEditorSelection = (() => {
  /*
   * クリック操作に応じて、
   * 次の選択ID一覧を計算する。
   *
   * 状態そのものは外部で管理し、
   * このモジュールは計算だけ担当する。
   */
  function calculateSelection({
    blockId,
    blocks = [],
    selectedIds = [],
    lastSelectedId = null,
    additive = false,
    range = false
  }) {
    const nextSelectedIds =
      new Set(
        selectedIds
      );

    let nextLastSelectedId =
      lastSelectedId;


    if (!blockId) {
      return {
        selectedIds:
          nextSelectedIds,

        lastSelectedId:
          nextLastSelectedId
      };
    }


    /*
     * Shift＋クリック：
     * 前回選択した位置から
     * 今回クリックした位置まで範囲選択。
     */
    if (
      range &&
      lastSelectedId
    ) {
      const startIndex =
        blocks.findIndex(
          block =>
            block.id ===
            lastSelectedId
        );

      const endIndex =
        blocks.findIndex(
          block =>
            block.id ===
            blockId
        );

      if (
        startIndex !== -1 &&
        endIndex !== -1
      ) {
        if (!additive) {
          nextSelectedIds.clear();
        }

        const from =
          Math.min(
            startIndex,
            endIndex
          );

        const to =
          Math.max(
            startIndex,
            endIndex
          );

        for (
          let index = from;
          index <= to;
          index += 1
        ) {
          const targetId =
            blocks[index]?.id;

          if (targetId) {
            nextSelectedIds.add(
              targetId
            );
          }
        }

        nextLastSelectedId =
          blockId;
      }

      return {
        selectedIds:
          nextSelectedIds,

        lastSelectedId:
          nextLastSelectedId
      };
    }


    /*
     * Command / Ctrl＋クリック：
     * 個別に追加・解除。
     */
    if (additive) {
      if (
        nextSelectedIds.has(
          blockId
        )
      ) {
        nextSelectedIds.delete(
          blockId
        );
      } else {
        nextSelectedIds.add(
          blockId
        );
      }

      nextLastSelectedId =
        blockId;

      return {
        selectedIds:
          nextSelectedIds,

        lastSelectedId:
          nextLastSelectedId
      };
    }


    /*
     * 通常クリック：
     * 1件だけ選択。
     */
    nextSelectedIds.clear();

    nextSelectedIds.add(
      blockId
    );

    nextLastSelectedId =
      blockId;

    return {
      selectedIds:
        nextSelectedIds,

      lastSelectedId:
        nextLastSelectedId
    };
  }


  /*
   * 選択中クラスをDOMへ反映する。
   */
  function applySelectionClasses({
    selector =
      '.lyricsBlock',

    selectedIds = []
  }) {
    const selectedSet =
      selectedIds instanceof Set
        ? selectedIds
        : new Set(
            selectedIds
          );

    document
      .querySelectorAll(
        selector
      )
      .forEach(element => {
        const blockId =
          element.dataset.blockId;

        element.classList.toggle(
          'selected',
          selectedSet.has(
            blockId
          )
        );
      });
  }


  /*
   * 現在再生中のブロックへ
   * is-playingクラスを付ける。
   */
  function applyPlaybackClasses({
    selector =
      '.lyricsBlock',

    activeBlocks = []
  }) {
    const activeIds =
      new Set(
        activeBlocks
          .map(block => block?.id)
          .filter(Boolean)
      );

    document
      .querySelectorAll(
        selector
      )
      .forEach(element => {
        element.classList.toggle(
          'is-playing',
          activeIds.has(
            element.dataset.blockId
          )
        );
      });
  }


  /*
   * セクションへ戻った際に
   * 復元するブロックIDを決める。
   */
  function resolveSectionSelection({
    blocks = [],
    savedBlockId = null,
    selectFirstWhenEmpty = true
  }) {
    if (!blocks.length) {
      return null;
    }

    const savedExists =
      savedBlockId &&
      blocks.some(
        block =>
          block.id ===
          savedBlockId
      );

    if (savedExists) {
      return savedBlockId;
    }

    if (
      selectFirstWhenEmpty
    ) {
      return (
        blocks[0]?.id ||
        null
      );
    }

    return null;
  }


  return {
    calculateSelection,
    applySelectionClasses,
    applyPlaybackClasses,
    resolveSectionSelection
  };
})();