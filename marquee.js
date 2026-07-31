/*
  InstaMarquee — 無限に流れる Instagram 投稿マーキー
  参考: CodePen "Customizable Infinite Scrolling Image Marquees" (keanedwards1)

  ・requestAnimationFrame でシームレスにループ
  ・画面外・非表示タブでは自動停止（バッテリーにやさしい）
  ・カードの大きさは CSS 側（--ig-card-w / aspect-ratio）で決まる
*/
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function InstaMarquee(container, options) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) return;

    this.options = Object.assign(
      { items: [], speed: 26, reverse: false, pauseOnHover: true },
      options || {}
    );
    if (!this.options.items.length) return;

    this.translate = 0;
    this.setWidth = 0;
    this.sets = 0;
    this.running = false;
    this.lastTs = null;
    this.currentSpeed = this.options.speed;
    this.targetSpeed = this.options.speed;

    this._frame = this._animate.bind(this);
    this._onVisibility = this._handleVisibility.bind(this);

    this._build();
  }

  InstaMarquee.prototype._makeItem = function (data, index, isClone) {
    var a = document.createElement("a");
    a.className = "ig-item";
    a.href = data.href;
    a.target = "_blank";
    a.rel = "noopener";

    if (isClone) {
      a.setAttribute("aria-hidden", "true");
      a.tabIndex = -1;
    } else {
      a.setAttribute("aria-label", (data.alt || "Instagramの投稿") + "（Instagramで開く）");
    }

    var img = document.createElement("img");
    img.src = data.src;
    img.alt = isClone ? "" : data.alt || "";
    // 先頭数枚はすぐ表示したいので eager、それ以外は遅延読み込み
    img.loading = !isClone && index < 4 ? "eager" : "lazy";
    img.decoding = "async";
    a.appendChild(img);

    if (data.caption) {
      var cap = document.createElement("span");
      cap.className = "ig-item-caption";
      cap.textContent = data.caption;
      a.appendChild(cap);
    }

    var badge = document.createElement("span");
    badge.className = "ig-item-badge";
    badge.setAttribute("aria-hidden", "true");
    badge.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4"/>' +
      '<circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none"/></svg>';
    a.appendChild(badge);

    return a;
  };

  InstaMarquee.prototype._appendSet = function (isClone) {
    var self = this;
    this.options.items.forEach(function (data, i) {
      self.track.appendChild(self._makeItem(data, i, isClone));
    });
    this.sets++;
  };

  InstaMarquee.prototype._build = function () {
    var self = this;
    this.container.classList.add("ig-marquee");

    this.track = document.createElement("div");
    this.track.className = "ig-track";
    this.container.appendChild(this.track);

    this._appendSet(false); // 1セット目だけが本物のリンク

    if (REDUCED) {
      // アニメーションを好まない設定では、横スクロールできる静的な並びにする
      this.container.classList.add("is-static");
      return;
    }

    this._layout();
    this._observe();
    this._listen();
    this.start();

    // 画像やフォントの読み込みで幅が変わることがあるので測り直す
    this._ready().then(function () {
      self._layout();
    });
  };

  // 1セット分の幅を測り、切れ目なくループできるだけクローンを足す
  InstaMarquee.prototype._layout = function () {
    var n = this.options.items.length;
    var first = this.track.children[0];
    if (!first) return;

    var itemW = first.getBoundingClientRect().width;
    var gap = parseFloat(window.getComputedStyle(this.track).columnGap) || 0;
    if (!itemW) return;

    this.setWidth = n * (itemW + gap);

    // 1セットが流れ切っても背後が埋まるように、コンテナ幅ぶんの余裕を持たせる
    var needed = this.setWidth + this.container.offsetWidth + 200;
    var guard = 0;
    while (this.sets * this.setWidth < needed && guard < 12) {
      this._appendSet(true);
      guard++;
    }

    if (this.options.reverse && this.translate > -this.setWidth) {
      this.translate = -this.setWidth;
    }
  };

  // 先頭画像の読み込みを待つ（読めなくても 1.5 秒で先へ進む）
  InstaMarquee.prototype._ready = function () {
    var imgs = Array.prototype.slice.call(this.track.querySelectorAll("img"), 0, 4);
    var loaded = Promise.all(
      imgs.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (res) {
          img.onload = img.onerror = res;
        });
      })
    );
    var timeout = new Promise(function (res) {
      setTimeout(res, 1500);
    });
    return Promise.race([loaded, timeout]);
  };

  InstaMarquee.prototype._animate = function (ts) {
    if (!this.running) return;
    if (this.lastTs === null) this.lastTs = ts;
    var elapsed = Math.min(ts - this.lastTs, 100); // タブ復帰時に飛ばないよう上限
    this.lastTs = ts;

    var diff = this.targetSpeed - this.currentSpeed;
    this.currentSpeed = Math.abs(diff) > 0.1 ? this.currentSpeed + diff * 0.06 : this.targetSpeed;

    var dist = (this.currentSpeed * elapsed) / 1000;
    this.translate += this.options.reverse ? dist : -dist;

    if (this.setWidth > 0) {
      if (this.options.reverse) {
        this.translate = ((this.translate + this.setWidth) % this.setWidth) - this.setWidth;
      } else {
        this.translate = this.translate % this.setWidth;
      }
    }

    this.track.style.transform = "translate3d(" + this.translate + "px,0,0)";
    this.raf = requestAnimationFrame(this._frame);
  };

  InstaMarquee.prototype._observe = function () {
    var self = this;

    if ("IntersectionObserver" in window) {
      this.io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) self.start();
            else self.stop();
          });
        },
        { threshold: 0 }
      );
      this.io.observe(this.container);
    }

    if ("ResizeObserver" in window) {
      var t;
      this.ro = new ResizeObserver(function () {
        clearTimeout(t);
        t = setTimeout(function () {
          self._layout();
        }, 200);
      });
      this.ro.observe(this.container);
    }
  };

  InstaMarquee.prototype._listen = function () {
    var self = this;
    if (this.options.pauseOnHover) {
      this.container.addEventListener("mouseenter", function () {
        self.targetSpeed = 0;
      });
      this.container.addEventListener("mouseleave", function () {
        self.targetSpeed = self.options.speed;
      });
      this.container.addEventListener("focusin", function () {
        self.targetSpeed = 0;
      });
      this.container.addEventListener("focusout", function () {
        self.targetSpeed = self.options.speed;
      });
    }
    document.addEventListener("visibilitychange", this._onVisibility);
  };

  InstaMarquee.prototype._handleVisibility = function () {
    if (document.visibilityState === "visible") this.start();
    else this.stop();
  };

  InstaMarquee.prototype.start = function () {
    if (this.running || REDUCED) return;
    this.running = true;
    this.lastTs = null;
    this.raf = requestAnimationFrame(this._frame);
  };

  InstaMarquee.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  window.InstaMarquee = InstaMarquee;

  // data-ig-marquee 属性を持つ要素を自動で初期化する
  function boot() {
    document.querySelectorAll("[data-ig-marquee]").forEach(function (el) {
      var items;
      try {
        items = JSON.parse(el.getAttribute("data-ig-marquee"));
      } catch (e) {
        return;
      }
      el.__marquee = new InstaMarquee(el, {
        items: items,
        speed: parseFloat(el.getAttribute("data-speed")) || 26,
        reverse: el.hasAttribute("data-reverse"),
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
