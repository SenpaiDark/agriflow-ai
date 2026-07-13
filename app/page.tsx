import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Hero } from "@/components/landing/hero";
import { Reveal } from "@/components/landing/reveal";
import { StatCounter } from "@/components/landing/stat-counter";
import {
  Leaf,
  TrendingUp,
  Truck,
  Warehouse,
  BarChart3,
  Sparkles,
  ShoppingCart,
  Sprout,
  UserCheck,
  CalendarClock,
  PackageCheck,
  Quote,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sprout,
    title: "Farm Management",
    text: "Track crops from planting to harvest with a smart calendar and yield records.",
  },
  {
    icon: ShoppingCart,
    title: "Marketplace",
    text: "Buyers browse fresh produce, place orders and track them end to end.",
  },
  {
    icon: TrendingUp,
    title: "Demand Forecasting",
    text: "Moving-average forecasts show what the market will need next week.",
  },
  {
    icon: Truck,
    title: "Smart Scheduling",
    text: "Perishable-first delivery scheduling with nearest-warehouse routing.",
  },
  {
    icon: Warehouse,
    title: "Warehouse Control",
    text: "Live inventory, stock movements and shelf-life spoilage alerts.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    text: "Role-based dashboards with charts for every part of the chain.",
  },
];

const STEPS = [
  {
    icon: Sprout,
    title: "Farmer lists a harvest",
    text: "Crops are tracked from planting; harvests go straight to the marketplace with price, grade and shelf life.",
  },
  {
    icon: ShoppingCart,
    title: "Buyer places an order",
    text: "Buyers browse live listings, order what they need and pick a delivery city.",
  },
  {
    icon: UserCheck,
    title: "Farmer confirms",
    text: "One click confirms the order and queues it for the scheduling engine.",
  },
  {
    icon: CalendarClock,
    title: "The engine schedules",
    text: "Most-perishable orders ship first, picked up from the warehouse nearest the buyer, assigned to the least-busy transporter.",
  },
  {
    icon: PackageCheck,
    title: "Delivered & tracked",
    text: "Everyone gets live notifications from pickup to drop-off, with routes on the map.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Before AgriFlow, half my tomatoes spoiled waiting for a buyer. Now they're scheduled for delivery the day after harvest.",
    name: "Adaeze N.",
    role: "Tomato farmer, Ogun State",
  },
  {
    quote:
      "The forecasting page tells me what to stock before the market asks for it. My restaurant supply business runs itself.",
    name: "Ibrahim K.",
    role: "Produce buyer, Lagos",
  },
  {
    quote:
      "I open the app, see my routes on the map, and just drive. Deliveries are assigned fairly and the buyers already know I'm coming.",
    name: "Chinedu O.",
    role: "Transporter, Ibadan",
  },
];

const STACK = [
  "Next.js 14",
  "TypeScript",
  "Tailwind CSS",
  "Supabase",
  "PostgreSQL",
  "Google Gemini",
  "Leaflet Maps",
  "Recharts",
  "PWA",
  "Vercel",
];

