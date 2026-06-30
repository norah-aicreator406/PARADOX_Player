# NORAH Studio Data Specification v1.0

## 目的

DataSpecは、NORAH Studioで保存されるデータ構造を定義する設計書である。
UIや内部実装ではなく、「何を保存するか」を統一することを目的とする。

---

# 基本方針

- 1曲 = 1プロジェクト
- Themeは初期値として適用される
- 曲は現在の状態を保存する
- 将来の拡張を考慮し、項目は追加可能とする

---

# Song Project

```text
Song Project
├ id
├ title
├ artist
├ album
├ category
├ tags
├ bpm
├ key
├ audioFile
├ coverImage
├ backgroundImage
├ backgroundVideo（将来）
├ lyricsFile
├ themeId
├ visualSettings
├ lyricSettings
├ layerSettings
├ exportSettings
├ memo
├ createdAt
└ updatedAt
```

## visualSettings

```text
visualSettings
├ spectrumStyle
├ ringStyle
├ particlePreset
├ backgroundMotion
├ glslPreset
├ overlayPreset
└ visualizerRatio
```

## lyricSettings

```text
lyricSettings
├ font
├ size
├ color
├ outline
├ shadow
├ animationPreset
├ position
├ opacity
└ timing
```

## layerSettings

```text
layerSettings
├ background
├ stars
├ fog
├ particle
├ spectrum
├ ring
├ lyrics
└ overlay
```

## exportSettings

```text
exportSettings
├ resolution
├ aspectRatio
├ fps
├ codec
├ alpha
└ outputPath
```

## Theme Data

```text
Theme
├ id
├ name
├ background
├ backgroundLayers
├ particle
├ spectrum
├ ring
├ glow
├ lyricsPreset
└ capabilities
```

## 将来追加候補

- お気に入り
- 再生回数
- 評価
- テンプレートID
- AI生成情報


# LyricsBlock

LyricsBlockは、時間・表示テキスト・見た目・モーションをまとめた歌詞表示単位。

```text
LyricsBlock
├ id
├ start
├ end
├ lines
├ style
└ animation


{
  id: "lyric_001",
  start: 0,
  end: 5,
  lines: [
    "君の声が",
    "まだ響いてる"
  ],
  style: {
    font: "Noto Sans JP",
    size: 64,
    color: "#ffffff",
    align: "center",
    outlineWidth: 0,
    outlineColor: "#000000",
    shadowColor: "#000000",
    shadowBlur: 12,
    shadowX: 0,
    shadowY: 4
  },
  animation: {
    preset: "fade",
    duration: 0.5
  }
}



方針
歌詞は単なるテキストではなく、LyricsBlockとして管理する
1つのLyricsBlockは、指定時間内に表示される歌詞カード
複数行に対応する
styleとanimationは後から拡張可能
文字単位アニメーションはVer1では扱わない



## STEP2：次に実装するもの

次は `index.js` 側にテスト用データを作る。

```js
const testLyricsBlocks = [
  {
    id: "lyric_001",
    start: 0,
    end: 5,
    lines: ["君の声が", "まだ響いてる"],
    animation: {
      preset: "fade",
      duration: 0.5
    }
  },
  {
    id: "lyric_002",
    start: 5,
    end: 10,
    lines: ["夜空へ", "溶けていく"],
    animation: {
      preset: "slideUp",
      duration: 0.5
    }
  }
];