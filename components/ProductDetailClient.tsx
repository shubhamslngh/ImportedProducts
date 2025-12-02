"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import Image from "next/image";
import { motion } from "framer-motion";
import { GET_PRODUCT_DETAIL } from "@/lib/queries";
import { VariationsPanel } from "./VariationsPanel";
import { AddToCartButton } from "./AddToCartButton";
import { LiquidLoader } from "./LiquidLoader";

interface ProductDetailClientProps {
  productId: number;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCT_DETAIL, {
    variables: { id: productId },
    skip: !productId,

  });

  const product = data?.product;
  // console.log("Product data:", product);  

  const gallery = product?.galleryImages?.nodes ?? [];
  const [heroImage, setHeroImage] = useState<string>("");
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(
    null
  );
  const [selectedVariationPriceHtml, setSelectedVariationPriceHtml] =
    useState<string | null>(null);

  useEffect(() => {
    if (product?.image?.sourceUrl) {
      setHeroImage(product.image.sourceUrl);
    } else if (gallery[0]?.sourceUrl) {
      setHeroImage(gallery[0].sourceUrl);
    }

  }, [product?.image?.sourceUrl, gallery[0]?.sourceUrl]);

  useEffect(() => {
    setSelectedVariationId(null);
    setSelectedVariationPriceHtml(null);
  }, [product?.databaseId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl"
      >
        <LiquidLoader message="Loading product…" />
      </motion.div>
    );
  }

if (error || !product) {
  return (
    <div className= "rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700" >
    <p className="font-semibold" > Unable to load this drop.</p>
      < p className = "text-sm" > { error?.message ?? "Please refresh to try again."
} </p>
  < button
type = "button"
onClick = {() => refetch()}
className = "mt-4 inline-flex items-center rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white"
  >
  Retry
  </button>
  </div>
    );
  }

const description = stripHtml(product.description || "");
const shortDescription = stripHtml(product.shortDescription || "");
const resolvedPriceHtml = selectedVariationPriceHtml ?? product.price ?? null;
const fallbackPriceText = resolvedPriceHtml
  ? null
  : product.salePrice ?? product.regularPrice ?? null;
const isVariableProduct =
  (product?.type ? product.type.toUpperCase() : "") === "VARIABLE";

const handleVariationSelected = (
  selection:
    | {
        variationId: number | null;
        image?: string | null;
        priceHtml?: string | null;
      }
    | null
) => {
  setSelectedVariationId(selection?.variationId ?? null);
  setSelectedVariationPriceHtml(selection?.priceHtml ?? null);

  if (selection?.image) {
    setHeroImage(selection.image);
  } else if (product?.image?.sourceUrl) {
    setHeroImage(product.image.sourceUrl);
  } else if (gallery[0]?.sourceUrl) {
    setHeroImage(gallery[0].sourceUrl);
  } else {
    setHeroImage("");
  }
};

