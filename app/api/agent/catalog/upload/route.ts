import { NextRequest, NextResponse } from 'next/server';
import { assertAgentFromRequest, UnauthorizedError } from '@/lib/agent.server';
import { processCatalogUpload } from '@/lib/catalog-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await assertAgentFromRequest(request);
    const formData = await request.formData();
    const file = formData.get('file');
    const kindInput = (formData.get('kind') as string | null)?.toLowerCase();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Upload file is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = kindInput === 'pdf' || file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'csv';
    if (kind !== 'csv' && kind !== 'pdf') {
      return NextResponse.json({ error: 'Only CSV or PDF uploads are supported.' }, { status: 400 });
    }

    const record = await processCatalogUpload({
      buffer,
      originalName: file.name,
      mimeType: file.type || (kind === 'pdf' ? 'application/pdf' : 'text/csv'),
      kind,
    });

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Upload processing failed', error);
    return NextResponse.json(
      { error: (error as Error).message ?? 'Unable to process catalogue.' },
      { status: 500 }
    );
  }
}
