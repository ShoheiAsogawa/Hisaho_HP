const navToggle = document.querySelector(".nav-toggle");
const globalNavs = document.querySelectorAll(".global-nav");

if (navToggle && globalNavs.length) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    globalNavs.forEach((nav) => nav.classList.toggle("is-open", !isOpen));
  });

  globalNavs.forEach((nav) => {
    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        navToggle.setAttribute("aria-expanded", "false");
        globalNavs.forEach((item) => item.classList.remove("is-open"));
      }
    });
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
