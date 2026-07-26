window.LyricsRenderer = {
  render(targetElement, payload) {
    if (!targetElement) return;

    if (!payload) {
      targetElement.innerHTML = '';
      targetElement.style.opacity = '0';
      return;
    }

    const lines = Array.isArray(payload.lines)
      ? payload.lines
      : String(payload.text || '').split('\n');

    const style = payload.style || {};
    const isVertical = style.writingMode === 'vertical';
    const position = payload.position || { x: 0, y: 0, z: 0 };
    const layout = payload.layout || {};
    console.log('RENDER layout:', layout);

    const width = Number(layout.width) || 900;
    const rotation = Number(layout.rotation) || 0;

    targetElement.innerHTML = '';
    targetElement.style.opacity = '1';

    targetElement.style.position = 'absolute';
    targetElement.style.left = '50%';
    targetElement.style.top = '50%';

    targetElement.style.transform =
      `translate(-50%, -50%) translate(${Number(position.x) || 0}px, ${Number(position.y) || 0}px) rotate(${rotation}deg)`;

    const selectedFont =
  String(
    style.font ||
    'Noto Sans JP'
  ).trim();

targetElement.style.setProperty(
  'font-family',
  `"${selectedFont}", sans-serif`,
  'important'
);
    targetElement.style.fontSize = `${Number(style.size) || 72}px`;
    targetElement.style.opacity = (style.opacity ?? 100) / 100;
    targetElement.style.color = style.color || '#ffffff';
    targetElement.style.writingMode = isVertical
? 'vertical-rl'
    : 'horizontal-tb';

    targetElement.style.textOrientation =
  isVertical
    ? 'upright'
    : 'mixed';

  const alignMap =
  isVertical
    ? {
        left: 'start',
        center: 'center',
        right: 'end'
      }
    : {
        left: 'left',
        center: 'center',
        right: 'right'
      };
    const resolvedAlign =
  alignMap[
    style.align || 'center'
  ] || 'center';

targetElement.style.textAlign =
  resolvedAlign;
    targetElement.style.letterSpacing = `${Number(style.letterSpacing) || 0}px`;
    const letterSpacing =
  Number(style.letterSpacing) || 0;

targetElement.style.letterSpacing =
  `${letterSpacing}px`;

/*
 * letter-spacingは最後の文字の後ろにも
 * 余白を作るため、横書き時の中央位置を補正する。
 
targetElement.style.textIndent =
  !isVertical
    ? `${letterSpacing}px`
    : '0px';
    */
    targetElement.style.lineHeight = String(style.lineHeight || 1.2);

    targetElement.style.width = `${width}px`;
    targetElement.style.maxWidth = `${width}px`;
    targetElement.style.boxSizing = 'border-box';

    targetElement.style.whiteSpace = 'pre-wrap';
    targetElement.style.wordBreak = 'normal';
    targetElement.style.overflowWrap = 'anywhere';
    targetElement.style.lineBreak = 'strict';

   /*
 * 前回の装飾を一度リセット。
 */
targetElement.style.removeProperty(
  '-webkit-text-stroke'
);

targetElement.style.removeProperty(
  'text-shadow'
);


/*
 * アウトラインを再設定。
 */
const outlineWidth =
  Math.max(
    0,
    Number(style.outlineWidth) || 0
  );

const outlineColor =
  style.outlineColor ||
  '#000000';

if (outlineWidth > 0) {
  targetElement.style.setProperty(
    '-webkit-text-stroke',
    `${outlineWidth}px ${outlineColor}`
  );
}


/*
 * 影を再設定。
 */
const shadowBlur =
  Math.max(
    0,
    Number(style.shadowBlur) || 0
  );

const shadowX =
  Number(style.shadowX) || 0;

const shadowY =
  Number(style.shadowY) || 0;

const shadowColor =
  style.shadowColor ||
  '#000000';

if (
  shadowBlur > 0 ||
  shadowX !== 0 ||
  shadowY !== 0
) {
  targetElement.style.textShadow =
    `${shadowX}px ` +
    `${shadowY}px ` +
    `${shadowBlur}px ` +
    `${shadowColor}`;
}


/*
 * 歌詞DOMを再構築。
 */
targetElement.innerHTML = '';

const motionWrapper =
  document.createElement('div');

motionWrapper.className =
  'lyricsMotionWrapper lyricsInWrapper';




const holdWrapper =
  document.createElement('div');

holdWrapper.className =
  'lyricsHoldWrapper';



holdWrapper.style.setProperty(
  'font-family',
  'inherit',
  'important'
);

lines.forEach(line => {
  const div =
    document.createElement('div');

  div.className =
    'lyricsOutputLine';

  div.style.setProperty(
    'font-family',
    'inherit',
    'important'
  );

  div.style.color =
    style.color || '#ffffff';

  if (outlineWidth > 0) {
    div.style.setProperty(
      '-webkit-text-stroke',
      `${outlineWidth}px ${outlineColor}`
    );
  }

  if (
    shadowBlur > 0 ||
    shadowX !== 0 ||
    shadowY !== 0
  ) {
    div.style.textShadow =
      `${shadowX}px ` +
      `${shadowY}px ` +
      `${shadowBlur}px ` +
      `${shadowColor}`;
  }

  div.textContent =
    line;

  holdWrapper.appendChild(
    div
  );
});

motionWrapper.appendChild(
  holdWrapper
);

targetElement.appendChild(
  motionWrapper
);

requestAnimationFrame(() => {
  const targetRect =
    targetElement.getBoundingClientRect();

    const firstLine =
  targetElement.querySelector(
    '.lyricsOutputLine'
  );

const firstLineRect =
  firstLine
    ? firstLine.getBoundingClientRect()
    : null;

const computedStyle =
  firstLine
    ? window.getComputedStyle(
        firstLine
      )
    : null;

  const canvas =
  targetElement.closest(
    '#lyricsOutputCanvas, ' +
    '#visualizerCanvas, ' +
    '#editorPreviewCanvas, ' +
    '#lyricsPreviewCanvas, ' +
    '#editorCanvas, ' +
    '.editorPreviewCanvas'
  );

  const canvasRect =
    canvas?.getBoundingClientRect();

  console.log(
    '📐 LYRICS GEOMETRY',
    {
      page: document.title,

      position,

      layout,

      target: targetRect,

firstLine: firstLineRect,

font: computedStyle
  ? {
      family:
        computedStyle.fontFamily,

      size:
        computedStyle.fontSize,

      weight:
        computedStyle.fontWeight,

      letterSpacing:
        computedStyle.letterSpacing,

      textAlign:
        computedStyle.textAlign,

      textIndent:
        computedStyle.textIndent
    }
  : null,

canvas: canvasRect
    }
  );
});
  }
};
