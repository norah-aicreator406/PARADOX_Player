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


        const currentFont =
          getCurrentFont?.();


        if (
          currentFont ===
          fontData.value
        ) {
          card.classList.add(
            'is-selected'
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


        header.append(
          name,
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
         * 1クリックで即時反映。
         * ライブラリは閉じない。
         */
        card.addEventListener(
          'click',
          () => {
            applySelectedFont(
              fontData.value
            );
          }
        );


        /*
         * ダブルクリックなら
         * 即時反映して閉じる。
         */
        card.addEventListener(
          'dblclick',
          () => {
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
      getCurrentFont?.() ||
      'Noto Sans JP';
  }
}


      function open() {
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