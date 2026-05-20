"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RevealController() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  useEffect(() => {
    const auto = document.querySelectorAll(
      ".audience-card, .testimonial-card, .step-card, .number, .feature-list li, .process-list li, .hero-photo"
    );
    auto.forEach((el) => el.classList.add("reveal"));

    const targets = document.querySelectorAll<HTMLElement>(".reveal");
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );

    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        requestAnimationFrame(() => el.classList.add("in"));
      } else {
        io.observe(el);
      }
    });

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
