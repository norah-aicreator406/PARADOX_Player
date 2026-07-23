const fs =
  require('fs');

const path =
  require('path');


const jsonPath =
  path.join(
    __dirname,
    'assets',
    'fonts',
    'fontLibrary.json'
  );


const BUNDLED_FONTS = {
  'Noto Sans JP': {
    file:
      './NotoSansJP/NotoSansJP-Regular.ttf',

    license:
      'OFL-1.1'
  },

  'Shippori Mincho': {
    file:
      './ShipporiMincho/ShipporiMincho-Regular.ttf',

    license:
      'OFL-1.1'
  },

  'Klee One': {
    file:
      './KleeOne/KleeOne-Regular.ttf',

    license:
      'OFL-1.1'
  }
};


function main() {
  const originalText =
    fs.readFileSync(
      jsonPath,
      'utf8'
    );

  const fonts =
    JSON.parse(
      originalText
    );

  if (!Array.isArray(fonts)) {
    throw new Error(
      'fontLibrary.jsonのルートが配列ではありません。'
    );
  }


  const converted =
    fonts.map((font, index) => {
      const family =
        String(
          font?.family ||
          font?.value ||
          ''
        ).trim();

      if (!family) {
        throw new Error(
          `${index + 1}件目のfamilyが空です。`
        );
      }


      const bundledData =
        BUNDLED_FONTS[family];


      if (bundledData) {
        return {
          ...font,

          source:
            'bundled',

          bundled:
            true,

          file:
            bundledData.file,

          license:
            bundledData.license
        };
      }


      return {
        ...font,

        source:
          font.source ||
          'google',

        bundled:
          false,

        file:
          null,

        license:
          font.license ||
          null
      };
    });


  const backupPath =
    `${jsonPath}.metadata-backup`;


  fs.writeFileSync(
    backupPath,
    originalText,
    'utf8'
  );


  fs.writeFileSync(
    jsonPath,
    `${JSON.stringify(converted, null, 2)}\n`,
    'utf8'
  );


  const bundledCount =
    converted.filter(
      font =>
        font.bundled === true
    ).length;


  console.log(
    `[Font Library] ${converted.length}件へメタデータを追加しました。`
  );

  console.log(
    `[Font Library] bundledフォント: ${bundledCount}件`
  );

  console.log(
    `[Font Library] Backup: ${backupPath}`
  );
}


try {
  main();
} catch (error) {
  console.error(
    '[Font Library] メタデータ追加に失敗しました。',
    error
  );

  process.exitCode =
    1;
}