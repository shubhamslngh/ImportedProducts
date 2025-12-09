import { NextRequest, NextResponse } from 'next/server';
import { assertAgentFromRequest, UnauthorizedError } from '@/lib/agent.server';
import { readDraftRecords } from '@/lib/agent-drafts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await assertAgentFromRequest(request);
    const records = await readDraftRecords();
    return NextResponse.json({ records });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Failed to read drafts', error);
    return NextResponse.json({ error: 'Unable to load drafts.' }, { status: 500 });
  }
}
