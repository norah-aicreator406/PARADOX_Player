/* ==================================================
   NORAH Studio
   Lyrics Editor Animation
================================================== */

window.LyricsEditorAnimation =
  (() => {
    const IN_DESCRIPTIONS = {
      off:
        '登場アニメーションを使用しません。',

      fade:
        '透明な状態から表示します。',

      slideUp:
        '下から上へ移動しながら表示します。',

      slideDown:
        '上から下へ移動しながら表示します。',

      slideLeft:
        '右から左へ移動しながら表示します。',

      slideRight:
        '左から右へ移動しながら表示します。',

      zoom:
        '小さい状態から通常サイズへ拡大します。',

      blurIn:
        'ぼけた状態から鮮明に表示します。',

      rotateIn:
        '少し回転しながら表示します。',

      bounceIn:
        '弾むように拡大して表示します。',

      glitch:
        '位置や色が乱れるグリッチ演出です。',

      neonFlicker:
        'ネオンが点滅しながら表示します。'
    };


    const HOLD_DESCRIPTIONS = {
      off:
        '表示中の動きを使用しません。',

      hover:
        '歌詞がゆっくり上下に浮遊します。',

      pulse:
        '歌詞がリズミカルに拡大・縮小します。',

      breathing:
        '歌詞が呼吸するように穏やかに動きます。',

      shake:
        '歌詞が左右に細かく揺れます。'
    };


    const OUT_DESCRIPTIONS = {
      off:
        '退場アニメーションを使用しません。',

      fade:
        '歌詞が徐々に透明になります。',

      scaleDown:
        '歌詞が小さくなりながら消えます。',

      blurOut:
        '歌詞がぼやけながら消えます。',

      dropOut:
        '歌詞が下へ落ちながら消えます。'
    };


    /*
     * 旧形式を含むブロックデータを
     * 現在のIN / HOLD / OUT形式へ正規化する。
     */
    function normalize(
      block
    ) {
      const legacyPreset =
        block?.animationPreset ||
        'fade';


      return {
        in: {
          preset:
            block?.animation
              ?.in?.preset ??
            legacyPreset,

          duration:
            Number(
              block?.animation
                ?.in?.duration ??
              0.5
            )
        },

        hold: {
          preset:
            block?.animation
              ?.hold?.preset ??
            'off',

          speed:
            Number(
              block?.animation
                ?.hold?.speed ??
              1
            ),

          strength:
            Number(
              block?.animation
                ?.hold?.strength ??
              12
            )
        },

        out: {
          preset:
            block?.animation
              ?.out?.preset ??
            'off',

          duration:
            Number(
              block?.animation
                ?.out?.duration ??
              0.5
            )
        }
      };
    }


    /*
     * 共通AnimationEngineへ処理を委譲。
     */
    function applyIn(
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


    function applyHold(
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


    function applyOut(
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


    function getInDescription(
      preset
    ) {
      return (
        IN_DESCRIPTIONS[
          preset
        ] ||
        IN_DESCRIPTIONS.off
      );
    }


    function getHoldDescription(
      preset
    ) {
      return (
        HOLD_DESCRIPTIONS[
          preset
        ] ||
        HOLD_DESCRIPTIONS.off
      );
    }


    function getOutDescription(
      preset
    ) {
      return (
        OUT_DESCRIPTIONS[
          preset
        ] ||
        OUT_DESCRIPTIONS.off
      );
    }


    /*
     * Inspector表示用の値を整形する。
     */
    function formatDuration(
      value,
      fallback = 0.5
    ) {
      const safeValue =
        Number(value);

      const result =
        Number.isFinite(
          safeValue
        )
          ? safeValue
          : fallback;

      return `${result.toFixed(2)}秒`;
    }


    function formatNumber(
      value,
      fallback = 0,
      digits = 2
    ) {
      const safeValue =
        Number(value);

      const result =
        Number.isFinite(
          safeValue
        )
          ? safeValue
          : fallback;

      return result.toFixed(
        digits
      );
    }


    function formatInteger(
      value,
      fallback = 0
    ) {
      const safeValue =
        Number(value);

      const result =
        Number.isFinite(
          safeValue
        )
          ? safeValue
          : fallback;

      return String(
        Math.round(result)
      );
    }


    return {
      normalize,

      applyIn,
      applyHold,
      applyOut,

      getInDescription,
      getHoldDescription,
      getOutDescription,

      formatDuration,
      formatNumber,
      formatInteger
    };
  })();