"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_RECENT_POSTS } from "@/lib/queries";
import { LiquidLoader } from "./LiquidLoader";

export function PostsSpotlight() {
  const { data, loading, error } = useQuery(GET_RECENT_POSTS, {
    variables: { first: 3 },
    fetchPolicy: "no-cache",
  });

  if (loading) return <LiquidLoader message="Fetching stories…" />;

  if (error)
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error.message}
      </div>
    );

  const posts = data?.posts?.nodes ?? [];

  if (!posts.length)
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
        Stories now boarding — arriving shortly.
      </div>
    );

  return (
    <section className="space-y-6 relative">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 flex items-center gap-2">
            Portfolios
            <span className="inline-block h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
          </p>

          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Brand stories & case studies
          </h2>
        </div>

        <Link
          href="/post"
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 hover:bg-slate-900 hover:text-white transition"
        >
          View all
        </Link>
      </div>

      {/* Card Grid */}
  <div className="grid gap-6 md:grid-cols-3" >
  {
    posts.map((post: any) => (
      <Link
      key= { post.databaseId }
      href = {`/post/${post.slug}`}
  className = "group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-2xl"
    >
    {/* World map background texture */ }
    < div className = "absolute inset-0 pointer-events-none opacity-[0.08] bg-[url('/world-map.svg')] bg-cover bg-center" />

      {/* Side gradient strip */ }
      < div className = "absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 via-black-400 to-black opacity-80 transition group-hover:opacity-100" />

        <div className="relative z-10 p-5 space-y-3" >
          <p className="text-[0.65rem] uppercase tracking-[0.45em] text-slate-400" >
          {
            new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          }
            </p>

            < h3
  className = "text-lg font-bold text-slate-900 leading-snug line-clamp-2 transition group-hover:text-red-500"
  dangerouslySetInnerHTML = {{ __html: post.title }
}
        />

  < div
className = "line-clamp-3 text-sm text-slate-600"
dangerouslySetInnerHTML = {{ __html: post.excerpt }}
        />
  </div>

{/* Bottom “magazine footer” bar */ }
<div className="relative z-10 border-t border-slate-200 px-5 py-4 flex items-center justify-between text-sm font-semibold text-slate-700 opacity-70 transition group-hover:opacity-100" >
  <span className="uppercase tracking-[0.2em] text-xs" > Open story </span>
    < span className = "ml-2 transition group-hover:translate-x-1" >→</span>
      </div>
      </Link>
  ))}
</div>

    </section>
  );
}
