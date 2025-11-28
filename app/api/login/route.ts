import { NextResponse } from 'next/server';

const WP_GRAPHQL_ENDPOINT = 'https://importedproducts.in/graphql';

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
    const response = await fetch(WP_GRAPHQL_ENDPOINT, {
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

    return NextResponse.json({ data: result.data.login });
  } catch (error) {
    console.error('Login API error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
