'use client';

import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';
import { WP_GRAPHQL_ENDPOINT } from './env';

let client: ApolloClient<NormalizedCacheObject> | null = null;

export function getApolloClient() {
  if (client) return client;

  client = new ApolloClient({
    link: new HttpLink({
      uri: WP_GRAPHQL_ENDPOINT,
    }),
    cache: new InMemoryCache({ addTypename: true }),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  });

  return client;
}
