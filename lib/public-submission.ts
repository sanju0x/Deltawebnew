import { readJsonObject } from "./request-json.js";
import { isIP } from "node:net";

export function visitorAddress(headers: Headers) {
  // Only trust a header that the deployment's reverse proxy overwrites.
  const name = process.env.TRUSTED_CLIENT_IP_HEADER || (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : "");
  const address = name && headers.get(name)?.trim();
  return address && isIP(address) ? address : "";
}

export function submissionLimit(perClient: number, totalLimit: number, cooldownMs = 0) {
  const clients = new Map<string, { count: number; nextAllowed: number }>();
  let reset = 0;
  let total = 0;
  return (headers: Headers, now = Date.now()) => {
    if (now >= reset) {
      clients.clear();
      total = 0;
      reset = now + 60_000;
    }
    const address = visitorAddress(headers);
    const client = clients.get(address);
    const count = client?.count || 0;
    if (client && now < client.nextAllowed) {
      return Response.json({ success: false, reason: "cooldown" }, {
        status: 429, headers: { "Retry-After": String(Math.ceil((client.nextAllowed - now) / 1000)) },
      });
    }
    if (total >= totalLimit || (address && count >= perClient)) {
      return Response.json({ error: "Too many requests. Please try again shortly." }, {
        status: 429, headers: { "Retry-After": String(Math.ceil((reset - now) / 1000)) },
      });
    }
    total++;
    if (address) clients.set(address, { count: count + 1, nextAllowed: now + cooldownMs });
  };
}

export async function readSubmission(request: Request, limit: ReturnType<typeof submissionLimit>, maxBytes: number) {
  if (request.headers.get("origin") !== new URL(process.env.WEBSITE_URL || request.url).origin) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const limited = limit(request.headers);
  if (limited) return limited;
  const data = await readJsonObject(request, maxBytes);
  if (data instanceof Response) return data;
  if (Object.values(data).some(value => typeof value !== "string")) {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }
  return data as Record<string, string>;
}
