"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_RECENT_POSTS } from "@/lib/queries";
import { LiquidLoader } from "@/components/LiquidLoader";
import { motion } from "framer-motion";

export default function AllPostsPage() {
    const { data, loading, error } = useQuery(GET_RECENT_POSTS, {
        variables: { first: 20 },
        fetchPolicy: "no-cache",
    });

    if (loading) {
        return (
            <div className= "flex justify-center py-20" >
            <LiquidLoader message="Fetching brand brochures…" />
                </div>
    );
    }

    if (error) {
        return (
            <div className= "mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700 mt-10" >
            { error.message }
            </div>
    );
    }

    const posts = data?.posts?.nodes ?? [];

    return (
        <main className= "mx-auto max-w-6xl px-4 py-10 space-y-10" >
        {/* HEADER */ }
        < header className = "space-y-2 text-center" >
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400" >
                Brand Portfolio
                    </p>

                    < h1 className = "text-3xl font-extrabold text-slate-900" >
                        Collaboration Brochures
                            </h1>

                            < p className = "text-sm text-slate-500 max-w-xl mx-auto" >
                                Discover brands we collaborate with — product lines, export readiness,
                                    compliance proofing, and logistics case studies.
        </p>
                                        </header>

    {/* GRID */ }
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" >
    {
        posts.map((post: any, idx: number) => (
            <motion.div
            key= { post.databaseId }
            initial = {{ opacity: 0, y: 30 }}
    animate = {{ opacity: 1, y: 0 }
}
transition = {{ delay: idx * 0.07 }}
          >
    <Link
              href={ `/post/${post.slug}` }
className = "group block h-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
    >
    {/* IMAGE */ }
    < div className = "relative h-48 w-full overflow-hidden" >
    {
        post.featuredImage?.node?.sourceUrl && (
            <Image
                    src={ post.featuredImage.node.sourceUrl }
alt = { post.featuredImage.node.altText || post.title }
fill
className = "object-cover transition group-hover:scale-105"
    />
                )}
</div>

{/* CONTENT */ }
<div className="p-5 space-y-3" >
    {/* Brand Tag */ }
    < p className = "text-[0.6rem] uppercase tracking-[0.25em] text-slate-400" >
        Portfolio Brochure
            </p>

{/* Title */ }
<h3
                  className="text-lg font-semibold text-slate-900 line-clamp-2 group-hover:text-red-600"
dangerouslySetInnerHTML = {{ __html: post.title }}
                />

{/* Short summary */ }
<p
                  className="text-sm text-slate-600 line-clamp-3"
dangerouslySetInnerHTML = {{ __html: post.excerpt }}
                />

{/* CTA */ }
<p className="pt-2 text-sm font-medium text-slate-900 group-hover:text-red-500" >
    Open brochure →
</p>
    </div>
    </Link>
    </motion.div>
        ))}
</div>
    </main>
  );
}
