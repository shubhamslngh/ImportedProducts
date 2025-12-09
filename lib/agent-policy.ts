import { SessionUser } from './types';

const normalizeList = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const allowedEmails = normalizeList(process.env.NEXT_PUBLIC_AGENT_ALLOWED_EMAILS);
const allowedDomains = normalizeList(process.env.NEXT_PUBLIC_AGENT_ALLOWED_DOMAINS);
const allowedRoles = normalizeList(process.env.NEXT_PUBLIC_AGENT_ALLOWED_ROLES);

export const getAllowedAgentEmails = () => allowedEmails;
export const getAllowedAgentDomains = () => allowedDomains;
export const getAllowedAgentRoles = () => allowedRoles;

export function isAgentEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (allowedEmails.includes(normalized)) {
    return true;
  }
  return allowedDomains.some((domain) => normalized.endsWith(domain));
}

export function isAgentRole(roles?: Array<string | null> | null) {
  if (!roles?.length || !allowedRoles.length) {
    return false;
  }
  const normalizedRoles = roles.filter(Boolean).map((role) => role!.toLowerCase());
  return allowedRoles.some((role) => normalizedRoles.includes(role));
}

export function isAgentUser(user: SessionUser | null | undefined) {
  if (!user) return false;
  if (isAgentEmail(user.email)) return true;
  if (user.username && isAgentEmail(user.username)) return true;
  if (isAgentRole(user.roles ?? null)) return true;
  return false;
}
