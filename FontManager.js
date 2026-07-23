window.NorahFontManager =
  (() => {
    const fs =
      require('fs');

    const path =
      require('path');

    
    const {
  pathToFileURL
} = require('url');


    const FONT_LIBRARY_PATH =
      path.join(
        __dirname,
        'assets',
        'fonts',
        'fontLibrary.json'
      );


    let fonts =
      [];



    function escapeCssString(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}


function getFontFileUrl(filePath) {
  const absolutePath =
    path.resolve(
      path.dirname(FONT_LIBRARY_PATH),
      filePath
    );

  return pathToFileURL(
    absolutePath
  ).href;
}


function getFontFormat(filePath) {
  const normalizedPath =
    String(filePath || '')
      .trim()
      .toLowerCase();

  if (normalizedPath.endsWith('.woff2')) {
    return 'woff2';
  }

  if (normalizedPath.endsWith('.woff')) {
    return 'woff';
  }

  if (normalizedPath.endsWith('.otf')) {
    return 'opentype';
  }

  return 'truetype';
}


function createFontFaceCss(font) {
  if (
    !font ||
    font.bundled !== true ||
    !font.family ||
    !font.file
  ) {
    return '';
  }

  const family =
    escapeCssString(
      font.family
    );

  const fileUrl =
    escapeCssString(
      getFontFileUrl(
        font.file
      )
    );

  const format =
    getFontFormat(
      font.file
    );

  const weight =
    font.weight || 400;

  const style =
    font.style || 'normal';

  return `
@font-face {
  font-family: '${family}';
  src: url('${fileUrl}') format('${format}');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}
`;
}


function registerBundledFonts() {
  const styleId =
    'norah-font-manager-styles';

  const oldStyle =
    document.getElementById(
      styleId
    );

  if (oldStyle) {
    oldStyle.remove();
  }


  const cssText =
    fonts
      .map(
        createFontFaceCss
      )
      .filter(Boolean)
      .join('\n');


  if (!cssText) {
    return;
  }


  const styleElement =
    document.createElement(
      'style'
    );

  styleElement.id =
    styleId;

  styleElement.textContent =
    cssText;

  document.head.appendChild(
    styleElement
  );
}


    function load() {
      try {
        const jsonText =
          fs.readFileSync(
            FONT_LIBRARY_PATH,
            'utf8'
          );

        const parsed =
          JSON.parse(
            jsonText
          );

        if (!Array.isArray(parsed)) {
          throw new Error(
            'fontLibrary.jsonのルートは配列である必要があります。'
          );
        }

        fonts =
          parsed;

        registerBundledFonts();

        console.log(
          `[FontManager] ${fonts.length}件のフォントを読み込みました。`
        );

        return fonts;
      } catch (error) {
        fonts =
          [];

        console.error(
          '[FontManager] fontLibrary.jsonの読み込みに失敗しました。',
          error
        );

        return fonts;
      }
    }


    function getAllFonts() {
      return fonts;
    }


    function getFontById(id) {
      const normalizedId =
        String(id || '')
          .trim();

      if (!normalizedId) {
        return null;
      }

      return (
        fonts.find(
          font =>
            font.id === normalizedId
        ) ||
        null
      );
    }


    function getFontByFamily(family) {
      const normalizedFamily =
        String(family || '')
          .trim();

      if (!normalizedFamily) {
        return null;
      }

      return (
        fonts.find(
          font =>
            font.family === normalizedFamily
        ) ||
        null
      );
    }

    function getFontByValue(value) {
  const normalizedValue =
    String(value || '')
      .trim();

  if (!normalizedValue) {
    return null;
  }

  return (
    fonts.find(
      font =>
        font.value === normalizedValue
    ) ||
    null
  );
}


function getFontsByCategory(category) {
  const normalizedCategory =
    String(category || '')
      .trim()
      .toLowerCase();

  if (
    !normalizedCategory ||
    normalizedCategory === 'all'
  ) {
    return [
      ...fonts
    ];
  }

  return fonts.filter(font => {
    if (!Array.isArray(font.categories)) {
      return false;
    }

    return font.categories.some(
      item =>
        String(item || '')
          .trim()
          .toLowerCase() ===
        normalizedCategory
    );
  });
}


function searchFonts(query) {
  const normalizedQuery =
    String(query || '')
      .trim()
      .toLowerCase();

  if (!normalizedQuery) {
    return [
      ...fonts
    ];
  }

  return fonts.filter(font => {
    const searchableValues =
      [
        font.id,
        font.family,
        font.value,
        font.label,
        ...(Array.isArray(font.categories)
          ? font.categories
          : []),
        ...(Array.isArray(font.tags)
          ? font.tags
          : [])
      ];

    return searchableValues.some(
      item =>
        String(item || '')
          .toLowerCase()
          .includes(normalizedQuery)
    );
  });
}


    function getBundledFonts() {
      return fonts.filter(
        font =>
          font.bundled === true
      );
    }


    function getFontsBySource(source) {
      const normalizedSource =
        String(source || '')
          .trim();

      return fonts.filter(
        font =>
          font.source === normalizedSource
      );
    }


    function reload() {
      return load();
    }


    load();


    return {
  getAllFonts,
  getFontById,
  getFontByFamily,
  getFontByValue,
  getFontsByCategory,
  searchFonts,
  getBundledFonts,
  getFontsBySource,
  reload
   };
  })();