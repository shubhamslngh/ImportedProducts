import { NextRequest } from 'next/server';
import { SERVER_WP_GRAPHQL_ENDPOINT } from './env.server';
import {
  getAllowedAgentDomains,
  getAllowedAgentEmails,
  getAllowedAgentRoles,
  isAgentEmail,
  isAgentRole,
} from './agent-policy';

interface ViewerResult {
  data?: {
    viewer?: {
      email?: string | null;
      username?: string | null;
      name?: string | null;
      databaseId?: number | null;
      roles?: {
        nodes?: Array<{ name?: string | null } | null> | null;
      } | null;
    };
  };
  errors?: Array<{ message?: string }>;
}

export async function assertAgentFromRequest(request: NextRequest | Request) {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing Authorization header');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Empty token');
  }

  const viewer = await fetchViewer(token);
  const email = viewer?.email ?? viewer?.username;

  if (!isAgentEmail(email) && !isAgentRole(viewer?.roles ?? null)) {
    throw new UnauthorizedError('User not allowed in agent workspace');
  }

  return { token, viewer };
}

async function fetchViewer(token: string) {
  const response = await fetch(SERVER_WP_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query ViewerInfo {
          viewer {
            email
            username
            databaseId
            name
            roles {
              nodes {
                name
              }
            }
          }
        }
      `,
    }),
  });

  const payload = (await response.json()) as ViewerResult;
  if (!response.ok) {
    throw new UnauthorizedError(payload.errors?.[0]?.message || 'Unable to verify viewer');
  }
  const viewer = payload.data?.viewer;
  if (!viewer) return null;
  const roles = Array.isArray(viewer.roles?.nodes)
    ? viewer.roles.nodes.map((node) => node?.name?.toLowerCase()).filter(Boolean) as string[]
    : null;
  return {
    ...viewer,
    roles,
  };
}

export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export function agentPolicyDebug() {
  return {
    allowedEmails: getAllowedAgentEmails(),
    allowedDomains: getAllowedAgentDomains(),
    allowedRoles: getAllowedAgentRoles(),
  };
}
