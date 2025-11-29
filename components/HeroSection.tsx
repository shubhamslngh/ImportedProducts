"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_HERO_METRICS } from "@/lib/queries";

export function HeroSection() {
  // 🔹 GraphQL: live metrics from WordPress/Woo
  const { data, loading, error } = useQuery(GET_HERO_METRICS, {
    fetchPolicy: "cache-first",
  });

  // 🔹 Fallback static values (used if no data yet)
  const fallbackHighlights = [
    { label: "Destination hubs", value: 42, suffix: "+", note: "Retail partners across MEA, EU & SEA" },
    { label: "Customs clearance", value: 72, suffix: "h", note: "Average door-to-port turnaround" },
    { label: "QC accuracy", value: 99.6, suffix: "%", note: "Audit-ready documentation & packing" },
  ];

  const badges = [
    "End-to-end export concierge",
    "DUTY + compliance playbooks",
    "Temperature & shock logging",
    "BIS / CE ready paperwork",
  ];

  // 🔹 Map API data → highlight cards
  const highlights = useMemo(() => {
    if (!data?.products || !data?.productCategories || !data?.posts) {
      return fallbackHighlights;
    }

    const totalProducts =
      data.products?.pageInfo?.offsetPagination?.total ?? fallbackHighlights[0].value;
    const totalCategories =
      data.productCategories?.pageInfo?.offsetPagination?.total ?? 7;
    const totalStories =
      data.posts?.pageInfo?.offsetPagination?.total ?? 10;

    return [
      {
        label: "Live SKUs",
        value: totalProducts,
        suffix: "",
        note: "Import-ready products on the shelf",
      },
      {
        label: "Active corridors",
        value: totalCategories,
        suffix: "",
        note: "Buyer-facing categories live",
      },
      {
        label: "Stories shipped",
        value: totalStories,
        suffix: "+",
        note: "Dispatches from our concierge desk",
      },
    ];
  }, [data]);

  // 🔹 Counter animation for highlights
  const [counts, setCounts] = useState<number[]>(() =>
    highlights.map(() => 0)
  );

  useEffect(() => {
    // reset when highlights change (e.g. when data arrives)
    setCounts(highlights.map(() => 0));

    const intervals = highlights.map((h, idx) =>
      setInterval(() => {
        setCounts((prev) => {
          const updated = [...prev];
          if (updated[idx] < h.value) {
            const step = h.value / 40; // tweak for speed
            const next = updated[idx] + step;
            updated[idx] = Number(
              (next > h.value ? h.value : next).toFixed(1)
            );
          }
          return updated;
        });
      }, 40)
    );

    return () => intervals.forEach(clearInterval);
  }, [highlights]);

  return (
    <section className= "relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#05060f] via-[#051336] to-[#0c2e49] text-white shadow-2xl" >
    {/* Floating particle shimmer */ }
    < motion.div
  className = "absolute inset-0 pointer-events-none opacity-30"
  animate = {{ backgroundPosition: ["0% 0%", "100% 100%"] }
}
transition = {{ duration: 18, repeat: Infinity, ease: "linear" }}
style = {{
  backgroundImage:
  "radial-gradient(circle at 20% 20%, rgba(76,219,196,0.28) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(0,150,255,0.25) 0%, transparent 65%)",
    backgroundSize: "200% 200%",
        }}
      />

{/* Background glow */ }
<div className="absolute  inset-0 bg-[radial-gradient(circle_at_top,_rgba(76,219,196,0.25),_transparent_55%)] opacity-80 blur-3xl" />

  <div className="relative opacity-[1] bg-[url('/world.svg')] bg-cover bg-center grid gap-10 p-8 md:p-12 lg:grid-cols-[1.15fr,0.85fr]" >
    {/* LEFT SIDE */ }
    < motion.div
initial = {{ opacity: 0, x: -25 }}
animate = {{ opacity: 1, x: 0 }}
transition = {{ duration: 0.7 }}
className = "space-y-7"
  >
  {/* LIVE Badge */ }
  < motion.span
initial = {{ opacity: 0, y: 8 }}
animate = {{ opacity: 1, y: 0 }}
transition = {{ delay: 0.2 }}
className = "inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70"
  >
  Export corridor update
    < motion.span
className = "text-[0.5rem] text-emerald-300"
animate = {{ opacity: [0.2, 1, 0.2] }}
transition = {{ duration: 1.4, repeat: Infinity }}
            >
              ●
</motion.span>
{ loading ? "Syncing…" : "Live" }
</motion.span>

{/* Title */ }
<motion.h1
            initial={ { opacity: 0, y: 12 } }
animate = {{ opacity: 1, y: 0 }}
transition = {{ delay: 0.3, duration: 0.7 }}
className = "text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl"
  >
  India & apos;s friendly export desk for lifestyle hardware.
          </motion.h1>

          {/* Description */ }
  < motion.p
            initial = {{ opacity: 0, y: 10 }}
animate = {{ opacity: 1, y: 0 }}
transition = {{ delay: 0.4 }}
className = "text-base text-white/80 max-w-xl"
  >
  Consolidate premium accessories, finish compliance, and hand off to our ocean & air network. 
            We choreograph every pallet so your overseas buyers just see ready - to - shelf stock.
          </motion.p>

{/* CTA Buttons */ }
<div className="flex flex-wrap gap-4" >
  <motion.a
              whileHover={ { y: -3, scale: 1.02 } }
whileTap = {{ scale: 0.97 }}
href = "#categories"
className = "inline-flex items-center rounded-full bg-white/95 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg"
  >
  Plan a shipment
    </motion.a>

    < motion.a
whileHover = {{ y: -3, scale: 1.02 }}
whileTap = {{ scale: 0.97 }}
href = "#spotlight"
className = "inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white/90"
  >
  Review product lines →
</motion.a>
  </div>

{/* BADGES */ }
<motion.ul
            initial="hidden"
animate = "visible"
variants = {{
  hidden: { },
  visible: { transition: { staggerChildren: 0.12 } },
}}
className = "grid gap-2 sm:grid-cols-2"
  >
{
  badges.map((badge) => (
    <motion.li
                key= { badge }
                variants = {{
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  }}
className = "flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85"
  >
  <span className="text-emerald-300" >↺</span>
{ badge }
</motion.li>
            ))}
</motion.ul>
  </motion.div>

{/* RIGHT SIDE : HIGHLIGHTS */ }
<motion.div
          initial={ { opacity: 0, x: 25 } }
animate = {{ opacity: 1, x: 0 }}
transition = {{ duration: 0.7 }}
className = "grid gap-4 text-center items-center sm:grid-cols-3"
  >
{
  highlights.map((highlight, i) => (
    <motion.article
              key= { highlight.label }
              initial = {{ opacity: 0, y: 12 }}
animate = {{ opacity: 1, y: 0 }}
transition = {{ delay: 0.2 + i * 0.2 }}
className = "rounded-3xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur"
  >
  <p className="text-3xl font-black" >
    { counts[i].toFixed(1) }
{ highlight.suffix }
</p>
  < p className = "text-xs uppercase tracking-widest text-white/70" >
    { highlight.label }
    </p>
    < p className = "text-sm text-white/70" > { highlight.note } </p>
      </motion.article>
          ))}
</motion.div>
  </div>
  </section>
  );
}
