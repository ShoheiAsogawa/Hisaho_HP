# Hisaho_HP

認定こども園 ひさほ保育園の静的Webサイトです。
公式パンフレットと公開情報（保育目標・方針、クラス編成、特別指導科目、食育・給食、保育時間、入所要件）をもとに構成しています。

## 構成

- `index.html` - トップページ
- `about.html` - 園について
- `food.html` - 食育・給食
- `visit.html` - 入園案内・園見学
- `recruit.html` - 保育士募集
- `news.html` - お知らせ
- `styles.css` - ベース（リセット、ヘッダー土台）
- `site.css` - サイト共通のデザインシステム。`<body class="hisaho">` に適用される
- `script.js` - スクロール表示
- `marquee.js` - Instagram投稿が無限に流れるマーキー（トップ・お知らせページで使用）
- `assets/frame-wave.png` - パンフレット由来の虹色ブロブ。全ページの上下フレームに使用
- `assets/frame-hill.png` - 緑の丘（予備）
- `assets/illust/` - 水彩イラスト素材76点（透過PNG・用途がわかる名前に整理済み）
- `assets/instagram/` - Instagram投稿画像（`post-*.jpg`。投稿と同じ 4:5 比率）
- `assets/deco/` - イラストの元データ（未整理・重い。整理済み版は `assets/illust/`）

## デザインの決まりごと

- 上下の虹色フレーム: 各ページの `<body>` 直下と `<footer>` 直前に `.page-frame` を置く
- ヘッダーはPC・モバイルとも「動物アイコン6つ + 中央ロゴ」の同じ形（ハンバーガーなし）
- 飾りイラスト: `<img class="sec-deco deco-tr deco-m soft">` のように置く
  - 位置 `deco-tl / tr / bl / br / ml / mr`、大きさ `deco-s / m / l`、`soft` で薄く
  - スマホでは既定で非表示。残したいものだけ `keep-sp` を付ける

## Instagramマーキーの更新方法

投稿を差し替えるときは、次の2つを更新します。

1. 画像を `assets/instagram/post-〇〇.jpg` として保存する（投稿と同じ 4:5 比率が理想）
2. `index.html` / `news.html` の `data-ig-marquee='[...]'` に
   `{"src":"assets/instagram/post-〇〇.jpg","href":"投稿URL","alt":"説明"}` を追加・削除する

`data-speed` で流れる速さ（px/秒）、`data-reverse` で流れる向きを変えられます。

## 確認方法

ブラウザで `index.html` を開いて確認できます。

## 装飾・編集（Deco Studio）

デスクトップの `DecoStudio` フォルダで編集します（このフォルダへのコピーは不要です）。

1. `Desktop\DecoStudio\deco-studio.bat` をダブルクリック
2. 自動でこの `Hisaho_HP` がプロジェクトとして開きます
3. 装飾すると HTML へリアルタイムで書き戻されます
