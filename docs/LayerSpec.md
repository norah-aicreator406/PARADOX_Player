# NORAH Studio Layer Spec v1.0

## 目的
背景、星、霧、GLSL、パーティクル、スペクトラム、リング、歌詞、オーバーレイを安全に重ねるための設計。

## 基本方針
- 背景は `#bgImage`
- テーマ固有演出は専用Layer
- Canvas描画はスペクトラムや一部演出に限定
- 既存の背景機能とテーマ背景を別系統にしない

## 推奨レイヤー順
```text
z-index: 1    #bgImage
z-index: 2    #glslLayer
z-index: 3-4  stars / fog / theme effects
z-index: 20   #spectrumCanvas
z-index: 20+  cover / ring
z-index: 30+  songInfo
z-index: 40   overlayLayers
```

## 現在の主要DOM
```text
#stage
#bgImage
#glslLayer
#spectrumCanvas
#coverFrame
#coverImage
#songInfo
#title
#artist
#overlayLayers
#auroraStarsLayer
#auroraFogLayer
#auroraFrontDustLayer
```
