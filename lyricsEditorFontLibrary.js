/* ==================================================
   NORAH Studio
   Font Library
================================================== */

window.LyricsEditorFontLibrary =
  (() => {
    const FAVORITES_KEY =
      'norahStudioFontFavorites';

    const RECENT_KEY =
      'norahStudioRecentFonts';

    const MAX_RECENT_FONTS =
      6;




function validateFontLibrary(fonts) {
  const seenIds =
    new Set();

  const duplicateIds =
    new Set();

  const seenValues =
    new Set();

  const duplicateValues =
    new Set();


  function findDuplicateStrings(values) {
    const seen =
      new Set();

    const duplicates =
      new Set();

    values.forEach(value => {
      const normalized =
        String(value || '')
          .trim();

      if (!normalized) {
        return;
      }

      if (seen.has(normalized)) {
        duplicates.add(normalized);
        return;
      }

      seen.add(normalized);
    });

    return [
      ...duplicates
    ];
  }


  fonts.forEach((font, index) => {
    const itemNumber =
      index + 1;

    const id =
      String(font?.id || '')
        .trim();

    const family =
      String(font?.family || '')
        .trim();

    const value =
      String(font?.value || '')
        .trim();

    const label =
      String(font?.label || '')
        .trim();

    const source =
      String(font?.source || '')
        .trim();

    const file =
      typeof font?.file === 'string'
        ? font.file.trim()
        : font?.file;

    const license =
      typeof font?.license === 'string'
        ? font.license.trim()
        : font?.license;

    const bundled =
      font?.bundled;


    /*
     * 基本項目
     */

    if (!id) {
      console.warn(
        `[Font Library] ${itemNumber}件目のidが空です。`,
        font
      );
    } else if (seenIds.has(id)) {
      duplicateIds.add(id);
    } else {
      seenIds.add(id);
    }


    if (!family) {
      console.warn(
        `[Font Library] ${itemNumber}件目のfamilyが空です。`,
        font
      );
    }


    if (!value) {
      console.warn(
        `[Font Library] ${itemNumber}件目のvalueが空です。`,
        font
      );
    } else if (seenValues.has(value)) {
      duplicateValues.add(value);
    } else {
      seenValues.add(value);
    }


    if (!label) {
      console.warn(
        `[Font Library] "${value || id || itemNumber}"のlabelが空です。`,
        font
      );
    }


    if (
      family &&
      value &&
      family !== value
    ) {
      console.warn(
        `[Font Library] "${id || value}"のfamilyとvalueが一致していません。`,
        {
          family,
          value,
          font
        }
      );
    }


    /*
     * categories
     */

    if (!Array.isArray(font.categories)) {
      console.warn(
        `[Font Library] "${id || value || itemNumber}"のcategoriesが配列ではありません。`,
        font
      );
    } else {
      const emptyCategoryIndexes =
        [];

      font.categories.forEach(
        (category, categoryIndex) => {
          if (
            !String(category || '')
              .trim()
          ) {
            emptyCategoryIndexes.push(
              categoryIndex
            );
          }
        }
      );

      if (emptyCategoryIndexes.length > 0) {
        console.warn(
          `[Font Library] "${id || value}"のcategoriesに空文字があります。`,
          emptyCategoryIndexes
        );
      }

      const duplicateCategories =
        findDuplicateStrings(
          font.categories
        );

      if (duplicateCategories.length > 0) {
        console.warn(
          `[Font Library] "${id || value}"のcategories内に重複があります。`,
          duplicateCategories
        );
      }
    }


    /*
     * tags
     */

    if (!Array.isArray(font.tags)) {
      console.warn(
        `[Font Library] "${id || value || itemNumber}"のtagsが配列ではありません。`,
        font
      );
    } else {
      const emptyTagIndexes =
        [];

      font.tags.forEach(
        (tag, tagIndex) => {
          if (
            !String(tag || '')
              .trim()
          ) {
            emptyTagIndexes.push(
              tagIndex
            );
          }
        }
      );

      if (emptyTagIndexes.length > 0) {
        console.warn(
          `[Font Library] "${id || value}"のtagsに空文字があります。`,
          emptyTagIndexes
        );
      }

      const duplicateTags =
        findDuplicateStrings(
          font.tags
        );

      if (duplicateTags.length > 0) {
        console.warn(
          `[Font Library] "${id || value}"のtags内に重複があります。`,
          duplicateTags
        );
      }
    }


    /*
     * source
     */

    const validSources =
  [
    'bundled',
    'google',
    'custom'
  ];

    if (!source) {
      console.warn(
        `[Font Library] "${id || value}"のsourceが空です。`,
        font
      );
    } else if (
      !validSources.includes(source)
    ) {
      console.warn(
        `[Font Library] "${id || value}"のsourceが未対応です。`,
        {
          source,
          validSources,
          font
        }
      );
    }


    /*
     * bundled
     */

    if (typeof bundled !== 'boolean') {
      console.warn(
        `[Font Library] "${id || value}"のbundledがbooleanではありません。`,
        {
          bundled,
          font
        }
      );
    }


    /*
     * bundledフォントの整合性
     */

    if (source === 'bundled') {
      if (bundled !== true) {
        console.warn(
          `[Font Library] "${id || value}"はsourceがbundledですが、bundledがtrueではありません。`,
          font
        );
      }

      if (
        typeof file !== 'string' ||
        !file
      ) {
        console.warn(
          `[Font Library] "${id || value}"はbundledフォントですが、fileが空です。`,
          font
        );
      }

      if (
        typeof license !== 'string' ||
        !license
      ) {
        console.warn(
          `[Font Library] "${id || value}"はbundledフォントですが、licenseが空です。`,
          font
        );
      }
    }


    /*
     * Google Fonts側の整合性
     */

    if (source === 'google') {
      if (bundled !== false) {
        console.warn(
          `[Font Library] "${id || value}"はsourceがgoogleですが、bundledがfalseではありません。`,
          font
        );
      }

      if (
        file !== null &&
        file !== undefined
      ) {
        console.warn(
          `[Font Library] "${id || value}"はGoogle Fontsですが、fileがnullではありません。`,
          {
            file,
            font
          }
        );
      }
    }


    /*
     * sourceとfileの矛盾
     */

    if (
  source !== 'bundled' &&
  source !== 'custom' &&
  typeof file === 'string' &&
  file
) {
      console.warn(
        `[Font Library] "${id || value}"にはローカルfileがありますが、sourceがbundledではありません。`,
        {
          source,
          file,
          font
        }
      );
    }
  });


  if (duplicateIds.size > 0) {
    console.warn(
      '[Font Library] 重複idがあります。',
      [
        ...duplicateIds
      ]
    );
  }


  if (duplicateValues.size > 0) {
    console.warn(
      '[Font Library] 重複valueがあります。',
      [
        ...duplicateValues
      ]
    );
  }
}


let FONT_LIBRARY =
  window.NorahFontManager
    .getAllFonts();


validateFontLibrary(
  FONT_LIBRARY
);


function readStorageArray(
  key
) {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          key
        ) || '[]'
      );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function writeStorageArray(
  key,
  values
) {
  localStorage.setItem(
    key,
    JSON.stringify(values)
  );
}



    function create(options = {}) {

      const currentFontLabel =
  document.getElementById(
    'fontLibraryCurrentFont'
  );

      const getPreviewText =
        options.getPreviewText;

      const getCurrentFont =
        options.getCurrentFont;

      const applyFont =
        options.applyFont;


      const overlay =
        document.getElementById(
          'fontLibraryOverlay'
        );

      const closeButton =
        document.getElementById(
          'fontLibraryCloseButton'
        );

      const searchInput =
        document.getElementById(
          'fontLibrarySearch'
        );

      const favoritesOnlyButton =
        document.getElementById(
          'fontLibraryFavoritesOnly'
        );

      const cardsContainer =
        document.getElementById(
          'fontLibraryCards'
        );

      const favoritesList =
        document.getElementById(
          'fontLibraryFavoritesList'
        );

      const recentList =
        document.getElementById(
          'fontLibraryRecentList'
        );

      const categoryButtons =
        [
          ...document
            .querySelectorAll(
              '[data-font-category]'
            )
        ];


      if (
        !overlay ||
        !cardsContainer
      ) {
        console.warn(
          'Font Library DOMが見つかりません。'
        );

        return null;
      }


      let activeCategory =
        'all';

      let favoritesOnly =
        false;

      let searchQuery =
        '';

      let favorites =
        new Set(
          readStorageArray(
            FAVORITES_KEY
          )
        );

      let recentFonts =
        readStorageArray(
          RECENT_KEY
        );
        /*
 * Font Library内で現在選択しているフォント。
 *
 * getCurrentFont()だけに依存すると、
 * Inspectorや選択ブロックの更新タイミングによって
 * カード選択表示が一瞬遅れる場合があるため、
 * ライブラリ側でも保持する。
 */
let selectedFontValue =
  getCurrentFont?.() ||
  'Noto Sans JP';


      function getSafePreviewText() {
        const text =
          String(
            getPreviewText?.() ||
            ''
          ).trim();

        return (
          text ||
          '観覧車が止まる前に'
        );
      }


      function saveFavorites() {
        writeStorageArray(
          FAVORITES_KEY,
          [...favorites]
        );
      }


      function addRecentFont(
        fontValue
      ) {
        recentFonts =
          [
            fontValue,
            ...recentFonts.filter(
              item =>
                item !== fontValue
            )
          ]
            .slice(
              0,
              MAX_RECENT_FONTS
            );

        writeStorageArray(
          RECENT_KEY,
          recentFonts
        );
      }


      function toggleFavorite(
        fontValue
      ) {
        if (
          favorites.has(
            fontValue
          )
        ) {
          favorites.delete(
            fontValue
          );
        } else {
          favorites.add(
            fontValue
          );
        }

        saveFavorites();
        render();
      }

      async function deleteCustomFont(
  fontData
) {
  if (
  !fontData ||
  (
    fontData.custom !== true &&
    fontData.source !== 'custom'
  )
) {
  return;
}

  const confirmed =
    window.confirm(
      `「${fontData.label}」を削除しますか？\n\nこの操作ではカスタムフォントファイルも削除されます。`
    );

  if (!confirmed) {
    return;
  }

  const removed =
    await window.NorahFontManager
      .removeCustomFont(
        fontData.id
      );

  if (!removed) {
    return;
  }

  favorites.delete(
    fontData.value
  );

  saveFavorites();

  recentFonts =
    recentFonts.filter(
      value =>
        value !== fontData.value
    );

  writeStorageArray(
    RECENT_KEY,
    recentFonts
  );

  if (
    selectedFontValue ===
    fontData.value
  ) {
    selectedFontValue =
      'Noto Sans JP';

    applyFont?.(
      selectedFontValue
    );
  }

}

const SUPPORTED_FONT_EXTENSIONS =
  new Set([
    'ttf',
    'otf',
    'woff',
    'woff2'
  ]);


let fontDragDepth =
  0;


function getDroppedFontFiles(
  dataTransfer
) {
  return [
    ...(
      dataTransfer?.files ||
      []
    )
  ].filter(
    file => {
      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase();

      return (
        extension &&
        SUPPORTED_FONT_EXTENSIONS
          .has(extension)
      );
    }
  );
}


overlay.addEventListener(
  'dragenter',
  event => {
    event.preventDefault();
    event.stopPropagation();

    fontDragDepth += 1;

    overlay.classList.add(
      'is-font-dragging'
    );
  }
);


overlay.addEventListener(
  'dragover',
  event => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect =
        'copy';
    }
  }
);


