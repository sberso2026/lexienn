import { NextResponse } from "next/server";
import { z } from "zod";

const clientErrorSchema = z.object({
  message: z.string().max(500),
  stack: z.string().max(2000).optional(),
  route: z.string().max(200).optional(),
  userAgent: z.string().max(300).optional(),
  displayMode: z.string().max(50).optional(),
  serviceWorkerControlled: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = clientErrorSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    console.warn("[client-error]", {
      message: parsed.data.message,
      route: parsed.data.route,
      displayMode: parsed.data.displayMode,
      serviceWorkerControlled: parsed.data.serviceWorkerControlled,
      userAgent: parsed.data.userAgent,
      stack: parsed.data.stack,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
