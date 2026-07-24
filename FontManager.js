window.NorahFontManager =
  (() => {


    const path =
      require('path');

    const {
      pathToFileURL
    } = require('url');

    const {
  ipcRenderer
} = require('electron');


    const FONT_ROOT_PATH =
      path.join(
        __dirname,
        'assets',
        'fonts'
      );



    let fonts =
      [];


    function escapeCssString(value) {
      return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
    }



    function getFontFileUrl(filePath) {
      const normalizedPath =
        String(filePath || '')
          .trim();

      if (!normalizedPath) {
        return '';
      }

      const absolutePath =
        path.isAbsolute(
          normalizedPath
        )
          ? normalizedPath
          : path.resolve(
    FONT_ROOT_PATH,
    normalizedPath
);

      return pathToFileURL(
        absolutePath
      ).href;
    }


    function getFontFormat(filePath) {
      const extension =
        path.extname(
          String(filePath || '')
        )
          .toLowerCase();

      if (extension === '.woff2') {
        return 'woff2';
      }

      if (extension === '.woff') {
        return 'woff';
      }

      if (extension === '.otf') {
        return 'opentype';
      }

      return 'truetype';
    }
    


    function createFontFaceCss(font) {
      if (
        !font ||
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


    function registerFonts() {
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
    const receivedFonts =
      ipcRenderer.sendSync(
        'font:getAllSync'
      );

    if (!Array.isArray(receivedFonts)) {
      throw new Error(
        'Main Processから受信したフォント一覧が配列ではありません。'
      );
    }

    fonts =
      [
        ...receivedFonts
      ];

    registerFonts();

    console.log(
      `[FontManager] 合計${fonts.length}件のフォントを読み込みました。`
    );

    return [
      ...fonts
    ];
  } catch (error) {
    fonts =
      [];

    console.error(
      '[FontManager] フォントの読み込みに失敗しました。',
      error
    );

    return [];
  }
}


    function getAllFonts() {
      return [
        ...fonts
      ];
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
            font.family ===
            normalizedFamily
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
            font.value ===
            normalizedValue
        ) ||
        null
      );
    }


    function getFontsByCategory(
      category
    ) {
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
        if (
          !Array.isArray(
            font.categories
          )
        ) {
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

            ...(Array.isArray(
              font.categories
            )
              ? font.categories
              : []),

            ...(Array.isArray(
              font.tags
            )
              ? font.tags
              : [])
          ];

        return searchableValues.some(
          item =>
            String(item || '')
              .toLowerCase()
              .includes(
                normalizedQuery
              )
        );
      });
    }


    function getBundledFonts() {
      return fonts.filter(
        font =>
          font.bundled === true
      );
    }


    function getCustomFonts() {
      return fonts.filter(
        font =>
          font.custom === true ||
          font.source === 'custom'
      );
    }


    function getFontsBySource(source) {
      const normalizedSource =
        String(source || '')
          .trim();

      return fonts.filter(
        font =>
          font.source ===
          normalizedSource
      );
    }



    function reload() {
  const reloadedFonts =
    load();

  window.dispatchEvent(
    new CustomEvent(
      'norah-fonts-reloaded',
      {
        detail: {
          fonts: [
            ...reloadedFonts
          ]
        }
      }
    )
  );

  return reloadedFonts;
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
      getCustomFonts,
      getFontsBySource,
      reload
    };
  })();