overlay.addEventListener(
  'dragleave',
  event => {
    event.preventDefault();
    event.stopPropagation();

    fontDragDepth =
      Math.max(
        0,
        fontDragDepth - 1
      );

    if (fontDragDepth === 0) {
      overlay.classList.remove(
        'is-font-dragging'
      );
    }
  }
);


overlay.addEventListener(
  'drop',
  async event => {
    event.preventDefault();
    event.stopPropagation();

    fontDragDepth = 0;

    overlay.classList.remove(
      'is-font-dragging'
    );

    const fontFiles =
      getDroppedFontFiles(
        event.dataTransfer
      );

    if (!fontFiles.length) {
      window.alert(
        '対応しているフォントファイルをドロップしてください。\n\n.ttf / .otf / .woff / .woff2'
      );

      return;
    }

    let successCount = 0;
let failedCount = 0;

for (
  const fontFile of fontFiles
) {
  const filePath =
    window.NorahFontManager
      .getDroppedFilePath(
        fontFile
      );

  if (!filePath) {
    console.warn(
      '[Font Library] ファイルパスを取得できません。',
      fontFile.name
    );

    failedCount += 1;
    continue;
  }

  const imported =
    await window
      .NorahFontManager
      .importCustomFont(
        filePath
      );

  if (imported) {
    successCount += 1;
  } else {
    failedCount += 1;
  }
}

if (
  successCount > 0 &&
  failedCount === 0
) {
  window.alert(
    `${successCount}件のフォントを追加しました。`
  );
} else if (
  successCount > 0 &&
  failedCount > 0
) {
  window.alert(
    `${successCount}件を追加しました。\n${failedCount}件は追加できませんでした。`
  );
} else {
  window.alert(
    'フォントを追加できませんでした。'
  );
}
  }
);



