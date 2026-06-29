# NORAH Studio Coding Rules v1.0

## 最重要方針
既存機能を壊さないことを最優先とする。

## 実装前ルール
```text
1. 何を実装するか決める
2. 触るファイルを決める
3. 既存機能への影響を確認する
4. 小さく実装する
5. 動作確認する
6. 不要なログを削除する
7. GitHubにコミットする
```

## 禁止事項
```text
推測で大きく書き換えない
途中で方針を変えない
存在しない関数名を前提にしない
複数ファイルを同時に大きく変更しない
動いているコードを理由なく置き換えない
```

## デバッグルール
原因不明の場合は必ずログで確認する。修正完了後は不要なログを削除する。

## コミット例
```text
Add Aurora background layer
Fix visualizer level sending
Aurora Theme v1.0
Refactor background system
```

## テーマ実装ルール
テーマ固有CSSはテーマフォルダに分離する。

```text
themes/aurora/aurora.css
themes/galaxy/galaxy.css
```
