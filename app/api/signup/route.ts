import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { SERVER_WP_GRAPHQL_ENDPOINT } from '@/lib/env.server';

const REGISTER_MUTATION = `
  mutation RegisterUser($username: String!, $email: String!, $password: String!) {
    registerUser(
      input: {
        username: $username
        email: $email
        password: $password
      }
    ) {
      user {
        id
        username
        email
      }
    }
  }
`;

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

const PASSWORD_RESET_MUTATION = `
  mutation SendPasswordReset($username: String!) {
    sendPasswordResetEmail(input: { username: $username }) {
      user {
        databaseId
      }
    }
  }
`;

const sanitizeBaseUsername = (email: string) => {
  const base = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return base && base.length >= 3 ? base : 'imported';
};

const generateUsername = (email: string) => `${sanitizeBaseUsername(email)}-${crypto.randomBytes(2).toString('hex')}`;
const generatePassword = () => crypto.randomBytes(12).toString('base64url');

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const username = generateUsername(email);
  const password = generatePassword();

  try {
    const registerResponse = await fetch(SERVER_WP_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: REGISTER_MUTATION,
        variables: { username, email, password },
      }),
    });

    const registerResult = await registerResponse.json();

    if (!registerResponse.ok || registerResult.errors) {
      return NextResponse.json(
        { error: registerResult.errors?.[0]?.message || 'Unable to create account.' },
        { status: 400 },
      );
    }

    const loginResponse = await fetch(SERVER_WP_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: { username, password },
      }),
    });

    const loginResult = await loginResponse.json();

    if (!loginResponse.ok || loginResult.errors) {
      return NextResponse.json(
        { error: loginResult.errors?.[0]?.message || 'Account created but login failed.' },
        { status: 500 },
      );
    }

    // Fire-and-forget password reset email so the shopper can set their own password.
    fetch(SERVER_WP_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: PASSWORD_RESET_MUTATION,
        variables: { username: email },
      }),
    }).catch((error) => console.error('Password reset trigger failed', error));

    return NextResponse.json({ data: loginResult.data.login });
  } catch (error) {
    console.error('Signup API error', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
