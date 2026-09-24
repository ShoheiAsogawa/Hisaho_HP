interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CMS_PASSWORD?: string;
  CMS_SESSION_SECRET?: string;
}

type NewsRow = {
  id: number;
  published_at: string;
  category: string;
  tag_class: string;
  title: string;
  body: string;
  link_href: string | null;
  link_label: string | null;
  sort_order: number;
  published: number;
};

const COOKIE = "hisaho_cms";
const SESSION_MS = 1000 * 60 * 60 * 12;
const CATEGORIES = ["行事", "国際交流", "新しい取り組み", "園見学", "採用", "お知らせ"];
const TAGS = new Set(["", "tag-pink", "tag-out"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      return adminResponse();
    }
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }
    if (url.pathname === "/") {
      const home = new URL(request.url);
      home.pathname = "/index.html";
      return env.ASSETS.fetch(new Request(home, request));
    }
    const detail = url.pathname.match(/^\/news\/(\d+)\/?$/);
    if (detail) return renderNewsDetail(request, env, Number(detail[1]));
    if (url.pathname === "/news" || url.pathname === "/news.html") {
      return renderNewsPage(request, env);
    }
    if (url.pathname.startsWith("/media/")) {
      return serveMedia(env, url.pathname.slice("/media/".length));
    }
    return env.ASSETS.fetch(request);
  },
};

async function renderNewsPage(request: Request, env: Env): Promise<Response> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/news.html";
  const asset = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (!asset.ok) return asset;
  let rows: NewsRow[] = [];
  try {
    const result = await env.DB.prepare(
      "SELECT id, published_at, category, tag_class, title, body, link_href, link_label, sort_order, published FROM news WHERE published = 1 ORDER BY sort_order ASC, published_at DESC, id DESC",
    ).all<NewsRow>();
    rows = result.results ?? [];
  } catch {
    return asset;
  }
  if (rows.length === 0) return asset;
  const html = rows.map(renderArticle).join("");
  return new HTMLRewriter()
    .on(".news-list", {
      element(element) {
        element.setInnerContent(html, { html: true });
      },
    })
    .transform(asset);
}

function renderArticle(row: NewsRow): string {
  const tag = row.tag_class ? ` class="tag ${escapeAttr(row.tag_class)}"` : ` class="tag"`;
  const datetime = escapeAttr(row.published_at);
  const label = escapeHtml(row.published_at.replace("-", ".").slice(0, 7));
  return `<a class="news-row reveal" href="/news/${row.id}"><time datetime="${datetime}">${label}</time><div><span${tag}>${escapeHtml(row.category)}</span><h2>${allowWbr(row.title)}</h2><p>${excerpt(row.body)}</p><span class="news-more">記事を読む</span></div></a>`;
}

