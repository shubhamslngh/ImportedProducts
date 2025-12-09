const OPENAI_API_URL = process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

export interface DraftExtractionInput {
  sourceType: 'csv' | 'pdf';
  limit: number;
  payload: Record<string, unknown> | string;
  context?: string;
}

type AiDraftResponse = {
  items: Array<{
    title?: string;
    sku?: string;
    price?: string | number;
    currency?: string;
    category?: string;
    tags?: string[];
    shortDescription?: string;
    description?: string;
    imageUrl?: string;
    sourceReference?: string;
    status?: string;
  }>;
};

export async function generateDraftsFromCatalog(input: DraftExtractionInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }

  const systemMessage = [
    'You are an operations assistant that converts product catalog data into structured JSON for WooCommerce drafts.',
    'Return no more than the requested limit of products, prioritizing fully described items.',
    'For each product provide: title, sku, price (numbers only), currency (ISO code), category, tags array, shortDescription, description, imageUrl if present, and any sourceReference notes.',
    'Respond strictly as JSON with the shape { "items": [...] }.',
  ].join(' ');

  const userPayload =
    typeof input.payload === 'string'
      ? input.payload.slice(0, 15000)
      : JSON.stringify(input.payload).slice(0, 15000);

  const messages = [
    { role: 'system', content: systemMessage },
    {
      role: 'user',
      content: [
        `Source type: ${input.sourceType}`,
        `Max items: ${input.limit}`,
        input.context ? `Context: ${input.context}` : null,
        'Raw data:',
        userPayload,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI request failed: ${error}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  let parsed: AiDraftResponse;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('Unable to parse AI response.');
  }

  if (!Array.isArray(parsed.items)) {
    throw new Error('AI response missing items array.');
  }

  return parsed.items;
}
