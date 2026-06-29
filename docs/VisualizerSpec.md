# NORAH Studio Visualizer Spec v1.0

## 目的
Visualizerは、音楽データを受け取り、背景、パーティクル、スペクトラム、リング、歌詞、オーバーレイを表示する外出し画面。

## 主要ファイル
```text
visualizer.html
visualizer.css
visualizer.js
themes/themeManager.js
glsl/engine.js
glsl/shaders.js
particles/particleEngine.js
particles/auroraParticle.js
themes/aurora/aurora.css
```

## 主要DOM
```text
#stage
#bgImage
#bgVideo
#glslLayer
#spectrumCanvas
#coverFrame
#coverImage
#songInfo
#title
#artist
#overlayLayers
```

## 背景方針
背景は `#bgImage` に一本化する。

```text
Theme Background
Song Background
      ↓
    #bgImage
```

Canvasには背景画像を描画しない。

## IPC通信
```text
visualizer-song
visualizer-background
visual-theme
visualizer-level
visualizer-time
visualizer-enabled
visualizer-overlay-layers
visualizer-overlay-layer-settings
```

## 音量データ方針
音楽側では音量データを常時送る。表示するかどうかはVisualizer側で判断する。`visualizerEnabled` によって送信自体を止める設計は避ける。
