import { NextResponse } from "next/server";
import { dictionaryGenerateResponseSchema } from "@/lib/dictionary/apiSchemas";
import { generateDictionaryEntry } from "@/lib/dictionary/generateDictionaryEntry";
import { dictionaryQuerySchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = dictionaryQuerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid dictionary request.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateDictionaryEntry(parsed.data);
    const validated = dictionaryGenerateResponseSchema.safeParse(result);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dictionary generation produced an invalid response." },
        { status: 500 },
      );
    }
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json(
      { error: "Dictionary generation failed." },
      { status: 500 },
    );
  }
}
