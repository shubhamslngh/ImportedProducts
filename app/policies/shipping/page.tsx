"use client";

import { PageWrapper } from "@/components/PageWrapper";
import { PageSection } from "@/components/PageSection";

const content = [
  {
    title: "Customs-first shipping philosophy",
    body: "Every consignment ships only after we review the import/export paperwork relevant to your country of destination. Duties, taxes, and compliance checks (BIS, CE, FSSAI, etc.) are calculated per shipment and billed separately.",
  },
  {
    title: "Lead times & carriers",
    body: "Dispatch windows depend on the product category and the mode you choose (air vs. ocean freight). Most lifestyle consignments leave within 3-5 working days once funds clear, while larger palletized orders might need 7-10 days to align with forwarders.",
  },
  {
    title: "Returns & exchanges",
    body: "Because each order is custom-imported for your business, returns are evaluated case by case. If an item arrives damaged or not as described, contact the concierge desk within 48 hours so we can inspect, file claims, and initiate replacements when feasible.",
  },
  {
    title: "Regulatory scope",
    body: "All buyers are responsible for ensuring the goods are legal to import into their country. Our team assists with HS codes, valuation, and advisory, but local duties and compliance fees are always billed back to the buyer.",
  },
  {
    title: "Support channel",
    body: "For any shipping or returns question, WhatsApp the concierge team at +91 89511 30779 or email hello@importedproducts.in with your order number, invoice, and supporting photos.",
  },
];

export default function ShippingPolicyPage() {
  return (
    <main className="flex flex-col gap-8 py-6">
      <PageWrapper>
        <PageSection>
          <div className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Policies</p>
            <h1 className="text-4xl font-bold">Shipping & returns</h1>
            <p className="text-sm text-slate-500">
              Import & export timelines vary per consignment. These guidelines outline what to expect for every drop handled by the concierge team.
            </p>
          </div>
        </PageSection>
        <PageSection>
          <div className="space-y-6">
            {content.map((section) => (
              <article key={section.title} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{section.body}</p>
              </article>
            ))}
          </div>
        </PageSection>
      </PageWrapper>
    </main>
  );
}
