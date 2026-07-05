import { runTranslationPipeline } from "@/lib/translator/translationProviders";
import type { TranslatorRequest, TranslatorResponse } from "@/lib/translator/translatorSchemas";

export async function translateSentence(
  request: TranslatorRequest,
): Promise<TranslatorResponse> {
  return runTranslationPipeline(request);
}
