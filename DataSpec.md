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
