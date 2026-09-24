# 画像配置

TOPの本文は `index.html`、配置とスマホ対応は `nursery-main.css` で管理しています。
TOPのデザインは `.dream-hero`、6枚の写真の切り替えは `dream-hero.js` で管理しています。
写真は6秒ごとに自動で切り替わり、サムネイル・前後ボタンでも選べます。一時停止、キーボード操作、動きを減らす設定にも対応しています。
下層ページ（園について・食育・入園案内・採用・お知らせ）のキャラ配置は `site.css` 末尾の「キャラクター素材」でまとめて管理しています。

フォルダ構成と名前の付け方は `README.md` の「画像フォルダ」を見てください。以下のパスは `assets/` からの相対パスです。

## キャラクター素材（`mascots/`）

- `chara-<動物>-<ポーズ>.webp` … 6匹のクラスマスコット（ひよこ0歳 / ぱんだ1歳 / りす2歳 / うさぎ3歳 / きりん4歳 / らいおん5歳）
- `item-<もの>.webp` … 小物（積み木・ボール・虹・太陽・雲・木・看板など）
- `soldier-left.png` / `soldier-right.png` … 門柱の兵隊さん。`_inbox/兵隊さん.pdf` から透過PNGに変換（旗が外側を向くよう左右で使い分け）

元データ（1254px の PNG と兵隊さんの高解像度版 `soldier-*-master.png`）は `_inbox/` にあります。
Web用は余白を切り詰め、最大 440px の WebP（1枚 平均25KB前後）にしています。

## TOPページ

| 場所 | ファイル | 意図 |
| --- | --- | --- |
| ヘッダー（Deco Studio で配置） | `mascots/chara-chick-run.webp`、`mascots/chara-panda-peek.webp` | 左右の端から顔を出す |
| TOPスライダー | `photos/hero-01-cucumber-harvest.jpg` ～ `hero-06-group-photo.jpg` | きゅうり収穫、パイナップル、すいか、夜のわくわく保育、メダル、記念撮影 |
| TOPスライダーのふち | `chara-lion-wave` | 年長のらいおんが「ようこそ」と手をふる |
| Instagram | `chara-squirrel-drawing` | 帯の境目に座って絵をかく（帯の高さは増やさない） |
| 園の特長・見出し | `chara-lion-peek` | のぞくライオン |
| 特長①顔が見える距離感 | `chara-panda-chick-nap` | 寄りそって眠る＝安心 |
| 特長②たて割り × 年齢別 | `chara-lion-giraffe-play` | 5歳と4歳がいっしょに遊ぶ |
| 特長③食育 | `chara-rabbit-harvest` | 畑で収穫 |
| 保育理念 | `chara-friends-all`、`item-cloud`、`item-tree` | 6匹みんな＝「みんなが楽しい保育園」、木＝「心の根っこ」 |
| 6つのクラス | `chara-chick-sing` / `panda-heart` / `squirrel-acorn` / `rabbit-carrot` / `giraffe-reading` / `lion-cheer` | カードのふちから全身が顔を出す |
| 6つのクラスの飾り | `item-blocks`、`item-ball` | 左上・右下（スマホでは非表示） |
| 特別指導 | `photos/play-yard-friends.png` | 園庭で関わる子どもたち |
| 指導科目の挿絵 | `chara-chick-tambourine`、`chara-giraffe-swim`、`chara-panda-calligraphy`、`chara-lion-pickleball` | 音楽・水泳・書道・ピックルボールの先生役（4つ横並び） |
| 食育の見出し | `chara-rabbit-peek` | のぞくうさぎ |
| 食育の写真 | `photos/food-cooking-kids.png`、`photos/food-lunch-toddler.png`、`photos/hero-01-cucumber-harvest.jpg` | 料理、給食、畑の収穫 |
| 食育の飾り | `item-wateringcan`、`item-lunchplate` | 左上・右下（スマホでは非表示） |
| 行事の見出し | `chara-chick-peek`、`item-garland` | のぞくひよこ、右上にガーランド（スマホでは非表示） |
| 季節の行事（写真） | `photos/spring-flower-watering.jpg`、`photos/hero-04-night-wakuwaku.jpg`、`instagram/post-imohori.jpg`、`photos/winter-mochitsuki.png` | 春の水やり、夜の保育、芋掘り、もちつき |
| 季節の行事（キャラ） | `chara-rabbit-spring` / `lion-summer` / `squirrel-autumn` / `panda-winter` | 季節の服装で写真の右上に |
| 園見学 | `chara-chick-flag` | 旗を持って見学をご案内 |
| 施設概要・アクセス | `soldier-left.png`、`item-signboard`、`soldier-right.png` | 門柱の兵隊さんが「ようこそ ひさほ保育園へ」の看板をはさんでお出迎え |

## 下層ページ

