(function () {
  const VALID_RATIOS = ['16:9', '9:16'];

  /*
    Media Layer未設定時の安全な初期値。
    「どのratioが正しいか」ではなく、
    「有効なlayoutが1つも無いときに何を返すか」だけを決める値。
  */
  const DEFAULT_MEDIA_LAYOUT = {
    position: { x: 0, y: 0, z: 0 },
    size: { width: 400, height: 400 },
    rotation: 0
  };

  function cloneLayout(layout) {
    return {
      position: {
        x: Number(layout.position?.x) || 0,
        y: Number(layout.position?.y) || 0,
        z: Number(layout.position?.z) || 0
      },
      size: {
        width: Number(layout.size?.width) || 0,
        height: Number(layout.size?.height) || 0
      },
      rotation: Number(layout.rotation) || 0
    };
  }

  /*
    "16:9" / "9:16" のみを正とする。
    それ以外（undefined/null/不正値）はfallbackを返す。

    ratioの権威はこのモジュールではなく呼び出し側（Editor/Visualizer等）
    が持つため、既定値を勝手に決め打ちしない。fallbackは
    呼び出し側が自分の文脈に応じて渡す。
  */
  function normalizeRatio(ratio, fallback = '16:9') {
    if (VALID_RATIOS.includes(ratio)) {
      return ratio;
    }

    if (VALID_RATIOS.includes(fallback)) {
      return fallback;
    }

    /*
      ratioもfallbackも不正な場合のみ、
      最終安全値として"16:9"を返す。
    */
    return '16:9';
  }

  function getOppositeRatio(ratio) {
    if (ratio === '16:9') return '9:16';
    if (ratio === '9:16') return '16:9';
    return null;
  }

  function isUsableLayoutEntry(entry) {
    if (!entry || !entry.position || !entry.size) {
      return false;
    }

    const x = Number(entry.position.x);
    const y = Number(entry.position.y);
    const z = Number(entry.position.z);

    const width = Number(entry.size.width);
    const height = Number(entry.size.height);

    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Number.isFinite(z) &&
      Number.isFinite(width) && width > 0 &&
      Number.isFinite(height) && height > 0
    );
  }

  /*
    Media Layerからratio用のlayoutを解決する。

    優先順位:
      1. layoutByRatio[正規化されたratio]
      2. layoutByRatio[反対側のratio]（変換はせずそのまま流用）
      3. DEFAULT_MEDIA_LAYOUT

    このモジュールは「今どのratioが正しいか」は判断しない。
    渡されたratioに対して、存在するlayoutを解決するだけ。
  */
  function resolveMediaLayoutForRatio(layer, ratio, fallback = '16:9') {
    const normalizedRatio =
      normalizeRatio(ratio, fallback);

    const layoutByRatio =
      (layer && layer.layoutByRatio) || {};

    const primary =
      layoutByRatio[normalizedRatio];

    if (isUsableLayoutEntry(primary)) {
      return cloneLayout(primary);
    }

    const oppositeRatio =
      getOppositeRatio(normalizedRatio);

    const opposite =
      oppositeRatio
        ? layoutByRatio[oppositeRatio]
        : null;

    if (isUsableLayoutEntry(opposite)) {
      return cloneLayout(opposite);
    }

    return cloneLayout(DEFAULT_MEDIA_LAYOUT);
  }

  /*
    新規Media Layer作成時に、16:9/9:16両方の
    layoutByRatioを同時に生成するためのヘルパー。
    それぞれ独立したオブジェクトを返す（参照共有しない）。
  */
  function createDefaultLayoutByRatio() {
    return {
      '16:9': cloneLayout(DEFAULT_MEDIA_LAYOUT),
      '9:16': cloneLayout(DEFAULT_MEDIA_LAYOUT)
    };
  }

  window.NorahMediaLayout = {
    normalizeRatio,
    resolveMediaLayoutForRatio,
    createDefaultLayoutByRatio,
    DEFAULT_MEDIA_LAYOUT
  };
})();
