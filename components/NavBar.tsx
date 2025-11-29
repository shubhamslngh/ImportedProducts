"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useSession } from "@/lib/session-context";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/#categories", label: "Categories" },
  // { href: "/contact", label: "Concierge" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { status: sessionStatus, user, clearSession } = useSession();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    router.push("/");
    setDrawerOpen(false);
  };

  return (
    <>
    <header className= "sticky top-0 z-40 w-full border-b border-white/10 bg-[#070919]/95 text-white backdrop-blur" >
    <div className="mx-auto flex-wrap flex max-w-screen items-center justify-between px-4 py-4" >

      {/* LEFT SIDE — BRAND */ }
      < div className = "flex items-center gap-4" >
        <motion.div
            initial={ { x: -140, opacity: 0 } }
  animate = {{ x: 0, opacity: 1 }
}
transition = {{ duration: 0.6, ease: "easeOut" }}
className = "flex flex-col leading-none"
  >
  <Link href="/" className = "text-lg font-black tracking-[0.35em]" >
    IMPORTED
    </Link>
    < Link href = "/" className = "text-lg font-black tracking-[0.35em] text-red-500" >
      PRODUCTS
      </Link>
      </motion.div>

      < motion.p
className = "md:block pt-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/50"
initial = {{ opacity: 0 }}
animate = {{ opacity: 1 }}
transition = {{ delay: 0.45, duration: 0.6 }}
          >
  concierge drops · express fulfilment
    </motion.p>
    </div>

<motion.nav
          className="hidden md:flex gap-4"
initial = "hidden"
animate = "visible"
variants = {{
  hidden: { },
  visible: { transition: { staggerChildren: 0.12 } },
}}
        >
{
  NAV_LINKS.map((link) => (
    <motion.div
              key= { link.href }
              variants = {{
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0 },
  }}
  >
  <Link
                href={ link.href }
className = {
  clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
    pathname === link.href ? "bg-white text-slate-900" : "text-white/70 hover:text-white"
                )}
              >
  { link.label }
  </Link>
  </motion.div>
          ))}
</motion.nav>

{/* MOBILE MENU BUTTON */ }
<button
          className="md:hidden p-2"
onClick = {() => setDrawerOpen(true)}
        >
  <Menu size={ 22 } />
    </button>

{/* DESKTOP RIGHT SIDE */ }
<motion.div
          className="hidden md:flex items-center gap-3"
initial = {{ opacity: 0 }}
animate = {{ opacity: 1 }}
transition = {{ delay: 0.7, duration: 0.6 }}
        >
  <Link
            href="/cart"
className = "relative inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-slate-900"
  >
  Cart
{
  totalItems > 0 && (
    <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-white/90 px-1 text-[0.65rem] font-black text-slate-900" >
      { totalItems }
      </span>
            )
}
</Link>

{
  sessionStatus === "authenticated" ? (
    <div className= "flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]" >
    <span className="text-white/70" > { user?.displayName ?? user?.username ?? "Account"
} </span>
  < button
type = "button"
onClick = { handleLogout }
className = "rounded-full bg-white/20 px-2 py-1 text-[0.55rem] font-black uppercase text-white transition hover:bg-white/40"
  >
  Logout
  </button>
  </div>
          ) : (
  <>
  <Link
                href= "/login"
className = "rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] hover:bg-white hover:text-slate-900"
  >
  Login
  </Link>
 
    </>
          )}
</motion.div>
  </div>
  </header>

{/* MOBILE DRAWER */ }
<AnimatePresence>
  { drawerOpen && (
    <>
    {/* Overlay */ }
    < motion.div
              className = "fixed inset-0 bg-black/60 backdrop-blur-lg z-40"
initial = {{ opacity: 0 }}
animate = {{ opacity: 1 }}
exit = {{ opacity: 0 }}
onClick = {() => setDrawerOpen(false)}
            />

{/* Drawer panel */ }
<motion.div
              className="fixed top-0 right-0 h-full w-[80%] max-w-xs bg-[#0b0d16] border-l border-white/10 text-white p-6 z-50 shadow-2xl flex flex-col"
initial = {{ x: "100%" }}
animate = {{ x: 0 }}
exit = {{ x: "100%" }}
transition = {{ type: "spring", stiffness: 280, damping: 28 }}
            >
  {/* Header */ }
  < div className = "flex items-center justify-between mb-6" >
    <p className="text-lg font-semibold" > Menu </p>
      < button onClick = {() => setDrawerOpen(false)}>
        <X size={ 22 } />
          </button>
          </div>

{/* Nav links */ }
<div className="flex flex-col gap-4" >
{
  NAV_LINKS.map((link) => (
    <Link
                    key= { link.href }
                    href = { link.href }
                    onClick = {() => setDrawerOpen(false)}
className = {
  clsx(
                      "rounded-md px-2 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition",
    pathname === link.href ? "text-emerald-300" : "text-white/80"
                    )}
                  >
  { link.label }
  </Link>
                ))}
</div>

  < div className = "border-t border-white/10 my-6" />

    {/* Cart */ }
    < Link
href = "/cart"
onClick = {() => setDrawerOpen(false)}
className = "flex items-center justify-between border border-white/20 px-3 py-3 rounded-xl mb-4"
  >
  <span>Cart </span>
{
  totalItems > 0 && (
    <span className="bg-white text-slate-900 font-black rounded-full text-xs px-2 py-1" >
      { totalItems }
      </span>
                )
}
</Link>

{/* Auth */ }
{
  sessionStatus === "authenticated" ? (
    <div className= "flex flex-col gap-3" >
    <p className="text-white/70 text-sm uppercase tracking-widest" >
      { user?.displayName ?? user?.username
}
</p>

  < button
onClick = { handleLogout }
className = "rounded-lg bg-white/20 px-3 py-2 text-sm uppercase tracking-[0.2em] hover:bg-white/40"
  >
  Logout
  </button>
  </div>
              ) : (
  <div className= "flex flex-col gap-3" >
  <Link
                    href="/login"
onClick = {() => setDrawerOpen(false)}
className = "rounded-lg border border-white/20 px-3 py-2 text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900"
  >
  Login
  </Link>
    </div>
              )}
</motion.div>
  </>
        )}
</AnimatePresence>
    </>
  );
}
