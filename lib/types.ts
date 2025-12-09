export interface SessionUser {
  username?: string | null;
  email?: string | null;
  id?: string | null;
  databaseId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  roles?: string[] | null;
}

export interface CatalogAsset {
  id: string;
  fileName: string;
  url: string;
}

export interface CatalogEntry {
  id: string;
  title: string;
  brand?: string;
  sku?: string;
  price?: number;
  currency?: string;
  category?: string;
  status?: string;
  submittedAt?: string;
  submittedBy?: {
    name?: string;
    email?: string;
    company?: string;
  };
  notes?: string;
  assets?: CatalogAsset[];
}

export interface ProductDraftItem {
  id: string;
  title: string;
  sku?: string;
  price?: string;
  currency?: string;
  category?: string;
  tags?: string[];
  shortDescription?: string;
  description?: string;
  imageUrl?: string;
  sourceReference?: string;
  status: 'draft' | 'needs_review';
}

export interface DraftRecord {
  id: string;
  createdAt: string;
  sourceFile: {
    originalName: string;
    storedPath: string;
    mimeType: string;
    size: number;
  };
  notes?: string;
  totalItems: number;
  items: ProductDraftItem[];
}
