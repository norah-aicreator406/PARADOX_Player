(function () {
  const RATIOS = {
    '16:9': {
      width: 1920,
      height: 1080
    },

    '9:16': {
      width: 1080,
      height: 1920
    }
  };

  function normalizeRatio(ratio) {
    return ratio === '16:9'
      ? '16:9'
      : '9:16';
  }

  function getCanvasSize(ratio = '9:16') {
    const normalizedRatio =
      normalizeRatio(ratio);

    return {
      ...RATIOS[normalizedRatio]
    };
  }

  function calculateScale({
    containerWidth,
    containerHeight,
    canvasWidth,
    canvasHeight
  }) {
    const safeContainerWidth =
      Number(containerWidth) || 0;

    const safeContainerHeight =
      Number(containerHeight) || 0;

    const safeCanvasWidth =
      Number(canvasWidth) || 1;

    const safeCanvasHeight =
      Number(canvasHeight) || 1;

    if (
      safeContainerWidth <= 0 ||
      safeContainerHeight <= 0
    ) {
      return 1;
    }

    return Math.min(
      safeContainerWidth /
        safeCanvasWidth,

      safeContainerHeight /
        safeCanvasHeight
    );
  }

  function fitCanvas({
    container,
    canvas,
    ratio = '9:16',
    cssVariable =
      '--norah-viewport-scale'
  }) {
    if (!container || !canvas) {
      return null;
    }

    const size =
      getCanvasSize(ratio);

    canvas.style.width =
      `${size.width}px`;

    canvas.style.height =
      `${size.height}px`;

    const scale =
      calculateScale({
        containerWidth:
          container.clientWidth,

        containerHeight:
          container.clientHeight,

        canvasWidth:
          size.width,

        canvasHeight:
          size.height
      });

    canvas.style.setProperty(
      cssVariable,
      String(scale)
    );

    return {
      ratio:
        normalizeRatio(ratio),

      width:
        size.width,

      height:
        size.height,

      scale
    };
  }

  function getElementScale(element) {
    if (!element) {
      return {
        x: 1,
        y: 1
      };
    }

    const rect =
      element.getBoundingClientRect();

    const logicalWidth =
      element.offsetWidth || 1;

    const logicalHeight =
      element.offsetHeight || 1;

    return {
      x:
        rect.width /
        logicalWidth,

      y:
        rect.height /
        logicalHeight
    };
  }

  function screenDeltaToCanvas(
    element,
    deltaX,
    deltaY
  ) {
    const scale =
      getElementScale(element);

    return {
      x:
        scale.x > 0
          ? deltaX / scale.x
          : deltaX,

      y:
        scale.y > 0
          ? deltaY / scale.y
          : deltaY
    };
  }

  window.NorahViewport = {
    getCanvasSize,
    calculateScale,
    fitCanvas,
    getElementScale,
    screenDeltaToCanvas
  };
})();