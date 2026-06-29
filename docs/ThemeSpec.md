# NORAH Studio Theme Spec v1.0

## Themeとは
Themeは、ビジュアライザーの世界観を定義する初期値セットである。背景、背景モーション、星、霧、パーティクル、スペクトラム、リング、グローなどをまとめた「世界観プリセット」として扱う。

## 重要方針
Themeは曲へ適用される初期値であり、曲側に現在の設定値として保存される。ユーザーにはOverrideや継承という概念を見せない。

```text
Themeを選ぶ
  ↓
設定が曲に適用される
  ↓
ユーザーが調整
  ↓
曲ごとの設定として保存
```

## Theme基本項目
```text
Theme
├ id
├ name
├ description
├ background
├ backgroundMotion
├ backgroundLayers
├ glsl
├ particles
├ spectrum
├ ring
├ glow
├ lyricsPreset
└ capabilities
```

## Aurora v1.0
```text
id: aurora
name: Aurora
background: ./themes/aurora/aurora-bg.png
motionClass: theme-aurora
stars: auroraStarsLayer
fog: auroraFogLayer
frontDust: auroraFrontDustLayer
particle: auroraDust
spectrum: aurora
ring: neon ring + aurora glow
glsl: none
```

## Theme CSS
テーマ固有CSSはテーマフォルダに分離する。

```text
themes/
  aurora/
    aurora.css
    aurora-bg.png
```
