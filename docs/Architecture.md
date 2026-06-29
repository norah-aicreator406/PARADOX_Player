# NORAH Studio Architecture v1.0

## 目的
NORAH Studioは、単なる音楽プレイヤーではなく、1曲を「プロジェクト」として管理し、ビジュアライザー、背景、リリック、レイヤー、テンプレート、書き出しまで扱える制作スタジオを目指す。

## 基本思想
- 1曲 = 1プロジェクト
- Theme = 世界観の初期値セット
- 曲 = 現在の設定値を保存する単位
- 背景表示は `#bgImage` に一本化する
- 既存機能を壊さないことを最優先にする
- 原因不明の不具合は推測で修正せず、ログで確認する

## 構造
```text
Library
  ↓
Song Project
  ↓
Theme
  ↓
Visual Settings
  ↓
Visualizer Window
```

## 表示レイヤー
```text
#bgImage
Aurora Stars / Fog / Front Dust
#glslLayer
#spectrumCanvas
Cover / Ring
Lyrics
Overlay
UI
```
