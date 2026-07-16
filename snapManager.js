/* ==================================================
   NORAH Studio
   Shared Snap Manager
================================================== */

window.NorahSnapManager = (() => {
  /*
   * 値がスナップ対象に近いか判定し、
   * 必要なら対象値へ吸着する。
   */
  function snapValue({
    value,
    target = 0,
    threshold = 12,
    disabled = false
  }) {
    const safeValue =
      Number(value) || 0;

    const safeTarget =
      Number(target) || 0;

    const safeThreshold =
      Math.max(
        0,
        Number(threshold) || 0
      );

    if (disabled) {
      return {
        value: safeValue,
        snapped: false
      };
    }

    const distance =
      Math.abs(
        safeValue -
        safeTarget
      );

    if (
      distance <= safeThreshold
    ) {
      return {
        value: safeTarget,
        snapped: true
      };
    }

    return {
      value: safeValue,
      snapped: false
    };
  }


  /*
   * X・Yを個別に中央へスナップする。
   */
  function snapPosition({
    x,
    y,
    targetX = 0,
    targetY = 0,
    thresholdX = 12,
    thresholdY = 12,
    disabled = false
  }) {
    const xResult =
      snapValue({
        value: x,
        target: targetX,
        threshold: thresholdX,
        disabled
      });

    const yResult =
      snapValue({
        value: y,
        target: targetY,
        threshold: thresholdY,
        disabled
      });

    return {
      x: xResult.value,
      y: yResult.value,

      snappedX:
        xResult.snapped,

      snappedY:
        yResult.snapped
    };
  }


  return {
    snapValue,
    snapPosition
  };
})();