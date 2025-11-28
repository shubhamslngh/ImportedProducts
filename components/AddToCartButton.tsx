'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useCart } from '@/lib/cart-context';
import { ADD_TO_CART_MUTATION } from '@/lib/queries';
import { useSession } from '@/lib/session-context';
import { useSnackbar } from './SnackbarProvider';

interface AddToCartButtonProps {
  productId: number;
  variationId?: number | null;
  productName: string;
  priceHtml?: string | null;
  image?: string | null;
}

export function AddToCartButton({ productId, variationId, productName, priceHtml, image }: AddToCartButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { addItem } = useCart();
  const { authToken } = useSession();
  const { showSnackbar } = useSnackbar();
  const [addToCart] = useMutation(ADD_TO_CART_MUTATION);

  const handleAddToCart = async () => {
    setStatus('loading');
    setErrorMessage(null);
    if (!authToken) {
      setStatus('error');
      setErrorMessage('Please log in to add items to your cart.');
      showSnackbar('Log in to add items to your cart.', { variant: 'info' });
      return;
    }
    try {
      const normalizedVariationId =
        typeof variationId === 'number' && Number.isFinite(variationId) ? variationId : 0;

      await addToCart({
        variables: {
          productId,
          variationId: normalizedVariationId,
          quantity: 1,
        },
        fetchPolicy: 'no-cache',
        context: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      });
      addItem({ productId, variationId, name: productName, priceHtml, image });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
      showSnackbar(`${productName} added to cart.`, { variant: 'success' });
    } catch (error) {
      console.error(error);
      setStatus('error');
      const message = 'Could not add right now. Please try again.';
      setErrorMessage(message);
      showSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={status === 'loading'}
        onClick={handleAddToCart}
        className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Adding…' : 'Add to cart'}
      </button>
      {status === 'success' && (
        <p className="text-center text-sm text-emerald-600">Added to cart. View all items on the cart page.</p>
      )}
      {status === 'error' && (
        <p className="text-center text-sm text-rose-600">
          {errorMessage ?? 'Could not add right now. Please try again.'}
        </p>
      )}
    </div>
  );
}
