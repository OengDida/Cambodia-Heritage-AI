import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, BatteryCharging, Check, CircleDollarSign, Github, MapPin, Route, TriangleAlert } from 'lucide-react'

const repo = 'https://github.com/OengDida/SmartRoute-AI'
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const goTo = id => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })

function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect() }
    }, { threshold })
    io.observe(node)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen]
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, seen] = useInView(0.15)
  return <div ref={ref} style={{ '--d': `${delay}ms` }} className={`lp-reveal ${seen ? 'is-in' : ''} ${className}`}>{children}</div>
}

function CountUp({ to, suffix = '' }) {
  const [ref, seen] = useInView(0.6)
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!seen) return
    if (prefersReducedMotion()) { setValue(to); return }
    let raf, start
    const tick = t => {
      start ??= t
      const p = Math.min((t - start) / 1100, 1)
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to])
  return <span ref={ref}>{value}{suffix}</span>
}

function Logo({ className = '' }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
    <path d="M16 2C9.9 2 5 6.9 5 13c0 7.6 9.2 15.7 10.2 16.6.5.4 1.1.4 1.6 0C17.8 28.7 27 20.6 27 13 27 6.9 22.1 2 16 2Z" fill="currentColor" />
    <path d="M10.5 15.5c2.2-4.5 4.4 1 6.2-2.6 1-2 3-1.6 4.8-3.4" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="21.8" cy="9.6" r="1.7" fill="#000" />
  </svg>
}

const features = [
  { icon: Route, title: 'Route', text: 'Real driving routes, distance and travel time from Google Maps.' },
  { icon: BatteryCharging, title: 'Range', text: 'Your vehicle’s real-world range, with alerts before you hit a dead zone.' },
  { icon: CircleDollarSign, title: 'Cost', text: 'Fuel or charging cost for the whole trip, in riel and dollars.' },
]

const steps = [
  ['01', 'Pick your vehicle', 'Electric, hybrid, petrol, diesel or motorbike.'],
  ['02', 'Set your trip', 'Search a start and a destination anywhere in Cambodia.'],
  ['03', 'Drive prepared', 'See range, suggested stops and total cost on one map.'],
]

const FULL_RANGE = 400
const TRIP_KM = 315

function RangeDemo() {
  const [pct, setPct] = useState(62)
  const range = Math.round(FULL_RANGE * pct / 100)
  const spare = range - TRIP_KM
  const ok = spare >= 40
  const tight = spare >= 0 && spare < 40
  const status = ok ? `Comfortable: about ${spare} km to spare`
    : tight ? `Tight: only ${spare} km to spare. Keep a reserve`
    : `Short by ${-spare} km: add a charging stop`
  const Icon = spare >= 0 ? Check : TriangleAlert
  return <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-[.2em] text-white/50">Phnom Penh → Siem Reap · {TRIP_KM} km</div>
        <div className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">{range} <span className="text-2xl font-normal text-white/50">km range</span></div>
      </div>
      <div role="status" className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black"><Icon size={16} aria-hidden="true" />{status}</div>
    </div>
    <div className="relative mt-10 h-3 rounded-full bg-white/10">
      <div className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
      <div className="absolute -top-2 h-7 w-px bg-white/60" style={{ left: `${TRIP_KM / FULL_RANGE * 100}%` }}><span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/60">Siem Reap</span></div>
    </div>
    <label className="mt-8 block">
      <span className="flex justify-between text-sm text-white/70"><span>Battery level</span><span className="font-medium text-white">{pct}%</span></span>
      <input type="range" min="5" max="100" value={pct} onChange={e => setPct(+e.target.value)} aria-label="Battery level percent" className="mt-3 w-full cursor-pointer accent-white !h-3" />
    </label>
    <p className="mt-6 text-xs text-white/40">Illustrative example with a {FULL_RANGE} km electric car. Your own vehicle profile is used in the planner.</p>
  </div>
}

function FooterLink({ href, onClick, external, children }) {
  return <li><a href={href} onClick={onClick ? e => { e.preventDefault(); onClick() } : undefined} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="inline-block py-1.5 text-sm text-white/55 transition hover:text-white">{children}</a></li>
}

