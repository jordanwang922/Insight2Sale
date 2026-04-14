const baseUrl = process.env.ARK_BASE_URL;
const apiKey = process.env.ARK_API_KEY;
const model = process.env.ARK_MODEL;
const requestTimeoutMs = Number(process.env.ARK_TIMEOUT_MS || 8000);

function getChatCompletionUrl() {
  if (!baseUrl) return "";
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions")
    ? trimmed
    : `${trimmed}/chat/completions`;
}

function stripJsonFence(content: string) {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/```\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? content).trim();
}

export function isDoubaoConfigured() {
  return Boolean(baseUrl && apiKey && model);
}

export async function generateDoubaoJson<T>(params: {
  system: string;
  user: string;
  temperature?: number;
  /** 默认 ARK_TIMEOUT_MS；长文本摘要等可加大 */
  timeoutMs?: number;
  fallback: T;
}) {
  if (!isDoubaoConfigured()) {
    return params.fallback;
  }

  const timeoutLimit = params.timeoutMs ?? requestTimeoutMs;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutLimit);
    const response = await fetch(getChatCompletionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: params.temperature ?? 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return params.fallback;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return params.fallback;
    }

    return JSON.parse(stripJsonFence(content)) as T;
  } catch {
    return params.fallback;
  }
}
