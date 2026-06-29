# NORAH Studio Lyrics Spec v1.0

## 目的
Lyrics機能は、NORAH Studioを音楽プレイヤーからMV制作ツールへ進化させる重要機能。

## 開発段階
```text
Lv1: 固定歌詞レイヤー
Lv1.5: 複数行の歌詞カード切り替え
Lv2: 時間指定つき歌詞
Lv3: 行単位モーション
文字単位アニメーションは後回し
```

## Ver1範囲
```text
歌詞入力
フォント
サイズ
色
アウトライン
シャドウ
位置
回転
不透明度
開始時間
終了時間
フェード
スライド
ズーム
軽い揺れ
グロー
```

## モーション方針
文字単位ではなく、行単位・歌詞ブロック単位のモーションを基本とする。

```text
Fade
Slide Up
Slide Left
Zoom
Float
Glow
None
```

## 保存
Lyrics設定は曲ごとに保存する。ThemeはLyricsの初期スタイルを持てるが、曲側で変更可能。
