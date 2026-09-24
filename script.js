const navToggle = document.querySelector(".nav-toggle");
const globalNavs = document.querySelectorAll(".global-nav");

if (navToggle && globalNavs.length) {
  const firstNavLink = globalNavs[0].querySelector("a");

  const setNavState = (isOpen) => {
    navToggle.setAttribute("aria-expanded", String(isOpen));
    const label = navToggle.querySelector(".sr-only");
    if (label) label.textContent = isOpen ? "メニューを閉じる" : "メニューを開く";
    globalNavs.forEach((nav) => nav.classList.toggle("is-open", isOpen));
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    const nextState = !isOpen;
    setNavState(nextState);
    if (nextState && firstNavLink instanceof HTMLElement) firstNavLink.focus();
  });

  globalNavs.forEach((nav) => {
    nav.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) setNavState(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setNavState(false);
      navToggle.focus();
    }
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const heroCarousel = document.querySelector("[data-hero-carousel]");

if (heroCarousel) {
  const slides = Array.from(heroCarousel.querySelectorAll("[data-hero-slide]"));
  const thumbnails = Array.from(heroCarousel.querySelectorAll("[data-hero-index]"));
  const previousButton = heroCarousel.querySelector("[data-hero-prev]");
  const nextButton = heroCarousel.querySelector("[data-hero-next]");
  const currentLabel = heroCarousel.querySelector("[data-hero-current]");
  const announcement = heroCarousel.querySelector("[data-hero-announcement]");
  const thumbnailRail = heroCarousel.querySelector(".hero-carousel-thumbs");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const autoplayDelay = 5000;
  let activeIndex = 0;
  let autoplayTimer = 0;

  const normalizeIndex = (index) => (index + slides.length) % slides.length;

  const scrollThumbnailIntoView = (thumbnail) => {
    if (!(thumbnail instanceof HTMLElement) || !(thumbnailRail instanceof HTMLElement)) return;

    const targetLeft = thumbnail.offsetLeft - (thumbnailRail.clientWidth - thumbnail.offsetWidth) / 2;
    thumbnailRail.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reduceMotion.matches ? "auto" : "smooth",
    });
  };

  const showSlide = (index, announceChange = false) => {
    activeIndex = normalizeIndex(index);
    heroCarousel.dataset.activeIndex = String(activeIndex);

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    thumbnails.forEach((thumbnail, thumbnailIndex) => {
      const isActive = thumbnailIndex === activeIndex;
      thumbnail.classList.toggle("is-active", isActive);
      thumbnail.setAttribute("aria-pressed", String(isActive));
    });

    if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, "0");
    if (announceChange && announcement) {
      announcement.textContent = `写真${activeIndex + 1}を表示しました`;
    }

    scrollThumbnailIntoView(thumbnails[activeIndex]);
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = 0;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (reduceMotion.matches || document.hidden) return;
    autoplayTimer = window.setInterval(() => showSlide(activeIndex + 1), autoplayDelay);
  };

  const selectSlide = (index) => {
    showSlide(index, true);
    startAutoplay();
  };

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => selectSlide(index));
  });

  previousButton?.addEventListener("click", () => selectSlide(activeIndex - 1));
  nextButton?.addEventListener("click", () => selectSlide(activeIndex + 1));

  heroCarousel.addEventListener("pointerenter", stopAutoplay);
  heroCarousel.addEventListener("pointerleave", startAutoplay);
  heroCarousel.addEventListener("focusin", stopAutoplay);
  heroCarousel.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node) || !heroCarousel.contains(event.relatedTarget)) startAutoplay();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  reduceMotion.addEventListener?.("change", startAutoplay);
  showSlide(0);
  startAutoplay();
}


/* TOPページ: ヘッダーをヒーロー写真に重ねる。
   ・ヘッダーの実寸を CSS 変数に渡して、写真を上端まで届かせる
   ・少しスクロールしたら白いヘッダーに戻す                      */
