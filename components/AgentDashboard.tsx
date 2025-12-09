"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from './PageWrapper';
import { PageSection } from './PageSection';
import { LiquidLoader } from './LiquidLoader';
import { useSession } from '@/lib/session-context';
import { useSnackbar } from './SnackbarProvider';
import { DraftRecord } from '@/lib/types';
import { isAgentEmail, isAgentRole, isAgentUser } from '@/lib/agent-policy';
import { WP_GRAPHQL_ENDPOINT } from '@/lib/env';

export function AgentDashboard() {
  const { status, user, authToken } = useSession();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const [draftRecords, setDraftRecords] = useState<DraftRecord[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const [viewerStatus, setViewerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerInfo, setViewerInfo] = useState<{ email?: string | null; username?: string | null; roles: string[] }>({
    roles: [],
  });

  const allowedByViewer =
    isAgentRole(viewerInfo.roles) ||
    isAgentEmail(viewerInfo.email ?? undefined) ||
    isAgentEmail(viewerInfo.username ?? undefined);
  const isAuthorized = allowedByViewer || isAgentUser(user);

  const fetchDraftRecords = useCallback(async () => {
    if (!authToken) return;
    setDraftsLoading(true);
    setDraftsError(null);
    try {
      const response = await fetch('/api/agent/catalog/drafts', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to load drafts.');
      }
      setDraftRecords(payload.records ?? []);
    } catch (error) {
      console.error(error);
      setDraftsError((error as Error).message);
    } finally {
      setDraftsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (status === 'authenticated' && authToken && isAuthorized) {
      fetchDraftRecords();
    }
  }, [status, authToken, isAuthorized, fetchDraftRecords]);

  useEffect(() => {
    if (!authToken || status !== 'authenticated') {
      return;
    }
    let active = true;
    const fetchViewer = async () => {
      setViewerStatus('loading');
      setViewerError(null);
      try {
        const response = await fetch(WP_GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            query: `
              query AgentViewer {
                viewer {
                  email
                  username
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
        const payload = await response.json();
        if (!response.ok || payload.errors) {
          throw new Error(payload.errors?.[0]?.message ?? 'Unable to verify account.');
        }
        const viewer = payload.data?.viewer ?? null;
        const roles = Array.isArray(viewer?.roles?.nodes)
          ? viewer.roles.nodes.map((node: any) => node?.name?.toLowerCase()).filter(Boolean)
          : [];
        if (!active) return;
        setViewerInfo({ email: viewer?.email, username: viewer?.username, roles });
        setViewerStatus('success');
      } catch (error) {
        if (!active) return;
        setViewerStatus('error');
        setViewerError((error as Error).message);
      }
    };
    fetchViewer();
    return () => {
      active = false;
    };
  }, [authToken, status]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authToken) {
      showSnackbar('You must be logged in.', { variant: 'error' });
      return;
    }
    if (!selectedFile) {
      setUploadStatus('error');
      setUploadMessage('Select a CSV or PDF file first.');
      return;
    }

    const kind = inferKind(selectedFile);
    if (!kind) {
      setUploadStatus('error');
      setUploadMessage('Only CSV and PDF files are supported.');
      return;
    }

    setUploadStatus('loading');
    setUploadMessage(null);

    try {
      const body = new FormData();
      body.append('file', selectedFile);
      body.append('kind', kind);

      const response = await fetch('/api/agent/catalog/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to process upload.');
      }
      setUploadStatus('success');
      setUploadMessage(
        `AI extracted ${payload.record?.items?.length ?? 0} drafts. Review them below.`
      );
      setSelectedFile(null);
      setDraftRecords((prev) => [payload.record, ...prev]);
      showSnackbar('Catalogue processed. Drafts ready for review.', { variant: 'success' });
    } catch (error) {
      console.error(error);
      const message = (error as Error).message;
      setUploadStatus('error');
      setUploadMessage(message);
      showSnackbar(message, { variant: 'error' });
    }
  };

  if (status === 'loading') {
    return (
      <main className="py-10">
        <LiquidLoader message="Preparing agent console…" />
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <main className="flex flex-col gap-8 py-10">
        <PageWrapper>
          <PageSection>
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
              <h1 className="text-3xl font-bold">Agent console</h1>
              <p className="mt-2 text-slate-600">Sign in with your concierge credentials to access this workspace.</p>
              <button
                type="button"
                onClick={() => router.push('/login?next=/agent')}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white"
              >
                Go to login
              </button>
            </div>
          </PageSection>
        </PageWrapper>
      </main>
    );
  }

  if (status === 'authenticated' && viewerStatus === 'loading') {
    return (
      <main className="py-10">
        <LiquidLoader message="Checking agent permissions…" />
      </main>
    );
  }

  if (viewerStatus === 'error' && !isAuthorized) {
    return (
      <main className="flex flex-col gap-8 py-10">
        <PageWrapper>
          <PageSection>
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-lg">
              <h1 className="text-3xl font-bold text-rose-900">Unable to verify access</h1>
              <p className="mt-2 text-rose-700">{viewerError ?? 'Contact support to request agent access.'}</p>
            </div>
          </PageSection>
        </PageWrapper>
      </main>
    );
  }

  if (!isAuthorized && viewerStatus === 'success') {
    return (
      <main className="flex flex-col gap-8 py-10">
        <PageWrapper>
          <PageSection>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center shadow-lg">
              <h1 className="text-3xl font-bold text-amber-900">Access restricted</h1>
              <p className="mt-2 text-amber-800">
                Your account is authenticated but does not have agent permissions. Please contact the operations team.
              </p>
            </div>
          </PageSection>
        </PageWrapper>
      </main>
    );
  }

  if (!authToken) {
    return (
      <main className="py-10">
        <PageWrapper>
          <PageSection>
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-rose-700">
              Unable to read session token. Refresh the page and try again.
            </div>
          </PageSection>
        </PageWrapper>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-10 py-8">
      <PageWrapper>
        <PageSection>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Concierge toolkit</p>
            <h1 className="text-4xl font-bold">Agent console</h1>
            <p className="text-sm text-slate-600">
              Upload a CSV or PDF catalogue (max 20 products) and let the AI pre-format WooCommerce drafts for review.
            </p>
          </div>
        </PageSection>
        <PageSection>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-semibold">1. Upload catalogue</h2>
            <p className="text-sm text-slate-500">
              Supported formats: CSV or PDF. We process the first 20 products and store the file locally for auditing.
            </p>
            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              <input
                type="file"
                accept=".csv,application/pdf"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:uppercase file:tracking-[0.3em] file:text-white"
              />
              <button
                type="submit"
                disabled={uploadStatus === 'loading'}
                className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {uploadStatus === 'loading' ? 'Processing…' : 'Generate drafts'}
              </button>
              {uploadMessage && (
                <p
                  className={`text-center text-sm ${
                    uploadStatus === 'success' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {uploadMessage}
                </p>
              )}
            </form>
          </section>
        </PageSection>
        <PageSection>
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-semibold">2. Review AI drafts</h2>
                <p className="text-sm text-slate-500">
                  Each upload stores up to 20 product drafts locally. Inspect the details before pushing to WordPress.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchDraftRecords}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 hover:border-slate-400"
              >
                Refresh
              </button>
            </div>
            {draftsLoading && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6">
                <LiquidLoader message="Loading drafts…" />
              </div>
            )}
            {draftsError && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{draftsError}</p>
            )}
            {!draftsLoading && !draftsError && draftRecords.length === 0 && (
              <p className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No catalogues processed yet. Upload a CSV or PDF to get started.
              </p>
            )}
            {!draftsLoading &&
              draftRecords.map((record) => (
                <article
                  key={record.id}
                  className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Upload</p>
                      <p className="text-lg font-semibold text-slate-900">{record.sourceFile.originalName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(record.createdAt).toLocaleString()} · {record.items.length} drafts
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                      Stored locally
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {record.items.map((item) => (
                      <div key={item.id} className="space-y-2 rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.title || 'Untitled product'}</p>
                            {item.sku && <p className="text-xs uppercase tracking-[0.3em] text-slate-400">SKU: {item.sku}</p>}
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">
                            {item.status === 'needs_review' ? 'Needs review' : 'Draft'}
                          </span>
                        </div>
                        {item.price && (
                          <p className="text-base font-semibold text-slate-900">
                            {item.currency ?? ''} {item.price}
                          </p>
                        )}
                        {item.shortDescription && (
                          <p className="text-sm text-slate-600">{item.shortDescription}</p>
                        )}
                        {item.description && (
                          <details className="text-sm text-slate-600">
                            <summary className="cursor-pointer text-xs font-semibold text-slate-500">Full description</summary>
                            <p className="mt-1 whitespace-pre-line text-slate-600">{item.description}</p>
                          </details>
                        )}
                        <div className="text-xs text-slate-500">
                          {item.category && <p>Category: {item.category}</p>}
                          {item.tags && item.tags.length > 0 && <p>Tags: {item.tags.join(', ')}</p>}
                          {item.imageUrl && (
                            <p className="truncate">
                              Image: <span className="text-slate-900">{item.imageUrl}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
          </section>
        </PageSection>
      </PageWrapper>
    </main>
  );
}

const inferKind = (file: File) => {
  const name = file.name?.toLowerCase() ?? '';
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'text/csv' || name.endsWith('.csv')) return 'csv';
  return null;
};
