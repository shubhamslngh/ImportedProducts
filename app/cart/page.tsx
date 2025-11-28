"use client";

import { useEffect, useMemo, useState } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { PageWrapper } from '@/components/PageWrapper';
import { PageSection } from '@/components/PageSection';
import { LiquidLoader } from '@/components/LiquidLoader';
import { useCart } from '@/lib/cart-context';
import { GET_CART, REMOVE_CART_ITEMS, UPDATE_CART_ITEMS } from '@/lib/queries';
import { useSession } from '@/lib/session-context';
import { useSnackbar } from '@/components/SnackbarProvider';

export default function CartPage() {
  const { status: sessionStatus, authToken } = useSession();
  const shouldFetch = sessionStatus === 'authenticated' && Boolean(authToken);
  const { data, loading, error, refetch } = useQuery(GET_CART, {
    fetchPolicy: 'no-cache',
    skip: !shouldFetch,
    context: shouldFetch
      ? {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      : undefined,
  });
  const { hydrate } = useCart();
  const { showSnackbar } = useSnackbar();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [updateItems] = useMutation(UPDATE_CART_ITEMS);
  const [removeCartItems] = useMutation(REMOVE_CART_ITEMS);

  const remoteItems = useMemo(() => {
    const nodes = data?.cart?.contents?.nodes ?? [];
    return nodes.map((node: any) => {
      const productNode = node?.product?.node;
      const variationNode = node?.variation?.node;
      const productId = productNode?.databaseId ?? variationNode?.databaseId ?? 0;
      const variationId = variationNode?.databaseId ?? null;
      const image =
        variationNode?.image?.sourceUrl ?? productNode?.image?.sourceUrl ?? null;
      const name = variationNode?.name ?? productNode?.name ?? 'Cart item';
      const priceHtml = variationNode?.price ?? node?.subtotal ?? '';
      const quantity = node?.quantity ?? 1;
      const key = node?.key ?? `${productId}-${variationId ?? 'base'}`;
      return {
        id: key,
        key,
        productId,
        variationId,
        name,
        priceHtml,
        image,
        quantity,
      };
    });
  }, [data]);

  useEffect(() => {
    hydrate(remoteItems);
  }, [remoteItems, hydrate]);

  const cartSummary = data?.cart;
  const isEmpty = cartSummary?.isEmpty ?? remoteItems.length === 0;
  const requiringLogin = sessionStatus !== 'authenticated';
  const authContext = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : undefined;

  useEffect(() => {
    if (error) {
      showSnackbar('Unable to fetch cart. Please try again.', { variant: 'error' });
    }
  }, [error, showSnackbar]);

  const handleRemove = async (itemKey: string) => {
    if (!authToken) return;
    setPendingKey(itemKey);
    try {
      await removeCartItems({
        variables: { keys: [itemKey], all: false },
        context: authContext,
      });
      await refetch();
      showSnackbar('Item removed from cart.', { variant: 'info' });
    } catch (error) {
      console.error('Remove cart item failed', error);
      showSnackbar('Could not remove item. Please try again.', { variant: 'error' });
    } finally {
      setPendingKey(null);
    }
  };

  const handleQuantityChange = async (itemKey: string, nextQuantity: number) => {
    if (!authToken || nextQuantity < 1) {
      if (nextQuantity < 1) {
        await handleRemove(itemKey);
      }
      return;
    }
    setPendingKey(itemKey);
    try {
      await updateItems({
        variables: {
          items: [{ key: itemKey, quantity: nextQuantity }],
        },
        context: authContext,
      });
      await refetch();
      showSnackbar('Cart updated.', { variant: 'success' });
    } catch (error) {
      console.error('Update cart quantity failed', error);
      showSnackbar('Could not update quantity. Please try again.', { variant: 'error' });
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <main className="flex flex-col gap-8 py-6">
      <PageWrapper>
        <PageSection>
          {sessionStatus === 'loading' && <LiquidLoader message="Checking session…" />}
          {requiringLogin && sessionStatus !== 'loading' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-900">Please sign in to view your cart.</p>
              <p className="mt-1 text-sm">
                The WooCommerce cart is tied to your account session. Sign in to access saved items.
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
          {!requiringLogin && sessionStatus !== 'loading' && (
            <div className="space-y-2 text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Your cart</p>
              <h1 className="text-4xl font-bold">Ready for checkout</h1>
              <p className="text-sm text-slate-500">
                We load your WooCommerce cart directly from the storefront session. Review your items and continue to checkout to pick shipping and pay securely.
              </p>
            </div>
          )}
        </PageSection>
        {!requiringLogin && sessionStatus !== 'loading' && (
          <PageSection>
          {loading && <LiquidLoader message="Fetching cart…" />}
          {error && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700">
              <p className="font-semibold">Unable to fetch cart.</p>
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

          {!loading && !error && isEmpty && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              No items yet. Browse the drops and tap “Add to cart”.
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white"
                >
                  Back to products
                </Link>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {!loading && !error && !isEmpty && (
            <div className="space-y-6">
              <ul className="space-y-4">
                {remoteItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={120}
                        height={120}
                        className="h-24 w-24 rounded-2xl object-contain"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                        No image
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                      {item.variationId && (
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Variation #{item.variationId}
                        </p>
                      )}
                      {item.priceHtml && (
                        <p className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: item.priceHtml }} />
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.key, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-base text-slate-700 disabled:opacity-40"
                          disabled={pendingKey === item.key}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.key, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-base text-slate-700 disabled:opacity-40"
                          disabled={pendingKey === item.key}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.key)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-400 disabled:opacity-50"
                      disabled={pendingKey === item.key}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Totals
                    </p>
                    <p className="text-3xl font-bold text-slate-900" dangerouslySetInnerHTML={{ __html: cartSummary?.total ?? '' }} />
                    <p className="text-xs text-slate-500">
                      Subtotal: {cartSummary?.subtotal ?? '—'} · Shipping: {cartSummary?.shippingTotal ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="rounded-full border border-slate-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                    >
                      Refresh cart
                    </button>
                    <Link
                      href="/checkout"
                      className="rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                    >
                      Go to checkout
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageSection>
        )}
      </PageWrapper>
    </main>
  );
}
