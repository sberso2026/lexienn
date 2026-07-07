/**
 * Safe transcript accumulation — avoids duplicate chunks and partial overwrites.
 */

export function normalizeTranscriptWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function mergeFinalTranscriptChunk(previous: string, chunk: string): string {
  const next = normalizeTranscriptWhitespace(chunk);
  if (!next) return previous;
  if (!previous) return next;
  if (previous === next) return previous;
  if (previous.endsWith(next)) return previous;
  if (next.startsWith(previous)) return next;
  if (previous.includes(next)) return previous;
  return normalizeTranscriptWhitespace(`${previous} ${next}`);
}

export function buildCapturedSpeechPreview(finalTranscript: string, interimTranscript: string): string {
  const finalPart = normalizeTranscriptWhitespace(finalTranscript);
  const interimPart = normalizeTranscriptWhitespace(interimTranscript);

  if (!finalPart) return interimPart;
  if (!interimPart) return finalPart;
  if (interimPart.startsWith(finalPart)) return interimPart;
  if (finalPart.includes(interimPart)) return finalPart;
  return normalizeTranscriptWhitespace(`${finalPart} ${interimPart}`);
}

export function chooseBestTranscript(
  browserTranscript: string,
  serverTranscript: string,
): { transcript: string; refinedFromServer: boolean } {
  const browser = normalizeTranscriptWhitespace(browserTranscript);
  const server = normalizeTranscriptWhitespace(serverTranscript);

  if (!server) return { transcript: browser, refinedFromServer: false };
  if (!browser) return { transcript: server, refinedFromServer: true };
  if (server.length >= browser.length * 0.8) {
    return { transcript: server, refinedFromServer: server !== browser };
  }
  return { transcript: browser.length > server.length ? browser : server, refinedFromServer: false };
}
