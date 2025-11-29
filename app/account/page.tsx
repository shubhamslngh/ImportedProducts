"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { LiquidLoader } from "@/components/LiquidLoader";
import { PageWrapper } from "@/components/PageWrapper";
import { PageSection } from "@/components/PageSection";
import { GET_ACCOUNT_OVERVIEW, UPDATE_BILLING_DETAILS, GET_COUNTRIES, UPDATE_SHIPPING_DETAILS } from "@/lib/queries";
import { useSession } from "@/lib/session-context";
import { useSnackbar } from "@/components/SnackbarProvider";

function formatDate(date?: string | null) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return date;
  }
}

function AddressBlock({ title, address }: { title: string; address?: any }) {
  if (!address) {
    return (
      <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{title}</p>
        <p className="mt-2 text-sm text-slate-500">No address on file.</p>
      </article>
    );
  }

  const lines = [
    [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.address1,
    address.address2,
    [address.city, address.state, address.postcode].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter(Boolean);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{title}</p>
      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        {lines.map((line: string) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </article>
  );
}

export default function AccountPage() {
  const { status: sessionStatus, authToken, user } = useSession();
  const { showSnackbar } = useSnackbar();
  const customerId =
    typeof user?.databaseId === "number"
      ? user.databaseId
      : user?.databaseId
      ? Number(user.databaseId)
      : null;
  const shouldFetch = sessionStatus === "authenticated" && Boolean(authToken) && Boolean(customerId);

  const { data, loading, error, refetch } = useQuery(GET_ACCOUNT_OVERVIEW, {
    skip: !shouldFetch,
    fetchPolicy: "no-cache",
    variables: { customerId },
    context: shouldFetch
      ? {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      : undefined,
  });

  const { data: countriesData } = useQuery(GET_COUNTRIES, { fetchPolicy: "cache-first" });
  const countries = countriesData?.countries ?? [];
  const customer = data?.customer ?? null;
  const orders = useMemo(() => customer?.orders?.nodes ?? [], [customer]);
  const [saveBilling, { loading: savingBilling }] = useMutation(UPDATE_BILLING_DETAILS);
  const [saveShipping, { loading: savingShipping }] = useMutation(UPDATE_SHIPPING_DETAILS);
  const [billingForm, setBillingForm] = useState({
    firstName: "",
    lastName: "",
    country: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    phone: "",
    email: "",
  });
  const [shippingForm, setShippingForm] = useState({
    firstName: "",
    lastName: "",
    country: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    phone: "",
  });

  const requiringLogin = sessionStatus !== "authenticated";
  const missingCustomerId = sessionStatus === "authenticated" && !customerId;

  useEffect(() => {
    if (error) {
      showSnackbar("Unable to load account details.", { variant: "error" });
    }
  }, [error, showSnackbar]);

  useEffect(() => {
    if (!customer) return;
    setBillingForm({
      firstName: customer.billing?.firstName ?? "",
      lastName: customer.billing?.lastName ?? "",
      country: customer.billing?.country ?? "",
      address1: customer.billing?.address1 ?? "",
      address2: customer.billing?.address2 ?? "",
      city: customer.billing?.city ?? "",
      state: customer.billing?.state ?? "",
      postcode: customer.billing?.postcode ?? "",
      phone: customer.billing?.phone ?? "",
      email: customer.email ?? user?.email ?? "",
    });
    setShippingForm({
      firstName: customer.shipping?.firstName ?? "",
      lastName: customer.shipping?.lastName ?? "",
      country: customer.shipping?.country ?? "",
      address1: customer.shipping?.address1 ?? "",
      address2: customer.shipping?.address2 ?? "",
      city: customer.shipping?.city ?? "",
      state: customer.shipping?.state ?? "",
      postcode: customer.shipping?.postcode ?? "",
      phone: customer.shipping?.phone ?? customer.billing?.phone ?? "",
    });
  }, [customer, user]);

  const handleBillingChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setBillingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerId || !authToken) return;
    try {
      await saveShipping({
        variables: {
          customerId: String(customerId),
          shipping: {
            firstName: shippingForm.firstName,
            lastName: shippingForm.lastName,
            country: shippingForm.country,
            address1: shippingForm.address1,
            address2: shippingForm.address2,
            city: shippingForm.city,
            state: shippingForm.state,
            postcode: shippingForm.postcode,
            phone: shippingForm.phone,
          },
        },
        context: {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      });
      showSnackbar("Shipping details updated.", { variant: "success" });
      refetch();
    } catch (mutationError: any) {
      console.error(mutationError);
      showSnackbar("Could not update shipping address.", { variant: "error" });
    }
  };

  const renderCountryOptions = () =>
    countries.map((country: any) => {
      const value = country;
      const label = country;
      return (
        <option key={value || label} value={value}>
          {label}
        </option>
      );
    });

  const handleBillingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerId || !authToken) return;
    try {
      await saveBilling({
        variables: {
          customerId: String(customerId),
          billing: {
            firstName: billingForm.firstName,
            lastName: billingForm.lastName,
            country: billingForm.country,
            address1: billingForm.address1,
            address2: billingForm.address2,
            city: billingForm.city,
            state: billingForm.state,
            postcode: billingForm.postcode,
            phone: billingForm.phone,
          },
          email: billingForm.email,
        },
        context: {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      });
      showSnackbar("Billing details updated.", { variant: "success" });
      refetch();
    } catch (mutationError: any) {
      console.error(mutationError);
      showSnackbar("Could not update billing address.", { variant: "error" });
    }
  };

  return (
    <main className="flex flex-col gap-8 py-6">
      <PageWrapper>
        <PageSection>
          {sessionStatus === "loading" && <LiquidLoader message="Checking session…" />}
          {requiringLogin && sessionStatus !== "loading" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-900">Your account needs a quick sign in.</p>
              <p className="mt-1 text-sm">
                Review orders, update addresses, and manage concierge services once you are logged in.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Go to login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
          {missingCustomerId && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-900">We could not find your customer profile.</p>
              <p className="mt-1 text-sm">
                Please log out and sign back in so we can resync your WooCommerce account metadata.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600"
                >
                  Refresh page
                </button>
              </div>
            </div>
          )}
          {!requiringLogin && !missingCustomerId &&(
            <div className="space-y-2 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-slate-400">My account</p>
              <h1 className="text-4xl font-bold">Welcome back, {customer?.displayName ?? user?.username ?? "friend"}.</h1>
              <p className="text-sm text-slate-500">
                Track orders, manage addresses, and reach the concierge team for priority service.
              </p>
            </div>
          )}
        </PageSection>

        {!requiringLogin && !missingCustomerId && (
          <PageSection>
            {loading && <LiquidLoader message="Loading your account…" />}
            {error && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700">
                <p className="font-semibold">Unable to load account details.</p>
                <p className="text-sm">{error.message}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                <section className="grid gap-4 lg:grid-cols-3">
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Profile</p>
                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p className="text-base font-semibold text-slate-900">
                        {customer?.firstName || customer?.lastName
                          ? `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim()
                          : customer?.displayName ?? user?.username}
                      </p>
                      <p>{customer?.email ?? user?.email ?? "No email"}</p>
                      <p className="text-xs text-slate-400">Customer #{customer?.databaseId ?? "—"}</p>
                    </div>
                  </article>
                  <AddressBlock title="Billing address" address={customer?.billing} />
                  <AddressBlock title="Shipping address" address={customer?.shipping} />
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Billing address</p>
                      <h2 className="text-2xl font-semibold">Edit details</h2>
                    </div>
                  </div>
                  <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleBillingSubmit}>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">First name *</label>
                      <input
                        required
                        name="firstName"
                        value={billingForm.firstName}
                        onChange={handleBillingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Last name *</label>
                      <input
                        required
                        name="lastName"
                        value={billingForm.lastName}
                        onChange={handleBillingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Country / Region *</label>
                      <select
                        required
                        name="country"
                        value={billingForm.country}
                        onChange={handleBillingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        <option value="">Select a country / region…</option>
                        {renderCountryOptions()}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Street address *</label>
                      <input
                        required
                        name="address1"
                        value={billingForm.address1}
                        onChange={handleBillingChange}
                        placeholder="House number and street name"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Apartment, suite, etc.</label>
                      <input
                        name="address2"
                        value={billingForm.address2}
                        onChange={handleBillingChange}
                        placeholder="Apartment, suite, unit, etc."
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Town / City *</label>
                      <input
                        required
                        name="city"
                        value={billingForm.city}
                        onChange={handleBillingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">State *</label>
                      <input
                        required
                        name="state"
                        value={billingForm.state}
                        onChange={handleBillingChange}
                        placeholder="Select an option…"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">PIN Code *</label>
                      <input
                        required
                        name="postcode"
                        value={billingForm.postcode}
                        onChange={handleBillingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Phone *</label>
                      <input
                        required
                        name="phone"
                        value={billingForm.phone}
                        onChange={handleBillingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Email address *</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={billingForm.email}
                        onChange={handleBillingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingBilling}
                        className="rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                      >
                        {savingBilling ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Shipping address</p>
                      <h2 className="text-2xl font-semibold">Delivery details</h2>
                    </div>
                  </div>
                  <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleShippingSubmit}>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">First name *</label>
                      <input
                        required
                        name="firstName"
                        value={shippingForm.firstName}
                        onChange={handleShippingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Last name *</label>
                      <input
                        required
                        name="lastName"
                        value={shippingForm.lastName}
                        onChange={handleShippingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Country / Region *</label>
                      <select
                        required
                        name="country"
                        value={shippingForm.country}
                        onChange={handleShippingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        <option value="">Select a country / region…</option>
                        {renderCountryOptions()}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Street address *</label>
                      <input
                        required
                        name="address1"
                        value={shippingForm.address1}
                        onChange={handleShippingChange}
                        placeholder="House number and street name"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Apartment, suite, etc.</label>
                      <input
                        name="address2"
                        value={shippingForm.address2}
                        onChange={handleShippingChange}
                        placeholder="Apartment, suite, unit, etc."
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Town / City *</label>
                      <input
                        required
                        name="city"
                        value={shippingForm.city}
                        onChange={handleShippingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">State *</label>
                      <input
                        required
                        name="state"
                        value={shippingForm.state}
                        onChange={handleShippingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">PIN Code *</label>
                      <input
                        required
                        name="postcode"
                        value={shippingForm.postcode}
                        onChange={handleShippingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Phone</label>
                      <input
                        name="phone"
                        value={shippingForm.phone}
                        onChange={handleShippingChange}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingShipping}
                        className="rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                      >
                        {savingShipping ? "Saving…" : "Save shipping"}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Orders</p>
                      <h2 className="text-2xl font-semibold">Recent activity</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                    >
                      Refresh
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                      No orders yet. Once you check out, they will appear here instantly.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order: any) => (
                        <article
                          key={order.databaseId}
                          className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Order #{order.orderNumber ?? order.databaseId}
                              </p>
                              <p className="text-xs text-slate-500">{formatDate(order.date)}</p>
                            </div>
                            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                              {order.status?.replace(/_/g, " ") ?? "Processing"}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Items</p>
                              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                {order.lineItems?.nodes?.map((line: any, index: number) => (
                                  <li key={`${order.databaseId}-${index}`}>
                                    {line.product?.node?.name ?? "Product"} · Qty {line.quantity ?? 1}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="text-sm text-slate-600">
                              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Totals</p>
                              <p className="mt-2 text-base font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: order.total ?? "—" }} />
                              <p className="text-xs text-slate-500">
                                Subtotal {order.subtotal ?? "—"} · Shipping {order.shippingTotal ?? "—"}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Concierge chat</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Need to tweak an order or schedule payment pickup? Ping the concierge desk anytime.
                    </p>
                    <a
                      href="mailto:hello@importedproducts.in?subject=Concierge%20support"
                      className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                    >
                      Email concierge
                    </a>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Update profile</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Keep your contact info and shipping preferences updated for faster dispatch.
                    </p>
                    <Link
                      href="mailto:hello@importedproducts.in?subject=Profile%20update"
                      className="mt-4 inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                    >
                      Request change
                    </Link>
                  </article>
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Download invoices</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Need official paperwork? Let us know which order numbers require an invoice PDF.
                    </p>
                    <Link
                      href="mailto:accounts@importedproducts.in?subject=Invoice%20request"
                      className="mt-4 inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                    >
                      Request invoices
                    </Link>
                  </article>
                </section>
              </div>
            )}
          </PageSection>
        )}
      </PageWrapper>
    </main>
  );
}
