export function extractJsonFromAiText(text: string): unknown {
  const trimmed = text.trim();

  const tryParse = (value: string): unknown | null => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== null) return parsed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const parsed = tryParse(trimmed.slice(firstBrace, lastBrace + 1));
    if (parsed !== null) return parsed;
  }

  const direct = tryParse(trimmed);
  if (direct !== null) return direct;

  throw new SyntaxError("No valid JSON object found in AI response");
}