async function renderNewsDetail(request: Request, env: Env, id: number): Promise<Response> {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/news.html";
  const asset = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (!asset.ok) return asset;
  const row = await env.DB.prepare(
    "SELECT id, published_at, category, tag_class, title, body, link_href, link_label, sort_order, published FROM news WHERE id = ? AND published = 1",
  ).bind(id).first<NewsRow>();
  if (!row) return new Response("記事が見つかりません", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const plainTitle = row.title.replace(/<[^>]+>/g, "");
  const link = safeHref(row.link_href);
  const linkHtml = link ? `<p><a class="text-link" href="${escapeAttr(link)}">${allowWbr(row.link_label || "詳しく見る")}</a></p>` : "";
  const tag = row.tag_class ? ` class="tag ${escapeAttr(row.tag_class)}"` : ` class="tag"`;
  const label = escapeHtml(row.published_at.replace("-", ".").slice(0, 7));
  const article = `<article class="news-article"><a class="news-back" href="/news.html">お知らせ一覧へ</a><p class="news-kicker"><time datetime="${escapeAttr(row.published_at)}">${label}</time><span${tag}>${escapeHtml(row.category)}</span></p>${renderBody(row.body)}${linkHtml}</article>`;
  return new HTMLRewriter()
    .on("head", { element(element) { element.prepend('<base href="/">', { html: true }); } })
    .on("link, script, img, source, a", {
      element(element) {
        for (const attr of ["href", "src"]) {
          const value = element.getAttribute(attr);
          if (!value) continue;
          element.setAttribute(attr, rootUrl(value));
        }
      },
    })
    .on("title", { element(element) { element.setInnerContent(`${plainTitle} | お知らせ | 認定こども園 ひさほ保育園`); } })
    .on(".page-hero-inner h1", { element(element) { element.setInnerContent(allowWbr(row.title), { html: true }); } })
    .on(".page-hero-inner p", { element(element) { element.setInnerContent("お知らせの詳細です。"); } })
    .on("#news", { element(element) { element.setInnerContent(article, { html: true }); } })
    .transform(asset);
}

function rootUrl(value: string): string {
  const url = value.trim();
  if (!url || url.startsWith("/") || url.startsWith("#") || url.startsWith("?") || /^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  return `/${url.replace(/^\.\//, "")}`;
}

function excerpt(body: string): string {
  const text = sanitizeRich(body).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= 90) return text;
  return `${text.slice(0, 90)}…`;
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === "POST" && url.pathname === "/api/login") return login(request, env);
  if (request.method === "POST" && url.pathname === "/api/logout") return logout(request);
  const session = await readSession(request, env);
  if (!session) return json({ error: "ログインが必要です" }, 401);
  if (request.method === "GET" && url.pathname === "/api/me") return json({ ok: true });
  if (request.method === "GET" && url.pathname === "/api/news") return listNews(env, true);
  if (request.method === "POST" && url.pathname === "/api/media") return uploadMedia(request, env);
  if (request.method === "POST" && url.pathname === "/api/news") return createNews(request, env);
  if (request.method === "POST" && url.pathname === "/api/news/reorder") return reorderNews(request, env);
  const match = url.pathname.match(/^\/api\/news\/(\d+)$/);
  if (match && request.method === "PUT") return updateNews(request, env, Number(match[1]));
  if (match && request.method === "DELETE") return deleteNews(env, Number(match[1]));
  return json({ error: "見つかりません" }, 404);
}

async function listNews(env: Env, includeDrafts: boolean): Promise<Response> {
  const sql = includeDrafts
    ? "SELECT * FROM news ORDER BY sort_order ASC, published_at DESC, id DESC"
    : "SELECT * FROM news WHERE published = 1 ORDER BY sort_order ASC, published_at DESC, id DESC";
  const result = await env.DB.prepare(sql).all<NewsRow>();
  return json({ news: result.results ?? [] });
}

async function createNews(request: Request, env: Env): Promise<Response> {
  const input = await readNewsInput(request);
  if (!input.ok) return json({ error: input.error }, 400);
  const min = await env.DB.prepare("SELECT MIN(sort_order) AS min_order FROM news").first<{ min_order: number | null }>();
  const sort = (min?.min_order ?? 10) - 10;
  const result = await env.DB.prepare(
    "INSERT INTO news (published_at, category, tag_class, title, body, link_href, link_label, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      input.value.published_at,
      input.value.category,
      input.value.tag_class,
      input.value.title,
      input.value.body,
      input.value.link_href,
      input.value.link_label,
      sort,
      input.value.published,
    )
    .run();
  return json({ id: result.meta.last_row_id }, 201);
}

async function updateNews(request: Request, env: Env, id: number): Promise<Response> {
  const input = await readNewsInput(request);
  if (!input.ok) return json({ error: input.error }, 400);
  const result = await env.DB.prepare(
    "UPDATE news SET published_at = ?, category = ?, tag_class = ?, title = ?, body = ?, link_href = ?, link_label = ?, published = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(
      input.value.published_at,
      input.value.category,
      input.value.tag_class,
      input.value.title,
      input.value.body,
      input.value.link_href,
      input.value.link_label,
      input.value.published,
      id,
    )
    .run();
  if (!result.meta.changes) return json({ error: "記事が見つかりません" }, 404);
  return json({ ok: true });
}

async function deleteNews(env: Env, id: number): Promise<Response> {
  const result = await env.DB.prepare("DELETE FROM news WHERE id = ?").bind(id).run();
  if (!result.meta.changes) return json({ error: "記事が見つかりません" }, 404);
  return json({ ok: true });
}

async function reorderNews(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null) as { ids?: unknown } | null;
  if (!body || !Array.isArray(body.ids) || body.ids.some((id) => !Number.isInteger(id))) {
    return json({ error: "並び順が正しくありません" }, 400);
  }
  const ids = body.ids as number[];
  const statements = ids.map((id, index) =>
    env.DB.prepare("UPDATE news SET sort_order = ?, updated_at = datetime('now') WHERE id = ?").bind((index + 1) * 10, id),
  );
  await env.DB.batch(statements);
  return json({ ok: true });
}

