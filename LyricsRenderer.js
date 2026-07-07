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
    const position = payload.position || { x: 0, y: 0, z: 0 };

    targetElement.innerHTML = '';
    targetElement.style.opacity = '1';

    targetElement.style.position = 'absolute';
    targetElement.style.left = '50%';
    targetElement.style.top = '50%';

    targetElement.style.transform =
      `translate(-50%, -50%) translate(${Number(position.x) || 0}px, ${Number(position.y) || 0}px)`;

    targetElement.style.fontFamily = `"${style.font || 'Arial'}", sans-serif`;
    targetElement.style.fontSize = `${Number(style.size) || 72}px`;
    targetElement.style.color = style.color || '#ffffff';
    targetElement.style.textAlign = style.align || 'center';
    targetElement.style.letterSpacing = `${Number(style.letterSpacing) || 0}px`;
    targetElement.style.lineHeight = String(style.lineHeight || 1.2);
    

    targetElement.style.webkitTextStroke =
      `${Number(style.outlineWidth) || 0}px ${style.outlineColor || '#000000'}`;

    targetElement.style.textShadow =
      `${Number(style.shadowX) || 0}px ${Number(style.shadowY) || 0}px ${Number(style.shadowBlur) || 0}px ${style.shadowColor || '#000000'}`;

    lines.forEach(line => {
      const div = document.createElement('div');
      div.className = 'lyricsLine';
      div.textContent = line;
      targetElement.appendChild(div);
    });
  }
};