const FAQS = [
  {
    q: "Does every feature work without the AI?",
    a: "Yes. Scheduling, forecasting, spoilage tracking and notifications are fully deterministic and rule-based. Gemini only explains and summarises the data — if it's unavailable, everything else keeps working.",
  },
  {
    q: "How does the demand forecasting work?",
    a: "It uses classic moving-average and weighted moving-average techniques over the last eight weeks of real order data, per product. No black boxes — the numbers are explainable.",
  },
  {
    q: "How are deliveries scheduled?",
    a: "A rule engine ranks confirmed orders by remaining shelf life (most perishable first), caps deliveries per day, picks the warehouse nearest to the buyer as the pickup point, and assigns the least-busy transporter.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes — the whole app is mobile-first and installs as a PWA, so it opens like a native app from your home screen.",
  },
  {
    q: "Who is AgriFlow for?",
    a: "Five roles: farmers, buyers, transporters, warehouse managers and administrators. Each gets a dashboard built for their part of the supply chain.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky glass header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-dark/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-harvest">
              <Leaf className="h-5 w-5 text-brand-dark" />
            </div>
            <span className="text-lg font-bold text-white">AgriFlow AI</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <span className="[&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
              <ThemeToggle />
            </span>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-harvest px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-harvest-light"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Hero />

        {/* Features */}
        <section className="relative border-t border-gray-100 bg-gray-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand">
                Features
              </p>
              <h2 className="mt-3 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                Everything the supply chain needs
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">
                Five roles, one connected workflow — from the first seed to the
                final delivery.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.07}>
                  <div className="group h-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand/10">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 transition-colors group-hover:bg-brand group-hover:[&>svg]:text-white">
                      <f.icon className="h-6 w-6 text-brand transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {f.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand">
                How AgriFlow works
              </p>
              <h2 className="mt-3 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                One flow, five hands
              </h2>
            </Reveal>
            <div className="mt-14 space-y-0">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.06}>
                  <div className="relative flex gap-5 pb-10 last:pb-0">
                    {i < STEPS.length - 1 && (
                      <span className="absolute left-6 top-14 h-[calc(100%-3rem)] w-px bg-gradient-to-b from-brand/40 to-brand/5" />
                    )}
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20">
                      <s.icon className="h-5 w-5" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-harvest text-[10px] font-bold text-brand-dark">
                        {i + 1}
                      </span>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-semibold text-gray-900">{s.title}</h3>
                      <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
                        {s.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* AI assistant */}
        <section className="border-t border-gray-100 bg-gray-50 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                AI Assistant
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                Ask your supply chain anything
              </h2>
              <p className="mt-4 leading-relaxed text-gray-600">
                Powered by Google Gemini and grounded in your live data — the
                assistant explains demand trends, flags stock close to spoiling
                and summarises your operations in plain language. It never
                invents numbers, and the platform works fully without it.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-brand hover:underline"
              >
                Try it on your data <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-brand/5">
                <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                    <Sparkles className="h-4 w-4 text-brand" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    AgriFlow Assistant
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-white">
                    Which stock is closest to spoiling?
                  </div>
                  <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 text-gray-800">
                    Your 45&nbsp;kg of Leafy Greens at Lagos Central Warehouse
                    expires in ~1 day — dispatch it first. Tomatoes (90&nbsp;kg)
                    have 2 days left. Maize is safe for another 25 days.
                  </div>
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-white">
                    What should I restock next week?
                  </div>
                  <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 text-gray-800">
                    Tomato demand is trending up — the weighted forecast
                    expects ~112&nbsp;kg next week, 18% above your current
                    stock.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Stats band */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-light py-20">
          <div className="land-glow pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-harvest/20 blur-3xl" />
          <div className="land-glow pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-10 px-6 sm:grid-cols-4">
            <StatCounter value={5} label="User roles connected" />
            <StatCounter value={11} label="Platform modules" />
            <StatCounter value={8} label="Delivery cities routed" />
            <StatCounter value={100} suffix="%" label="Works without the AI" />
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand">
                Testimonials
              </p>
              <h2 className="mt-3 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                Built for the people who feed cities
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.08}>
                  <figure className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg">
                    <Quote className="h-7 w-7 text-harvest" />
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-gray-700">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-5 border-t border-gray-100 pt-4">
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="border-t border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                Technology
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                A modern, production-grade stack
              </h2>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {STACK.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal>
              <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand">
                FAQ
              </p>
              <h2 className="mt-3 text-center text-3xl font-bold text-gray-900">
                Frequently asked questions
              </h2>
            </Reveal>
            <div className="mt-12 space-y-3">
              {FAQS.map((f, i) => (
                <Reveal key={f.q} delay={i * 0.05}>
                  <details className="group rounded-xl border border-gray-200 bg-white shadow-sm open:shadow-md">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 font-medium text-gray-900">
                      {f.q}
                      <span className="text-brand transition-transform group-open:rotate-90">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-600">
                      {f.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-light py-24">
          <div className="land-glow pointer-events-none absolute left-1/4 top-0 h-64 w-64 rounded-full bg-harvest/25 blur-3xl" />
          <Reveal className="relative mx-auto max-w-3xl px-6 text-center">
            <Leaf className="mx-auto h-10 w-10 text-harvest-light" />
            <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
              Ready to streamline your produce flow?
            </h2>
            <p className="mt-4 text-emerald-50/90">
              Join as a farmer, buyer, transporter or warehouse manager and see
              your whole chain in one dashboard — free.
            </p>
            <Link
              href="/signup"
              className="mt-9 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-harvest px-8 py-3 font-semibold text-brand-dark shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-harvest-light"
            >
              Create your free account <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">AgriFlow AI</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              AI-driven agricultural supply chain and produce scheduling system
              with intelligent demand forecasting.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/signup" className="hover:text-brand">Create account</Link></li>
              <li><Link href="/login" className="hover:text-brand">Sign in</Link></li>
              <li><Link href="/forgot-password" className="hover:text-brand">Reset password</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">For every role</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Farmers — crops & harvests</li>
              <li>Buyers — marketplace & orders</li>
              <li>Transporters — routes & deliveries</li>
              <li>Warehouses — inventory & spoilage</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Project</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href="https://github.com/SenpaiDark"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand"
                >
                  GitHub — SenpaiDark
                </a>
              </li>
              <li>Final-year project · MIT License</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} AgriFlow AI — Agricultural Supply Chain &
          Produce Scheduling System
        </p>
      </footer>
    </div>
  );
}