type NewsInput = {
  published_at: string;
  category: string;
  tag_class: string;
  title: string;
  body: string;
  link_href: string | null;
  link_label: string | null;
  published: number;
};

async function readNewsInput(request: Request): Promise<{ ok: true; value: NewsInput } | { ok: false; error: string }> {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return { ok: false, error: "入力を読み取れませんでした" };
  const publishedAt = String(body.published_at ?? "").trim();
  const category = String(body.category ?? "").trim();
  const tagClass = String(body.tag_class ?? "");
  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  const linkHref = String(body.link_href ?? "").trim();
  const linkLabel = String(body.link_label ?? "").trim();
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(publishedAt)) return { ok: false, error: "日付は YYYY-MM の形式で入力してください" };
  if (!CATEGORIES.includes(category)) return { ok: false, error: "区分を選んでください" };
  if (!TAGS.has(tagClass)) return { ok: false, error: "ラベルの色が正しくありません" };
  if (!title || title.length > 160) return { ok: false, error: "見出しは1〜160文字にしてください" };
  if (!text || text.length > 20000) return { ok: false, error: "本文は1〜20000文字にしてください" };
  const rich = sanitizeRich(text);
  if (!rich) return { ok: false, error: "本文を入力してください" };
  if (linkLabel.length > 80) return { ok: false, error: "リンク文言が長すぎます" };
  const href = linkHref ? safeHref(linkHref) : null;
  if (linkHref && !href) return { ok: false, error: "リンクはサイト内のページか https:// から始まるURLにしてください" };
  return {
    ok: true,
    value: {
      published_at: publishedAt,
      category,
      tag_class: tagClass,
      title,
      body: rich,
      link_href: href,
      link_label: linkLabel || null,
      published: body.published === false || body.published === 0 ? 0 : 1,
    },
  };
}

function cookieSuffix(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `HttpOnly; SameSite=Lax; Path=/${secure}`;
}

async function login(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null) as { password?: string } | null;
  const password = body?.password ?? "";
  const expected = env.CMS_PASSWORD ?? "";
  if (!expected || !timingSafeEqual(password, expected)) {
    return json({ error: "パスワードが違います" }, 401);
  }
  const secret = env.CMS_SESSION_SECRET;
  if (!secret) return json({ error: "管理画面の秘密鍵が未設定です" }, 500);
  const exp = Date.now() + SESSION_MS;
  const sig = await hmac(secret, String(exp));
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  headers.append(
    "set-cookie",
    `${COOKIE}=${exp}.${sig}; ${cookieSuffix(request)}; Max-Age=${SESSION_MS / 1000}`,
  );
  return new Response(JSON.stringify({ ok: true }), { headers });
}

function logout(request: Request): Response {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  headers.append("set-cookie", `${COOKIE}=; ${cookieSuffix(request)}; Max-Age=0`);
  return new Response(JSON.stringify({ ok: true }), { headers });
}

async function readSession(request: Request, env: Env): Promise<boolean> {
  const secret = env.CMS_SESSION_SECRET;
  if (!secret) return false;
  const cookie = request.headers.get("cookie") ?? "";
  const found = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  if (!found) return false;
  const token = found.slice(COOKIE.length + 1);
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = await hmac(secret, exp);
  return timingSafeEqual(sig, expected);
}

