"use client";

import { useEffect } from "react";

export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    let ticking = false;
    function update() {
      if (window.scrollY > 8) header!.classList.add("is-scrolled");
      else header!.classList.remove("is-scrolled");
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}
