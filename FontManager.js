window.NorahFontManager =
  (() => {
    const fs =
      require('fs');

    const path =
      require('path');

    const {
      pathToFileURL
    } = require('url');


    const FONT_ROOT_PATH =
      path.join(
        __dirname,
        'assets',
        'fonts'
      );


    const FONT_LIBRARY_PATH =
      path.join(
        FONT_ROOT_PATH,
        'fontLibrary.json'
      );


    const CUSTOM_FONT_DIRECTORY =
      path.join(
        FONT_ROOT_PATH,
        'custom'
      );


    const SUPPORTED_FONT_EXTENSIONS =
      new Set([
        '.ttf',
        '.otf',
        '.woff',
        '.woff2'
      ]);


    let fonts =
      [];


    function escapeCssString(value) {
      return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
    }


    function ensureCustomFontDirectory() {
      if (
        fs.existsSync(
          CUSTOM_FONT_DIRECTORY
        )
      ) {
        return;
      }

      fs.mkdirSync(
        CUSTOM_FONT_DIRECTORY,
        {
          recursive: true
        }
      );

      console.log(
        '[FontManager] customフォルダを作成しました。',
        CUSTOM_FONT_DIRECTORY
      );
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
              path.dirname(
                FONT_LIBRARY_PATH
              ),
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


    function createFontId(value) {
      const normalizedValue =
        String(value || '')
          .trim()
          .toLowerCase()
          .replace(/[_\s]+/g, '-')
          .replace(
            /[^\p{L}\p{N}-]+/gu,
            ''
          )
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

      return (
        normalizedValue ||
        `font-${Date.now()}`
      );
    }


    function createFamilyFromFileName(
      filePath
    ) {
      const extension =
        path.extname(
          filePath
        );

      let family =
        path.basename(
          filePath,
          extension
        );

      /*
       * 一般的なウェイト・スタイル名を
       * ファミリー名の末尾から除去します。
       *
       * 例：
       * MyFont-Regular.ttf
       * ↓
       * MyFont
       */
      family =
        family.replace(
          /[-_ ](thin|extralight|extra-light|ultralight|light|regular|medium|semibold|semi-bold|demibold|bold|extrabold|extra-bold|black|heavy|italic|oblique)$/i,
          ''
        );

      family =
        family
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      return (
        family ||
        'Custom Font'
      );
    }


    function findFontFilesRecursively(
  directoryPath
) {
  if (
    !fs.existsSync(
      directoryPath
    )
  ) {
    return [];
  }

  const entries =
    fs.readdirSync(
      directoryPath,
      {
        withFileTypes: true
      }
    );

  const foundFiles =
    [];

  entries.forEach(entry => {
    const entryPath =
      path.join(
        directoryPath,
        entry.name
      );

    try {
      /*
       * entry.isFile()だけに頼らず、
       * リンク先を含めて実体を確認する。
       */
      const stats =
        fs.statSync(
          entryPath
        );

      if (stats.isDirectory()) {
        foundFiles.push(
          ...findFontFilesRecursively(
            entryPath
          )
        );

        return;
      }

      if (!stats.isFile()) {
        console.warn(
          '[FontManager] ファイルとして認識されなかったため除外:',
          entryPath
        );

        return;
      }

      const extension =
        path.extname(
          entry.name
        )
          .trim()
          .toLowerCase();

      if (
        !SUPPORTED_FONT_EXTENSIONS.has(
          extension
        )
      ) {
        console.warn(
          '[FontManager] 非対応の拡張子:',
          entry.name,
          extension
        );

        return;
      }

      foundFiles.push(
        entryPath
      );
    } catch (error) {
      console.warn(
        '[FontManager] ファイル確認に失敗:',
        entryPath,
        error
      );
    }
  });

  return foundFiles;
}


    function createCustomFontData(
      filePath
    ) {
      const family =
        createFamilyFromFileName(
          filePath
        );

      return {
        id:
          `custom-${createFontId(family)}`,

        family:
          family,

        value:
          family,

        label:
          family,

        categories: [
          'custom'
        ],

        tags: [
          'カスタム',
          'ユーザー追加'
        ],

        source:
          'custom',

        bundled:
          false,

        custom:
          true,

        file:
          filePath,

        weight:
          400,

        style:
          'normal'
      };
    }


    function loadCustomFonts() {

  ensureCustomFontDirectory();

  console.log(
    '[DEBUG] custom dir:',
    CUSTOM_FONT_DIRECTORY
  );

  const customFontFiles =
    findFontFilesRecursively(
      CUSTOM_FONT_DIRECTORY
    );

  console.log(
    '[DEBUG] found files:',
    customFontFiles
  );

  const customFonts =
    customFontFiles.map(
      createCustomFontData
    );

  console.log(
    '[DEBUG] custom fonts:',
    customFonts
  );

  console.log(
    `[FontManager] カスタムフォントを${customFonts.length}件検出しました。`
  );

  return customFonts;
}


    function mergeFonts(
      bundledFonts,
      customFonts
    ) {
      const mergedFonts =
        [
          ...bundledFonts
        ];

      const registeredFamilies =
        new Set(
          bundledFonts.map(font =>
            String(
              font.family || ''
            )
              .trim()
              .toLowerCase()
          )
        );


      customFonts.forEach(font => {
        const normalizedFamily =
          String(
            font.family || ''
          )
            .trim()
            .toLowerCase();

        if (!normalizedFamily) {
          return;
        }

        if (
          registeredFamilies.has(
            normalizedFamily
          )
        ) {
          console.warn(
            `[FontManager] 同じfamily名が存在するため、カスタムフォントを除外しました: ${font.family}`
          );

          return;
        }

        registeredFamilies.add(
          normalizedFamily
        );

        mergedFonts.push(
          font
        );
      });

      return mergedFonts;
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
        ensureCustomFontDirectory();

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


        const bundledFonts =
          parsed;

        const customFonts =
          loadCustomFonts();


        fonts =
          mergeFonts(
            bundledFonts,
            customFonts
          );


        registerFonts();


        console.log(
          `[FontManager] 合計${fonts.length}件のフォントを読み込みました。`
        );

        console.log(
          `[FontManager] bundled: ${bundledFonts.length}件 / custom: ${customFonts.length}件`
        );

        return fonts;
      } catch (error) {
        fonts =
          [];

        console.error(
          '[FontManager] フォントの読み込みに失敗しました。',
          error
        );

        return fonts;
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


    function getCustomFontDirectory() {
      return CUSTOM_FONT_DIRECTORY;
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
      getCustomFontDirectory,
      reload
    };
  })();