function adminResponse(): Response {
  return new Response(ADMIN_HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function renderBody(body: string): string {
  const safe = sanitizeRich(body);
  if (!safe) return "";
  if (/<(p|div|ul|ol|img|h2|h3|blockquote|table)\b/i.test(safe)) return `<div class="news-body">${safe}</div>`;
  return `<div class="news-body"><p>${safe}</p></div>`;
}

function alignStyle(attrs: string): string {
  const style = /style\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "";
  const align = /text-align\s*:\s*(left|center|right|justify)/i.exec(style)?.[1]?.toLowerCase();
  return align ? ` style="text-align:${align}"` : "";
}

function colorStyle(attrs: string): string {
  const style = /style\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? "";
  const parts: string[] = [];
  const color = safeColor(/[^a-z-]color\s*:\s*([^;]+)/i.exec(`;${style}`)?.[1] ?? /(?:^|;)color\s*:\s*([^;]+)/i.exec(style)?.[1] ?? "");
  const background = safeColor(/background-color\s*:\s*([^;]+)/i.exec(style)?.[1] ?? "");
  if (color) parts.push(`color:${color}`);
  if (background) parts.push(`background-color:${background}`);
  return parts.join(";");
}

function safeColor(value: string): string | null {
  const color = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(color)) return color.replace(/\s+/g, "");
  return null;
}

function sanitizeRich(input: string): string {
  const allowed = new Set(["p", "div", "br", "strong", "b", "em", "i", "u", "s", "strike", "span", "img", "wbr", "ul", "ol", "li", "h2", "h3", "blockquote", "a", "table", "thead", "tbody", "tr", "th", "td"]);
  let html = "";
  let skipping = false;
  const pattern = /<\/?([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g;
  for (const match of input.matchAll(pattern)) {
    if (match[3]) {
      if (!skipping) html += escapeHtml(match[3]);
      continue;
    }
    const name = match[1].toLowerCase();
    if (name === "script" || name === "style") {
      skipping = !match[0].startsWith("</");
      continue;
    }
    if (skipping) continue;
    if (!allowed.has(name)) continue;
    if (name === "br" || name === "wbr") {
      html += `<${name}>`;
      continue;
    }
    if (match[0].startsWith("</")) {
      html += `</${name}>`;
      continue;
    }
    const alignable = new Set(["p", "div", "h2", "h3", "li", "blockquote", "td", "th"]);
    if (alignable.has(name)) {
      html += `<${name}${alignStyle(match[2] ?? "")}>`;
      continue;
    }
    if (name === "span") {
      const style = colorStyle(match[2] ?? "");
      html += style ? `<span style="${style}">` : "<span>";
      continue;
    }
    if (name === "a") {
      const href = /href\s*=\s*"([^"]+)"/i.exec(match[2] ?? "")?.[1] ?? "";
      const safe = safeHref(href);
      if (!safe) continue;
      html += `<a href="${escapeAttr(safe)}">`;
      continue;
    }
    if (name === "img") {
      const src = /src\s*=\s*"([^"]+)"/i.exec(match[2] ?? "")?.[1] ?? "";
      const alt = /alt\s*=\s*"([^"]*)"/i.exec(match[2] ?? "")?.[1] ?? "";
      if (!/^\/media\/[a-zA-Z0-9._-]+$/.test(src)) continue;
      html += `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`;
      continue;
    }
    html += `<${name}>`;
  }
  return html.trim();
}

async function uploadMedia(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "画像を選んでください" }, 400);
  if (file.size > 1_200_000) return json({ error: "画像は1.2MB以下にしてください" }, 400);
  const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  const ext = types[file.type];
  if (!ext) return json({ error: "JPEG、PNG、WebP、GIF にしてください" }, 400);
  const id = `${crypto.randomUUID().replaceAll("-", "")}.${ext}`;
  await env.DB.prepare("INSERT INTO media (id, content_type, bytes) VALUES (?, ?, ?)").bind(id, file.type, await file.arrayBuffer()).run();
  return json({ url: `/media/${id}` });
}