(function () {
  const body = document.body;
  if (!body || !body.classList.contains("home-page")) return;

  const header = document.querySelector(".site-header");
  if (!header) return;

  const wave = document.querySelector(".page-frame-top");

  const syncHeight = () => {
    const root = document.documentElement.style;
    // 小数まで測らないと 1px の白い線が残るので getBoundingClientRect を使う
    root.setProperty("--home-header-h", header.getBoundingClientRect().height + "px");
    if (wave) root.setProperty("--home-wave-h", wave.getBoundingClientRect().height + "px");
  };

  const syncSolid = () => {
    header.classList.toggle("is-solid", window.scrollY > 24);
  };

  syncHeight();
  syncSolid();

  window.addEventListener("resize", syncHeight);
  window.addEventListener("scroll", syncSolid, { passive: true });

  // ロゴやアイコン画像の読み込みで高さが変わるので測り直す
  window.addEventListener("load", syncHeight);
  if ("ResizeObserver" in window) new ResizeObserver(syncHeight).observe(header);
})();


/* TOP ヒーロースライダー
   Based on "Responsive Image Carousel (Animation)" by noirsociety (MIT)
   https://codepen.io/noirsociety/pen/ZEwLGXB
   手前の1枚を配列の端に送るだけで、CSS の transition が拡大・縮小を描いてくれる */
(function () {
  const hero = document.querySelector("[data-hero-slider]");
  if (!hero) return;

  const slider = hero.querySelector(".slider");
  const content = hero.querySelector(".content");
  const announcement = hero.querySelector("[data-hero-announcement]");
  const prevBtn = hero.querySelector("[data-hero-prev]");
  const nextBtn = hero.querySelector("[data-hero-next]");
  if (!slider) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const AUTOPLAY_MS = 6000;
  let timer = null;

  const items = () => Array.from(slider.querySelectorAll(".item"));

  const replayContent = () => {
    if (!content || reduceMotion.matches) return;
    content.classList.remove("is-entering");
    void content.offsetWidth; // アニメーションを頭から流し直す
    content.classList.add("is-entering");
  };

  const announce = () => {
    if (!announcement) return;
    const label = items()[1]?.getAttribute("aria-label") || "";
    announcement.textContent = label ? "表示中の写真: " + label : "";
    items().forEach((item, index) => {
      const selectable = index >= 2 && index < 5;
      item.setAttribute("role", selectable ? "button" : "img");
      item.tabIndex = selectable ? 0 : -1;
    });
  };

  const go = (dir) => {
    const list = items();
    if (list.length < 2) return;
    if (dir === "prev") slider.prepend(list[list.length - 1]);
    else slider.append(list[0]);
    replayContent();
    announce();
  };

  const stopAutoplay = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (reduceMotion.matches || document.hidden) return;
    timer = setInterval(() => go("next"), AUTOPLAY_MS);
  };

  const restart = () => {
    startAutoplay();
  };

  prevBtn?.addEventListener("click", () => {
    go("prev");
    restart();
  });

  nextBtn?.addEventListener("click", () => {
    go("next");
    restart();
  });

  const selectPhoto = (target) => {
    const item = target.closest(".item");
    const index = items().indexOf(item);
    if (index < 2) return;
    // クリックした写真を、全面表示される2番目の位置に移動する。
    for (let step = 1; step < index; step++) slider.append(slider.firstElementChild);
    replayContent();
    announce();
    restart();
  };
  slider.addEventListener("click", (event) => selectPhoto(event.target));
  slider.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectPhoto(event.target);
  });

  hero.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      go("prev");
      restart();
    } else if (e.key === "ArrowRight") {
      go("next");
      restart();
    }
  });

  hero.addEventListener("mouseenter", stopAutoplay);
  hero.addEventListener("mouseleave", startAutoplay);
  hero.addEventListener("focusin", stopAutoplay);
  hero.addEventListener("focusout", startAutoplay);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") startAutoplay();
    else stopAutoplay();
  });

  reduceMotion.addEventListener?.("change", startAutoplay);

  announce();
  startAutoplay();
})();

// フッターの「TOPへ」ボタン：ページのいちばん上までふわっと戻る。
(() => {
  const button = document.querySelector(".to-top");
  if (!button) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  });
})();