function updateSelectedFontCards() {
  const fontCards =
    cardsContainer.querySelectorAll(
      '[data-font-value]'
    );

  fontCards.forEach(
    card => {
      const isSelected =
        card.dataset.fontValue ===
        selectedFontValue;

      card.classList.toggle(
        'is-selected',
        isSelected
      );

      card.setAttribute(
        'aria-selected',
        String(isSelected)
      );
    }
  );

  if (currentFontLabel) {
    const selectedFont =
      FONT_LIBRARY.find(
        font =>
          font.value ===
          selectedFontValue
      );

    currentFontLabel.textContent =
      selectedFont?.label ||
      selectedFontValue;
  }
}


      function applySelectedFont(
  fontValue,
  {
    closeAfter = false
  } = {}
) {
  if (!fontValue) {
    return;
  }

  selectedFontValue =
    fontValue;

  applyFont?.(
    fontValue
  );

  addRecentFont(
    fontValue
  );

  updateSelectedFontCards();

  if (closeAfter) {
    close();
  }
}


      function createSideListItem(
        fontValue
      ) {
        const fontData =
          FONT_LIBRARY.find(
            font =>
              font.value ===
              fontValue
          );

        if (!fontData) {
          return null;
        }


        const button =
          document.createElement(
            'button'
          );

        button.type =
          'button';

        button.className =
          'fontLibrarySideItem';

          button.classList.toggle(
  'is-selected',
  selectedFontValue ===
    fontData.value
);

        button.textContent =
          fontData.label;

        button.style.fontFamily =
          `"${fontData.value}", sans-serif`;


        button.addEventListener(
          'click',
          () => {
            applySelectedFont(
              fontData.value
            );
          }
        );


        return button;
      }


      function renderSideLists() {
        if (favoritesList) {
          favoritesList.innerHTML =
            '';

          [...favorites]
            .forEach(
              fontValue => {
                const item =
                  createSideListItem(
                    fontValue
                  );

                if (item) {
                  favoritesList
                    .appendChild(
                      item
                    );
                }
              }
            );

          favoritesList
            .classList.toggle(
              'is-empty',
              favorites.size === 0
            );
        }


        if (recentList) {
          recentList.innerHTML =
            '';

          recentFonts.forEach(
            fontValue => {
              const item =
                createSideListItem(
                  fontValue
                );

              if (item) {
                recentList
                  .appendChild(
                    item
                  );
              }
            }
          );

          recentList.classList.toggle(
            'is-empty',
            recentFonts.length === 0
          );
        }
      }


      function getFilteredFonts() {
  let filteredFonts =
    window.NorahFontManager
      .getFontsByCategory(
        activeCategory
      );


  if (searchQuery) {
    const searchResults =
      window.NorahFontManager
        .searchFonts(
          searchQuery
        );

    const searchResultIds =
      new Set(
        searchResults.map(
          font =>
            font.id
        )
      );

    filteredFonts =
      filteredFonts.filter(
        font =>
          searchResultIds.has(
            font.id
          )
      );
  }


  if (favoritesOnly) {
    filteredFonts =
      filteredFonts.filter(
        font =>
          favorites.has(
            font.value
          )
      );
  }


  return filteredFonts;
}


      function createFontCard(
        fontData
      ) {
        const card =
          document.createElement(
            'article'
          );

        card.className =
          'fontLibraryCard';


        card.dataset.fontValue =
          fontData.value;


        if (
  selectedFontValue ===
  fontData.value
) {
  card.classList.add(
    'is-selected'
  );

  card.setAttribute(
    'aria-selected',
    'true'
  );
} else {
  card.setAttribute(
    'aria-selected',
    'false'
  );
}


        const header =
          document.createElement(
            'div'
          );

        header.className =
          'fontLibraryCardHeader';


        const name =
          document.createElement(
            'div'
          );

        name.className =
          'fontLibraryCardName';

        name.textContent =
          fontData.label;


        const favoriteButton =
          document.createElement(
            'button'
          );

          card.dataset.fontValue =
  fontData.value;

        favoriteButton.type =
          'button';

        favoriteButton.className =
          'fontLibraryFavoriteButton';

        favoriteButton.classList.toggle(
          'is-favorite',
          favorites.has(
            fontData.value
          )
        );

        favoriteButton.textContent =
          favorites.has(
            fontData.value
          )
            ? '♥'
            : '♡';

        favoriteButton.setAttribute(
          'aria-label',
          'お気に入り'
        );


        favoriteButton.addEventListener(
          'click',
          event => {
            event.stopPropagation();

            toggleFavorite(
              fontData.value
            );
          }
        );


        let deleteButton =
  null;

if (
  fontData.custom === true ||
  fontData.source === 'custom'
) {
  deleteButton =
    document.createElement(
      'button'
    );

  deleteButton.type =
    'button';

  deleteButton.className =
    'fontLibraryDeleteButton';

  deleteButton.textContent =
    '🗑';

  deleteButton.setAttribute(
    'aria-label',
    `${fontData.label}を削除`
  );

  deleteButton.title =
    'カスタムフォントを削除';

  deleteButton.addEventListener(
    'click',
    async event => {
      event.stopPropagation();

      await deleteCustomFont(
        fontData
      );
    }
  );
}


      const selectedMark =
  document.createElement(
    'span'
  );

selectedMark.className =
  'fontLibrarySelectedMark';

selectedMark.textContent =
  '✓';

selectedMark.setAttribute(
  'aria-hidden',
  'true'
);



header.append(
  name,
  selectedMark,
  favoriteButton
);

if (deleteButton) {
  header.appendChild(
    deleteButton
  );
}


        const preview =
          document.createElement(
            'div'
          );

        preview.className =
          'fontLibraryCardPreview';

        preview.style.fontFamily =
          `"${fontData.value}", sans-serif`;


        const japaneseLine =
          document.createElement(
            'div'
          );

        japaneseLine.className =
          'fontLibraryPreviewJapanese';

        japaneseLine.textContent =
          getSafePreviewText();


        const englishLine =
          document.createElement(
            'div'
          );

        englishLine.className =
          'fontLibraryPreviewEnglish';

        englishLine.textContent =
          'NORAH STUDIO';


        preview.append(
          japaneseLine,
          englishLine
        );


        const tags =
          document.createElement(
            'div'
          );

        tags.className =
          'fontLibraryCardTags';


        fontData.tags.forEach(
          tagText => {
            const tag =
              document.createElement(
                'span'
              );

            tag.textContent =
              tagText;

            tags.appendChild(
              tag
            );
          }
        );


        card.append(
          header,
          preview,
          tags
        );


        /*
 * シングルクリックとダブルクリックを区別する。
 *
 * 通常のdblclickイベントでは、
 * clickが先に2回発生してしまうため、
 * 少しだけ待って判定する。
 */
let clickTimer =
  null;


card.addEventListener(
  'click',
  event => {
    /*
     * お気に入りボタンからの操作は
     * カード選択として扱わない。
     */
    if (
  event.target.closest(
    '.fontLibraryFavoriteButton, .fontLibraryDeleteButton'
  )
) {
  return;
}

    if (clickTimer) {
      clearTimeout(
        clickTimer
      );

      clickTimer =
        null;

      return;
    }

    clickTimer =
      setTimeout(
        () => {
          applySelectedFont(
            fontData.value
          );

          clickTimer =
            null;
        },
        220
      );
  }
);


card.addEventListener(
  'dblclick',
  event => {
    if (
  event.target.closest(
  '.fontLibraryFavoriteButton, .fontLibraryDeleteButton'
)||
  event.target.closest(
    '.fontLibraryDeleteButton'
  )
) {
  return;
}

    if (clickTimer) {
      clearTimeout(
        clickTimer
      );

      clickTimer =
        null;
    }

    applySelectedFont(
      fontData.value,
      {
        closeAfter: true
      }
    );
  }
);


        return card;
      }


      function renderCards() {
        cardsContainer.innerHTML =
          '';


        const fonts =
          getFilteredFonts();


        if (!fonts.length) {
          const empty =
            document.createElement(
              'div'
            );

          empty.className =
            'fontLibraryEmpty';

          empty.textContent =
            '該当するフォントがありません。';

          cardsContainer.appendChild(
            empty
          );

          return;
        }


        fonts.forEach(
          fontData => {
            cardsContainer.appendChild(
              createFontCard(
                fontData
              )
            );
          }
        );
      }


      function renderCategoryState() {
        categoryButtons.forEach(
          button => {
            button.classList.toggle(
              'is-active',
              button.dataset
                .fontCategory ===
                activeCategory
            );
          }
        );


        favoritesOnlyButton
          ?.classList.toggle(
            'is-active',
            favoritesOnly
          );
      }


      function render() {
  renderCategoryState();
  renderSideLists();
  renderCards();

  if (currentFontLabel) {
  currentFontLabel.textContent =
    selectedFontValue ||
    getCurrentFont?.() ||
    'Noto Sans JP';

  currentFontLabel.style.fontFamily =
    `"${selectedFontValue}", sans-serif`;
}
}


      function open() {
  /*
   * Drawerを開くたびに、
   * 現在選択中ブロックのフォントを再取得する。
   */
  selectedFontValue =
    getCurrentFont?.() ||
    selectedFontValue ||
    'Noto Sans JP';

  overlay.classList.remove(
    'is-hidden'
  );

  overlay.setAttribute(
    'aria-hidden',
    'false'
  );

  searchInput?.focus();

  render();
}


      function close() {
  overlay.classList.add(
    'is-hidden'
  );

  overlay.setAttribute(
    'aria-hidden',
    'true'
  );

  document.body.classList.remove(
    'font-library-open'
  );
}


      searchInput?.addEventListener(
        'input',
        () => {
          searchQuery =
            searchInput.value
              .trim()
              .toLowerCase();

          renderCards();
        }
      );


      favoritesOnlyButton
        ?.addEventListener(
          'click',
          () => {
            favoritesOnly =
              !favoritesOnly;

            render();
          }
        );


      categoryButtons.forEach(
        button => {
          button.addEventListener(
            'click',
            () => {
              activeCategory =
                button.dataset
                  .fontCategory ||
                'all';

              render();
            }
          );
        }
      );


      closeButton?.addEventListener(
        'click',
        close
      );

      window.addEventListener(
  'norah-fonts-reloaded',
  event => {
    const receivedFonts =
      event.detail?.fonts;

    FONT_LIBRARY =
      Array.isArray(receivedFonts)
        ? [
            ...receivedFonts
          ]
        : window.NorahFontManager
            .getAllFonts();

    validateFontLibrary(
      FONT_LIBRARY
    );

    render();
  }
);



      document.addEventListener(
        'keydown',
        event => {
          if (
            event.key ===
              'Escape' &&
            !overlay.classList
              .contains(
                'is-hidden'
              )
          ) {
            close();
          }
        }
      );



      window.addEventListener(
  'norah-fonts-reloaded',
  () => {
    console.log(
      '[Font Library] フォント一覧を更新します。'
    );

    FONT_LIBRARY =
      window.NorahFontManager
        ?.getAllFonts?.() || [];

    validateFontLibrary(
      FONT_LIBRARY
    );

    /*
     * 削除済みフォントを
     * お気に入りから取り除く。
     */
    const availableFontValues =
      new Set(
        FONT_LIBRARY.map(
          fontData =>
            fontData.value
        )
      );

    [...favorites].forEach(
      fontValue => {
        if (
          !availableFontValues.has(
            fontValue
          )
        ) {
          favorites.delete(
            fontValue
          );
        }
      }
    );

    saveFavorites();

    /*
     * 削除済みフォントを
     * 最近使用したフォントから取り除く。
     */
    recentFonts =
      recentFonts.filter(
        fontValue =>
          availableFontValues.has(
            fontValue
          )
      );

    writeStorageArray(
      RECENT_KEY,
      recentFonts
    );

    /*
     * 現在選択中のフォントが
     * 削除されていた場合の退避処理。
     */
    if (
      selectedFontValue &&
      !availableFontValues.has(
        selectedFontValue
      )
    ) {
      selectedFontValue =
        availableFontValues.has(
          'Noto Sans JP'
        )
          ? 'Noto Sans JP'
          : FONT_LIBRARY[0]?.value ||
            '';

      if (selectedFontValue) {
        applyFont?.(
          selectedFontValue
        );
      }
    }

    render();
  }
);


      return {
        open,
        close,
        render
      };
    }


    return {
  create,

  get fonts() {
    return [
      ...FONT_LIBRARY
    ];
  }
};
  })();