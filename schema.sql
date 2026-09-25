CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  bytes BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_name TEXT NOT NULL,
  child_age TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'visit',
  detail TEXT NOT NULL DEFAULT '',
  resume_name TEXT NOT NULL DEFAULT '',
  resume_key TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  published_at TEXT NOT NULL,
  category TEXT NOT NULL,
  tag_class TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_href TEXT,
  link_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO news (published_at, category, tag_class, title, body, link_href, link_label, sort_order, published)
SELECT '2026-07', '行事', 'tag-pink', '環境活動家 谷口たかひさ氏の<wbr>講演会を<wbr>開催します', '子どもたちの未来と環境について考える講演会を園で開催予定です。詳細は園までお問い合わせください。', NULL, NULL, 10, 1
WHERE NOT EXISTS (SELECT 1 FROM news);

INSERT INTO news (published_at, category, tag_class, title, body, link_href, link_label, sort_order, published)
SELECT '2026-06', '国際交流', '', 'フィンランド・<wbr>タンペレ市の<wbr>サシ保育園と<wbr>情報交換を<wbr>始めました', '保育先進国フィンランドの保育園と交流し、学び合いながら園の保育をより良くしていきます。', NULL, NULL, 20, 1
WHERE (SELECT COUNT(*) FROM news) = 1;

INSERT INTO news (published_at, category, tag_class, title, body, link_href, link_label, sort_order, published)
SELECT '2026-05', '新しい取り組み', 'tag-out', '新しい<wbr>スポーツ体験<wbr>「ピックルボール」が<wbr>はじまります', 'ラケットとボールで楽しむ、みんなが同じスタートラインに立てるスポーツ。園に用具を導入しました。', 'about.html#lessons', '特別指導科目を<wbr>見る', 30, 1
WHERE (SELECT COUNT(*) FROM news) = 2;

INSERT INTO news (published_at, category, tag_class, title, body, link_href, link_label, sort_order, published)
SELECT '2026-04', '園見学', 'tag-pink', '園見学の<wbr>ご相談を<wbr>受け付けています', '入園をご検討中の方は、園見学申込ページまたはお電話よりお気軽にお問い合わせください。', 'visit.html', '園見学を<wbr>申し込む', 40, 1
WHERE (SELECT COUNT(*) FROM news) = 3;

INSERT INTO news (published_at, category, tag_class, title, body, link_href, link_label, sort_order, published)
SELECT '2026-04', '採用', '', '保育士を<wbr>募集しています', '少人数制のあたたかな園で、一人ひとりに寄り添う保育を一緒につくる仲間を募集しています。', 'recruit.html', '採用ページを<wbr>見る', 50, 1
WHERE (SELECT COUNT(*) FROM news) = 4;