function toBytes(bytes: unknown): Uint8Array {
  if (bytes instanceof Uint8Array) return bytes;
  if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
  if (typeof bytes === "string") {
    const binary = atob(bytes);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(bytes as ArrayLike<number>);
}

async function serveMedia(env: Env, id: string): Promise<Response> {
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) return new Response("見つかりません", { status: 404 });
  const row = await env.DB.prepare("SELECT content_type, bytes FROM media WHERE id = ?").bind(id).first<{ content_type: string; bytes: ArrayBuffer }>();
  if (!row) return new Response("見つかりません", { status: 404 });
  const bytes = toBytes(row.bytes);
  return new Response(bytes, {
    headers: {
      "content-type": row.content_type,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function allowWbr(value: string): string {
  return escapeHtml(value).replaceAll("&lt;wbr&gt;", "<wbr>").replaceAll("&lt;wbr/&gt;", "<wbr>");
}

function safeHref(href: string | null): string | null {
  if (!href) return null;
  const value = href.trim();
  if (/[\s<>"']/.test(value)) return null;
  if (value.startsWith("/") || value.startsWith("https://") || /^[a-z0-9][a-z0-9._/-]*\.html(?:#[a-z0-9_-]+)?$/i.test(value)) {
    return value;
  }
  return null;
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;
  for (let i = 0; i < length; i += 1) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>お知らせ管理 | ひさほ保育園</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet" />
  <style>
    :root { color-scheme: light; --pink:#ff66c4; --ink:#4a3144; --line:#f4cfe4; --bg:#fff8fc; }
    * { box-sizing: border-box; }
    body { margin:0; font-family:"Zen Maru Gothic", sans-serif; color:var(--ink); background:linear-gradient(180deg,#fff 0,#fff0f8 240px); }
    header, main { width:min(920px, calc(100% - 32px)); margin:0 auto; }
    header { display:flex; justify-content:space-between; gap:16px; align-items:center; padding:28px 0 8px; }
    h1 { font-size:1.6rem; margin:0; }
    a { color:#c43d93; }
    button, input, textarea, select { font:inherit; }
    button { border:0; border-radius:999px; background:var(--pink); color:#fff; padding:10px 16px; cursor:pointer; }
    button.ghost { background:#fff; color:var(--ink); border:1px solid var(--line); }
    button.warn { background:#fff; color:#b4234a; border:1px solid #f3b3c6; }
    .card { background:#fff; border:1px solid var(--line); border-radius:24px; padding:20px; margin:16px 0 28px; box-shadow:0 10px 30px rgba(255,102,196,.08); }
    form.login { display:grid; gap:12px; max-width:420px; }
    label { display:grid; gap:6px; font-weight:700; }
    input, textarea, select { width:100%; border:1px solid var(--line); border-radius:14px; padding:10px 12px; background:#fff; color:var(--ink); }
    textarea { min-height:110px; resize:vertical; }
    .grid { display:grid; grid-template-columns: 160px 1fr 160px; gap:12px; }
    .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    article { border-top:1px dashed var(--line); padding:16px 0; }
    article:first-child { border-top:0; padding-top:0; }
    .meta { color:#8a6478; font-size:.92rem; }
    .error { color:#b4234a; min-height:1.2em; }
    .hidden { display:none; }
    .wysiwyg { border:1px solid #d5dbe3; border-radius:10px; background:#fff; overflow:hidden; }
    .wysiwyg-bar { display:flex; flex-wrap:wrap; gap:2px; align-items:center; padding:6px; background:#f4f6f8; border-bottom:1px solid #e1e5ea; }
    .wysiwyg-bar button, .wysiwyg-bar select { width:34px; height:34px; margin:0; padding:0; border:0; border-radius:6px; background:transparent; color:#52606d; }
    .wysiwyg-bar select { width:auto; height:34px; padding:0 8px; font-size:.92rem; }
    .wysiwyg-bar button:hover, .wysiwyg-bar select:hover, .wysiwyg-bar button.is-on { background:#e6ebf0; color:#1f2933; }
    .wysiwyg-bar svg { width:18px; height:18px; display:block; margin:auto; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
    .wysiwyg-bar .sep { width:1px; height:22px; margin:0 4px; background:#d5dbe3; }
    .wysiwyg-bar input[type="color"] { width:28px; height:28px; padding:0; border:0; background:transparent; }
    .editor { min-height:260px; border:0; border-radius:0; padding:14px; background:#fff; font-weight:500; line-height:1.7; }
    .editor:empty:before { content:"ここに文章を書いてください。選択して太字や見出しにできます。"; color:#b08aa0; }
    .editor h2, .editor h3 { margin:0.6em 0 0.3em; }
    .editor img { max-width:100%; }
    .editor:focus { outline:2px solid #ffd0ea; }
    .editor img { max-width:100%; height:auto; border-radius:12px; }
    .editor table { width:100%; border-collapse:collapse; }
    .editor td { border:1px solid #e1e5ea; padding:8px; }
    @media (max-width:720px) { .grid { grid-template-columns:1fr; } header { align-items:flex-start; flex-direction:column; } }
  </style>
</head>
<body>
  <header>
    <div>
      <p class="meta">認定こども園 ひさほ保育園</p>
      <h1>お知らせ管理</h1>
    </div>
    <div class="row">
      <a href="/news.html">公開ページを見る</a>
      <button id="logout" class="ghost hidden" type="button">ログアウト</button>
    </div>
  </header>
  <main>
    <section id="login-card" class="card">
      <form id="login-form" class="login">
        <label>管理パスワード<input id="password" type="password" autocomplete="current-password" required /></label>
        <button type="submit">ログイン</button>
        <p id="login-error" class="error"></p>
      </form>
    </section>
    <section id="editor" class="hidden">
      <form id="news-form" class="card">
        <h2 id="form-title">新しいお知らせ</h2>
        <div class="grid">
          <label>年月<input name="published_at" placeholder="2026-09" required /></label>
          <label>見出し<input name="title" required /></label>
          <label>区分
            <select name="category">
              <option>行事</option><option>国際交流</option><option>新しい取り組み</option><option>園見学</option><option>採用</option><option>お知らせ</option>
            </select>
          </label>
        </div>
        <div class="wysiwyg">
          <div class="wysiwyg-bar" id="toolbar">
            <select id="block-style" aria-label="段落">
              <option value="p">段落</option>
              <option value="h2">見出し</option>
              <option value="h3">小見出し</option>
              <option value="blockquote">引用</option>
            </select>
            <span class="sep"></span>
            <button type="button" data-cmd="bold" aria-label="太字"><svg viewBox="0 0 24 24"><path d="M7 5h6a4 4 0 0 1 0 8H7zM7 13h7a4 4 0 0 1 0 8H7z"/></svg></button>
            <button type="button" data-cmd="italic" aria-label="斜体"><svg viewBox="0 0 24 24"><path d="M15 5H9M19 19H9M14 5l-4 14"/></svg></button>
            <button type="button" data-cmd="insertUnorderedList" aria-label="箇条書き"><svg viewBox="0 0 24 24"><path d="M9 7h11M9 12h11M9 17h11"/><circle cx="5" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="17" r="1" fill="currentColor" stroke="none"/></svg></button>
            <button type="button" data-cmd="insertOrderedList" aria-label="番号付きリスト"><svg viewBox="0 0 24 24"><path d="M10 7h10M10 12h10M10 17h10M4 8V5l-1 .5M4 12h2M5 10v4M4 19c.8-1 2-1 2 0s-2 1-2 2h3"/></svg></button>
            <button type="button" data-block="blockquote" aria-label="引用"><svg viewBox="0 0 24 24"><path d="M8 8H5v5h4v5H4M19 8h-3v5h4v5h-5"/></svg></button>
            <span class="sep"></span>
            <button type="button" data-cmd="justifyLeft" aria-label="左寄せ"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h10M4 14h16M4 18h10"/></svg></button>
            <button type="button" data-cmd="justifyCenter" aria-label="中央"><svg viewBox="0 0 24 24"><path d="M4 6h16M7 10h10M4 14h16M7 18h10"/></svg></button>
            <button type="button" data-cmd="justifyRight" aria-label="右寄せ"><svg viewBox="0 0 24 24"><path d="M4 6h16M10 10h10M4 14h16M10 18h10"/></svg></button>
            <button type="button" data-cmd="justifyFull" aria-label="両端"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg></button>
            <span class="sep"></span>
            <button type="button" id="insert-link" aria-label="リンク"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg></button>
            <button type="button" data-cmd="unlink" aria-label="リンク解除"><svg viewBox="0 0 24 24"><path d="M9 15l6-6M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1M4 20l3-3M17 7l3-3"/></svg></button>
            <button type="button" id="insert-image" aria-label="画像"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none"/><path d="m8 16 3-3 2 2 3-4 3 5"/></svg></button>
            <button type="button" id="insert-table" aria-label="表"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 10h16M4 15h16M10 5v14M15 5v14"/></svg></button>
            <input id="image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden />
          </div>
          <div class="wysiwyg-bar">
            <button type="button" data-cmd="underline" aria-label="下線"><svg viewBox="0 0 24 24"><path d="M7 5v6a5 5 0 0 0 10 0V5M6 19h12"/></svg></button>
            <button type="button" data-cmd="strikeThrough" aria-label="打ち消し線"><svg viewBox="0 0 24 24"><path d="M5 12h14M8 7c.5-1.5 2-2 4-2s3 .6 3 2-1 2-3 2h-2c-2 0-4 .6-4 2.5S8 16 12 16s4-.8 4.5-2"/></svg></button>
            <label aria-label="文字色"><input id="text-color" type="color" value="#4a3144" /></label>
            <label aria-label="背景色"><input id="mark-color" type="color" value="#fff3c4" /></label>
            <span class="sep"></span>
            <button type="button" data-cmd="undo" aria-label="元に戻す"><svg viewBox="0 0 24 24"><path d="M8 8H4v4M4 12a8 8 0 1 0 2-5"/></svg></button>
            <button type="button" data-cmd="redo" aria-label="やり直す"><svg viewBox="0 0 24 24"><path d="M16 8h4v4M20 12a8 8 0 1 1-2-5"/></svg></button>
          </div>
          <div id="body-editor" class="editor" contenteditable="true" aria-label="本文"></div>
        </div>
        <div class="grid">
          <label>ラベル色
            <select name="tag_class">
              <option value="">標準</option>
              <option value="tag-pink">ピンク</option>
              <option value="tag-out">アクセント</option>
            </select>
          </label>
          <label>リンク先<input name="link_href" placeholder="visit.html" /></label>
          <label>リンク文言<input name="link_label" placeholder="詳しく見る" /></label>
        </div>
        <label class="row"><input name="published" type="checkbox" checked style="width:auto" /> 公開する</label>
        <p class="meta">上のアイコンで、選んだ文章の太さ・配置・リスト・リンク・画像を変えられます。</p>
        <div class="row">
          <button type="submit">保存する</button>
          <button id="cancel" class="ghost hidden" type="button">新規入力に戻す</button>
        </div>
        <p id="form-error" class="error"></p>
      </form>
      <section id="list" class="card"></section>
    </section>
  </main>
  <script>
    const loginCard = document.querySelector("#login-card");
    const editor = document.querySelector("#editor");
    const list = document.querySelector("#list");
    const editorBody = document.querySelector("#body-editor");
    const form = document.querySelector("#news-form");
    const logout = document.querySelector("#logout");
    const cancel = document.querySelector("#cancel");
    let editing = null;
    let items = [];

    async function api(path, options = {}) {
      const response = await fetch(path, { credentials: "same-origin", headers: { "content-type": "application/json" }, ...options });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "保存できませんでした");
      return data;
    }

    function showApp(on) {
      loginCard.classList.toggle("hidden", on);
      editor.classList.toggle("hidden", !on);
      logout.classList.toggle("hidden", !on);
    }

    function resetForm() {
      editing = null;
      form.reset();
      form.published.checked = true;
      editorBody.innerHTML = "";
      document.querySelector("#form-title").textContent = "新しいお知らせ";
      cancel.classList.add("hidden");
      document.querySelector("#form-error").textContent = "";
    }

    function fillForm(item) {
      editing = item.id;
      form.published_at.value = item.published_at;
      form.title.value = item.title;
      form.category.value = item.category;
      editorBody.innerHTML = item.body;
      form.tag_class.value = item.tag_class || "";
      form.link_href.value = item.link_href || "";
      form.link_label.value = item.link_label || "";
      form.published.checked = item.published === 1;
      document.querySelector("#form-title").textContent = "お知らせを編集";
      cancel.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function render() {
      list.innerHTML = items.length ? "" : "<p>まだお知らせはありません。</p>";
      items.forEach((item, index) => {
        const article = document.createElement("article");
        const status = item.published === 1 ? "公開中" : "下書き";
        article.innerHTML = \`<p class="meta">\${item.published_at} / \${item.category} / \${status}</p><h3></h3><p></p>\`;
        article.querySelector("h3").textContent = item.title.replaceAll("<wbr>", "");
        article.querySelector("p:last-child").textContent = item.body.replace(/<[^>]+>/g, "").slice(0, 120);
        const actions = document.createElement("div");
        actions.className = "row";
        const up = button("上へ", () => move(index, -1));
        const down = button("下へ", () => move(index, 1));
        const edit = button("編集", () => fillForm(item), "ghost");
        const remove = button("削除", () => removeItem(item), "warn");
        if (index === 0) up.disabled = true;
        if (index === items.length - 1) down.disabled = true;
        actions.append(up, down, edit, remove);
        article.append(actions);
        list.append(article);
      });
    }

    function button(label, onClick, kind) {
      const element = document.createElement("button");
      element.type = "button";
      element.textContent = label;
      if (kind) element.className = kind;
      element.addEventListener("click", onClick);
      return element;
    }

    async function load() {
      const data = await api("/api/news");
      items = data.news;
      render();
    }

    async function move(index, delta) {
      const next = items.slice();
      const target = index + delta;
      [next[index], next[target]] = [next[target], next[index]];
      await api("/api/news/reorder", { method: "POST", body: JSON.stringify({ ids: next.map((item) => item.id) }) });
      await load();
    }

    async function removeItem(item) {
      if (!confirm("このお知らせを削除しますか？")) return;
      await api("/api/news/" + item.id, { method: "DELETE" });
      if (editing === item.id) resetForm();
      await load();
    }

    document.querySelector("#login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      document.querySelector("#login-error").textContent = "";
      try {
        await api("/api/login", { method: "POST", body: JSON.stringify({ password: document.querySelector("#password").value }) });
        showApp(true);
        resetForm();
        await load();
      } catch (error) {
        document.querySelector("#login-error").textContent = error.message;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = document.querySelector("#form-error");
      error.textContent = "";
      const payload = {
        published_at: form.published_at.value,
        title: form.title.value,
        category: form.category.value,
        body: editorBody.innerHTML,
        tag_class: form.tag_class.value,
        link_href: form.link_href.value,
        link_label: form.link_label.value,
        published: form.published.checked
      };
      try {
        if (editing) await api("/api/news/" + editing, { method: "PUT", body: JSON.stringify(payload) });
        else await api("/api/news", { method: "POST", body: JSON.stringify(payload) });
        resetForm();
        await load();
      } catch (err) {
        error.textContent = err.message;
      }
    });

    document.querySelectorAll("[data-cmd]").forEach((button) => {
      button.addEventListener("click", () => {
        editorBody.focus();
        document.execCommand(button.dataset.cmd);
        markToolbar();
      });
    });
    document.querySelectorAll("[data-block]").forEach((button) => {
      button.addEventListener("click", () => {
        editorBody.focus();
        document.execCommand("formatBlock", false, "<" + button.dataset.block + ">");
        markToolbar();
      });
    });
    document.querySelector("#block-style").addEventListener("change", (event) => {
      editorBody.focus();
      document.execCommand("formatBlock", false, "<" + event.target.value + ">");
    });
    document.querySelector("#insert-link").addEventListener("click", () => {
      const href = prompt("リンク先のURL", "https://");
      if (!href) return;
      editorBody.focus();
      document.execCommand("createLink", false, href);
    });
    document.querySelector("#text-color").addEventListener("input", (event) => {
      editorBody.focus();
      document.execCommand("foreColor", false, event.target.value);
    });
    document.querySelector("#mark-color").addEventListener("input", (event) => {
      editorBody.focus();
      document.execCommand("hiliteColor", false, event.target.value);
    });
    document.querySelector("#insert-table").addEventListener("click", () => {
      editorBody.focus();
      document.execCommand("insertHTML", false, "<table><tr><td>　</td><td>　</td></tr><tr><td>　</td><td>　</td></tr></table>");
    });
    document.addEventListener("selectionchange", markToolbar);
    function markToolbar() {
      document.querySelectorAll("[data-cmd]").forEach((button) => {
        button.classList.toggle("is-on", document.queryCommandState(button.dataset.cmd));
      });
    }
    document.querySelector("#insert-image").addEventListener("click", () => document.querySelector("#image-file").click());
    document.querySelector("#image-file").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const error = document.querySelector("#form-error");
      error.textContent = "画像を入れています…";
      try {
        const prepared = await shrinkImage(file);
        const formData = new FormData();
        formData.append("file", prepared, prepared.name);
        const response = await fetch("/api/media", { method: "POST", body: formData, credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "画像を入れられませんでした");
        const alt = prompt("画像の説明（なくても大丈夫です）", "") || "";
        editorBody.focus();
        document.execCommand("insertHTML", false, \`<img src="\${data.url}" alt="\${alt.replaceAll('"', "")}">\`);
        error.textContent = "";
      } catch (err) {
        error.textContent = err.message;
      }
    });

    async function shrinkImage(file) {
      const bitmap = await createImageBitmap(file);
      const max = 1400;
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
      return new File([blob], "photo.jpg", { type: "image/jpeg" });
    }

    cancel.addEventListener("click", resetForm);
    logout.addEventListener("click", async () => {
      await api("/api/logout", { method: "POST", body: "{}" });
      showApp(false);
    });

    api("/api/me").then(async () => { showApp(true); await load(); }).catch(() => showApp(false));
  </script>
</body>
</html>`;
