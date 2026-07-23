window.NorahFontManager =
  (() => {
    const fs =
      require('fs');

    const path =
      require('path');


    const FONT_LIBRARY_PATH =
      path.join(
        __dirname,
        'assets',
        'fonts',
        'fontLibrary.json'
      );


    let fonts =
      [];


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