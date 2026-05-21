const baseUrl = process.env.ARK_BASE_URL;
const apiKey = process.env.ARK_API_KEY;
const model = process.env.ARK_MODEL;
const ocrModel = process.env.ARK_OCR_MODEL || model;
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

function getImageDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
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

export async function generateDoubaoImageJson<T>(params: {
  system: string;
  user: string;
  imageBuffer: Buffer;
  mimeType?: string;
  temperature?: number;
  timeoutMs?: number;
  fallback: T;
}) {
  if (!baseUrl || !apiKey || !ocrModel) {
    return params.fallback;
  }

  const timeoutLimit = params.timeoutMs ?? requestTimeoutMs;
  const mimeType = params.mimeType?.trim() || "image/png";

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
        model: ocrModel,
        temperature: params.temperature ?? 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.system },
          {
            role: "user",
            content: [
              { type: "text", text: params.user },
              {
                type: "image_url",
                image_url: {
                  url: getImageDataUrl(params.imageBuffer, mimeType),
                },
              },
            ],
          },
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

export async function generateDoubaoImageText(params: {
  system?: string;
  user: string;
  imageBuffer: Buffer;
  mimeType?: string;
  temperature?: number;
  timeoutMs?: number;
  fallback: string;
}) {
  if (!baseUrl || !apiKey || !ocrModel) {
    return params.fallback;
  }

  const timeoutLimit = params.timeoutMs ?? requestTimeoutMs;
  const mimeType = params.mimeType?.trim() || "image/png";

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
        model: ocrModel,
        temperature: params.temperature ?? 0.2,
        messages: [
          ...(params.system ? [{ role: "system", content: params.system }] : []),
          {
            role: "user",
            content: [
              { type: "text", text: params.user },
              {
                type: "image_url",
                image_url: {
                  url: getImageDataUrl(params.imageBuffer, mimeType),
                },
              },
            ],
          },
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
    return content?.trim() || params.fallback;
  } catch {
    return params.fallback;
  }
}
