/* ==================================================
   NORAH Studio
   Shared Lyrics Animation Engine
================================================== */

window.LyricsAnimationEngine = (() => {
  const IN_CLASS_MAP = {
    fade: 'lyrics-motion-fade',
    slideUp: 'lyrics-motion-slide-up',
    slideDown: 'lyrics-motion-slide-down',
    slideLeft: 'lyrics-motion-slide-left',
    slideRight: 'lyrics-motion-slide-right',
    zoom: 'lyrics-motion-zoom',
    blurIn: 'lyrics-motion-blur-in',
    rotateIn: 'lyrics-motion-rotate-in',
    bounceIn: 'lyrics-motion-bounce-in',
    glitch: 'lyrics-motion-glitch',
    neonFlicker:
      'lyrics-motion-neon-flicker'
  };

  const HOLD_CLASS_MAP = {
  hover:
    'lyrics-hold-hover',

  pulse:
    'lyrics-hold-pulse',

  breathing:
    'lyrics-hold-breathing',

  shake:
    'lyrics-hold-shake'
};

  function normalize(
    animation = {},
    legacyPreset = 'fade'
  ) {
    /*
     * 旧形式にも対応：
     *
     * {
     *   preset: 'fade',
     *   duration: 0.5
     * }
     */
    const legacyIn =
      animation.in
        ? null
        : animation;

    return {
      in: {
        preset:
          animation.in?.preset ??
          legacyIn?.preset ??
          legacyPreset ??
          'fade',

        duration:
          Number(
            animation.in?.duration ??
            legacyIn?.duration ??
            0.5
          )
      },

      hold: {
        preset:
          animation.hold?.preset ??
          'off',

        speed:
          Number(
            animation.hold?.speed ??
            1
          ),

        strength:
          Number(
            animation.hold?.strength ??
            12
          )
      },

      out: {
        preset:
          animation.out?.preset ??
          'off',

        duration:
          Number(
            animation.out?.duration ??
            0.5
          )
      }
    };
  }


  function getInWrapper(
    targetElement
  ) {
    return targetElement?.querySelector(
      '.lyricsMotionWrapper'
    ) || null;
  }


  function getHoldWrapper(
    targetElement
  ) {
    return targetElement?.querySelector(
      '.lyricsHoldWrapper'
    ) || null;
  }


  function clearIn(
    targetElement
  ) {
    const wrapper =
      getInWrapper(targetElement);

    if (!wrapper) return;

    wrapper.classList.remove(
      ...Object.values(
        IN_CLASS_MAP
      ),
      'lyrics-is-out'
    );

    wrapper.style.removeProperty(
      'animation'
    );

    wrapper.style.removeProperty(
      'opacity'
    );

    wrapper.style.removeProperty(
      'transform'
    );

    wrapper.style.removeProperty(
      'filter'
    );

    wrapper.style.removeProperty(
      '--lyrics-motion-duration'
    );
  }


  function showImmediately(
    targetElement
  ) {
    const wrapper =
      getInWrapper(targetElement);

    if (!wrapper) return;

    clearIn(targetElement);

    wrapper.style.opacity = '1';
    wrapper.style.transform = 'none';
    wrapper.style.filter = 'none';
  }


  function applyIn(
    targetElement,
    animation = {},
    {
      restart = true
    } = {}
  ) {
    const wrapper =
      getInWrapper(targetElement);

    if (!wrapper) return;

    const normalized =
      normalize(animation);

    const preset =
      normalized.in.preset;

    const duration =
      Math.max(
        0.01,
        Number(
          normalized.in.duration
        ) || 0.5
      );

    clearIn(targetElement);

    wrapper.style.setProperty(
      '--lyrics-motion-duration',
      `${duration}s`
    );

    if (preset === 'off') {
      showImmediately(
        targetElement
      );

      return;
    }

    const className =
      IN_CLASS_MAP[preset] ||
      IN_CLASS_MAP.fade;

    if (restart) {
      /*
       * 同じプリセットを再実行できるように
       * スタイル計算を確定させる。
       */
      void wrapper.offsetWidth;
    }

    wrapper.classList.add(
      className
    );
  }


  function clearHold(
    targetElement
  ) {
    const wrapper =
      getHoldWrapper(
        targetElement
      );

    if (!wrapper) return;

    wrapper.classList.remove(
      ...Object.values(
        HOLD_CLASS_MAP
      )
    );

    wrapper.style.removeProperty(
      'animation'
    );

    wrapper.style.removeProperty(
      'animation-delay'
    );

    wrapper.style.removeProperty(
      'transform'
    );

    wrapper.style.removeProperty(
      '--lyrics-hold-duration'
    );

    wrapper.style.removeProperty(
      '--lyrics-hold-strength'
    );
  }


  function applyHold(
    targetElement,
    animation = {},
    elapsedSeconds = 0
  ) {
    const wrapper =
      getHoldWrapper(
        targetElement
      );

    if (!wrapper) return;

    const normalized =
      normalize(animation);

    const preset =
      normalized.hold.preset;

    const speed =
      Math.max(
        0.05,
        Number(
          normalized.hold.speed
        ) || 1
      );

    const strength =
      Math.max(
        0,
        Number(
          normalized.hold.strength
        ) || 12
      );

    /*
     * speed 1.0 → 2秒で1往復
     */
    const duration =
      2 / speed;

    clearHold(targetElement);

    wrapper.style.setProperty(
      '--lyrics-hold-duration',
      `${duration}s`
    );

    wrapper.style.setProperty(
      '--lyrics-hold-strength',
      String(strength)
    );

    if (preset === 'off') {
      return;
    }

    const className =
      HOLD_CLASS_MAP[preset];

    if (!className) return;

    wrapper.classList.add(
      className
    );

    /*
     * DOMが再生成されても、
     * 経過時間に合った位相から再開。
     */
    const safeElapsed =
      Math.max(
        0,
        Number(elapsedSeconds) || 0
      );

    const phase =
      duration > 0
        ? safeElapsed % duration
        : 0;

    wrapper.style.animationDelay =
      `-${phase}s`;
  }


  function applyOut(
    targetElement,
    animation = {},
    remainingSeconds = Infinity
  ) {
    const wrapper =
      getInWrapper(targetElement);

    if (!wrapper) return;

    const normalized =
      normalize(animation);

    const preset =
      normalized.out.preset;

    const duration =
      Math.max(
        0.05,
        Number(
          normalized.out.duration
        ) || 0.5
      );

    const numericRemaining =
      Number(remainingSeconds);

    const safeRemaining =
      Number.isFinite(
        numericRemaining
      )
        ? Math.max(
            0,
            numericRemaining
          )
        : Infinity;

    if (
  preset === 'off' ||
  safeRemaining > duration
) {
  wrapper.classList.remove(
    'lyrics-is-out'
  );

  wrapper.style.removeProperty(
    'opacity'
  );

  wrapper.style.removeProperty(
    'transform'
  );

  wrapper.style.removeProperty(
    'filter'
  );

  return;
}

    const progress =
      Math.min(
        1,
        Math.max(
          0,
          1 -
            safeRemaining /
            duration
        )
      );

    if (
      !wrapper.classList.contains(
        'lyrics-is-out'
      )
    ) {
      wrapper.classList.add(
        'lyrics-is-out'
      );

      wrapper.classList.remove(
        ...Object.values(
          IN_CLASS_MAP
        )
      );

      wrapper.style.animation =
        'none';
    }

   if (preset === 'fade') {
  wrapper.style.opacity =
    String(1 - progress);

  wrapper.style.transform =
    'none';

  wrapper.style.filter =
    'none';

  return;
}


if (preset === 'scaleDown') {
  const scale =
    Math.max(
      0,
      1 - progress
    );

  wrapper.style.opacity =
    String(1 - progress);

  wrapper.style.transform =
    `scale(${scale})`;

  wrapper.style.filter =
    'none';

  return;
}


if (preset === 'blurOut') {
  const blur =
    progress * 30;

  wrapper.style.opacity =
    String(1 - progress);

  wrapper.style.transform =
    'none';

  wrapper.style.filter =
    `blur(${blur}px)`;

  return;
}


if (preset === 'dropOut') {
  const distance =
    progress * 140;

  const rotation =
    progress * 8;

  wrapper.style.opacity =
    String(1 - progress);

  wrapper.style.transform =
    `translateY(${distance}px)
     rotate(${rotation}deg)`;

  wrapper.style.filter =
    'none';
}
  }


  return {
    normalize,
    applyIn,
    applyHold,
    applyOut,
    clearIn,
    clearHold,
    showImmediately
  };
})();