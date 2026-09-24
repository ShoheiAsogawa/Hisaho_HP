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
- `nursery-main.css` - トップページ本文専用。画像配置・やわらかいフレーム・スマホ対応（ヘッダーとフッターは対象外）
- `IMAGE-PLACEMENT.md` - 使用画像と配置場所の対応表
- `script.js` - スクロール表示
- `marquee.js` - Instagram投稿が無限に流れるマーキー（トップ・お知らせページで使用）

### 画像フォルダ（`assets/`）

| フォルダ | 中身 | 名前の付け方 |
| --- | --- | --- |
| `brand/` | ロゴ `logo-hisaho.png`、全ページ上下の虹色フレーム `frame-rainbow-wave.png` | 役割名 |
| `nav/` | ヘッダーの動物アイコン6つ | `nav-<動物>.png` |
| `photos/` | 園の写真（TOPスライダー・食育・行事） | `hero-<順番>-<内容>.jpg` / `<テーマ>-<内容>.jpg` |
| `mascots/` | 太線スタイルのキャラと小物（WebP・透過）、門柱の兵隊さん（PNG・透過） | `chara-<動物>-<ポーズ>` / `item-<もの>` / `soldier-left・right` |
| `illust/` | 水彩イラストの素材集（Deco Studio 用のパレット） | `<分類>-<もの>.png` |
| `instagram/` | Instagram投稿画像（投稿と同じ 4:5 比率） | `post-<内容>.jpg` |
| `_archive/` | 今はどのページでも使っていない旧素材（削除せず保管） | 元の名前のまま |
| `_inbox/` | 新しい素材の受け取り口・加工前の元データ（Gitには入らない） | 自由 |
| `deco/` | Deco Studio が書き出す素材・元データ（Gitには入らない。公開に使うものは `mascots/` へ移す） | 自由 |

どの画像がどこに使われているかは `IMAGE-PLACEMENT.md` にまとめています。

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

## テスト公開（Cloudflare）

公開サイトとお知らせ管理は、同じ Cloudflare Worker で配信しています。

- テストサイト: https://hisaho-hp-test.noiseless-rib.workers.dev
- 管理画面: https://hisaho-hp-test.noiseless-rib.workers.dev/admin
- お知らせは D1（`hisaho-hp-cms`）に保存され、公開中の記事だけ `news.html` に反映されます。本文は太字と画像を入れられます。

初回のデータベース作成:

```bash
npm install
npx wrangler d1 execute hisaho-hp-cms --remote --file=schema.sql
```

管理パスワードはリポジトリに置かず、Worker のシークレットにします。

```bash
npx wrangler secret put CMS_PASSWORD
npx wrangler secret put CMS_SESSION_SECRET
npm run deploy
```

ローカル確認は `.dev.vars.example` を `.dev.vars` にコピーしてから `npm run dev` です。

## 装飾・編集（Deco Studio）

デスクトップの `DecoStudio` フォルダで編集します（このフォルダへのコピーは不要です）。

1. `Desktop\DecoStudio\deco-studio.bat` をダブルクリック
2. 自動でこの `Hisaho_HP` がプロジェクトとして開きます
3. 装飾すると HTML へリアルタイムで書き戻されます
