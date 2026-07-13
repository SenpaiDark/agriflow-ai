"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  Truck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&q=75&auto=format&fit=crop",
    alt: "Farmer harvesting crops at golden hour",
  },
  {
    src: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=75&auto=format&fit=crop",
    alt: "Green farmland rows stretching to the horizon",
  },
  {
    src: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1920&q=75&auto=format&fit=crop",
    alt: "Modern farm fields",
  },
  {
    src: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=75&auto=format&fit=crop",
    alt: "Warehouse storage with produce",
  },
  {
    src: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=1920&q=75&auto=format&fit=crop",
    alt: "Agricultural drone flying over crops",
  },
  {
    src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=75&auto=format&fit=crop",
    alt: "Fresh green field under soft sunlight",
  },
];

const HEADLINE = ["Move", "farm", "produce", "from"];
const HEADLINE2 = ["field", "to", "market,"];

const FLOATING_CARDS = [
  {
    icon: TrendingUp,
    title: "Harvest Forecast",
    value: "+18% next week",
    tone: "text-harvest-light",
    position: "left-[4%] top-[24%] hidden lg:flex",
    depth: 24,
    float: "land-float",
  },
  {
    icon: ClipboardList,
    title: "Orders",
    value: "126 this month",
    tone: "text-emerald-300",
    position: "right-[6%] top-[20%] hidden lg:flex",
    depth: 36,
    float: "land-float-slow",
  },
  {
    icon: Truck,
    title: "Deliveries",
    value: "12 on the road",
    tone: "text-sky-300",
    position: "left-[8%] bottom-[22%] hidden xl:flex",
    depth: 30,
    float: "land-float-slow",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    value: "Tomatoes trending up",
    tone: "text-harvest-light",
    position: "right-[5%] bottom-[26%] hidden lg:flex",
    depth: 20,
    float: "land-float",
  },
];

export function Hero() {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % SLIDES.length),
      5000
    );
    return () => clearInterval(id);
  }, [paused]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  }, []);

  return (
    <section
      className="relative min-h-[92vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setMouse({ x: 0, y: 0 });
      }}
      onMouseMove={onMouseMove}
    >
      {/* Carousel backdrop */}
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === slide ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== slide}
        >
          <Image
            src={s.src}
            alt={s.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Depth overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/80 via-brand-dark/55 to-brand-dark/85" />
      <div className="land-glow pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-emerald-400/25 blur-3xl" />
      <div className="land-glow pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-harvest/20 blur-3xl" />

      {/* Drifting clouds */}
      <div
        className="land-cloud pointer-events-none absolute left-0 top-[12%] h-16 w-48 rounded-full bg-white/10 blur-2xl"
        style={{ animationDuration: "70s" }}
      />
      <div
        className="land-cloud pointer-events-none absolute left-0 top-[8%] h-10 w-64 rounded-full bg-white/10 blur-2xl"
        style={{ animationDuration: "95s", animationDelay: "-40s" }}
      />

      {/* Floating leaves */}
      {[12, 34, 58, 76, 90].map((left, i) => (
        <span
          key={i}
          className="land-leaf pointer-events-none absolute top-0 text-lg"
          style={{
            left: `${left}%`,
            animationDuration: `${16 + i * 5}s`,
            animationDelay: `${i * 4}s`,
          }}
          aria-hidden="true"
        >
          🍃
        </span>
      ))}

      {/* Floating glass cards with parallax */}
      {FLOATING_CARDS.map((c) => (
        <div
          key={c.title}
          className={cn("absolute z-10", c.position, c.float)}
          style={{
            transform: `translate3d(${mouse.x * c.depth}px, ${mouse.y * c.depth}px, 0)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <c.icon className={cn("h-5 w-5", c.tone)} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                {c.title}
              </p>
              <p className="text-sm font-bold text-white">{c.value}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm text-emerald-100 backdrop-blur"
        >
          <Sparkles className="h-4 w-4 text-harvest-light" />
          AI-assisted agricultural supply chain
        </motion.div>

        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          <span className="block">
            {HEADLINE.map((w, i) => (
              <motion.span
                key={w}
                className="mr-3 inline-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
              >
                {w}
              </motion.span>
            ))}
          </span>
          <span className="block">
            {HEADLINE2.map((w, i) => (
              <motion.span
                key={w}
                className="mr-3 inline-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
              >
                {w}
              </motion.span>
            ))}
            <motion.span
              className="inline-block bg-gradient-to-r from-harvest-light to-harvest bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.78 }}
            >
              without the waste
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-emerald-50/90"
        >
          AgriFlow connects farmers, buyers, transporters and warehouses on one
          platform — with demand forecasting, smart perishable-first delivery
          scheduling and real-time inventory tracking.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.15 }}
          className="mt-9 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/signup"
            className="group flex min-h-[48px] items-center gap-2 rounded-xl bg-harvest px-7 py-3 font-semibold text-brand-dark shadow-lg shadow-harvest/25 transition-all hover:-translate-y-0.5 hover:bg-harvest-light"
          >
            Get started free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex min-h-[48px] items-center rounded-xl border border-white/30 bg-white/10 px-7 py-3 font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            Sign in
          </Link>
        </motion.div>
      </div>

      {/* Carousel controls */}
      <button
        onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:flex"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}
        className="absolute right-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:flex"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === slide ? "w-8 bg-harvest" : "w-3 bg-white/40 hover:bg-white/70"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
