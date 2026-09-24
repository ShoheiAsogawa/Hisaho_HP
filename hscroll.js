/*
  モバイルの横スクロールセクション
  Based on "Horizontal Image Slider with GSAP" by Filip Zrnzevic (MIT)
  https://codepen.io/filipz/pen/NWQzWGm

  セクションを画面に固定したまま、縦スクロールの量だけカードを横へ流します。
  GSAP が読み込めなかった場合は何もしません（CSS 側の指でなぞる横スクロールが残ります）。

  【重要】固定するのは section ではなく内側の .hscroll-inner。
  #main が display:flex なので、その直下を固定すると GSAP が差し込む
  pin-spacer が flex アイテムになり、高さ計算が崩れてセクション同士が重なる。
*/
(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;

  var sections = Array.prototype.slice.call(document.querySelectorAll(".hscroll"));
  if (!sections.length) return;

  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  mm.add("(max-width: 900px) and (prefers-reduced-motion: no-preference)", function () {
    // 先に見た目を切り替えて、レイアウトを確定させてから計測させる
    sections.forEach(function (section) {
      section.classList.add("is-gsap");
    });
    void document.body.offsetHeight; // 強制的に再計算

    sections.forEach(function (section, index) {
      var inner = section.querySelector(".hscroll-inner");
      var track = section.querySelector(".hscroll-track");
      if (!inner || !track) return;

      // レールの右端が画面右端に収まるまでの距離（マイナス方向へ動かす）
      var distance = function () {
        return Math.min(0, -(track.scrollWidth - window.innerWidth));
      };

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: inner,
          start: "top top",
          end: function () {
            return "+=" + Math.abs(distance());
          },
          pin: inner,
          pinSpacing: true,
          // 端末を選ばず安定させる（fixed だと祖先の overflow:hidden で崩れる）
          pinType: "transform",
          scrub: 1,
          invalidateOnRefresh: true,
          // 上のセクションから順に計算させないと、下のセクションの開始位置がずれて重なる
          refreshPriority: sections.length - index,
        },
      });

      tl.to(track, { x: distance, ease: "none" });

      // 画面中央に来たカードに .active を付ける（戻りスクロールでも自動で外れる）
      gsap.utils.toArray(section.querySelectorAll(".hscroll-item")).forEach(function (item) {
        ScrollTrigger.create({
          trigger: item,
          containerAnimation: tl,
          start: "center center",
          end: "center center",
          toggleClass: "active",
        });
      });
    });

    // すべて作り終えてから、正しい順序で計測し直す
    ScrollTrigger.refresh();

    // PC幅へ戻したときに元通りにする
    return function () {
      sections.forEach(function (section) {
        section.classList.remove("is-gsap");
        var track = section.querySelector(".hscroll-track");
        if (track) gsap.set(track, { clearProps: "transform" });
        Array.prototype.forEach.call(section.querySelectorAll(".hscroll-item.active"), function (el) {
          el.classList.remove("active");
        });
      });
    };
  });

  // 画像の読み込みで幅が変わるので測り直す
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
