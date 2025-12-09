import { NextResponse } from 'next/server';
import { SERVER_WP_GRAPHQL_ENDPOINT } from '@/lib/env.server';

const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(
      input: {
        provider: PASSWORD
        credentials: { username: $username, password: $password }
      }
    ) {
      authToken
      refreshToken
      user {
        id
        databaseId
        username
        email
        firstName
        lastName
        displayName: name
        roles {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
  }

  try {
    const response = await fetch(SERVER_WP_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: { username, password },
      }),
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      return NextResponse.json({ error: result.errors?.[0]?.message || 'Login failed' }, { status: 401 });
    }

    const payload = result.data.login;
    const user = payload?.user
      ? {
          ...payload.user,
          roles: Array.isArray(payload.user.roles?.nodes)
            ? payload.user.roles.nodes.map((node: any) => node?.name).filter(Boolean)
            : [],
        }
      : null;

    return NextResponse.json({ data: { ...payload, user } });
  } catch (error) {
    console.error('Login API error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