| ページ | 場所 | ファイル |
| --- | --- | --- |
| 園について | ヒーロー | `chara-friends-all`（左）、`chara-chick-spring`（右） |
| | 4つの保育目標 | `item-crayons` |
| | 保育方針 | `item-cloud`（右上）、`chara-rabbit-reading`（左下） |
| | 年齢別の保育 | 0・1歳 `chara-panda-chick-nap` / 2・3歳 `chara-rabbit-squirrel-lunch` / 4・5歳 `chara-lion-giraffe-play`、飾り `item-blocks` |
| | 6つのクラス | TOPと同じ6匹、飾り `item-rainbow`（虹＝6色の6クラス）・`item-ball` |
| | 特別指導科目 | 体育 `chara-lion-cheer` / 音楽 `item-piano` / リトミック `chara-squirrel-ribbon` / 水泳 `chara-giraffe-swim` / 書道 `chara-panda-calligraphy` / ピックルボール `chara-lion-pickleball` |
| | 施設のご案内 | `illust/deco-building.png` |
| 食育・給食 | ヒーロー | `chara-rabbit-veggies`（左）、`chara-panda-lunch`（右） |
| | 育てて・収穫して・食べる | `chara-rabbit-watering`、写真 `photos/food-cooking-kids.png`・`food-veggie-play.jpg`・`food-lunch-toddler.png` |
| | 完全給食 | `chara-panda-handwash`（衛生・環境）、`item-lunchplate` |
| | 離乳食 | `chara-rabbit-squirrel-lunch`（本文の下） |
| | 行事食 | `chara-giraffe-summer`、行事の水彩イラスト（`illust/event-*.png`） |
| 入園案内 | ヒーロー | `chara-chick-flag`（左）、`item-backpack`（右） |
| | 保育時間 | `chara-lion-walk`（登園） |
| | 入所できる要件 | `item-flowerpot` |
| | 見学の3ステップ | `item-sun`、① `chara-lion-letter` ② `chara-lion-binoculars` ③ `chara-panda-heart` |
| | お問い合わせ | `item-notebook` |
| 採用情報 | ヒーロー | `chara-lion-wave`（左）、`chara-rabbit-spring`（右） |
| | 大切にする保育 | `item-picturebook` |
| | 働く環境 | `item-tree`（根を張れる場所）、チーム `chara-friends-all` / 学び `chara-giraffe-reading` / 視野 `chara-lion-binoculars` |
| | メッセージ | `item-rainbow`、`chara-panda-heart`（本文の下） |
| お知らせ | ヒーロー | `chara-lion-letter`（左）、`chara-squirrel-sketch`（右） |
| | お知らせ一覧 | `chara-giraffe-pickleball`（ピックルボールのお知らせに合わせて） |
| | Instagram | `item-flowerpot` |
| | 知りたい情報へ | `item-signboard`（道案内の看板） |

`item-bus` は未使用です。園バスの運行がないのに「送迎バスがある」と誤解されないよう、あえて外しています。

## 今後差し替えるとき

- 同じ場所の写真だけ変える場合は、対象の `<img src="…">` のファイル名を変更します。`width` / `height` 属性は画像の実寸（縦横比）に合わせてください。
- TOPは大きな写真 `.dream-slide` と小さな写真 `.dream-thumb img` の両方を差し替えてください。順番は両方で揃え、写真説明とボタンの `aria-label` も更新します。
- TOPのスマホ表示は「写真 → 写真選択 → キャッチコピー」の順番です。ヘッダーの下に自然に配置されるため、絶対座標で動かす必要はありません。
- 新しい素材は `assets/_inbox/` に入れてください。加工後のものを `assets/mascots/` に置きます。
- `src` が `assets/mascots/` の飾り（`.sec-deco` / `.hero-illust`）は、水彩の飾りと違って薄くせず、画面の端で切れない位置に自動で置かれます。
- 下層ページのヒーローのキャラは、幅900px以下では文字やボタンに重ならないようタイトルの上に移動し、右側のキャラは非表示になります。
- TOPの看板の文字（「ようこそ ひさほ保育園へ」）は `index.html` の `.gate-sign p` です。文字の大きさは看板の幅に合わせて自動で変わります。
- Deco Studio の「素材を保存」は `assets/deco/`（Gitに入らない）に書き出します。公開に使う画像は `assets/mascots/` に移して、パスを書き換えてください。
- 写真や挿絵は、それぞれのセクションの中に置いています。ページ全体の「上から○px」という座標は使わないでください。
- Deco Studioで再編集するときも、ページ全体ではなく配置先のセクションを基準にします。画面幅を変更した後はPCとスマホの両方を確認してください。
- Instagramのリンクと画像一覧は既存の `data-ig-marquee` で管理しています。
- 見出し・ボタンの改行位置は HTML の `<wbr>`（文節の区切り）で決めています。文言を変えるときは、区切りたい位置に `<wbr>` を入れてください。PC幅だけの改行は `<br class="pc-br" />`、途中で切りたくない語句は `<span class="nowrap">…</span>` です。
- ホバーの動きは `site.css` 末尾の「キャラクター・小物のホバーアニメーション」で、画像のファイル名（`chara-` / `item-` / `-peek` / `soldier-`）から自動で決まります。新しい素材も `assets/mascots/` に置いてこの名前を付ければ、同じ動きが付きます。マウス操作の端末だけで動き、「動きを減らす」設定では止まります。
