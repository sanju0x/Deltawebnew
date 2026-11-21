/** @param {Request} request @param {number} maxBytes @returns {Promise<Response | Record<string, unknown>>} */
export async function readJsonObject(request, maxBytes) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return Response.json({ error: "Expected JSON" }, { status: 415 });
  }
  const tooLarge = () => Response.json({ error: "Request is too large" }, { status: 413 });
  if (Number(request.headers.get("content-length")) > maxBytes) return tooLarge();
  const invalid = () => Response.json({ error: "Invalid form data" }, { status: 400 });
  const reader = request.body?.getReader();
  if (!reader) return invalid();
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let size = 0;
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return tooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
    const data = JSON.parse(text + decoder.decode());
    if (!data || typeof data !== "object" || Array.isArray(data)) return invalid();
    return data;
  } catch {
    return invalid();
  } finally {
    reader.releaseLock();
  }
}