export default function Landing({ onStart, onRoute }) {
  const [scrolled, setScrolled] = useState(false)
  const imgRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    const reduce = prefersReducedMotion()
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      setScrolled(y > 24)
      if (!reduce && imgRef.current && y < window.innerHeight * 1.3) imgRef.current.style.transform = `translate3d(0,${y * 0.22}px,0) scale(1.08)`
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  const btnPrimary = 'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
  const btnGhost = 'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/30 px-7 text-[15px] font-medium text-white transition duration-200 hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'

  return <div className="bg-black text-white antialiased">
    <div ref={barRef} aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-white" />

    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? 'border-b border-white/10 bg-black/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-[72px]">
        <a href="/" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }) }} className="flex items-center gap-2.5" aria-label="SmartRoute AI, back to top">
          <Logo className="h-7 w-7 text-white" />
          <span className="text-[17px] font-semibold tracking-tight">SmartRoute AI</span>
        </a>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
          <button onClick={() => goTo('features')} className="hidden min-h-[44px] rounded-full px-4 text-sm text-white/70 transition hover:text-white sm:block">Features</button>
          <button onClick={() => goTo('try')} className="hidden min-h-[44px] rounded-full px-4 text-sm text-white/70 transition hover:text-white sm:block">Try it</button>
          <button onClick={() => goTo('how')} className="hidden min-h-[44px] rounded-full px-4 text-sm text-white/70 transition hover:text-white sm:block">How it works</button>
          <button onClick={onStart} className="ml-1 inline-flex min-h-[44px] items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Launch app</button>
        </nav>
      </div>
    </header>

    <main>
      {/* Hero */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
        <picture className="absolute inset-0 -z-20">
          <source srcSet="/hero-angkor.webp" type="image/webp" />
          <img ref={imgRef} src="/hero-angkor.jpg" alt="Sunrise over Angkor Wat reflected in a pond, Siem Reap, Cambodia" width="2048" height="1030" fetchpriority="high" className="h-full w-full scale-[1.08] object-cover object-[50%_65%] will-change-transform [filter:saturate(.8)_contrast(1.05)]" />
        </picture>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-transparent to-black" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/55 via-black/5 to-transparent" />
        <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-32 sm:pb-24">
          <p className="lp-rise mb-5 text-xs font-medium uppercase tracking-[.25em] text-white/70" style={{ '--d': '100ms' }}>Cambodia trip planner</p>
          <h1 className="lp-rise max-w-4xl text-[clamp(2.75rem,7vw,5.75rem)] font-semibold leading-[1.02] tracking-tight" style={{ '--d': '200ms' }}>Every kilometer.<br />Smarter.</h1>
          <p className="lp-rise mt-6 max-w-xl text-lg leading-8 text-white/80" style={{ '--d': '350ms' }}>Plan road trips across Cambodia with confidence. See your vehicle’s real range, find charging and fuel stops, and know the cost before you go.</p>
          <div className="lp-rise mt-9 flex flex-wrap gap-3" style={{ '--d': '500ms' }}>
            <button onClick={onStart} className={btnPrimary}>Plan my trip <ArrowRight size={18} aria-hidden="true" /></button>
            <button onClick={() => goTo('try')} className={btnGhost}>Try the range demo</button>
          </div>
        </div>
        <button onClick={() => goTo('intro')} aria-label="Scroll down" className="absolute bottom-6 left-1/2 hidden h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-white/25 text-white/80 transition hover:bg-white/10 sm:grid"><ArrowDown size={18} className="lp-bob" aria-hidden="true" /></button>
      </section>

      {/* Intro */}
      <section id="intro" className="scroll-mt-16 bg-black px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <Reveal><p className="text-3xl font-medium leading-snug tracking-tight sm:text-5xl sm:leading-[1.15]">Built for Cambodia’s highways. <span className="text-white/45">Electric, hybrid, petrol, diesel or motorbike, SmartRoute AI turns your vehicle and route into a clear plan, so you never get caught between stations.</span></p></Reveal>
          <Reveal delay={150}>
            <dl className="mt-16 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
              <div className="flex flex-col-reverse"><dt className="mt-1 text-sm text-white/55">Station pins</dt><dd className="text-4xl font-semibold tracking-tight sm:text-6xl"><CountUp to={25} suffix="+" /></dd></div>
              <div className="flex flex-col-reverse"><dt className="mt-1 text-sm text-white/55">Powertrains</dt><dd className="text-4xl font-semibold tracking-tight sm:text-6xl"><CountUp to={5} /></dd></div>
              <div className="flex flex-col-reverse"><dt className="mt-1 text-sm text-white/55">Currencies</dt><dd className="text-4xl font-semibold tracking-tight sm:text-6xl">៛ / $</dd></div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Features (light section for rhythm) */}
      <section id="features" className="scroll-mt-16 bg-neutral-100 px-5 py-24 text-black sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal><h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Everything a long drive needs, in one place.</h2></Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: I, title, text }, i) => <Reveal key={title} delay={i * 120}>
              <article className="group h-full rounded-3xl bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,.06)] transition duration-300 hover:-translate-y-1.5 hover:bg-black hover:text-white hover:shadow-2xl">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black text-white transition group-hover:bg-white group-hover:text-black"><I size={22} aria-hidden="true" /></div>
                <h3 className="mt-8 text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 leading-7 text-neutral-600 transition group-hover:text-white/70">{text}</p>
              </article>
            </Reveal>)}
          </div>
        </div>
      </section>

      {/* Interactive demo */}
      <section id="try" className="scroll-mt-16 bg-black px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <Reveal><h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Will you make it?</h2><p className="mt-4 max-w-xl text-lg text-white/60">Drag the slider and see how your charge matches up against a real Cambodian highway trip.</p></Reveal>
          <Reveal delay={120} className="mt-12"><RangeDemo /></Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 bg-neutral-100 px-5 py-24 text-black sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal><h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Three steps. No guesswork.</h2></Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map(([n, t, d], i) => <li key={n}><Reveal delay={i * 120}>
              <div className="border-t-2 border-black pt-6"><div className="text-sm font-semibold tabular-nums text-neutral-500">{n}</div><h3 className="mt-3 text-2xl font-semibold tracking-tight">{t}</h3><p className="mt-2 leading-7 text-neutral-600">{d}</p></div>
            </Reveal></li>)}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-black px-5 py-28 text-center sm:py-40">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,.14),transparent_60%)]" />
        <Reveal>
          <MapPin size={28} className="mx-auto text-white/70" aria-hidden="true" />
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Plan ahead. Arrive prepared.</h2>
          <div className="mt-10"><button onClick={onStart} className={btnPrimary}>Launch SmartRoute AI <ArrowRight size={18} aria-hidden="true" /></button></div>
        </Reveal>
      </section>
    </main>

    <footer className="border-t border-white/10 bg-black px-5 pt-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5"><Logo className="h-7 w-7 text-white" /><span className="text-lg font-semibold tracking-tight">SmartRoute AI</span></div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">Highway range and trip-cost planning for Cambodia.</p>
            <a href={repo} target="_blank" rel="noopener noreferrer" aria-label="SmartRoute AI on GitHub" className="mt-6 grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/60 transition hover:border-white hover:text-white"><Github size={18} /></a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div><div className="mb-2 text-sm font-semibold">Planner</div><ul><FooterLink href="/vehicle" onClick={onStart}>Launch SmartRoute AI</FooterLink><FooterLink href="/vehicle" onClick={onStart}>Vehicle profile</FooterLink><FooterLink href="/route" onClick={onRoute}>Map &amp; route</FooterLink></ul></div>
            <div><div className="mb-2 text-sm font-semibold">Data &amp; maps</div><ul><FooterLink href="https://developers.google.com/maps/documentation/javascript" external>Google Maps &amp; Places</FooterLink><FooterLink href="https://developers.google.com/maps/documentation/javascript/routes/get-a-route" external>Google Routes</FooterLink><FooterLink href={repo + '/blob/main/src/data/places.js'} external>Station data</FooterLink></ul></div>
            <div><div className="mb-2 text-sm font-semibold">Project</div><ul><FooterLink href={repo} external>GitHub</FooterLink><FooterLink href={repo + '/issues'} external>Report an issue</FooterLink><FooterLink href="/sitemap.xml" external>Sitemap</FooterLink></ul></div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-white/10 py-6 text-xs leading-5 text-white/40"><span>© 2026 SmartRoute AI</span><span className="max-w-xl sm:text-right">Estimates only. Station data is a curated dataset, not a live directory. Verify fuel and charger availability before you travel.</span></div>
      </div>
    </footer>
  </div>
}
