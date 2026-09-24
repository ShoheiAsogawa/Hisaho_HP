/* Photo selection stays stable: slides are never reordered in the DOM. */
(() => {
  const hero = document.querySelector('[data-dream-hero]');
  if (!hero) return;
  const gallery = hero.querySelector('.dream-gallery');
  const slides = [...hero.querySelectorAll('.dream-slide')];
  const thumbs = [...hero.querySelectorAll('.dream-thumb')];
  const pause = hero.querySelector('[data-dream-pause]');
  const announcement = hero.querySelector('[data-dream-announcement]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let paused = reduced.matches;
  let hovered = false;
  let focused = false;
  let timer;

  function schedule() {
    clearTimeout(timer);
    if (paused || hovered || focused || document.hidden) return;
    timer = setTimeout(() => select(active + 1), 6000);
  }

  function ensure(slide) {
    if (slide?.dataset.src && !slide.getAttribute("src")) slide.src = slide.dataset.src;
  }

  function select(index, manual = false) {
    active = (index + slides.length) % slides.length;
    ensure(slides[active]);
    ensure(slides[(active + 1) % slides.length]);
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === active);
      slide.setAttribute('aria-hidden', String(i !== active));
      thumbs[i].classList.toggle('is-active', i === active);
      thumbs[i].setAttribute('aria-pressed', String(i === active));
    });
    if (manual) announcement.textContent = `写真${active + 1}：${slides[active].alt}`;
    schedule();
  }

  function syncPause() {
    pause.classList.toggle('is-paused', paused);
    pause.setAttribute('aria-label', paused ? '写真の自動切り替えを再開' : '写真の自動切り替えを停止');
    schedule();
  }

  thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => select(index, true)));
  hero.querySelector('[data-dream-prev]').addEventListener('click', () => select(active - 1, true));
  hero.querySelector('[data-dream-next]').addEventListener('click', () => select(active + 1, true));
  pause.addEventListener('click', () => { paused = !paused; syncPause(); });
  gallery.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    select(active + (event.key === 'ArrowLeft' ? -1 : 1), true);
  });
  gallery.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  gallery.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  gallery.addEventListener('focusin', () => { focused = true; schedule(); });
  gallery.addEventListener('focusout', (event) => {
    focused = event.relatedTarget instanceof Node && gallery.contains(event.relatedTarget);
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', () => { paused = reduced.matches; syncPause(); });
  syncPause();
})();
