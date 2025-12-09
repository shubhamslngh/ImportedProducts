## Agent Operations Overview

This document outlines the concierge agent workspace and the AI-assisted ingestion workflow.

### Goals

1. Restrict `/agent` to vetted operator accounts (allow-listed emails, domains, or WordPress roles).
2. Allow agents to upload a CSV or PDF catalogue (max 20 products per upload).
3. Use OpenAI to normalize each item into a WooCommerce-ready draft and store everything locally for review.
4. Keep privileged work behind `/api/agent/*`, where every request re-validates the WordPress token server-side.

### Architecture

- **Client guard** – `AgentDashboard` still uses the session context plus an on-page WPGraphQL viewer check so unauthorized accounts see an access notice before any upload UI renders.
- **Server validation** – every `/api/agent/*` route calls `assertAgentFromRequest`, which pings WPGraphQL with the provided Bearer token and validates the allow-list.
- **Local storage** – uploads are written to `data/uploads/*` and the resulting drafts live in `data/agent-drafts.json` for easy auditing.
- **AI parsing** – `lib/catalog-agent.ts` orchestrates CSV parsing (`csv-parse`), PDF text extraction (`pdf-parse`), and the OpenAI prompt defined in `lib/openai.ts`. We cap each upload at 20 records before hitting the API.
- **Draft review** – the dashboard fetches `/api/agent/catalog/drafts`, surfaces every AI-generated product, and lets operators copy/verify the content before we add publishing actions.

### Environment variables

| Key | Purpose |
| --- | --- |
| `NEXT_PUBLIC_AGENT_ALLOWED_EMAILS` | Comma‑separated list of addresses allowed in the dashboard. |
| `NEXT_PUBLIC_AGENT_ALLOWED_DOMAINS` | Optional domain allow‑list (e.g. `@ops.company`). |
| `NEXT_PUBLIC_AGENT_ALLOWED_ROLES` | Optional list of WordPress role slugs that unlock the agent view (e.g. `agent,shop_manager`). |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI credentials (defaults to `gpt-4o-mini`). |

### Future enhancements

- Swap local JSON with durable storage (S3/Supabase) and add retention policies.
- Stream AI output directly into WooCommerce drafts once the review controls are ready.
- Reintroduce media search/upload + publishing batches once the ingestion flow is validated with 20-item uploads.
