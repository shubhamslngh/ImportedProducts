'use client';

import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';

const WORDPRESS_GRAPHQL_ENDPOINT = 'https://importedproducts.in/graphql';

let client: ApolloClient<NormalizedCacheObject> | null = null;

export function getApolloClient() {
  if (client) return client;

  client = new ApolloClient({
    link: new HttpLink({
      uri: WORDPRESS_GRAPHQL_ENDPOINT,
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
