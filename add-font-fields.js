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


function createFontId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


function main() {
  const originalText =
    fs.readFileSync(
      jsonPath,
      'utf8'
    );

  const fonts =
    JSON.parse(originalText);

  if (!Array.isArray(fonts)) {
    throw new Error(
      'fontLibrary.jsonのルートが配列ではありません。'
    );
  }

  const converted =
    fonts.map((font, index) => {
      const value =
        String(font?.value || '')
          .trim();

      if (!value) {
        throw new Error(
          `${index + 1}件目のvalueが空です。`
        );
      }

      return {
        id:
          font.id ||
          createFontId(value),

        family:
          font.family ||
          value,

        ...font
      };
    });

  const usedIds =
    new Set();

  converted.forEach((font, index) => {
    if (!font.id) {
      throw new Error(
        `${index + 1}件目のidを生成できませんでした。`
      );
    }

    if (usedIds.has(font.id)) {
      throw new Error(
        `idが重複しています: ${font.id}`
      );
    }

    usedIds.add(font.id);
  });

  const backupPath =
    `${jsonPath}.backup`;

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

  console.log(
    `[Font Library] ${converted.length}件を変換しました。`
  );

  console.log(
    `[Font Library] Backup: ${backupPath}`
  );
}


try {
  main();
} catch (error) {
  console.error(
    '[Font Library] 変換に失敗しました。',
    error
  );

  process.exitCode =
    1;
}