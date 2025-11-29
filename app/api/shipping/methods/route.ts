import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  SERVER_WC_API_BASE,
  SERVER_WC_CONSUMER_KEY,
  SERVER_WC_CONSUMER_SECRET,
  SERVER_WC_SHIPPING_ENDPOINT,
} from '@/lib/env.server';


class WooRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const buildRateId = (method: any) => {
  if (typeof method?.id === 'string' && method.id.includes(':')) {
    return method.id;
  }
  const instanceId = method?.instance_id ?? method?.instanceId ?? method?.id;
  if (method?.method_id && typeof instanceId !== 'undefined') {
    return `${method.method_id}:${instanceId}`;
  }
  return method?.id?.toString() ?? method?.method_id ?? null;
};

const normalizeMethod = (method: any, zone?: any) => {
  const instanceId = method?.instance_id ?? method?.instanceId ?? method?.id ?? null;
  const costSetting =
    method?.settings?.cost?.value ??
    method?.settings?.cost?.default ??
    method?.settings?.cost ??
    method?.cost ??
    '0';

  return {
    id: String(method?.id ?? buildRateId(method) ?? crypto.randomUUID()),
    method_id: method?.method_id ?? null,
    instance_id: instanceId,
    title: method?.title ?? method?.method_title ?? method?.settings?.title?.value ?? method?.method_id ?? 'Shipping option',
    description: method?.description ?? method?.method_description ?? '',
    cost: costSetting,
    settings: method?.settings ?? {},
    rateId: buildRateId(method),
    zoneId: zone?.id ?? null,
    zoneName: zone?.name ?? null,
  };
};
type NormalizedMethod = ReturnType<typeof normalizeMethod>;

async function requestJson(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers, cache: 'no-store' });
  if (!response.ok) {
    const body = await response.text();
    throw new WooRequestError(body || 'WooCommerce error', response.status);
  }
  return response.json();
}

async function loadRawMethods(headers: Record<string, string>) {
  const explicitEndpoint = SERVER_WC_SHIPPING_ENDPOINT;
  if (explicitEndpoint) {
    const payload = await requestJson(explicitEndpoint, headers);
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.methods)) {
      return payload.methods;
    }
    return [];
  }

  const apiBase = SERVER_WC_API_BASE;
  const zones = await requestJson(`${apiBase}/shipping/zones`, headers);
  if (!Array.isArray(zones) || zones.length === 0) {
    return requestJson(`${apiBase}/shipping_methods`, headers);
  }

  const methods: any[] = [];
  for (const zone of zones) {
    const zoneId = zone?.id ?? 0;
    try {
      const zoneMethods = await requestJson(`${apiBase}/shipping/zones/${zoneId}/methods?per_page=100`, headers);
      if (Array.isArray(zoneMethods)) {
        zoneMethods.forEach((method) => methods.push({ ...method, zone }));
      }
    } catch (zoneError) {
      if (zoneId !== 0) {
        throw zoneError;
      }
    }
  }
  return methods;
}

export async function GET() {
  const consumerKey = SERVER_WC_CONSUMER_KEY;
  const consumerSecret = SERVER_WC_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    return NextResponse.json(
      { error: 'WooCommerce credentials missing', details: 'Set NEXT_WC_CONSUMER_KEY and NEXT_WC_CONSUMER_SECRET.' },
      { status: 500 },
    );
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
  };

  try {
    const rawMethods = await loadRawMethods(headers);
    const normalized = rawMethods
      .map((method: any) => normalizeMethod(method, method?.zone))
      .filter((method: NormalizedMethod) => Boolean(method.rateId));
    return NextResponse.json({ methods: normalized });
  } catch (error: any) {
    if (error instanceof WooRequestError) {
      return NextResponse.json({ error: 'WooCommerce error', details: error.message }, { status: error.status });
    }
    console.error('Shipping methods fetch failed', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
