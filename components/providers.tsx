'use client';

import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { getApolloClient } from '@/lib/apollo-client';
import { CartProvider } from '@/lib/cart-context';
import { SessionProvider } from '@/lib/session-context';
import { SnackbarProvider } from './SnackbarProvider';

export function Providers({ children }: { children: ReactNode }) {
  const client = getApolloClient();
  return (
    <ApolloProvider client={client}>
      <SessionProvider>
        <CartProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </CartProvider>
      </SessionProvider>
    </ApolloProvider>
  );
}
