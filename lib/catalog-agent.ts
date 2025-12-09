import { randomUUID } from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';
import pdf from 'pdf-parse';
import { appendDraftRecord } from './agent-drafts';
import { DraftRecord, ProductDraftItem } from './types';
import { generateDraftsFromCatalog } from './openai';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const MAX_ITEMS = 20;

export async function processCatalogUpload(args: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  kind: 'csv' | 'pdf';
}) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const storedFileName = `${Date.now()}-${sanitizeFileName(args.originalName)}`;
  const storedPath = path.join(UPLOAD_DIR, storedFileName);
  await fs.writeFile(storedPath, args.buffer);

  const limit = MAX_ITEMS;
  const aiPayload = await buildSourcePayload(args.kind, args.buffer, limit);
  const aiItems = await generateDraftsFromCatalog({
    sourceType: args.kind,
    limit,
    payload: aiPayload.payload,
    context: aiPayload.context,
  });

  const items: ProductDraftItem[] = aiItems.slice(0, limit).map((item) => ({
    id: randomUUID(),
    title: (item.title ?? '').toString().trim(),
    sku: item.sku?.toString().trim(),
    price: item.price ? item.price.toString() : undefined,
    currency: item.currency ?? undefined,
    category: item.category ?? undefined,
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : undefined,
    shortDescription: item.shortDescription ?? undefined,
    description: item.description ?? undefined,
    imageUrl: item.imageUrl ?? undefined,
    sourceReference: item.sourceReference ?? undefined,
    status: 'draft',
  }));

  const record: DraftRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    sourceFile: {
      originalName: args.originalName,
      storedPath: storedPath.replace(process.cwd(), ''),
      mimeType: args.mimeType,
      size: args.buffer.length,
    },
    notes: `AI parsed ${items.length} items from ${args.kind.toUpperCase()} upload.`,
    totalItems: items.length,
    items,
  };

  await appendDraftRecord(record);
  return record;
}

async function buildSourcePayload(
  kind: 'csv' | 'pdf',
  buffer: Buffer,
  limit: number
): Promise<{ payload: any; context?: string }> {
  if (kind === 'csv') {
    const rows = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    });
    return {
      payload: rows.slice(0, limit),
      context: 'Parsed from CSV headers.',
    };
  }

  const pdfData = await pdf(buffer);
  const text = pdfData.text.replace(/\s+/g, ' ').trim();
  return {
    payload: text.length > 20000 ? text.slice(0, 20000) : text,
    context: 'Extracted raw text from PDF catalogue. Each product paragraph typically includes title, SKU, price, and description.',
  };
}

const sanitizeFileName = (input: string) => input.replace(/[^a-zA-Z0-9._-]/g, '-');
