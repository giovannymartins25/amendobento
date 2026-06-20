import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveAssetUrl } from "@/lib/utils";

import bannerData from "@/assets/banner-amarelo.jpeg.asset.json";
import comboData from "@/assets/combo-cerveja.jpeg.asset.json";
import trioData from "@/assets/sabores-trio.jpeg.asset.json";
import graosData from "@/assets/graos-selecionados.jpeg.asset.json";

type Slide = {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  to: string;
};

const SLIDES: Slide[] = [
  {
    image: resolveAssetUrl(bannerData.url) ?? "",
    title: "Amendoim gourmet, torrado em Marília–SP",
    subtitle: "Quatro sabores autorais, embalados com cuidado e prontos pra acompanhar cada momento.",
    cta: "Ver catálogo",
    to: "/catalog",
  },
  {
    image: resolveAssetUrl(comboData.url) ?? "",
    title: "Harmonize seu momento",
    subtitle: "Descubra o sabor de amendoim ideal pra sua bebida e sua vibe.",
    cta: "Descobrir harmonização",
    to: "/harmonizacao",
  },
  {
    image: resolveAssetUrl(trioData.url) ?? "",
    title: "Conheça os sabores",
    subtitle: "Tradicional, Alho Frito e Cebola Crispy — cada um com personalidade única.",
    cta: "Ver sabores",
    to: "/catalog",
  },
  {
    image: resolveAssetUrl(graosData.url) ?? "",
    title: "Grãos selecionados, torra artesanal",
    subtitle: "Da agricultura familiar à embalagem: cuidamos de cada detalhe.",
    cta: "Quem somos",
    to: "/quem-somos",
  },
];

const AUTOPLAY_MS = 5000;

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => {
    setCurrent(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, current]);

  return (
    <section
      id="hero-carousel"
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(340px, 60vh, 640px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Destaques Amendobento"
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`carousel-slide ${i === current ? "active" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${i + 1} de ${SLIDES.length}`}
          aria-hidden={i !== current}
        >
          {/* Background image */}
          <img
            src={slide.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

          {/* Content */}
          <div className="absolute inset-0 z-10 flex flex-col items-start justify-end px-6 pb-16 sm:px-12 md:pb-20 lg:px-20">
            <div className="max-w-xl">
              <h2
                className="font-display text-3xl font-bold leading-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl"
                style={{
                  opacity: i === current ? 1 : 0,
                  transform: i === current ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
                }}
              >
                {slide.title}
              </h2>
              <p
                className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base md:text-lg"
                style={{
                  opacity: i === current ? 1 : 0,
                  transform: i === current ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
                }}
              >
                {slide.subtitle}
              </p>
              <Link
                to={slide.to}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-8 py-4 text-sm font-semibold text-primary-foreground shadow-gold transition-all hover:scale-[1.03] hover:bg-gold-light hover:shadow-gold-lg active:scale-[0.98] sm:text-base"
                style={{
                  opacity: i === current ? 1 : 0,
                  transform: i === current ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
                }}
                tabIndex={i === current ? 0 : -1}
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur transition-all hover:bg-black/60 hover:text-white sm:left-5 sm:h-12 sm:w-12"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur transition-all hover:bg-black/60 hover:text-white sm:right-5 sm:h-12 sm:w-12"
        aria-label="Próximo slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`carousel-indicator ${i === current ? "active" : ""}`}
            aria-label={`Ir para slide ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
