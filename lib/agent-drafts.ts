import { promises as fs } from 'fs';
import path from 'path';
import { DraftRecord } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DRAFT_FILE = path.join(DATA_DIR, 'agent-drafts.json');

async function ensureDraftFile() {
  try {
    await fs.access(DRAFT_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DRAFT_FILE, '[]', 'utf-8');
  }
}

export async function readDraftRecords(): Promise<DraftRecord[]> {
  await ensureDraftFile();
  const raw = await fs.readFile(DRAFT_FILE, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn('Failed to parse draft storage. Reinitializing.', error);
    await fs.writeFile(DRAFT_FILE, '[]', 'utf-8');
    return [];
  }
}

export async function appendDraftRecord(record: DraftRecord) {
  const records = await readDraftRecords();
  records.unshift(record);
  await fs.writeFile(DRAFT_FILE, JSON.stringify(records, null, 2), 'utf-8');
}
