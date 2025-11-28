'use client';

import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';

export interface CartItem {
  id: string;
  productId: number;
  variationId?: number | null;
  name: string;
  priceHtml?: string | null;
  image?: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  hydrate: (items: CartItem[]) => void;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback<CartContextValue['addItem']>(
    ({ productId, variationId, name, priceHtml, image, quantity = 1 }) => {
      const id = `${productId}-${variationId ?? 'base'}`;
      setItems((prev) => {
        const existing = prev.find((item) => item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, { id, productId, variationId, name, priceHtml, image, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback<CartContextValue['removeItem']>((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const hydrate = useCallback<CartContextValue['hydrate']>((nextItems) => {
    setItems(nextItems);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      clear,
      hydrate,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [items, addItem, removeItem, clear, hydrate]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
