# NORAH Studio Library Spec v1.0

## 目的
Libraryは単なる曲一覧ではなく、1曲をプロジェクトとして管理するための仕組み。

## 基本方針
```text
1曲 = 1プロジェクト
```

## ドラッグ＆ドロップ
音楽ファイル、画像、背景素材、歌詞ファイルなどをドラッグ＆ドロップで投入できるようにする。

## まとめて取り込み
フォルダ投入時に以下を自動判別する。

```text
音楽ファイル
ジャケット画像
背景画像 / 背景動画
歌詞ファイル
その他素材
```

ファイル名が曲名と一致、または近い場合は自動で紐づける。一致しない場合は、取り込み確認画面で紐づけ先を選ぶ。

## Song Project
```text
Song Project
├ id
├ title
├ artist
├ category
├ tags
├ audioFile
├ coverImage
├ background
├ lyrics
├ theme
├ visualSettings
├ lyricSettings
├ layerSettings
├ exportSettings
└ memo
```

## タブ
- 自動反映タブ: カテゴリ、アーティスト、タグ条件で自動表示
- カスタムタブ: 好きな曲をドラッグ＆ドロップして自由に並べる

## 削除方針
曲や素材を削除しても、PC上の元ファイルは基本的に削除しない。登録情報から外す。
