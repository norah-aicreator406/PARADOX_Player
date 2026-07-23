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


    /*
 * ElectronのNode機能を使って、
 * ローカルJSONからフォント一覧を同期読込する。
 *
 * 同期読込にする理由：
 * Font Libraryの初期化処理を
 * 非同期化せず、既存UIを維持するため。
 */
const fs =
  require('fs');

const path =
  require('path');


function loadFontLibraryData() {
  const jsonPath =
    path.join(
      __dirname,
      'assets',
      'fonts',
      'fontLibrary.json'
    );

  try {
    const jsonText =
      fs.readFileSync(
        jsonPath,
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

    return parsed;
  } catch (error) {
    console.error(
      '[Font Library] JSONの読込に失敗しました。',
      error
    );

    return [];
  }
}


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
        'google'
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


const FONT_LIBRARY =
  loadFontLibraryData();


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


      function applySelectedFont(
  fontValue,
  {
    closeAfter = false
  } = {}
) {
  if (!fontValue) {
    return;
  }

  /*
   * 先に選択状態を更新する。
   * これによりカードの枠が即座に切り替わる。
   */
  selectedFontValue =
    fontValue;

  /*
   * lyricsEditor.js側へ反映。
   *
   * ここでInspectorのfontInput、
   * 選択中ブロック、
   * Editor Preview、
   * Visualizerが更新される想定。
   */
  applyFont?.(
    fontValue
  );

  addRecentFont(
    fontValue
  );

  render();

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
        return FONT_LIBRARY.filter(
          font => {
            if (
              favoritesOnly &&
              !favorites.has(
                font.value
              )
            ) {
              return false;
            }


            if (
              activeCategory !==
                'all' &&
              !font.categories.includes(
                activeCategory
              )
            ) {
              return false;
            }


            if (searchQuery) {
              const searchableText =
                [
                  font.label,
                  ...font.tags,
                  ...font.categories
                ]
                  .join(' ')
                  .toLowerCase();


              if (
                !searchableText.includes(
                  searchQuery
                )
              ) {
                return false;
              }
            }


            return true;
          }
        );
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
        '.fontLibraryFavoriteButton'
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
        '.fontLibraryFavoriteButton'
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


      return {
        open,
        close,
        render
      };
    }


    return {
      create,
      fonts:
        FONT_LIBRARY
    };
  })();