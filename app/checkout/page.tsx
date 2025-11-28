"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CHECKOUT_MUTATION, GET_ACCOUNT_OVERVIEW, GET_CART } from "@/lib/queries";
import { PageWrapper } from "@/components/PageWrapper";
import { PageSection } from "@/components/PageSection";
import { LiquidLoader } from "@/components/LiquidLoader";
import { useSession } from "@/lib/session-context";
import { useSnackbar } from "@/components/SnackbarProvider";

interface ShippingMethod {
  id: string;
  method_id?: string;
  instance_id?: string | number | null;
  rateId?: string | null;
  zoneName?: string | null;
  title?: string;
  cost?: string | number;
  settings?: Record<string, { value?: string } | string | number>;
  description?: string;
}

const parseCurrency = (input?: string | number | null) => {
  if (typeof input === "number") return input;
  if (!input) return 0;
  const cleaned = input.toString().replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
};

const resolveShippingCost = (method: ShippingMethod | null) => {
  if (!method) return 0;
  const settings = method.settings as Record<string, any> | undefined;
  const rawCost = method.cost ?? settings?.cost;
  if (rawCost && typeof rawCost === "object" && "value" in rawCost) {
    return rawCost.value ?? 0;
  }
  return rawCost ?? 0;
};

export default function CheckoutPage() {
  const { status: sessionStatus, authToken, user } = useSession();
  const { showSnackbar } = useSnackbar();
  const shouldFetch = sessionStatus === "authenticated" && Boolean(authToken);
  const customerId =
    typeof user?.databaseId === "number"
      ? user.databaseId
      : user?.databaseId
      ? Number(user.databaseId)
      : null;

  const { data, loading, error, refetch } = useQuery(GET_CART, {
    fetchPolicy: "no-cache",
    skip: !shouldFetch,
    context: shouldFetch
      ? {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      : undefined,
  });

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [loadingShippingMethods, setLoadingShippingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const currencyOptions = [
    { value: "INR", label: "₹ INR" },
    { value: "USD", label: "$ USD" },
    { value: "EUR", label: "€ EUR" },
  ];
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const currencyLocale = currency === "INR" ? "en-IN" : currency === "EUR" ? "de-DE" : "en-US";
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currencyLocale, {
        style: "currency",
        currency,
      }),
    [currency, currencyLocale]
  );
  const formatCurrency = useCallback(
    (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0),
    [currencyFormatter]
  );
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "test";
  const paypalOptions = useMemo(
    () => ({ clientId: paypalClientId, currency }),
    [paypalClientId, currency]
  );
  const [checkoutOrder, { loading: placingOrder }] = useMutation(CHECKOUT_MUTATION);
  const [shippingForm, setShippingForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  });
  const {
    data: accountData,
    loading: accountLoading,
    error: accountError,
  } = useQuery(GET_ACCOUNT_OVERVIEW, {
    skip: !shouldFetch || !customerId,
    variables: { customerId },
    fetchPolicy: "cache-first",
    context: shouldFetch
      ? {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      : undefined,
  });
  const customer = accountData?.customer ?? null;

  useEffect(() => {
    async function fetchShippingMethods() {
      setLoadingShippingMethods(true);
      try {
        setShippingError(null);
        const response = await fetch("/api/shipping/methods");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load shipping methods");
        }
        const methods = Array.isArray(payload?.methods) ? payload.methods : [];
        setShippingMethods(methods);
      } catch (err: any) {
        console.error(err);
        const message = err?.message || "Unable to load shipping methods";
        setShippingError(message);
        showSnackbar(message, { variant: "error" });
      } finally {
        setLoadingShippingMethods(false);
      }
    }
    fetchShippingMethods();
  }, [showSnackbar]);

  useEffect(() => {
    if (!selectedMethod && shippingMethods.length) {
      setSelectedMethod(shippingMethods[0]);
    }
  }, [shippingMethods, selectedMethod]);

  useEffect(() => {
    if (!customer) return;
    const source = customer.shipping ?? customer.billing ?? null;
    setShippingForm((prev) => ({
      firstName: source?.firstName ?? prev.firstName ?? "",
      lastName: source?.lastName ?? prev.lastName ?? "",
      phone: source?.phone ?? customer.billing?.phone ?? prev.phone ?? "",
      email: customer.email ?? prev.email ?? user?.email ?? "",
      address1: source?.address1 ?? prev.address1 ?? "",
      address2: source?.address2 ?? prev.address2 ?? "",
      city: source?.city ?? prev.city ?? "",
      state: source?.state ?? prev.state ?? "",
      postcode: source?.postcode ?? prev.postcode ?? "",
      country: source?.country ?? prev.country ?? "",
    }));
  }, [customer, user]);

  const cart = data?.cart;
  const cartItems = cart?.contents?.nodes ?? [];
  const cartSubtotal = parseCurrency(cart?.subtotal ?? cart?.total);
  const isCartEmpty = (cart?.isEmpty ?? false) || cartItems.length === 0;
  const shippingCost = parseCurrency(resolveShippingCost(selectedMethod));
  const orderTotalNumber = cartSubtotal + shippingCost;
  const orderTotal = orderTotalNumber.toFixed(2);
  const formattedCartSubtotal = useMemo(() => formatCurrency(cartSubtotal), [cartSubtotal, formatCurrency]);
  const formattedShippingCost = useMemo(() => formatCurrency(shippingCost), [shippingCost, formatCurrency]);
  const formattedOrderTotal = useMemo(() => formatCurrency(orderTotalNumber), [orderTotalNumber, formatCurrency]);
  const handleShippingChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayPalApprove = async (paypalData: any, actions: any) => {
    if (!authToken) {
      showSnackbar("Session expired. Please log in again.", { variant: "error" });
      return;
    }
    try {
      const capture = await actions.order?.capture?.();
      const transactionId = capture?.id ?? paypalData?.orderID ?? "";
      const metaData = [
        paypalData?.orderID ? { key: "_paypal_order_id", value: paypalData.orderID } : null,
        paypalData?.payerID ? { key: "_paypal_payer_id", value: paypalData.payerID } : null,
        selectedMethod?.title ? { key: "_selected_shipping_service", value: selectedMethod.title } : null,
        currency ? { key: "_checkout_currency", value: currency } : null,
        shippingForm.firstName || shippingForm.address1
          ? { key: "_shipping_details_form", value: JSON.stringify(shippingForm) }
          : null,
      ].filter(Boolean) as Array<{ key: string; value: string }>;

      await checkoutOrder({
        variables: {
          input: {
            clientMutationId: `checkout-${Date.now()}`,
            paymentMethod: "paypal",
            isPaid: true,
            transactionId,
            shippingMethod: selectedMethod?.rateId ? [selectedMethod.rateId] : [],
            metaData,
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      });

      showSnackbar("Payment captured and order placed. Concierge will confirm dispatch shortly.", {
        variant: "success",
        duration: 6000,
      });
      refetch();
    } catch (mutationError: any) {
      console.error(mutationError);
      showSnackbar(
        "Payment captured, but we could not finalize the order. Please contact concierge with your PayPal receipt.",
        { variant: "error", duration: 7000 }
      );
    }
  };

  if (sessionStatus === "loading") {
    return (
      <main className="flex flex-col gap-8 py-6">
        <PageWrapper>
          <PageSection>
            <LiquidLoader message="Checking session…" />
          </PageSection>
        </PageWrapper>
      </main>
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
      <main className="flex flex-col gap-8 py-6">
        <PageWrapper>
          <PageSection>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-900">Please log in to continue to checkout.</p>
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
          </PageSection>
        </PageWrapper>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-8 py-6">
      <PageWrapper>
        <PageSection>
          <div className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Checkout</p>
            <h1 className="text-4xl font-bold">Complete your concierge order</h1>
            <p className="text-sm text-slate-500">
              Choose a shipping service and authorize payment. Our concierge team will confirm dispatch right after.
            </p>
          </div>
        </PageSection>
        <PageSection>
          {loading && <LiquidLoader message="Loading cart…" />}
          {error && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700">
              <p className="font-semibold">Unable to load cart.</p>
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

          {!loading && !error && isCartEmpty && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              Your cart looks empty. Add products before starting checkout.
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Browse products
                </Link>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                >
                  Refresh cart
                </button>
              </div>
            </div>
          )}

          {!loading && !error && !isCartEmpty && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-6">
                <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Shipping details</p>
                      <h2 className="text-2xl font-semibold text-slate-900">Where should we deliver?</h2>
                      <p className="text-xs text-slate-500">
                        Update the contact and address that should accompany this concierge order.
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                    >
                      Manage in account
                    </Link>
                  </div>
                  {accountLoading && <p className="text-sm text-slate-500">Syncing saved details…</p>}
                  {accountError && (
                    <p className="text-sm text-rose-600">Unable to load saved shipping details. You can still enter them manually.</p>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">First name *</label>
                      <input
                        name="firstName"
                        value={shippingForm.firstName}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Last name *</label>
                      <input
                        name="lastName"
                        value={shippingForm.lastName}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Phone *</label>
                      <input
                        name="phone"
                        value={shippingForm.phone}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={shippingForm.email}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Street address *</label>
                      <input
                        name="address1"
                        value={shippingForm.address1}
                        onChange={handleShippingChange}
                        required
                        placeholder="House number and street name"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
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
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">City *</label>
                      <input
                        name="city"
                        value={shippingForm.city}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">State *</label>
                      <input
                        name="state"
                        value={shippingForm.state}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">PIN Code *</label>
                      <input
                        name="postcode"
                        value={shippingForm.postcode}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Country *</label>
                      <input
                        name="country"
                        value={shippingForm.country}
                        onChange={handleShippingChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Shipping methods</p>
                    <h2 className="text-2xl font-semibold text-slate-900">Choose your carrier</h2>
                  </div>
                  {loadingShippingMethods && !shippingError && (
                    <p className="text-sm text-slate-500">Fetching available shipping services…</p>
                  )}
                  {shippingError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                      {shippingError}
                    </div>
                  )}
                  {!shippingError && !shippingMethods.length && (
                    <p className="text-sm text-slate-500">No shipping options available right now. Please contact concierge.</p>
                  )}
                  {!!shippingMethods.length && (
                    <div className="space-y-3">
                      {shippingMethods.map((method) => {
                        const cost = parseCurrency(resolveShippingCost(method));
                        const isSelected = selectedMethod?.id === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition md:flex-row md:items-center md:justify-between ${
                              isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold">
                                {method.title ?? method.method_id ?? "Shipping option"}
                              </p>
                              {method.zoneName && (
                                <p className={`text-[0.65rem] uppercase tracking-[0.4em] ${isSelected ? "text-white/70" : "text-slate-400"}`}>
                                  {method.zoneName}
                                </p>
                              )}
                              {method.description && (
                                <p className={`text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                                  {method.description}
                                </p>
                              )}
                            </div>
                            <div className="text-sm font-semibold">{formatCurrency(cost)}</div>
                            <input
                              type="radio"
                              name="shipping"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => setSelectedMethod(method)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Order summary</p>
                    <h2 className="text-xl font-semibold text-slate-900">{cartItems.length} item(s)</h2>
                  </div>
                  <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Currency
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-700 focus:border-slate-900 focus:outline-none"
                    >
                      {currencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <ul className="space-y-3">
                  {cartItems.map((item: any) => (
                    <li key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.product?.node?.name ?? "Product"}</p>
                      {item.variation && (
                        <p className="text-xs text-slate-500">Variation #{item.variation.node?.databaseId}</p>
                      )}
                      <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Cart total</span>
                    {cart?.subtotal ? (
                      <span className="font-semibold" dangerouslySetInnerHTML={{ __html: cart.subtotal }} />
                    ) : (
                      <span className="font-semibold">{formattedCartSubtotal}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Shipping</span>
                    {cart?.shippingTotal ? (
                      <span className="font-semibold" dangerouslySetInnerHTML={{ __html: cart.shippingTotal }} />
                    ) : (
                      <span className="font-semibold">{formattedShippingCost}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-base font-bold text-slate-900">
                    <span>Amount due</span>
                    <span>{formattedOrderTotal}</span>
                  </div>
                </div>
                <div>
                  <PayPalScriptProvider options={paypalOptions}>
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      disabled={!selectedMethod || !cartItems.length || placingOrder}
                      forceReRender={[orderTotal, selectedMethod?.id ?? "", placingOrder, currency]}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              amount: {
                                currency_code: currency,
                                value: orderTotal,
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        await handlePayPalApprove(data, actions);
                      }}
                      onError={(paypalError) => {
                        console.error(paypalError);
                        showSnackbar("Unable to process PayPal payment.", { variant: "error" });
                      }}
                    />
                  </PayPalScriptProvider>
                  {placingOrder && (
                    <p className="mt-2 text-xs text-slate-500">Finalizing checkout…</p>
                  )}
                  {!selectedMethod && shippingMethods.length > 0 && (
                    <p className="mt-2 text-xs text-rose-500">Select a shipping option to enable payment.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </PageSection>
      </PageWrapper>
    </main>
  );
}
