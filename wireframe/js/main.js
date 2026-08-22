/**
 * OmiFilter Wireframe Interactions
 *
 *   data-animate           → scroll reveal
 *   data-animate-delay="N" → staggered scroll reveal
 *   data-menu-toggle       → mobile menu trigger
 *   data-menu              → mobile menu panel
 *   data-accordion-trigger → accordion toggle button
 *   data-accordion-content → accordion content panel
 */
(function () {
  "use strict";

  // ─── Scroll-Triggered Animations ───────────────────────────

  const animateOnScroll = () => {
    const elements = document.querySelectorAll("[data-animate]");
    if (!elements.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  };

  // ─── Sticky Nav Scroll State ───────────────────────────────

  const handleNavScroll = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const threshold = 8;
    let ticking = false;

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            header.classList.toggle("is-scrolled", window.scrollY > threshold);
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  };

  // ─── Mobile Menu ───────────────────────────────────────────

  const handleMobileMenu = () => {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    const backdrop = document.querySelector(".mobile-menu-backdrop");
    if (!toggle || !menu) return;

    const open = () => {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      if (backdrop) backdrop.classList.add("is-visible");
      document.body.style.overflow = "hidden";

      const firstLink = menu.querySelector("a, button");
      if (firstLink) firstLink.focus();
    };

    const close = () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (backdrop) backdrop.classList.remove("is-visible");
      document.body.style.overflow = "";
      toggle.focus();
    };

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.contains("is-open");
      isOpen ? close() : open();
    });

    if (backdrop) {
      backdrop.addEventListener("click", close);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        close();
      }
    });
  };

  // ─── Accordion (FAQ) ───────────────────────────────────────

  const handleAccordions = () => {
    const triggers = document.querySelectorAll("[data-accordion-trigger]");
    if (!triggers.length) return;

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const targetId = trigger.getAttribute("aria-controls");
        const content = document.getElementById(targetId);
        if (!content) return;

        const isOpen = content.classList.contains("is-open");
        const group = trigger.closest("[data-accordion-group]");
        if (group) {
          group.querySelectorAll("[data-accordion-content]").forEach((c) => {
            c.classList.remove("is-open");
          });
          group.querySelectorAll("[data-accordion-trigger]").forEach((t) => {
            t.setAttribute("aria-expanded", "false");
          });
        }

        if (!isOpen) {
          content.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        } else {
          content.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    });
  };

  // ─── Order Modal ───────────────────────────────────────────

  const handleModal = () => {
    const modal = document.querySelector("[data-modal]");
    if (!modal) return;

    const openTriggers = document.querySelectorAll("[data-modal-open]");
    const closeTriggers = modal.querySelectorAll("[data-modal-close]");
    const panel = modal.querySelector(".modal__panel");
    let lastFocused = null;

    const open = () => {
      // Close the mobile menu if it's open
      const menu = document.querySelector("[data-menu]");
      const toggle = document.querySelector("[data-menu-toggle]");
      if (menu && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
        const backdrop = document.querySelector(".mobile-menu-backdrop");
        if (backdrop) backdrop.classList.remove("is-visible");
        document.body.style.overflow = "";
      }

      lastFocused = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("is-open"));
      document.body.classList.add("modal-open");

      const first = modal.querySelector(".modal__close, a[href], button");
      if (first) first.focus();
    };

    const close = () => {
      if (!modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      document.body.classList.remove("modal-open");

      const finalize = () => {
        if (!modal.classList.contains("is-open")) modal.hidden = true;
      };
      if (panel) panel.addEventListener("transitionend", finalize, { once: true });
      window.setTimeout(finalize, 500);

      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    };

    openTriggers.forEach((t) => t.addEventListener("click", open));
    closeTriggers.forEach((t) => t.addEventListener("click", close));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  };

  // ─── Initialize ────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", () => {
    animateOnScroll();
    handleNavScroll();
    handleMobileMenu();
    handleAccordions();
    handleModal();
  });
})();
