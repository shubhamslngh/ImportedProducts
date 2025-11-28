import Link from "next/link";

export function SiteFooter() {
  const sections = [
    {
      title: "Need help?",
      items: [
        { label: "WhatsApp concierge", href: "https://wa.me/918951130779" },
        { label: "Email support", href: "mailto:hello@importedproducts.in" },
        { label: "Shipping & returns", href: "/policies/shipping" },
      ],
    },
    {
      title: "Explore",
      items: [
        { label: "All products", href: "/products" },
        { label: "Upcoming drops", href: "/#spotlight" },
        { label: "Stories", href: "/post" },
        { label: "My account", href: "/account" },
      ],
    },
    {
      title: "Visit us",
      items: [
        {
          label: "TechsNTechs, Lucknow",
          href: "https://maps.google.com/?q=TechsNTechs",
        },
        { label: "+91 9450944877", href: "tel:+919450944877" },
      ],
    },
  ];

  const year = new Date().getFullYear();

  const isExternal = (href: string) =>
    href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/80 py-12 text-sm text-slate-600">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:justify-between">
      {/* Brand + Copy */ }
      < div className = "space-y-3 max-w-md" >
        <div className="leading-tight" >
          <p className="text-base font-black tracking-[0.35em] text-slate-900" >
            IMPORTED
            </p>
            < p className = "text-base font-black tracking-[0.35em] text-red-500" >
              PRODUCTS
              </p>
              </div>
              <p>
            Premium tech and lifestyle imports with concierge - level support,
    curated drops, and fast dispatch from India for your global buyers.
          </p>
      < p className = "text-xs uppercase tracking-[0.3em] text-slate-400" >
            © { year } Imported Products
    </p>
    </div>

  {/* Link sections */ }
  <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3" >
  {
    sections.map((section) => (
      <div key= { section.title } className = "space-y-3" >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400" >
      { section.title }
      </p>
    < ul className = "space-y-2" >
    {
      section.items.map((item) => {
        const external = isExternal(item.href);

        return (
          <li key= { item.label } >
          {
            external?(
                        <a
                          href = { item.href }
                          target = { item.href.startsWith("http") ? "_blank" : undefined }
                          rel = { item.href.startsWith("http") ? "noreferrer" : undefined }
                          className = "text-slate-600 transition hover:text-slate-900"
                >
                { item.label }
                </a>
            ): (
                <Link
                          href = {item.href}
        className = "text-slate-600 transition hover:text-slate-900"
          >
          { item.label }
          </Link>
                      )
    }
    </li>
    );
  })
}
</ul>
  </div>
          ))}
</div>
  </div>
  </footer>
  );
}
