# NORAH Studio UI Flow v1.0

## 目的

UIFlowは、ユーザーがNORAH Studioをどのような流れで利用するかを定義する。

---

# 起動

```text
起動
 ↓
Library
 ↓
曲を選択
 ↓
Visualizer
```

---

# 新規曲登録

```text
ドラッグ＆ドロップ
 ↓
素材自動判別
 ↓
曲情報入力
 ↓
Library登録
 ↓
Theme適用
 ↓
保存
```

---

# 曲編集

```text
Library
 ↓
曲選択
 ↓
背景変更
 ↓
Theme変更
 ↓
Lyrics編集
 ↓
Layer調整
 ↓
自動保存
```

---

# Visualizer操作

```text
Visualizer起動
 ↓
Theme選択
 ↓
背景変更
 ↓
Particle調整
 ↓
Spectrum調整
 ↓
Overlay調整
 ↓
完成
```

---

# リリック制作

```text
歌詞入力
 ↓
時間調整
 ↓
モーション選択
 ↓
プレビュー
 ↓
保存
```

---

# テンプレート制作（将来）

```text
Theme作成
 ↓
Lyrics Style
 ↓
Particle
 ↓
Overlay
 ↓
Template保存
```

---

# 書き出し（将来）

```text
曲選択
 ↓
Export
 ↓
9:16 / 16:9
 ↓
画質設定
 ↓
動画生成
```

---

# 開発方針

新しい機能を追加する場合は、

```text
UI Flow
 ↓
DataSpec
 ↓
ThemeSpec
 ↓
実装
```

の順番で検討する。
