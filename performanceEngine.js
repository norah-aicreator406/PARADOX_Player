
(function initializePerformanceEngine() {
  const activeEffects = new Map();

  const defaultParameters = {
    flash: {
      intensity: 1,
      speed: 6
    }
  };

  function normalizeEffectName(effectName) {
    return String(effectName || '').trim();
  }

  function getDefaultParameters(effectName) {
    return {
      ...(defaultParameters[effectName] || {})
    };
  }

  function sendEffectState(effectName, active, parameters = {}) {
  const { ipcRenderer } = require('electron');

  ipcRenderer.send('performance-effect', {
    effect: effectName,
    active: Boolean(active),
    params: {
      ...parameters
    }
  });
}

  const PerformanceEngine = {
    /**
     * エフェクトを発動する
     *
     * 将来の入力元：
     * - キーボード
     * - Launchpad
     * - MIDIキーボード
     * - 画面上のボタン
     */
    activate(effectName, parameters = {}) {
      const normalizedName = normalizeEffectName(effectName);

      if (!normalizedName) {
        console.warn(
          '[PerformanceEngine] Effect name is required.'
        );
        return;
      }

      const currentState =
        activeEffects.get(normalizedName);

      const mergedParameters = {
        ...getDefaultParameters(normalizedName),
        ...(currentState?.params || {}),
        ...parameters
      };

      activeEffects.set(normalizedName, {
        active: true,
        params: mergedParameters
      });

      sendEffectState(
        normalizedName,
        true,
        mergedParameters
      );
    },

    /**
     * エフェクトを停止する
     */
    deactivate(effectName) {
      const normalizedName = normalizeEffectName(effectName);

      if (!normalizedName) {
        return;
      }

      const currentState =
        activeEffects.get(normalizedName);

      const parameters = {
        ...getDefaultParameters(normalizedName),
        ...(currentState?.params || {})
      };

      activeEffects.delete(normalizedName);

      sendEffectState(
        normalizedName,
        false,
        parameters
      );
    },

    /**
     * 発動中のエフェクトへパラメータを送る
     *
     * 将来：
     * Launchpadのツマミからspeedやintensityを変更する。
     */
    setParameters(effectName, parameters = {}) {
      const normalizedName = normalizeEffectName(effectName);

      if (!normalizedName) {
        return;
      }

      const currentState =
        activeEffects.get(normalizedName);

      const mergedParameters = {
        ...getDefaultParameters(normalizedName),
        ...(currentState?.params || {}),
        ...parameters
      };

      const isActive =
        currentState?.active === true;

      if (isActive) {
        activeEffects.set(normalizedName, {
          active: true,
          params: mergedParameters
        });
      }

      sendEffectState(
        normalizedName,
        isActive,
        mergedParameters
      );
    },

    /**
     * 現在のパラメータを取得する
     */
    getParameters(effectName) {
      const normalizedName = normalizeEffectName(effectName);

      const currentState =
        activeEffects.get(normalizedName);

      return {
        ...getDefaultParameters(normalizedName),
        ...(currentState?.params || {})
      };
    },

    /**
     * エフェクトが発動中か確認する
     */
    isActive(effectName) {
      const normalizedName = normalizeEffectName(effectName);

      return activeEffects.has(normalizedName);
    },

    /**
     * すべてのエフェクトを解除する
     *
     * ウィンドウが非アクティブになった場合などに使う。
     */
    clearAll() {
      const effectNames = [
        ...activeEffects.keys()
      ];

      effectNames.forEach(effectName => {
        this.deactivate(effectName);
      });
    }
  };

  window.PerformanceEngine =
    PerformanceEngine;

  console.log(
    '[PerformanceEngine] Initialized'
  );

const PerformanceEngine = {
  activate(effect, params = {}) {
    if (effect === 'flash') {
      activateFlash(params);
    }

    if (effect === 'whiteOut') {
      activateWhiteOut(params);
    }

    if (effect === 'shake') {
      activateShake(params);
    }

    if (effect === 'punchZoom') {
      activatePunchZoom(params);
    }
  },

  deactivate(effect) {
    if (effect === 'flash') {
      deactivateFlash();
    }

    if (effect === 'whiteOut') {
      deactivateWhiteOut();
    }

    if (effect === 'shake') {
      deactivateShake();
    }

    if (effect === 'punchZoom') {
      deactivatePunchZoom();
    }
  },

  setParameters(effect, params = {}) {
    if (effect === 'punchZoom') {
      zoomState.intensity =
        params.intensity ??
        zoomState.intensity;

      zoomState.speed =
        params.speed ??
        zoomState.speed;

      zoomState.duration =
        params.duration ??
        zoomState.duration;
    }

    /*
     * 既存のFlash、White Out、Shake処理は
     * そのまま残す
     */
  } 
};


  
})();