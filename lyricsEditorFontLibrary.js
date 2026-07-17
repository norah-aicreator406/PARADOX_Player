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


    const FONT_LIBRARY = [
      
        {
  value:
    'Noto Serif JP',

  label:
    'Noto Serif JP',

  categories: [
    'all',
    'japanese',
    'mincho',
    'classic'
  ],

  tags: [
    '日本語',
    '明朝',
    '上品'
  ]
},

{
  value:
    'Zen Maru Gothic',

  label:
    'Zen Maru Gothic',

  categories: [
    'all',
    'japanese',
    'rounded',
    'cute'
  ],

  tags: [
    '日本語',
    '丸文字',
    'やわらかい'
  ]
},

{
  value:
    'Zen Old Mincho',

  label:
    'Zen Old Mincho',

  categories: [
    'all',
    'japanese',
    'mincho',
    'classic'
  ],

  tags: [
    '日本語',
    '明朝',
    '和風'
  ]
},

{
  value:
    'M PLUS Rounded 1c',

  label:
    'M PLUS Rounded 1c',

  categories: [
    'all',
    'japanese',
    'rounded',
    'modern'
  ],

  tags: [
    '日本語',
    '丸文字',
    'ポップ'
  ]
},

{
  value:
    'Kaisei Decol',

  label:
    'Kaisei Decol',

  categories: [
    'all',
    'japanese',
    'design',
    'classic'
  ],

  tags: [
    '日本語',
    '装飾',
    '個性的'
  ]
},

{
  value:
    'Shippori Mincho',

  label:
    'Shippori Mincho',

  categories: [
    'all',
    'japanese',
    'mincho',
    'classic'
  ],

  tags: [
    '日本語',
    '明朝',
    '映画的'
  ]
},

{
  value:
    'Reggae One',

  label:
    'Reggae One',

  categories: [
    'all',
    'japanese',
    'design',
    'bold'
  ],

  tags: [
    '日本語',
    '個性的',
    '力強い'
  ]
},

{
  value:
    'RocknRoll One',

  label:
    'RocknRoll One',

  categories: [
    'all',
    'japanese',
    'design',
    'bold'
  ],

  tags: [
    '日本語',
    'ロック',
    'ポップ'
  ]
},

{
  value:
    'Bebas Neue',

  label:
    'Bebas Neue',

  categories: [
    'all',
    'english',
    'bold',
    'modern'
  ],

  tags: [
    '英語',
    '縦長',
    'タイトル'
  ]
},

{
  value:
    'Playfair Display',

  label:
    'Playfair Display',

  categories: [
    'all',
    'english',
    'serif',
    'classic'
  ],

  tags: [
    '英語',
    'セリフ',
    '上品'
  ]
},

/* ================================
   Japanese Gothic
================================ */

{
  value:
    'Noto Sans JP',

  label:
    'Noto Sans JP',

  categories: [
    'all',
    'japanese',
    'gothic',
    'modern'
  ],

  tags: [
    '日本語',
    'ゴシック',
    '標準'
  ]
},

{
  value:
    'Zen Kaku Gothic New',

  label:
    'Zen Kaku Gothic New',

  categories: [
    'all',
    'japanese',
    'gothic',
    'modern'
  ],

  tags: [
    '日本語',
    'ゴシック',
    'すっきり'
  ]
},

{
  value:
    'Dela Gothic One',

  label:
    'Dela Gothic One',

  categories: [
    'all',
    'japanese',
    'gothic',
    'bold',
    'design'
  ],

  tags: [
    '日本語',
    '極太',
    'インパクト'
  ]
},

/* ================================
   Dot / Pixel
================================ */

{
  value:
    'DotGothic16',

  label:
    'DotGothic16',

  categories: [
    'all',
    'japanese',
    'dot',
    'design'
  ],

  tags: [
    '日本語',
    'ドット',
    'レトロ'
  ]
},

{
  value:
    'Pixelify Sans',

  label:
    'Pixelify Sans',

  categories: [
    'all',
    'english',
    'dot',
    'design'
  ],

  tags: [
    '英語',
    'ピクセル',
    'ゲーム'
  ]
},

/* ================================
   Handwriting
================================ */

{
  value:
    'Yomogi',

  label:
    'Yomogi',

  categories: [
    'all',
    'japanese',
    'handwriting',
    'cute'
  ],

  tags: [
    '日本語',
    '手書き',
    'やさしい'
  ]
},

{
  value:
    'Klee One',

  label:
    'Klee One',

  categories: [
    'all',
    'japanese',
    'handwriting',
    'classic'
  ],

  tags: [
    '日本語',
    '手書き',
    '繊細'
  ]
},

{
  value:
    'Hachi Maru Pop',

  label:
    'Hachi Maru Pop',

  categories: [
    'all',
    'japanese',
    'handwriting',
    'cute',
    'rounded'
  ],

  tags: [
    '日本語',
    '手書き',
    'かわいい'
  ]
},

{
  value:
    'Mochiy Pop One',

  label:
    'Mochiy Pop One',

  categories: [
    'all',
    'japanese',
    'cute',
    'rounded',
    'bold'
  ],

  tags: [
    '日本語',
    'ポップ',
    'かわいい'
  ]
},

{
  value:
    'Zen Maru Gothic',

  label:
    'Zen Maru Gothic',

  categories: [
    'all',
    'japanese',
    'rounded',
    'cute'
  ],

  tags: [
    '日本語',
    '丸文字',
    'やわらかい'
  ]
},

/* ================================
   Cute / Pop
================================ */

{
  value:
    'Mochiy Pop One',

  label:
    'Mochiy Pop One',

  categories: [
    'all',
    'japanese',
    'cute',
    'rounded',
    'bold'
  ],

  tags: [
    '日本語',
    'ポップ',
    'かわいい'
  ]
},

/* ================================
   Horror
================================ */

{
  value:
    'Yuji Boku',

  label:
    'Yuji Boku',

  categories: [
    'all',
    'japanese',
    'handwriting',
    'horror'
  ],

  tags: [
    '日本語',
    '筆文字',
    '怪談'
  ]
},

{
  value:
    'Yuji Mai',

  label:
    'Yuji Mai',

  categories: [
    'all',
    'japanese',
    'handwriting',
    'horror'
  ],

  tags: [
    '日本語',
    '崩し字',
    '不穏'
  ]
},

{
  value:
    'Zen Old Mincho',

  label:
    'Zen Old Mincho',

  categories: [
    'all',
    'japanese',
    'mincho',
    'horror',
    'classic'
  ],

  tags: [
    '日本語',
    '古風',
    '怪談'
  ]
},

{
  value:
    'Shippori Mincho',

  label:
    'Shippori Mincho',

  categories: [
    'all',
    'japanese',
    'mincho',
    'horror',
    'classic'
  ],

  tags: [
    '日本語',
    '映画的',
    '静かな恐怖'
  ]
},

/* ================================
   Techno
================================ */

{
  value:
    'Orbitron',

  label:
    'Orbitron',

  categories: [
    'all',
    'english',
    'techno',
    'modern'
  ],

  tags: [
    '英語',
    'テクノ',
    '未来'
  ]
},

{
  value:
    'Audiowide',

  label:
    'Audiowide',

  categories: [
    'all',
    'english',
    'techno',
    'design'
  ],

  tags: [
    '英語',
    '近未来',
    'タイトル'
  ]
}
    ];


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