return (
  <div className= "space-y-10" >
  {/* ---------- MAIN GRID ---------- */ }
  < div className = "grid gap-10 lg:grid-cols-[1.1fr,0.9fr]" >

    {/* ---------- LEFT : IMAGES ---------- */ }
    < motion.div
initial = {{ opacity: 0, x: -30 }}
animate = {{ opacity: 1, x: 0 }}
transition = {{ duration: 0.5 }}
className = "space-y-4"
  >
  {/* Hero Image */ }
  < motion.div
whileHover = {{ scale: 1.03 }}
transition = {{ duration: 0.4 }}
className = "relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-xl"
  >
  {
    heroImage?(
              <Image
                src = { heroImage }
                alt = { product.name }
                width = { 480}
                height = { 480}
                className = "mx-auto h-[420px] w-full max-w-[420px] object-contain"
        />
            ): (
        <div className = "flex h-[420px] items-center justify-center text-slate-400">
                Image coming soon
      </ div >
            )}
</motion.div>

{/* Thumbnails */ }
{
  gallery.length > 1 && (
    <motion.div
              initial="hidden"
  animate = "visible"
  variants = {{
    hidden: { },
    visible: { transition: { staggerChildren: 0.08 } },
  }}
className = "flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
  >
{
  gallery.map((image: any) => (
    <motion.button
                  variants= {{
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }}
key = { image.id }
type = "button"
onClick = {() => setHeroImage(image.sourceUrl)}
className = "h-20 w-20 shrink-0 rounded-2xl border border-slate-200 bg-white p-2 hover:opacity-80 transition"
  >
  <Image
                    src={ image.sourceUrl }
alt = { image.altText || product.name }
width = { 80}
height = { 80}
className = "h-full w-full object-contain"
  />
  </motion.button>
              ))}
</motion.div>
          )}

{/* Variations Panel */}
{isVariableProduct && (
  <div className="rounded-[2rem] border border-slate-100 bg-white/90 p-6 shadow-lg">
    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
      Variations
    </p>
    <div className="mt-4">
      <VariationsPanel
        productId={product.databaseId}
        productType={product.type}
        onVariationSelected={handleVariationSelected}
      />
    </div>
  </div>
)}
</motion.div>

{/* ---------- RIGHT : PRODUCT DETAILS ---------- */ }
<motion.div
          initial={ { opacity: 0, x: 30 } }
animate = {{ opacity: 1, x: 0 }}
transition = {{ duration: 0.55 }}
className = "space-y-6"
  >
  <p className="text-xs uppercase tracking-[0.4em] text-slate-400" >
    Product details
      </p>

{/* Title + Price */ }
<div>
  <h1 className="text-4xl font-bold" > { product.name } </h1>
{
  resolvedPriceHtml ? (
    <motion.p
                  initial={ { opacity: 0, y: 5 } }
    animate = {{ opacity: 1, y: 0 }
}
transition = {{ delay: 0.15 }}
className = "text-2xl font-semibold mt-1"
dangerouslySetInnerHTML = {{ __html: resolvedPriceHtml }}
                />
              ) : fallbackPriceText ? (
    <motion.p
                  initial={ { opacity: 0, y: 5 } }
    animate = {{ opacity: 1, y: 0 }}
    transition = {{ delay: 0.15 }}
    className = "text-2xl font-semibold mt-1"
  >
  { fallbackPriceText }
  </motion.p>
              ) : null
}
</div>

{/* Description */ }
{
  description && (
    <p className="text-base text-slate-600 leading-relaxed" >
      { description }
      </p>
          )
}

{/* Attributes */ }
<div className="grid gap-3 sm:grid-cols-3" >
{
  product.attributes?.nodes?.slice(0, 3).map((attr: any) => (
    <motion.article
                initial= {{ opacity: 0, y: 8 }}
animate = {{ opacity: 1, y: 0 }}
key = { attr.name }
className = "rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur"
  >
  <p className="text-xs uppercase tracking-[0.3em] text-slate-400" >
    { attr.label || attr.name }
    </p>
    < p className = "mt-2 text-sm font-semibold text-slate-900" >
    {
      Array.isArray(attr.options)
        ? attr.options.join(", ")
        : attr.options
    }
      </p>
      </motion.article>
            ))}
</div>
  {/* Add to Cart */ }
  < motion.div
whileTap = {{ scale: 0.97 }}
className = "pt-4"
  >
  <AddToCartButton
              productId={ product.databaseId }
variationId = { selectedVariationId ?? undefined}
productName = { product.name }
priceHtml = { resolvedPriceHtml ?? fallbackPriceText }
image = { heroImage }
requiresSelection = { isVariableProduct }
  />
  </motion.div>
  </motion.div>
  </div>

{/* ---------- LOWER DETAILS ---------- */ }
<motion.div
        initial={ { opacity: 0 } }
animate = {{ opacity: 1 }}
transition = {{ delay: 0.2 }}
className = "rounded-[2rem] border border-slate-100 bg-white/90 p-8 shadow-xl backdrop-blur"
  >
  <div className="grid gap-8 lg:grid-cols-2" >

    {/* Why you will love it */ }
    < article className = "space-y-3" >
      <h2 className="text-2xl font-semibold" > Why you will love it </h2>
        < p className = "text-sm text-slate-600" >
        {
          shortDescription.length > 0
            ? shortDescription
            : "Designed for intentional everyday use with premium finishes, express fulfilment, and concierge care."
        }
          </p>
          </article>

{/* Specs */ }
<article className="space-y-3" >
  <h2 className="text-2xl font-semibold" > Specs & materials </h2>

    < div className = "grid gap-3" >
    {
      product.attributes?.nodes?.map((attr: any) => (
        <dl
                  key= { attr.name }
                  className = "rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur"
        >
        <dt className="text-xs uppercase tracking-[0.3em] text-slate-400" >
        { attr.label || attr.name }
        </dt>
      < dd className = "mt-2 text-sm font-semibold text-slate-900" >
      {
        Array.isArray(attr.options)
          ? attr.options.join(", ")
          : attr.options
      }
      </dd>
      </dl>
      ))
    }

{
  !(product.attributes?.nodes?.length > 0) && (
    <p className="text-sm text-slate-500" >
      Specs will appear once the drop is finalized.
                </p>
              )
}
</div>
  </article>
  </div>
  </motion.div>
  </div>
  );
}

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
