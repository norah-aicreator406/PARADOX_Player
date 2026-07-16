/* ==================================================
   NORAH Studio
   Lyrics Editor Clipboard
================================================== */

window.LyricsEditorClipboard =
  (() => {
    let copiedAppearance = null;


    function clone(value) {
      if (value == null) {
        return value;
      }

      return JSON.parse(
        JSON.stringify(value)
      );
    }


    /*
     * ブロックから見た目だけをコピー。
     *
     * text / start / end / id は含めない。
     */
    function copyAppearance(
      block
    ) {
      if (!block) {
        return false;
      }

      copiedAppearance = {
        style:
          clone(
            block.style || {}
          ),

        animation:
          clone(
            block.animation || {}
          ),

        animationPreset:
          block.animationPreset ||
          block.animation
            ?.in?.preset ||
          'fade',

        position:
          clone(
            block.position || {
              x: 0,
              y: 0,
              z: 0
            }
          ),

        layout:
          clone(
            block.layout || {
              width: 900,
              rotation: 0
            }
          )
      };

      return true;
    }


    /*
     * 保存済みの見た目を
     * 対象ブロックへ適用。
     */
    function pasteAppearance(
      block
    ) {
      if (
        !block ||
        !copiedAppearance
      ) {
        return false;
      }

      block.style =
        clone(
          copiedAppearance.style
        );

      block.animation =
        clone(
          copiedAppearance.animation
        );

      block.animationPreset =
        copiedAppearance
          .animationPreset;

      block.position =
        clone(
          copiedAppearance.position
        );

      block.layout =
        clone(
          copiedAppearance.layout
        );

      return true;
    }


    function hasAppearance() {
      return Boolean(
        copiedAppearance
      );
    }


    function clear() {
      copiedAppearance = null;
    }


    function getPreview() {
      return clone(
        copiedAppearance
      );
    }


    return {
      copyAppearance,
      pasteAppearance,
      hasAppearance,
      clear,
      getPreview
    };
  })();